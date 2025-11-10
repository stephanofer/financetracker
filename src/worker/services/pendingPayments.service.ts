import { PendingPaymentWithDetails } from "../types";

/**
 * Actualiza automáticamente el estado de pagos pendientes vencidos
 * Cambia el estado de 'pending' a 'overdue' si la fecha de vencimiento ya pasó
 */
export async function updateOverduePendingPayments(
  db: D1Database,
  userId: number
): Promise<number> {
  const stmt = db.prepare(`
    UPDATE pending_payments
    SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ?
      AND status = 'pending'
      AND due_date IS NOT NULL
      AND due_date < DATE('now')
  `);

  const result = await stmt.bind(userId).run();
  return result.meta.changes || 0;
}

/**
 * Obtiene todos los pagos pendientes con sus detalles
 */
export async function getPendingPaymentsWithDetails(
  db: D1Database,
  userId: number,
  filters?: {
    status?: string;
    priority?: string;
    limit?: number;
    offset?: number;
  }
): Promise<PendingPaymentWithDetails[]> {
  let query = `
    SELECT 
      pp.id,
      pp.user_id,
      pp.name,
      pp.amount,
      pp.due_date,
      pp.category_id,
      pp.subcategory_id,
      pp.account_id,
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

  if (filters?.status) {
    query += " AND pp.status = ?";
    params.push(filters.status);
  }

  if (filters?.priority) {
    query += " AND pp.priority = ?";
    params.push(filters.priority);
  }

  query += " ORDER BY pp.due_date ASC, pp.priority DESC, pp.created_at DESC";

  if (filters?.limit) {
    query += " LIMIT ? OFFSET ?";
    params.push(filters.limit, filters.offset || 0);
  }

  const stmt = db.prepare(query);
  const { results } = await stmt.bind(...params).all<PendingPaymentWithDetails>();

  return results;
}

/**
 * Obtiene un pago pendiente por ID con todos sus detalles
 */
export async function getPendingPaymentById(
  db: D1Database,
  pendingPaymentId: number,
  userId: number
): Promise<PendingPaymentWithDetails | null> {
  const stmt = db.prepare(`
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

  const result = await stmt.bind(pendingPaymentId, userId).first<PendingPaymentWithDetails>();
  return result || null;
}

/**
 * Obtiene estadísticas de pagos pendientes
 */
export async function getPendingPaymentsSummary(db: D1Database, userId: number) {
  const stmt = db.prepare(`
    SELECT 
      COUNT(*) as total_count,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue_count,
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
      SUM(CASE WHEN status = 'pending' OR status = 'overdue' THEN amount ELSE 0 END) as total_pending_amount,
      SUM(CASE WHEN status = 'overdue' THEN amount ELSE 0 END) as total_overdue_amount,
      SUM(CASE WHEN priority = 'high' AND (status = 'pending' OR status = 'overdue') THEN 1 ELSE 0 END) as high_priority_pending,
      SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid_amount
    FROM pending_payments
    WHERE user_id = ?
  `);

  const result = await stmt.bind(userId).first();
  return result;
}

/**
 * Obtiene los próximos pagos pendientes (próximos 7 días)
 */
export async function getUpcomingPendingPayments(
  db: D1Database,
  userId: number,
  days: number = 7
): Promise<PendingPaymentWithDetails[]> {
  const stmt = db.prepare(`
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
      AND pp.due_date IS NOT NULL
      AND pp.due_date >= DATE('now')
      AND pp.due_date <= DATE('now', '+' || ? || ' days')
    ORDER BY pp.due_date ASC, pp.priority DESC
  `);

  const { results } = await stmt.bind(userId, days).all<PendingPaymentWithDetails>();
  return results;
}

/**
 * Valida que una cuenta existe y pertenece al usuario
 */
export async function validateAccount(
  db: D1Database,
  accountId: number,
  userId: number
): Promise<{ id: number; balance: number; is_active: number } | null> {
  const stmt = db.prepare(`
    SELECT id, balance, is_active 
    FROM accounts 
    WHERE id = ? AND user_id = ?
  `);

  const result = await stmt.bind(accountId, userId).first<{
    id: number;
    balance: number;
    is_active: number;
  }>();

  return result || null;
}

/**
 * Valida que una categoría existe y pertenece al usuario
 */
export async function validateCategory(
  db: D1Database,
  categoryId: number,
  userId: number
): Promise<boolean> {
  const stmt = db.prepare(`
    SELECT id 
    FROM categories 
    WHERE id = ? AND user_id = ?
  `);

  const result = await stmt.bind(categoryId, userId).first();
  return result !== null;
}

/**
 * Valida que una subcategoría existe y pertenece a la categoría y usuario
 */
export async function validateSubcategory(
  db: D1Database,
  subcategoryId: number,
  categoryId: number,
  userId: number
): Promise<boolean> {
  const stmt = db.prepare(`
    SELECT id 
    FROM subcategories 
    WHERE id = ? AND category_id = ? AND user_id = ?
  `);

  const result = await stmt.bind(subcategoryId, categoryId, userId).first();
  return result !== null;
}
