import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { setCookie, getCookie } from "hono/cookie";
import { Category, Account, Subcategory } from "@/react-app/dashboard/types";

// Tipos para las variables de contexto
type Variables = JwtVariables & {
  user: {
    id: number;
    username: string;
    email: string | null;
    full_name: string | null;
  };
};

type AppContext = {
  Bindings: Env;
  Variables: Variables;
};

const app = new Hono<AppContext>();

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

type DebtStatus = "activa" | "pagada" | "vencida";

type DebtRowWithAggregates = {
  id: number;
  user_id: number;
  name: string;
  creditor: string | null;
  original_amount: number;
  remaining_amount: number;
  interest_rate: number | null;
  start_date: string;
  due_date: string | null;
  status: DebtStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  total_paid: number | null;
  payments_count: number | null;
  last_payment_date: string | null;
};

type DebtPaymentRow = {
  id: number;
  debt_id: number;
  transaction_id: number;
  amount: number;
  payment_date: string;
  notes: string | null;
  created_at: string;
  transaction_description: string | null;
  transaction_notes: string | null;
  account_id: number | null;
  account_name: string | null;
};

type NormalizedDebt = ReturnType<typeof normalizeDebtRow>;

function normalizeDebtRow(row: DebtRowWithAggregates) {
  const originalAmount = Number(row.original_amount ?? 0);
  const remainingAmount = Number(row.remaining_amount ?? 0);
  const aggregatedPaid =
    row.total_paid !== null && row.total_paid !== undefined
      ? Number(row.total_paid)
      : originalAmount - remainingAmount;
  const paidAmount = Math.min(originalAmount, Math.max(0, aggregatedPaid));
  const pendingAmount = Math.max(0, originalAmount - paidAmount);
  const paidPercentage =
    originalAmount > 0 ? Math.min(100, (paidAmount / originalAmount) * 100) : 0;
  const remainingPercentage =
    originalAmount > 0
      ? Math.max(0, (pendingAmount / originalAmount) * 100)
      : 0;

  const now = new Date();
  const dueDate = row.due_date ? new Date(row.due_date) : null;
  const isOverdue =
    !!dueDate && remainingAmount > 0 && dueDate.getTime() < now.getTime();
  const daysUntilDue =
    dueDate && remainingAmount > 0
      ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : null;

  const computedStatus: DebtStatus =
    remainingAmount <= 0
      ? "pagada"
      : isOverdue
      ? "vencida"
      : row.status ?? "activa";

  return {
    id: row.id,
    name: row.name,
    creditor: row.creditor,
    originalAmount,
    remainingAmount,
    interestRate: row.interest_rate ? Number(row.interest_rate) : 0,
    startDate: row.start_date,
    dueDate: row.due_date,
    status: computedStatus,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totals: {
      totalPaid: paidAmount,
      pendingAmount,
      paidPercentage,
      remainingPercentage,
      paymentsCount: row.payments_count ? Number(row.payments_count) : 0,
      lastPaymentDate: row.last_payment_date,
    },
    flags: {
      isOverdue,
      isPaid: remainingAmount <= 0,
      daysUntilDue,
    },
  };
}

type DebtsSummary = {
  totalDebts: number;
  activeDebts: number;
  overdueDebts: number;
  paidDebts: number;
  totalOriginalAmount: number;
  totalRemainingAmount: number;
  totalPaidAmount: number;
  nextDueDebt: {
    id: number;
    name: string;
    dueDate: string;
    remainingAmount: number;
    daysUntilDue: number | null;
  } | null;
};

function buildDebtsSummary(debts: NormalizedDebt[]): DebtsSummary {
  const baseSummary: DebtsSummary = {
    totalDebts: debts.length,
    activeDebts: 0,
    overdueDebts: 0,
    paidDebts: 0,
    totalOriginalAmount: 0,
    totalRemainingAmount: 0,
    totalPaidAmount: 0,
    nextDueDebt: null,
  };

  for (const debt of debts) {
    baseSummary.totalOriginalAmount += debt.originalAmount;
    baseSummary.totalRemainingAmount += debt.remainingAmount;
    baseSummary.totalPaidAmount += debt.totals.totalPaid;

    if (debt.flags.isPaid) {
      baseSummary.paidDebts += 1;
    } else if (debt.flags.isOverdue) {
      baseSummary.overdueDebts += 1;
    } else {
      baseSummary.activeDebts += 1;
    }
  }

  const upcoming = debts
    .filter(
      (debt) =>
        !debt.flags.isPaid &&
        debt.dueDate !== null &&
        debt.flags.daysUntilDue !== null &&
        debt.flags.daysUntilDue >= 0
    )
    .sort((a, b) => {
      const dateA = new Date(a.dueDate ?? 0).getTime();
      const dateB = new Date(b.dueDate ?? 0).getTime();
      return dateA - dateB;
    });

  if (upcoming.length > 0) {
    baseSummary.nextDueDebt = {
      id: upcoming[0].id,
      name: upcoming[0].name,
      dueDate: upcoming[0].dueDate!,
      remainingAmount: upcoming[0].remainingAmount,
      daysUntilDue: upcoming[0].flags.daysUntilDue,
    };
  }

  return baseSummary;
}

async function getDebtsWithAggregates(
  db: D1Database,
  userId: number
): Promise<DebtRowWithAggregates[]> {
  const stmt = db.prepare(
    `SELECT 
       d.*,
       COALESCE(SUM(dp.amount), 0) AS total_paid,
       COUNT(dp.id) AS payments_count,
       MAX(dp.payment_date) AS last_payment_date
     FROM debts d
     LEFT JOIN debt_payments dp ON dp.debt_id = d.id
     WHERE d.user_id = ?
     GROUP BY d.id
     ORDER BY 
       CASE d.status WHEN 'activa' THEN 0 WHEN 'vencida' THEN 1 ELSE 2 END,
       d.due_date IS NULL,
       d.due_date`
  );

  const { results } = await stmt.bind(userId).all<DebtRowWithAggregates>();
  return results;
}

async function getDebtWithAggregates(
  db: D1Database,
  debtId: number,
  userId: number
): Promise<DebtRowWithAggregates | null> {
  const stmt = db.prepare(
    `SELECT 
       d.*,
       COALESCE(SUM(dp.amount), 0) AS total_paid,
       COUNT(dp.id) AS payments_count,
       MAX(dp.payment_date) AS last_payment_date
     FROM debts d
     LEFT JOIN debt_payments dp ON dp.debt_id = d.id
     WHERE d.id = ? AND d.user_id = ?
     GROUP BY d.id`
  );

  return stmt.bind(debtId, userId).first<DebtRowWithAggregates>();
}

async function getDebtPayments(
  db: D1Database,
  debtId: number
): Promise<DebtPaymentRow[]> {
  const stmt = db.prepare(
    `SELECT 
       dp.*,
       t.description AS transaction_description,
       t.notes AS transaction_notes,
       t.account_id,
       a.name AS account_name
     FROM debt_payments dp
     JOIN transactions t ON t.id = dp.transaction_id
     LEFT JOIN accounts a ON a.id = t.account_id
     WHERE dp.debt_id = ?
     ORDER BY dp.payment_date DESC, dp.created_at DESC`
  );

  const { results } = await stmt.bind(debtId).all<DebtPaymentRow>();
  return results;
}

function normalizeDebtPaymentRow(row: DebtPaymentRow, debtName: string) {
  return {
    id: row.id,
    debtId: row.debt_id,
    transactionId: row.transaction_id,
    amount: Number(row.amount ?? 0),
    paymentDate: row.payment_date,
    notes: row.notes || row.transaction_notes || null,
    createdAt: row.created_at,
    description:
      row.transaction_description || row.notes || `Pago a ${debtName}`,
    accountId: row.account_id,
    accountName: row.account_name,
  };
}

// Configuración JWT
const JWT_EXPIRATION = 90 * 24 * 60 * 60; // 90 días en segundos
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 días en segundos

// async function hashPassword(
//   password: string
// ): Promise<{ hash: string; salt: string }> {
//   const salt = crypto.getRandomValues(new Uint8Array(16));
//   const encoder = new TextEncoder();
//   const data = encoder.encode(password);

//   const key = await crypto.subtle.importKey(
//     "raw",
//     data,
//     { name: "PBKDF2" },
//     false,
//     ["deriveBits"]
//   );

//   const derivedBits = await crypto.subtle.deriveBits(
//     {
//       name: "PBKDF2",
//       salt: salt,
//       iterations: 100000,
//       hash: "SHA-256",
//     },
//     key,
//     256
//   );

//   const hash = Array.from(new Uint8Array(derivedBits))
//     .map((b) => b.toString(16).padStart(2, "0"))
//     .join("");
//   const saltBase64 = btoa(String.fromCharCode(...salt));

//   return { hash, salt: saltBase64 };
// }

async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
) {
  const salt = Uint8Array.from(atob(storedSalt), (c) => c.charCodeAt(0));

  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    "raw",
    data,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256
  );

  const hash = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hash === storedHash;
}

const authMiddleware = createMiddleware<AppContext>(async (c, next) => {
  try {
    const token = getCookie(c, "auth_token");

    if (!token) {
      return c.json(
        {
          success: false,
          error: "No autenticado",
          message: "Debes iniciar sesión para acceder a este recurso",
        },
        401
      );
    }

    const secret = await c.env.JWT_SECRET.get();
    const payload = await verify(token, secret);

    if (!payload || !payload.sub) {
      console.log("❌ authMiddleware: Payload inválido");
      return c.json(
        {
          success: false,
          error: "Token inválido",
        },
        401
      );
    }

    const userStmt = c.env.DB.prepare(
      "SELECT id, username, email, full_name FROM users WHERE id = ? AND is_active = 1"
    );
    const user = await userStmt.bind(payload.sub).first<{
      id: number;
      username: string;
      email: string | null;
      full_name: string | null;
    }>();

    if (!user) {
      return c.json(
        {
          success: false,
          error: "Usuario no encontrado o inactivo",
        },
        401
      );
    }

    c.set("user", {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
    });

    await next();
  } catch {
    return c.json(
      {
        success: false,
        error: "No autenticado",
        message: "Debes iniciar sesión para acceder a este recurso",
      },
      401
    );
  }
});

app.use("/api/*", async (c, next) => {
  const path = c.req.path;

  if (path === "/api/login" || path === "/api/logout") {
    return next();
  }

  return authMiddleware(c, next);
});

app.post("/api/login", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json(
        {
          success: false,
          error: "Username y password son requeridos",
        },
        400
      );
    }

    const userStmt = c.env.DB.prepare(
      "SELECT id, username, password_hash, salt, email, full_name, is_active FROM users WHERE username = ?"
    );

    const user = await userStmt.bind(username).first<{
      id: number;
      username: string;
      password_hash: string;
      salt: string;
      email: string | null;
      full_name: string | null;
      is_active: number;
    }>();

    if (!user) {
      return c.json(
        {
          success: false,
          error: "Credenciales inválidas",
        },
        401
      );
    }

    if (!user.is_active) {
      return c.json(
        {
          success: false,
          error: "Usuario inactivo. Contacta al administrador.",
        },
        403
      );
    }

    const isPasswordValid = await verifyPassword(
      password,
      user.password_hash,
      user.salt
    );

    if (!isPasswordValid) {
      return c.json(
        {
          success: false,
          error: "Credenciales inválidas",
        },
        401
      );
    }

    const updateLoginStmt = c.env.DB.prepare(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
    );

    await updateLoginStmt.bind(user.id).run();

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION,
      iat: Math.floor(Date.now() / 1000),
    };

    const secret = await c.env.JWT_SECRET.get();
    const token = await sign(payload, secret);

    setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: false, // false para desarrollo local
      sameSite: "Lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return c.json({
      success: true,
      message: "Login exitoso",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
        },
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return c.json(
      {
        success: false,
        error: "Error al iniciar sesión",
      },
      500
    );
  }
});

app.post("/api/logout", (c) => {
  setCookie(c, "auth_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 0,
    path: "/",
  });

  return c.json({
    success: true,
    message: "Logout exitoso",
  });
});

/**
 * GET /api/me
 * Obtiene información del usuario autenticado
 */
app.get("/api/me", authMiddleware, (c) => {
  const user = c.get("user");

  return c.json({
    success: true,
    data: user,
  });
});

/**
 * Actualiza el balance de una cuenta según el tipo de transacción
 * @param db - Instancia de la base de datos
 * @param accountId - ID de la cuenta a actualizar
 * @param amount - Monto de la transacción
 * @param type - Tipo de transacción ('income' o 'expense')
 */
async function updateAccountBalance(
  db: D1Database,
  accountId: number,
  amount: number,
  type: string
) {
  const operation = type === "income" ? "+" : "-";

  const stmt = db.prepare(
    `UPDATE accounts 
     SET balance = balance ${operation} ?, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  );

  await stmt.bind(amount, accountId).run();
}

/**
 * POST /api/transaction
 * Crea una nueva transacción (ingreso o gasto) y actualiza el balance de la cuenta
 */
app.post("/api/transaction", async (c) => {
  const body = await c.req.parseBody();

  const user = c.get("user");

  const amount = body["amount"] ? parseFloat(body["amount"] as string) : null;
  const categoryId = body["categoryId"]
    ? parseInt(body["categoryId"] as string)
    : null;
  const subcategoryId = body["subcategoryId"]
    ? parseInt(body["subcategoryId"] as string)
    : null;
  const accountId = body["accountId"]
    ? parseInt(body["accountId"] as string)
    : null;
  const description = body["description"] || null;
  const type = body["type"];
  const notes = body["notes"] || null;
  const userId = user.id;
  const date = body["date"] || new Date().toISOString();
  const file = body["file"] || null;

  console.log("=== POST /api/transaction ===");
  console.log("📊 Amount:", amount);
  console.log("🏦 Account ID:", accountId);
  console.log("📂 Category ID:", categoryId);
  console.log("📋 Subcategory ID:", subcategoryId);
  console.log("👤 User ID:", userId);
  console.log("🔖 Type:", type);
  console.log("📝 Description:", description);
  console.log("📄 Notes:", notes);
  console.log("📅 Date:", date);
  console.log("📎 Has File:", !!file);
  console.log("🗂️ File Type:", file instanceof File ? file.type : null);
  console.log("============================");

  if (!amount || !accountId || !userId || !type) {
    return c.json(
      {
        success: false,
        error: "amount, accountId, userId y type son requeridos",
      },
      400
    );
  }

  if (type !== "income" && type !== "expense") {
    return c.json(
      {
        success: false,
        error: "type debe ser 'income' o 'expense'",
      },
      400
    );
  }

  if (file && file instanceof File && !ALLOWED_FILE_TYPES.includes(file.type)) {
    return c.json(
      {
        error: "Tipo de archivo no permitido",
        message: "Solo se aceptan imágenes o PDF",
      },
      400
    );
  }

  if (file && file instanceof File && file.size > MAX_FILE_SIZE) {
    return c.json(
      {
        error: "Archivo muy grande",
        message: "El archivo debe pesar menos de 5MB",
      },
      400
    );
  }

  let r2Key: string | null = null;
  let r2Url: string | null = null;
  let uploadedFile: File | null = null;

  if (file && file instanceof File) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    r2Key = `uploads/${timestamp}-${randomString}.${fileExtension}`;

    await c.env.BUCKET.put(r2Key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: "user",
      },
    });

    r2Url = `https://cdnfintracker.stephanofer.com/${r2Key}`;
    uploadedFile = file;
  }

  try {
    const stmt = c.env.DB.prepare(
      `INSERT INTO transactions 
       (user_id, type, amount, category_id, subcategory_id, account_id, description, notes, transaction_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = await stmt
      .bind(
        userId,
        type,
        amount,
        categoryId || null,
        subcategoryId || null,
        accountId,
        description || null,
        notes || null,
        date
      )
      .run();

    const transactionId = result.meta.last_row_id;

    if (uploadedFile && r2Key) {
      const fileType = uploadedFile.type.startsWith("image/")
        ? "image"
        : uploadedFile.type === "application/pdf"
        ? "pdf"
        : "other";

      const attachmentStmt = c.env.DB.prepare(
        `INSERT INTO attachments 
         (transaction_id, file_name, original_file_name, file_size, mime_type, file_type, r2_key, r2_url, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      await attachmentStmt
        .bind(
          transactionId,
          r2Key.split("/").pop(), // nombre del archivo en R2
          uploadedFile.name, // nombre original
          uploadedFile.size,
          uploadedFile.type,
          fileType,
          r2Key,
          r2Url,
          description || null
        )
        .run();
    }

    // Actualizar el balance de la cuenta
    await updateAccountBalance(c.env.DB, accountId, amount, type as string);

    const getTransactionStmt = c.env.DB.prepare(
      `SELECT * FROM transactions WHERE id = ?`
    );
    const transaction = await getTransactionStmt.bind(transactionId).first();

    return c.json({
      success: true,
      data: {
        ...transaction,
      },
    });
  } catch (error) {
    console.error("Error al insertar transacción:", error);
    return c.json(
      {
        success: false,
        error: "Error al crear la transacción",
      },
      500
    );
  }
});

app.get("/api/categories", async (c) => {
  try {
    const type = c.req.query("type");

    let query = "SELECT * FROM categories WHERE is_active = 1";
    const params: string[] = [];

    if (type && (type === "ingreso" || type === "gasto")) {
      query += " AND type = ?";
      params.push(type);
    }

    query += " ORDER BY order_index ASC";

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all<Category>();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener las categorías",
      },
      500
    );
  }
});

/**
 * GET /api/subcategories
 * Obtiene todas las subcategorías, opcionalmente filtradas por categoría
 * Query params: categoryId (optional): number
 */
app.get("/api/subcategories", async (c) => {
  try {
    const categoryId = c.req.query("categoryId");

    let query = "SELECT * FROM subcategories WHERE is_active = 1";
    const params: string[] = [];

    if (categoryId) {
      query += " AND category_id = ?";
      params.push(categoryId);
    }

    query += " ORDER BY order_index ASC";

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all<Subcategory>();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener las subcategorías",
      },
      500
    );
  }
});

/**
 * GET /api/accounts
 * Obtiene todas las cuentas de un usuario
 * Query params: userId (required): number
 */
app.get("/api/accounts", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;

    // console.log("=== GET /api/accounts ===");
    // console.log("📊 User object:", JSON.stringify(user, null, 2));
    // console.log("🔑 User ID:", userId);
    // console.log("⏰ Timestamp:", new Date().toISOString());
    // console.log("=========================");

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "El parámetro userId es requerido",
        },
        400
      );
    }

    const stmt = c.env.DB.prepare(
      `SELECT * FROM accounts 
       WHERE user_id = ? AND is_active = 1 
       ORDER BY created_at DESC`
    );
    const { results } = await stmt.bind(userId).all<Account>();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener cuentas:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener las cuentas",
      },
      500
    );
  }
});

/**
 * GET /api/accounts/:id
 * Obtiene una cuenta específica por ID
 * Query params: userId (required): number - para validar permisos
 */
// app.get("/api/accounts/:id", async (c) => {
//   try {
//     const id = c.req.param("id");
//     const userId = c.req.query("userId");
//     console.log(userId);
//     console.log(id);

//     if (!userId) {
//       return c.json(
//         {
//           success: false,
//           error: "El parámetro userId es requerido",
//         },
//         400
//       );
//     }

//     const stmt = c.env.DB.prepare(
//       "SELECT * FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1"
//     );
//     const result = await stmt.bind(id, userId).first<Account>();

//     if (!result) {
//       return c.json(
//         {
//           success: false,
//           error: "Cuenta no encontrada",
//         },
//         404
//       );
//     }
//     console.log(result);

//     return c.json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error al obtener cuenta:", error);
//     return c.json(
//       {
//         success: false,
//         error: "Error al obtener la cuenta",
//       },
//       500
//     );
//   }
// });

/**
 * GET /api/accounts/balance/total
 * Obtiene el balance total de todas las cuentas activas de un usuario
 * Query params: userId (required): number
 */
app.get("/api/accounts/balance/total", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "El parámetro userId es requerido",
        },
        400
      );
    }

    const stmt = c.env.DB.prepare(
      `SELECT 
         SUM(balance) as total_balance,
         COUNT(*) as total_accounts
       FROM accounts 
       WHERE user_id = ? AND is_active = 1`
    );
    const result = await stmt.bind(userId).first<{
      total_balance: number | null;
      total_accounts: number;
    }>();

    return c.json({
      success: true,
      data: {
        total_balance: result?.total_balance || 0,
        total_accounts: result?.total_accounts || 0,
      },
    });
  } catch (error) {
    console.error("Error al obtener balance total:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener el balance total",
      },
      500
    );
  }
});

/**
 * GET /api/transactions/expenses
 * Obtiene todos los gastos de un usuario con información detallada
 * Query params:
 *   - limit (optional): number - cantidad de registros a devolver
 *   - offset (optional): number - para paginación
 *   - startDate (optional): string - fecha inicio (ISO format)
 *   - endDate (optional): string - fecha fin (ISO format)
 */
app.get("/api/transactions/expenses", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const limit = c.req.query("limit");
    const offset = c.req.query("offset") || "0";
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    console.log("=== GET /api/transactions/expenses ===");
    console.log("📊 Parámetros recibidos:");
    console.log("  👤 User ID:", userId);
    console.log("  📏 Limit:", limit || "sin límite");
    console.log("  ⏭️  Offset:", offset);
    console.log("  📅 Start Date:", startDate || "sin filtro");
    console.log("  📅 End Date:", endDate || "sin filtro");
    console.log("=====================================");

    let query = `
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        s.name as subcategory_name,
        a.name as account_name,
        a.type as account_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON t.subcategory_id = s.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ? AND t.type = 'expense'
    `;
    const params: (string | number)[] = [userId];

    if (startDate) {
      query += " AND t.transaction_date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND t.transaction_date <= ?";
      params.push(endDate);
    }

    query += " ORDER BY t.transaction_date DESC, t.created_at DESC";

    if (limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));
    }

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    // Obtener el total de gastos (sin límite)
    const totalStmt = c.env.DB.prepare(
      `SELECT 
         SUM(amount) as total_expenses,
         COUNT(*) as total_count
       FROM transactions 
       WHERE user_id = ? AND type = 'expense'
       ${startDate ? "AND transaction_date >= ?" : ""}
       ${endDate ? "AND transaction_date <= ?" : ""}`
    );

    const totalParams: string[] = [userId.toString()];
    if (startDate) totalParams.push(startDate);
    if (endDate) totalParams.push(endDate);

    const totalResult = await totalStmt.bind(...totalParams).first<{
      total_expenses: number | null;
      total_count: number;
    }>();

    return c.json({
      success: true,
      data: {
        results,
        total: {
          total_expenses: totalResult?.total_expenses || 0,
          total_count: totalResult?.total_count || 0,
        },
      },
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los gastos",
      },
      500
    );
  }
});

/**
 * GET /api/transactions/:id
 * Obtiene los detalles completos de una transacción específica con sus adjuntos
 */
app.get("/api/transactions/:id", async (c) => {
  try {
    const transactionId = c.req.param("id");

    // Obtener datos de la transacción con joins para category, subcategory y account
    const transactionStmt = c.env.DB.prepare(
      `SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.id = ?`
    );

    const transaction = await transactionStmt.bind(transactionId).first();

    if (!transaction) {
      return c.json(
        {
          success: false,
          error: "Transacción no encontrada",
        },
        404
      );
    }

    // Obtener los archivos adjuntos de esta transacción
    const attachmentsStmt = c.env.DB.prepare(
      `SELECT * FROM attachments WHERE transaction_id = ? ORDER BY uploaded_at DESC`
    );

    const { results: attachments } = await attachmentsStmt
      .bind(transactionId)
      .all();

    // Agregar attachments a la transacción
    const transactionWithAttachments = {
      ...transaction,
      attachments: attachments,
    };

    return c.json({
      success: true,
      data: transactionWithAttachments,
    });
  } catch (error) {
    console.error("Error al obtener detalles de la transacción:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los detalles de la transacción",
      },
      500
    );
  }
});

/**
 * GET /api/transactions/:id/attachments
 * Obtiene todos los archivos adjuntos de una transacción
 */
app.get("/api/transactions/:id/attachments", async (c) => {
  try {
    const transactionId = c.req.param("id");

    const stmt = c.env.DB.prepare(
      `SELECT * FROM attachments WHERE transaction_id = ? ORDER BY uploaded_at DESC`
    );

    const { results } = await stmt.bind(transactionId).all();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener archivos adjuntos:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los archivos adjuntos",
      },
      500
    );
  }
});

/**
 * GET /api/debts
 * Obtiene todas las deudas del usuario con métricas resumidas
 */
app.get("/api/debts", async (c) => {
  try {
    const user = c.get("user");
    const debtRows = await getDebtsWithAggregates(c.env.DB, user.id);
    const debts = debtRows.map((row) => normalizeDebtRow(row));

    return c.json({
      success: true,
      data: {
        summary: buildDebtsSummary(debts),
        debts,
      },
      count: debts.length,
    });
  } catch (error) {
    console.error("Error al obtener deudas:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener las deudas",
      },
      500
    );
  }
});

/**
 * GET /api/debts/:id
 * Obtiene el detalle de una deuda específica con su historial de pagos
 */
app.get("/api/debts/:id", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const debtIdParam = c.req.param("id");
    const debtId = Number.parseInt(debtIdParam, 10);

    if (Number.isNaN(debtId)) {
      return c.json(
        {
          success: false,
          error: "ID de deuda inválido",
        },
        400
      );
    }

    const debtRow = await getDebtWithAggregates(c.env.DB, debtId, userId);

    if (!debtRow) {
      return c.json(
        {
          success: false,
          error: "Deuda no encontrada",
        },
        404
      );
    }

    const debt = normalizeDebtRow(debtRow);
    const paymentRows = await getDebtPayments(c.env.DB, debtId);
    const payments = paymentRows.map((row) =>
      normalizeDebtPaymentRow(row, debt.name)
    );

    return c.json({
      success: true,
      data: {
        debt,
        payments,
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de deuda:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener la deuda",
      },
      500
    );
  }
});

/**
 * POST /api/debts
 * Crea una nueva deuda para el usuario autenticado
 */
app.post("/api/debts", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const body = await c.req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const creditor =
      typeof body.creditor === "string" && body.creditor.trim()
        ? body.creditor.trim()
        : null;
    const originalAmount = Number(body.originalAmount);
    let remainingAmount =
      body.remainingAmount !== undefined && body.remainingAmount !== null
        ? Number(body.remainingAmount)
        : originalAmount;
    let interestRate =
      body.interestRate !== undefined && body.interestRate !== null
        ? Number(body.interestRate)
        : 0;
    const startDate =
      typeof body.startDate === "string" ? body.startDate.trim() : "";
    const dueDate =
      typeof body.dueDate === "string" && body.dueDate.trim()
        ? body.dueDate.trim()
        : null;
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    if (!name) {
      return c.json(
        {
          success: false,
          error: "El nombre de la deuda es requerido",
        },
        400
      );
    }

    if (!Number.isFinite(originalAmount) || originalAmount <= 0) {
      return c.json(
        {
          success: false,
          error: "El monto original debe ser un número mayor a 0",
        },
        400
      );
    }

    if (!startDate) {
      return c.json(
        {
          success: false,
          error: "La fecha de inicio es requerida",
        },
        400
      );
    }

    const parsedStartDate = new Date(`${startDate}T00:00:00`);
    if (Number.isNaN(parsedStartDate.getTime())) {
      return c.json(
        {
          success: false,
          error: "La fecha de inicio no es válida",
        },
        400
      );
    }

    if (!Number.isFinite(remainingAmount) || remainingAmount < 0) {
      remainingAmount = originalAmount;
    }

    if (remainingAmount > originalAmount) {
      remainingAmount = originalAmount;
    }

    if (!Number.isFinite(interestRate) || interestRate < 0) {
      interestRate = 0;
    }

    let computedStatus: DebtStatus = remainingAmount <= 0 ? "pagada" : "activa";

    if (computedStatus !== "pagada" && dueDate) {
      const parsedDueDate = new Date(`${dueDate}T00:00:00`);
      if (!Number.isNaN(parsedDueDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDueDate.getTime() < today.getTime()) {
          computedStatus = "vencida";
        }
      }
    }

    const insertStmt = c.env.DB.prepare(
      `INSERT INTO debts 
       (user_id, name, creditor, original_amount, remaining_amount, interest_rate, start_date, due_date, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = await insertStmt
      .bind(
        userId,
        name,
        creditor,
        originalAmount,
        remainingAmount,
        interestRate,
        startDate,
        dueDate,
        computedStatus,
        notes
      )
      .run();

    const debtId = result.meta.last_row_id;

    const newDebtRow = await getDebtWithAggregates(c.env.DB, debtId, userId);

    if (!newDebtRow) {
      return c.json(
        {
          success: false,
          error: "No se pudo obtener la deuda creada",
        },
        500
      );
    }

    const debt = normalizeDebtRow(newDebtRow);

    return c.json(
      {
        success: true,
        data: {
          debt,
        },
      },
      201
    );
  } catch (error) {
    console.error("Error al crear deuda:", error);
    return c.json(
      {
        success: false,
        error: "Error al crear la deuda",
      },
      500
    );
  }
});

/**
 * POST /api/debts/:id/payments
 * Registra un pago para una deuda y actualiza el saldo pendiente
 */
app.post("/api/debts/:id/payments", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const debtIdParam = c.req.param("id");
    const debtId = Number.parseInt(debtIdParam, 10);

    if (Number.isNaN(debtId)) {
      return c.json(
        {
          success: false,
          error: "ID de deuda inválido",
        },
        400
      );
    }

    const body = await c.req.json();

    const amount = Number(body.amount);
    const accountId = Number.parseInt(body.accountId, 10);
    const rawPaymentDate =
      typeof body.paymentDate === "string" && body.paymentDate.trim()
        ? body.paymentDate.trim()
        : null;
    const description =
      typeof body.description === "string" && body.description.trim()
        ? body.description.trim()
        : "";
    const notes =
      typeof body.notes === "string" && body.notes.trim()
        ? body.notes.trim()
        : null;

    if (!Number.isFinite(amount) || amount <= 0) {
      return c.json(
        {
          success: false,
          error: "El monto del pago debe ser mayor a 0",
        },
        400
      );
    }

    if (!Number.isFinite(accountId)) {
      return c.json(
        {
          success: false,
          error: "La cuenta seleccionada no es válida",
        },
        400
      );
    }

    const debtRow = await getDebtWithAggregates(c.env.DB, debtId, userId);

    if (!debtRow) {
      return c.json(
        {
          success: false,
          error: "Deuda no encontrada",
        },
        404
      );
    }

    const debt = normalizeDebtRow(debtRow);

    if (debt.flags.isPaid) {
      return c.json(
        {
          success: false,
          error: "La deuda ya está pagada",
        },
        400
      );
    }

    const account = await c.env.DB.prepare(
      `SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1`
    )
      .bind(accountId, userId)
      .first();

    if (!account) {
      return c.json(
        {
          success: false,
          error: "La cuenta seleccionada no pertenece al usuario",
        },
        400
      );
    }

    const paymentDate = rawPaymentDate || new Date().toISOString().slice(0, 10);

    const parsedPaymentDate = new Date(`${paymentDate}T00:00:00`);
    if (Number.isNaN(parsedPaymentDate.getTime())) {
      return c.json(
        {
          success: false,
          error: "La fecha de pago no es válida",
        },
        400
      );
    }

    const amountToApply = Math.min(amount, debt.remainingAmount);

    if (amountToApply <= 0) {
      return c.json(
        {
          success: false,
          error: "El monto del pago supera el saldo pendiente",
        },
        400
      );
    }

    const finalDescription =
      description || `Pago ${debt.name} - ${paymentDate}`;

    await c.env.DB.prepare("BEGIN TRANSACTION").run();

    try {
      const insertTransactionStmt = c.env.DB.prepare(
        `INSERT INTO transactions 
         (user_id, type, amount, category_id, subcategory_id, account_id, description, notes, transaction_date, debt_id)
         VALUES (?, 'debt_payment', ?, NULL, NULL, ?, ?, ?, ?, ?)`
      );

      const transactionResult = await insertTransactionStmt
        .bind(
          userId,
          amountToApply,
          accountId,
          finalDescription,
          notes,
          paymentDate,
          debtId
        )
        .run();

      const transactionId = transactionResult.meta.last_row_id;

      const insertPaymentStmt = c.env.DB.prepare(
        `INSERT INTO debt_payments 
         (debt_id, transaction_id, amount, payment_date, notes)
         VALUES (?, ?, ?, ?, ?)`
      );

      await insertPaymentStmt
        .bind(debtId, transactionId, amountToApply, paymentDate, notes)
        .run();

      const remainingAfter = Math.max(0, debt.remainingAmount - amountToApply);

      let newStatus: DebtStatus = remainingAfter <= 0 ? "pagada" : "activa";

      if (newStatus === "activa" && debt.dueDate) {
        const dueDateObj = new Date(`${debt.dueDate}T00:00:00`);
        if (
          !Number.isNaN(dueDateObj.getTime()) &&
          dueDateObj.getTime() < parsedPaymentDate.getTime()
        ) {
          newStatus = "vencida";
        }
      }

      const updateDebtStmt = c.env.DB.prepare(
        `UPDATE debts 
         SET remaining_amount = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      );

      await updateDebtStmt.bind(remainingAfter, newStatus, debtId).run();

      await updateAccountBalance(c.env.DB, accountId, amountToApply, "expense");

      await c.env.DB.prepare("COMMIT").run();

      const updatedDebtRow = await getDebtWithAggregates(
        c.env.DB,
        debtId,
        userId
      );

      if (!updatedDebtRow) {
        return c.json(
          {
            success: false,
            error: "No se pudo obtener la deuda actualizada",
          },
          500
        );
      }

      const updatedDebt = normalizeDebtRow(updatedDebtRow);
      const paymentRows = await getDebtPayments(c.env.DB, debtId);
      const payments = paymentRows.map((row) =>
        normalizeDebtPaymentRow(row, updatedDebt.name)
      );

      return c.json({
        success: true,
        data: {
          debt: updatedDebt,
          payments,
          appliedAmount: amountToApply,
          overpaymentAmount:
            amount > amountToApply ? amount - amountToApply : 0,
        },
        message:
          amount > amountToApply
            ? "Pago registrado. El monto ingresado excedía el saldo pendiente y se ajustó automáticamente."
            : "Pago registrado correctamente.",
      });
    } catch (error) {
      await c.env.DB.prepare("ROLLBACK").run();
      console.error("Error en la transacción de pago de deuda:", error);
      return c.json(
        {
          success: false,
          error: "Error al registrar el pago de la deuda",
        },
        500
      );
    }
  } catch (error) {
    console.error("Error al procesar pago de deuda:", error);
    return c.json(
      {
        success: false,
        error: "Error al registrar el pago de la deuda",
      },
      500
    );
  }
});

/**
 * DELETE /api/attachments/:id
 * Elimina un archivo adjunto (tanto de la BD como de R2)
 */
app.delete("/api/attachments/:id", async (c) => {
  try {
    const attachmentId = c.req.param("id");

    // Obtener información del archivo antes de eliminarlo
    const getStmt = c.env.DB.prepare(
      `SELECT r2_key FROM attachments WHERE id = ?`
    );
    const attachment = await getStmt.bind(attachmentId).first();

    if (!attachment) {
      return c.json(
        {
          success: false,
          error: "Archivo adjunto no encontrado",
        },
        404
      );
    }

    // Eliminar de R2
    await c.env.BUCKET.delete(attachment.r2_key as string);

    // Eliminar de la base de datos
    const deleteStmt = c.env.DB.prepare(`DELETE FROM attachments WHERE id = ?`);
    await deleteStmt.bind(attachmentId).run();

    return c.json({
      success: true,
      message: "Archivo adjunto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar archivo adjunto:", error);
    return c.json(
      {
        success: false,
        error: "Error al eliminar el archivo adjunto",
      },
      500
    );
  }
});

/**
 * GET /api/attachments/:id/download
 * Genera una URL temporal para descargar un archivo adjunto
 */
app.get("/api/attachments/:id/download", async (c) => {
  try {
    const attachmentId = c.req.param("id");

    // Obtener información del archivo
    const stmt = c.env.DB.prepare(
      `SELECT r2_key, file_name, mime_type FROM attachments WHERE id = ?`
    );
    const attachment = await stmt.bind(attachmentId).first();

    if (!attachment) {
      return c.json(
        {
          success: false,
          error: "Archivo adjunto no encontrado",
        },
        404
      );
    }

    // Obtener el archivo de R2
    const object = await c.env.BUCKET.get(attachment.r2_key as string);

    if (!object) {
      return c.json(
        {
          success: false,
          error: "Archivo no encontrado en el almacenamiento",
        },
        404
      );
    }

    // Retornar el archivo con los headers apropiados
    return new Response(object.body, {
      headers: {
        "Content-Type": attachment.mime_type as string,
        "Content-Disposition": `attachment; filename="${attachment.file_name}"`,
      },
    });
  } catch (error) {
    console.error("Error al descargar archivo adjunto:", error);
    return c.json(
      {
        success: false,
        error: "Error al descargar el archivo adjunto",
      },
      500
    );
  }
});

export default app;
