import { Pin, X, ChevronRight } from "lucide-react";
import type { PinnedMessage } from "../../types/chat.types";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";
import { formatMessageTime } from "./chatUtils";

type Props = {
  pins: PinnedMessage[];
  isLoading?: boolean;
  onClose: () => void;
  onScrollToMessage: (messageId: string) => void;
  onUnpin?: (messageId: string) => void;
  currentUserId: string;
};

export function PinnedMessagesDrawer({
  pins,
  isLoading,
  onClose,
  onScrollToMessage,
  onUnpin,
  currentUserId,
}: Props) {
  return (
    <div className="flex h-full w-72 flex-col border-l border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-gray-900">Pinned Messages</h3>
          {pins.length > 0 && (
            <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700">
              {pins.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : pins.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <Pin className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No pinned messages yet</p>
            <p className="text-xs text-gray-400">Pin important messages to find them quickly</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pins.map((pin) => {
              const avatar = resolveProfileImageUrl(pin.sender.profileImage);
              const initials = pin.sender.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              return (
                <div key={pin._id} className="group relative px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                      {avatar ? (
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-gray-900">
                          {pin.sender._id === currentUserId ? "You" : pin.sender.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatMessageTime(pin.createdAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                        {pin.message || (pin.attachments?.length ? "📎 Attachment" : "")}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400">
                        Pinned by {pin.pinnedBy?._id === currentUserId ? "you" : pin.pinnedBy?.name}
                      </p>
                    </div>

                    <button
                      type="button"
                      title="Jump to message"
                      onClick={() => {
                        onScrollToMessage(pin._id);
                        onClose();
                      }}
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-300 transition hover:bg-violet-50 hover:text-violet-600"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  {onUnpin && (
                    <button
                      type="button"
                      onClick={() => onUnpin(pin._id)}
                      className="absolute right-9 top-3 hidden rounded-lg px-1.5 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-50 hover:text-red-600 group-hover:block"
                    >
                      Unpin
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
