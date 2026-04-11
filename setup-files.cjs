const fs = require("fs");
const path = require("path");

const loginContent = `import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/auth.service";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const Login = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    setLoading(true);

    try {
      const data = await authService.login(form);

      setAuth({
        user: data.user,
        token: data.token,
      });

      toast.success("Login successful!");
      navigate("/app");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      toast.error(errorMessage);
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ConnectSphere
          </h1>
          <p className="text-gray-600 text-sm mt-1">Connect with developers worldwide</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              className={\`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition \${
                errors.email ? "border-red-500 bg-red-50" : "border-gray-300"
              }\`}
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={\`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition \${
                errors.password ? "border-red-500 bg-red-50" : "border-gray-300"
              }\`}
              disabled={isLoading}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={\`w-full p-3 rounded-lg font-semibold text-white transition \${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg transform hover:scale-105"
            }\`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-700">
          Don't have an account?{" "}
          <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
            Sign up
          </Link>
        </p>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-2">Demo Login (if available):</p>
          <p className="text-xs text-gray-600 text-center">
            📧 demo@example.com <br /> 🔐 password123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;`;

const signupContent = `import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/auth.service";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const Signup = () => {
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    } else if (form.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.password.trim()) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors below");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...signupData } = form;
      const data = await authService.signup(signupData);

      setAuth({
        user: data.user,
        token: data.token,
      });

      toast.success("Account created successfully!");
      navigate("/app");
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Signup failed. Please try again.";
      toast.error(errorMessage);
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-200 px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ConnectSphere
          </h1>
          <p className="text-gray-600 text-sm mt-1">Join our developer community</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-8">
          <div>
            <input
              type="text"
              name="name"
              placeholder="Full name"
              value={form.name}
              onChange={handleChange}
              className={\`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition \${
                errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
              }\`}
              disabled={isLoading}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              className={\`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition \${
                errors.email ? "border-red-500 bg-red-50" : "border-gray-300"
              }\`}
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className={\`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition \${
                errors.password ? "border-red-500 bg-red-50" : "border-gray-300"
              }\`}
              disabled={isLoading}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              value={form.confirmPassword}
              onChange={handleChange}
              className={\`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition \${
                errors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-300"
              }\`}
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={\`w-full p-3 rounded-lg font-semibold text-white transition \${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-blue-600 hover:shadow-lg transform hover:scale-105"
            }\`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating account...
              </span>
            ) : (
              "Sign Up"
            )}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-700">
          Already have an account?{" "}
          <Link to="/" className="text-purple-600 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;`;

const appJsxContent = `import { useEffect } from "react";
import useAuthStore from "./store/authStore";
import AppRoutes from "./routes/AppRoutes";

function App() {
  const { hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  return <AppRoutes />;
}

export default App;`;

const mainLayoutContent = `import { useNavigate } from "react-router-dom";
import { Outlet } from "react-router-dom";
import useAuthStore from "../store/authStore";
import toast from "react-hot-toast";

const MainLayout = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully!");
    navigate("/");
  };

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
          <NavLink to="/app" label="Home" icon="🏠" />
          <NavLink to="/app/chat" label="Messages" icon="💬" />
          <NavLink to="/app/notifications" label="Notifications" icon="🔔" />
          <NavLink to="/app/profile" label="Profile" icon="👤" />
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-200 bg-white">
          <div className="mb-4">
            <p className="text-sm font-semibold text-gray-700">{user?.name || "User"}</p>
            <p className="text-xs text-gray-500">{user?.email || "email@example.com"}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  );
};

const NavLink = ({ to, label, icon }) => {
  const navigate = useNavigate();
  const isActive = window.location.pathname === to;

  return (
    <button
      onClick={() => navigate(to)}
      className={\`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition \${
        isActive
          ? "bg-blue-100 text-blue-600 font-semibold"
          : "text-gray-700 hover:bg-gray-100"
      }\`}
    >
      <span className="text-xl">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

export default MainLayout;`;

try {
  fs.writeFileSync(path.join(process.cwd(), "src/pages/Login.jsx"), loginContent);
  fs.writeFileSync(path.join(process.cwd(), "src/pages/Signup.jsx"), signupContent);
  fs.writeFileSync(path.join(process.cwd(), "src/App.jsx"), appJsxContent);
  fs.writeFileSync(path.join(process.cwd(), "src/layouts/MainLayout.jsx"), mainLayoutContent);

  console.log("✅ All files updated successfully!");
  console.log("Files created:");
  console.log("  - src/pages/Login.jsx");
  console.log("  - src/pages/Signup.jsx");
  console.log("  - src/App.jsx");
  console.log("  - src/layouts/MainLayout.jsx");
} catch (error) {
  console.error("❌ Error:", error.message);
}
