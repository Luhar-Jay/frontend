import { lazy, Suspense } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import "./index.css";
import { Toaster } from "react-hot-toast";

/* ── Auth pages (small — not lazy) ── */
import Login from "./pages/auth/Login";
import SignUp from "./pages/auth/SignUp";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import OnboardingPage from "./pages/onboarding/OnboardingPage";

/* ── Portal gate: detects role → redirects to correct portal ── */
import PortalGate from "./portals/PortalGate";

/* ── Lazy-loaded portal chunks: each role loads its own bundle ── */
const AdminPortal    = lazy(() => import("./portals/admin/AdminPortal"));
const ManagerPortal  = lazy(() => import("./portals/manager/ManagerPortal"));
const EmployeePortal = lazy(() => import("./portals/employee/EmployeePortal"));

const PortalLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb]">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      <p className="text-sm text-gray-400">Loading portal…</p>
    </div>
  </div>
);

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: "#ffffff", color: "#000000" },
          error: { iconTheme: { primary: "#ff0000", secondary: "#fff" } },
        }}
      />
      <Routes>
        {/* ── Public / auth routes ── */}
        <Route path="/login"           element={<Login />} />
        <Route path="/signup"          element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
        <Route path="/onboarding"      element={<OnboardingPage />} />

        {/* ── Portal entry — redirects based on role ── */}
        <Route path="/" element={<PortalGate />} />

        {/* ── Admin portal chunk ── */}
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<PortalLoader />}>
              <AdminPortal />
            </Suspense>
          }
        />

        {/* ── Manager portal chunk ── */}
        <Route
          path="/manager/*"
          element={
            <Suspense fallback={<PortalLoader />}>
              <ManagerPortal />
            </Suspense>
          }
        />

        {/* ── Employee portal chunk ── */}
        <Route
          path="/employee/*"
          element={
            <Suspense fallback={<PortalLoader />}>
              <EmployeePortal />
            </Suspense>
          }
        />

        {/* ── Legacy URL aliases (backwards compat after deploy) ── */}
        <Route path="/profile"       element={<Navigate to="/" replace />} />
        <Route path="/settings"      element={<Navigate to="/" replace />} />
        <Route path="/tasks"         element={<Navigate to="/" replace />} />
        <Route path="/attendance"    element={<Navigate to="/" replace />} />
        <Route path="/leave"         element={<Navigate to="/" replace />} />
        <Route path="/salary"        element={<Navigate to="/" replace />} />
        <Route path="/expenses"      element={<Navigate to="/" replace />} />
        <Route path="/calendar"      element={<Navigate to="/" replace />} />
        <Route path="/chat"          element={<Navigate to="/" replace />} />
        <Route path="/announcements" element={<Navigate to="/" replace />} />
        <Route path="/organization"  element={<Navigate to="/" replace />} />
        <Route path="/holidays"      element={<Navigate to="/" replace />} />
        <Route path="/hiring"        element={<Navigate to="/" replace />} />
        <Route path="/crm"           element={<Navigate to="/" replace />} />
        <Route path="/assets"        element={<Navigate to="/" replace />} />
        <Route path="/notes"         element={<Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
