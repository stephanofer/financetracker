import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoginFormData } from "@/home/schems/LoginSchema";
import { ApiResponse, User } from "@/dashboard/utils/types";

async function loginUser(
  credentials: LoginFormData
): Promise<ApiResponse<User>> {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al iniciar sesión");
  }

  return data;
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["user"],
    queryFn: async (): Promise<ApiResponse<User>> => {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error fetching user profile");
      }
      const data = (await response.json()) as ApiResponse<User>;
      return data;
    },
  });
}
