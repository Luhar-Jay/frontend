import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, XCircle } from "lucide-react";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { useReviewExpense } from "../../apis/api/expenses";
import { ApiError } from "../../apis/apiService";
import type { Expense } from "../../types/expense.types";
import {
  expenseCategoryName,
  expenseEmployeeName,
  formatAmount,
  formatDate,
} from "./expenseUtils";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  expense: Expense | null;
  action: "approved" | "rejected" | null;
};

export default function ExpenseReviewModal({ isOpen, onClose, expense, action }: Props) {
  const reviewMutation = useReviewExpense();
  const [comment, setComment] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setComment("");
  }, [isOpen]);

  if (!expense || !action) return null;

  const isReject = action === "rejected";

  const handleSubmit = async () => {
    if (isReject && !comment.trim()) {
      toast.error("Please add a reason for rejecting");
      return;
    }
    try {
      await reviewMutation.mutateAsync({
        id: expense._id,
        body: { status: action, comment: comment.trim() || undefined },
      });
      toast.success(isReject ? "Expense rejected" : "Expense approved");
      onClose();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not update expense");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReject ? "Reject expense" : "Approve expense"}
      panelClassName="max-w-md"
    >
      <div className="flex flex-col gap-4">
        <div
          className={`flex items-center gap-3 rounded-xl px-3 py-3 ring-1 ${
            isReject
              ? "bg-rose-50 text-rose-900 ring-rose-100"
              : "bg-emerald-50 text-emerald-900 ring-emerald-100"
          }`}
        >
          {isReject ? (
            <XCircle className="h-5 w-5 shrink-0 text-rose-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          )}
          <div className="min-w-0 text-sm">
            <p className="font-semibold">
              {expenseEmployeeName(expense)} · {formatAmount(expense.amount)}
            </p>
            <p className="text-xs opacity-80">
              {expenseCategoryName(expense)} · {formatDate(expense.expenseDate)}
            </p>
          </div>
        </div>

        <Input
          label={isReject ? "Reason for rejection" : "Note (optional)"}
          name="comment"
          type="textarea"
          rows={3}
          placeholder={
            isReject
              ? "Tell the employee what's wrong so they can resubmit"
              : "Optional note for the audit trail"
          }
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required={isReject}
        />

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={reviewMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant={isReject ? "danger" : "primary"}
            loading={reviewMutation.isPending}
            onClick={handleSubmit}
          >
            {isReject ? "Reject expense" : "Approve expense"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
