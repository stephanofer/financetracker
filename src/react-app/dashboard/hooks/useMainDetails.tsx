
import { useQuery } from "@tanstack/react-query";

// Tipos para las respuestas de la API
interface TotalBalanceResponse {
  success: boolean;
  data: {
    total_balance: number;
    total_accounts: number;
  };
}

interface ExpenseTransaction {
  id: number;
  user_id: number;
  type: "expense";
  amount: number;
  category_id: number | null;
  subcategory_id: number | null;
  account_id: number;
  description: string | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  // Campos de los JOINs
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  subcategory_name: string | null;
  account_name: string | null;
  account_type: string | null;
}

interface ExpensesResponse {
  success: boolean;
  data: ExpenseTransaction[];
  count: number;
  total: {
    total_expenses: number;
    total_count: number;
  };
  pagination: {
    limit: number;
    offset: number;
  } | null;
}

interface UseExpensesOptions {
  userId: number;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

/**
 * Hook para obtener el balance total de todas las cuentas de un usuario
 */
export function useTotalBalance(userId: number, enabled: boolean = true) {
  return useQuery<TotalBalanceResponse, Error>({
    queryKey: ["totalBalance", userId],
    queryFn: async () => {
      console.log(userId);
      const response = await fetch(
        `/api/accounts/balance/total?userId=${userId}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Error al obtener el balance total"
        );
      }

      return response.json();
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener todos los gastos de un usuario
 */
export function useExpenses({
  userId,
  limit,
  offset = 0,
  startDate,
  endDate,
  enabled = true,
}: UseExpensesOptions) {
  return useQuery<ExpensesResponse, Error>({
    queryKey: ["expenses", userId, limit, offset, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: userId.toString(),
        offset: offset.toString(),
      });

      if (limit) params.append("limit", limit.toString());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/transactions/expenses?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al obtener los gastos");
      }

      return response.json();
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener el total de gastos sin paginación (más ligero)
 */
export function useExpensesTotal(
  userId: number,
  startDate?: string,
  endDate?: string,
  enabled: boolean = true
) {
  return useQuery<ExpensesResponse, Error>({
    queryKey: ["expensesTotal", userId, startDate, endDate],
    queryFn: async () => {
      const params = new URLSearchParams({
        userId: userId.toString(),
      });

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(`/api/transactions/expenses?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || "Error al obtener el total de gastos"
        );
      }

      return response.json();
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutos
    select: (data) => ({
      ...data,
      // Solo nos interesa el total, no la data completa
      data: [],
    }),
  });
}
