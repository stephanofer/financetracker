import { MiddlewareFunction, redirect } from "react-router";
import { userContext } from "@/contexts/auth";
import { ApiResponse, User } from "@/dashboard/utils/types";

export const authMiddleware: MiddlewareFunction = async ({ context }, next) => {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });

  if (!response.ok) {
    throw redirect("/");
  }

  const { data } = (await response.json()) as ApiResponse<User>;

  if (!data) {
    throw redirect("/");
  }

  context.set(userContext, data);
  return next();
};
