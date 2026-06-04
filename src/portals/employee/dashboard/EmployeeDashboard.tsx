import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { getUserId } from "@utils/session";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { useUserById } from "@/apis/api/auth";
import { useTasksList } from "@/apis/api/tasks";
import { useTodayAttendance, useAttendanceRange } from "@/apis/api/attendance";
import { useAnnouncements } from "@/apis/api/announcements";
import {
  buildWeekAttendanceSeries, getUserIdFromRecord, localYmd, addDays,
  getWeekMonday, formatMs, formatTime, formatRelative,
} from "@/portals/shared/dashboardUtils";
import AttendanceLineChart from "@/portals/shared/charts/AttendanceLineChart";
import EmployeeStatsCards from "./EmployeeStatsCards";
import EmployeeTasksDueWidget from "./EmployeeTasksDueWidget";
import EmployeeLeaveBalanceWidget from "./EmployeeLeaveBalanceWidget";

const EmployeeDashboard = () => {
  const userId = getUserId();
  const { data: sessionUser } = useUserById(userId);
  const { activeMode } = useActiveOrg();
  const today = new Date();
  const todayStr = today.toDateString();

  const { data: tasksRes } = useTasksList({ scope: "my", limit: 100, archived: false, orgContext: activeMode });
  const { data: todayAttendance } = useTodayAttendance(false, activeMode);
  const { data: announcements = [] } = useAnnouncements(activeMode);

  const weekMonday = useMemo(() => getWeekMonday(new Date(todayStr)), [todayStr]);
  const weekFrom = localYmd(weekMonday);
  const weekTo = localYmd(addDays(weekMonday, 6));
  const { data: weekAttendance } = useAttendanceRange(weekFrom, weekTo, false, activeMode);

  const myTasks = useMemo(() => tasksRes?.tasks ?? [], [tasksRes?.tasks]);
  const todayYmd = localYmd(today);

  const tasksDueToday = useMemo(() =>
    myTasks.filter((t) => !!(t.dueDate && String(t.dueDate).slice(0, 10) === todayYmd && t.status !== "completed")),
    [myTasks, todayYmd]
  );

  const openTasks = myTasks.filter((t) => t.status !== "completed").length;

  const completedThisWeek = useMemo(() =>
    myTasks.filter((t) => t.status === "completed" && t.updatedAt && new Date(t.updatedAt) >= weekMonday).length,
    [myTasks, weekMonday]
  );

  const myRecord = useMemo(() => {
    const att = todayAttendance?.attendance ?? [];
    return att.find((a) => getUserIdFromRecord(a) === String(userId)) ?? null;
  }, [todayAttendance?.attendance, userId]);

  const hoursToday = formatMs(myRecord?.dayWorkedMs ?? myRecord?.dayTotalMs ?? 0);
  const myLeaveBalance = sessionUser?.leaves?.[0];
  const leaveRemaining = (myLeaveBalance?.totalBalance ?? 0) - (myLeaveBalance?.leaveTaken ?? 0);

  const weekAttSeries = useMemo(() => buildWeekAttendanceSeries(weekAttendance?.attendance ?? [], weekMonday), [weekAttendance?.attendance, weekMonday]);

  const recentAnnouncements = useMemo(() => announcements.slice(0, 4), [announcements]);

  const punchIn = myRecord?.punchInTime ? formatTime(myRecord.punchInTime) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          Welcome back, {sessionUser?.name?.split(" ")[0] ?? ""}
        </h1>
        <p className="mt-0.5 text-sm text-gray-500">
          {today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <EmployeeStatsCards
        hoursToday={hoursToday}
        openTasks={openTasks}
        completedThisWeek={completedThisWeek}
        leaveBalance={leaveRemaining}
      />

      {/* Punch in banner */}
      {!punchIn && (
        <div className="flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 text-lg">⏰</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">You haven't punched in today</p>
            <p className="text-xs text-amber-700">Head to attendance to record your work hours.</p>
          </div>
          <Link
            to="/employee/attendance"
            className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition"
          >
            Punch In
          </Link>
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Attendance this week */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-800">My Attendance — This Week</h2>
              <p className="text-xs text-gray-400 mt-0.5">Team presence overview</p>
            </div>
            <div className="px-5 pt-4 pb-2">
              <AttendanceLineChart data={weekAttSeries} />
            </div>
          </div>

          {/* Recent tasks */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-800">My Recent Tasks</h2>
              <Link to="/employee/tasks" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>
            </div>
            {myTasks.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <p className="text-sm text-gray-400">No tasks assigned yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {[...myTasks]
                  .sort((a, b) => new Date(b.updatedAt ?? "").getTime() - new Date(a.updatedAt ?? "").getTime())
                  .slice(0, 6)
                  .map((task) => (
                    <li key={task._id} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${
                        task.status === "completed" ? "bg-emerald-400" :
                        task.status === "in_progress" ? "bg-indigo-400" :
                        task.status === "review" ? "bg-purple-400" : "bg-gray-300"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{task.taskName}</p>
                        <p className="text-xs text-gray-400">{formatRelative(task.updatedAt ?? task.createdAt)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        task.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                        task.status === "in_progress" ? "bg-blue-50 text-blue-700" :
                        task.status === "review" ? "bg-purple-50 text-purple-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {task.status.replace("_", " ")}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Due today */}
          <EmployeeTasksDueWidget tasks={tasksDueToday} />

          {/* Leave balance */}
          <EmployeeLeaveBalanceWidget balance={myLeaveBalance} />

          {/* Announcements */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Megaphone size={16} className="text-emerald-500" />
                <h2 className="font-semibold text-gray-800">Announcements</h2>
              </div>
              <Link to="/employee/announcements" className="text-xs font-medium text-indigo-600 hover:underline">All</Link>
            </div>
            {recentAnnouncements.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-400">No announcements</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {recentAnnouncements.map((a) => (
                  <li key={a._id} className="px-5 py-3 hover:bg-gray-50 transition">
                    <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelative(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Today status card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">My Status Today</p>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: "Punch in",       value: punchIn ?? "Not yet" },
                  { label: "Hours worked",   value: hoursToday },
                  { label: "Tasks due",      value: String(tasksDueToday.length) },
                  { label: "Open tasks",     value: String(openTasks) },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between rounded-xl bg-white/15 px-4 py-2.5 backdrop-blur-sm">
                    <span className="text-sm text-white/80">{row.label}</span>
                    <span className="text-sm font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
