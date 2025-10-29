export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
}

export type AccountType =
  | "cash"
  | "debit"
  | "credit"
  | "bank"
  | "savings"
  | "investments";

export type TransactionType =
  | "income"
  | "expense"
  | "debt"
  | "debt_payment"
  | "transfer";

export type TransactionSimpleType = "expense" | "income" | null;

export type FileType = "image" | "document" | "other";
export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  description: string | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  destination_account_id: number | null;
  debt_id: number | null;
  category_name: string | null;
  category_icon: string | null;
  category_color: string | null;
  subcategory_name: string | null;
  account_name: string | null;
  account_type: string | null;
  attachments?: Attachment[];
}

export interface Attachment {
  id: number;
  transaction_id: number;
  file_name: string;
  original_file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  file_type: FileType;
  r2_key: string;
  r2_url: string | null;
  description: string | null;
  uploaded_at: string;
  updated_at: string;
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

export interface TransactionInput {
  amount: number;
  description?: string;
  date: string;
  accountId: number;
  categoryId?: number;
  subcategoryId?: number;
  notes?: string;
  userId: number;
  file?: File[]; // archivos adjuntos
}
export interface TotalBalance {
  total_balance: number;
  total_accounts: number;
}

export interface Expenses {
  results: Transaction[];
  total: {
    total_expenses: number;
    total_count: number;
  };
}

export interface Summary {
  results: Transaction[];
  total: {
    total_expenses: number;
    total_balance: number;
  };
}

export type DebtStatus = "active" | "paid" | "overdue" | "partially_paid";
export type DebtType = "person" | "institution";

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
  payments: {
    total: number;
    count: number;
    last_date: string | null;
  };
  installments: {
    total: number;
    pending: number;
    overdue: number;
    paid: number;
    partial: number;
    next_due_date: string | null;
  };
};

export type DebtsApiResponse = {
  summary: {
    total_pending_debt: number;
    total_paid: number;
  };
  debts: DebtRowWithAggregates[];
};
