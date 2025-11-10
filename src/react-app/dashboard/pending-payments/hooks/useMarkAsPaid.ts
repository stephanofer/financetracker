import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface MarkAsPaidData {
  id: number;
  account_id: string;
  transaction_date: string;
  notes?: string;
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MarkAsPaidData) => {
      const response = await fetch(`/api/pending-payments/${data.id}/mark-paid`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          account_id: parseInt(data.account_id),
          transaction_date: data.transaction_date,
          notes: data.notes || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al marcar el pago como pagado");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error al registrar pago", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: (_data: unknown, variables: MarkAsPaidData) => {
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      queryClient.invalidateQueries({ queryKey: ["pending-payment", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("¡Pago registrado!", {
        description: "El pago se marcó como completado",
        duration: 3000,
      });
    },
  });
}
