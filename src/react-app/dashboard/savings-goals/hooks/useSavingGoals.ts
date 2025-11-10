import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// Tipos
export interface SavingGoal {
  id: number;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  priority: "high" | "medium" | "low";
  status: "in_progress" | "achieved" | "expired" | "cancelled";
  image_url: string | null;
  auto_contribute: boolean;
  auto_contribute_percentage: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  progress_percentage: number;
  remaining_amount: number;
  days_remaining: number | null;
  is_overdue: boolean;
  contributions: {
    total: number;
    count: number;
    last_date: string | null;
  };
}

export interface SavingGoalDetailResponse {
  goal: SavingGoal;
  contributions_history: {
    transactions: Array<{
      id: number;
      amount: number;
      transaction_date: string;
      description: string | null;
      notes: string | null;
      account: {
        id: number;
        name: string;
        icon: string | null;
        color: string | null;
      };
      created_at: string;
    }>;
    count: number;
  };
  statistics: {
    average_contribution: number;
    largest_contribution: number;
    days_since_creation: number;
    estimated_days_to_complete: number | null;
  };
}

interface SavingGoalsResponse {
  success: boolean;
  data: {
    summary: {
      total: number;
      in_progress: number;
      achieved: number;
      expired: number;
      cancelled: number;
      total_target_in_progress: number;
      total_saved_in_progress: number;
      total_remaining: number;
      total_achieved_amount: number;
    };
    goals: SavingGoal[];
  };
  count: number;
}

interface CreateSavingGoalData {
  name: string;
  description?: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string;
  priority?: "high" | "medium" | "low";
  image_url?: string;
  auto_contribute?: boolean;
  auto_contribute_percentage?: number;
}

interface ContributeToGoalData {
  amount: number;
  account_id: number;
  transaction_date?: string;
  description?: string;
  notes?: string;
}

// Hook para obtener todas las metas de ahorro
export function useSavingGoals(status?: string, priority?: string) {
  return useQuery<SavingGoalsResponse>({
    queryKey: ["saving-goals", status, priority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);

      const response = await fetch(
        `/api/saving-goals${params.toString() ? `?${params}` : ""}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Error al obtener las metas de ahorro");
      }

      return response.json();
    },
  });
}

// Hook para obtener detalle de una meta de ahorro
export function useSavingGoalDetail(id: number) {
  return useQuery<{ success: boolean; data: SavingGoalDetailResponse }>({
    queryKey: ["saving-goal", id],
    queryFn: async () => {
      const response = await fetch(`/api/saving-goals/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener el detalle de la meta");
      }

      return response.json();
    },
    enabled: !!id,
  });
}

// Hook para crear una meta de ahorro
export function useCreateSavingGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSavingGoalData) => {
      const response = await fetch("/api/saving-goals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear la meta de ahorro");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error al crear meta", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saving-goals"] });
    },
  });
}

// Hook para actualizar una meta de ahorro
export function useUpdateSavingGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CreateSavingGoalData> }) => {
      const response = await fetch(`/api/saving-goals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al actualizar la meta de ahorro");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error al actualizar", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["saving-goal", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["saving-goals"] });
    },
  });
}

// Hook para cambiar estado de una meta
export function useUpdateSavingGoalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/saving-goals/${id}/status`, {
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
      queryClient.invalidateQueries({ queryKey: ["saving-goal", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["saving-goals"] });
    },
  });
}

// Hook para eliminar una meta de ahorro
export function useDeleteSavingGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/saving-goals/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al eliminar la meta de ahorro");
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
      queryClient.invalidateQueries({ queryKey: ["saving-goals"] });
    },
  });
}

// Hook para contribuir a una meta
export function useContributeToGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ContributeToGoalData }) => {
      const response = await fetch(`/api/saving-goals/${id}/contribute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al realizar la contribución");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error al contribuir", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["saving-goal", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["saving-goals"] });
    },
  });
}
