import { Hono } from "hono";
import {
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  prepareRevertAccountBalance,
  updateAccountBalance,
} from "../services/transactions.service";
import { AppContext } from "../types";

const transactions = new Hono<AppContext>();

transactions.get("/summary", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const limit = c.req.query("limit");
    const offset = c.req.query("offset") || "0";

    let query = `
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        s.name as subcategory_name,
        a.name as account_name,
        a.type as account_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON t.subcategory_id = s.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    query += " ORDER BY t.transaction_date DESC, t.created_at DESC";

    if (limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));
    }

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    // Obtener el total de gastos (expense) del usuario
    const totalStmt = c.env.DB.prepare(
      `SELECT 
         SUM(amount) as total_expenses,
         COUNT(*) as total_count
       FROM transactions 
       WHERE user_id = ? AND type = 'expense'`
    );
    const totalResult = await totalStmt.bind(userId).first<{
      total_expenses: number | null;
      total_count: number;
    }>();

    const balanceStmt = c.env.DB.prepare(
      `SELECT SUM(balance) as total_balance FROM accounts WHERE user_id = ? AND is_active = 1`
    );
    const balanceResult = await balanceStmt
      .bind(userId)
      .first<{ total_balance: number | null }>();

    return c.json({
      success: true,
      data: {
        total: {
          total_expenses: totalResult?.total_expenses || 0,
          total_balance: balanceResult?.total_balance || 0,
        },
        results,
      },
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener gastos:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los gastos",
      },
      500
    );
  }
});

transactions.post("/", async (c) => {
  try {
    const body = await c.req.parseBody();
    const user = c.get("user");
    const userId = user.id;
    const amount = body["amount"] ? parseFloat(body["amount"] as string) : null;
    const categoryId = body["categoryId"]
      ? parseInt(body["categoryId"] as string)
      : null;
    const subcategoryId = body["subcategoryId"]
      ? parseInt(body["subcategoryId"] as string)
      : null;
    const accountId = body["accountId"]
      ? parseInt(body["accountId"] as string)
      : null;
    const description = body["description"] || null;
    const type = body["type"] as string;
    const notes = body["notes"] || null;
    const date = body["date"] || new Date().toISOString();
    const file = body["file"] || null;

    if (!amount || !userId || !type) {
      return c.json(
        {
          success: false,
          error: "amount, accountId, userId y type son requeridos",
        },
        400
      );
    }

    if (
      file &&
      file instanceof File &&
      !ALLOWED_FILE_TYPES.includes(file.type)
    ) {
      return c.json(
        {
          error: "Tipo de archivo no permitido",
          message: "Solo se aceptan imágenes o PDF",
        },
        400
      );
    }

    if (file && file instanceof File && file.size > MAX_FILE_SIZE) {
      return c.json(
        {
          error: "Archivo muy grande",
          message: "El archivo debe pesar menos de 5MB",
        },
        400
      );
    }

    let r2Key: string | null = null;
    let r2Url: string | null = null;
    let uploadedFile: File | null = null;

    if (file && file instanceof File) {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = file.name.split(".").pop();
      r2Key = `uploads/${timestamp}-${randomString}.${fileExtension}`;

      await c.env.BUCKET.put(r2Key, file.stream(), {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          originalName: file.name,
          uploadedBy: "user",
        },
      });

      r2Url = `https://cdnfintracker.stephanofer.com/${r2Key}`;
      uploadedFile = file;
    }

    const stmt = c.env.DB.prepare(
      `INSERT INTO transactions 
       (user_id, type, amount, category_id, subcategory_id, account_id, description, notes, transaction_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = await stmt
      .bind(
        userId,
        type,
        amount,
        categoryId || null,
        subcategoryId || null,
        accountId,
        description || null,
        notes || null,
        date
      )
      .run();

    const transactionId = result.meta.last_row_id;

    if (uploadedFile && r2Key) {
      const fileType = uploadedFile.type.startsWith("image/")
        ? "image"
        : uploadedFile.type === "application/pdf"
        ? "pdf"
        : "other";

      const attachmentStmt = c.env.DB.prepare(
        `INSERT INTO attachments 
         (transaction_id, file_name, original_file_name, file_size, mime_type, file_type, r2_key, r2_url, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      await attachmentStmt
        .bind(
          transactionId,
          r2Key.split("/").pop(),
          uploadedFile.name,
          uploadedFile.size,
          uploadedFile.type,
          fileType,
          r2Key,
          r2Url,
          description || null
        )
        .run();
    }

    if (accountId) {
      await updateAccountBalance(c.env.DB, accountId, userId, amount, type);
    }

    const getTransactionStmt = c.env.DB.prepare(
      `SELECT * FROM transactions WHERE id = ?`
    );
    const transaction = await getTransactionStmt.bind(transactionId).first();

    return c.json({
      success: true,
      data: {
        ...transaction,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes("boundary")) {
      return c.json(
        {
          success: false,
          error: "Formato de solicitud inválido",
          message:
            "El Content-Type debe ser multipart/form-data con boundary válido",
        },
        400
      );
    }

    return c.json(
      {
        success: false,
        error: "Error al crear la transacción",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

transactions.get("/", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const type = c.req.query("type");
    const limit = c.req.query("limit");
    const offset = c.req.query("offset") || "0";
    const startDate = c.req.query("startDate");
    const endDate = c.req.query("endDate");

    let query = `
      SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        s.name as subcategory_name,
        a.name as account_name,
        a.type as account_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories s ON t.subcategory_id = s.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (type === "expense" || type === "income") {
      query += " AND t.type = ?";
      params.push(type);
    }

    if (startDate) {
      query += " AND t.transaction_date >= ?";
      params.push(startDate);
    }

    if (endDate) {
      query += " AND t.transaction_date <= ?";
      params.push(endDate);
    }

    query += " ORDER BY t.transaction_date DESC, t.created_at DESC";

    if (limit) {
      query += " LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));
    }

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener transacciones:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener las transacciones",
      },
      500
    );
  }
});

transactions.get("/:id", async (c) => {
  try {
    const transactionId = c.req.param("id");
    const user = c.get("user");
    const userId = user.id;

    const transactionStmt = c.env.DB.prepare(
      `SELECT 
        t.*,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.id = ? AND t.user_id = ?`
    );

    const transaction = await transactionStmt
      .bind(transactionId, userId)
      .first();

    if (!transaction) {
      return c.json(
        {
          success: false,
          error: "Transacción no encontrada",
        },
        404
      );
    }

    const attachmentsStmt = c.env.DB.prepare(
      `SELECT * FROM attachments WHERE transaction_id = ? ORDER BY uploaded_at DESC`
    );

    const { results: attachments } = await attachmentsStmt
      .bind(transactionId)
      .all();

    const transactionWithAttachments = {
      ...transaction,
      attachments: attachments,
    };

    return c.json({
      success: true,
      data: transactionWithAttachments,
    });
  } catch (error) {
    console.error("Error al obtener detalles de la transacción:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los detalles de la transacción",
      },
      500
    );
  }
});

transactions.delete("/:id", async (c) => {
  const transactionIdParam = c.req.param("id");
  const transactionId = Number.parseInt(transactionIdParam, 10);

  if (!Number.isInteger(transactionId)) {
    return c.json(
      {
        success: false,
        error: "ID de transacción inválido",
      },
      400
    );
  }

  const user = c.get("user");

  const transactionStmt = c.env.DB.prepare(
    `SELECT id, user_id, type, amount, account_id
     FROM transactions
     WHERE id = ? AND user_id = ?`
  );

  const transaction = await transactionStmt.bind(transactionId, user.id).first<{
    id: number;
    user_id: number;
    type: string;
    amount: number;
    account_id: number;
  }>();

  if (!transaction) {
    return c.json(
      {
        success: false,
        error: "Transacción no encontrada",
      },
      404
    );
  }

  // if (transaction.type !== "income" && transaction.type !== "expense") {
  //   return c.json(
  //     {
  //       success: false,
  //       error:
  //         "Solo se pueden eliminar transacciones de tipo 'income' o 'expense' con este endpoint",
  //     },
  //     400
  //   );
  // }

  const attachmentsStmt = c.env.DB.prepare(
    `SELECT id, r2_key FROM attachments WHERE transaction_id = ?`
  );
  const { results: attachments } = await attachmentsStmt
    .bind(transactionId)
    .all<{ id: number; r2_key: string | null }>();

  const batchQueries = [];

  const revertStmt = prepareRevertAccountBalance(
    c.env.DB,
    transaction.account_id,
    user.id,
    Number(transaction.amount),
    transaction.type
  );

  if (revertStmt) {
    batchQueries.push(revertStmt);
  }

  batchQueries.push(
    c.env.DB.prepare(`DELETE FROM attachments WHERE transaction_id = ?`).bind(
      transactionId
    )
  );

  batchQueries.push(
    c.env.DB.prepare(
      `DELETE FROM transactions WHERE id = ? AND user_id = ?`
    ).bind(transactionId, user.id)
  );

  try {
    const results = await c.env.DB.batch(batchQueries);

    const failed = results.find((r) => !r.success);
    if (failed) {
      return c.json(
        {
          success: false,
          error: "Error al eliminar la transacción (fallo en la base de datos)",
        },
        500
      );
    }

    const deleteResult = results[results.length - 1];
    if (deleteResult.meta.changes === 0) {
      return c.json(
        {
          success: false,
          error:
            "No se pudo eliminar la transacción (no encontrada o sin cambios)",
        },
        404
      );
    }
  } catch (error) {
    console.error("Error al eliminar transacción:", error);
    return c.json(
      {
        success: false,
        error: "Error al eliminar la transacción",
      },
      500
    );
  }

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      if (attachment.r2_key) {
        try {
          await c.env.BUCKET.delete(attachment.r2_key);
        } catch (deleteError) {
          console.error(
            `Error al eliminar archivo de R2 para attachment ${attachment.id}:`,
            deleteError
          );
        }
      }
    }
  }

  return c.json({
    success: true,
    message: "Transacción eliminada correctamente",
  });
});


/**
 * PUT /api/transactions/:id
 * Actualiza una transacción existente y ajusta los balances correspondientes
 */
// app.put("/api/transactions/:id", async (c) => {
//   const transactionIdParam = c.req.param("id");
//   const transactionId = Number.parseInt(transactionIdParam, 10);

//   if (!Number.isInteger(transactionId)) {
//     return c.json(
//       {
//         success: false,
//         error: "ID de transacción inválido",
//       },
//       400
//     );
//   }

//   const user = c.get("user");

//   const existingTransactionStmt = c.env.DB.prepare(
//     `SELECT id, user_id, type, amount, category_id, subcategory_id, account_id, description, notes, transaction_date
//      FROM transactions
//      WHERE id = ? AND user_id = ?`
//   );

//   const existingTransaction = await existingTransactionStmt
//     .bind(transactionId, user.id)
//     .first<{
//       id: number;
//       user_id: number;
//       type: string;
//       amount: number;
//       category_id: number | null;
//       subcategory_id: number | null;
//       account_id: number;
//       description: string | null;
//       notes: string | null;
//       transaction_date: string;
//     }>();

//   if (!existingTransaction) {
//     return c.json(
//       {
//         success: false,
//         error: "Transacción no encontrada",
//       },
//       404
//     );
//   }

//   if (
//     existingTransaction.type !== "income" &&
//     existingTransaction.type !== "expense"
//   ) {
//     return c.json(
//       {
//         success: false,
//         error:
//           "Solo se pueden editar transacciones de tipo 'income' o 'expense' con este endpoint",
//       },
//       400
//     );
//   }

//   const body = await c.req.parseBody();

//   const amount =
//     body["amount"] !== undefined &&
//     body["amount"] !== null &&
//     body["amount"] !== ""
//       ? Number(body["amount"])
//       : Number(existingTransaction.amount);
//   const categoryId =
//     body["categoryId"] !== undefined &&
//     body["categoryId"] !== null &&
//     body["categoryId"] !== ""
//       ? Number.parseInt(body["categoryId"] as string, 10)
//       : existingTransaction.category_id;
//   const subcategoryId =
//     body["subcategoryId"] !== undefined &&
//     body["subcategoryId"] !== null &&
//     body["subcategoryId"] !== ""
//       ? Number.parseInt(body["subcategoryId"] as string, 10)
//       : existingTransaction.subcategory_id;
//   const accountId =
//     body["accountId"] !== undefined &&
//     body["accountId"] !== null &&
//     body["accountId"] !== ""
//       ? Number.parseInt(body["accountId"] as string, 10)
//       : existingTransaction.account_id;
//   const type =
//     body["type"] !== undefined && body["type"] !== null && body["type"] !== ""
//       ? String(body["type"])
//       : existingTransaction.type;
//   const description =
//     body["description"] !== undefined
//       ? (body["description"] as string) || null
//       : existingTransaction.description;
//   const notes =
//     body["notes"] !== undefined
//       ? (body["notes"] as string) || null
//       : existingTransaction.notes;
//   const date =
//     body["date"] !== undefined && body["date"] !== null && body["date"] !== ""
//       ? String(body["date"])
//       : existingTransaction.transaction_date;
//   const file = body["file"] || null;

//   if (!Number.isFinite(amount) || amount <= 0) {
//     return c.json(
//       {
//         success: false,
//         error: "El monto debe ser un número mayor a 0",
//       },
//       400
//     );
//   }

//   if (!Number.isInteger(accountId)) {
//     return c.json(
//       {
//         success: false,
//         error: "accountId es requerido y debe ser un entero",
//       },
//       400
//     );
//   }

//   const account = await c.env.DB.prepare(
//     `SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1`
//   )
//     .bind(accountId, user.id)
//     .first();

//   if (!account) {
//     return c.json(
//       {
//         success: false,
//         error: "La cuenta seleccionada no pertenece al usuario",
//       },
//       400
//     );
//   }

//   if (type !== "income" && type !== "expense") {
//     return c.json(
//       {
//         success: false,
//         error: "type debe ser 'income' o 'expense'",
//       },
//       400
//     );
//   }

//   if (file && file instanceof File && !ALLOWED_FILE_TYPES.includes(file.type)) {
//     return c.json(
//       {
//         error: "Tipo de archivo no permitido",
//         message: "Solo se aceptan imágenes o PDF",
//       },
//       400
//     );
//   }

//   if (file && file instanceof File && file.size > MAX_FILE_SIZE) {
//     return c.json(
//       {
//         error: "Archivo muy grande",
//         message: "El archivo debe pesar menos de 5MB",
//       },
//       400
//     );
//   }

//   const parsedDate = new Date(date);
//   if (Number.isNaN(parsedDate.getTime())) {
//     return c.json(
//       {
//         success: false,
//         error: "La fecha de la transacción no es válida",
//       },
//       400
//     );
//   }

//   let r2Key: string | null = null;
//   let r2Url: string | null = null;
//   let uploadedFile: File | null = null;

//   if (file && file instanceof File) {
//     const timestamp = Date.now();
//     const randomString = Math.random().toString(36).substring(2, 15);
//     const fileExtension = file.name.includes(".")
//       ? file.name.split(".").pop()
//       : "";
//     r2Key = `uploads/${timestamp}-${randomString}${
//       fileExtension ? `.${fileExtension}` : ""
//     }`;

//     await c.env.BUCKET.put(r2Key, file.stream(), {
//       httpMetadata: {
//         contentType: file.type,
//       },
//       customMetadata: {
//         originalName: file.name,
//         uploadedBy: "user",
//       },
//     });

//     r2Url = `https://cdnfintracker.stephanofer.com/${r2Key}`;
//     uploadedFile = file;
//   }

//   const shouldAdjustBalances =
//     existingTransaction.amount !== amount ||
//     existingTransaction.account_id !== accountId ||
//     existingTransaction.type !== type;

//   try {
//     await c.env.DB.prepare("BEGIN TRANSACTION").run();

//     if (shouldAdjustBalances) {
//       await revertAccountBalance(
//         c.env.DB,
//         existingTransaction.account_id,
//         Number(existingTransaction.amount),
//         existingTransaction.type
//       );
//     }

//     const updateStmt = c.env.DB.prepare(
//       `UPDATE transactions
//        SET type = ?, amount = ?, category_id = ?, subcategory_id = ?, account_id = ?, description = ?, notes = ?, transaction_date = ?, updated_at = CURRENT_TIMESTAMP
//        WHERE id = ? AND user_id = ?`
//     );

//     await updateStmt
//       .bind(
//         type,
//         amount,
//         typeof categoryId === "number" && Number.isFinite(categoryId)
//           ? categoryId
//           : null,
//         typeof subcategoryId === "number" && Number.isFinite(subcategoryId)
//           ? subcategoryId
//           : null,
//         accountId,
//         description,
//         notes,
//         date,
//         transactionId,
//         user.id
//       )
//       .run();

//     if (shouldAdjustBalances) {
//       await updateAccountBalance(c.env.DB, accountId, amount, type);
//     }

//     if (uploadedFile && r2Key) {
//       const fileType = uploadedFile.type.startsWith("image/")
//         ? "image"
//         : uploadedFile.type === "application/pdf"
//         ? "pdf"
//         : "other";

//       const attachmentStmt = c.env.DB.prepare(
//         `INSERT INTO attachments 
//          (transaction_id, file_name, original_file_name, file_size, mime_type, file_type, r2_key, r2_url, description) 
//          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
//       );

//       await attachmentStmt
//         .bind(
//           transactionId,
//           r2Key.split("/").pop(),
//           uploadedFile.name,
//           uploadedFile.size,
//           uploadedFile.type,
//           fileType,
//           r2Key,
//           r2Url,
//           description || null
//         )
//         .run();
//     }

//     await c.env.DB.prepare("COMMIT").run();
//   } catch (error) {
//     await c.env.DB.prepare("ROLLBACK").run();

//     if (r2Key) {
//       try {
//         await c.env.BUCKET.delete(r2Key);
//       } catch (deleteError) {
//         console.error(
//           "Error al limpiar archivo en R2 después de fallo:",
//           deleteError
//         );
//       }
//     }

//     console.error("Error al actualizar transacción:", error);
//     return c.json(
//       {
//         success: false,
//         error: "Error al actualizar la transacción",
//       },
//       500
//     );
//   }

//   const getTransactionStmt = c.env.DB.prepare(
//     `SELECT * FROM transactions WHERE id = ? AND user_id = ?`
//   );
//   const transaction = await getTransactionStmt
//     .bind(transactionId, user.id)
//     .first();

//   const attachmentsStmt = c.env.DB.prepare(
//     `SELECT * FROM attachments WHERE transaction_id = ? ORDER BY uploaded_at DESC`
//   );
//   const { results: attachments } = await attachmentsStmt
//     .bind(transactionId)
//     .all();

//   return c.json({
//     success: true,
//     data: {
//       ...transaction,
//       attachments: attachments ?? [],
//     },
//   });
// });



export default transactions;
