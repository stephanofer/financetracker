import { ApiResponse, DebtsApiResponse } from "@/dashboard/utils/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useDebts() {
  return useQuery({
    queryKey: ["debts"],
    queryFn: async (): Promise<ApiResponse<DebtsApiResponse>> => {
      const response = await fetch(`/api/debts`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener los gastos");
      }

      return response.json();
    },
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newDebt: unknown) => {
      const response = await fetch(`/api/debts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(newDebt),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear la deuda");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    }
  });
}
