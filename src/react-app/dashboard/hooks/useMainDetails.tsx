import { useQuery } from "@tanstack/react-query";
import {
  ApiResponse,
  Expenses,
  Summary,
  TotalBalance,
  Transaction,
} from "../types";

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

interface useTransactionsOptions {
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
}

export function useExpenses(options: useTransactionsOptions = {}) {
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

export function useTransactions(options: useTransactionsOptions = {}) {
  const { limit, offset = 0, startDate, endDate, type } = options;

  return useQuery({
    queryKey: ["transactions", limit, offset, startDate, endDate, type],
    queryFn: async (): Promise<ApiResponse<Transaction[]>> => {
      const params = new URLSearchParams({
        offset: offset.toString(),
      });

      if (type) params.append("type", type);
      if (limit) params.append("limit", limit.toString());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/transactions?${params}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Error al obtener las transacciones"
        );
      }

      return response.json();
    },
  });
}

export function useSummary(options: { limit?: number; offset?: number } = {}) {
  const { limit, offset = 0 } = options;

  return useQuery({
    queryKey: ["summary", limit, offset],
    queryFn: async (): Promise<ApiResponse<Summary>> => {
      const params = new URLSearchParams({
        offset: offset.toString(),
      });

      if (limit) params.append("limit", limit.toString());

      const response = await fetch(`/api/transactions/summary?${params}`, {
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
