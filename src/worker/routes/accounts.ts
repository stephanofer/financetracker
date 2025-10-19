import { Hono } from "hono";
import { AppContext } from "../types";
import { Account } from "@/react/dashboard/types";

const accounts = new Hono<AppContext>();

accounts.get("/", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;

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

accounts.get("/:id", async (c) => {
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

accounts.get("/balance/total", async (c) => {
  try {
    const user = c.get("user");
    const userId = user.id;

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
      `SELECT 
         SUM(balance) as total_balance,
         COUNT(*) as total_accounts
       FROM accounts 
       WHERE user_id = ? AND is_active = 1`
    );
    const result = await stmt.bind(userId).first<{
      total_balance: number | null;
      total_accounts: number;
    }>();

    return c.json({
      success: true,
      data: {
        total_balance: result?.total_balance || 0,
        total_accounts: result?.total_accounts || 0,
      },
    });
  } catch (error) {
    console.error("Error al obtener balance total:", error);
    return c.json(
      {
        success: false,
        error: "Error al obtener el balance total",
      },
      500
    );
  }
});

export default accounts;
