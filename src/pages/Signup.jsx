import { useState } from "react";
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
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
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
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                errors.name ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
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
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
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
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                errors.password ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
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
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition ${
                errors.confirmPassword ? "border-red-500 bg-red-50" : "border-gray-300"
              }`}
              disabled={isLoading}
            />
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full p-3 rounded-lg font-semibold text-white transition ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-purple-500 to-blue-600 hover:shadow-lg transform hover:scale-105"
            }`}
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

export default Signup;