import { formatMs, formatTime } from "@/portals/shared/dashboardUtils";
import type { AttendanceRecord } from "@/types/attendance.types";

interface Props {
  myRecord: AttendanceRecord | null;
  tasksDueTodayCount: number;
  pendingLeavesCount: number;
}

const AdminTodaySummaryCard = ({ myRecord, tasksDueTodayCount, pendingLeavesCount }: Props) => {
  const today = new Date();
  const punchIn = myRecord?.punchInTime ? formatTime(myRecord.punchInTime) : "Not yet";
  const hoursWorked = formatMs(myRecord?.dayWorkedMs ?? myRecord?.dayTotalMs ?? 0);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-5 text-white shadow-lg">
      <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Today</p>
        <p className="mt-0.5 text-sm font-medium text-white/90">
          {today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <div className="mt-4 space-y-2.5">
          {[
            { label: "My punch in",      value: punchIn },
            { label: "Hours worked",     value: hoursWorked },
            { label: "Tasks due today",  value: String(tasksDueTodayCount) },
            { label: "Pending leaves",   value: String(pendingLeavesCount) },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
              <span className="text-sm text-white/80">{row.label}</span>
              <span className="text-sm font-semibold text-white">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminTodaySummaryCard;
