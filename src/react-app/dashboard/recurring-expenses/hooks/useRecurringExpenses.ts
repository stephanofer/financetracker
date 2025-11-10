import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Tipos
export interface RecurringExpense {
  id: number;
  name: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "annual";
  charge_day: number;
  status: "active" | "paused" | "cancelled";
  next_charge_date: string | null;
  last_charge_date: string | null;
  notify_3_days: boolean;
  notify_1_day: boolean;
  notify_same_day: boolean;
  created_at: string;
  updated_at: string;
  category: {
    id: number;
    name: string;
    color: string;
    icon: string;
  } | null;
  subcategory: {
    id: number;
    name: string;
  } | null;
  account: {
    id: number;
    name: string;
    type: string;
    icon: string | null;
    color: string | null;
  };
}

export interface RecurringExpenseDetailResponse {
  expense: RecurringExpense;
  history: {
    transactions: Array<{
      id: number;
      amount: number;
      transaction_date: string;
      description: string | null;
      notes: string | null;
      created_at: string;
    }>;
    count: number;
  };
  statistics: {
    days_since_creation: number;
    days_until_next_charge: number | null;
    is_due_soon: boolean;
    total_spent_history: number;
  };
}

interface RecurringExpensesResponse {
  success: boolean;
  data: {
    summary: {
      total: number;
      active: number;
      paused: number;
      cancelled: number;
      monthly_estimate: number;
    };
    recurring_expenses: RecurringExpense[];
  };
  count: number;
}

interface CreateRecurringExpenseData {
  name: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "annual";
  charge_day: number;
  account_id: number;
  category_id?: number;
  subcategory_id?: number;
  notify_3_days?: boolean;
  notify_1_day?: boolean;
  notify_same_day?: boolean;
}

// Hook para obtener todos los gastos recurrentes
export function useRecurringExpenses(status?: string) {
  return useQuery<RecurringExpensesResponse>({
    queryKey: ["recurring-expenses", status],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);

      const response = await fetch(
        `/api/recurring-expenses${params.toString() ? `?${params}` : ""}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener gastos recurrentes");
      }

      return response.json();
    },
  });
}

// Hook para obtener detalle de un gasto recurrente
export function useRecurringExpenseDetail(id: number) {
  return useQuery<{ success: boolean; data: RecurringExpenseDetailResponse }>({
    queryKey: ["recurring-expense", id],
    queryFn: async () => {
      const response = await fetch(`/api/recurring-expenses/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener el detalle");
      }

      return response.json();
    },
    enabled: !!id,
  });
}

// Hook para crear un gasto recurrente
export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRecurringExpenseData) => {
      const response = await fetch("/api/recurring-expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear el gasto recurrente");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error al crear", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
    },
  });
}

// Hook para eliminar un gasto recurrente
export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/recurring-expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al eliminar el gasto recurrente");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error al eliminar", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expenses"] });
    },
  });
}

// Hook para cambiar estado
export function useUpdateRecurringExpenseStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/recurring-expenses/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar el estado");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar estado", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["recurring-expense", variables.id] });
    },
  });
}
