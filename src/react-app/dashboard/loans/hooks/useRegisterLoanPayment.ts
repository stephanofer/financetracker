import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface RegisterPaymentData {
  loanId: number;
  amount: number;
  account_id: number;
  transaction_date: string;
  description?: string;
  notes?: string;
  file?: File | null;
}

export const useRegisterLoanPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterPaymentData) => {
      console.log(data);
      
      // Crear FormData en lugar de JSON
      const formData = new FormData();
      formData.append("type", "loan_payment");
      formData.append("amount", data.amount.toString());
      formData.append("accountId", data.account_id.toString());
      formData.append("loanId", data.loanId.toString());
      formData.append("date", data.transaction_date);
      formData.append("description", data.description || `Pago de préstamo`);
      
      if (data.notes) {
        formData.append("notes", data.notes);
      }

      if (data.file) {
        formData.append("file", data.file);
      }

      const response = await fetch("/api/transactions", {
        method: "POST",
        credentials: "include",
        body: formData, // Enviar FormData sin Content-Type (el browser lo configura automáticamente)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al registrar el pago");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error al registrar pago", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["loan", variables.loanId] });
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
};
