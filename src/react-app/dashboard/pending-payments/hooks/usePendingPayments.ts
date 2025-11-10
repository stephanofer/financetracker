import { useQuery } from "@tanstack/react-query";

interface PendingPaymentSummary {
  total_count: number;
  pending_count: number;
  overdue_count: number;
  paid_count: number;
  cancelled_count: number;
  total_pending_amount: number;
  total_overdue_amount: number;
  high_priority_pending: number;
}

export interface PendingPayment {
  id: number;
  name: string;
  amount: number;
  due_date: string | null;
  priority: "high" | "medium" | "low";
  status: "pending" | "paid" | "cancelled" | "overdue";
  notes: string | null;
  reminder_enabled: boolean;
  debt_id: number | null;
  loan_id: number | null;
  transaction_id: number | null;
  paid_date: string | null;
  created_at: string;
  updated_at: string;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  subcategory_name: string | null;
  account_name: string | null;
  account_type: string | null;
  account_icon: string | null;
  account_color: string | null;
  debt_name: string | null;
  loan_debtor_name: string | null;
}

interface PendingPaymentsResponse {
  success: boolean;
  data: {
    summary: PendingPaymentSummary;
    pending_payments: PendingPayment[];
  };
  count: number;
}

export function usePendingPayments(status?: string, priority?: string) {
  return useQuery<PendingPaymentsResponse>({
    queryKey: ["pending-payments", status, priority],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.append("status", status);
      if (priority) params.append("priority", priority);

      const response = await fetch(
        `/api/pending-payments?${params.toString()}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Error al cargar los pagos pendientes");
      }

      return response.json();
    },
  });
}
