import { useQuery } from "@tanstack/react-query";

interface LoanPayment {
  id: number;
  amount: number;
  transaction_date: string;
  description: string | null;
  notes: string | null;
  created_at: string;
  account: {
    name: string;
    type: string;
    icon: string | null;
    color: string | null;
  } | null;
}

interface LoanDetailData {
  loan: {
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
    payments: {
      total: number;
      count: number;
      last_date: string | null;
    };
    account: {
      name: string;
      type: string;
      icon: string | null;
      color: string | null;
    } | null;
  };
  payments: {
    list: LoanPayment[];
    statistics: {
      total_payments: number;
      total_amount: number;
      average_amount: number;
      last_payment: LoanPayment | null;
    };
  };
  summary: {
    payment_progress: number;
    is_overdue: boolean;
    days_since_loan: number;
    days_until_due: number | null;
  };
}

interface LoanDetailResponse {
  success: boolean;
  data: LoanDetailData;
}

export const useLoanDetail = (id: number) => {
  return useQuery<LoanDetailResponse>({
    queryKey: ["loan", id],
    queryFn: async () => {
      const response = await fetch(`/api/loans/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al obtener el detalle del préstamo");
      }

      return response.json();
    },
    enabled: !!id,
  });
};
