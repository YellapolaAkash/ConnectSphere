// Quick API Integration Reference
// Copy these services and integrate with your Node/Express backend

// ============================================
// 1. POST SERVICE
// ============================================

export const postService = {
  // Create a new post
  createPost: async (content, image = null) => {
    const { data } = await apiClient.post("/posts", {
      content,
      image,
    });
    return data;
  },

  // Get paginated feed
  getFeed: async (page = 1, limit = 10) => {
    const { data } = await apiClient.get("/posts/feed", {
      params: { page, limit },
    });
    return data;
  },

  // Get user's posts
  getUserPosts: async (userId, page = 1) => {
    const { data } = await apiClient.get(`/posts/user/${userId}`, {
      params: { page },
    });
    return data;
  },

  // Get single post with comments
  getPost: async (postId) => {
    const { data } = await apiClient.get(`/posts/${postId}`);
    return data;
  },

  // Like/unlike post
  toggleLike: async (postId) => {
    const { data } = await apiClient.post(`/posts/${postId}/like`);
    return data;
  },

  // Check if liked
  isLiked: async (postId) => {
    const { data } = await apiClient.get(`/posts/${postId}/liked`);
    return data.liked;
  },

  // Add comment to post
  addComment: async (postId, text) => {
    const { data } = await apiClient.post(`/posts/${postId}/comment`, {
      text,
    });
    return data;
  },

  // Get comments
  getComments: async (postId, page = 1) => {
    const { data } = await apiClient.get(`/posts/${postId}/comments`, {
      params: { page },
    });
    return data;
  },

  // Delete post (only owner)
  deletePost: async (postId) => {
    const { data } = await apiClient.delete(`/posts/${postId}`);
    return data;
  },

  // Edit post (only owner)
  editPost: async (postId, content) => {
    const { data } = await apiClient.put(`/posts/${postId}`, { content });
    return data;
  },
};

// ============================================
// 2. CHAT SERVICE
// ============================================

export const chatService = {
  // Get all conversations
  getConversations: async () => {
    const { data } = await apiClient.get("/chat/conversations");
    return data;
  },

  // Get messages with specific user
  getMessages: async (userId, page = 1) => {
    const { data } = await apiClient.get(`/chat/${userId}/messages`, {
      params: { page },
    });
    return data;
  },

  // Send message (basic - for WebSocket version see below)
  sendMessage: async (userId, text, image = null) => {
    const { data } = await apiClient.post(`/chat/${userId}/message`, {
      text,
      image,
    });
    return data;
  },

  // Mark conversation as read
  markAsRead: async (userId) => {
    const { data } = await apiClient.put(`/chat/${userId}/read`);
    return data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const { data } = await apiClient.get("/chat/unread-count");
    return data.count;
  },

  // Delete conversation
  deleteConversation: async (userId) => {
    const { data } = await apiClient.delete(`/chat/${userId}`);
    return data;
  },
};

// ============================================
// 3. USER SERVICE
// ============================================

export const userService = {
  // Get user by ID
  getUser: async (userId) => {
    const { data } = await apiClient.get(`/users/${userId}`);
    return data;
  },

  // Get current user profile
  getProfile: async () => {
    const { data } = await apiClient.get("/user/profile");
    return data;
  },

  // Update profile
  updateProfile: async (updates) => {
    const { data } = await apiClient.put("/user/profile", updates);
    return data;
  },

  // Search users
  searchUsers: async (query, limit = 10) => {
    const { data } = await apiClient.get("/users/search", {
      params: { q: query, limit },
    });
    return data;
  },

  // Follow user
  followUser: async (userId) => {
    const { data } = await apiClient.post(`/users/${userId}/follow`);
    return data;
  },

  // Unfollow user
  unfollowUser: async (userId) => {
    const { data } = await apiClient.delete(`/users/${userId}/follow`);
    return data;
  },

  // Check if following
  isFollowing: async (userId) => {
    const { data } = await apiClient.get(`/users/${userId}/following`);
    return data.following;
  },

  // Get user's followers
  getFollowers: async (userId, page = 1) => {
    const { data } = await apiClient.get(`/users/${userId}/followers`, {
      params: { page },
    });
    return data;
  },

  // Get user's following
  getFollowing: async (userId, page = 1) => {
    const { data } = await apiClient.get(`/users/${userId}/following`, {
      params: { page },
    });
    return data;
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const { data } = await apiClient.post("/user/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};

// ============================================
// 4. NOTIFICATION SERVICE
// ============================================

export const notificationService = {
  // Get notifications
  getNotifications: async (page = 1, limit = 20) => {
    const { data } = await apiClient.get("/notifications", {
      params: { page, limit },
    });
    return data;
  },

  // Mark as read
  markAsRead: async (notificationId) => {
    const { data } = await apiClient.put(`/notifications/${notificationId}/read`);
    return data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const { data } = await apiClient.put("/notifications/read-all");
    return data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const { data } = await apiClient.delete(`/notifications/${notificationId}`);
    return data;
  },

  // Get unread count
  getUnreadCount: async () => {
    const { data } = await apiClient.get("/notifications/unread-count");
    return data.count;
  },

  // Subscribe to notifications (WebSocket)
  subscribeToNotifications: (callback) => {
    // This will use Socket.IO
    socketService.on("notification", callback);
  },
};

// ============================================
// 5. SOCKET.IO SERVICE (Real-time)
// ============================================

import io from "socket.io-client";
import ENV from "../config/env";

class SocketService {
  socket = null;
  isConnected = false;

  connect() {
    const token = localStorage.getItem("accessToken");
    
    this.socket = io(ENV.SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection events
    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("✅ Socket connected");
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("❌ Socket disconnected");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  }

  // Join chat room
  joinRoom(conversationId) {
    if (this.socket) {
      this.socket.emit("join", { conversationId });
    }
  }

  // Send message in real-time
  sendMessage(conversationId, message) {
    if (this.socket) {
      this.socket.emit("message", {
        conversationId,
        text: message.text,
        timestamp: new Date(),
      });
    }
  }

  // Listen for incoming messages
  onMessage(callback) {
    if (this.socket) {
      this.socket.on("message", callback);
    }
  }

  // Typing indicator
  sendTyping(conversationId) {
    if (this.socket) {
      this.socket.emit("typing", { conversationId });
    }
  }

  // Receive typing status
  onTyping(callback) {
    if (this.socket) {
      this.socket.on("typing", callback);
    }
  }

  // Online status
  sendOnlineStatus(status) {
    if (this.socket) {
      this.socket.emit("online-status", { status });
    }
  }

  // Get online users
  onlineUsers(callback) {
    if (this.socket) {
      this.socket.on("online-users", callback);
    }
  }

  // Generic event listener
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  // Emit custom event
  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }
}

export const socketService = new SocketService();

// ============================================
// EXAMPLE USAGE IN COMPONENTS
// ============================================

/*
// In Login.jsx (after successful auth)
const handleSuccessfulLogin = (data) => {
  setAuth(data);
  // Connect socket after login
  socketService.connect();
  socketService.joinRoom(data.user.id);
};

// In Chat.jsx
const handleSendMessage = (message) => {
  socketService.sendMessage(selectedChat.id, {
    text: message,
    sender: user.id,
  });
};

// Listen for messages
useEffect(() => {
  socketService.onMessage((message) => {
    setMessages(prev => [...prev, message]);
  });
  
  return () => {
    socketService.socket?.off('message');
  };
}, []);

// In Home.jsx (Posts)
const handleCreatePost = async () => {
  try {
    const post = await postService.createPost(content);
    setPosts([post, ...posts]);
  } catch (error) {
    toast.error("Failed to create post");
  }
};

// In Chat.jsx (typing indicator)
const handleTyping = () => {
  socketService.sendTyping(selectedChat.id);
};

// Get online users
useEffect(() => {
  socketService.onlineUsers((users) => {
    setOnlineUsers(users);
  });
}, []);
*/

// ============================================
// ZUSTAND STORES READY TO CREATE
// ============================================

/*
// src/store/postStore.js
import { create } from 'zustand';

export const usePostStore = create((set) => ({
  posts: [],
  loading: false,
  hasMore: true,
  page: 1,

  setPosts: (posts) => set({ posts }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
  updatePost: (postId, updates) => set((state) => ({
    posts: state.posts.map((p) => 
      p.id === postId ? { ...p, ...updates } : p
    ),
  })),
  deletePost: (postId) => set((state) => ({
    posts: state.posts.filter((p) => p.id !== postId),
  })),
}));

// src/store/chatStore.js
export const useChatStore = create((set) => ({
  conversations: [],
  selectedChat: null,
  messages: {},
  
  setConversations: (conversations) => set({ conversations }),
  selectChat: (chat) => set({ selectedChat: chat }),
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message],
    },
  })),
}));
*/
