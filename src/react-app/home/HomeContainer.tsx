import React from "react";
import { LoginForm } from "@/components/login-form";
export function HomeContainer() {
  return (
    <div className="w-full h-full px-5">
      <div className="mx-auto max-w-md h-full flex flex-col justify-center">
        <LoginForm />
      </div>
    </div>
  );
}
