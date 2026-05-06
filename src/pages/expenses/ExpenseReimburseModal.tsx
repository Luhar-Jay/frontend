import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Banknote } from "lucide-react";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import { useReimburseExpense } from "../../apis/api/expenses";
import { ApiError } from "../../apis/apiService";
import type { Expense } from "../../types/expense.types";
import { expenseEmployeeName, formatAmount } from "./expenseUtils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
};

export default function ExpenseReimburseModal({ isOpen, onClose, expense }: Props) {
  const reimburseMutation = useReimburseExpense();
  const [payrollIncluded, setPayrollIncluded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setPayrollIncluded(false);
  }, [isOpen]);

  if (!expense) return null;

  const handleSubmit = async () => {
    try {
      await reimburseMutation.mutateAsync({
        id: expense._id,
        body: { payrollIncluded },
      });
      toast.success("Marked as reimbursed");
      onClose();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not mark reimbursed");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mark as reimbursed"
      panelClassName="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-xl bg-violet-50 px-3 py-3 text-violet-900 ring-1 ring-violet-100">
          <Banknote className="h-5 w-5 shrink-0 text-violet-600" />
          <div className="min-w-0 text-sm">
            <p className="font-semibold">
              {expenseEmployeeName(expense)} · {formatAmount(expense.amount)}
            </p>
            <p className="text-xs opacity-80">
              The employee will see this as reimbursed and the audit trail will record today's
              date.
            </p>
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 bg-white px-3 py-3 transition hover:bg-gray-50">
          <input
            type="checkbox"
            checked={payrollIncluded}
            onChange={(e) => setPayrollIncluded(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-900">Include in payroll</p>
            <p className="text-xs text-gray-500">
              Tick this if the reimbursement is being paid out via the next salary slip.
            </p>
          </div>
        </label>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={reimburseMutation.isPending}>
            Cancel
          </Button>
          <Button loading={reimburseMutation.isPending} onClick={handleSubmit}>
            Mark reimbursed
          </Button>
        </div>
      </div>
    </Modal>
  );
}
