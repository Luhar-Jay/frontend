import { Suspense, type ReactNode } from "react";

const PageLoader = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  </div>
);

interface PortalSuspenseProps {
  children: ReactNode;
}

const PortalSuspense = ({ children }: PortalSuspenseProps) => (
  <Suspense fallback={<PageLoader />}>{children}</Suspense>
);

export default PortalSuspense;
