import { lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import PortalLayout from "@/portals/shared/PortalLayout";
import EmployeeSidebar from "./EmployeeSidebar";
import PortalSuspense from "@/portals/shared/PortalSuspense";

/* ── Lazy-loaded pages (separate chunks) ── */
const EmployeeDashboard = lazy(() => import("./dashboard/EmployeeDashboard"));
const Tasks             = lazy(() => import("@/pages/tasks/Tasks"));
const StickyNotes       = lazy(() => import("@/pages/notes/StickyNotes"));
const Attendance        = lazy(() => import("@/pages/attendance/Attendance"));
const Leave             = lazy(() => import("@/pages/leave/Leave"));
const Expenses          = lazy(() => import("@/pages/expenses/Expenses"));
const CalendarPage      = lazy(() => import("@/pages/calendar/CalendarPage"));
const Chat              = lazy(() => import("@/pages/chat/Chat"));
const Announcements     = lazy(() => import("@/pages/announcements/Announcements"));
const HolidaysPage      = lazy(() => import("@/pages/holidays/HolidaysPage"));
const Profile           = lazy(() => import("@/pages/profile/Profile"));
const UserProfile       = lazy(() => import("@/pages/userProfile/UserProfile"));

const EmployeePortal = () => (
  <PortalLayout SidebarComponent={EmployeeSidebar}>
    <Routes>
      <Route index element={<PortalSuspense><EmployeeDashboard /></PortalSuspense>} />
      <Route path="tasks"         element={<PortalSuspense><Tasks /></PortalSuspense>} />
      <Route path="notes"         element={<PortalSuspense><StickyNotes /></PortalSuspense>} />
      <Route path="attendance"    element={<PortalSuspense><Attendance /></PortalSuspense>} />
      <Route path="leave"         element={<PortalSuspense><Leave /></PortalSuspense>} />
      <Route path="expenses"      element={<PortalSuspense><Expenses /></PortalSuspense>} />
      <Route path="calendar"      element={<PortalSuspense><CalendarPage /></PortalSuspense>} />
      <Route path="chat"          element={<PortalSuspense><Chat /></PortalSuspense>} />
      <Route path="announcements" element={<PortalSuspense><Announcements /></PortalSuspense>} />
      <Route path="holidays"      element={<PortalSuspense><HolidaysPage /></PortalSuspense>} />
      <Route path="profile"       element={<PortalSuspense><Profile /></PortalSuspense>} />
      <Route path="user/:id"      element={<PortalSuspense><UserProfile /></PortalSuspense>} />
      <Route path="*"             element={<Navigate to="/employee" replace />} />
    </Routes>
  </PortalLayout>
);

export default EmployeePortal;
