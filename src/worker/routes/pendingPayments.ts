import { Hono } from "hono";
import { AppContext } from "../types";

const pendingPayments = new Hono<AppContext>();

/**
 * GET /api/pending-payments
 * Obtiene todos los pagos pendientes del usuario con estadísticas
 */
pendingPayments.get("/", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const status = c.req.query("status"); // pending, paid, cancelled, overdue
    const priority = c.req.query("priority"); // high, medium, low
    const limit = c.req.query("limit");
    const offset = c.req.query("offset") || "0";

    let query = `
      SELECT 
        pp.id,
        pp.name,
        pp.amount,
        pp.due_date,
        pp.priority,
        pp.status,
        pp.notes,
        pp.reminder_enabled,
        pp.debt_id,
        pp.loan_id,
        pp.transaction_id,
        pp.paid_date,
        pp.created_at,
        pp.updated_at,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type,
        a.icon as account_icon,
        a.color as account_color,
        d.name as debt_name,
        l.debtor_name as loan_debtor_name
      FROM pending_payments pp
      LEFT JOIN categories c ON pp.category_id = c.id
      LEFT JOIN subcategories sc ON pp.subcategory_id = sc.id
      LEFT JOIN accounts a ON pp.account_id = a.id
      LEFT JOIN debts d ON pp.debt_id = d.id
      LEFT JOIN loans l ON pp.loan_id = l.id
      WHERE pp.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    // Filtrar por estado
    if (status) {
      query += " AND pp.status = ?";
      params.push(status);
    }

    // Filtrar por prioridad
    if (priority) {
      query += " AND pp.priority = ?";
      params.push(priority);
    }

    query += " ORDER BY pp.due_date ASC, pp.priority DESC, pp.created_at DESC";

    if (limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));
    }

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    // Obtener estadísticas
    const summaryStmt = c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'pending' OR status = 'overdue' THEN amount ELSE 0 END) as total_pending_amount,
        SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue_amount,
        SUM(CASE WHEN priority = 'high' AND (status = 'pending' OR status = 'overdue') THEN 1 ELSE 0 END) as high_priority_pending
      FROM pending_payments
      WHERE user_id = ?
    `);

    const summary = await summaryStmt.bind(userId).first();

    return c.json({
      success: true,
      data: {
        summary: {
          total_count: Number(summary?.total_count || 0),
          pending_count: Number(summary?.pending_count || 0),
          overdue_count: Number(summary?.overdue_count || 0),
          paid_count: Number(summary?.paid_count || 0),
          cancelled_count: Number(summary?.cancelled_count || 0),
          total_pending_amount: Number(summary?.total_pending_amount || 0),
          total_overdue_amount: Number(summary?.total_overdue_amount || 0),
          high_priority_pending: Number(summary?.high_priority_pending || 0),
        },
        pending_payments: results,
      },
      count: results.length,
    });
  } catch (error) {
    console.error("[GET /] Error al obtener pagos pendientes:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los pagos pendientes",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

/**
 * POST /api/pending-payments
 * Crea un nuevo pago pendiente
 */
pendingPayments.post("/", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const body = await c.req.json();

    // Validación de campos requeridos
    if (!body.name || !body.amount) {
      return c.json(
        {
          success: false,
          error: "Los campos 'name' y 'amount' son requeridos",
        },
        400
      );
    }

    // Normalizar y validar datos
    const name = String(body.name).trim();
    const amount = Number(body.amount);

    if (name.length === 0) {
      return c.json(
        {
          success: false,
          error: "El nombre no puede estar vacío",
        },
        400
      );
    }

    if (isNaN(amount) || amount <= 0) {
      return c.json(
        {
          success: false,
          error: "El monto debe ser un número mayor a 0",
        },
        400
      );
    }

    // Validar prioridad
    const priority = body.priority || "medium";
    if (!["high", "medium", "low"].includes(priority)) {
      return c.json(
        {
          success: false,
          error: "La prioridad debe ser: high, medium o low",
        },
        400
      );
    }

    // Validar status
    const status = body.status || "pending";
    if (!["pending", "paid", "cancelled", "overdue"].includes(status)) {
      return c.json(
        {
          success: false,
          error: "El estado debe ser: pending, paid, cancelled u overdue",
        },
        400
      );
    }

    const due_date = body.due_date || null;
    const category_id = body.category_id ? Number(body.category_id) : null;
    const subcategory_id = body.subcategory_id ? Number(body.subcategory_id) : null;
    const account_id = body.account_id ? Number(body.account_id) : null;
    const notes = body.notes ? String(body.notes) : null;
    const reminder_enabled = body.reminder_enabled !== undefined ? (body.reminder_enabled ? 1 : 0) : 1;
    const debt_id = body.debt_id ? Number(body.debt_id) : null;
    const loan_id = body.loan_id ? Number(body.loan_id) : null;

    // Validar que la categoría existe si se proporciona
    if (category_id) {
      const categoryStmt = c.env.DB.prepare(
        `SELECT id FROM categories WHERE id = ? AND user_id = ?`
      );
      const category = await categoryStmt.bind(category_id, userId).first();
      if (!category) {
        return c.json(
          {
            success: false,
            error: "La categoría especificada no existe",
          },
          404
        );
      }
    }

    // Validar que la subcategoría existe y pertenece a la categoría si se proporciona
    if (subcategory_id && category_id) {
      const subcategoryStmt = c.env.DB.prepare(
        `SELECT id FROM subcategories WHERE id = ? AND category_id = ? AND user_id = ?`
      );
      const subcategory = await subcategoryStmt.bind(subcategory_id, category_id, userId).first();
      if (!subcategory) {
        return c.json(
          {
            success: false,
            error: "La subcategoría especificada no existe o no pertenece a la categoría",
          },
          404
        );
      }
    }

    // Validar que la cuenta existe si se proporciona
    if (account_id) {
      const accountStmt = c.env.DB.prepare(
        `SELECT id FROM accounts WHERE id = ? AND user_id = ?`
      );
      const account = await accountStmt.bind(account_id, userId).first();
      if (!account) {
        return c.json(
          {
            success: false,
            error: "La cuenta especificada no existe",
          },
          404
        );
      }
    }

    // Validar que la deuda existe si se proporciona
    if (debt_id) {
      const debtStmt = c.env.DB.prepare(
        `SELECT id FROM debts WHERE id = ? AND user_id = ?`
      );
      const debt = await debtStmt.bind(debt_id, userId).first();
      if (!debt) {
        return c.json(
          {
            success: false,
            error: "La deuda especificada no existe",
          },
          404
        );
      }
    }

    // Validar que el préstamo existe si se proporciona
    if (loan_id) {
      const loanStmt = c.env.DB.prepare(
        `SELECT id FROM loans WHERE id = ? AND user_id = ?`
      );
      const loan = await loanStmt.bind(loan_id, userId).first();
      if (!loan) {
        return c.json(
          {
            success: false,
            error: "El préstamo especificado no existe",
          },
          404
        );
      }
    }

    // Insertar el pago pendiente
    const insertStmt = c.env.DB.prepare(`
      INSERT INTO pending_payments (
        user_id, name, amount, due_date, category_id, subcategory_id, 
        account_id, priority, status, notes, reminder_enabled, 
        debt_id, loan_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = await insertStmt.bind(
      userId,
      name,
      amount,
      due_date,
      category_id,
      subcategory_id,
      account_id,
      priority,
      status,
      notes,
      reminder_enabled,
      debt_id,
      loan_id
    ).run();

    if (!result.success) {
      return c.json(
        {
          success: false,
          error: "Error al crear el pago pendiente",
        },
        500
      );
    }

    // Obtener el pago pendiente creado con sus relaciones
    const pendingPaymentId = result.meta.last_row_id;
    const getStmt = c.env.DB.prepare(`
      SELECT 
        pp.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type
      FROM pending_payments pp
      LEFT JOIN categories c ON pp.category_id = c.id
      LEFT JOIN subcategories sc ON pp.subcategory_id = sc.id
      LEFT JOIN accounts a ON pp.account_id = a.id
      WHERE pp.id = ?
    `);

    const pendingPayment = await getStmt.bind(pendingPaymentId).first();

    return c.json(
      {
        success: true,
        data: pendingPayment,
        message: "Pago pendiente creado exitosamente",
      },
      201
    );
  } catch (error) {
    console.error("[POST /] Error al crear pago pendiente:", error);
    return c.json(
      {
        success: false,
        error: "Error al crear el pago pendiente",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

/**
 * GET /api/pending-payments/:id
 * Obtiene el detalle de un pago pendiente específico
 */
pendingPayments.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const pendingPaymentId = parseInt(c.req.param("id"));

    if (isNaN(pendingPaymentId)) {
      return c.json(
        {
          success: false,
          error: "ID de pago pendiente inválido",
        },
        400
      );
    }

    const stmt = c.env.DB.prepare(`
      SELECT 
        pp.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type,
        a.icon as account_icon,
        a.color as account_color,
        d.name as debt_name,
        d.type as debt_type,
        d.remaining_amount as debt_remaining_amount,
        l.debtor_name as loan_debtor_name,
        l.remaining_amount as loan_remaining_amount,
        t.id as transaction_id,
        t.amount as transaction_amount,
        t.transaction_date
      FROM pending_payments pp
      LEFT JOIN categories c ON pp.category_id = c.id
      LEFT JOIN subcategories sc ON pp.subcategory_id = sc.id
      LEFT JOIN accounts a ON pp.account_id = a.id
      LEFT JOIN debts d ON pp.debt_id = d.id
      LEFT JOIN loans l ON pp.loan_id = l.id
      LEFT JOIN transactions t ON pp.transaction_id = t.id
      WHERE pp.id = ? AND pp.user_id = ?
    `);

    const pendingPayment = await stmt.bind(pendingPaymentId, userId).first();

    if (!pendingPayment) {
      return c.json(
        {
          success: false,
          error: "Pago pendiente no encontrado",
        },
        404
      );
    }

    // Calcular información adicional
    const isOverdue = pendingPayment.due_date && 
      pendingPayment.status === "pending" && 
      new Date(String(pendingPayment.due_date)) < new Date();

    const daysUntilDue = pendingPayment.due_date
      ? Math.ceil((new Date(String(pendingPayment.due_date)).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return c.json({
      success: true,
      data: {
        ...pendingPayment,
        is_overdue: isOverdue,
        days_until_due: daysUntilDue,
      },
    });
  } catch (error) {
    console.error("[GET /:id] Error al obtener pago pendiente:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener el pago pendiente",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

/**
 * PUT /api/pending-payments/:id
 * Actualiza un pago pendiente
 */
pendingPayments.put("/:id", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const pendingPaymentId = parseInt(c.req.param("id"));

    if (isNaN(pendingPaymentId)) {
      return c.json(
        {
          success: false,
          error: "ID de pago pendiente inválido",
        },
        400
      );
    }

    const body = await c.req.json();

    // Verificar que el pago pendiente existe y pertenece al usuario
    const checkStmt = c.env.DB.prepare(
      `SELECT id, status FROM pending_payments WHERE id = ? AND user_id = ?`
    );
    const existingPayment = await checkStmt.bind(pendingPaymentId, userId).first();

    if (!existingPayment) {
      return c.json(
        {
          success: false,
          error: "Pago pendiente no encontrado",
        },
        404
      );
    }

    // Construir la consulta de actualización dinámicamente
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (name.length === 0) {
        return c.json(
          {
            success: false,
            error: "El nombre no puede estar vacío",
          },
          400
        );
      }
      updates.push("name = ?");
      params.push(name);
    }

    if (body.amount !== undefined) {
      const amount = Number(body.amount);
      if (isNaN(amount) || amount <= 0) {
        return c.json(
          {
            success: false,
            error: "El monto debe ser un número mayor a 0",
          },
          400
        );
      }
      updates.push("amount = ?");
      params.push(amount);
    }

    if (body.due_date !== undefined) {
      updates.push("due_date = ?");
      params.push(body.due_date || null);
    }

    if (body.priority !== undefined) {
      if (!["high", "medium", "low"].includes(body.priority)) {
        return c.json(
          {
            success: false,
            error: "La prioridad debe ser: high, medium o low",
          },
          400
        );
      }
      updates.push("priority = ?");
      params.push(body.priority);
    }

    if (body.status !== undefined) {
      if (!["pending", "paid", "cancelled", "overdue"].includes(body.status)) {
        return c.json(
          {
            success: false,
            error: "El estado debe ser: pending, paid, cancelled u overdue",
          },
          400
        );
      }
      updates.push("status = ?");
      params.push(body.status);

      // Si se marca como pagado, registrar la fecha
      if (body.status === "paid") {
        updates.push("paid_date = CURRENT_TIMESTAMP");
      }
    }

    if (body.category_id !== undefined) {
      const category_id = body.category_id ? Number(body.category_id) : null;
      if (category_id) {
        const categoryStmt = c.env.DB.prepare(
          `SELECT id FROM categories WHERE id = ? AND user_id = ?`
        );
        const category = await categoryStmt.bind(category_id, userId).first();
        if (!category) {
          return c.json(
            {
              success: false,
              error: "La categoría especificada no existe",
            },
            404
          );
        }
      }
      updates.push("category_id = ?");
      params.push(category_id);
    }

    if (body.subcategory_id !== undefined) {
      const subcategory_id = body.subcategory_id ? Number(body.subcategory_id) : null;
      updates.push("subcategory_id = ?");
      params.push(subcategory_id);
    }

    if (body.account_id !== undefined) {
      const account_id = body.account_id ? Number(body.account_id) : null;
      if (account_id) {
        const accountStmt = c.env.DB.prepare(
          `SELECT id FROM accounts WHERE id = ? AND user_id = ?`
        );
        const account = await accountStmt.bind(account_id, userId).first();
        if (!account) {
          return c.json(
            {
              success: false,
              error: "La cuenta especificada no existe",
            },
            404
          );
        }
      }
      updates.push("account_id = ?");
      params.push(account_id);
    }

    if (body.notes !== undefined) {
      updates.push("notes = ?");
      params.push(body.notes ? String(body.notes) : null);
    }

    if (body.reminder_enabled !== undefined) {
      updates.push("reminder_enabled = ?");
      params.push(body.reminder_enabled ? 1 : 0);
    }

    if (body.transaction_id !== undefined) {
      updates.push("transaction_id = ?");
      params.push(body.transaction_id ? Number(body.transaction_id) : null);
    }

    if (updates.length === 0) {
      return c.json(
        {
          success: false,
          error: "No se proporcionaron campos para actualizar",
        },
        400
      );
    }

    // Agregar updated_at
    updates.push("updated_at = CURRENT_TIMESTAMP");

    // Construir y ejecutar la consulta
    const updateQuery = `
      UPDATE pending_payments 
      SET ${updates.join(", ")} 
      WHERE id = ? AND user_id = ?
    `;
    params.push(pendingPaymentId, userId);

    const updateStmt = c.env.DB.prepare(updateQuery);
    const result = await updateStmt.bind(...params).run();

    if (result.meta.changes === 0) {
      return c.json(
        {
          success: false,
          error: "No se pudo actualizar el pago pendiente",
        },
        500
      );
    }

    // Obtener el pago pendiente actualizado
    const getStmt = c.env.DB.prepare(`
      SELECT 
        pp.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type
      FROM pending_payments pp
      LEFT JOIN categories c ON pp.category_id = c.id
      LEFT JOIN subcategories sc ON pp.subcategory_id = sc.id
      LEFT JOIN accounts a ON pp.account_id = a.id
      WHERE pp.id = ?
    `);

    const updatedPayment = await getStmt.bind(pendingPaymentId).first();

    return c.json({
      success: true,
      data: updatedPayment,
      message: "Pago pendiente actualizado exitosamente",
    });
  } catch (error) {
    console.error("[PUT /:id] Error al actualizar pago pendiente:", error);
    return c.json(
      {
        success: false,
        error: "Error al actualizar el pago pendiente",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

/**
 * DELETE /api/pending-payments/:id
 * Elimina un pago pendiente
 */
pendingPayments.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const pendingPaymentId = parseInt(c.req.param("id"));

    if (isNaN(pendingPaymentId)) {
      return c.json(
        {
          success: false,
          error: "ID de pago pendiente inválido",
        },
        400
      );
    }

    // Verificar que el pago pendiente existe y pertenece al usuario
    const checkStmt = c.env.DB.prepare(
      `SELECT id, status FROM pending_payments WHERE id = ? AND user_id = ?`
    );
    const existingPayment = await checkStmt.bind(pendingPaymentId, userId).first();

    if (!existingPayment) {
      return c.json(
        {
          success: false,
          error: "Pago pendiente no encontrado",
        },
        404
      );
    }

    // Eliminar el pago pendiente
    const deleteStmt = c.env.DB.prepare(
      `DELETE FROM pending_payments WHERE id = ? AND user_id = ?`
    );
    const result = await deleteStmt.bind(pendingPaymentId, userId).run();

    if (result.meta.changes === 0) {
      return c.json(
        {
          success: false,
          error: "No se pudo eliminar el pago pendiente",
        },
        500
      );
    }

    return c.json({
      success: true,
      message: "Pago pendiente eliminado exitosamente",
    });
  } catch (error) {
    console.error("[DELETE /:id] Error al eliminar pago pendiente:", error);
    return c.json(
      {
        success: false,
        error: "Error al eliminar el pago pendiente",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

/**
 * PATCH /api/pending-payments/:id/mark-paid
 * Marca un pago pendiente como pagado y crea la transacción correspondiente
 */
pendingPayments.patch("/:id/mark-paid", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const pendingPaymentId = parseInt(c.req.param("id"));

    if (isNaN(pendingPaymentId)) {
      return c.json(
        {
          success: false,
          error: "ID de pago pendiente inválido",
        },
        400
      );
    }

    const body = await c.req.json();

    // Validación: account_id es requerido
    if (!body.account_id) {
      return c.json(
        {
          success: false,
          error: "La cuenta es requerida para marcar el pago como realizado",
        },
        400
      );
    }

    const account_id = Number(body.account_id);
    const transaction_date = body.transaction_date || new Date().toISOString();
    const notes = body.notes ? String(body.notes) : null;

    // Verificar que el pago pendiente existe y pertenece al usuario
    const checkStmt = c.env.DB.prepare(`
      SELECT 
        pp.*,
        c.id as category_id,
        sc.id as subcategory_id
      FROM pending_payments pp
      LEFT JOIN categories c ON pp.category_id = c.id
      LEFT JOIN subcategories sc ON pp.subcategory_id = sc.id
      WHERE pp.id = ? AND pp.user_id = ?
    `);
    const pendingPayment = await checkStmt.bind(pendingPaymentId, userId).first<{
      id: number;
      name: string;
      amount: number;
      status: string;
      category_id: number | null;
      subcategory_id: number | null;
      debt_id: number | null;
      loan_id: number | null;
    }>();

    if (!pendingPayment) {
      return c.json(
        {
          success: false,
          error: "Pago pendiente no encontrado",
        },
        404
      );
    }

    // Validar que no esté ya pagado
    if (pendingPayment.status === "paid") {
      return c.json(
        {
          success: false,
          error: "Este pago ya está marcado como pagado",
        },
        400
      );
    }

    // Verificar que la cuenta existe y pertenece al usuario
    const accountStmt = c.env.DB.prepare(
      `SELECT id, balance, is_active FROM accounts WHERE id = ? AND user_id = ?`
    );
    const account = await accountStmt.bind(account_id, userId).first<{
      id: number;
      balance: number;
      is_active: number;
    }>();

    if (!account) {
      return c.json(
        {
          success: false,
          error: "La cuenta especificada no existe",
        },
        404
      );
    }

    if (!account.is_active) {
      return c.json(
        {
          success: false,
          error: "La cuenta especificada no está activa",
        },
        400
      );
    }

    // Verificar saldo suficiente
    if (account.balance < pendingPayment.amount) {
      return c.json(
        {
          success: false,
          error: "Saldo insuficiente en la cuenta",
        },
        400
      );
    }

    // Crear transacción
    const transactionType = "pending_payment";
    const insertTransactionStmt = c.env.DB.prepare(`
      INSERT INTO transactions (
        user_id, type, amount, category_id, subcategory_id, 
        account_id, description, notes, transaction_date, 
        pending_payment_id, debt_id, loan_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    // Actualizar saldo de cuenta
    const updateAccountStmt = c.env.DB.prepare(`
      UPDATE accounts 
      SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `);

    // Actualizar pago pendiente
    const updatePaymentStmt = c.env.DB.prepare(`
      UPDATE pending_payments 
      SET status = 'paid', 
          paid_date = CURRENT_TIMESTAMP,
          transaction_id = ?,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `);

    // Ejecutar en batch para garantizar atomicidad
    const transactionResult = await insertTransactionStmt.bind(
      userId,
      transactionType,
      pendingPayment.amount,
      pendingPayment.category_id,
      pendingPayment.subcategory_id,
      account_id,
      pendingPayment.name,
      notes,
      transaction_date,
      pendingPaymentId,
      pendingPayment.debt_id,
      pendingPayment.loan_id
    ).run();

    const transactionId = transactionResult.meta.last_row_id;

    const batchResults = await c.env.DB.batch([
      updateAccountStmt.bind(pendingPayment.amount, account_id, userId),
      updatePaymentStmt.bind(transactionId, pendingPaymentId, userId),
    ]);

    // Verificar que todas las operaciones fueron exitosas
    const failed = batchResults.find((r) => !r.success);
    if (failed) {
      return c.json(
        {
          success: false,
          error: "Error al procesar el pago. Por favor, intente nuevamente.",
        },
        500
      );
    }

    // Si está relacionado con una deuda, actualizarla
    if (pendingPayment.debt_id) {
      const updateDebtStmt = c.env.DB.prepare(`
        UPDATE debts 
        SET remaining_amount = remaining_amount - ?,
            status = CASE 
              WHEN remaining_amount - ? <= 0 THEN 'paid'
              WHEN remaining_amount - ? > 0 AND due_date < DATE('now') THEN 'overdue'
              ELSE 'active'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `);
      await updateDebtStmt.bind(
        pendingPayment.amount,
        pendingPayment.amount,
        pendingPayment.amount,
        pendingPayment.debt_id,
        userId
      ).run();
    }

    // Si está relacionado con un préstamo, actualizarlo
    if (pendingPayment.loan_id) {
      const updateLoanStmt = c.env.DB.prepare(`
        UPDATE loans 
        SET remaining_amount = remaining_amount - ?,
            status = CASE 
              WHEN remaining_amount - ? <= 0 THEN 'paid'
              WHEN remaining_amount - ? > 0 AND due_date < DATE('now') THEN 'overdue'
              ELSE 'active'
            END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `);
      await updateLoanStmt.bind(
        pendingPayment.amount,
        pendingPayment.amount,
        pendingPayment.amount,
        pendingPayment.loan_id,
        userId
      ).run();
    }

    // Obtener el pago pendiente actualizado
    const getStmt = c.env.DB.prepare(`
      SELECT 
        pp.*,
        t.id as transaction_id,
        t.transaction_date,
        a.name as account_name
      FROM pending_payments pp
      LEFT JOIN transactions t ON pp.transaction_id = t.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE pp.id = ?
    `);

    const updatedPayment = await getStmt.bind(pendingPaymentId).first();

    return c.json({
      success: true,
      data: updatedPayment,
      message: "Pago registrado exitosamente",
    });
  } catch (error) {
    console.error("[PATCH /:id/mark-paid] Error al marcar pago como pagado:", error);
    return c.json(
      {
        success: false,
        error: "Error al procesar el pago",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

/**
 * GET /api/pending-payments/overdue
 * Obtiene todos los pagos vencidos
 */
pendingPayments.get("/overdue/list", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;

    const stmt = c.env.DB.prepare(`
      SELECT 
        pp.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        a.name as account_name
      FROM pending_payments pp
      LEFT JOIN categories c ON pp.category_id = c.id
      LEFT JOIN accounts a ON pp.account_id = a.id
      WHERE pp.user_id = ? 
        AND pp.status = 'pending'
        AND pp.due_date < DATE('now')
      ORDER BY pp.due_date ASC, pp.priority DESC
    `);

    const { results } = await stmt.bind(userId).all();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("[GET /overdue/list] Error al obtener pagos vencidos:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los pagos vencidos",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

export default pendingPayments;
