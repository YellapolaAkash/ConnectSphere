import { useState } from "react";
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
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
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                errors.email ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
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
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                errors.password ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-3 rounded-lg font-semibold text-white transition ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-500 to-purple-600 hover:shadow-lg transform hover:scale-105"
            }`}
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

export default Login;