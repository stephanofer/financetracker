import { AppContext } from "../types";
import { Hono } from "hono";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  updateAccountBalance,
} from "../services/transactions.service";

const transactions = new Hono<AppContext>();

transactions.post("/transaction", async (c) => {
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

transactions.get("/expenses", async (c) => {
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

export default transactions;
