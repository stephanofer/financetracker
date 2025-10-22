import { Hono } from "hono";
import { getDebtsWithAggregates } from "../services/debts.service";
import { AppContext, DebtRowWithAggregates } from "../types";

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
    const body = await c.req.json();
    console.log(body);

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

export default debts;
