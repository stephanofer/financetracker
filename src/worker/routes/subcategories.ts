import { Hono } from "hono";
import { AppContext } from "../types";
import {Subcategory} from '@/react/dashboard/utils/types'

const subcategories = new Hono<AppContext>();

subcategories.get("/", async (c) => {
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
export default subcategories;