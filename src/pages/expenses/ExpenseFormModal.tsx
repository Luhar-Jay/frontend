import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { FileText, Image as ImageIcon, Paperclip, Receipt, Upload, X } from "lucide-react";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import Dropdown from "../../components/UI/Dropdown";
import { useExpenseCategories } from "../../apis/api/expenseCategories";
import { useCreateExpense, useUpdateExpense } from "../../apis/api/expenses";
import { ApiError } from "../../apis/apiService";
import type { Expense } from "../../types/expense.types";
import { activeCategoryOptions, todayYmd } from "./expenseUtils";

const RECEIPT_MAX_BYTES = 10 * 1024 * 1024;
const RECEIPT_ACCEPT = "image/png,image/jpeg,image/webp,application/pdf";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  expense?: Expense | null;
};

type FormState = {
  amount: string;
  date: string;
  description: string;
  category: string;
};

const emptyForm: FormState = {
  amount: "",
  date: todayYmd(),
  description: "",
  category: "",
};

function expenseCategoryId(expense: Expense): string {
  const c = expense.category;
  if (typeof c === "object" && c !== null && "_id" in c) return c._id;
  return c as string;
}

export default function ExpenseFormModal({ isOpen, onClose, expense }: Props) {
  const editing = !!expense;
  const { data: categories = [], isLoading: loadingCats } = useExpenseCategories(isOpen);
  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    if (expense) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        amount: String(expense.amount ?? ""),
        date: expense.expenseDate ? expense.expenseDate.slice(0, 10) : todayYmd(),
        description: expense.description ?? "",
        category: expenseCategoryId(expense),
      });
    } else {
      setForm({ ...emptyForm });
    }
    setReceipt(null);
    setErrors({});
  }, [isOpen, expense]);

  const categoryOptions = useMemo(() => activeCategoryOptions(categories), [categories]);

  const existingReceiptUrl = expense?.receiptUrl ?? null;
  const existingReceiptName = useMemo(() => {
    if (!existingReceiptUrl) return null;
    try {
      const u = new URL(existingReceiptUrl);
      const name = u.pathname.split("/").pop();
      return name || existingReceiptUrl;
    } catch {
      return existingReceiptUrl.split("/").pop() ?? existingReceiptUrl;
    }
  }, [existingReceiptUrl]);

  const handleFile = (file: File | null) => {
    if (!file) {
      setReceipt(null);
      return;
    }
    if (file.size > RECEIPT_MAX_BYTES) {
      toast.error("Receipt must be 10 MB or smaller");
      return;
    }
    setReceipt(file);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    const amt = Number(form.amount);
    if (!form.amount.trim() || Number.isNaN(amt) || amt <= 0) {
      next.amount = "Enter an amount greater than 0";
    }
    if (!form.date) next.date = "Date is required";
    if (!form.category) next.category = "Pick a category";
    if (form.description.length > 500) next.description = "Max 500 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      if (editing && expense) {
        await updateMutation.mutateAsync({
          id: expense._id,
          body: {
            amount: Number(form.amount),
            date: form.date,
            description: form.description.trim(),
            category: form.category,
            receipt: receipt ?? undefined,
          },
        });
        toast.success("Expense updated");
      } else {
        await createMutation.mutateAsync({
          amount: Number(form.amount),
          date: form.date,
          description: form.description.trim(),
          category: form.category,
          receipt: receipt ?? undefined,
        });
        toast.success("Expense submitted for review");
      }
      onClose();
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not save expense");
    }
  };

  const submitting = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editing ? "Edit expense" : "Submit expense"}
      panelClassName="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((s) => ({ ...s, amount: e.target.value }))}
            error={errors.amount}
            required
          />
          <Input
            label="Expense date"
            name="date"
            type="date"
            value={form.date}
            onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
            error={errors.date}
            required
          />
        </div>

        <Dropdown
          label="Category"
          placeholder={loadingCats ? "Loading…" : "Select a category"}
          options={categoryOptions}
          value={form.category}
          onChange={(v) => setForm((s) => ({ ...s, category: v }))}
          error={errors.category}
        />

        <Input
          label="Description"
          name="description"
          type="textarea"
          rows={3}
          placeholder="What was this expense for?"
          value={form.description}
          onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
          error={errors.description}
          rightLabel={`${form.description.length}/500`}
        />

        <div>
          <label className="text-sm font-medium text-gray-700">Receipt</label>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            className="mt-1 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/60 px-4 py-5 text-center transition hover:border-violet-300 hover:bg-violet-50/40"
          >
            {receipt ? (
              <div className="flex w-full items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-gray-200">
                <div className="flex min-w-0 items-center gap-2">
                  {receipt.type === "application/pdf" ? (
                    <FileText className="h-5 w-5 shrink-0 text-rose-500" />
                  ) : (
                    <ImageIcon className="h-5 w-5 shrink-0 text-violet-500" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{receipt.name}</p>
                    <p className="text-xs text-gray-500">
                      {(receipt.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-rose-500"
                  aria-label="Remove receipt"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600">
                  <Upload className="h-4 w-4" />
                </div>
                <p className="text-sm text-gray-600">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="font-medium text-violet-700 hover:underline"
                  >
                    Click to upload
                  </button>{" "}
                  or drag & drop
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, WebP or PDF · up to 10 MB</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={RECEIPT_ACCEPT}
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
            />
          </div>

          {existingReceiptUrl && !receipt && (
            <a
              href={existingReceiptUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-violet-700 hover:underline"
            >
              <Paperclip className="h-3.5 w-3.5" />
              Current receipt: {existingReceiptName}
            </a>
          )}
        </div>

        <div className="rounded-xl bg-violet-50/60 p-3 text-xs text-violet-900 ring-1 ring-violet-100">
          <div className="flex items-start gap-2">
            <Receipt className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>
              {editing
                ? "You can only edit your own pending expenses. Once approved or rejected, the record is locked."
                : "The expense is submitted as Pending. Your manager or HR will review and approve it."}
            </p>
          </div>
        </div>

        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {editing ? "Save changes" : "Submit expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
