import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CreatePendingPaymentData {
  name: string;
  amount: string;
  due_date?: string;
  category_id?: string;
  subcategory_id?: string;
  account_id?: string;
  priority?: "high" | "medium" | "low";
  notes?: string;
  reminder_enabled?: boolean;
}

export function useCreatePendingPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePendingPaymentData) => {
      const response = await fetch("/api/pending-payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          amount: parseFloat(data.amount),
          due_date: data.due_date || null,
          category_id: data.category_id ? parseInt(data.category_id) : null,
          subcategory_id: data.subcategory_id ? parseInt(data.subcategory_id) : null,
          account_id: data.account_id ? parseInt(data.account_id) : null,
          priority: data.priority || "medium",
          notes: data.notes || null,
          reminder_enabled: data.reminder_enabled !== undefined ? data.reminder_enabled : true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear el pago pendiente");
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
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      toast.success("Pago pendiente creado", {
        description: "El pago se agregó exitosamente a tu lista",
        duration: 3000,
      });
    },
  });
}
