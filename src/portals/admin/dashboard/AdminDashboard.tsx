import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, Cake, ListTodo, CalendarCheck } from "lucide-react";
import { getUserId } from "@utils/session";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import Button from "@components/UI/Button";
import {
  useUserById, useAssignableUsers, useTeamBirthdays, type TeamBirthdayUser,
} from "@/apis/api/auth";
import { useTasksList } from "@/apis/api/tasks";
import { useProjectsList } from "@/apis/api/projects";
import { useTodayAttendance, useAttendanceRange } from "@/apis/api/attendance";
import { usePendingLeaveRequests } from "@/apis/api/leave";
import { useAnnouncements } from "@/apis/api/announcements";
import {
  countPresent, buildWeekAttendanceSeries, buildTodayAttendanceSeries,
  buildMonthAttendanceSeries, buildTaskCompletionSeries, buildTaskStatusPie,
  getUserIdFromRecord, localYmd, addDays, getWeekMonday, formatDate,
} from "@/portals/shared/dashboardUtils";
import AttendanceLineChart from "@/portals/shared/charts/AttendanceLineChart";
import TaskBarChart from "@/portals/shared/charts/TaskBarChart";
import TaskPieChart from "@/portals/shared/charts/TaskPieChart";
import AdminStatsCards from "./AdminStatsCards";
import AdminLeaveRequestsWidget from "./AdminLeaveRequestsWidget";
import AdminRecentActivityWidget from "./AdminRecentActivityWidget";
import AdminTodaySummaryCard from "./AdminTodaySummaryCard";
import type { User } from "@/types/user.types";

type ChartRange = "today" | "week" | "month";
const RANGE_LABELS: Record<ChartRange, string> = { today: "Today", week: "This Week", month: "This Month" };

type BirthdayEntry = { id: string; name: string; department: string; profileImage?: string | null; date: string; isToday: boolean; daysUntil: number };

function upcomingBirthdays(users: TeamBirthdayUser[]): BirthdayEntry[] {
  const today = new Date();
  const todayFlat = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const entries: BirthdayEntry[] = [];
  for (const u of users) {
    if (!u.dob) continue;
    const dob = new Date(u.dob);
    if (Number.isNaN(dob.getTime())) continue;
    let next = new Date(todayFlat.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < todayFlat) next = new Date(todayFlat.getFullYear() + 1, dob.getMonth(), dob.getDate());
    const daysUntil = Math.round((next.getTime() - todayFlat.getTime()) / 86400000);
    entries.push({
      id: u._id, name: u.name,
      department: (Array.isArray(u.role) ? u.role[0] : u.role) ?? "Team",
      profileImage: u.profileImage ?? null,
      date: next.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      isToday: daysUntil === 0, daysUntil,
    });
  }
  return entries.sort((a, b) => a.daysUntil - b.daysUntil);
}

const AdminDashboard = () => {
  const userId = getUserId();
  const { data: sessionUser } = useUserById(userId);
  const { activeMode } = useActiveOrg();
  const [chartRange, setChartRange] = useState<ChartRange>("week");

  const { data: users = [] } = useAssignableUsers(activeMode);
  const { data: teamBirthdayUsers = [] } = useTeamBirthdays();
  const { data: projects = [] } = useProjectsList(100, activeMode);
  const { data: announcements = [] } = useAnnouncements(activeMode);
  const { data: pendingLeaves = [] } = usePendingLeaveRequests(true, activeMode);

  const { data: myTasksRes } = useTasksList({ scope: "my", limit: 50, archived: false, orgContext: activeMode });
  const { data: orgTasksRes } = useTasksList({ scope: "all", limit: 200, archived: false, orgContext: activeMode });

  const today = new Date();
  const todayStr = today.toDateString();
  const weekMonday = useMemo(() => getWeekMonday(new Date(todayStr)), [todayStr]);
  const monthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [todayStr]);

  const { data: todayAttendance } = useTodayAttendance(true, activeMode);
  const weekFrom = localYmd(weekMonday);
  const weekTo = localYmd(addDays(weekMonday, 6));
  const { data: weekAttendance } = useAttendanceRange(weekFrom, weekTo, true, activeMode);
  const monthFrom = localYmd(monthStart);
  const monthTo = localYmd(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  const { data: monthAttendance } = useAttendanceRange(monthFrom, monthTo, true, activeMode);

  const totalEmployees = users.length;
  const presentToday = countPresent(todayAttendance?.attendance ?? []);
  const absentToday = Math.max(0, totalEmployees - presentToday);
  const activeProjects = projects.length;

  const orgTasks = useMemo(() => orgTasksRes?.tasks ?? [], [orgTasksRes?.tasks]);
  const myTasks = useMemo(() => myTasksRes?.tasks ?? [], [myTasksRes?.tasks]);

  const todayYmd = localYmd(today);
  const tasksDueToday = useMemo(
    () => myTasks.filter((t) => !!(t.dueDate && String(t.dueDate).slice(0, 10) === todayYmd && t.status !== "completed")),
    [myTasks, todayYmd]
  );

  const myRecord = useMemo(() => {
    const att = todayAttendance?.attendance ?? [];
    return att.find((a) => getUserIdFromRecord(a) === String(userId)) ?? null;
  }, [todayAttendance?.attendance, userId]);

  const attendanceSeries = useMemo(() => {
    if (chartRange === "today") return buildTodayAttendanceSeries(todayAttendance?.attendance ?? []);
    if (chartRange === "month") return buildMonthAttendanceSeries(monthAttendance?.attendance ?? [], monthStart);
    return buildWeekAttendanceSeries(weekAttendance?.attendance ?? [], weekMonday);
  }, [chartRange, todayAttendance?.attendance, weekAttendance?.attendance, monthAttendance?.attendance, weekMonday, monthStart]);

  const taskCompletionSeries = useMemo(() => buildTaskCompletionSeries(orgTasks, weekMonday), [orgTasks, weekMonday]);
  const taskStatusPie = useMemo(() => buildTaskStatusPie(orgTasks), [orgTasks]);

  const newUsers = useMemo(() =>
    users.filter((u) => u.createdAt)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3) as User[],
    [users]
  );

  const recentTasks = useMemo(() =>
    [...orgTasks]
      .filter((t) => t.updatedAt)
      .sort((a, b) => new Date(b.updatedAt ?? "").getTime() - new Date(a.updatedAt ?? "").getTime())
      .slice(0, 5),
    [orgTasks]
  );

  const birthdays = useMemo(() => upcomingBirthdays(teamBirthdayUsers), [teamBirthdayUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => window.print()}>
          <Download size={15} /> Export
        </Button>
      </div>

      {/* Stats */}
      <AdminStatsCards
        totalEmployees={totalEmployees}
        presentToday={presentToday}
        absentToday={absentToday}
        activeProjects={activeProjects}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Attendance chart */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-800">Attendance Overview</h2>
              <div className="flex items-center gap-1.5">
                {(Object.keys(RANGE_LABELS) as ChartRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setChartRange(r)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      chartRange === r ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {RANGE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
            <div className="px-5 pt-4 pb-2">
              <AttendanceLineChart data={attendanceSeries} />
              {attendanceSeries.every((p) => p.value === 0) && (
                <p className="pb-3 text-center text-xs text-gray-400">No attendance data for this range yet.</p>
              )}
            </div>
          </div>

          {/* Task charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-800">Tasks Completed</h2>
                <p className="text-xs text-gray-400 mt-0.5">This week</p>
              </div>
              <div className="flex-1 px-4 py-4">
                <TaskBarChart data={taskCompletionSeries} />
              </div>
            </div>
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-800">Task Status</h2>
                <p className="text-xs text-gray-400 mt-0.5">All open tasks</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
                <TaskPieChart data={taskStatusPie} />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <AdminRecentActivityWidget
            tasks={recentTasks}
            leaves={pendingLeaves.slice(0, 5)}
            announcements={announcements.slice(0, 5)}
            newUsers={newUsers}
          />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Due today */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <ListTodo size={16} className="text-indigo-500" />
                <h2 className="font-semibold text-gray-800">Due Today</h2>
              </div>
              <Link to="/admin/tasks" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>
            </div>
            {tasksDueToday.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CalendarCheck size={28} className="text-gray-200" />
                <p className="text-sm text-gray-500">No tasks due today</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {tasksDueToday.map((task) => (
                  <li key={task._id}>
                    <Link to="/admin/tasks" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${task.priority === "urgent" ? "bg-red-500" : task.priority === "medium" ? "bg-amber-400" : "bg-emerald-400"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-gray-800">{task.taskName}</p>
                        <p className="text-xs text-gray-400">{formatDate(task.dueDate)}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Leave requests */}
          <AdminLeaveRequestsWidget />

          {/* Birthdays */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <Cake size={16} className="text-pink-500" />
                <h2 className="font-semibold text-gray-800">Upcoming Birthdays</h2>
              </div>
            </div>
            {birthdays.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Cake size={28} className="text-gray-200" />
                <p className="text-sm text-gray-400">No birthdays on record yet</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {birthdays.slice(0, 6).map((b) => (
                  <li key={b.id} className={`flex items-center gap-3 px-5 py-3 ${b.isToday ? "bg-pink-50" : "hover:bg-gray-50"} transition`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${b.isToday ? "bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white" : "bg-pink-100 text-pink-600"}`}>
                      {b.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {b.name}
                        {b.isToday && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-pink-500">Today</span>}
                      </p>
                      <p className="truncate text-xs capitalize text-gray-400">{b.department}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${b.isToday ? "bg-pink-500 text-white" : b.daysUntil <= 7 ? "bg-pink-50 text-pink-600" : "bg-gray-100 text-gray-500"}`}>
                      {b.isToday ? "🎉 Today" : b.daysUntil === 1 ? "Tomorrow" : b.daysUntil <= 14 ? `In ${b.daysUntil}d` : b.date}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Today summary */}
          <AdminTodaySummaryCard
            myRecord={myRecord}
            tasksDueTodayCount={tasksDueToday.length}
            pendingLeavesCount={pendingLeaves.length}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
