import { Navigate } from "react-router-dom";
import { getStoredUserRoles } from "@utils/moduleAccess";
import { getUserId } from "@utils/session";

function resolvePortalPath(roles: string[]): string {
  if (roles.some((r) => ["super-admin", "admin", "hr"].includes(r))) return "/admin";
  if (roles.includes("manager")) return "/manager";
  return "/employee";
}

const PortalGate = () => {
  const userId = getUserId();
  if (!userId) return <Navigate to="/login" replace />;
  const roles = getStoredUserRoles();
  return <Navigate to={resolvePortalPath(roles)} replace />;
};

export default PortalGate;
