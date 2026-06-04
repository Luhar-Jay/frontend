import { useState, useEffect, type ComponentType, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Header from "@components/header/Header";
import AnnouncementPopup from "@components/announcements/AnnouncementPopup";
import BirthdayPopup from "@components/birthdays/BirthdayPopup";
import { ActiveOrgProvider } from "@/contexts/ActiveOrgContext";
import { ChatNotificationProvider } from "@/contexts/ChatNotificationContext";
import { connectSocket, disconnectSocket } from "@utils/socket";
import { getUserId, setUserId, setStoredRoles } from "@utils/session";
import { resumeSessionFromCookies } from "@/apis/apiService";
import { useUserById } from "@/apis/api/auth";
import { needsOnboarding } from "@/pages/onboarding/onboardingStorage";

export interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface PortalLayoutProps {
  SidebarComponent: ComponentType<SidebarProps>;
  children: ReactNode;
}

const PortalLayoutInner = ({ SidebarComponent, children }: PortalLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const userId = getUserId();
  const { data: sessionUser } = useUserById(userId);
  const isNotesPage = location.pathname.endsWith("/notes");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!getUserId()) {
          const user = await resumeSessionFromCookies();
          if (!cancelled && user?._id) {
            setUserId(user._id);
            setStoredRoles(user.role);
          }
        }
      } catch {
        /* cookie invalid or missing */
      } finally {
        if (!cancelled) setSessionChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (sessionUser?.role?.length) setStoredRoles(sessionUser.role);
  }, [sessionUser?.role]);

  useEffect(() => {
    connectSocket();
    return () => {
      disconnectSocket();
    };
  }, []);

  if (!sessionChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8fb] text-sm text-gray-500">
        Loading…
      </div>
    );
  }

  const currentUserId = getUserId();
  if (!currentUserId) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (needsOnboarding(currentUserId)) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="flex min-h-screen bg-[#f7f8fb]">
      <SidebarComponent
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:pl-64">
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main
          className={
            isNotesPage
              ? "flex min-h-0 flex-1 flex-col overflow-hidden p-0"
              : "flex-1 overflow-auto p-4 sm:p-6 lg:p-8"
          }
        >
          {children}
        </main>
      </div>
      <AnnouncementPopup />
      <BirthdayPopup />
    </div>
  );
};

const PortalLayout = (props: PortalLayoutProps) => (
  <ActiveOrgProvider>
    <ChatNotificationProvider>
      <PortalLayoutInner {...props} />
    </ChatNotificationProvider>
  </ActiveOrgProvider>
);

export default PortalLayout;
