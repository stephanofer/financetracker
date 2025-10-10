import { Hono } from "hono";

// Types
interface Category {
  id: number;
  name: string;
  type: "ingreso" | "gasto";
  color: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

interface Account {
  id: number;
  user_id: number;
  name: string;
  type: "efectivo" | "debito" | "credito" | "banco" | "ahorros" | "inversiones";
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TransactionInput {
  amount: number;
  description?: string;
  date: string;
  accountId: number;
  categoryId?: number;
  subcategoryId?: number;
  notes?: string;
  userId: number;
}

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", async (c) => {
  const stmt = c.env.DB.prepare("SELECT * FROM comments");
  const { results } = await stmt.all();

  console.log(results);
  return c.json(results);
});

app.get("/api/categories", async (c) => {
  try {
    const type = c.req.query("type"); // 'ingreso' o 'gasto'
    
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

// /**
//  * GET /api/categories/:id
//  * Obtiene una categoría específica por ID
//  */
// app.get("/api/categories/:id", async (c) => {
//   try {
//     const id = c.req.param("id");
    
//     const stmt = c.env.DB.prepare(
//       "SELECT * FROM categories WHERE id = ? AND is_active = 1"
//     );
//     const result = await stmt.bind(id).first<Category>();
    
//     if (!result) {
//       return c.json(
//         {
//           success: false,
//           error: "Categoría no encontrada",
//         },
//         404
//       );
//     }
    
//     return c.json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error al obtener categoría:", error);
//     return c.json(
//       {
//         success: false,
//         error: "Error al obtener la categoría",
//       },
//       500
//     );
//   }
// });

// ============================================
// SUBCATEGORIES ENDPOINTS
// ============================================

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

// /**
//  * GET /api/subcategories/:id
//  * Obtiene una subcategoría específica por ID
//  */
// app.get("/api/subcategories/:id", async (c) => {
//   try {
//     const id = c.req.param("id");
    
//     const stmt = c.env.DB.prepare(
//       "SELECT * FROM subcategories WHERE id = ? AND is_active = 1"
//     );
//     const result = await stmt.bind(id).first<Subcategory>();
    
//     if (!result) {
//       return c.json(
//         {
//           success: false,
//           error: "Subcategoría no encontrada",
//         },
//         404
//       );
//     }
    
//     return c.json({
//       success: true,
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error al obtener subcategoría:", error);
//     return c.json(
//       {
//         success: false,
//         error: "Error al obtener la subcategoría",
//       },
//       500
//     );
//   }
// });

// ============================================
// ACCOUNTS ENDPOINTS
// ============================================

/**
 * GET /api/accounts
 * Obtiene todas las cuentas de un usuario
 * Query params: userId (required): number
 */
app.get("/api/accounts", async (c) => {
  try {
    const userId = c.req.query("userId");
    
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
app.get("/api/accounts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.req.query("userId");
    
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
      "SELECT * FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1"
    );
    const result = await stmt.bind(id, userId).first<Account>();
    
    if (!result) {
      return c.json(
        {
          success: false,
          error: "Cuenta no encontrada",
        },
        404
      );
    }
    
    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error al obtener cuenta:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener la cuenta",
      },
      500
    );
  }
});

// ============================================
// TRANSACTIONS ENDPOINTS
// ============================================

/**
 * POST /api/transaction/income
 * Crea una nueva transacción de ingreso
 */
app.post("/api/transaction/income", async (c) => {
  const {
    amount,
    description,
    date,
    accountId,
    categoryId,
    subcategoryId,
    notes,
    userId,
  }: TransactionInput = await c.req.json();

  // Validación básica
  if (!amount || !accountId || !userId || !date) {
    return c.json(
      {
        success: false,
        error: "amount, accountId, userId y date son requeridos",
      },
      400
    );
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
        "ingreso",
        amount,
        categoryId || null,
        subcategoryId || null,
        accountId,
        description || null,
        notes || null,
        date
      )
      .run();

    return c.json({
      success: true,
      id: result.meta.last_row_id,
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

export default app;
