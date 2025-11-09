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

export type TransactionType =
  | "income"
  | "expense"
  | "debt"
  | "debt_payment"
  | "transfer";

export type AccountType =
  | "cash"
  | "debit"
  | "credit"
  | "bank"
  | "savings"
  | "investments";

export interface User {
  id: number;
  username: string;
  password_hash: string;
  salt: string;
  email: string;
  full_name: string;
  is_active: number;
}

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  category_id: number | null;
  subcategory_id: number | null;
  account_id: number | null;
  description: string | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  destination_account_id: number | null;
  debt_id: number | null;
}

export interface Category {
  id: number;
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}




export type Debt = {
  id: number;
  name: string;
  type:
    | "person"
    | "institution"
    | "credit_card"
    | "loan"
    | "mortgage"
    | "other";
  original_amount: number;
  remaining_amount: number;
  interest_rate: number | null;
  start_date: string;
  due_date: string | null;
  status: "active" | "paid" | "overdue" | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  has_installments: boolean;
};

export type DebtRowWithAggregates = Debt & {
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

export type DebtPaymentRow = {
  id: number;
  amount: number;
  transaction_date: string;
  description: string | null;
  notes: string | null;
  created_at: string;
  account_name: string | null;
  account_type: string | null;
  account_icon: string | null;
  account_color: string | null;
};

export type DebtInstallmentRow = {
  id: number;
  installment_number: number;
  amount: number;
  due_date: string;
  status: "pending" | "paid" | "overdue" | "partial";
  paid_amount: number;
  paid_date: string | null;
  notes: string | null;
  created_at: string;
  transaction_id: number | null;
  transaction_date: string | null;
};
