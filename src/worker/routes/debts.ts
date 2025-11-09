import { Hono } from "hono";
import { getDebtsWithAggregates, getDebtDetailById } from "../services/debts.service";
import { AppContext, DebtRowWithAggregates, DebtPaymentRow, DebtInstallmentRow } from "../types";

const debts = new Hono<AppContext>();

const normalizeDebtRow = (row: DebtRowWithAggregates) => {
  const original_amount = Number(row.original_amount ?? 0);
  const remaining_amount = Math.max(0, Number(row.remaining_amount ?? 0));

  const payments_total = Number(row.total_paid ?? 0);
  const payments_count = Number(row.payments_count ?? 0);
  const payments_last_date = row.last_payment_date ?? null;

  const installments_total = Number(row.installments_count ?? 0);
  const installments_pending = Number(row.pending_installments ?? 0);
  const installments_overdue = Number(row.overdue_installments ?? 0);
  const installments_paid = Number(row.paid_installments ?? 0);
  const installments_partial = Number(row.partial_installments ?? 0);
  const installments_next_due_date = row.next_installment_due_date ?? null;

  const has_installments =
    Boolean(row.has_installments) || installments_total > 0;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    original_amount,
    remaining_amount,
    interest_rate: Number(row.interest_rate ?? 0),
    start_date: row.start_date,
    due_date: row.due_date ?? null,
    status: row.status,
    has_installments,

    payments: {
      total: payments_total,
      count: payments_count,
      last_date: payments_last_date,
    },

    installments: {
      total: installments_total,
      pending: installments_pending,
      overdue: installments_overdue,
      paid: installments_paid,
      partial: installments_partial,
      next_due_date: installments_next_due_date,
    },
  };
};

debts.get("/", async (c) => {
  try {
    const user = c.get("user");
    const debtRows = await getDebtsWithAggregates(c.env.DB, user.id);

    const normalized = debtRows.map((row) => normalizeDebtRow(row));
    const summary = c.env.DB.prepare(`
      SELECT 
      (
      SELECT SUM(remaining_amount)
      FROM debts
      WHERE user_id = ?
      AND remaining_amount > 0
      AND status IN ('active', 'overdue')
      ) AS total_pending_debt,
      (
      SELECT COALESCE(SUM(t.amount), 0)
      FROM transactions t
      JOIN debts d ON t.debt_id = d.id
      WHERE t.user_id = ?
      AND t.type = 'debt_payment'
      AND d.status IN ('active', 'overdue')
      ) AS total_paid
    `);
    const summaryResult = await summary
      .bind(user.id, user.id)
      .first<{ total_deuda_pendiente: number; total_pagado: number }>();

    return c.json({
      success: true,
      data: {
        summary: summaryResult,
        debts: normalized,
      },
      count: normalized.length,
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

debts.post("/", async (c) => {
  try {
    const user = c.get("user");
    
    // Intentar parsear el JSON con manejo de errores
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
    

    // Validación básica de campos requeridos
    const requiredFields = ["name", "type", "original_amount", "start_date"];
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

    // Normalización y asignación de valores
    const name = String(body.name).trim();
    const type = String(body.type).trim();
    const original_amount = Number(body.original_amount);
    const remaining_amount =
      body.remaining_amount !== undefined && body.remaining_amount !== null
        ? Number(body.remaining_amount)
        : original_amount;
    const interest_rate =
      body.interest_rate !== undefined && body.interest_rate !== null
        ? Number(body.interest_rate)
        : 0;
    const start_date = String(body.start_date);
    const due_date = body.due_date ? String(body.due_date) : null;
    const status = body.status ? String(body.status) : "active";
    const notes = body.notes ? String(body.notes) : null;
    const has_installments = Boolean(body.has_installments);

    // Insertar en la base de datos
    const stmt = c.env.DB.prepare(`
      INSERT INTO debts (
        user_id, name, type, original_amount, remaining_amount, interest_rate, start_date, due_date, status, notes, has_installments, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    const result = await stmt
      .bind(
        user.id,
        name,
        type,
        original_amount,
        remaining_amount,
        interest_rate,
        start_date,
        due_date,
        status,
        notes,
        has_installments ? 1 : 0
      )
      .run();

    // Obtener la deuda recién creada
    const debtId = result.meta.last_row_id;
    const debtRow = await c.env.DB.prepare(`SELECT * FROM debts WHERE id = ?`)
      .bind(debtId)
      .first();

    return c.json(
      {
        success: true,
        data: debtRow,
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

debts.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const debtId = parseInt(c.req.param("id"));

    // Validar que el ID sea un número válido
    if (isNaN(debtId)) {
      return c.json(
        {
          success: false,
          error: "ID de deuda inválido",
        },
        400
      );
    }

    const debtDetail = await getDebtDetailById(c.env.DB, debtId, user.id);

    if (!debtDetail) {
      return c.json(
        {
          success: false,
          error: "Deuda no encontrada",
        },
        404
      );
    }

    const { debt, payments, installments } = debtDetail;

    // Normalizar la deuda
    const normalizedDebt = normalizeDebtRow(debt);

    // Normalizar pagos
    const normalizedPayments = payments.map((payment: DebtPaymentRow) => ({
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

    // Normalizar cuotas
    const normalizedInstallments = installments.map((installment: DebtInstallmentRow) => ({
      id: installment.id,
      installment_number: installment.installment_number,
      amount: Number(installment.amount),
      due_date: installment.due_date,
      status: installment.status,
      paid_amount: Number(installment.paid_amount ?? 0),
      paid_date: installment.paid_date,
      notes: installment.notes,
      created_at: installment.created_at,
      transaction_id: installment.transaction_id,
      transaction_date: installment.transaction_date,
    }));

    // Calcular estadísticas adicionales
    const payment_progress =
      normalizedDebt.original_amount > 0
        ? ((normalizedDebt.original_amount - normalizedDebt.remaining_amount) /
            normalizedDebt.original_amount) *
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
        debt: normalizedDebt,
        payments: {
          list: normalizedPayments,
          statistics: {
            total_payments: normalizedPayments.length,
            total_amount: normalizedPayments.reduce(
              (sum, p) => sum + p.amount,
              0
            ),
            average_amount: average_payment_amount,
            last_payment: normalizedPayments[0] || null,
          },
        },
        installments: {
          list: normalizedInstallments,
          statistics: {
            total: normalizedInstallments.length,
            pending: normalizedInstallments.filter((i) => i.status === "pending")
              .length,
            paid: normalizedInstallments.filter((i) => i.status === "paid")
              .length,
            overdue: normalizedInstallments.filter((i) => i.status === "overdue")
              .length,
            partial: normalizedInstallments.filter((i) => i.status === "partial")
              .length,
          },
        },
        summary: {
          payment_progress: Number(payment_progress.toFixed(2)),
          is_overdue:
            normalizedDebt.status === "overdue" ||
            normalizedInstallments.some((i) => i.status === "overdue"),
          days_since_start: normalizedDebt.start_date
            ? Math.floor(
                (new Date().getTime() -
                  new Date(normalizedDebt.start_date).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : 0,
          days_until_due: normalizedDebt.due_date
            ? Math.floor(
                (new Date(normalizedDebt.due_date).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de deuda:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener el detalle de la deuda",
      },
      500
    );
  }
});

export default debts;
