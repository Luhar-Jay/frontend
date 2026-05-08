import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronRight, Calendar, User as UserIcon, Loader2 } from "lucide-react";
import type { ChatMessage, ChatUser } from "../../types/chat.types";
import { searchMessagesApi } from "../../apis/api/chat";
import { formatMessageTime } from "./chatUtils";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";

type Props = {
  onClose: () => void;
  onJumpToMessage: (messageId: string) => void;
  receiverId?: string;
  groupId?: string;
  availableUsers?: ChatUser[];
  currentUserId: string;
};

export function MessageSearchModal({
  onClose,
  onJumpToMessage,
  receiverId,
  groupId,
  availableUsers = [],
  currentUserId,
}: Props) {
  const [query, setQuery] = useState("");
  const [sender, setSender] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [results, setResults] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await searchMessagesApi({
        q: query,
        receiverId,
        groupId,
        sender: sender || undefined,
        from: from || undefined,
        to: to || undefined,
      });
      setResults(res.data ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-16 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search messages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 text-sm outline-none placeholder:text-gray-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 px-4 py-2.5">
          {availableUsers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-gray-400" />
              <select
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none focus:border-violet-300"
              >
                <option value="">Any sender</option>
                {availableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u._id === currentUserId ? "You" : u.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-gray-400" />
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none focus:border-violet-300"
              placeholder="From"
            />
            <span className="text-xs text-gray-400">–</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 text-xs outline-none focus:border-violet-300"
              placeholder="To"
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
            Search
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
            </div>
          ) : searched && results.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No messages found</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {results.map((msg) => {
                const avatar = resolveProfileImageUrl(msg.sender.profileImage);
                const initials = msg.sender.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <button
                    key={msg._id}
                    type="button"
                    onClick={() => {
                      onJumpToMessage(msg._id);
                      onClose();
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                      {avatar ? (
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-900">
                          {msg.sender._id === currentUserId ? "You" : msg.sender.name}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                        {msg.group && (
                          <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] text-violet-600">
                            {msg.group.name}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">
                        {msg.message || "📎 Attachment"}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-gray-300" />
                  </button>
                );
              })}
            </div>
          )}
          {!searched && (
            <div className="py-10 text-center text-sm text-gray-400">
              Type a keyword and press Enter to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
