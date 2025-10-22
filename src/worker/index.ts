import { Hono } from "hono";
import { authMiddleware } from "./middleware/authMiddleware";
import auth from "./routes/auth";
import { AppContext } from "./types";
import transactions from "./routes/transactions";
import categories from "./routes/categories";
import subcategories from "./routes/subcategories";
import accounts from "./routes/accounts";
import debts from "./routes/debts";

const app = new Hono<AppContext>().basePath("/api");

app.use("*", async (c, next) => {
  const path = c.req.path;

  if (path === "/api/auth/login" || path === "/api/auth/logout") {
    return next();
  }
  return authMiddleware(c, next);
});

app.route("/auth", auth);
app.route("/transactions", transactions);
app.route("/categories", categories);
app.route("/subcategories", subcategories);
app.route("/accounts", accounts);
app.route("/debts", debts);

export default app;
