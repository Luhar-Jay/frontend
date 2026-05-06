import { Calendar, FileText, Mail, Receipt, ShieldCheck, User } from "lucide-react";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import type { Expense } from "../../types/expense.types";
import {
  STATUS_BADGE,
  STATUS_DOT,
  STATUS_LABEL,
  expenseApproverName,
  expenseCategoryName,
  expenseEmployeeEmail,
  expenseEmployeeName,
  formatAmount,
  formatDate,
  formatDateTime,
  getReceiptKind,
} from "./expenseUtils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
};

function Field({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
        {icon}
        {label}
      </span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}

export default function ExpenseDetailModal({ isOpen, onClose, expense }: Props) {
  if (!expense) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Expense" panelClassName="max-w-lg">
        <p className="text-sm text-gray-500">No expense selected.</p>
      </Modal>
    );
  }

  const status = expense.status;
  const receipt = expense.receiptUrl;
  const receiptKind = getReceiptKind(receipt);
  const approver = expenseApproverName(expense);
  const employeeEmail = expenseEmployeeEmail(expense);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Expense details" panelClassName="max-w-2xl">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {expenseCategoryName(expense)}
            </p>
            <p className="mt-1 text-3xl font-semibold text-gray-900">
              {formatAmount(expense.amount)}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {formatDate(expense.expenseDate)}
            </p>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${STATUS_BADGE[status]}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} />
            {STATUS_LABEL[status]}
          </span>
        </div>

        {expense.description ? (
          <div className="rounded-xl bg-gray-50/80 p-3 text-sm leading-relaxed text-gray-700 ring-1 ring-gray-100">
            {expense.description}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 rounded-2xl bg-white p-4 ring-1 ring-gray-100 sm:grid-cols-2">
          <Field
            label="Submitted by"
            value={expenseEmployeeName(expense)}
            icon={<User className="h-3.5 w-3.5" />}
          />
          {employeeEmail ? (
            <Field
              label="Email"
              value={employeeEmail}
              icon={<Mail className="h-3.5 w-3.5" />}
            />
          ) : null}
          <Field
            label="Submitted on"
            value={formatDateTime(expense.createdAt)}
            icon={<Calendar className="h-3.5 w-3.5" />}
          />
          {approver ? (
            <Field
              label="Reviewed by"
              value={`${approver}${expense.approvedAt ? ` · ${formatDate(expense.approvedAt)}` : ""}`}
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
            />
          ) : null}
          {expense.status === "rejected" && expense.rejectionReason ? (
            <div className="sm:col-span-2">
              <Field
                label="Rejection reason"
                value={
                  <span className="rounded-lg bg-rose-50 px-2 py-1 text-rose-700 ring-1 ring-rose-100">
                    {expense.rejectionReason}
                  </span>
                }
              />
            </div>
          ) : null}
          {expense.status === "reimbursed" ? (
            <Field
              label="Reimbursed"
              value={
                <span>
                  {formatDate(expense.reimbursedAt)}
                  {expense.payrollIncluded ? (
                    <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-100">
                      In payroll
                    </span>
                  ) : null}
                </span>
              }
              icon={<Receipt className="h-3.5 w-3.5" />}
            />
          ) : null}
        </div>

        {receipt ? (
          <div className="overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-4 py-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <Receipt className="h-3.5 w-3.5" /> Receipt
              </p>
              <a
                href={receipt}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-violet-700 hover:underline"
              >
                Open in new tab
              </a>
            </div>
            <div className="bg-white">
              {receiptKind === "image" ? (
                <a href={receipt} target="_blank" rel="noreferrer" className="block">
                  <img
                    src={receipt}
                    alt="Receipt"
                    className="mx-auto max-h-72 w-auto object-contain"
                  />
                </a>
              ) : receiptKind === "pdf" ? (
                <iframe
                  title="Receipt PDF"
                  src={receipt}
                  className="h-72 w-full"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center gap-2 px-4 py-6 text-sm text-gray-600">
                  <FileText className="h-4 w-4" />
                  Attachment available — click "Open in new tab".
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500 ring-1 ring-gray-100">
            <Receipt className="h-4 w-4" /> No receipt attached.
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
