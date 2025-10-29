import { Hono } from "hono";
import { AppContext, Category } from "../types";

const categories = new Hono<AppContext>();

categories.get("/", async (c) => {
  try {
    const type = c.req.query("type");
    const user = c.get("user");
    const userId = user.id;
    let query =
      "SELECT id, name, type, color, icon, order_index, is_active, created_at FROM categories WHERE is_active = 1 AND user_id = ?";
    const params: (string | number)[] = [userId];

    if (type) {
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
