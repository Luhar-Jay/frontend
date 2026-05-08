import { useState } from "react";
import { Clock, X, Calendar, Send, Loader2 } from "lucide-react";

type Props = {
  onSchedule: (scheduledAt: string) => Promise<void>;
  onClose: () => void;
  disabled?: boolean;
};

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ScheduleMessagePicker({ onSchedule, onClose, disabled }: Props) {
  const defaultDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  const [value, setValue] = useState(toLocalInputValue(defaultDate));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const minValue = toLocalInputValue(new Date()); // allow "right now"

  const handleConfirm = async () => {
    const date = new Date(value);
    if (isNaN(date.getTime()) || date < new Date(Date.now() - 30_000)) {
      setError("Please choose a valid date and time");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onSchedule(date.toISOString());
      onClose();
    } catch {
      setError("Failed to schedule message");
    } finally {
      setLoading(false);
    }
  };

  const presets = [
    { label: "In 1 hour", ms: 60 * 60 * 1000 },
    { label: "Tomorrow 9am", ms: null },
    { label: "In 1 week", ms: 7 * 24 * 60 * 60 * 1000 },
  ];

  const applyPreset = (ms: number | null) => {
    if (ms !== null) {
      setValue(toLocalInputValue(new Date(Date.now() + ms)));
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      setValue(toLocalInputValue(tomorrow));
    }
  };

  return (
    <div className="absolute bottom-full right-0 z-50 mb-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-semibold text-gray-900">Schedule Message</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.ms)}
              className="rounded-full border border-gray-200 px-2.5 py-1 text-xs text-gray-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Datetime input */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">
            <Calendar className="mr-1 inline h-3 w-3" />
            Date & Time
          </label>
          <input
            type="datetime-local"
            value={value}
            min={minValue}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20"
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <button
          type="button"
          disabled={loading || disabled}
          onClick={handleConfirm}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-2.5 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Schedule Send
        </button>
      </div>
    </div>
  );
}
