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
  | "loan_payment"
  | "goal_contribution"
  | "transfer"
  | "pending_payment";

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

export type RecurringExpense = {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  frequency: "weekly" | "biweekly" | "monthly" | "annual";
  charge_day: number;
  category_id: number | null;
  subcategory_id: number | null;
  account_id: number;
  status: "active" | "paused" | "cancelled";
  next_charge_date: string | null;
  last_charge_date: string | null;
  notify_3_days: boolean;
  notify_1_day: boolean;
  notify_same_day: boolean;
  created_at: string;
  updated_at: string;
};

export type RecurringExpenseWithDetails = RecurringExpense & {
  category_name: string | null;
  category_color: string | null;
  category_icon: string | null;
  subcategory_name: string | null;
  account_name: string;
  account_type: string;
  account_icon: string | null;
  account_color: string | null;
};

export type RecurringExpenseHistory = {
  id: number;
  amount: number;
  transaction_date: string;
  description: string | null;
  notes: string | null;
  created_at: string;
};

export type SavingGoal = {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  priority: "high" | "medium" | "low";
  status: "in_progress" | "achieved" | "expired" | "cancelled";
  image_url: string | null;
  auto_contribute: boolean;
  auto_contribute_percentage: number | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

export type SavingGoalWithStats = SavingGoal & {
  progress_percentage: number;
  remaining_amount: number;
  total_contributions: number;
  contributions_count: number;
  last_contribution_date: string | null;
  days_remaining: number | null;
  is_overdue: boolean;
};

export type GoalContribution = {
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

export type Loan = {
  id: number;
  user_id: number;
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
  created_at: string;
  updated_at: string;
};

export type LoanRowWithAggregates = Loan & {
  total_received: number | null;
  payments_count: number | null;
  last_payment_date: string | null;
  account_name: string | null;
  account_type: string | null;
  account_icon: string | null;
  account_color: string | null;
};

export type LoanPaymentRow = {
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

export type PendingPayment = {
  id: number;
  user_id: number;
  name: string;
  amount: number;
  due_date: string | null;
  category_id: number | null;
  subcategory_id: number | null;
  account_id: number | null;
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
};

export type PendingPaymentWithDetails = PendingPayment & {
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
  is_overdue?: boolean;
  days_until_due?: number | null;
};
