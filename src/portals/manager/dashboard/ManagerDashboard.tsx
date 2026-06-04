import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ListTodo, CalendarCheck, Cake } from "lucide-react";
import { getUserId } from "@utils/session";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import Button from "@components/UI/Button";
import { useUserById, useAssignableUsers, useTeamBirthdays, type TeamBirthdayUser } from "@/apis/api/auth";
import { useTasksList } from "@/apis/api/tasks";
import { useProjectsList } from "@/apis/api/projects";
import { useTodayAttendance, useAttendanceRange } from "@/apis/api/attendance";
import { usePendingLeaveRequests } from "@/apis/api/leave";
import {
  countPresent, buildWeekAttendanceSeries, buildTaskCompletionSeries,
  buildTaskStatusPie, localYmd, addDays, getWeekMonday, formatDate,
} from "@/portals/shared/dashboardUtils";
import AttendanceLineChart from "@/portals/shared/charts/AttendanceLineChart";
import TaskBarChart from "@/portals/shared/charts/TaskBarChart";
import TaskPieChart from "@/portals/shared/charts/TaskPieChart";
import ManagerStatsCards from "./ManagerStatsCards";
import ManagerPendingApprovalsWidget from "./ManagerPendingApprovalsWidget";

type BirthdayEntry = { id: string; name: string; department: string; date: string; isToday: boolean; daysUntil: number };

function upcomingBirthdays(users: TeamBirthdayUser[]): BirthdayEntry[] {
  const todayFlat = new Date(); todayFlat.setHours(0, 0, 0, 0);
  return users
    .filter((u) => u.dob)
    .map((u) => {
      const dob = new Date(u.dob!);
      if (Number.isNaN(dob.getTime())) return null;
      let next = new Date(todayFlat.getFullYear(), dob.getMonth(), dob.getDate());
      if (next < todayFlat) next = new Date(todayFlat.getFullYear() + 1, dob.getMonth(), dob.getDate());
      const daysUntil = Math.round((next.getTime() - todayFlat.getTime()) / 86400000);
      return {
        id: u._id, name: u.name,
        department: (Array.isArray(u.role) ? u.role[0] : u.role) ?? "Team",
        date: next.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        isToday: daysUntil === 0, daysUntil,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a!.daysUntil - b!.daysUntil) as BirthdayEntry[];
}

const ManagerDashboard = () => {
  const userId = getUserId();
  const { data: sessionUser } = useUserById(userId);
  const { activeMode } = useActiveOrg();
  const today = new Date();
  const todayStr = today.toDateString();

  const { data: users = [] } = useAssignableUsers(activeMode);
  const { data: teamBirthdayUsers = [] } = useTeamBirthdays();
  const { data: projects = [] } = useProjectsList(100, activeMode);
  const { data: pendingLeaves = [] } = usePendingLeaveRequests(true, activeMode);

  const { data: myTasksRes } = useTasksList({ scope: "my", limit: 50, archived: false, orgContext: activeMode });
  const { data: orgTasksRes } = useTasksList({ scope: "all", limit: 200, archived: false, orgContext: activeMode });

  const weekMonday = useMemo(() => getWeekMonday(new Date(todayStr)), [todayStr]);

  const { data: todayAttendance } = useTodayAttendance(true, activeMode);
  const weekFrom = localYmd(weekMonday);
  const weekTo = localYmd(addDays(weekMonday, 6));
  const { data: weekAttendance } = useAttendanceRange(weekFrom, weekTo, true, activeMode);

  const presentToday = countPresent(todayAttendance?.attendance ?? []);
  const orgTasks = useMemo(() => orgTasksRes?.tasks ?? [], [orgTasksRes?.tasks]);
  const myTasks = useMemo(() => myTasksRes?.tasks ?? [], [myTasksRes?.tasks]);
  const todayYmd = localYmd(today);
  const tasksDueToday = useMemo(() =>
    myTasks.filter((t) => !!(t.dueDate && String(t.dueDate).slice(0, 10) === todayYmd && t.status !== "completed")),
    [myTasks, todayYmd]
  );

  const weekAttSeries = useMemo(() => buildWeekAttendanceSeries(weekAttendance?.attendance ?? [], weekMonday), [weekAttendance?.attendance, weekMonday]);
  const taskCompSeries = useMemo(() => buildTaskCompletionSeries(orgTasks, weekMonday), [orgTasks, weekMonday]);
  const taskPie = useMemo(() => buildTaskStatusPie(orgTasks), [orgTasks]);
  const birthdays = useMemo(() => upcomingBirthdays(teamBirthdayUsers), [teamBirthdayUsers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Welcome, {sessionUser?.name?.split(" ")[0] ?? "Manager"}
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">
            {today.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Button variant="outline" size="sm" type="button" onClick={() => window.print()}>
          <Download size={15} /> Export
        </Button>
      </div>

      {/* Stats */}
      <ManagerStatsCards
        teamSize={users.length}
        presentToday={presentToday}
        activeProjects={projects.length}
        pendingApprovals={pendingLeaves.length}
      />

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Attendance */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4">
              <h2 className="font-semibold text-gray-800">Team Attendance — This Week</h2>
            </div>
            <div className="px-5 pt-4 pb-2">
              <AttendanceLineChart data={weekAttSeries} />
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
                <TaskBarChart data={taskCompSeries} />
              </div>
            </div>
            <div className="flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-4">
                <h2 className="font-semibold text-gray-800">Task Status</h2>
                <p className="text-xs text-gray-400 mt-0.5">Team tasks</p>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
                <TaskPieChart data={taskPie} />
              </div>
            </div>
          </div>

          {/* Pending approvals */}
          <ManagerPendingApprovalsWidget />
        </div>

        {/* Right */}
        <div className="flex flex-col gap-6">
          {/* Due today */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div className="flex items-center gap-2">
                <ListTodo size={16} className="text-indigo-500" />
                <h2 className="font-semibold text-gray-800">Due Today</h2>
              </div>
              <Link to="/manager/tasks" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>
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
                    <Link to="/manager/tasks" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
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

          {/* Birthdays */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
              <Cake size={16} className="text-pink-500" />
              <h2 className="font-semibold text-gray-800">Upcoming Birthdays</h2>
            </div>
            {birthdays.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Cake size={28} className="text-gray-200" />
                <p className="text-sm text-gray-400">No upcoming birthdays</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50 max-h-56 overflow-y-auto">
                {birthdays.slice(0, 5).map((b) => (
                  <li key={b.id} className={`flex items-center gap-3 px-5 py-3 ${b.isToday ? "bg-pink-50" : "hover:bg-gray-50"} transition`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${b.isToday ? "bg-gradient-to-br from-pink-400 to-fuchsia-500 text-white" : "bg-pink-100 text-pink-600"}`}>
                      {b.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {b.name}
                        {b.isToday && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide text-pink-500">Today</span>}
                      </p>
                      <p className="text-xs text-gray-400">{b.department}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${b.isToday ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                      {b.isToday ? "🎉" : b.daysUntil === 1 ? "Tomorrow" : `In ${b.daysUntil}d`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Quick summary card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/70">Team Summary</p>
              <p className="mt-0.5 text-sm font-medium text-white/90">{today.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</p>
              <div className="mt-4 space-y-2.5">
                {[
                  { label: "Team size",         value: String(users.length) },
                  { label: "Present today",     value: String(presentToday) },
                  { label: "Active projects",   value: String(projects.length) },
                  { label: "Pending approvals", value: String(pendingLeaves.length) },
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

export default ManagerDashboard;
