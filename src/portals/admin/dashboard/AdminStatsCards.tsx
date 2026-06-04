import { Users, User, Presentation, CircleAlert } from "lucide-react";

interface Props {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  activeProjects: number;
}

const AdminStatsCards = ({ totalEmployees, presentToday, absentToday, activeProjects }: Props) => {
  const cards = [
    { title: "Total Employees",  value: totalEmployees,  iconBg: "bg-blue-100",   iconColor: "text-blue-600",   icon: <Users size={18} /> },
    { title: "Present Today",    value: presentToday,    iconBg: "bg-green-100",  iconColor: "text-green-600",  icon: <User size={18} /> },
    { title: "Absent Today",     value: absentToday,     iconBg: "bg-red-100",    iconColor: "text-red-600",    icon: <CircleAlert size={18} /> },
    { title: "Active Projects",  value: activeProjects,  iconBg: "bg-purple-100", iconColor: "text-purple-600", icon: <Presentation size={18} /> },
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

export default AdminStatsCards;
