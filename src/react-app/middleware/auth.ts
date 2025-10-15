import { redirect } from "react-router";
import { userContext } from "@/contexts/auth";

// @ts-ignore
export async function authMiddleware({ context }) {
  const response = await fetch("/api/me", {
    credentials: "include",
  });
  console.log("data");

  if (!response.ok) {
    throw redirect("/");
  }
  console.log("data");
  const { data } = await response.json();
  console.log(data);

  if (!data) {
    throw redirect("/login");
  }

  context.set(userContext, data);
}
