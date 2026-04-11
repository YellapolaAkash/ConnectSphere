import apiClient from "./apiClient";

export const notificationService = {
  // Get user's notifications
  getNotifications: async (page = 1, limit = 10) => {
    const response = await apiClient.get("/notifications", {
      params: { page, limit },
    });
    return response;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await apiClient.put(`/notifications/${notificationId}/read`);
    return response;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.put("/notifications/read-all");
    return response;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response;
  },
};
