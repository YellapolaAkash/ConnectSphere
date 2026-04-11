import apiClient from "./apiClient";

export const authService = {
  // User signup
  signup: async (payload) => {
    const response = await apiClient.post("/auth/signup", payload);
    return response;
  },

  // User login
  login: async (payload) => {
    const response = await apiClient.post("/auth/login", payload);
    return response;
  },

  // Get current user profile
  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return response;
  },

  // Logout - clear token on backend (optional)
  logout: async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch (error) {
      // Logout happens on frontend even if backend call fails
      console.log("Logout from backend failed, clearing frontend");
    }
  },
};