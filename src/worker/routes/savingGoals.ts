import { Hono } from "hono";
import { AppContext, SavingGoal, GoalContribution } from "../types";

const savingGoals = new Hono<AppContext>();

type SavingGoalWithAggregates = SavingGoal & {
  total_contributions: number;
  contributions_count: number;
  last_contribution_date: string | null;
};

// Función para calcular estadísticas de una meta
const calculateGoalStats = (goal: SavingGoal) => {
  const target_amount = Number(goal.target_amount);
  const current_amount = Number(goal.current_amount);
  const remaining_amount = Math.max(0, target_amount - current_amount);
  const progress_percentage =
    target_amount > 0 ? (current_amount / target_amount) * 100 : 0;

  let days_remaining = null;
  let is_overdue = false;

  if (goal.target_date) {
    const today = new Date();
    const targetDate = new Date(goal.target_date);
    const diffTime = targetDate.getTime() - today.getTime();
    days_remaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    is_overdue = days_remaining < 0 && goal.status !== "achieved";
  }

  return {
    progress_percentage: Number(progress_percentage.toFixed(2)),
    remaining_amount: Number(remaining_amount.toFixed(2)),
    days_remaining,
    is_overdue,
  };
};

// Normalizar meta de ahorro
const normalizeSavingGoal = (goal: SavingGoalWithAggregates) => {
  const stats = calculateGoalStats(goal);

  return {
    id: goal.id,
    name: goal.name,
    description: goal.description,
    target_amount: Number(goal.target_amount),
    current_amount: Number(goal.current_amount),
    target_date: goal.target_date,
    priority: goal.priority,
    status: goal.status,
    image_url: goal.image_url,
    auto_contribute: Boolean(goal.auto_contribute),
    auto_contribute_percentage: goal.auto_contribute_percentage
      ? Number(goal.auto_contribute_percentage)
      : null,
    created_at: goal.created_at,
    updated_at: goal.updated_at,
    completed_at: goal.completed_at,
    ...stats,
    contributions: {
      total: Number(goal.total_contributions || 0),
      count: Number(goal.contributions_count || 0),
      last_date: goal.last_contribution_date || null,
    },
  };
};

// GET / - Obtener todas las metas de ahorro del usuario
savingGoals.get("/", async (c) => {
  try {
    const user = c.get("user");
    const status = c.req.query("status");
    const priority = c.req.query("priority");

    let query = `
      SELECT 
        sg.*,
        COALESCE(SUM(t.amount), 0) as total_contributions,
        COUNT(t.id) as contributions_count,
        MAX(t.transaction_date) as last_contribution_date
      FROM savings_goals sg
      LEFT JOIN transactions t ON sg.id = t.goal_id AND t.type = 'goal_contribution'
      WHERE sg.user_id = ?
    `;

    const params: (number | string)[] = [user.id];

    if (status && ["in_progress", "achieved", "expired", "cancelled"].includes(status)) {
      query += " AND sg.status = ?";
      params.push(status);
    }

    if (priority && ["high", "medium", "low"].includes(priority)) {
      query += " AND sg.priority = ?";
      params.push(priority);
    }

    query += " GROUP BY sg.id ORDER BY sg.created_at DESC";

    const stmt = c.env.DB.prepare(query);
    const result = await stmt.bind(...params).all<SavingGoalWithAggregates>();

    const normalized = result.results.map((goal) => normalizeSavingGoal(goal));

    // Calcular resumen general
    const summaryStmt = c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'achieved' THEN 1 ELSE 0 END) as achieved_count,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN status = 'in_progress' THEN target_amount ELSE 0 END) as total_target_in_progress,
        SUM(CASE WHEN status = 'in_progress' THEN current_amount ELSE 0 END) as total_saved_in_progress,
        SUM(CASE WHEN status = 'achieved' THEN current_amount ELSE 0 END) as total_achieved_amount
      FROM savings_goals
      WHERE user_id = ?
    `);

    const summaryResult = await summaryStmt.bind(user.id).first<{
      total_count: number;
      in_progress_count: number;
      achieved_count: number;
      expired_count: number;
      cancelled_count: number;
      total_target_in_progress: number;
      total_saved_in_progress: number;
      total_achieved_amount: number;
    }>();

    const total_remaining = Number(summaryResult?.total_target_in_progress || 0) - Number(summaryResult?.total_saved_in_progress || 0);

    return c.json({
      success: true,
      data: {
        summary: {
          total: Number(summaryResult?.total_count || 0),
          in_progress: Number(summaryResult?.in_progress_count || 0),
          achieved: Number(summaryResult?.achieved_count || 0),
          expired: Number(summaryResult?.expired_count || 0),
          cancelled: Number(summaryResult?.cancelled_count || 0),
          total_target_in_progress: Number(summaryResult?.total_target_in_progress || 0),
          total_saved_in_progress: Number(summaryResult?.total_saved_in_progress || 0),
          total_remaining: Math.max(0, total_remaining),
          total_achieved_amount: Number(summaryResult?.total_achieved_amount || 0),
        },
        goals: normalized,
      },
      count: normalized.length,
    });
  } catch (error) {
    console.error("Error al obtener metas de ahorro:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener las metas de ahorro",
      },
      500
    );
  }
});

// POST / - Crear una nueva meta de ahorro
savingGoals.post("/", async (c) => {
  try {
    const user = c.get("user");

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
    const requiredFields = ["name", "target_amount"];
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
    const description = body.description ? String(body.description).trim() : null;
    const target_amount = Number(body.target_amount);
    const current_amount = body.current_amount !== undefined ? Number(body.current_amount) : 0;
    const target_date = body.target_date ? String(body.target_date) : null;
    const priority = body.priority ? String(body.priority) : "medium";
    const status = body.status ? String(body.status) : "in_progress";
    const image_url = body.image_url ? String(body.image_url) : null;
    const auto_contribute = body.auto_contribute !== undefined ? Boolean(body.auto_contribute) : false;
    const auto_contribute_percentage = body.auto_contribute_percentage
      ? Number(body.auto_contribute_percentage)
      : null;

    // Validaciones específicas
    if (!name) {
      return c.json({ success: false, error: "El nombre no puede estar vacío" }, 400);
    }

    if (isNaN(target_amount) || target_amount <= 0) {
      return c.json({ success: false, error: "El monto objetivo debe ser un número positivo mayor a 0" }, 400);
    }

    if (isNaN(current_amount) || current_amount < 0) {
      return c.json({ success: false, error: "El monto actual no puede ser negativo" }, 400);
    }

    if (current_amount > target_amount) {
      return c.json(
        {
          success: false,
          error: "El monto actual no puede ser mayor al monto objetivo",
        },
        400
      );
    }

    if (!["high", "medium", "low"].includes(priority)) {
      return c.json(
        {
          success: false,
          error: "Prioridad inválida. Debe ser: high, medium o low",
        },
        400
      );
    }

    if (!["in_progress", "achieved", "expired", "cancelled"].includes(status)) {
      return c.json(
        {
          success: false,
          error: "Estado inválido. Debe ser: in_progress, achieved, expired o cancelled",
        },
        400
      );
    }

    if (target_date) {
      const targetDateObj = new Date(target_date);
      if (isNaN(targetDateObj.getTime())) {
        return c.json({ success: false, error: "Fecha objetivo inválida" }, 400);
      }
    }

    if (auto_contribute_percentage !== null) {
      if (isNaN(auto_contribute_percentage) || auto_contribute_percentage < 0 || auto_contribute_percentage > 100) {
        return c.json(
          {
            success: false,
            error: "El porcentaje de contribución automática debe estar entre 0 y 100",
          },
          400
        );
      }
    }

    // Determinar completed_at si ya está achieved
    const completed_at = current_amount >= target_amount ? new Date().toISOString() : null;
    const final_status = current_amount >= target_amount ? "achieved" : status;

    // Insertar en la base de datos
    const stmt = c.env.DB.prepare(`
      INSERT INTO savings_goals (
        user_id, name, description, target_amount, current_amount, target_date,
        priority, status, image_url, auto_contribute, auto_contribute_percentage,
        completed_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = await stmt
      .bind(
        user.id,
        name,
        description,
        target_amount,
        current_amount,
        target_date,
        priority,
        final_status,
        image_url,
        auto_contribute ? 1 : 0,
        auto_contribute_percentage,
        completed_at
      )
      .run();

    // Obtener la meta recién creada con estadísticas
    const goalId = result.meta.last_row_id;
    const goalRow = await c.env.DB.prepare(`
      SELECT 
        sg.*,
        COALESCE(SUM(t.amount), 0) as total_contributions,
        COUNT(t.id) as contributions_count,
        MAX(t.transaction_date) as last_contribution_date
      FROM savings_goals sg
      LEFT JOIN transactions t ON sg.id = t.goal_id AND t.type = 'goal_contribution'
      WHERE sg.id = ?
      GROUP BY sg.id
    `)
      .bind(goalId)
      .first<SavingGoalWithAggregates>();

    return c.json(
      {
        success: true,
        data: normalizeSavingGoal(goalRow!),
      },
      201
    );
  } catch (error) {
    console.error("Error al crear meta de ahorro:", error);
    return c.json(
      {
        success: false,
        error: "Error al crear la meta de ahorro",
      },
      500
    );
  }
});

// GET /:id - Obtener detalle de una meta de ahorro específica
savingGoals.get("/:id", async (c) => {
  try {
    const user = c.get("user");
    const goalId = parseInt(c.req.param("id"));

    if (isNaN(goalId)) {
      return c.json({ success: false, error: "ID de meta inválido" }, 400);
    }

    // Obtener la meta con estadísticas
    const goalRow = await c.env.DB.prepare(`
      SELECT 
        sg.*,
        COALESCE(SUM(t.amount), 0) as total_contributions,
        COUNT(t.id) as contributions_count,
        MAX(t.transaction_date) as last_contribution_date
      FROM savings_goals sg
      LEFT JOIN transactions t ON sg.id = t.goal_id AND t.type = 'goal_contribution'
      WHERE sg.id = ? AND sg.user_id = ?
      GROUP BY sg.id
    `)
      .bind(goalId, user.id)
      .first<SavingGoalWithAggregates>();

    if (!goalRow) {
      return c.json({ success: false, error: "Meta de ahorro no encontrada" }, 404);
    }

    // Obtener historial de contribuciones
    const contributionsStmt = c.env.DB.prepare(`
      SELECT 
        t.id,
        t.amount,
        t.transaction_date,
        t.description,
        t.notes,
        t.created_at,
        a.name as account_name,
        a.type as account_type,
        a.icon as account_icon,
        a.color as account_color
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      WHERE t.goal_id = ? AND t.user_id = ? AND t.type = 'goal_contribution'
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT 100
    `);

    const contributions = await contributionsStmt
      .bind(goalId, user.id)
      .all<GoalContribution>();

    const normalizedContributions = contributions.results.map((c) => ({
      id: c.id,
      amount: Number(c.amount),
      transaction_date: c.transaction_date,
      description: c.description,
      notes: c.notes,
      created_at: c.created_at,
      account: c.account_name
        ? {
            name: c.account_name,
            type: c.account_type,
            icon: c.account_icon,
            color: c.account_color,
          }
        : null,
    }));

    // Calcular estadísticas adicionales
    const goal = normalizeSavingGoal(goalRow);
    const daysSinceCreation = Math.floor(
      (new Date().getTime() - new Date(goal.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    const averageContributionAmount =
      normalizedContributions.length > 0
        ? normalizedContributions.reduce((sum, c) => sum + c.amount, 0) / normalizedContributions.length
        : 0;

    // Calcular días promedio entre contribuciones
    let averageDaysBetweenContributions = null;
    if (normalizedContributions.length > 1) {
      const dates = normalizedContributions.map((c) => new Date(c.transaction_date).getTime());
      const intervals = [];
      for (let i = 0; i < dates.length - 1; i++) {
        intervals.push((dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24));
      }
      averageDaysBetweenContributions = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    }

    // Proyección para alcanzar la meta
    let estimated_completion_date = null;
    if (
      goal.status === "in_progress" &&
      averageContributionAmount > 0 &&
      averageDaysBetweenContributions
    ) {
      const remaining = goal.remaining_amount;
      const contributionsNeeded = Math.ceil(remaining / averageContributionAmount);
      const daysNeeded = contributionsNeeded * averageDaysBetweenContributions;
      estimated_completion_date = new Date(Date.now() + daysNeeded * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
    }

    return c.json({
      success: true,
      data: {
        goal,
        contributions: {
          list: normalizedContributions,
          statistics: {
            total_contributions: normalizedContributions.length,
            total_amount: normalizedContributions.reduce((sum, c) => sum + c.amount, 0),
            average_amount: Number(averageContributionAmount.toFixed(2)),
            last_contribution: normalizedContributions[0] || null,
            average_days_between: averageDaysBetweenContributions
              ? Number(averageDaysBetweenContributions.toFixed(1))
              : null,
          },
        },
        projections: {
          days_since_creation: daysSinceCreation,
          estimated_completion_date,
          on_track: goal.target_date && estimated_completion_date
            ? new Date(estimated_completion_date) <= new Date(goal.target_date)
            : null,
        },
      },
    });
  } catch (error) {
    console.error("Error al obtener detalle de meta:", error);
    return c.json({ success: false, error: "Error al obtener el detalle de la meta" }, 500);
  }
});

// PUT /:id - Actualizar una meta de ahorro
savingGoals.put("/:id", async (c) => {
  try {
    const user = c.get("user");
    const goalId = parseInt(c.req.param("id"));

    if (isNaN(goalId)) {
      return c.json({ success: false, error: "ID de meta inválido" }, 400);
    }

    // Verificar que la meta existe y pertenece al usuario
    const existingGoal = await c.env.DB.prepare(
      "SELECT * FROM savings_goals WHERE id = ? AND user_id = ?"
    )
      .bind(goalId, user.id)
      .first<SavingGoal>();

    if (!existingGoal) {
      return c.json({ success: false, error: "Meta de ahorro no encontrada" }, 404);
    }

    let body;
    try {
      body = await c.req.json();
    } catch (parseError) {
      console.error("Error al parsear JSON:", parseError);
      return c.json({ success: false, error: "Formato de datos inválido" }, 400);
    }

    // Normalización de valores opcionales
    const name = body.name !== undefined ? String(body.name).trim() : undefined;
    const description = body.description !== undefined ? (body.description ? String(body.description).trim() : null) : undefined;
    const target_amount = body.target_amount !== undefined ? Number(body.target_amount) : undefined;
    const target_date = body.target_date !== undefined ? (body.target_date ? String(body.target_date) : null) : undefined;
    const priority = body.priority !== undefined ? String(body.priority) : undefined;
    const status = body.status !== undefined ? String(body.status) : undefined;
    const image_url = body.image_url !== undefined ? (body.image_url ? String(body.image_url) : null) : undefined;
    const auto_contribute = body.auto_contribute !== undefined ? Boolean(body.auto_contribute) : undefined;
    const auto_contribute_percentage = body.auto_contribute_percentage !== undefined
      ? (body.auto_contribute_percentage ? Number(body.auto_contribute_percentage) : null)
      : undefined;

    // Validaciones específicas
    if (name !== undefined && !name) {
      return c.json({ success: false, error: "El nombre no puede estar vacío" }, 400);
    }

    if (target_amount !== undefined && (isNaN(target_amount) || target_amount <= 0)) {
      return c.json({ success: false, error: "El monto objetivo debe ser positivo" }, 400);
    }

    if (priority !== undefined && !["high", "medium", "low"].includes(priority)) {
      return c.json({ success: false, error: "Prioridad inválida" }, 400);
    }

    if (status !== undefined && !["in_progress", "achieved", "expired", "cancelled"].includes(status)) {
      return c.json({ success: false, error: "Estado inválido" }, 400);
    }

    if (target_date !== undefined && target_date !== null) {
      const targetDateObj = new Date(target_date);
      if (isNaN(targetDateObj.getTime())) {
        return c.json({ success: false, error: "Fecha objetivo inválida" }, 400);
      }
    }

    if (auto_contribute_percentage !== undefined && auto_contribute_percentage !== null) {
      if (isNaN(auto_contribute_percentage) || auto_contribute_percentage < 0 || auto_contribute_percentage > 100) {
        return c.json({ success: false, error: "El porcentaje debe estar entre 0 y 100" }, 400);
      }
    }

    // Construir la consulta de actualización dinámicamente
    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (name !== undefined) {
      updates.push("name = ?");
      params.push(name);
    }
    if (description !== undefined) {
      updates.push("description = ?");
      params.push(description);
    }
    if (target_amount !== undefined) {
      updates.push("target_amount = ?");
      params.push(target_amount);
    }
    if (target_date !== undefined) {
      updates.push("target_date = ?");
      params.push(target_date);
    }
    if (priority !== undefined) {
      updates.push("priority = ?");
      params.push(priority);
    }
    if (status !== undefined) {
      updates.push("status = ?");
      params.push(status);

      // Si se marca como achieved, establecer completed_at
      if (status === "achieved" && !existingGoal.completed_at) {
        updates.push("completed_at = CURRENT_TIMESTAMP");
      }
      // Si se cambia de achieved a otro estado, limpiar completed_at
      if (status !== "achieved" && existingGoal.completed_at) {
        updates.push("completed_at = NULL");
      }
    }
    if (image_url !== undefined) {
      updates.push("image_url = ?");
      params.push(image_url);
    }
    if (auto_contribute !== undefined) {
      updates.push("auto_contribute = ?");
      params.push(auto_contribute ? 1 : 0);
    }
    if (auto_contribute_percentage !== undefined) {
      updates.push("auto_contribute_percentage = ?");
      params.push(auto_contribute_percentage);
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: "No se proporcionaron campos para actualizar" }, 400);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");

    const updateQuery = `
      UPDATE savings_goals 
      SET ${updates.join(", ")}
      WHERE id = ? AND user_id = ?
    `;

    params.push(goalId, user.id);

    await c.env.DB.prepare(updateQuery).bind(...params).run();

    // Obtener la meta actualizada con estadísticas
    const updatedGoal = await c.env.DB.prepare(`
      SELECT 
        sg.*,
        COALESCE(SUM(t.amount), 0) as total_contributions,
        COUNT(t.id) as contributions_count,
        MAX(t.transaction_date) as last_contribution_date
      FROM savings_goals sg
      LEFT JOIN transactions t ON sg.id = t.goal_id AND t.type = 'goal_contribution'
      WHERE sg.id = ?
      GROUP BY sg.id
    `)
      .bind(goalId)
      .first<SavingGoalWithAggregates>();

    return c.json({
      success: true,
      data: normalizeSavingGoal(updatedGoal!),
    });
  } catch (error) {
    console.error("Error al actualizar meta:", error);
    return c.json({ success: false, error: "Error al actualizar la meta de ahorro" }, 500);
  }
});

// PATCH /:id/status - Cambiar el estado de una meta
savingGoals.patch("/:id/status", async (c) => {
  try {
    const user = c.get("user");
    const goalId = parseInt(c.req.param("id"));

    if (isNaN(goalId)) {
      return c.json({ success: false, error: "ID de meta inválido" }, 400);
    }

    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: "Formato de datos inválido" }, 400);
    }

    const status = body.status;

    if (!status || !["in_progress", "achieved", "expired", "cancelled"].includes(status)) {
      return c.json({ success: false, error: "Estado inválido" }, 400);
    }

    // Verificar que existe
    const existing = await c.env.DB.prepare(
      "SELECT id, current_amount, target_amount FROM savings_goals WHERE id = ? AND user_id = ?"
    )
      .bind(goalId, user.id)
      .first<{ id: number; current_amount: number; target_amount: number }>();

    if (!existing) {
      return c.json({ success: false, error: "Meta de ahorro no encontrada" }, 404);
    }

    // Actualizar estado y completed_at si es necesario
    let updateQuery = "UPDATE savings_goals SET status = ?, updated_at = CURRENT_TIMESTAMP";
    const params: (string | number)[] = [status];

    if (status === "achieved") {
      updateQuery += ", completed_at = CURRENT_TIMESTAMP";
    } else {
      updateQuery += ", completed_at = NULL";
    }

    updateQuery += " WHERE id = ? AND user_id = ?";
    params.push(goalId, user.id);

    await c.env.DB.prepare(updateQuery).bind(...params).run();

    // Obtener la meta actualizada
    const updatedGoal = await c.env.DB.prepare(`
      SELECT 
        sg.*,
        COALESCE(SUM(t.amount), 0) as total_contributions,
        COUNT(t.id) as contributions_count,
        MAX(t.transaction_date) as last_contribution_date
      FROM savings_goals sg
      LEFT JOIN transactions t ON sg.id = t.goal_id AND t.type = 'goal_contribution'
      WHERE sg.id = ?
      GROUP BY sg.id
    `)
      .bind(goalId)
      .first<SavingGoalWithAggregates>();

    return c.json({
      success: true,
      data: normalizeSavingGoal(updatedGoal!),
      message: `Estado actualizado a '${status}'`,
    });
  } catch (error) {
    console.error("Error al cambiar estado:", error);
    return c.json({ success: false, error: "Error al cambiar el estado" }, 500);
  }
});

// DELETE /:id - Eliminar una meta de ahorro
savingGoals.delete("/:id", async (c) => {
  try {
    const user = c.get("user");
    const goalId = parseInt(c.req.param("id"));

    if (isNaN(goalId)) {
      return c.json({ success: false, error: "ID de meta inválido" }, 400);
    }

    // Verificar que existe y pertenece al usuario
    const existing = await c.env.DB.prepare(
      "SELECT id, name FROM savings_goals WHERE id = ? AND user_id = ?"
    )
      .bind(goalId, user.id)
      .first<{ id: number; name: string }>();

    if (!existing) {
      return c.json({ success: false, error: "Meta de ahorro no encontrada" }, 404);
    }

    // Verificar si hay transacciones asociadas
    const transactionsCheck = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM transactions WHERE goal_id = ? AND user_id = ?"
    )
      .bind(goalId, user.id)
      .first<{ count: number }>();

    if (transactionsCheck && transactionsCheck.count > 0) {
      return c.json(
        {
          success: false,
          error: "No se puede eliminar la meta porque tiene transacciones asociadas",
          message: `Hay ${transactionsCheck.count} contribución(es) asociada(s). Cancele la meta en su lugar.`,
        },
        400
      );
    }

    // Eliminar la meta
    await c.env.DB.prepare("DELETE FROM savings_goals WHERE id = ? AND user_id = ?")
      .bind(goalId, user.id)
      .run();

    return c.json({
      success: true,
      message: `Meta de ahorro '${existing.name}' eliminada correctamente`,
      data: {
        id: existing.id,
        name: existing.name,
      },
    });
  } catch (error) {
    console.error("Error al eliminar meta:", error);
    return c.json({ success: false, error: "Error al eliminar la meta de ahorro" }, 500);
  }
});

// POST /:id/contribute - Agregar una contribución a la meta
savingGoals.post("/:id/contribute", async (c) => {
  try {
    const user = c.get("user");
    const goalId = parseInt(c.req.param("id"));

    if (isNaN(goalId)) {
      return c.json({ success: false, error: "ID de meta inválido" }, 400);
    }

    let body;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ success: false, error: "Formato de datos inválido" }, 400);
    }

    // Validar campos requeridos
    const amount = body.amount ? Number(body.amount) : null;
    const account_id = body.account_id ? Number(body.account_id) : null;

    if (!amount || amount <= 0) {
      return c.json({ success: false, error: "El monto debe ser un número positivo" }, 400);
    }

    if (!account_id) {
      return c.json({ success: false, error: "El campo 'account_id' es requerido" }, 400);
    }

    // Verificar que la meta existe y está activa
    const goal = await c.env.DB.prepare(
      "SELECT * FROM savings_goals WHERE id = ? AND user_id = ?"
    )
      .bind(goalId, user.id)
      .first<SavingGoal>();

    if (!goal) {
      return c.json({ success: false, error: "Meta de ahorro no encontrada" }, 404);
    }

    if (goal.status === "cancelled") {
      return c.json({ success: false, error: "No se puede contribuir a una meta cancelada" }, 400);
    }

    if (goal.status === "achieved") {
      return c.json(
        {
          success: false,
          error: "La meta ya fue alcanzada",
          message: "No se pueden agregar más contribuciones a una meta completada",
        },
        400
      );
    }

    // Verificar que la cuenta existe
    const accountCheck = await c.env.DB.prepare(
      "SELECT id FROM accounts WHERE id = ? AND user_id = ? AND is_active = 1"
    )
      .bind(account_id, user.id)
      .first();

    if (!accountCheck) {
      return c.json({ success: false, error: "La cuenta especificada no existe o no está activa" }, 404);
    }

    const description = body.description || `Contribución a ${goal.name}`;
    const notes = body.notes || null;
    const transaction_date = body.transaction_date || new Date().toISOString().split("T")[0];

    // Crear la transacción de contribución
    const transactionStmt = c.env.DB.prepare(`
      INSERT INTO transactions (
        user_id, type, amount, account_id, goal_id, description, notes, transaction_date,
        created_at, updated_at
      ) VALUES (?, 'goal_contribution', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const transactionResult = await transactionStmt
      .bind(user.id, amount, account_id, goalId, description, notes, transaction_date)
      .run();

    // Actualizar current_amount y verificar si se alcanzó la meta
    const new_current_amount = Number(goal.current_amount) + amount;
    const is_achieved = new_current_amount >= Number(goal.target_amount);

    const updateGoalStmt = c.env.DB.prepare(`
      UPDATE savings_goals
      SET 
        current_amount = ?,
        status = CASE WHEN ? >= target_amount THEN 'achieved' ELSE status END,
        completed_at = CASE WHEN ? >= target_amount AND completed_at IS NULL THEN CURRENT_TIMESTAMP ELSE completed_at END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);

    await updateGoalStmt
      .bind(new_current_amount, new_current_amount, new_current_amount, goalId, user.id)
      .run();

    // Actualizar balance de la cuenta (restar el monto)
    await c.env.DB.prepare(
      "UPDATE accounts SET balance = balance - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?"
    )
      .bind(amount, account_id, user.id)
      .run();

    // Obtener la transacción creada
    const transaction = await c.env.DB.prepare(
      "SELECT * FROM transactions WHERE id = ?"
    )
      .bind(transactionResult.meta.last_row_id)
      .first();

    // Obtener la meta actualizada
    const updatedGoal = await c.env.DB.prepare(`
      SELECT 
        sg.*,
        COALESCE(SUM(t.amount), 0) as total_contributions,
        COUNT(t.id) as contributions_count,
        MAX(t.transaction_date) as last_contribution_date
      FROM savings_goals sg
      LEFT JOIN transactions t ON sg.id = t.goal_id AND t.type = 'goal_contribution'
      WHERE sg.id = ?
      GROUP BY sg.id
    `)
      .bind(goalId)
      .first<SavingGoalWithAggregates>();

    return c.json(
      {
        success: true,
        message: is_achieved ? "¡Felicidades! Has alcanzado tu meta de ahorro" : "Contribución registrada exitosamente",
        data: {
          transaction,
          goal: normalizeSavingGoal(updatedGoal!),
          achieved: is_achieved,
        },
      },
      201
    );
  } catch (error) {
    console.error("Error al agregar contribución:", error);
    return c.json({ success: false, error: "Error al agregar la contribución" }, 500);
  }
});

export default savingGoals;
