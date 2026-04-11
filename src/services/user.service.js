import apiClient from "./apiClient";

export const userService = {
  // Get user's public profile
  getUserProfile: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response;
  },

  // Update current user's profile
  updateProfile: async (userId, formData) => {
    const response = await apiClient.put(`/users/${userId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response;
  },

  // Search users
  searchUsers: async (searchTerm = "", page = 1, limit = 10) => {
    const response = await apiClient.get("/users", {
      params: { search: searchTerm, page, limit },
    });
    return response;
  },

  // Follow a user
  followUser: async (userId) => {
    const response = await apiClient.post(`/users/${userId}/follow`);
    return response;
  },

  // Unfollow a user
  unfollowUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}/follow`);
    return response;
  },

  // Get user's followers
  getFollowers: async (userId, page = 1, limit = 10) => {
    const response = await apiClient.get(`/users/${userId}/followers`, {
      params: { page, limit },
    });
    return response;
  },

  // Get user's following
  getFollowing: async (userId, page = 1, limit = 10) => {
    const response = await apiClient.get(`/users/${userId}/following`, {
      params: { page, limit },
    });
    return response;
  },

  // Get all users (for chat, discovery, etc.)
  getAllUsers: async (page = 1, limit = 50) => {
    const response = await apiClient.get("/users/all", {
      params: { page, limit },
    });
    return response;
  },

  // Get users for chat (excluding current user)
  getChatUsers: async () => {
    const response = await apiClient.get("/users/chat-users");
    return response;
  },

  // Get online users
  getOnlineUsers: async () => {
    const response = await apiClient.get("/users/online");
    return response;
  },
};
