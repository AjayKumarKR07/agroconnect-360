import { Navigate } from "react-router-dom";

export default function ProtectedRoute({
  children,
  allowedRole,
}) {
  const token = localStorage.getItem("agroconnect_token");

  const user = JSON.parse(
    localStorage.getItem("agroconnect_user") || "null"
  );

  // Not logged in
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role
  if (allowedRole && user.role !== allowedRole) {
    switch (user.role) {
      case "farmer":
        return <Navigate to="/farmer/dashboard" replace />;

      case "seller":
        return <Navigate to="/seller/dashboard" replace />;

      case "exporter":
        return <Navigate to="/exporter/dashboard" replace />;

      case "user":
        return <Navigate to="/user/dashboard" replace />;

      default:
        return <Navigate to="/complete-profile" replace />;
    }
  }

  return children;
}