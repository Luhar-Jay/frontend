import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Eye,
  FileSpreadsheet,
  Filter,
  Inbox,
  Pencil,
  Plus,
  Receipt,
  Settings2,
  Trash2,
  Wallet,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { getUserId } from "../../utils/session";
import { useUserById } from "../../apis/api/auth";
import {
  useExpenseMonthlyReport,
  useExpenseSummary,
  useMyExpenses,
  useTeamExpenses,
  useDeleteExpense,
} from "../../apis/api/expenses";
import { useExpenseCategories } from "../../apis/api/expenseCategories";
import { ApiError } from "../../apis/apiService";

import Button from "../../components/UI/Button";
import Modal from "../../components/UI/Model";
import { PillTabBar } from "../../components/UI/PillTabBar";

import type {
  Expense,
  ExpenseFilters,
  ExpenseStatus,
  ExpenseSummary,
} from "../../types/expense.types";

import ExpenseFormModal from "./ExpenseFormModal";
import ExpenseDetailModal from "./ExpenseDetailModal";
import ExpenseReviewModal from "./ExpenseReviewModal";
import ExpenseReimburseModal from "./ExpenseReimburseModal";
import ExpenseCategoryManagerModal from "./ExpenseCategoryManagerModal";
import {
  MONTH_LABELS,
  STATUS_BADGE,
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_OPTIONS,
  canEditOwn,
  expenseCategoryName,
  expenseEmployeeName,
  formatAmount,
  formatDate,
  isOwnerOf,
} from "./expenseUtils";

const PAGE_SIZE = 10;

type Tab = "mine" | "inbox" | "report";

function emptyFilters(): ExpenseFilters {
  return {
    page: 1,
    limit: PAGE_SIZE,
    status: "all",
    category: "",
    fromDate: "",
    toDate: "",
  };
}

function StatusPill({ status }: { status: ExpenseStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${STATUS_BADGE[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  );
}

function SummaryCards({ summary, total }: { summary: ExpenseSummary; total: number }) {
  const cards: {
    key: keyof ExpenseSummary | "total";
    label: string;
    icon: React.ReactNode;
    classes: string;
    count: number | string;
    amount: number;
  }[] = [
    {
      key: "total",
      label: "Total tracked",
      icon: <Wallet className="h-4 w-4" />,
      classes: "from-violet-500 to-indigo-500 text-white",
      count: summary.draft.count + summary.pending.count + summary.approved.count +
        summary.rejected.count + summary.reimbursed.count,
      amount: total,
    },
    {
      key: "pending",
      label: "Awaiting review",
      icon: <Clock className="h-4 w-4" />,
      classes: "bg-amber-50 text-amber-700 ring-1 ring-amber-100",
      count: summary.pending.count,
      amount: summary.pending.totalAmount,
    },
    {
      key: "approved",
      label: "Approved",
      icon: <CheckCircle2 className="h-4 w-4" />,
      classes: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
      count: summary.approved.count,
      amount: summary.approved.totalAmount,
    },
    {
      key: "reimbursed",
      label: "Reimbursed",
      icon: <Receipt className="h-4 w-4" />,
      classes: "bg-violet-50 text-violet-700 ring-1 ring-violet-100",
      count: summary.reimbursed.count,
      amount: summary.reimbursed.totalAmount,
    },
    {
      key: "rejected",
      label: "Rejected",
      icon: <XCircle className="h-4 w-4" />,
      classes: "bg-rose-50 text-rose-700 ring-1 ring-rose-100",
      count: summary.rejected.count,
      amount: summary.rejected.totalAmount,
    },
  ];

  return (
    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => {
        const isHero = c.key === "total";
        return (
          <div
            key={c.key as string}
            className={`rounded-2xl p-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)] ${
              isHero ? `bg-gradient-to-br ${c.classes}` : `bg-white ${c.classes}`
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full ${
                  isHero ? "bg-white/15" : "bg-white"
                }`}
              >
                {c.icon}
              </span>
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isHero ? "text-white/80" : "opacity-75"
                }`}
              >
                {c.count} {Number(c.count) === 1 ? "item" : "items"}
              </span>
            </div>
            <p
              className={`mt-3 text-[11px] font-semibold uppercase tracking-wider ${
                isHero ? "text-white/80" : "opacity-75"
              }`}
            >
              {c.label}
            </p>
            <p
              className={`mt-1 text-xl font-semibold ${
                isHero ? "text-white" : "text-gray-900"
              }`}
            >
              {formatAmount(c.amount)}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function FiltersBar({
  filters,
  setFilters,
  categories,
  showEmployeeFilter,
  employees,
}: {
  filters: ExpenseFilters;
  setFilters: (next: ExpenseFilters) => void;
  categories: { _id: string; name: string }[];
  showEmployeeFilter?: boolean;
  employees?: { _id: string; name: string }[];
}) {
  const update = (patch: Partial<ExpenseFilters>) => {
    setFilters({ ...filters, ...patch, page: 1 });
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="flex items-center gap-1.5 pl-1 pr-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
        <Filter className="h-3.5 w-3.5" />
        Filters
      </div>

      <select
        value={filters.status ?? "all"}
        onChange={(e) =>
          update({ status: e.target.value as ExpenseFilters["status"] })
        }
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
      >
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      <select
        value={filters.category ?? ""}
        onChange={(e) => update({ category: e.target.value })}
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>
            {c.name}
          </option>
        ))}
      </select>

      {showEmployeeFilter && employees && employees.length > 0 ? (
        <select
          value={filters.employeeId ?? ""}
          onChange={(e) => update({ employeeId: e.target.value || undefined })}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="">All employees</option>
          {employees.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name}
            </option>
          ))}
        </select>
      ) : null}

      <input
        type="date"
        value={filters.fromDate ?? ""}
        onChange={(e) => update({ fromDate: e.target.value })}
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
        aria-label="From date"
      />
      <span className="text-xs text-gray-400">→</span>
      <input
        type="date"
        value={filters.toDate ?? ""}
        onChange={(e) => update({ toDate: e.target.value })}
        className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
        aria-label="To date"
      />

      {(filters.status !== "all" ||
        filters.category ||
        filters.fromDate ||
        filters.toDate ||
        filters.employeeId) && (
        <button
          type="button"
          onClick={() => setFilters({ ...emptyFilters() })}
          className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}

function ExpenseTable({
  rows,
  isLoading,
  showEmployee,
  rowActions,
}: {
  rows: Expense[];
  isLoading: boolean;
  showEmployee: boolean;
  rowActions: (row: Expense) => React.ReactNode;
}) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[840px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50/90 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {showEmployee ? <th className="px-4 py-3">Employee</th> : null}
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Receipt</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: showEmployee ? 7 : 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3.5">
                      <div className="skeleton h-4 w-full max-w-[8rem] rounded" />
                    </td>
                  ))}
                </tr>
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={showEmployee ? 7 : 6}
                  className="px-4 py-10 text-center text-sm text-gray-500"
                >
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-2">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <Receipt className="h-5 w-5" />
                    </span>
                    <p className="font-semibold text-gray-700">No expenses to show</p>
                    <p className="text-xs text-gray-500">
                      Try clearing filters or submitting your first expense.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row._id} className="text-sm text-gray-800 hover:bg-gray-50/70">
                  {showEmployee ? (
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                          {expenseEmployeeName(row)
                            .split(/\s+/)
                            .map((p) => p[0])
                            .filter(Boolean)
                            .slice(0, 2)
                            .join("")
                            .toUpperCase() || "—"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-gray-900">
                            {expenseEmployeeName(row)}
                          </p>
                        </div>
                      </div>
                    </td>
                  ) : null}
                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                      {expenseCategoryName(row)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-gray-600">{formatDate(row.expenseDate)}</td>
                  <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                    {formatAmount(row.amount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusPill status={row.status} />
                  </td>
                  <td className="px-4 py-3.5">
                    {row.receiptUrl ? (
                      <a
                        href={row.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-violet-700 hover:underline"
                      >
                        <Receipt className="h-3.5 w-3.5" /> View
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">{rowActions(row)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  total,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white px-4 py-2.5 text-sm text-gray-600">
      <span>
        Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
        <span className="font-semibold text-gray-900">{totalPages || 1}</span>
        <span className="ml-2 text-xs text-gray-400">· {total} total</span>
      </span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onPage(Math.min(totalPages || 1, page + 1))}
          disabled={page >= (totalPages || 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function MonthlyReportPanel({
  canView,
}: {
  canView: boolean;
}) {
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const { data, isLoading, isError, error } = useExpenseMonthlyReport(
    { month, year },
    canView
  );

  const yearOptions = useMemo(() => {
    const list: number[] = [];
    for (let y = currentYear + 1; y >= currentYear - 4; y--) list.push(y);
    return list;
  }, [currentYear]);

  if (!canView) {
    return (
      <div className="mt-6 rounded-2xl border border-gray-200/80 bg-white p-6 text-sm text-gray-500">
        Monthly reports are only available to admins and HR.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-1.5 pl-1 pr-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <CalendarDays className="h-3.5 w-3.5" />
          Period
        </div>
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
        >
          {MONTH_LABELS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-violet-500"
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <span className="ml-auto rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-100">
          Grand total: {formatAmount(data?.grandTotal ?? 0)}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3 text-right">Items</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Reimbursed</th>
                <th className="px-4 py-3 text-right">Pending payout</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="skeleton h-4 w-full max-w-[6rem] rounded" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-rose-600">
                    {(error as ApiError | undefined)?.message ?? "Could not load report"}
                  </td>
                </tr>
              ) : (data?.report ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-500">
                    No approved or reimbursed expenses for this period.
                  </td>
                </tr>
              ) : (
                (data?.report ?? []).map((row) => (
                  <tr key={row.employee._id} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-gray-900">{row.employee.name}</p>
                      {row.employee.email ? (
                        <p className="text-xs text-gray-500">{row.employee.email}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-right text-gray-700">
                      {row.expenseCount}
                    </td>
                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                      {formatAmount(row.totalAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-violet-700">
                      {formatAmount(row.reimbursedAmount)}
                    </td>
                    <td className="px-4 py-3.5 text-right text-amber-700">
                      {formatAmount(row.pendingReimbursementAmount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function Expenses() {
  const userId = getUserId();
  const { data: user } = useUserById(userId);
  const roles = user?.role ?? [];
  const canReview = roles.some((r) => ["admin", "hr", "manager", "super-admin"].includes(r));
  const canReimburse = roles.some((r) => ["admin", "hr", "super-admin"].includes(r));
  const canManageCategories = canReimburse;
  const canViewSummary = canReimburse;

  const [tab, setTab] = useState<Tab>(canReview ? "inbox" : "mine");

  const [myFilters, setMyFilters] = useState<ExpenseFilters>(emptyFilters());
  const [teamFilters, setTeamFilters] = useState<ExpenseFilters>(emptyFilters());

  const myQuery = useMyExpenses(myFilters, tab === "mine");
  const teamQuery = useTeamExpenses(teamFilters, tab === "inbox" && canReview);
  const summaryQuery = useExpenseSummary(canViewSummary);
  const { data: categories = [] } = useExpenseCategories();
  const deleteMutation = useDeleteExpense();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [detail, setDetail] = useState<Expense | null>(null);
  const [reviewState, setReviewState] = useState<{
    expense: Expense | null;
    action: "approved" | "rejected" | null;
  }>({ expense: null, action: null });
  const [reimburseTarget, setReimburseTarget] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const teamEmployees = useMemo(() => {
    const seen = new Map<string, { _id: string; name: string }>();
    for (const exp of teamQuery.data?.expenses ?? []) {
      const e = exp.employee;
      if (typeof e === "object" && e !== null && "_id" in e && !seen.has(e._id)) {
        seen.set(e._id, { _id: e._id, name: e.name });
      }
    }
    return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [teamQuery.data?.expenses]);

  const tabItems = useMemo(() => {
    const items: { key: Tab; label: string; icon: React.ReactNode }[] = [
      { key: "mine", label: "My expenses", icon: <Receipt className="h-4 w-4" /> },
    ];
    if (canReview) {
      items.unshift({
        key: "inbox",
        label: "Team inbox",
        icon: <Inbox className="h-4 w-4" />,
      });
    }
    if (canReimburse) {
      items.push({
        key: "report",
        label: "Monthly report",
        icon: <FileSpreadsheet className="h-4 w-4" />,
      });
    }
    return items;
  }, [canReview, canReimburse]);

  const openEdit = (e: Expense) => {
    setEditing(e);
    setFormOpen(true);
  };
  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      toast.success("Expense deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not delete expense");
    }
  };

  const myActions = (row: Expense) => (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => setDetail(row)}
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      {canEditOwn(row) ? (
        <>
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-violet-50 hover:text-violet-700"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </>
      ) : null}
    </div>
  );

  const teamActions = (row: Expense) => (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => setDetail(row)}
        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        title="View"
      >
        <Eye className="h-4 w-4" />
      </button>
      {row.status === "pending" && canReview ? (
        <>
          <button
            type="button"
            onClick={() => setReviewState({ expense: row, action: "approved" })}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => setReviewState({ expense: row, action: "rejected" })}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50"
          >
            Reject
          </button>
        </>
      ) : null}
      {row.status === "approved" && canReimburse ? (
        <button
          type="button"
          onClick={() => setReimburseTarget(row)}
          className="rounded-lg px-2 py-1 text-xs font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-50"
        >
          Reimburse
        </button>
      ) : null}
      {isOwnerOf(row, userId) && canEditOwn(row) ? (
        <button
          type="button"
          onClick={() => setDeleteTarget(row)}
          className="rounded-lg p-1.5 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Expenses</h1>
          <p className="mt-1 text-sm text-slate-600">
            Submit receipts, track approvals and reconcile reimbursements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManageCategories ? (
            <Button
              variant="outline"
              leftIcon={<Settings2 className="h-4 w-4" />}
              onClick={() => setCategoryManagerOpen(true)}
            >
              Categories
            </Button>
          ) : null}
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={openCreate}>
            Submit expense
          </Button>
        </div>
      </div>

      {canViewSummary && summaryQuery.data ? (
        <SummaryCards
          summary={summaryQuery.data.summary}
          total={summaryQuery.data.grandTotal}
        />
      ) : canViewSummary && summaryQuery.isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-200/80 bg-white p-4"
            >
              <div className="skeleton h-7 w-7 rounded-full" />
              <div className="skeleton mt-3 h-3 w-24 rounded" />
              <div className="skeleton mt-2 h-5 w-28 rounded" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <PillTabBar
          items={tabItems.map((t) => ({ key: t.key, label: t.label, icon: t.icon }))}
          activeKey={tab}
          onTabChange={(k) => setTab(k as Tab)}
        />
        {tab !== "report" ? (
          <span className="text-xs text-gray-500">
            {tab === "mine"
              ? "Your submitted expenses"
              : "All expenses across the team"}
          </span>
        ) : null}
      </div>

      {tab === "mine" ? (
        <>
          <FiltersBar
            filters={myFilters}
            setFilters={setMyFilters}
            categories={categories}
          />
          <ExpenseTable
            rows={myQuery.data?.expenses ?? []}
            isLoading={myQuery.isLoading}
            showEmployee={false}
            rowActions={myActions}
          />
          <PaginationBar
            page={myQuery.data?.pagination?.page ?? myFilters.page ?? 1}
            totalPages={myQuery.data?.pagination?.totalPages ?? 1}
            total={myQuery.data?.pagination?.total ?? 0}
            onPage={(p) => setMyFilters({ ...myFilters, page: p })}
          />
        </>
      ) : null}

      {tab === "inbox" && canReview ? (
        <>
          <FiltersBar
            filters={teamFilters}
            setFilters={setTeamFilters}
            categories={categories}
            showEmployeeFilter
            employees={teamEmployees}
          />
          {teamQuery.isError ? (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="h-4 w-4" />
              {(teamQuery.error as ApiError | undefined)?.message ??
                "Could not load team expenses"}
            </div>
          ) : null}
          <ExpenseTable
            rows={teamQuery.data?.expenses ?? []}
            isLoading={teamQuery.isLoading}
            showEmployee
            rowActions={teamActions}
          />
          <PaginationBar
            page={teamQuery.data?.pagination?.page ?? teamFilters.page ?? 1}
            totalPages={teamQuery.data?.pagination?.totalPages ?? 1}
            total={teamQuery.data?.pagination?.total ?? 0}
            onPage={(p) => setTeamFilters({ ...teamFilters, page: p })}
          />
        </>
      ) : null}

      {tab === "report" ? <MonthlyReportPanel canView={canReimburse} /> : null}

      <ExpenseFormModal
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        expense={editing}
      />

      <ExpenseDetailModal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        expense={detail}
      />

      <ExpenseReviewModal
        isOpen={!!reviewState.expense}
        onClose={() => setReviewState({ expense: null, action: null })}
        expense={reviewState.expense}
        action={reviewState.action}
      />

      <ExpenseReimburseModal
        isOpen={!!reimburseTarget}
        onClose={() => setReimburseTarget(null)}
        expense={reimburseTarget}
      />

      <ExpenseCategoryManagerModal
        isOpen={categoryManagerOpen}
        onClose={() => setCategoryManagerOpen(false)}
      />

      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete expense"
        panelClassName="max-w-md"
      >
        <p className="text-sm text-slate-600">
          Delete the{" "}
          <span className="font-semibold">
            {deleteTarget ? formatAmount(deleteTarget.amount) : ""}
          </span>{" "}
          expense for{" "}
          <span className="font-semibold">
            {deleteTarget ? expenseCategoryName(deleteTarget) : ""}
          </span>
          ? This cannot be undone.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={deleteMutation.isPending}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
