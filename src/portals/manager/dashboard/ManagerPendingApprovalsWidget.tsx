import { Link } from "react-router-dom";
import { CircleCheckBig } from "lucide-react";
import toast from "react-hot-toast";
import { useUpdateLeaveStatus, usePendingLeaveRequests } from "@/apis/api/leave";
import { ApiError } from "@/apis/apiService";
import { useActiveOrg } from "@/contexts/ActiveOrgContext";
import { formatDate } from "@/portals/shared/dashboardUtils";

const ManagerPendingApprovalsWidget = () => {
  const { activeMode } = useActiveOrg();
  const { data: pendingLeaves = [] } = usePendingLeaveRequests(true, activeMode);
  const updateLeaveMutation = useUpdateLeaveStatus();

  const handleDecision = async (id: string, status: "approved" | "rejected") => {
    try {
      await updateLeaveMutation.mutateAsync({ id, body: { status } });
      toast.success(`Leave ${status}.`);
    } catch (err) {
      toast.error((err as ApiError)?.message || "Could not update leave");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <h2 className="font-semibold text-gray-800">Pending Approvals</h2>
        <Link to="/manager/leave" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>
      </div>
      {pendingLeaves.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CircleCheckBig size={28} className="text-gray-200" />
          <p className="text-sm text-gray-400">All caught up — no pending requests</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {pendingLeaves.slice(0, 5).map((l) => {
            const uName = typeof l.user === "object" && l.user ? l.user.name : "Unknown";
            return (
              <li key={l._id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-semibold text-amber-700">
                  {uName.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium text-gray-800">{uName}</p>
                  <p className="truncate text-xs text-gray-400">
                    {formatDate(l.fromDate)}{l.toDate ? ` → ${formatDate(l.toDate)}` : ""} · {l.leaveType}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    disabled={updateLeaveMutation.isPending}
                    onClick={() => handleDecision(l._id, "approved")}
                    className="rounded-lg bg-emerald-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-50 transition"
                  >
                    ✓
                  </button>
                  <button
                    disabled={updateLeaveMutation.isPending}
                    onClick={() => handleDecision(l._id, "rejected")}
                    className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition"
                  >
                    ✕
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ManagerPendingApprovalsWidget;
