import apiClient from "./apiClient";

/**
 * Chat Service - Real-time chat operations
 * Handles REST API calls for chat, while WebSocket handles real-time messaging
 */
export const chatService = {
  /**
   * Get user's chats with pagination
   * Backend returns: { success, chats, total, page, pages }
   */
  getChats: async (page = 1, limit = 10) => {
    const response = await apiClient.get("/chats", {
      params: { page, limit },
    });
    return response;
  },

  /**
   * Create new chat/conversation
   * Backend expects: { participantIds, isGroup? }
   * Backend returns: { success, chat }
   */
  createChat: async (payload) => {
    const response = await apiClient.post("/chats", payload);
    return response;
  },

  /**
   * Start a chat with a specific user (creates if doesn't exist)
   * Backend expects: POST /api/chats/start/{userId}
   * Backend returns: { success, chat }
   */
  startChatWithUser: async (userId) => {
    const response = await apiClient.post(`/chats/start/${userId}`);
    return response;
  },

  /**
   * Get messages from a chat with pagination
   * Backend returns: { success, messages, total, page, pages }
   * Note: Real-time messages come via Socket.IO 'message_received' event
   */
  getMessages: async (chatId, page = 1, limit = 50) => {
    const response = await apiClient.get(`/chats/${chatId}/messages`, {
      params: { page, limit },
    });
    return response;
  },

  /**
   * Send message via REST API fallback
   * For real-time messaging, use socketService.sendMessage() instead
   * Backend expects: { content }
   * Backend returns: { success, message }
   */
  sendMessage: async (chatId, payload) => {
    const response = await apiClient.post(`/chats/${chatId}/messages`, payload);
    return response;
  },

  /**
   * Get all users for chat (excluding current user for DM selection)
   * Backend returns: { success, users }
   */
  getAllUsersForChat: async () => {
    const response = await apiClient.get("/users/chat-users");
    return response;
  },

  /**
   * Mark messages as read in a chat
   * For real-time marking, use socketService.markMessagesAsRead() instead
   * Backend expects: POST /api/chats/{chatId}/mark-read
   * Backend returns: { success }
   */
  markMessagesAsRead: async (chatId) => {
    const response = await apiClient.post(`/chats/${chatId}/mark-read`);
    return response;
  },

  /**
   * Delete multiple messages
   * Backend expects: { messageIds: string[] }
   * Backend returns: { success, deletedCount }
   */
  deleteMessages: async (chatId, messageIds) => {
    const response = await apiClient.delete(`/chats/${chatId}/messages`, {
      data: { messageIds },
    });
    return response;
  },

  /**
   * Get chat details
   * Backend returns: { success, chat }
   */
  getChat: async (chatId) => {
    const response = await apiClient.get(`/chats/${chatId}`);
    return response;
  },

  /**
   * Delete a chat
   * Backend returns: { success, message }
   */
  deleteChat: async (chatId) => {
    const response = await apiClient.delete(`/chats/${chatId}`);
    return response;
  },

  /**
   * Update chat settings (name, avatar for group chats)
   * Backend expects: { name?, avatar? }
   * Backend returns: { success, chat }
   */
  updateChat: async (chatId, payload) => {
    const response = await apiClient.put(`/chats/${chatId}`, payload);
    return response;
  },
};
