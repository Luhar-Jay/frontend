import { Clock, X, Trash2, Users, User as UserIcon } from "lucide-react";
import type { ScheduledMessage } from "../../types/chat.types";
import { resolveProfileImageUrl } from "../../utils/mediaUrl";

type Props = {
  scheduled: ScheduledMessage[];
  isLoading?: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
};

function formatScheduledDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ScheduledMessagesDrawer({ scheduled, isLoading, onClose, onDelete }: Props) {
  const pending = scheduled;

  return (
    <div className="flex h-full w-72 flex-col border-l border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3.5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-violet-500" />
          <h3 className="text-sm font-semibold text-gray-900">Scheduled Messages</h3>
          {pending.length > 0 && (
            <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[11px] font-semibold text-violet-700">
              {pending.length}
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
            {[1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              <Clock className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No scheduled messages</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pending.map((sm) => {
              const target = sm.group ?? sm.receiver;
              const isGroup = !!sm.group;
              const avatar = !isGroup && sm.receiver
                ? resolveProfileImageUrl(sm.receiver.profileImage)
                : null;
              const name = isGroup ? sm.group?.name : sm.receiver?.name ?? "Unknown";

              return (
                <div key={sm._id} className="group flex items-start gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 text-xs font-semibold text-white">
                    {avatar ? (
                      <img src={avatar} alt="" className="h-full w-full object-cover" />
                    ) : isGroup ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      <UserIcon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-gray-900">{name}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-xs text-gray-600">
                      {sm.message || (sm.attachments?.length ? "📎 Attachment" : "—")}
                    </p>
                    <div className="mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-violet-400" />
                      <span className="text-[10px] font-medium text-violet-600">
                        {formatScheduledDate(sm.scheduledAt)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    title="Cancel"
                    onClick={() => onDelete(sm._id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
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
