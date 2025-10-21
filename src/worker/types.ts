import { JwtVariables } from "hono/jwt";

export type Variables = JwtVariables & {
  user: {
    id: number;
    username: string;
    email: string | null;
    full_name: string | null;
  };
};

export type AppContext = {
  Bindings: Env;
  Variables: Variables;
};

export type User = {
  id: number;
  username: string;
  password_hash: string;
  salt: string;
  email: string;
  full_name: string;
  is_active: number;
};

type DebtRow = {
  id: number;
  user_id: number;
  name: string;
  type: "person" | "institution" | "credit_card" | "loan" | "mortgage" | "other";
  original_amount: number;
  remaining_amount: number;
  interest_rate: number | null;
  start_date: string;
  due_date: string | null;
  status: "active" | "paid" | "overdue" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  has_installments:  boolean;
};

export type DebtRowWithAggregates = DebtRow & {
  total_paid: number | null;
  payments_count: number | null;
  last_payment_date: string | null;
  installments_count: number | null;
  pending_installments: number | null;
  overdue_installments: number | null;
  paid_installments: number | null;
  partial_installments: number | null;
  total_installment_amount: number | null;
  total_paid_installments: number | null;
  next_installment_due_date: string | null;
};

export type DebtsSummary = {
  totalDebts: number;
  activeDebts: number;
  overdueDebts: number;
  paidDebts: number;
  totalOriginalAmount: number;
  totalRemainingAmount: number;
  totalPaidAmount: number;
  nextDueDebt: {
    id: number;
    name: string;
    dueDate: string;
    remainingAmount: number;
    daysUntilDue: number | null;
  } | null;
};

