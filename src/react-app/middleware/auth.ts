import { MiddlewareFunction, redirect } from "react-router";
import { userContext } from "@/contexts/auth";

export const authMiddleware: MiddlewareFunction = async ({ context }, next) => {
  const response = await fetch("/api/me", {
    credentials: "include",
  });

  if (!response.ok) {
    throw redirect("/");
  }

  const { data } = await response.json();

  if (!data) {
    throw redirect("/");
  }

  context.set(userContext, data);
  return next();
};
