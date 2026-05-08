import { Bookmark, X, ChevronRight, ExternalLink } from "lucide-react";
import type { MessageBookmark } from "../../types/chat.types";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";
import { formatMessageTime } from "./chatUtils";

type Props = {
  bookmarks: MessageBookmark[];
  isLoading?: boolean;
  currentUserId: string;
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  onRemoveBookmark: (messageId: string) => void;
};

export function BookmarksDrawer({
  bookmarks,
  isLoading,
  currentUserId,
  onClose,
  onJumpToMessage,
  onRemoveBookmark,
}: Props) {
  return (
    <div className="flex h-full w-72 flex-col border-l border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Bookmark className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-gray-900">Saved Messages</h3>
          {bookmarks.length > 0 && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-semibold text-amber-700">
              {bookmarks.length}
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
              <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <Bookmark className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No bookmarks yet</p>
            <p className="text-xs text-gray-400">Save messages to read them later</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bookmarks.map((bm) => {
              const msg = bm.message;
              const avatar = resolveProfileImageUrl(msg.sender.profileImage);
              const initials = msg.sender.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              const context = msg.group?.name ?? (msg.sender._id === currentUserId ? "DM" : msg.sender.name);

              return (
                <div key={bm._id} className="group relative px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                      {avatar ? (
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-semibold text-gray-900">
                          {msg.sender._id === currentUserId ? "You" : msg.sender.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        {context && (
                          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500">
                            {context}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                        {msg.message || "📎 Attachment"}
                      </p>
                      {bm.note && (
                        <p className="mt-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] italic text-amber-700">
                          {bm.note}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        type="button"
                        title="Jump to message"
                        onClick={() => {
                          onJumpToMessage(msg._id);
                          onClose();
                        }}
                        className="flex h-6 w-6 items-center justify-center rounded-lg text-gray-300 transition hover:bg-violet-50 hover:text-violet-600"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveBookmark(msg._id)}
                    className="absolute right-3 top-2 hidden rounded-lg px-1.5 py-0.5 text-[10px] font-medium text-red-400 hover:bg-red-50 hover:text-red-600 group-hover:block"
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
