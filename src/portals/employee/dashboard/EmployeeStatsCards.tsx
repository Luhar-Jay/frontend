import { Clock, ListTodo, CheckCircle2, CalendarCheck } from "lucide-react";

interface Props {
  hoursToday: string;
  openTasks: number;
  completedThisWeek: number;
  leaveBalance: number;
}

const EmployeeStatsCards = ({ hoursToday, openTasks, completedThisWeek, leaveBalance }: Props) => {
  const cards = [
    { title: "Hours Today",       value: hoursToday,           iconBg: "bg-blue-100",   iconColor: "text-blue-600",   icon: <Clock size={18} /> },
    { title: "Open Tasks",        value: String(openTasks),    iconBg: "bg-indigo-100", iconColor: "text-indigo-600", icon: <ListTodo size={18} /> },
    { title: "Done This Week",    value: String(completedThisWeek), iconBg: "bg-green-100", iconColor: "text-green-600", icon: <CheckCircle2 size={18} /> },
    { title: "Leave Balance",     value: String(Math.max(0, leaveBalance)), iconBg: "bg-purple-100", iconColor: "text-purple-600", icon: <CalendarCheck size={18} /> },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div
          key={c.title}
          className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition hover:shadow-md"
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${c.iconBg}`}>
            <span className={c.iconColor}>{c.icon}</span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-400">{c.title}</p>
            <p className="mt-0.5 text-2xl font-bold text-gray-900 leading-none">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeStatsCards;
