import { X, Eye } from "lucide-react";
import type { ChatUser } from "../../types/chat.types";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";

type Props = {
  readers: ChatUser[];
  totalMembers: number;
  onClose: () => void;
};

export function ReadReceiptsModal({ readers, totalMembers, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-gray-900">
              Read by {readers.length} of {totalMembers}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto py-2">
          {readers.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Not read yet</p>
          ) : (
            readers.map((user) => {
              const avatar = resolveProfileImageUrl(user.profileImage);
              const initials = user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);
              return (
                <div key={user._id} className="flex items-center gap-3 px-4 py-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                    {avatar ? (
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <span className="text-sm text-gray-800">{user.name}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
