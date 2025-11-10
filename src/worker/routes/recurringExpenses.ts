import { Hono } from "hono";
import { AppContext, RecurringExpenseWithDetails, RecurringExpenseHistory } from "../types";

const recurringExpenses = new Hono<AppContext>();

// Función para calcular la próxima fecha de cargo
const calculateNextChargeDate = (
  frequency: "weekly" | "biweekly" | "monthly" | "annual",
  chargeDay: number,
  lastChargeDate?: string | null
): string => {
  const today = new Date();
  let nextDate = new Date(lastChargeDate || today);

  switch (frequency) {
    case "weekly":
      // chargeDay es 1-7 (1=Lunes, 7=Domingo)
      nextDate = new Date(today);
      nextDate.setDate(today.getDate() + ((chargeDay - 1 - today.getDay() + 7) % 7));
      if (nextDate <= today) {
        nextDate.setDate(nextDate.getDate() + 7);
      }
      break;

    case "biweekly":
      // Similar a semanal pero cada 2 semanas
      nextDate = new Date(today);
      nextDate.setDate(today.getDate() + ((chargeDay - 1 - today.getDay() + 7) % 7));
      if (nextDate <= today) {
        nextDate.setDate(nextDate.getDate() + 14);
      }
      break;

    case "monthly":
      // chargeDay es el día del mes (1-31)
      nextDate = new Date(today.getFullYear(), today.getMonth(), chargeDay);
      if (nextDate <= today) {
        nextDate = new Date(today.getFullYear(), today.getMonth() + 1, chargeDay);
      }
      break;

    case "annual":
      // chargeDay es el día del año (1-365)
      nextDate = new Date(today.getFullYear(), 0, chargeDay);
      if (nextDate <= today) {
        nextDate = new Date(today.getFullYear() + 1, 0, chargeDay);
      }
      break;
  }

  return nextDate.toISOString().split("T")[0];
};

// Función para validar charge_day según frequency
const validateChargeDay = (
  frequency: "weekly" | "biweekly" | "monthly" | "annual",
  chargeDay: number
): boolean => {
  switch (frequency) {
    case "weekly":
    case "biweekly":
      return chargeDay >= 1 && chargeDay <= 7;
    case "monthly":
      return chargeDay >= 1 && chargeDay <= 31;
    case "annual":
      return chargeDay >= 1 && chargeDay <= 365;
    default:
      return false;
  }
};

// Normalizar gasto recurrente
const normalizeRecurringExpense = (row: RecurringExpenseWithDetails) => {
  return {
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    frequency: row.frequency,
    charge_day: row.charge_day,
    status: row.status,
    next_charge_date: row.next_charge_date,
    last_charge_date: row.last_charge_date,
    notify_3_days: Boolean(row.notify_3_days),
    notify_1_day: Boolean(row.notify_1_day),
    notify_same_day: Boolean(row.notify_same_day),
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.category_id
      ? {
          id: row.category_id,
          name: row.category_name,
          color: row.category_color,
          icon: row.category_icon,
        }
      : null,
    subcategory: row.subcategory_id
      ? {
          id: row.subcategory_id,
          name: row.subcategory_name,
        }
      : null,
    account: {
      id: row.account_id,
      name: row.account_name,
      type: row.account_type,
      icon: row.account_icon,
      color: row.account_color,
    },
  };
};

// GET / - Obtener todos los gastos recurrentes del usuario
recurringExpenses.get("/", async (c) => {
  try {
    const user = c.get("user");
    const status = c.req.query("status"); // Filtro opcional por estado

    let query = `
      SELECT 
        re.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type,
        a.icon as account_icon,
        a.color as account_color
      FROM recurring_expenses re
      LEFT JOIN categories c ON re.category_id = c.id
      LEFT JOIN subcategories sc ON re.subcategory_id = sc.id
      INNER JOIN accounts a ON re.account_id = a.id
      WHERE re.user_id = ?
    `;

    const params: (number | string)[] = [user.id];

    if (status && ["active", "paused", "cancelled"].includes(status)) {
      query += " AND re.status = ?";
      params.push(status);
    }

    query += " ORDER BY re.next_charge_date ASC, re.name ASC";

    const stmt = c.env.DB.prepare(query);
    const result = await stmt.bind(...params).all<RecurringExpenseWithDetails>();

    const normalized = result.results.map((row) => normalizeRecurringExpense(row));

    // Calcular resumen
    const summaryStmt = c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) as paused_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'active' AND frequency = 'monthly' THEN amount ELSE 0 END) as total_monthly_active,
        SUM(CASE WHEN status = 'active' AND frequency = 'weekly' THEN amount * 4.33 ELSE 0 END) as total_weekly_monthly_equivalent,
        SUM(CASE WHEN status = 'active' AND frequency = 'biweekly' THEN amount * 2.17 ELSE 0 END) as total_biweekly_monthly_equivalent,
        SUM(CASE WHEN status = 'active' AND frequency = 'annual' THEN amount / 12 ELSE 0 END) as total_annual_monthly_equivalent
      FROM recurring_expenses
      WHERE user_id = ?
    `);

    const summaryResult = await summaryStmt.bind(user.id).first<{
      total_count: number;
      active_count: number;
      paused_count: number;
      cancelled_count: number;
      total_monthly_active: number;
      total_weekly_monthly_equivalent: number;
      total_biweekly_monthly_equivalent: number;
      total_annual_monthly_equivalent: number;
    }>();

    const monthly_estimate =
      Number(summaryResult?.total_monthly_active || 0) +
      Number(summaryResult?.total_weekly_monthly_equivalent || 0) +
      Number(summaryResult?.total_biweekly_monthly_equivalent || 0) +
      Number(summaryResult?.total_annual_monthly_equivalent || 0);

    return c.json({
      success: true,
      data: {
        summary: {
          total: Number(summaryResult?.total_count || 0),
          active: Number(summaryResult?.active_count || 0),
          paused: Number(summaryResult?.paused_count || 0),
          cancelled: Number(summaryResult?.cancelled_count || 0),
          monthly_estimate: Number(monthly_estimate.toFixed(2)),
        },
        recurring_expenses: normalized,
      },
      count: normalized.length,
    });
  } catch (error) {
    console.error("Error al obtener gastos recurrentes:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener los gastos recurrentes",
      },
      500
    );
  }
});

// POST / - Crear un nuevo gasto recurrente
recurringExpenses.post("/", async (c) => {
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

    // Validación de campos requeridos
    const requiredFields = ["name", "amount", "frequency", "charge_day", "account_id"];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        return c.json(
          {
            success: false,
            error: `El campo '${field}' es requerido`,
          },
          400
        );
      }
    }

    // Normalización y validación de valores
    const name = String(body.name).trim();
    const amount = Number(body.amount);
    const frequency = String(body.frequency).trim() as "weekly" | "biweekly" | "monthly" | "annual";
    const charge_day = Number(body.charge_day);
    const category_id = body.category_id ? Number(body.category_id) : null;
    const subcategory_id = body.subcategory_id ? Number(body.subcategory_id) : null;
    const account_id = Number(body.account_id);
    const status = body.status ? String(body.status) : "active";
    const notify_3_days = body.notify_3_days !== undefined ? Boolean(body.notify_3_days) : true;
    const notify_1_day = body.notify_1_day !== undefined ? Boolean(body.notify_1_day) : true;
    const notify_same_day = body.notify_same_day !== undefined ? Boolean(body.notify_same_day) : true;

    // Validaciones específicas
    if (!name) {
      return c.json({ success: false, error: "El nombre no puede estar vacío" }, 400);
    }

    if (isNaN(amount) || amount <= 0) {
      return c.json({ success: false, error: "El monto debe ser un número positivo" }, 400);
    }

    if (!["weekly", "biweekly", "monthly", "annual"].includes(frequency)) {
      return c.json(
        {
          success: false,
          error: "Frecuencia inválida. Debe ser: weekly, biweekly, monthly o annual",
        },
        400
      );
    }

    if (!validateChargeDay(frequency, charge_day)) {
      return c.json(
        {
          success: false,
          error: `El día de cargo no es válido para la frecuencia '${frequency}'`,
        },
        400
      );
    }

    if (!["active", "paused", "cancelled"].includes(status)) {
      return c.json(
        {
          success: false,
          error: "Estado inválido. Debe ser: active, paused o cancelled",
        },
        400
      );
    }

    // Verificar que la cuenta existe y pertenece al usuario
    const accountCheck = await c.env.DB.prepare(
      "SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1"
    )
      .bind(account_id, user.id)
      .first();

    if (!accountCheck) {
      return c.json(
        {
          success: false,
          error: "La cuenta especificada no existe o no está activa",
        },
        404
      );
    }

    // Verificar categoría si se proporciona
    if (category_id) {
      const categoryCheck = await c.env.DB.prepare(
        "SELECT id, type FROM categories WHERE id = ? AND user_id = ? AND is_active = 1"
      )
        .bind(category_id, user.id)
        .first<{ id: number; type: string }>();

      if (!categoryCheck) {
        return c.json(
          {
            success: false,
            error: "La categoría especificada no existe o no está activa",
          },
          404
        );
      }

      // Las gastos recurrentes deben ser de tipo expense
      if (categoryCheck.type !== "expense") {
        return c.json(
          {
            success: false,
            error: "La categoría debe ser de tipo 'expense' (gasto)",
          },
          400
        );
      }
    }

    // Verificar subcategoría si se proporciona
    if (subcategory_id) {
      if (!category_id) {
        return c.json(
          {
            success: false,
            error: "Debe especificar una categoría para usar una subcategoría",
          },
          400
        );
      }

      const subcategoryCheck = await c.env.DB.prepare(
        "SELECT id FROM subcategories WHERE id = ? AND category_id = ? AND user_id = ? AND is_active = 1"
      )
        .bind(subcategory_id, category_id, user.id)
        .first();

      if (!subcategoryCheck) {
        return c.json(
          {
            success: false,
            error: "La subcategoría especificada no existe, no pertenece a la categoría o no está activa",
          },
          404
        );
      }
    }

    // Calcular la próxima fecha de cargo
    const next_charge_date = calculateNextChargeDate(frequency, charge_day);

    // Insertar en la base de datos
    const stmt = c.env.DB.prepare(`
      INSERT INTO recurring_expenses (
        user_id, name, amount, frequency, charge_day, category_id, subcategory_id, 
        account_id, status, next_charge_date, notify_3_days, notify_1_day, notify_same_day,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = await stmt
      .bind(
        user.id,
        name,
        amount,
        frequency,
        charge_day,
        category_id,
        subcategory_id,
        account_id,
        status,
        next_charge_date,
        notify_3_days ? 1 : 0,
        notify_1_day ? 1 : 0,
        notify_same_day ? 1 : 0
      )
      .run();

    // Obtener el gasto recurrente recién creado con detalles
    const expenseId = result.meta.last_row_id;
    const expenseRow = await c.env.DB.prepare(`
      SELECT 
        re.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type,
        a.icon as account_icon,
        a.color as account_color
      FROM recurring_expenses re
      LEFT JOIN categories c ON re.category_id = c.id
      LEFT JOIN subcategories sc ON re.subcategory_id = sc.id
      INNER JOIN accounts a ON re.account_id = a.id
      WHERE re.id = ?
    `)
      .bind(expenseId)
      .first<RecurringExpenseWithDetails>();

    return c.json(
      {
        success: true,
        data: normalizeRecurringExpense(expenseRow!),
      },
      201
    );
  } catch (error) {
    console.error("Error al crear gasto recurrente:", error);
    return c.json(
      {
        success: false,
        error: "Error al crear el gasto recurrente",
      },
      500
    );
  }
});

// GET /:id - Obtener detalle de un gasto recurrente específico
recurringExpenses.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const expenseId = parseInt(c.req.param("id"));

    // Validar que el ID sea un número válido
    if (isNaN(expenseId)) {
      return c.json(
        {
          success: false,
          error: "ID de gasto recurrente inválido",
        },
        400
      );
    }

    // Obtener el gasto recurrente con detalles
    const expenseRow = await c.env.DB.prepare(`
      SELECT 
        re.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type,
        a.icon as account_icon,
        a.color as account_color
      FROM recurring_expenses re
      LEFT JOIN categories c ON re.category_id = c.id
      LEFT JOIN subcategories sc ON re.subcategory_id = sc.id
      INNER JOIN accounts a ON re.account_id = a.id
      WHERE re.id = ? AND re.user_id = ?
    `)
      .bind(expenseId, user.id)
      .first<RecurringExpenseWithDetails>();

    if (!expenseRow) {
      return c.json(
        {
          success: false,
          error: "Gasto recurrente no encontrado",
        },
        404
      );
    }

    // Obtener historial de transacciones relacionadas (si existe)
    // Esto requeriría un campo adicional en transactions o una tabla de relación
    // Por ahora, buscaremos transacciones que coincidan con el monto, fecha y cuenta
    const historyStmt = c.env.DB.prepare(`
      SELECT 
        t.id,
        t.amount,
        t.transaction_date,
        t.description,
        t.notes,
        t.created_at
      FROM transactions t
      WHERE t.user_id = ?
        AND t.account_id = ?
        AND t.type = 'expense'
        AND t.amount = ?
        AND t.category_id = ?
      ORDER BY t.transaction_date DESC
      LIMIT 50
    `);

    const history = await historyStmt
      .bind(user.id, expenseRow.account_id, expenseRow.amount, expenseRow.category_id || null)
      .all<RecurringExpenseHistory>();

    const normalizedHistory = history.results.map((h) => ({
      id: h.id,
      amount: Number(h.amount),
      transaction_date: h.transaction_date,
      description: h.description,
      notes: h.notes,
      created_at: h.created_at,
    }));

    // Calcular estadísticas con manejo correcto de fechas
    // Usar solo la parte de fecha (sin horas) para evitar problemas de timezone
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const createdDate = new Date(expenseRow.created_at);
    createdDate.setHours(0, 0, 0, 0);

    const daysSinceCreation = Math.floor(
      (today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    let daysUntilNextCharge: number | null = null;
    if (expenseRow.next_charge_date) {
      const nextChargeDate = new Date(expenseRow.next_charge_date);
      nextChargeDate.setHours(0, 0, 0, 0);
      daysUntilNextCharge = Math.floor(
        (nextChargeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
    }

    return c.json({
      success: true,
      data: {
        expense: normalizeRecurringExpense(expenseRow),
        history: {
          transactions: normalizedHistory,
          count: normalizedHistory.length,
        },
        statistics: {
          days_since_creation: Math.max(0, daysSinceCreation), // Nunca negativo
          days_until_next_charge: daysUntilNextCharge,
          is_due_soon: daysUntilNextCharge !== null && daysUntilNextCharge >= 0 && daysUntilNextCharge <= 3,
          total_spent_history: normalizedHistory.reduce((sum, t) => sum + t.amount, 0),
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de gasto recurrente:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener el detalle del gasto recurrente",
      },
      500
    );
  }
});

// PUT /:id - Actualizar un gasto recurrente
recurringExpenses.put("/:id", async (c) => {
  try {
    const user = c.get("user");
    const expenseId = parseInt(c.req.param("id"));

    // Validar que el ID sea un número válido
    if (isNaN(expenseId)) {
      return c.json(
        {
          success: false,
          error: "ID de gasto recurrente inválido",
        },
        400
      );
    }

    // Verificar que el gasto existe y pertenece al usuario
    const existingExpense = await c.env.DB.prepare(
      "SELECT * FROM recurring_expenses WHERE id = ? AND user_id = ?"
    )
      .bind(expenseId, user.id)
      .first();

    if (!existingExpense) {
      return c.json(
        {
          success: false,
          error: "Gasto recurrente no encontrado",
        },
        404
      );
    }

    // Intentar parsear el JSON
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

    // Normalización de valores opcionales
    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    const amount = body.amount !== undefined ? Number(body.amount) : undefined;
    const frequency = body.frequency !== undefined ? String(body.frequency).trim() : undefined;
    const charge_day = body.charge_day !== undefined ? Number(body.charge_day) : undefined;
    const category_id = body.category_id !== undefined ? (body.category_id ? Number(body.category_id) : null) : undefined;
    const subcategory_id = body.subcategory_id !== undefined ? (body.subcategory_id ? Number(body.subcategory_id) : null) : undefined;
    const account_id = body.account_id !== undefined ? Number(body.account_id) : undefined;
    const status = body.status !== undefined ? String(body.status) : undefined;
    const notify_3_days = body.notify_3_days !== undefined ? Boolean(body.notify_3_days) : undefined;
    const notify_1_day = body.notify_1_day !== undefined ? Boolean(body.notify_1_day) : undefined;
    const notify_same_day = body.notify_same_day !== undefined ? Boolean(body.notify_same_day) : undefined;

    // Validaciones específicas
    if (name !== undefined && !name) {
      return c.json({ success: false, error: "El nombre no puede estar vacío" }, 400);
    }

    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      return c.json({ success: false, error: "El monto debe ser un número positivo" }, 400);
    }

    if (frequency !== undefined && !["weekly", "biweekly", "monthly", "annual"].includes(frequency)) {
      return c.json(
        {
          success: false,
          error: "Frecuencia inválida. Debe ser: weekly, biweekly, monthly o annual",
        },
        400
      );
    }

    if (charge_day !== undefined && frequency !== undefined) {
      if (!validateChargeDay(frequency as "weekly" | "biweekly" | "monthly" | "annual", charge_day)) {
        return c.json(
          {
            success: false,
            error: `El día de cargo no es válido para la frecuencia '${frequency}'`,
          },
          400
        );
      }
    }

    if (status !== undefined && !["active", "paused", "cancelled"].includes(status)) {
      return c.json(
        {
          success: false,
          error: "Estado inválido. Debe ser: active, paused o cancelled",
        },
        400
      );
    }

    // Verificar cuenta si se actualiza
    if (account_id !== undefined) {
      const accountCheck = await c.env.DB.prepare(
        "SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1"
      )
        .bind(account_id, user.id)
        .first();

      if (!accountCheck) {
        return c.json(
          {
            success: false,
            error: "La cuenta especificada no existe o no está activa",
          },
          404
        );
      }
    }

    // Verificar categoría si se actualiza
    if (category_id !== undefined && category_id !== null) {
      const categoryCheck = await c.env.DB.prepare(
        "SELECT id, type FROM categories WHERE id = ? AND user_id = ? AND is_active = 1"
      )
        .bind(category_id, user.id)
        .first<{ id: number; type: string }>();

      if (!categoryCheck) {
        return c.json(
          {
            success: false,
            error: "La categoría especificada no existe o no está activa",
          },
          404
        );
      }

      if (categoryCheck.type !== "expense") {
        return c.json(
          {
            success: false,
            error: "La categoría debe ser de tipo 'expense' (gasto)",
          },
          400
        );
      }
    }

    // Verificar subcategoría si se actualiza
    if (subcategory_id !== undefined && subcategory_id !== null) {
      const finalCategoryId = category_id !== undefined ? category_id : existingExpense.category_id;

      if (!finalCategoryId) {
        return c.json(
          {
            success: false,
            error: "Debe especificar una categoría para usar una subcategoría",
          },
          400
        );
      }

      const subcategoryCheck = await c.env.DB.prepare(
        "SELECT id FROM subcategories WHERE id = ? AND category_id = ? AND user_id = ? AND is_active = 1"
      )
        .bind(subcategory_id, finalCategoryId, user.id)
        .first();

      if (!subcategoryCheck) {
        return c.json(
          {
            success: false,
            error: "La subcategoría especificada no existe, no pertenece a la categoría o no está activa",
          },
          404
        );
      }
    }

    // Construir la consulta de actualización dinámicamente
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (amount !== undefined) {
      updates.push("amount = ?");
      params.push(amount);
    }
    if (frequency !== undefined) {
      updates.push("frequency = ?");
      params.push(frequency);
    }
    if (charge_day !== undefined) {
      updates.push("charge_day = ?");
      params.push(charge_day);
    }
    if (category_id !== undefined) {
      updates.push("category_id = ?");
      params.push(category_id);
    }
    if (subcategory_id !== undefined) {
      updates.push("subcategory_id = ?");
      params.push(subcategory_id);
    }
    if (account_id !== undefined) {
      updates.push("account_id = ?");
      params.push(account_id);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);
    }
    if (notify_3_days !== undefined) {
      updates.push("notify_3_days = ?");
      params.push(notify_3_days ? 1 : 0);
    }
    if (notify_1_day !== undefined) {
      updates.push("notify_1_day = ?");
      params.push(notify_1_day ? 1 : 0);
    }
    if (notify_same_day !== undefined) {
      updates.push("notify_same_day = ?");
      params.push(notify_same_day ? 1 : 0);
    }

    // Recalcular next_charge_date si cambió frequency o charge_day
    if (frequency !== undefined || charge_day !== undefined) {
      const finalFrequency = (frequency || existingExpense.frequency) as "weekly" | "biweekly" | "monthly" | "annual";
      const finalChargeDay = (charge_day !== undefined ? charge_day : existingExpense.charge_day) as number;
      const next_charge_date = calculateNextChargeDate(
        finalFrequency,
        finalChargeDay,
        existingExpense.last_charge_date as string | null
      );
      updates.push("next_charge_date = ?");
      params.push(next_charge_date);
    }

    if (updates.length === 0) {
      return c.json(
        {
          success: false,
          error: "No se proporcionaron campos para actualizar",
        },
        400
      );
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    const updateQuery = `
      UPDATE recurring_expenses 
      SET ${updates.join(", ")}
      WHERE id = ? AND user_id = ?
    `;

    params.push(expenseId, user.id);

    await c.env.DB.prepare(updateQuery).bind(...params).run();

    // Obtener el gasto actualizado con detalles
    const updatedExpense = await c.env.DB.prepare(`
      SELECT 
        re.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type,
        a.icon as account_icon,
        a.color as account_color
      FROM recurring_expenses re
      LEFT JOIN categories c ON re.category_id = c.id
      LEFT JOIN subcategories sc ON re.subcategory_id = sc.id
      INNER JOIN accounts a ON re.account_id = a.id
      WHERE re.id = ?
    `)
      .bind(expenseId)
      .first<RecurringExpenseWithDetails>();

    return c.json({
      success: true,
      data: normalizeRecurringExpense(updatedExpense!),
    });
  } catch (error) {
    console.error("Error al actualizar gasto recurrente:", error);
    return c.json(
      {
        success: false,
        error: "Error al actualizar el gasto recurrente",
      },
      500
    );
  }
});

// PATCH /:id/status - Cambiar el estado de un gasto recurrente
recurringExpenses.patch("/:id/status", async (c) => {
  try {
    const user = c.get("user");
    const expenseId = parseInt(c.req.param("id"));

    if (isNaN(expenseId)) {
      return c.json({ success: false, error: "ID de gasto recurrente inválido" }, 400);
    }

    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: "Formato de datos inválido" }, 400);
    }

    const status = body.status;

    if (!status || !["active", "paused", "cancelled"].includes(status)) {
      return c.json(
        {
          success: false,
          error: "Estado inválido. Debe ser: active, paused o cancelled",
        },
        400
      );
    }

    // Verificar que existe
    const existing = await c.env.DB.prepare(
      "SELECT id FROM recurring_expenses WHERE id = ? AND user_id = ?"
    )
      .bind(expenseId, user.id)
      .first();

    if (!existing) {
      return c.json({ success: false, error: "Gasto recurrente no encontrado" }, 404);
    }

    // Actualizar solo el estado
    await c.env.DB.prepare(
      "UPDATE recurring_expenses SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
    )
      .bind(status, expenseId, user.id)
      .run();

    // Obtener el gasto actualizado
    const updatedExpense = await c.env.DB.prepare(`
      SELECT 
        re.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type,
        a.icon as account_icon,
        a.color as account_color
      FROM recurring_expenses re
      LEFT JOIN categories c ON re.category_id = c.id
      LEFT JOIN subcategories sc ON re.subcategory_id = sc.id
      INNER JOIN accounts a ON re.account_id = a.id
      WHERE re.id = ?
    `)
      .bind(expenseId)
      .first<RecurringExpenseWithDetails>();

    return c.json({
      success: true,
      data: normalizeRecurringExpense(updatedExpense!),
      message: `Estado actualizado a '${status}'`,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return c.json({ success: false, error: "Error al cambiar el estado" }, 500);
  }
});

// DELETE /:id - Eliminar un gasto recurrente
recurringExpenses.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const expenseId = parseInt(c.req.param("id"));

    if (isNaN(expenseId)) {
      return c.json({ success: false, error: "ID de gasto recurrente inválido" }, 400);
    }

    // Verificar que existe y pertenece al usuario
    const existing = await c.env.DB.prepare(
      "SELECT id, name FROM recurring_expenses WHERE id = ? AND user_id = ?"
    )
      .bind(expenseId, user.id)
      .first<{ id: number; name: string }>();

    if (!existing) {
      return c.json({ success: false, error: "Gasto recurrente no encontrado" }, 404);
    }

    // Eliminar el gasto recurrente
    await c.env.DB.prepare("DELETE FROM recurring_expenses WHERE id = ? AND user_id = ?")
      .bind(expenseId, user.id)
      .run();

    return c.json({
      success: true,
      message: `Gasto recurrente '${existing.name}' eliminado correctamente`,
      data: {
        id: existing.id,
        name: existing.name,
      },
    });
  } catch (error) {
    console.error("Error al eliminar gasto recurrente:", error);
    return c.json({ success: false, error: "Error al eliminar el gasto recurrente" }, 500);
  }
});

// GET /upcoming - Obtener próximos gastos recurrentes (próximos 30 días)
recurringExpenses.get("/upcoming", async (c) => {
  try {
    const user = c.get("user");
    const days = parseInt(c.req.query("days") || "30");

    if (isNaN(days) || days < 1 || days > 365) {
      return c.json({ success: false, error: "El parámetro 'days' debe estar entre 1 y 365" }, 400);
    }

    const today = new Date().toISOString().split("T")[0];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const futureDateStr = futureDate.toISOString().split("T")[0];

    const stmt = c.env.DB.prepare(`
      SELECT 
        re.*,
        c.name as category_name,
        c.color as category_color,
        c.icon as category_icon,
        sc.name as subcategory_name,
        a.name as account_name,
        a.type as account_type,
        a.icon as account_icon,
        a.color as account_color
      FROM recurring_expenses re
      LEFT JOIN categories c ON re.category_id = c.id
      LEFT JOIN subcategories sc ON re.subcategory_id = sc.id
      INNER JOIN accounts a ON re.account_id = a.id
      WHERE re.user_id = ?
        AND re.status = 'active'
        AND re.next_charge_date IS NOT NULL
        AND re.next_charge_date BETWEEN ? AND ?
      ORDER BY re.next_charge_date ASC
    `);

    const result = await stmt.bind(user.id, today, futureDateStr).all<RecurringExpenseWithDetails>();

    const normalized = result.results.map((row) => normalizeRecurringExpense(row));

    const total_upcoming = normalized.reduce((sum, exp) => sum + exp.amount, 0);

    return c.json({
      success: true,
      data: {
        upcoming_expenses: normalized,
        summary: {
          count: normalized.length,
          total_amount: Number(total_upcoming.toFixed(2)),
          period_days: days,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener próximos gastos:", error);
    return c.json({ success: false, error: "Error al obtener próximos gastos" }, 500);
  }
});

export default recurringExpenses;
