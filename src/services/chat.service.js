import apiClient from "./apiClient";

export const chatService = {
  // Get user's chats
  getChats: async (page = 1, limit = 10) => {
    const response = await apiClient.get("/chats", {
      params: { page, limit },
    });
    return response;
  },

  // Create new chat
  createChat: async (payload) => {
    const response = await apiClient.post("/chats", payload);
    return response;
  },

  // Get messages from a chat
  getMessages: async (chatId, page = 1, limit = 50) => {
    const response = await apiClient.get(`/chats/${chatId}/messages`, {
      params: { page, limit },
    });
    return response;
  },

  // Send message to chat
  sendMessage: async (chatId, payload) => {
    const response = await apiClient.post(`/chats/${chatId}/messages`, payload);
    return response;
  },

  // Get all users for chat (excluding current user)
  getAllUsersForChat: async () => {
    const response = await apiClient.get("/users/chat-users");
    return response;
  },

  // Start chat with a user (create if doesn't exist)
  startChatWithUser: async (userId) => {
    const response = await apiClient.post(`/chats/start/${userId}`);
    return response;
  },
};
