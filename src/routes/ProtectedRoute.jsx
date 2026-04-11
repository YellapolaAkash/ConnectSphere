import { Navigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";

const ProtectedRoute = ({ children }) => {
  const { accessToken } = useAuthStore();
  const location = useLocation();

  // ❌ Not logged in
  if (!accessToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ✅ Logged in
  return children;
};

export default ProtectedRoute;