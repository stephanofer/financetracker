import { Hono } from "hono";
const app = new Hono<{ Bindings: Env }>();

app.get("/api/", async (c) => {
  const stmt = c.env.DB.prepare("SELECT * FROM comments");
  const { results } = await stmt.all();

  console.log(results);
  return c.json(results);
});

export default app;
