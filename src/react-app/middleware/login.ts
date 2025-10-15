import { redirect } from "react-router";

// @ts-ignore
export async function loggingMiddleware({ request }, next) {
  const response = await fetch("/api/me", {
    credentials: "include",
  });

  console.log("me quedo");
  if (response.ok) {
    throw redirect("/dashboard");
  }
}
