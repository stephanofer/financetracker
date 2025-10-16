import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LoginFormData } from "@/home/schems/LoginSchema";

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      username: string;
      email: string | null;
      full_name: string | null;
    };
  };
}

async function loginUser(credentials: LoginFormData): Promise<LoginResponse> {
  const response = await fetch("/api/login", {
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
    queryFn: async () => {
      const response = await fetch("/api/me", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error fetching user profile");
      }
      const data = await response.json();
      return data.data;
    },
  });
}
