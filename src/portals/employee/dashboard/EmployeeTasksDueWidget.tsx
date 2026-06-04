import { Link } from "react-router-dom";
import { CalendarCheck, ListTodo } from "lucide-react";
import { formatDate } from "@/portals/shared/dashboardUtils";
import type { Task } from "@/types/task.types";

interface Props { tasks: Task[] }

const EmployeeTasksDueWidget = ({ tasks }: Props) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
      <div className="flex items-center gap-2">
        <ListTodo size={16} className="text-indigo-500" />
        <h2 className="font-semibold text-gray-800">Due Today</h2>
      </div>
      <Link to="/employee/tasks" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>
    </div>
    {tasks.length === 0 ? (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <CalendarCheck size={28} className="text-gray-200" />
        <p className="text-sm text-gray-500">No tasks due today</p>
        <p className="text-xs text-gray-400">You're all caught up!</p>
      </div>
    ) : (
      <ul className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
        {tasks.map((task) => (
          <li key={task._id}>
            <Link to="/employee/tasks" className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
              <span className={`h-2 w-2 shrink-0 rounded-full ${
                task.priority === "urgent" ? "bg-red-500" : task.priority === "medium" ? "bg-amber-400" : "bg-emerald-400"
              }`} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-gray-800">{task.taskName}</p>
                <p className="text-xs text-gray-400">{formatDate(task.dueDate)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                task.status === "in_progress" ? "bg-blue-50 text-blue-700" :
                task.status === "review" ? "bg-purple-50 text-purple-700" : "bg-gray-100 text-gray-600"
              }`}>
                {task.status.replace("_", " ")}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export default EmployeeTasksDueWidget;
