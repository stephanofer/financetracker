import { Hono } from "hono";
import { getLoansWithAggregates, getLoanDetailById } from "../services/loans.service";
import { AppContext, LoanRowWithAggregates, LoanPaymentRow } from "../types";

const loans = new Hono<AppContext>();

const normalizeLoanRow = (row: LoanRowWithAggregates) => {
  const original_amount = Number(row.original_amount ?? 0);
  const remaining_amount = Math.max(0, Number(row.remaining_amount ?? 0));

  const payments_total = Number(row.total_received ?? 0);
  const payments_count = Number(row.payments_count ?? 0);
  const payments_last_date = row.last_payment_date ?? null;

  return {
    id: row.id,
    debtor_name: row.debtor_name,
    debtor_contact: row.debtor_contact,
    original_amount,
    remaining_amount,
    interest_rate: Number(row.interest_rate ?? 0),
    loan_date: row.loan_date,
    due_date: row.due_date ?? null,
    status: row.status,
    notes: row.notes,
    account_id: row.account_id,

    payments: {
      total: payments_total,
      count: payments_count,
      last_date: payments_last_date,
    },

    account: row.account_name
      ? {
          name: row.account_name,
          type: row.account_type,
          icon: row.account_icon,
          color: row.account_color,
        }
      : null,
  };
};

/**
 * GET /loans
 * Obtiene la lista de todos los préstamos del usuario con resumen
 */
loans.get("/", async (c) => {
  try {
    const user = c.get("user");
    const loanRows = await getLoansWithAggregates(c.env.DB, user.id);

    const normalized = loanRows.map((row) => normalizeLoanRow(row));

    // Calcular resumen general
    const summary = c.env.DB.prepare(`
      SELECT 
        (
          SELECT COALESCE(SUM(remaining_amount), 0)
          FROM loans
          WHERE user_id = ?
          AND remaining_amount > 0
          AND status IN ('active', 'overdue', 'partial')
        ) AS total_pending_to_receive,
        (
          SELECT COALESCE(SUM(t.amount), 0)
          FROM transactions t
          JOIN loans l ON t.loan_id = l.id
          WHERE t.user_id = ?
          AND t.type = 'loan_payment'
          AND l.status IN ('active', 'overdue', 'partial', 'paid')
        ) AS total_received,
        (
          SELECT COUNT(*)
          FROM loans
          WHERE user_id = ?
          AND status = 'overdue'
        ) AS overdue_loans_count
    `);

    const summaryResult = await summary
      .bind(user.id, user.id, user.id)
      .first<{ 
        total_pending_to_receive: number; 
        total_received: number;
        overdue_loans_count: number;
      }>();

    return c.json({
      success: true,
      data: {
        summary: summaryResult,
        loans: normalized,
      },
      count: normalized.length,
    });
  } catch (error) {
    console.error("Error al obtener préstamos:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los préstamos",
      },
      500
    );
  }
});

/**
 * POST /loans
 * Crea un nuevo préstamo
 */
loans.post("/", async (c) => {
  try {
    const user = c.get("user");
    
    // Parsear y validar el JSON
    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.error("Error al parsear JSON:", parseError);
      return c.json(
        {
          success: false,
          error: "Formato de datos inválido. Se esperaba JSON válido.",
        },
        400
      );
    }

    // Validación de campos requeridos
    const requiredFields = ["debtor_name", "original_amount", "loan_date"];
    for (const field of requiredFields) {
      if (!body[field]) {
        return c.json(
          {
            success: false,
            error: `El campo '${field}' es requerido`,
          },
          400
        );
      }
    }

    // Validar que debtor_name no esté vacío
    const debtor_name = String(body.debtor_name).trim();
    if (debtor_name.length === 0) {
      return c.json(
        {
          success: false,
          error: "El nombre del deudor no puede estar vacío",
        },
        400
      );
    }

    // Validar que original_amount sea positivo
    const original_amount = Number(body.original_amount);
    if (isNaN(original_amount) || original_amount <= 0) {
      return c.json(
        {
          success: false,
          error: "El monto original debe ser un número positivo",
        },
        400
      );
    }

    // Normalización de valores
    const debtor_contact = body.debtor_contact ? String(body.debtor_contact).trim() : null;
    const remaining_amount =
      body.remaining_amount !== undefined && body.remaining_amount !== null
        ? Number(body.remaining_amount)
        : original_amount;

    // Validar que remaining_amount no sea negativo ni mayor que original_amount
    if (isNaN(remaining_amount) || remaining_amount < 0) {
      return c.json(
        {
          success: false,
          error: "El monto restante no puede ser negativo",
        },
        400
      );
    }

    if (remaining_amount > original_amount) {
      return c.json(
        {
          success: false,
          error: "El monto restante no puede ser mayor al monto original",
        },
        400
      );
    }

    const interest_rate =
      body.interest_rate !== undefined && body.interest_rate !== null
        ? Number(body.interest_rate)
        : 0;

    // Validar que interest_rate no sea negativo
    if (isNaN(interest_rate) || interest_rate < 0) {
      return c.json(
        {
          success: false,
          error: "La tasa de interés no puede ser negativa",
        },
        400
      );
    }

    const loan_date = String(body.loan_date);
    const due_date = body.due_date ? String(body.due_date) : null;

    // Validar que due_date sea posterior a loan_date si existe
    if (due_date && new Date(due_date) < new Date(loan_date)) {
      return c.json(
        {
          success: false,
          error: "La fecha de vencimiento debe ser posterior a la fecha del préstamo",
        },
        400
      );
    }

    const status = body.status ? String(body.status) : "active";
    
    // Validar status
    const validStatuses = ["active", "paid", "overdue", "partial"];
    if (!validStatuses.includes(status)) {
      return c.json(
        {
          success: false,
          error: `El estado debe ser uno de: ${validStatuses.join(", ")}`,
        },
        400
      );
    }

    const notes = body.notes ? String(body.notes).trim() : null;
    const account_id = body.account_id ? parseInt(body.account_id) : null;

    // Si se proporciona account_id, validar que la cuenta exista y pertenezca al usuario
    if (account_id) {
      const accountCheck = await c.env.DB.prepare(
        `SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1`
      )
        .bind(account_id, user.id)
        .first();

      if (!accountCheck) {
        return c.json(
          {
            success: false,
            error: "La cuenta especificada no existe o no pertenece al usuario",
          },
          400
        );
      }
    }

    // Insertar en la base de datos
    const stmt = c.env.DB.prepare(`
      INSERT INTO loans (
        user_id, debtor_name, debtor_contact, original_amount, remaining_amount, 
        interest_rate, loan_date, due_date, status, notes, account_id, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = await stmt
      .bind(
        user.id,
        debtor_name,
        debtor_contact,
        original_amount,
        remaining_amount,
        interest_rate,
        loan_date,
        due_date,
        status,
        notes,
        account_id
      )
      .run();

    // Obtener el préstamo recién creado
    const loanId = result.meta.last_row_id;
    const loanRow = await c.env.DB.prepare(`SELECT * FROM loans WHERE id = ?`)
      .bind(loanId)
      .first();

    return c.json(
      {
        success: true,
        data: loanRow,
        message: "Préstamo creado exitosamente",
      },
      201
    );
  } catch (error) {
    console.error("Error al crear préstamo:", error);
    return c.json(
      {
        success: false,
        error: "Error al crear el préstamo",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

/**
 * GET /loans/:id
 * Obtiene el detalle completo de un préstamo específico
 */
loans.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const loanId = parseInt(c.req.param("id"));

    // Validar que el ID sea un número válido
    if (isNaN(loanId)) {
      return c.json(
        {
          success: false,
          error: "ID de préstamo inválido",
        },
        400
      );
    }

    const loanDetail = await getLoanDetailById(c.env.DB, loanId, user.id);

    if (!loanDetail) {
      return c.json(
        {
          success: false,
          error: "Préstamo no encontrado",
        },
        404
      );
    }

    const { loan, payments } = loanDetail;

    // Normalizar el préstamo
    const normalizedLoan = normalizeLoanRow(loan);

    // Normalizar pagos
    const normalizedPayments = payments.map((payment: LoanPaymentRow) => ({
      id: payment.id,
      amount: Number(payment.amount),
      transaction_date: payment.transaction_date,
      description: payment.description,
      notes: payment.notes,
      created_at: payment.created_at,
      account: payment.account_name
        ? {
            name: payment.account_name,
            type: payment.account_type,
            icon: payment.account_icon,
            color: payment.account_color,
          }
        : null,
    }));

    // Calcular estadísticas adicionales
    const payment_progress =
      normalizedLoan.original_amount > 0
        ? ((normalizedLoan.original_amount - normalizedLoan.remaining_amount) /
            normalizedLoan.original_amount) *
          100
        : 0;

    const average_payment_amount =
      normalizedPayments.length > 0
        ? normalizedPayments.reduce((sum, p) => sum + p.amount, 0) /
          normalizedPayments.length
        : 0;

    return c.json({
      success: true,
      data: {
        loan: normalizedLoan,
        payments: {
          list: normalizedPayments,
          statistics: {
            total_payments: normalizedPayments.length,
            total_amount: normalizedPayments.reduce((sum, p) => sum + p.amount, 0),
            average_amount: average_payment_amount,
            last_payment: normalizedPayments[0] || null,
          },
        },
        summary: {
          payment_progress: Number(payment_progress.toFixed(2)),
          is_overdue: normalizedLoan.status === "overdue",
          days_since_loan: normalizedLoan.loan_date
            ? Math.floor(
                (new Date().getTime() - new Date(normalizedLoan.loan_date).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
          days_until_due: normalizedLoan.due_date
            ? Math.floor(
                (new Date(normalizedLoan.due_date).getTime() - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de préstamo:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener el detalle del préstamo",
      },
      500
    );
  }
});

/**
 * PUT /loans/:id
 * Actualiza un préstamo existente
 */
loans.put("/:id", async (c) => {
  try {
    const user = c.get("user");
    const loanId = parseInt(c.req.param("id"));

    if (isNaN(loanId)) {
      return c.json(
        {
          success: false,
          error: "ID de préstamo inválido",
        },
        400
      );
    }

    // Verificar que el préstamo existe y pertenece al usuario
    const existingLoan = await c.env.DB.prepare(
      `SELECT * FROM loans WHERE id = ? AND user_id = ?`
    )
      .bind(loanId, user.id)
      .first();

    if (!existingLoan) {
      return c.json(
        {
          success: false,
          error: "Préstamo no encontrado",
        },
        404
      );
    }

    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json(
        {
          success: false,
          error: "Formato de datos inválido. Se esperaba JSON válido.",
        },
        400
      );
    }

    // Construir la query de actualización dinámicamente
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (body.debtor_name !== undefined) {
      const debtor_name = String(body.debtor_name).trim();
      if (debtor_name.length === 0) {
        return c.json(
          {
            success: false,
            error: "El nombre del deudor no puede estar vacío",
          },
          400
        );
      }
      updates.push("debtor_name = ?");
      values.push(debtor_name);
    }

    if (body.debtor_contact !== undefined) {
      updates.push("debtor_contact = ?");
      values.push(body.debtor_contact ? String(body.debtor_contact).trim() : null);
    }

    if (body.original_amount !== undefined) {
      const original_amount = Number(body.original_amount);
      if (isNaN(original_amount) || original_amount <= 0) {
        return c.json(
          {
            success: false,
            error: "El monto original debe ser un número positivo",
          },
          400
        );
      }
      updates.push("original_amount = ?");
      values.push(original_amount);
    }

    if (body.remaining_amount !== undefined) {
      const remaining_amount = Number(body.remaining_amount);
      if (isNaN(remaining_amount) || remaining_amount < 0) {
        return c.json(
          {
            success: false,
            error: "El monto restante no puede ser negativo",
          },
          400
        );
      }
      updates.push("remaining_amount = ?");
      values.push(remaining_amount);
    }

    if (body.interest_rate !== undefined) {
      const interest_rate = Number(body.interest_rate);
      if (isNaN(interest_rate) || interest_rate < 0) {
        return c.json(
          {
            success: false,
            error: "La tasa de interés no puede ser negativa",
          },
          400
        );
      }
      updates.push("interest_rate = ?");
      values.push(interest_rate);
    }

    if (body.loan_date !== undefined) {
      updates.push("loan_date = ?");
      values.push(String(body.loan_date));
    }

    if (body.due_date !== undefined) {
      updates.push("due_date = ?");
      values.push(body.due_date ? String(body.due_date) : null);
    }

    if (body.status !== undefined) {
      const validStatuses = ["active", "paid", "overdue", "partial"];
      if (!validStatuses.includes(body.status)) {
        return c.json(
          {
            success: false,
            error: `El estado debe ser uno de: ${validStatuses.join(", ")}`,
          },
          400
        );
      }
      updates.push("status = ?");
      values.push(String(body.status));
    }

    if (body.notes !== undefined) {
      updates.push("notes = ?");
      values.push(body.notes ? String(body.notes).trim() : null);
    }

    if (body.account_id !== undefined) {
      const account_id = body.account_id ? parseInt(body.account_id) : null;
      
      if (account_id) {
        const accountCheck = await c.env.DB.prepare(
          `SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1`
        )
          .bind(account_id, user.id)
          .first();

        if (!accountCheck) {
          return c.json(
            {
              success: false,
              error: "La cuenta especificada no existe o no pertenece al usuario",
            },
            400
          );
        }
      }
      
      updates.push("account_id = ?");
      values.push(account_id);
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

    // Agregar WHERE clause
    values.push(loanId, user.id);

    const updateStmt = c.env.DB.prepare(`
      UPDATE loans 
      SET ${updates.join(", ")}
      WHERE id = ? AND user_id = ?
    `);

    await updateStmt.bind(...values).run();

    // Obtener el préstamo actualizado
    const updatedLoan = await c.env.DB.prepare(`SELECT * FROM loans WHERE id = ?`)
      .bind(loanId)
      .first();

    return c.json({
      success: true,
      data: updatedLoan,
      message: "Préstamo actualizado exitosamente",
    });
  } catch (error) {
    console.error("Error al actualizar préstamo:", error);
    return c.json(
      {
        success: false,
        error: "Error al actualizar el préstamo",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

/**
 * DELETE /loans/:id
 * Elimina un préstamo (soft delete o hard delete según preferencia)
 */
loans.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const loanId = parseInt(c.req.param("id"));

    if (isNaN(loanId)) {
      return c.json(
        {
          success: false,
          error: "ID de préstamo inválido",
        },
        400
      );
    }

    // Verificar que el préstamo existe y pertenece al usuario
    const existingLoan = await c.env.DB.prepare(
      `SELECT * FROM loans WHERE id = ? AND user_id = ?`
    )
      .bind(loanId, user.id)
      .first();

    if (!existingLoan) {
      return c.json(
        {
          success: false,
          error: "Préstamo no encontrado",
        },
        404
      );
    }

    // Verificar si hay transacciones asociadas
    const transactionsCheck = await c.env.DB.prepare(
      `SELECT COUNT(*) as count FROM transactions WHERE loan_id = ? AND user_id = ?`
    )
      .bind(loanId, user.id)
      .first<{ count: number }>();

    if (transactionsCheck && transactionsCheck.count > 0) {
      return c.json(
        {
          success: false,
          error: "No se puede eliminar el préstamo porque tiene transacciones asociadas",
          message: `Hay ${transactionsCheck.count} transacción(es) asociada(s). Elimínelas primero o cambie el estado del préstamo.`,
        },
        400
      );
    }

    // Eliminar el préstamo
    await c.env.DB.prepare(`DELETE FROM loans WHERE id = ? AND user_id = ?`)
      .bind(loanId, user.id)
      .run();

    return c.json({
      success: true,
      message: "Préstamo eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar préstamo:", error);
    return c.json(
      {
        success: false,
        error: "Error al eliminar el préstamo",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

export default loans;
