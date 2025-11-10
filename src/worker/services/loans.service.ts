import { LoanRowWithAggregates, LoanPaymentRow } from "../types";

/**
 * Obtiene todos los préstamos de un usuario con sus agregados (pagos recibidos, estadísticas)
 */
export async function getLoansWithAggregates(
  db: D1Database,
  userId: number
): Promise<LoanRowWithAggregates[]> {
  const stmt = db.prepare(`
    SELECT 
      l.id,
      l.debtor_name,
      l.debtor_contact,
      l.original_amount,
      l.remaining_amount,
      l.interest_rate,
      l.loan_date,
      l.due_date,
      l.status,
      l.notes,
      l.account_id,
      l.created_at,
      l.updated_at,
      
      -- Agregados de pagos recibidos
      COALESCE(SUM(CASE WHEN t.type = 'loan_payment' THEN t.amount ELSE 0 END), 0) AS total_received,
      COUNT(CASE WHEN t.type = 'loan_payment' THEN 1 END) AS payments_count,
      MAX(CASE WHEN t.type = 'loan_payment' THEN t.transaction_date END) AS last_payment_date,
      
      -- Información de cuenta
      a.name AS account_name,
      a.type AS account_type,
      a.icon AS account_icon,
      a.color AS account_color
      
    FROM loans l
    LEFT JOIN transactions t ON t.loan_id = l.id AND t.user_id = l.user_id
    LEFT JOIN accounts a ON a.id = l.account_id
    WHERE l.user_id = ?
    GROUP BY l.id
    ORDER BY 
      CASE l.status
        WHEN 'overdue' THEN 1
        WHEN 'active' THEN 2
        WHEN 'partial' THEN 3
        WHEN 'paid' THEN 4
      END,
      l.due_date ASC NULLS LAST,
      l.created_at DESC
  `);

  const result = await stmt.bind(userId).all<LoanRowWithAggregates>();
  return result.results || [];
}

/**
 * Obtiene el detalle completo de un préstamo específico
 */
export async function getLoanDetailById(
  db: D1Database,
  loanId: number,
  userId: number
): Promise<{
  loan: LoanRowWithAggregates;
  payments: LoanPaymentRow[];
} | null> {
  // Obtener el préstamo con agregados
  const loanStmt = db.prepare(`
    SELECT 
      l.id,
      l.debtor_name,
      l.debtor_contact,
      l.original_amount,
      l.remaining_amount,
      l.interest_rate,
      l.loan_date,
      l.due_date,
      l.status,
      l.notes,
      l.account_id,
      l.created_at,
      l.updated_at,
      
      COALESCE(SUM(CASE WHEN t.type = 'loan_payment' THEN t.amount ELSE 0 END), 0) AS total_received,
      COUNT(CASE WHEN t.type = 'loan_payment' THEN 1 END) AS payments_count,
      MAX(CASE WHEN t.type = 'loan_payment' THEN t.transaction_date END) AS last_payment_date,
      
      a.name AS account_name,
      a.type AS account_type,
      a.icon AS account_icon,
      a.color AS account_color
      
    FROM loans l
    LEFT JOIN transactions t ON t.loan_id = l.id AND t.user_id = l.user_id
    LEFT JOIN accounts a ON a.id = l.account_id
    WHERE l.id = ? AND l.user_id = ?
    GROUP BY l.id
  `);

  const loan = await loanStmt
    .bind(loanId, userId)
    .first<LoanRowWithAggregates>();

  if (!loan) {
    return null;
  }

  // Obtener los pagos recibidos del préstamo
  const paymentsStmt = db.prepare(`
    SELECT 
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
    LEFT JOIN accounts a ON a.id = t.account_id
    WHERE t.loan_id = ? AND t.user_id = ? AND t.type = 'loan_payment'
    ORDER BY t.transaction_date DESC
  `);

  const paymentsResult = await paymentsStmt.bind(loanId, userId).all<LoanPaymentRow>();
  const payments = paymentsResult.results || [];

  return {
    loan,
    payments,
  };
}
