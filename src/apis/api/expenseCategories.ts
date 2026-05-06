import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../apiService";
import { apiPath } from "../apiPath";
import type {
  ExpenseCategoriesListResponse,
  ExpenseCategoryResponse,
} from "../../types/expense.types";

export const expenseCategoriesQueryKey = ["expenseCategories"] as const;

export function useExpenseCategories(enabled = true) {
  return useQuery({
    queryKey: expenseCategoriesQueryKey,
    enabled,
    queryFn: async () => {
      const res = await api.get<ExpenseCategoriesListResponse>(
        apiPath.expenseCategories.list,
        { auth: true }
      );
      return res.expenseCategories ?? [];
    },
  });
}

export function useCreateExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["expenseCategories", "create"],
    mutationFn: (body: { name: string }) =>
      api.post<ExpenseCategoryResponse>(apiPath.expenseCategories.create, body, {
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseCategoriesQueryKey });
    },
  });
}

export function useUpdateExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["expenseCategories", "update"],
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: { name?: string; isActive?: boolean };
    }) =>
      api.put<ExpenseCategoryResponse>(`${apiPath.expenseCategories.byId}${id}`, body, {
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseCategoriesQueryKey });
    },
  });
}

export function useDeleteExpenseCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ["expenseCategories", "delete"],
    mutationFn: (id: string) =>
      api.del<ExpenseCategoryResponse>(`${apiPath.expenseCategories.byId}${id}`, {
        auth: true,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: expenseCategoriesQueryKey });
    },
  });
}
