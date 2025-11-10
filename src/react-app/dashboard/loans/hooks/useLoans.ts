import { useQuery } from "@tanstack/react-query";

interface LoanSummary {
  total_pending_to_receive: number;
  total_received: number;
  overdue_loans_count: number;
}

interface LoanPayments {
  total: number;
  count: number;
  last_date: string | null;
}

interface LoanAccount {
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
}

export interface Loan {
  id: number;
  debtor_name: string;
  debtor_contact: string | null;
  original_amount: number;
  remaining_amount: number;
  interest_rate: number;
  loan_date: string;
  due_date: string | null;
  status: "active" | "paid" | "overdue" | "partial";
  notes: string | null;
  account_id: number | null;
  payments: LoanPayments;
  account: LoanAccount | null;
}

interface LoansResponse {
  success: boolean;
  data: {
    summary: LoanSummary;
    loans: Loan[];
  };
  count: number;
}

export const useLoans = () => {
  return useQuery<LoansResponse>({
    queryKey: ["loans"],
    queryFn: async () => {
      const response = await fetch("/api/loans", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener préstamos");
      }

      return response.json();
    },
  });
};
