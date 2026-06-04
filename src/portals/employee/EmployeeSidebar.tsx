import {
  LayoutDashboard, CheckSquare, Clock, Calendar,
  Megaphone, CalendarDays, Receipt, MessageCircle,
  Calendar1Icon, NotepadText,
} from "lucide-react";
import SidebarShell, { type NavItem } from "@/portals/shared/SidebarShell";
import type { SidebarProps } from "@/portals/shared/PortalLayout";

const EMPLOYEE_NAV: NavItem[] = [
  { path: "/employee",               label: "Dashboard",     icon: LayoutDashboard, end: true },
  { type: "projects" },
  { path: "/employee/tasks",         label: "My Tasks",      icon: CheckSquare,     end: false },
  { path: "/employee/notes",         label: "Notes",         icon: NotepadText,     end: false },
  { path: "/employee/attendance",    label: "Attendance",    icon: Clock,           end: false },
  { path: "/employee/leave",         label: "Leave",         icon: Calendar,        end: false },
  { path: "/employee/expenses",      label: "Expenses",      icon: Receipt,         end: false },
  { path: "/employee/calendar",      label: "Calendar",      icon: Calendar1Icon,   end: false },
  { path: "/employee/chat",          label: "Chat",          icon: MessageCircle,   end: false, badge: "chat" },
  { path: "/employee/announcements", label: "Announcements", icon: Megaphone,       end: false },
  { path: "/employee/holidays",      label: "Holidays",      icon: CalendarDays,    end: false },
];

const EmployeeSidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => (
  <SidebarShell
    navItems={EMPLOYEE_NAV}
    tasksBasePath="/employee/tasks"
    mobileOpen={mobileOpen}
    onMobileClose={onMobileClose}
  />
);

export default EmployeeSidebar;
