import { ApiResponse, User } from "@/dashboard/types";
import { MiddlewareFunction, redirect } from "react-router";

export const loggingMiddleware: MiddlewareFunction = async (_context, next) => {
  const response = await fetch("/api/me", {
    credentials: "include",
  });

  if (response.ok) {
    const { data } = (await response.json()) as ApiResponse<User>;
    if (data) {
      throw redirect("/dashboard");
    }
  }

  return next();
};
