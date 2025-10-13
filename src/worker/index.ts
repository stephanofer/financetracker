import { Hono } from "hono";
import { Category, Account, Subcategory } from "@/react-app/dashboard/types";

// Tipos Attachment y Transaction disponibles si se necesitan en el futuro
// import type { Attachment, Transaction } from "@/react-app/dashboard/types";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/categories", async (c) => {
  try {
    const type = c.req.query("type"); 

    let query = "SELECT * FROM categories WHERE is_active = 1";
    const params: string[] = [];

    if (type && (type === "ingreso" || type === "gasto")) {
      query += " AND type = ?";
      params.push(type);
    }

    query += " ORDER BY order_index ASC";

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all<Category>();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener las categorías",
      },
      500
    );
  }
});


/**
 * GET /api/subcategories
 * Obtiene todas las subcategorías, opcionalmente filtradas por categoría
 * Query params: categoryId (optional): number
 */
app.get("/api/subcategories", async (c) => {
  try {
    const categoryId = c.req.query("categoryId");

    let query = "SELECT * FROM subcategories WHERE is_active = 1";
    const params: string[] = [];

    if (categoryId) {
      query += " AND category_id = ?";
      params.push(categoryId);
    }

    query += " ORDER BY order_index ASC";

    const stmt = c.env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all<Subcategory>();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener las subcategorías",
      },
      500
    );
  }
});

/**
 * GET /api/accounts
 * Obtiene todas las cuentas de un usuario
 * Query params: userId (required): number
 */
app.get("/api/accounts", async (c) => {
  try {
    const userId = c.req.query("userId");

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "El parámetro userId es requerido",
        },
        400
      );
    }

    const stmt = c.env.DB.prepare(
      `SELECT * FROM accounts 
       WHERE user_id = ? AND is_active = 1 
       ORDER BY created_at DESC`
    );
    const { results } = await stmt.bind(userId).all<Account>();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener cuentas:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener las cuentas",
      },
      500
    );
  }
});

/**
 * GET /api/accounts/:id
 * Obtiene una cuenta específica por ID
 * Query params: userId (required): number - para validar permisos
 */
app.get("/api/accounts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const userId = c.req.query("userId");

    if (!userId) {
      return c.json(
        {
          success: false,
          error: "El parámetro userId es requerido",
        },
        400
      );
    }

    const stmt = c.env.DB.prepare(
      "SELECT * FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1"
    );
    const result = await stmt.bind(id, userId).first<Account>();

    if (!result) {
      return c.json(
        {
          success: false,
          error: "Cuenta no encontrada",
        },
        404
      );
    }

    return c.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Error al obtener cuenta:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener la cuenta",
      },
      500
    );
  }
});


/**
 * POST /api/transaction/income
 * Crea una nueva transacción de ingreso
 */
app.post("/api/transaction/income", async (c) => {
  const body = await c.req.parseBody();

  // Parse form data to proper types
  const amount = body["amount"] ? parseFloat(body["amount"] as string) : null;
  const categoryId = body["categoryId"] ? parseInt(body["categoryId"] as string) : null;
  const subcategoryId = body["subcategoryId"] ? parseInt(body["subcategoryId"] as string) : null;
  const accountId = body["accountId"]
    ? parseInt(body["accountId"] as string)
    : null;
  const description = body["description"] || null;
  const notes = body["notes"] || null;
  const userId = body["userId"] ? parseInt(body["userId"] as string) : null;
  const date = body["date"] || new Date().toISOString();
  const file = body["file"] || null;
  console.log("Valores a insertar:", {
    userId,
    categoryId,
    subcategoryId,
    accountId,
    amount,
  });

  if (!amount || !accountId || !userId) {
    return c.json(
      {
        success: false,
        error: "amount, accountId, userId y date son requeridos",
      },
      400
    );
  }

  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (file && file instanceof File && !allowedTypes.includes(file.type)) {
    return c.json(
      {
        error: "Tipo de archivo no permitido",
        message: "Solo se aceptan imágenes o PDF",
      },
      400
    );
  }

  // Validar tamaño (5MB)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file && file instanceof File && file.size > MAX_SIZE) {
    return c.json(
      {
        error: "Archivo muy grande",
        message: "El archivo debe pesar menos de 5MB",
      },
      400
    );
  }

  // Solo procesar archivo si existe
  let r2Key: string | null = null;
  let r2Url: string | null = null;
  let uploadedFile: File | null = null;

  if (file && file instanceof File) {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split(".").pop();
    r2Key = `uploads/${timestamp}-${randomString}.${fileExtension}`;

    // 5. Subir archivo a R2
    await c.env.BUCKET.put(r2Key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: "user",
      },
    });

    // Generar URL pública (ajustar según tu configuración de R2)
    r2Url = `https://your-r2-domain.com/${r2Key}`;
    uploadedFile = file;
  }

  try {
    // Insertar la transacción
    const stmt = c.env.DB.prepare(
      `INSERT INTO transactions 
       (user_id, type, amount, category_id, subcategory_id, account_id, description, notes, transaction_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    const result = await stmt
      .bind(
        userId,
        "expense",
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

    // Si hay archivo, guardar en la tabla attachments
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
          r2Key.split("/").pop(), // nombre del archivo en R2
          uploadedFile.name, // nombre original
          uploadedFile.size,
          uploadedFile.type,
          fileType,
          r2Key,
          r2Url,
          description || null
        )
        .run();
    }

    return c.json({
      success: true,
      id: transactionId,
      attachment: uploadedFile ? { r2_key: r2Key, r2_url: r2Url } : null,
    });
  } catch (error) {
    console.error("Error al insertar transacción:", error);
    return c.json(
      {
        success: false,
        error: "Error al crear la transacción",
      },
      500
    );
  }
});

/**
 * GET /api/transactions/:id/attachments
 * Obtiene todos los archivos adjuntos de una transacción
 */
app.get("/api/transactions/:id/attachments", async (c) => {
  try {
    const transactionId = c.req.param("id");

    const stmt = c.env.DB.prepare(
      `SELECT * FROM attachments WHERE transaction_id = ? ORDER BY uploaded_at DESC`
    );

    const { results } = await stmt.bind(transactionId).all();

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error("Error al obtener archivos adjuntos:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los archivos adjuntos",
      },
      500
    );
  }
});

/**
 * DELETE /api/attachments/:id
 * Elimina un archivo adjunto (tanto de la BD como de R2)
 */
app.delete("/api/attachments/:id", async (c) => {
  try {
    const attachmentId = c.req.param("id");

    // Obtener información del archivo antes de eliminarlo
    const getStmt = c.env.DB.prepare(
      `SELECT r2_key FROM attachments WHERE id = ?`
    );
    const attachment = await getStmt.bind(attachmentId).first();

    if (!attachment) {
      return c.json(
        {
          success: false,
          error: "Archivo adjunto no encontrado",
        },
        404
      );
    }

    // Eliminar de R2
    await c.env.BUCKET.delete(attachment.r2_key as string);

    // Eliminar de la base de datos
    const deleteStmt = c.env.DB.prepare(
      `DELETE FROM attachments WHERE id = ?`
    );
    await deleteStmt.bind(attachmentId).run();

    return c.json({
      success: true,
      message: "Archivo adjunto eliminado correctamente",
    });
  } catch (error) {
    console.error("Error al eliminar archivo adjunto:", error);
    return c.json(
      {
        success: false,
        error: "Error al eliminar el archivo adjunto",
      },
      500
    );
  }
});

/**
 * GET /api/attachments/:id/download
 * Genera una URL temporal para descargar un archivo adjunto
 */
app.get("/api/attachments/:id/download", async (c) => {
  try {
    const attachmentId = c.req.param("id");

    // Obtener información del archivo
    const stmt = c.env.DB.prepare(
      `SELECT r2_key, file_name, mime_type FROM attachments WHERE id = ?`
    );
    const attachment = await stmt.bind(attachmentId).first();

    if (!attachment) {
      return c.json(
        {
          success: false,
          error: "Archivo adjunto no encontrado",
        },
        404
      );
    }

    // Obtener el archivo de R2
    const object = await c.env.BUCKET.get(attachment.r2_key as string);

    if (!object) {
      return c.json(
        {
          success: false,
          error: "Archivo no encontrado en el almacenamiento",
        },
        404
      );
    }

    // Retornar el archivo con los headers apropiados
    return new Response(object.body, {
      headers: {
        "Content-Type": attachment.mime_type as string,
        "Content-Disposition": `attachment; filename="${attachment.file_name}"`,
      },
    });
  } catch (error) {
    console.error("Error al descargar archivo adjunto:", error);
    return c.json(
      {
        success: false,
        error: "Error al descargar el archivo adjunto",
      },
      500
    );
  }
});

export default app;
