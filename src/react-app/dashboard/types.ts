export type ActionType = "expense" | "income" | null;

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

// interface Pagination {
//   limit: number;
//   offset: number;
//   total: number;
// }

export interface Subcategory {
  id: number;
  category_id: number;
  name: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
}

export interface Account {
  id: number;
  user_id: number;
  name: string;
  type: "cash" | "debit" | "credit" | "bank" | "savings" | "investments";
  balance: number;
  currency: string;
  color: string | null;
  icon: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: number;
  transaction_id: number;
  file_name: string;
  original_file_name: string | null;
  file_size: number | null; // bytes
  mime_type: string | null;
  file_type: "image" | "pdf" | "document" | "receipt" | "other" | null;
  r2_key: string;
  r2_url: string | null;
  description: string | null;
  uploaded_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  user_id: number;
  type: "income" | "expense" | "debt" | "debt_payment" | "transfer";
  amount: number;
  category_id: number | null;
  subcategory_id: number | null;
  account_id: number;
  description: string | null;
  notes: string | null;
  transaction_date: string;
  created_at: string;
  updated_at: string;
  destination_account_id: number | null;
  debt_id: number | null;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  subcategory_name?: string;
  account_name?: string;
  account_type?: string;
  attachments?: Attachment[];
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

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  // pagination?: Pagination;
}

export interface ApiResponseTransaction {
  success: boolean;
  id: number;
  attachment: {
    r2_key: string;
    r2_url: string;
  } | null;
}

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
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
