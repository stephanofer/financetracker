import { AppContext } from "../types";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

export const authMiddleware = createMiddleware<AppContext>(async (c, next) => {
  console.log("middleware");
  try {
    const token = getCookie(c, "auth_token");

    if (!token) {
      return c.json(
        {
          success: false,
          error: "No autenticado",
          message: "Debes iniciar sesión para acceder a este recurso",
        },
        401
      );
    }

    const secret = await c.env.JWT_SECRET.get();
    const payload = await verify(token, secret);


    if (!payload || !payload.sub) {
      console.log("❌ authMiddleware: Payload inválido");
      return c.json(
        {
          success: false,
          error: "Token inválido",
        },
        401
      );
    }

    const userStmt = c.env.DB.prepare(
      "SELECT id, username, email, full_name FROM users WHERE id = ? AND is_active = 1"
    );
    const user = await userStmt.bind(payload.sub).first<{
      id: number;
      username: string;
      email: string | null;
      full_name: string | null;
    }>();

    if (!user) {
      return c.json(
        {
          success: false,
          error: "Usuario no encontrado o inactivo",
        },
        401
      );
    }

    c.set("user", {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
    });

    await next();
  } catch {
    return c.json(
      {
        success: false,
        error: "No autenticado",
        message: "Debes iniciar sesión para acceder a este recurso",
      },
      401
    );
  }
});
