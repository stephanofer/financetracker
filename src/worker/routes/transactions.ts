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
          t.id, t.type, t.amount, t.description, t.notes, t.transaction_date, t.created_at, t.updated_at, t.destination_account_id, t.debt_id,
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

    const totalStmt = c.env.DB.prepare(
      `SELECT 
         SUM(amount) as total_expenses
       FROM transactions 
       WHERE user_id = ? AND type = 'expense'`
    );
    const totalResult = await totalStmt.bind(userId).first<{
      total_expenses: number | null;
    }>();

    const balanceStmt = c.env.DB.prepare(
      `SELECT SUM(balance) as total_balance FROM accounts WHERE user_id = ? AND is_active = 1`
    );
    const balanceResult = await balanceStmt
      .bind(userId)
      .first<{ total_balance: number | null }>();

    const response = {
      success: true,
      data: {
        total: {
          total_expenses: totalResult?.total_expenses || 0,
          total_balance: balanceResult?.total_balance || 0,
        },
        results,
      },
      count: results.length,
    };
    return c.json(response);
  } catch (error) {
    console.error("[GET /summary] Error al obtener gastos:", error);
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
    console.log("[POST /] Body recibido:", body);
    const user = c.get("user");
    console.log("[POST /] Usuario:", user);
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
    const debtId = body["debtId"]
      ? parseInt(body["debtId"] as string)
      : null;
    const loanId = body["loanId"]
      ? parseInt(body["loanId"] as string)
      : null;
    const goalId = body["goalId"]
      ? parseInt(body["goalId"] as string)
      : null;
    const description = body["description"] || null;
    const type = body["type"] as string;
    const notes = body["notes"] || null;
    const date = body["date"] || new Date().toISOString();
    const file = body["file"] || null;
    console.log("[POST /] Datos parseados:", {
      amount,
      categoryId,
      subcategoryId,
      accountId,
      debtId,
      loanId,
      goalId,
      description,
      type,
      notes,
      date,
      file,
    });

    if (!amount || !userId || !type) {
      console.log(
        "[POST /] Error: amount, accountId, userId y type son requeridos"
      );
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
      console.log("[POST /] Error: Tipo de archivo no permitido", file);
      return c.json(
        {
          error: "Tipo de archivo no permitido",
          message: "Solo se aceptan imágenes o PDF",
        },
        400
      );
    }

    if (file && file instanceof File && file.size > MAX_FILE_SIZE) {
      console.log("[POST /] Error: Archivo muy grande", file);
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
      console.log("[POST /] Subiendo archivo a R2:", { r2Key, file });

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
      console.log("[POST /] Archivo subido. r2Url:", r2Url);
    }

    const stmt = c.env.DB.prepare(
      `INSERT INTO transactions 
       (user_id, type, amount, category_id, subcategory_id, account_id, debt_id, loan_id, goal_id, description, notes, transaction_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    console.log("[POST /] Ejecutando INSERT de transacción");

    const result = await stmt
      .bind(
        userId,
        type,
        amount,
        categoryId || null,
        subcategoryId || null,
        accountId,
        debtId || null,
        loanId || null,
        goalId || null,
        description || null,
        notes || null,
        date
      )
      .run();
    console.log("[POST /] Resultado INSERT:", result);

    const transactionId = result.meta.last_row_id;
    console.log("[POST /] transactionId:", transactionId);

    if (uploadedFile && r2Key) {
      const fileType = uploadedFile.type.startsWith("image/")
        ? "image"
        : uploadedFile.type === "application/pdf"
        ? "pdf"
        : "other";
      console.log("[POST /] Insertando attachment en DB", {
        transactionId,
        fileName: r2Key.split("/").pop(),
        originalName: uploadedFile.name,
        fileSize: uploadedFile.size,
        mimeType: uploadedFile.type,
        fileType,
      });

      try {
        const attachmentStmt = c.env.DB.prepare(
          `INSERT INTO attachments 
           (transaction_id, file_name, original_file_name, file_size, mime_type, file_type, r2_key, r2_url, description) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        );

        const attachmentResult = await attachmentStmt
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
        console.log("[POST /] Attachment insertado exitosamente:", attachmentResult);
      } catch (attachmentError) {
        console.error("[POST /] Error al insertar attachment:", attachmentError);
        // No retornamos error aquí para no fallar la transacción completa
        console.log("[POST /] Continuando a pesar del error en attachment");
      }
    }

    if (accountId) {
      console.log("[POST /] Actualizando balance de cuenta", {
        accountId,
        userId,
        amount,
        type,
      });
      try {
        await updateAccountBalance(c.env.DB, accountId, userId, amount, type);
        console.log("[POST /] Balance actualizado exitosamente");
      } catch (balanceError) {
        console.error("[POST /] Error al actualizar balance:", balanceError);
        return c.json(
          {
            success: false,
            error: "Error al actualizar el balance de la cuenta",
            message: balanceError instanceof Error ? balanceError.message : "Error desconocido",
          },
          500
        );
      }
    }

    // Si es un pago de deuda, actualizar la deuda
    if (type === "debt_payment" && debtId) {
      console.log("[POST /] Actualizando deuda", { debtId, amount });
      
      try {
        // Verificar que la deuda existe
        const checkDebtStmt = c.env.DB.prepare(
          `SELECT id, remaining_amount, original_amount FROM debts WHERE id = ? AND user_id = ?`
        );
        const existingDebt = await checkDebtStmt.bind(debtId, userId).first();
        console.log("[POST /] Deuda encontrada:", existingDebt);
        
        if (!existingDebt) {
          console.error("[POST /] Error: Deuda no encontrada", { debtId, userId });
          return c.json(
            {
              success: false,
              error: "Deuda no encontrada",
            },
            404
          );
        }
        
        // Actualizar remaining_amount de la deuda
        const updateDebtStmt = c.env.DB.prepare(
          `UPDATE debts 
           SET remaining_amount = remaining_amount - ?,
               status = CASE 
                 WHEN remaining_amount - ? <= 0 THEN 'paid'
                 WHEN remaining_amount - ? > 0 AND due_date < DATE('now') THEN 'overdue'
                 ELSE 'active'
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`
        );
        
        const updateDebtResult = await updateDebtStmt.bind(amount, amount, amount, debtId, userId).run();
        console.log("[POST /] Resultado actualización de deuda:", updateDebtResult);
        
        if (updateDebtResult.meta.changes === 0) {
          console.error("[POST /] Error: No se pudo actualizar la deuda", { debtId, userId });
        } else {
          console.log("[POST /] Deuda actualizada exitosamente");
        }
      } catch (debtError) {
        console.error("[POST /] Error al actualizar deuda:", debtError);
        return c.json(
          {
            success: false,
            error: "Error al actualizar la deuda",
            message: debtError instanceof Error ? debtError.message : "Error desconocido",
          },
          500
        );
      }
    }

    // Si es un pago de préstamo recibido, actualizar el préstamo
    if (type === "loan_payment" && loanId) {
      console.log("[POST /] Actualizando préstamo", { loanId, amount });
      
      try {
        // Verificar que el préstamo existe
        const checkLoanStmt = c.env.DB.prepare(
          `SELECT id, remaining_amount, original_amount FROM loans WHERE id = ? AND user_id = ?`
        );
        const existingLoan = await checkLoanStmt.bind(loanId, userId).first();
        console.log("[POST /] Préstamo encontrado:", existingLoan);
        
        if (!existingLoan) {
          console.error("[POST /] Error: Préstamo no encontrado", { loanId, userId });
          return c.json(
            {
              success: false,
              error: "Préstamo no encontrado",
            },
            404
          );
        }
        
        // Actualizar remaining_amount del préstamo
        const updateLoanStmt = c.env.DB.prepare(
          `UPDATE loans 
           SET remaining_amount = remaining_amount - ?,
               status = CASE 
                 WHEN remaining_amount - ? <= 0 THEN 'paid'
                 WHEN remaining_amount - ? > 0 AND due_date < DATE('now') THEN 'overdue'
                 WHEN remaining_amount - ? > 0 AND remaining_amount - ? < original_amount THEN 'partial'
                 ELSE 'active'
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`
        );
        
        const updateLoanResult = await updateLoanStmt.bind(amount, amount, amount, amount, amount, loanId, userId).run();
        console.log("[POST /] Resultado actualización de préstamo:", updateLoanResult);
        
        if (updateLoanResult.meta.changes === 0) {
          console.error("[POST /] Error: No se pudo actualizar el préstamo", { loanId, userId });
        } else {
          console.log("[POST /] Préstamo actualizado exitosamente");
        }
      } catch (loanError) {
        console.error("[POST /] Error al actualizar préstamo:", loanError);
        return c.json(
          {
            success: false,
            error: "Error al actualizar el préstamo",
            message: loanError instanceof Error ? loanError.message : "Error desconocido",
          },
          500
        );
      }
    }

    // Si es una contribución a meta de ahorro, actualizar la meta
    if (type === "goal_contribution" && goalId) {
      console.log("[POST /] Actualizando meta de ahorro", { goalId, amount });
      
      try {
        // Verificar que la meta existe
        const checkGoalStmt = c.env.DB.prepare(
          `SELECT id, current_amount, target_amount FROM savings_goals WHERE id = ? AND user_id = ?`
        );
        const existingGoal = await checkGoalStmt.bind(goalId, userId).first();
        console.log("[POST /] Meta encontrada:", existingGoal);
        
        if (!existingGoal) {
          console.error("[POST /] Error: Meta de ahorro no encontrada", { goalId, userId });
          return c.json(
            {
              success: false,
              error: "Meta de ahorro no encontrada",
            },
            404
          );
        }
        
        // Actualizar current_amount de la meta
        const updateGoalStmt = c.env.DB.prepare(
          `UPDATE savings_goals 
           SET current_amount = current_amount + ?,
               status = CASE 
                 WHEN current_amount + ? >= target_amount THEN 'achieved'
                 ELSE status
               END,
               completed_at = CASE 
                 WHEN current_amount + ? >= target_amount AND completed_at IS NULL THEN CURRENT_TIMESTAMP
                 ELSE completed_at
               END,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND user_id = ?`
        );
        
        const updateGoalResult = await updateGoalStmt.bind(amount, amount, amount, goalId, userId).run();
        console.log("[POST /] Resultado actualización de meta:", updateGoalResult);
        
        if (updateGoalResult.meta.changes === 0) {
          console.error("[POST /] Error: No se pudo actualizar la meta", { goalId, userId });
        } else {
          console.log("[POST /] Meta de ahorro actualizada exitosamente");
        }
      } catch (goalError) {
        console.error("[POST /] Error al actualizar meta de ahorro:", goalError);
        return c.json(
          {
            success: false,
            error: "Error al actualizar la meta de ahorro",
            message: goalError instanceof Error ? goalError.message : "Error desconocido",
          },
          500
        );
      }
    }

    console.log("[POST /] Obteniendo transacción final con ID:", transactionId);
    const getTransactionStmt = c.env.DB.prepare(
      `SELECT * FROM transactions WHERE id = ?`
    );
    const transaction = await getTransactionStmt.bind(transactionId).first();
    console.log("[POST /] Transacción final obtenida:", transaction);

    if (!transaction) {
      console.error("[POST /] Error: No se pudo recuperar la transacción creada");
      return c.json(
        {
          success: false,
          error: "Transacción creada pero no se pudo recuperar",
        },
        500
      );
    }

    const response = {
      success: true,
      data: transaction,
    };
    console.log("[POST /] Response final exitosa:", response);
    return c.json(response);
  } catch (error) {
    if (error instanceof Error && error.message.includes("boundary")) {
      console.log("[POST /] Error boundary:", error);
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
    console.log("[POST /] Error general:", error);
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
          t.id, t.type, t.amount, t.description, t.notes, t.transaction_date, t.created_at, t.updated_at, t.destination_account_id, t.debt_id,
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

    const response = {
      success: true,
      data: results,
      count: results.length,
    };
    return c.json(response);
  } catch (error) {
    console.error("[GET /] Error al obtener transacciones:", error);
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
          t.id, t.type, t.amount, t.description, t.notes, t.transaction_date, t.created_at, t.updated_at, t.destination_account_id, t.debt_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type,
        da.name as destination_account_name
      FROM transactions t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN subcategories sc ON t.subcategory_id = sc.id
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN accounts da ON t.destination_account_id = da.id
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

    // Si no hay cuenta destino, devolver destination_account_name como null
    if (!transaction.destination_account_id) {
      transaction.destination_account_name = null;
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
    console.error(
      "[GET /:id] Error al obtener detalles de la transacción:",
      error
    );
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
    `SELECT id, type, amount, account_id
     FROM transactions
     WHERE id = ? AND user_id = ?`
  );

  const transaction = await transactionStmt.bind(transactionId, user.id).first<{
    id: number;
    type: string;
    amount: number;
    account_id: number | null;
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

  const attachmentsStmt = c.env.DB.prepare(
    `SELECT id, r2_key FROM attachments WHERE transaction_id = ?`
  );
  const { results: attachments } = await attachmentsStmt
    .bind(transactionId)
    .all<{ id: number; r2_key: string | null }>();

  const batchQueries = [];

  const revertStmt =
    transaction.account_id !== null
      ? prepareRevertAccountBalance(
          c.env.DB,
          transaction.account_id,
          user.id,
          Number(transaction.amount),
          transaction.type
        )
      : null;

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
    console.error("[DELETE /:id] Error al eliminar transacción:", error);
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
            `[DELETE /:id] Error al eliminar archivo de R2 para attachment ${attachment.id}:`,
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

transactions.post("/transfer", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;
    const body = await c.req.json();

    const {
      amount,
      sourceAccountId,
      destinationAccountId,
      description,
      notes,
      date,
    } = body;

    // Validación: Campos requeridos
    if (!amount || !sourceAccountId || !destinationAccountId) {
      return c.json(
        {
          success: false,
          error: "amount, sourceAccountId y destinationAccountId son requeridos",
        },
        400
      );
    }

    // Validación: Monto positivo
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return c.json(
        {
          success: false,
          error: "El monto debe ser un número positivo mayor a 0",
        },
        400
      );
    }

    // Validación: No transferir a la misma cuenta
    if (sourceAccountId === destinationAccountId) {
      return c.json(
        {
          success: false,
          error: "No puedes transferir a la misma cuenta",
        },
        400
      );
    }

    // Verificar que ambas cuentas existan y pertenezcan al usuario
    const sourceAccountStmt = c.env.DB.prepare(
      `SELECT id, name, balance, is_active FROM accounts WHERE id = ? AND user_id = ?`
    );
    const sourceAccount = await sourceAccountStmt
      .bind(sourceAccountId, userId)
      .first<{
        id: number;
        name: string;
        balance: number;
        is_active: number;
      }>();

    if (!sourceAccount) {
      return c.json(
        {
          success: false,
          error: "Cuenta de origen no encontrada",
        },
        404
      );
    }

    // Validación: Cuenta de origen activa
    if (!sourceAccount.is_active) {
      return c.json(
        {
          success: false,
          error: "La cuenta de origen está inactiva",
        },
        400
      );
    }

    // Validación: Saldo suficiente
    if (sourceAccount.balance < transferAmount) {
      return c.json(
        {
          success: false,
          error: `Saldo insuficiente en ${sourceAccount.name}. Saldo disponible: ${sourceAccount.balance}`,
        },
        400
      );
    }

    const destinationAccountStmt = c.env.DB.prepare(
      `SELECT id, name, is_active FROM accounts WHERE id = ? AND user_id = ?`
    );
    const destinationAccount = await destinationAccountStmt
      .bind(destinationAccountId, userId)
      .first<{ id: number; name: string; is_active: number }>();

    if (!destinationAccount) {
      return c.json(
        {
          success: false,
          error: "Cuenta de destino no encontrada",
        },
        404
      );
    }

    // Validación: Cuenta de destino activa
    if (!destinationAccount.is_active) {
      return c.json(
        {
          success: false,
          error: "La cuenta de destino está inactiva",
        },
        400
      );
    }

    const transactionDate = date || new Date().toISOString();
    const transferDescription =
      description ||
      `Transferencia de ${sourceAccount.name} a ${destinationAccount.name}`;

    // Crear la transacción de transferencia
    const insertTransactionStmt = c.env.DB.prepare(
      `INSERT INTO transactions 
       (user_id, type, amount, account_id, destination_account_id, description, notes, transaction_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );

    // Preparar las actualizaciones de balance en un batch
    const decreaseSourceBalance = c.env.DB.prepare(
      `UPDATE accounts 
       SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`
    ).bind(transferAmount, sourceAccountId, userId);

    const increaseDestinationBalance = c.env.DB.prepare(
      `UPDATE accounts 
       SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND user_id = ?`
    ).bind(transferAmount, destinationAccountId, userId);

    // Ejecutar todo en un batch para garantizar atomicidad
    const batchResults = await c.env.DB.batch([
      insertTransactionStmt.bind(
        userId,
        "transfer",
        transferAmount,
        sourceAccountId,
        destinationAccountId,
        transferDescription,
        notes || null,
        transactionDate
      ),
      decreaseSourceBalance,
      increaseDestinationBalance,
    ]);

    // Verificar que todas las operaciones fueron exitosas
    const failed = batchResults.find((r) => !r.success);
    if (failed) {
      return c.json(
        {
          success: false,
          error: "Error al procesar la transferencia",
        },
        500
      );
    }

    const transactionId = batchResults[0].meta.last_row_id;

    // Obtener la transacción creada
    const getTransactionStmt = c.env.DB.prepare(
      `SELECT 
        t.id, t.type, t.amount, t.description, t.notes, t.transaction_date, 
        t.created_at, t.updated_at,
        sa.name as source_account_name,
        da.name as destination_account_name
       FROM transactions t
       LEFT JOIN accounts sa ON t.account_id = sa.id
       LEFT JOIN accounts da ON t.destination_account_id = da.id
       WHERE t.id = ?`
    );

    const transaction = await getTransactionStmt.bind(transactionId).first();

    return c.json({
      success: true,
      message: "Transferencia realizada exitosamente",
      data: transaction,
    });
  } catch (error) {
    console.error("[POST /transfer] Error al realizar transferencia:", error);
    return c.json(
      {
        success: false,
        error: "Error al realizar la transferencia",
        message: error instanceof Error ? error.message : "Error desconocido",
      },
      500
    );
  }
});

export default transactions;
