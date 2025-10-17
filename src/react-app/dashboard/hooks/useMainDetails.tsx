import { useQuery } from "@tanstack/react-query";
import { ApiResponse, Expenses, TotalBalance } from "../types";

export function useTotalBalance() {
  return useQuery({
    queryKey: ["totalBalance"],
    queryFn: async (): Promise<ApiResponse<TotalBalance>> => {
      const response = await fetch(`/api/accounts/balance/total`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener el balance total");
      }

      return response.json();
    },
  });
}

interface UseExpensesOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

export function useExpenses(options: UseExpensesOptions = {}) {
  const { limit, offset = 0, startDate, endDate } = options;

  return useQuery({
    queryKey: ["expenses", limit, offset, startDate, endDate],
    queryFn: async (): Promise<ApiResponse<Expenses>> => {
      const params = new URLSearchParams({
        offset: offset.toString(),
      });

      if (limit) params.append("limit", limit.toString());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      console.log(`/api/transactions/expenses?${params}`);

      const response = await fetch(`/api/transactions/expenses?${params}`, {
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
