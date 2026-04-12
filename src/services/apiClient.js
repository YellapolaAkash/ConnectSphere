import axios from "axios";
import ENV from "../config/env";
import { getErrorMessage, isNetworkError } from "../utils/networkResilience";

const apiClient = axios.create({
  baseURL: ENV,
  // NOTE: Don't set default Content-Type header here
  // Let axios handle it dynamically:
  // - FormData → multipart/form-data with boundary
  // - JSON data → application/json
  // - Others → axios auto-detects
  timeout: 10000, // 10 second timeout
});

// ===== REQUEST INTERCEPTOR =====
// Add auth token to all requests and handle Content-Type
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Only set Content-Type for non-FormData requests
    // FormData needs to set its own boundary
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ===== RESPONSE INTERCEPTOR =====
// Global error handling with network resilience
apiClient.interceptors.response.use(
  (response) => response.data, // Return only the data
  (error) => {
    console.error("[API Error]", {
      status: error.response?.status,
      message: error.message,
      code: error.code,
    });

    // ===== AUTHENTICATION ERRORS =====
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(new Error("Session expired. Please login again."));
    }

    // ===== AUTHORIZATION ERRORS =====
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      return Promise.reject(
        new Error("You don't have permission for this action.")
      );
    }

    // ===== NOT FOUND ERRORS =====
    // Handle 404 Not Found
    if (error.response?.status === 404) {
      return Promise.reject(new Error("Resource not found."));
    }

    // ===== VALIDATION ERRORS =====
    // Handle 400 Bad Request
    if (error.response?.status === 400) {
      const message =
        error.response.data?.message || "Invalid request. Please check your input.";
      return Promise.reject(new Error(message));
    }

    // ===== RATE LIMITING =====
    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.["retry-after"] || 60;
      return Promise.reject(
        new Error(
          `Too many requests. Please wait ${retryAfter} seconds and try again.`
        )
      );
    }

    // ===== SERVER ERRORS =====
    // Handle 5xx Server Errors
    if (error.response?.status >= 500) {
      return Promise.reject(
        new Error("Server error. Please try again later.")
      );
    }

    // ===== NETWORK ERRORS =====
    // Handle network/connection errors
    if (isNetworkError(error)) {
      console.warn("[API] Network error detected:", error.code);
      return Promise.reject(new Error(getErrorMessage(error)));
    }

    // ===== GENERIC ERROR HANDLING =====
    // Use smart error message from utility
    const message = getErrorMessage(error);
    return Promise.reject(new Error(message));
  }
);

export default apiClient;