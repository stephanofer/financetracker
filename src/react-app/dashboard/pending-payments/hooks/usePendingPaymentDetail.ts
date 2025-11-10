import { useQuery } from "@tanstack/react-query";

export interface PendingPaymentDetail {
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
  debt_type: string | null;
  debt_remaining_amount: number | null;
  loan_debtor_name: string | null;
  loan_remaining_amount: number | null;
  transaction_date: string | null;
  is_overdue?: boolean;
  days_until_due?: number | null;
}

interface PendingPaymentDetailResponse {
  success: boolean;
  data: PendingPaymentDetail;
}

export function usePendingPaymentDetail(id: number) {
  return useQuery<PendingPaymentDetailResponse>({
    queryKey: ["pending-payment", id],
    queryFn: async () => {
      const response = await fetch(`/api/pending-payments/${id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Error al cargar el detalle del pago pendiente");
      }

      return response.json();
    },
    enabled: !!id && !isNaN(id),
  });
}
