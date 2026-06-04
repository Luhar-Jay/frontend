import {
  LayoutDashboard, Users, CheckSquare, Clock, Calendar,
  Megaphone, CalendarDays, BriefcaseBusiness, Handshake,
  Receipt, MessageCircle, Calendar1Icon, NotepadText,
} from "lucide-react";
import SidebarShell, { type NavItem } from "@/portals/shared/SidebarShell";
import type { SidebarProps } from "@/portals/shared/PortalLayout";

const MANAGER_NAV: NavItem[] = [
  { path: "/manager",               label: "Dashboard",    icon: LayoutDashboard,    end: true },
  { path: "/manager/team",          label: "Team",         icon: Users,              end: false },
  { type: "projects" },
  { path: "/manager/tasks",         label: "Tasks",        icon: CheckSquare,        end: false },
  { path: "/manager/notes",         label: "Notes",        icon: NotepadText,        end: false },
  { path: "/manager/attendance",    label: "Attendance",   icon: Clock,              end: false },
  { path: "/manager/leave",         label: "Leave",        icon: Calendar,           end: false },
  { path: "/manager/expenses",      label: "Expenses",     icon: Receipt,            end: false },
  { path: "/manager/calendar",      label: "Calendar",     icon: Calendar1Icon,      end: false },
  { path: "/manager/chat",          label: "Chat",         icon: MessageCircle,      end: false, badge: "chat" },
  { path: "/manager/announcements", label: "Announcements",icon: Megaphone,          end: false },
  { path: "/manager/holidays",      label: "Holidays",     icon: CalendarDays,       end: false },
  { path: "/manager/hiring",        label: "Recruitment",  icon: BriefcaseBusiness,  end: false },
  { path: "/manager/crm",           label: "Leads",        icon: Handshake,          end: false },
];

const ManagerSidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => (
  <SidebarShell
    navItems={MANAGER_NAV}
    tasksBasePath="/manager/tasks"
    mobileOpen={mobileOpen}
    onMobileClose={onMobileClose}
  />
);

export default ManagerSidebar;
