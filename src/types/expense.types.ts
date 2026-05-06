/**
 * Mirrors the backend expense + expenseCategory models and controller responses.
 * See: backend/model/expenses.model.js, backend/controllers/expenses.controller.js.
 */

export type ExpenseStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "reimbursed";

export interface ExpenseCategory {
  _id: string;
  name: string;
  isActive: boolean;
  organization?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseUserSummary {
  _id: string;
  name: string;
  email?: string;
}

export interface Expense {
  _id: string;
  employee: ExpenseUserSummary | string;
  organization?: string | null;
  category: ExpenseCategory | string;
  amount: number;
  expenseDate: string;
  description?: string;
  receiptUrl: string | null;
  receiptPublicId: string | null;
  status: ExpenseStatus;
  approvedBy?: ExpenseUserSummary | string | null;
  approvedAt?: string | null;
  rejectionReason?: string;
  reimbursedAt?: string | null;
  payrollIncluded?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExpensePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ExpensesListResponse {
  success: boolean;
  message: string;
  expenses: Expense[];
  pagination: ExpensePagination;
}

export interface ExpenseSingleResponse {
  success: boolean;
  message: string;
  expense: Expense;
}

export interface ExpenseStatusBucket {
  count: number;
  totalAmount: number;
}

export interface ExpenseSummary {
  draft: ExpenseStatusBucket;
  pending: ExpenseStatusBucket;
  approved: ExpenseStatusBucket;
  rejected: ExpenseStatusBucket;
  reimbursed: ExpenseStatusBucket;
}

export interface ExpenseSummaryResponse {
  success: boolean;
  message: string;
  summary: ExpenseSummary;
  grandTotal: number;
}

export interface MonthlyReportRow {
  employee: ExpenseUserSummary;
  totalAmount: number;
  reimbursedAmount: number;
  pendingReimbursementAmount: number;
  expenseCount: number;
  expenses: Expense[];
}

export interface MonthlyReportResponse {
  success: boolean;
  message: string;
  month: number;
  year: number;
  grandTotal: number;
  report: MonthlyReportRow[];
}

export interface ExpenseCategoriesListResponse {
  success: boolean;
  message: string;
  expenseCategories: ExpenseCategory[];
}

export interface ExpenseCategoryResponse {
  success: boolean;
  message: string;
  expenseCategory: ExpenseCategory;
}

export interface CreateExpenseInput {
  amount: number;
  date: string;
  description?: string;
  category: string;
  receipt?: File | null;
}

export interface UpdateExpenseInput {
  amount?: number;
  date?: string;
  description?: string;
  category?: string;
  receipt?: File | null;
}

export interface ReviewExpenseInput {
  status: "approved" | "rejected";
  comment?: string;
}

export interface ReimburseExpenseInput {
  payrollIncluded?: boolean;
}

export interface ExpenseFilters {
  page?: number;
  limit?: number;
  status?: "all" | ExpenseStatus;
  category?: string;
  fromDate?: string;
  toDate?: string;
  employeeId?: string;
  month?: number;
  year?: number;
}
