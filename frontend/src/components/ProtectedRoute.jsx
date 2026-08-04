import { Navigate } from "react-router-dom";

// Role → home dashboard mapping
const ROLE_HOME = {
  farmer:   "/farmer/dashboard",
  seller:   "/seller/dashboard",
  exporter: "/exporter/dashboard",
  admin:    "/admin/dashboard",
  user:     "/user/dashboard",
};

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("agroconnect_token");

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("agroconnect_user") || "null");
  } catch {
    user = null;
  }

  // Not logged in → go to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // No role yet → complete profile
  if (!user.role) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Wrong role → redirect to their own dashboard (or select-role if unknown)
  if (allowedRole && user.role !== allowedRole) {
    const home = ROLE_HOME[user.role];
    return <Navigate to={home || "/select-role"} replace />;
  }

  return children;
}