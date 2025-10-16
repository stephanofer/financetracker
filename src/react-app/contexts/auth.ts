import { User } from "@/dashboard/types";
import { createContext } from "react-router";

export const userContext = createContext<User>();
