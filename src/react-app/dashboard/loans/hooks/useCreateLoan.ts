import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoanFormData } from "../schemas/LoanSchema";

interface CreateLoanData {
  debtor_name: string;
  debtor_contact?: string;
  original_amount: number;
  interest_rate?: number;
  loan_date: string;
  due_date?: string;
  notes?: string;
  account_id?: number;
}

export const useCreateLoan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: LoanFormData) => {
      const data: CreateLoanData = {
        debtor_name: formData.debtor_name,
        debtor_contact: formData.debtor_contact || undefined,
        original_amount: parseFloat(formData.original_amount),
        interest_rate: formData.interest_rate
          ? parseFloat(formData.interest_rate)
          : 0,
        loan_date: formData.loan_date,
        due_date: formData.due_date || undefined,
        notes: formData.notes || undefined,
        account_id: formData.account_id
          ? parseInt(formData.account_id)
          : undefined,
      };

      const response = await fetch("/api/loans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Error al crear el préstamo");
      }

      return response.json();
    },
    onError: (error: Error) => {
      toast.error("Error al crear préstamo", {
        description: error.message,
        duration: 4000,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loans"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
};
