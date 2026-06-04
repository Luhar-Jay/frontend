import { Activity } from "lucide-react";
import { formatRelative, formatDate } from "@/portals/shared/dashboardUtils";
import type { Task } from "@/types/task.types";
import type { LeaveRecord } from "@/types/leave.types";
import type { User } from "@/types/user.types";

const ACTIVITY_COLORS: Record<string, string> = {
  task: "bg-violet-100 text-violet-600",
  leave: "bg-orange-100 text-orange-600",
  user: "bg-blue-100 text-blue-600",
  announcement: "bg-emerald-100 text-emerald-600",
};

type ActivityItem = {
  id: string;
  type: "task" | "leave" | "user" | "announcement";
  action: string;
  detail: string;
  time: string;
  at: number;
};

function buildActivity(
  tasks: Task[],
  leaves: LeaveRecord[],
  announcements: { _id: string; title: string; createdAt: string }[],
  newUsers: User[]
): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const t of tasks) {
    items.push({
      id: `t-${t._id}`, type: "task",
      action: t.status === "completed" ? "Task completed" : t.status === "review" ? "Task in review" : "Task updated",
      detail: t.taskName, time: formatRelative(t.updatedAt ?? t.createdAt),
      at: new Date(t.updatedAt ?? t.createdAt ?? Date.now()).getTime(),
    });
  }
  for (const l of leaves) {
    const userName = typeof l.user === "object" && l.user ? l.user.name : "Someone";
    items.push({
      id: `l-${l._id}`, type: "leave", action: "Leave requested",
      detail: `${userName} – ${formatDate(l.fromDate)}${l.toDate ? ` to ${formatDate(l.toDate)}` : ""}`.trim(),
      time: formatRelative(l.createdAt), at: new Date(l.createdAt).getTime(),
    });
  }
  for (const a of announcements) {
    items.push({ id: `a-${a._id}`, type: "announcement", action: "Announcement", detail: a.title, time: formatRelative(a.createdAt), at: new Date(a.createdAt).getTime() });
  }
  for (const u of newUsers) {
    items.push({ id: `u-${u._id}`, type: "user", action: "New teammate", detail: `${u.name} joined ${u.role?.[0] ?? "team"}`, time: formatRelative(u.createdAt), at: new Date(u.createdAt).getTime() });
  }
  return items.sort((a, b) => b.at - a.at).slice(0, 10);
}

interface Props {
  tasks: Task[];
  leaves: LeaveRecord[];
  announcements: { _id: string; title: string; createdAt: string }[];
  newUsers: User[];
}

const AdminRecentActivityWidget = ({ tasks, leaves, announcements, newUsers }: Props) => {
  const activity = buildActivity(tasks, leaves, announcements, newUsers);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        <Activity size={16} className="text-gray-400" />
        <h2 className="font-semibold text-gray-800">Recent Activity</h2>
      </div>
      {activity.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Activity size={30} className="text-gray-200" />
          <p className="text-sm text-gray-400">Nothing happening yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50 max-h-[340px] overflow-y-auto">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-5 py-3">
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${ACTIVITY_COLORS[item.type] ?? "bg-gray-100 text-gray-600"}`}>
                {item.action.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">{item.action}</p>
                <p className="text-xs text-gray-500 truncate">{item.detail}</p>
              </div>
              <span className="shrink-0 text-[11px] text-gray-400 pt-0.5">{item.time}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminRecentActivityWidget;
