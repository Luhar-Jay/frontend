import type { Expense, ExpenseCategory, ExpenseStatus } from "../../types/expense.types";

export const currencyFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

export const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export const STATUS_ORDER: ExpenseStatus[] = [
  "draft",
  "pending",
  "approved",
  "rejected",
  "reimbursed",
];

export const STATUS_LABEL: Record<ExpenseStatus, string> = {
  draft: "Draft",
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  reimbursed: "Reimbursed",
};

export const STATUS_BADGE: Record<ExpenseStatus, string> = {
  draft: "bg-slate-100 text-slate-700 ring-slate-200",
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  approved: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-50 text-rose-700 ring-rose-200",
  reimbursed: "bg-violet-50 text-violet-700 ring-violet-200",
};

export const STATUS_DOT: Record<ExpenseStatus, string> = {
  draft: "bg-slate-400",
  pending: "bg-amber-500",
  approved: "bg-emerald-500",
  rejected: "bg-rose-500",
  reimbursed: "bg-violet-500",
};

export const STATUS_OPTIONS: { label: string; value: "all" | ExpenseStatus }[] = [
  { label: "All statuses", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Reimbursed", value: "reimbursed" },
];

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

export function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return dateTimeFmt.format(new Date(iso));
  } catch {
    return "—";
  }
}

export function formatAmount(amount: number) {
  return currencyFmt.format(amount);
}

export function todayYmd() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export function expenseEmployeeName(expense: Expense): string {
  const e = expense.employee;
  if (typeof e === "object" && e !== null && "name" in e) return e.name ?? "—";
  return "—";
}

export function expenseEmployeeEmail(expense: Expense): string | undefined {
  const e = expense.employee;
  if (typeof e === "object" && e !== null && "email" in e) return e.email;
  return undefined;
}

export function expenseCategoryName(expense: Expense): string {
  const c = expense.category;
  if (typeof c === "object" && c !== null && "name" in c) return c.name ?? "—";
  return "—";
}

export function expenseApproverName(expense: Expense): string | null {
  const a = expense.approvedBy;
  if (typeof a === "object" && a !== null && "name" in a) return a.name ?? null;
  return null;
}

export function activeCategoryOptions(categories: ExpenseCategory[]) {
  return categories
    .filter((c) => c.isActive)
    .map((c) => ({ label: c.name, value: c._id }));
}

export function isOwnerOf(expense: Expense, userId: string | undefined): boolean {
  if (!userId) return false;
  const e = expense.employee;
  if (typeof e === "object" && e !== null && "_id" in e) return e._id === userId;
  return e === userId;
}

export function canEditOwn(expense: Expense): boolean {
  return expense.status === "draft" || expense.status === "pending";
}

export function getReceiptKind(url: string | null): "image" | "pdf" | "other" | null {
  if (!url) return null;
  const lower = url.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (/\.(png|jpe?g|webp|gif|bmp|svg)(\?|$)/.test(lower)) return "image";
  return "other";
}
