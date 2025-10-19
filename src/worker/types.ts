import { JwtVariables } from "hono/jwt";

export type Variables = JwtVariables & {
  user: {
    id: number;
    username: string;
    email: string | null;
    full_name: string | null;
  };
};

export type AppContext = {
  Bindings: Env;
  Variables: Variables;
};

export type User = {
  id: number;
  username: string;
  password_hash: string;
  salt: string;
  email: string;
  full_name: string;
  is_active: number;
};
