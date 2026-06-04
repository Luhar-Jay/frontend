import { Link } from "react-router-dom";

interface LeaveBalance {
  totalBalance?: number;
  leaveTaken?: number;
  paidLeave?: number;
}

interface Props { balance: LeaveBalance | undefined }

const EmployeeLeaveBalanceWidget = ({ balance }: Props) => (
  <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
    <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
      <h2 className="font-semibold text-gray-800">Leave Balance</h2>
      <Link to="/employee/leave" className="text-xs font-medium text-indigo-600 hover:underline">Apply</Link>
    </div>
    <div className="grid grid-cols-3 divide-x divide-gray-100 py-5 text-center">
      {[
        { label: "Balance", value: balance?.totalBalance ?? 0 },
        { label: "Taken",   value: balance?.leaveTaken ?? 0 },
        { label: "Paid",    value: balance?.paidLeave ?? 0 },
      ].map((s) => (
        <div key={s.label} className="px-3">
          <p className="text-xs text-gray-400">{s.label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>
        </div>
      ))}
    </div>
    <div className="px-5 pb-4">
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
          style={{ width: `${Math.min(100, ((balance?.leaveTaken ?? 0) / Math.max(1, balance?.totalBalance ?? 1)) * 100)}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-gray-400">
        {balance?.leaveTaken ?? 0} of {balance?.totalBalance ?? 0} days used
      </p>
    </div>
  </div>
);

export default EmployeeLeaveBalanceWidget;
