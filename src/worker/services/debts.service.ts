import { DebtRowWithAggregates, DebtPaymentRow, DebtInstallmentRow } from "../types";

export const getDebtsWithAggregates = async (
  db: D1Database,
  userId: number
): Promise<DebtRowWithAggregates[]> => {
  const stmt = db.prepare(
    `WITH payments AS (
       SELECT
         debt_id,
         SUM(amount) AS total_paid,
         COUNT(*) AS payments_count,
         MAX(transaction_date) AS last_payment_date
       FROM transactions
       WHERE type = 'debt_payment'
       GROUP BY debt_id
     ),
     installments AS (
       SELECT
         debt_id,
         COUNT(*) AS installments_count,
         SUM(amount) AS total_installment_amount,
         SUM(paid_amount) AS total_paid_installments,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_installments,
         SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_installments,
         SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_installments,
         SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) AS partial_installments,
         MIN(CASE WHEN status IN ('pending', 'partial') THEN due_date END) AS next_installment_due_date
       FROM debt_installments
       GROUP BY debt_id
     )
     SELECT
  d.id,
  d.name,
  d.type,
  d.original_amount,
  d.remaining_amount,
  d.interest_rate,
  d.start_date,
  d.due_date,
  d.status,
  d.notes,
  d.has_installments,
  d.created_at,
  d.updated_at,
       COALESCE(p.total_paid, 0) AS total_paid,
       COALESCE(p.payments_count, 0) AS payments_count,
       p.last_payment_date,
       COALESCE(i.installments_count, 0) AS installments_count,
       COALESCE(i.pending_installments, 0) AS pending_installments,
       COALESCE(i.overdue_installments, 0) AS overdue_installments,
       COALESCE(i.paid_installments, 0) AS paid_installments,
       COALESCE(i.partial_installments, 0) AS partial_installments,
       COALESCE(i.total_installment_amount, 0) AS total_installment_amount,
       COALESCE(i.total_paid_installments, 0) AS total_paid_installments,
       i.next_installment_due_date
     FROM debts d
     LEFT JOIN payments p ON p.debt_id = d.id
     LEFT JOIN installments i ON i.debt_id = d.id
     WHERE d.user_id = ?
     ORDER BY
       CASE
    WHEN d.status = 'active' THEN 0
    WHEN d.status = 'overdue' THEN 1
    WHEN d.status = 'paid' THEN 2
    ELSE 3
       END,
       d.due_date IS NULL,
       d.due_date ASC`
  );

  const { results } = await stmt.bind(userId).all<DebtRowWithAggregates>();
  return results;
};

export const getDebtDetailById = async (
  db: D1Database,
  debtId: number,
  userId: number
) => {
  // Obtener información básica de la deuda con agregados
  const debtStmt = db.prepare(
    `WITH payments AS (
       SELECT
         debt_id,
         SUM(amount) AS total_paid,
         COUNT(*) AS payments_count,
         MAX(transaction_date) AS last_payment_date
       FROM transactions
       WHERE type = 'debt_payment'
       GROUP BY debt_id
     ),
     installments AS (
       SELECT
         debt_id,
         COUNT(*) AS installments_count,
         SUM(amount) AS total_installment_amount,
         SUM(paid_amount) AS total_paid_installments,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_installments,
         SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) AS overdue_installments,
         SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid_installments,
         SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) AS partial_installments,
         MIN(CASE WHEN status IN ('pending', 'partial') THEN due_date END) AS next_installment_due_date
       FROM debt_installments
       GROUP BY debt_id
     )
     SELECT
       d.id,
       d.name,
       d.type,
       d.original_amount,
       d.remaining_amount,
       d.interest_rate,
       d.start_date,
       d.due_date,
       d.status,
       d.notes,
       d.has_installments,
       d.created_at,
       d.updated_at,
       COALESCE(p.total_paid, 0) AS total_paid,
       COALESCE(p.payments_count, 0) AS payments_count,
       p.last_payment_date,
       COALESCE(i.installments_count, 0) AS installments_count,
       COALESCE(i.pending_installments, 0) AS pending_installments,
       COALESCE(i.overdue_installments, 0) AS overdue_installments,
       COALESCE(i.paid_installments, 0) AS paid_installments,
       COALESCE(i.partial_installments, 0) AS partial_installments,
       COALESCE(i.total_installment_amount, 0) AS total_installment_amount,
       COALESCE(i.total_paid_installments, 0) AS total_paid_installments,
       i.next_installment_due_date
     FROM debts d
     LEFT JOIN payments p ON p.debt_id = d.id
     LEFT JOIN installments i ON i.debt_id = d.id
     WHERE d.id = ? AND d.user_id = ?`
  );

  const debt = await debtStmt.bind(debtId, userId).first<DebtRowWithAggregates>();

  if (!debt) {
    return null;
  }

  // Obtener transacciones de pago relacionadas
  const paymentsStmt = db.prepare(
    `SELECT 
       t.id,
       t.amount,
       t.transaction_date,
       t.description,
       t.notes,
       t.created_at,
       a.name AS account_name,
       a.type AS account_type,
       a.icon AS account_icon,
       a.color AS account_color
     FROM transactions t
     LEFT JOIN accounts a ON t.account_id = a.id
     WHERE t.debt_id = ? AND t.user_id = ? AND t.type = 'debt_payment'
     ORDER BY t.transaction_date DESC, t.created_at DESC`
  );

  const { results: payments } = await paymentsStmt.bind(debtId, userId).all<DebtPaymentRow>();

  // Obtener cuotas si la deuda tiene cuotas
  const installmentsStmt = db.prepare(
    `SELECT 
       di.id,
       di.installment_number,
       di.amount,
       di.due_date,
       di.status,
       di.paid_amount,
       di.paid_date,
       di.notes,
       di.created_at,
       t.id AS transaction_id,
       t.transaction_date
     FROM debt_installments di
     LEFT JOIN transactions t ON di.transaction_id = t.id
     WHERE di.debt_id = ?
     ORDER BY di.installment_number ASC`
  );

  const { results: installments } = await installmentsStmt.bind(debtId).all<DebtInstallmentRow>();

  return {
    debt,
    payments,
    installments,
  };
};
