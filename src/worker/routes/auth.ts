import { Hono } from "hono";
import { AppContext, User } from "../types";
import { setCookie } from "hono/cookie";
import { sign } from "hono/jwt";

const auth = new Hono<AppContext>();

const JWT_EXPIRATION = 90 * 24 * 60 * 60; // 90 días en segundos
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 días en segundos

// async function hashPassword(
//   password: string
// ): Promise<{ hash: string; salt: string }> {
//   const salt = crypto.getRandomValues(new Uint8Array(16));
//   const encoder = new TextEncoder();
//   const data = encoder.encode(password);

//   const key = await crypto.subtle.importKey(
//     "raw",
//     data,
//     { name: "PBKDF2" },
//     false,
//     ["deriveBits"]
//   );

//   const derivedBits = await crypto.subtle.deriveBits(
//     {
//       name: "PBKDF2",
//       salt: salt,
//       iterations: 100000,
//       hash: "SHA-256",
//     },
//     key,
//     256
//   );

//   const hash = Array.from(new Uint8Array(derivedBits))
//     .map((b) => b.toString(16).padStart(2, "0"))
//     .join("");
//   const saltBase64 = btoa(String.fromCharCode(...salt));

//   return { hash, salt: saltBase64 };
// }

async function verifyPassword(
  password: string,
  storedHash: string,
  storedSalt: string
) {
  const salt = Uint8Array.from(atob(storedSalt), (c) => c.charCodeAt(0));

  const encoder = new TextEncoder();
  const data = encoder.encode(password);

  const key = await crypto.subtle.importKey(
    "raw",
    data,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    key,
    256
  );

  const hash = Array.from(new Uint8Array(derivedBits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hash === storedHash;
}

auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();
    const { username, password } = body;

    if (!username || !password) {
      return c.json(
        {
          success: false,
          error: "Username y password son requeridos",
        },
        400
      );
    }

    const userStmt = c.env.DB.prepare(
      "SELECT id, username, password_hash, salt, email, full_name, is_active FROM users WHERE username = ?"
    );

    const user = await userStmt.bind(username).first<User>();

    if (!user) {
      return c.json(
        {
          success: false,
          error: "Credenciales inválidas",
        },
        401
      );
    }

    if (!user.is_active) {
      return c.json(
        {
          success: false,
          error: "Usuario inactivo. Contacta al administrador.",
        },
        403
      );
    }

    const isPasswordValid = await verifyPassword(
      password,
      user.password_hash,
      user.salt
    );

    if (!isPasswordValid) {
      return c.json(
        {
          success: false,
          error: "Credenciales inválidas",
        },
        401
      );
    }

    const updateLoginStmt = c.env.DB.prepare(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?"
    );

    await updateLoginStmt.bind(user.id).run();

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION,
      iat: Math.floor(Date.now() / 1000),
    };

    const secret = await c.env.JWT_SECRET.get();
    const token = await sign(payload, secret);

    setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: false, // false para desarrollo local
      sameSite: "Lax",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    });

    return c.json({
      success: true,
      message: "Login exitoso",
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
        },
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    return c.json(
      {
        success: false,
        error: "Error al iniciar sesión",
      },
      500
    );
  }
});

auth.post("/logout", (c) => {
  setCookie(c, "auth_token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    maxAge: 0,
    path: "/",
  });

  return c.json({
    success: true,
    message: "Logout exitoso",
  });
});

auth.get("/me", (c) => {
  const user = c.get("user");

  return c.json({
    success: true,
    data: user,
  });
});

export default auth;
