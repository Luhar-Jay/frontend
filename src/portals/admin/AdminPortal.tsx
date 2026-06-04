import { lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import PortalLayout from "@/portals/shared/PortalLayout";
import AdminSidebar from "./AdminSidebar";
import PortalSuspense from "@/portals/shared/PortalSuspense";

/* ── Lazy-loaded pages (separate chunks) ── */
const AdminDashboard      = lazy(() => import("./dashboard/AdminDashboard"));
const Tasks               = lazy(() => import("@/pages/tasks/Tasks"));
const StickyNotes         = lazy(() => import("@/pages/notes/StickyNotes"));
const Attendance          = lazy(() => import("@/pages/attendance/Attendance"));
const Leave               = lazy(() => import("@/pages/leave/Leave"));
const Salary              = lazy(() => import("@/pages/salary/Salary"));
const Assets              = lazy(() => import("@/pages/assets/Assets"));
const Expenses            = lazy(() => import("@/pages/expenses/Expenses"));
const CalendarPage        = lazy(() => import("@/pages/calendar/CalendarPage"));
const Chat                = lazy(() => import("@/pages/chat/Chat"));
const Announcements       = lazy(() => import("@/pages/announcements/Announcements"));
const OrganizationPage    = lazy(() => import("@/pages/organization/OrganizationPage"));
const HolidaysPage        = lazy(() => import("@/pages/holidays/HolidaysPage"));
const HiringPage          = lazy(() => import("@/pages/hiring/HiringPage"));
const CRMPage             = lazy(() => import("@/pages/crm/CRMPage"));
const Settings            = lazy(() => import("@/pages/settings/Settings"));
const Profile             = lazy(() => import("@/pages/profile/Profile"));
const UserProfile         = lazy(() => import("@/pages/userProfile/UserProfile"));
const InvitesPage         = lazy(() => import("@/pages/invites/InvitesPage"));

const AdminPortal = () => (
  <PortalLayout SidebarComponent={AdminSidebar}>
    <Routes>
      <Route index element={<PortalSuspense><AdminDashboard /></PortalSuspense>} />
      <Route path="tasks"        element={<PortalSuspense><Tasks /></PortalSuspense>} />
      <Route path="notes"        element={<PortalSuspense><StickyNotes /></PortalSuspense>} />
      <Route path="attendance"   element={<PortalSuspense><Attendance /></PortalSuspense>} />
      <Route path="leave"        element={<PortalSuspense><Leave /></PortalSuspense>} />
      <Route path="salary"       element={<PortalSuspense><Salary /></PortalSuspense>} />
      <Route path="assets"       element={<PortalSuspense><Assets /></PortalSuspense>} />
      <Route path="expenses"     element={<PortalSuspense><Expenses /></PortalSuspense>} />
      <Route path="calendar"     element={<PortalSuspense><CalendarPage /></PortalSuspense>} />
      <Route path="chat"         element={<PortalSuspense><Chat /></PortalSuspense>} />
      <Route path="announcements" element={<PortalSuspense><Announcements /></PortalSuspense>} />
      <Route path="organization" element={<PortalSuspense><OrganizationPage /></PortalSuspense>} />
      <Route path="holidays"     element={<PortalSuspense><HolidaysPage /></PortalSuspense>} />
      <Route path="hiring"       element={<PortalSuspense><HiringPage /></PortalSuspense>} />
      <Route path="crm"          element={<PortalSuspense><CRMPage /></PortalSuspense>} />
      <Route path="settings"     element={<PortalSuspense><Settings /></PortalSuspense>} />
      <Route path="profile"      element={<PortalSuspense><Profile /></PortalSuspense>} />
      <Route path="user/:id"     element={<PortalSuspense><UserProfile /></PortalSuspense>} />
      <Route path="invites"      element={<PortalSuspense><InvitesPage /></PortalSuspense>} />
      <Route path="employees"    element={<PortalSuspense><OrganizationPage /></PortalSuspense>} />
      <Route path="*"            element={<Navigate to="/admin" replace />} />
    </Routes>
  </PortalLayout>
);

export default AdminPortal;
