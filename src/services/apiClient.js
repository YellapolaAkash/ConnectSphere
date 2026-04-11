import axios from "axios";
import ENV from "../config/env";

const apiClient = axios.create({
  baseURL: ENV,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor - Add auth token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor - Global error handling
apiClient.interceptors.response.use(
  (response) => response.data, // Return only the data
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(new Error("Session expired. Please login again."));
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject(new Error("You don't have permission for this action."));
    }

    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject(new Error("Resource not found."));
    }

    // Handle 500 Server Error
    if (error.response?.status >= 500) {
      return Promise.reject(new Error("Server error. Please try again later."));
    }

    // Handle validation errors (400)
    if (error.response?.status === 400) {
      const message = error.response.data?.message || "Invalid request. Please check your input.";
      return Promise.reject(new Error(message));
    }

    // Generic error handling
    const message = error.response?.data?.message || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  }
);

export default apiClient;