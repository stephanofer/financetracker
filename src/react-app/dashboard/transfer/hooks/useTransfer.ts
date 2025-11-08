import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TransferData {
  sourceAccountId: string;
  destinationAccountId: string;
  amount: string;
  description?: string;
}

export function useTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TransferData) => {
      const response = await fetch("/api/transactions/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sourceAccountId: parseInt(data.sourceAccountId),
          destinationAccountId: parseInt(data.destinationAccountId),
          amount: parseFloat(data.amount),
          description: data.description || "Transferencia entre cuentas",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al realizar la transferencia");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error en la transferencia", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["summary", 10, 10] });
    },
  });
}
