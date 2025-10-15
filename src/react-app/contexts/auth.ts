import { createContext } from "react-router";

export interface User {
  id: number;
  username: string;
  email: string | null;
  full_name: string | null;
}

export const userContext = createContext<User>();
