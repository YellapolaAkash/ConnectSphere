import { useNavigate, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ConnectSphere
          </h1>
        </div>

        <nav className="p-6 space-y-2">
          <NavLink to="/app" label="Home" icon="🏠" location={location} />
          <NavLink to="/app/chat" label="Messages" icon="💬" location={location} />
          <NavLink to="/app/notifications" label="Notifications" icon="🔔" location={location} />
          <NavLink to="/app/profile" label="Profile" icon="👤" location={location} />
        </nav>

      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

const NavLink = ({ to, label, icon, location }) => {
  const navigate = useNavigate();
  const isActive = location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${
        isActive
          ? "bg-blue-100 text-blue-600 font-semibold"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default MainLayout;