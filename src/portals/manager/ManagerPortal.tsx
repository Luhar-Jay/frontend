import { lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import PortalLayout from "@/portals/shared/PortalLayout";
import ManagerSidebar from "./ManagerSidebar";
import PortalSuspense from "@/portals/shared/PortalSuspense";

/* ── Lazy-loaded pages (separate chunks) ── */
const ManagerDashboard = lazy(() => import("./dashboard/ManagerDashboard"));
const Tasks            = lazy(() => import("@/pages/tasks/Tasks"));
const StickyNotes      = lazy(() => import("@/pages/notes/StickyNotes"));
const Attendance       = lazy(() => import("@/pages/attendance/Attendance"));
const Leave            = lazy(() => import("@/pages/leave/Leave"));
const Expenses         = lazy(() => import("@/pages/expenses/Expenses"));
const CalendarPage     = lazy(() => import("@/pages/calendar/CalendarPage"));
const Chat             = lazy(() => import("@/pages/chat/Chat"));
const Announcements    = lazy(() => import("@/pages/announcements/Announcements"));
const HolidaysPage     = lazy(() => import("@/pages/holidays/HolidaysPage"));
const HiringPage       = lazy(() => import("@/pages/hiring/HiringPage"));
const CRMPage          = lazy(() => import("@/pages/crm/CRMPage"));
const Profile          = lazy(() => import("@/pages/profile/Profile"));
const UserProfile      = lazy(() => import("@/pages/userProfile/UserProfile"));
const OrganizationPage = lazy(() => import("@/pages/organization/OrganizationPage"));

const ManagerPortal = () => (
  <PortalLayout SidebarComponent={ManagerSidebar}>
    <Routes>
      <Route index element={<PortalSuspense><ManagerDashboard /></PortalSuspense>} />
      <Route path="team"         element={<PortalSuspense><OrganizationPage /></PortalSuspense>} />
      <Route path="tasks"        element={<PortalSuspense><Tasks /></PortalSuspense>} />
      <Route path="notes"        element={<PortalSuspense><StickyNotes /></PortalSuspense>} />
      <Route path="attendance"   element={<PortalSuspense><Attendance /></PortalSuspense>} />
      <Route path="leave"        element={<PortalSuspense><Leave /></PortalSuspense>} />
      <Route path="expenses"     element={<PortalSuspense><Expenses /></PortalSuspense>} />
      <Route path="calendar"     element={<PortalSuspense><CalendarPage /></PortalSuspense>} />
      <Route path="chat"         element={<PortalSuspense><Chat /></PortalSuspense>} />
      <Route path="announcements" element={<PortalSuspense><Announcements /></PortalSuspense>} />
      <Route path="holidays"     element={<PortalSuspense><HolidaysPage /></PortalSuspense>} />
      <Route path="hiring"       element={<PortalSuspense><HiringPage /></PortalSuspense>} />
      <Route path="crm"          element={<PortalSuspense><CRMPage /></PortalSuspense>} />
      <Route path="profile"      element={<PortalSuspense><Profile /></PortalSuspense>} />
      <Route path="user/:id"     element={<PortalSuspense><UserProfile /></PortalSuspense>} />
      <Route path="*"            element={<Navigate to="/manager" replace />} />
    </Routes>
  </PortalLayout>
);

export default ManagerPortal;
