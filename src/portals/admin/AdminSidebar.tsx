import {
  LayoutDashboard, Users, CheckSquare, Clock, Calendar, Banknote,
  Package, Megaphone, Building2, CalendarDays, BriefcaseBusiness,
  Handshake, Receipt, Settings, MessageCircle, Calendar1Icon, NotepadText,
} from "lucide-react";
import SidebarShell, { type NavItem } from "@/portals/shared/SidebarShell";
import type { SidebarProps } from "@/portals/shared/PortalLayout";

const ADMIN_NAV: NavItem[] = [
  { path: "/admin",             label: "Dashboard",    icon: LayoutDashboard, end: true },
  { path: "/admin/employees",   label: "Employees",    icon: Users,           end: false },
  { type: "projects" },
  { path: "/admin/tasks",       label: "Tasks",        icon: CheckSquare,     end: false },
  { path: "/admin/notes",       label: "Notes",        icon: NotepadText,     end: false },
  { path: "/admin/attendance",  label: "Attendance",   icon: Clock,           end: false },
  { path: "/admin/leave",       label: "Leave",        icon: Calendar,        end: false },
  { path: "/admin/salary",      label: "Salary",       icon: Banknote,        end: false },
  { path: "/admin/expenses",    label: "Expenses",     icon: Receipt,         end: false },
  { path: "/admin/assets",      label: "Assets",       icon: Package,         end: false },
  { path: "/admin/calendar",    label: "Calendar",     icon: Calendar1Icon,   end: false },
  { path: "/admin/chat",        label: "Chat",         icon: MessageCircle,   end: false, badge: "chat" },
  { path: "/admin/announcements", label: "Announcements", icon: Megaphone,   end: false },
  { path: "/admin/organization", label: "Organization", icon: Building2,      end: false },
  { path: "/admin/holidays",    label: "Holidays",     icon: CalendarDays,    end: false },
  { path: "/admin/hiring",      label: "Recruitment",  icon: BriefcaseBusiness, end: false },
  { path: "/admin/crm",         label: "Leads",        icon: Handshake,       end: false },
  { path: "/admin/settings",    label: "Settings",     icon: Settings,        end: false },
];

const AdminSidebar = ({ mobileOpen, onMobileClose }: SidebarProps) => (
  <SidebarShell
    navItems={ADMIN_NAV}
    tasksBasePath="/admin/tasks"
    mobileOpen={mobileOpen}
    onMobileClose={onMobileClose}
  />
);

export default AdminSidebar;
