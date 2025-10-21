export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

export async function updateAccountBalance(
  db: D1Database,
  accountId: number,
  userId: number,
  amount: number,
  type: string
) {
  const operation = type === "income" ? "+" : "-";

  const stmt = db.prepare(
    `UPDATE accounts 
     SET balance = balance ${operation} ?, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND user_id = ?`
  );

  await stmt.bind(amount, accountId, userId).run();
}

export async function revertAccountBalance(
  db: D1Database,
  accountId: number,
  userId: number,
  amount: number,
  type: string
) {
  if (type !== "income" && type !== "expense") {
    return;
  }

  const oppositeType = type === "income" ? "expense" : "income";
  await updateAccountBalance(db, accountId, userId, amount, oppositeType);
}

export function prepareUpdateAccountBalance(
  db: D1Database,
  accountId: number,
  userId: number,
  amount: number,
  type: string
): D1PreparedStatement {
  const adjustment = type === "income" ? Math.abs(amount) : -Math.abs(amount);

  return db
    .prepare(
      `UPDATE accounts 
     SET balance = balance + ?, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = ? AND user_id = ?`
    )
    .bind(adjustment, accountId, userId);
}

export function prepareRevertAccountBalance(
  db: D1Database,
  accountId: number,
  userId: number,
  amount: number,
  type: string
): D1PreparedStatement | null {
  if (type !== "income" && type !== "expense") {
    return null;
  }

  // Si era expense (-), ahora sumamos (+)
  const oppositeType = type === "income" ? "expense" : "income";

  return prepareUpdateAccountBalance(
    db,
    accountId,
    userId,
    amount,
    oppositeType
  );
}
