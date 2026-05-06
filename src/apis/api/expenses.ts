import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type {
  CreateExpenseInput,
  ExpenseFilters,
  ExpenseSingleResponse,
  ExpenseSummaryResponse,
  ExpensesListResponse,
  MonthlyReportResponse,
  ReimburseExpenseInput,
  ReviewExpenseInput,
  UpdateExpenseInput,
} from "../../types/expense.types";

export const expensesQueryKey = ["expenses"] as const;
export const expenseSummaryQueryKey = ["expenses", "summary"] as const;
export const expenseReportQueryKey = ["expenses", "report"] as const;

const buildQuery = (filters: ExpenseFilters): Record<string, string | number> => {
  const out: Record<string, string | number> = {};
  if (filters.page) out.page = filters.page;
  if (filters.limit) out.limit = filters.limit;
  if (filters.status && filters.status !== "all") out.status = filters.status;
  if (filters.category) out.category = filters.category;
  if (filters.fromDate) out.fromDate = filters.fromDate;
  if (filters.toDate) out.toDate = filters.toDate;
  if (filters.employeeId) out.employeeId = filters.employeeId;
  if (filters.month) out.month = filters.month;
  if (filters.year) out.year = filters.year;
  return out;
};

export function useMyExpenses(filters: ExpenseFilters, enabled = true) {
  return useQuery({
    queryKey: [...expensesQueryKey, "my", filters],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () =>
      api.get<ExpensesListResponse>(apiPath.expenses.my, {
        auth: true,
        query: buildQuery(filters),
      }),
  });
}

export function useTeamExpenses(filters: ExpenseFilters, enabled = true) {
  return useQuery({
    queryKey: [...expensesQueryKey, "team", filters],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () =>
      api.get<ExpensesListResponse>(apiPath.expenses.list, {
        auth: true,
        query: buildQuery(filters),
      }),
  });
}

export function useExpenseSummary(enabled = true) {
  return useQuery({
    queryKey: expenseSummaryQueryKey,
    enabled,
    queryFn: () =>
      api.get<ExpenseSummaryResponse>(apiPath.expenses.summary, { auth: true }),
  });
}

export function useExpenseMonthlyReport(
  params: { month: number; year: number; employeeId?: string },
  enabled = true
) {
  return useQuery({
    queryKey: [...expenseReportQueryKey, params],
    enabled,
    placeholderData: keepPreviousData,
    queryFn: () =>
      api.get<MonthlyReportResponse>(apiPath.expenses.report, {
        auth: true,
        query: {
          month: params.month,
          year: params.year,
          ...(params.employeeId ? { employeeId: params.employeeId } : {}),
        },
      }),
  });
}

function toExpenseFormData(input: CreateExpenseInput | UpdateExpenseInput) {
  const fd = new FormData();
  if (input.amount !== undefined) fd.append("amount", String(input.amount));
  if (input.date) fd.append("date", input.date);
  if (input.description !== undefined) fd.append("description", input.description ?? "");
  if (input.category) fd.append("category", input.category);
  if (input.receipt) fd.append("receipt", input.receipt);
  return fd;
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["expenses", "create"],
    mutationFn: (body: CreateExpenseInput) =>
      api.upload<ExpenseSingleResponse>(
        "POST",
        apiPath.expenses.create,
        toExpenseFormData(body),
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expensesQueryKey });
    },
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["expenses", "update"],
    mutationFn: ({ id, body }: { id: string; body: UpdateExpenseInput }) =>
      api.upload<ExpenseSingleResponse>(
        "PUT",
        `${apiPath.expenses.byId}${id}`,
        toExpenseFormData(body),
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expensesQueryKey });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["expenses", "delete"],
    mutationFn: (id: string) =>
      api.del<{ success: boolean; message: string }>(`${apiPath.expenses.byId}${id}`, {
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expensesQueryKey });
    },
  });
}

export function useReviewExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["expenses", "review"],
    mutationFn: ({ id, body }: { id: string; body: ReviewExpenseInput }) =>
      api.put<ExpenseSingleResponse>(
        apiPath.expenses.review.replace(":id", id),
        body,
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expensesQueryKey });
    },
  });
}

export function useReimburseExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["expenses", "reimburse"],
    mutationFn: ({ id, body }: { id: string; body: ReimburseExpenseInput }) =>
      api.put<ExpenseSingleResponse>(
        apiPath.expenses.reimburse.replace(":id", id),
        body,
        { auth: true }
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expensesQueryKey });
    },
  });
}
