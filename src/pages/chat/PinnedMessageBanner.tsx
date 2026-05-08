import { useState } from "react";
import { Pin, ChevronUp, X } from "lucide-react";
import type { PinnedMessage } from "../../types/chat.types";

type Props = {
  pins: PinnedMessage[];
  onJump: (messageId: string) => void;
  onOpenDrawer: () => void;
};

export function PinnedMessageBanner({ pins, onJump, onOpenDrawer }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [index, setIndex] = useState(0);

  if (!pins.length || dismissed) return null;

  // Cycle newest → oldest
  const current = pins[index % pins.length];
  const hasMultiple = pins.length > 1;

  const preview = current.message?.trim()
    || (current.attachments?.length ? "📎 Attachment" : "—");

  const handleClick = () => {
    onJump(current._id);
  };

  const handleCycle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % pins.length);
  };

  return (
    <div className="relative z-10 flex items-center gap-2 border-b border-violet-100 bg-violet-50/70 px-4 py-2 backdrop-blur-sm">
      {/* Cycle arrow — only shown when multiple pins */}
      {hasMultiple && (
        <button
          type="button"
          title="See previous pin"
          onClick={handleCycle}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-violet-400 transition hover:bg-violet-100 hover:text-violet-700"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Pin icon */}
      <Pin className="h-3.5 w-3.5 shrink-0 rotate-45 text-violet-500" />

      {/* Content — clicking jumps to message */}
      <button
        type="button"
        onClick={handleClick}
        className="flex min-w-0 flex-1 flex-col text-left"
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide text-violet-500">
          Pinned Message
          {hasMultiple && (
            <span className="ml-1 text-violet-400">
              {index + 1}/{pins.length}
            </span>
          )}
        </span>
        <span className="truncate text-xs text-gray-700">{preview}</span>
      </button>

      {/* All pins button */}
      {hasMultiple && (
        <button
          type="button"
          title="View all pinned"
          onClick={(e) => { e.stopPropagation(); onOpenDrawer(); }}
          className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-medium text-violet-600 transition hover:bg-violet-100"
        >
          All
        </button>
      )}

      {/* Dismiss banner (doesn't unpin) */}
      <button
        type="button"
        title="Hide banner"
        onClick={() => setDismissed(true)}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-violet-100 hover:text-gray-600"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
