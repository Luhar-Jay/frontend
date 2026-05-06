import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Check, Pencil, Plus, Trash2, Undo2 } from "lucide-react";
import Modal from "../../components/UI/Model";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import {
  useCreateExpenseCategory,
  useDeleteExpenseCategory,
  useExpenseCategories,
  useUpdateExpenseCategory,
} from "../../apis/api/expenseCategories";
import { ApiError } from "../../apis/apiService";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ExpenseCategoryManagerModal({ isOpen, onClose }: Props) {
  const { data: categories = [], isLoading } = useExpenseCategories(isOpen);
  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory();
  const deleteMutation = useDeleteExpenseCategory();

  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createMutation.mutateAsync({ name: newName.trim() });
      setNewName("");
      toast.success("Category added");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not add category");
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await updateMutation.mutateAsync({
        id,
        body: { name: editingName.trim() },
      });
      cancelEdit();
      toast.success("Category renamed");
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not rename category");
    }
  };

  const toggleActive = async (id: string, currentActive: boolean, name: string) => {
    try {
      if (currentActive) {
        await deleteMutation.mutateAsync(id);
        toast.success("Category archived");
      } else {
        await updateMutation.mutateAsync({ id, body: { name, isActive: true } });
        toast.success("Category restored");
      }
    } catch (err) {
      toast.error((err as ApiError)?.message ?? "Could not update category");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage expense categories"
      panelClassName="max-w-lg"
    >
      <div className="flex flex-col gap-4">
        <form onSubmit={handleCreate} className="flex items-end gap-2">
          <Input
            label="New category"
            name="newCategory"
            placeholder="e.g. Travel, Meals, Software"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            type="submit"
            leftIcon={<Plus className="h-4 w-4" />}
            disabled={!newName.trim()}
            loading={createMutation.isPending}
          >
            Add
          </Button>
        </form>

        <div className="rounded-2xl border border-gray-200 bg-white">
          <p className="border-b border-gray-100 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Categories
          </p>
          <div className="max-h-72 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-gray-500">Loading…</div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500">No categories yet.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {categories.map((c) => {
                  const isEditing = editingId === c._id;
                  return (
                    <li
                      key={c._id}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm"
                    >
                      {isEditing ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 rounded-lg border border-gray-300 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-violet-500"
                        />
                      ) : (
                        <span
                          className={`flex-1 truncate ${
                            c.isActive ? "text-gray-900" : "text-gray-400 line-through"
                          }`}
                        >
                          {c.name}
                        </span>
                      )}

                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEdit(c._id)}
                            className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50"
                            title="Save"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                            title="Cancel"
                          >
                            <Undo2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEdit(c._id, c.name)}
                            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                            title="Rename"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(c._id, c.isActive, c.name)}
                            className={`rounded-lg p-1.5 ${
                              c.isActive
                                ? "text-rose-600 hover:bg-rose-50"
                                : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={c.isActive ? "Archive" : "Restore"}
                          >
                            {c.isActive ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <Undo2 className="h-4 w-4" />
                            )}
                          </button>
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
}
