import { useState } from "react";
import { Forward, X, Search, Users, Loader2 } from "lucide-react";
import type { ChatGroup, ChatUser } from "../../types/chat.types";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";

type Props = {
  users: ChatUser[];
  groups: ChatGroup[];
  currentUserId: string;
  onClose: () => void;
  onForward: (targetId: string, type: "dm" | "group") => Promise<void>;
};

export function ForwardMessageModal({ users, groups, currentUserId, onClose, onForward }: Props) {
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) => u._id !== currentUserId && u.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGroups = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleForward = async (id: string, type: "dm" | "group") => {
    setPending(id);
    try {
      await onForward(id, type);
      onClose();
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Forward className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">Forward Message</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-2.5">
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search people or groups..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto pb-2">
          {filteredGroups.length > 0 && (
            <>
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Groups
              </p>
              {filteredGroups.map((g) => {
                const avatar = resolveProfileImageUrl(g.groupImage);
                return (
                  <button
                    key={g._id}
                    type="button"
                    disabled={pending === g._id}
                    onClick={() => handleForward(g._id, "group")}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 disabled:opacity-60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-indigo-500 text-sm font-semibold text-white">
                      {avatar ? (
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{g.name}</p>
                      <p className="text-xs text-gray-400">{g.members.length} members</p>
                    </div>
                    {pending === g._id && <Loader2 className="h-4 w-4 animate-spin text-violet-500" />}
                  </button>
                );
              })}
            </>
          )}

          {filteredUsers.length > 0 && (
            <>
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                People
              </p>
              {filteredUsers.map((u) => {
                const avatar = resolveProfileImageUrl(u.profileImage);
                const initials = u.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <button
                    key={u._id}
                    type="button"
                    disabled={pending === u._id}
                    onClick={() => handleForward(u._id, "dm")}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 disabled:opacity-60"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-semibold text-white">
                      {avatar ? (
                        <img src={avatar} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                      {u.name}
                    </p>
                    {pending === u._id && <Loader2 className="h-4 w-4 animate-spin text-violet-500" />}
                  </button>
                );
              })}
            </>
          )}

          {filteredUsers.length === 0 && filteredGroups.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">No results found</div>
          )}
        </div>
      </div>
    </div>
  );
}
