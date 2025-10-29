import { User } from "@/dashboard/utils/types";
import { createContext } from "react-router";

export const userContext = createContext<User>();
