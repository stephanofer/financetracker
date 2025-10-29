import { Hono } from "hono";
import { AppContext } from "../types";
import {Category} from '@/react/dashboard/utils/types'

const categories = new Hono<AppContext>();

categories.get("/", async (c) => {
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

export default categories;
