import { Hono } from "hono";
import { AppContext, Subcategory } from "../types";

const subcategories = new Hono<AppContext>();

subcategories.get("/", async (c) => {
  try {
    const categoryId = c.req.query("categoryId");
    const user = c.get("user");
    const userId = user.id;

    let query =
      "SELECT id, category_id, name, order_index, is_active, created_at FROM subcategories WHERE is_active = 1 AND user_id = ?";
    const params: (string | number)[] = [userId];

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
export default subcategories;
