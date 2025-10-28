import { Account, ApiResponse, Transaction } from "@/dashboard/types";
import { useQuery } from "@tanstack/react-query";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async (): Promise<ApiResponse<Account[]>> => {
      const response = await fetch(`/api/accounts`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener la transacción");
      }

      return response.json();
    },
  });
}

export function useAccount(
  id: number,
  options?: { offset?: number; limit?: number }
) {
  const offset = options?.offset ?? 0;
  const limit = options?.limit ?? 10;
  return useQuery({
    queryKey: ["accounts", id, offset, limit],
    queryFn: async (): Promise<
      ApiResponse<{ result: Account; transactions: Transaction[] }>
    > => {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(limit),
      });
      const response = await fetch(`/api/accounts/${id}?${params.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener la cuenta");
      }

      return response.json();
    },
  });
}
