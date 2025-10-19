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
  amount: number,
  type: string
) {
  const operation = type === "income" ? "+" : "-";

  const stmt = db.prepare(
    `UPDATE accounts 
     SET balance = balance ${operation} ?, 
         updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`
  );

  await stmt.bind(amount, accountId).run();
}