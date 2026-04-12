import io from "socket.io-client";
import ENV from "../config/env";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isAuthenticating = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Connect to Socket.IO server and authenticate with JWT token
   * According to backend guide: Socket.IO requires explicit 'authenticate' event
   */
  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket && !this.socket.connected) {
      this.socket.connect();
      return this.socket;
    }

    const socketHost = ENV.replace("/api", "");
    
    this.socket = io(socketHost, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      withCredentials: true,
    });

    // ===== CONNECTION LIFECYCLE EVENTS =====
    this.socket.on("connect", () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log("[Socket] Connected to server:", this.socket.id);
      
      // Authenticate immediately after connection
      this.authenticate(token);
    });

    this.socket.on("disconnect", (reason) => {
      this.isConnected = false;
      console.log("[Socket] Disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
      this.reconnectAttempts++;
    });

    this.socket.on("error", (error) => {
      console.error("[Socket] Socket error:", error);
    });

    // ===== AUTHENTICATION EVENTS =====
    this.socket.on("auth_success", (data) => {
      this.isAuthenticating = false;
      console.log("[Socket] Authentication successful:", data);
    });

    this.socket.on("auth_error", (data) => {
      this.isAuthenticating = false;
      console.error("[Socket] Authentication failed:", data?.message);
      // Re-authenticate on auth failure
      if (token) {
        this.authenticate(token);
      }
    });

    return this.socket;
  }

  /**
   * Authenticate with JWT token
   * Backend expects: socket.emit('authenticate', jwtToken)
   */
  authenticate(token) {
    if (!this.socket?.connected || this.isAuthenticating) return;

    this.isAuthenticating = true;
    this.socket.emit("authenticate", token);
  }

  /**
   * Disconnect from Socket.IO server cleanly
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.isAuthenticating = false;
    }
  }

  /**
   * Check if socket is connected and authenticated
   */
  isReady() {
    return this.socket?.connected && !this.isAuthenticating;
  }

  // ===== POSTS REAL-TIME EVENTS =====

  /**
   * Subscribe to global posts feed updates
   * Backend expects: socket.emit('subscribe_to_posts')
   */
  subscribeToPostsFeed() {
    if (!this.isReady()) {
      console.warn("[Socket] Cannot subscribe - not connected");
      return;
    }
    this.socket.emit("subscribe_to_posts");
    console.log("[Socket] Subscribed to posts feed");
  }

  /**
   * Listen for new posts in real-time
   * Backend emits: socket.on('new_post', { post, timestamp })
   */
  onNewPost(callback) {
    if (!this.socket) return;
    this.socket.on("new_post", (data) => {
      console.log("[Socket] New post received:", data.post?._id);
      callback(data);
    });
  }

  /**
   * Notify when a post is liked
   * Frontend emits: socket.emit('post_liked', { postId, likesCount, action })
   */
  notifyPostLike(postId, likesCount, action = "like") {
    if (!this.isReady()) return;
    this.socket.emit("post_liked", {
      postId,
      likesCount,
      action,
    });
  }

  /**
   * Listen for post like updates from other users
   * Backend emits: socket.on('post_like_updated', { postId, likesCount, userId, action })
   */
  onPostLikeUpdated(callback) {
    if (!this.socket) return;
    this.socket.on("post_like_updated", callback);
  }

  /**
   * Notify when a comment is added to post
   * Frontend emits: socket.emit('post_commented', { postId, comment, commentsCount })
   */
  notifyPostComment(postId, comment, commentsCount) {
    if (!this.isReady()) return;
    this.socket.emit("post_commented", {
      postId,
      comment,
      commentsCount,
    });
  }

  /**
   * Listen for post comment updates from other users
   * Backend emits: socket.on('post_comment_updated', { postId, comment, commentsCount })
   */
  onPostCommentUpdated(callback) {
    if (!this.socket) return;
    this.socket.on("post_comment_updated", callback);
  }

  // ===== CHAT REAL-TIME EVENTS =====

  /**
   * Join a chat room
   * Backend expects: socket.emit('join_chat', chatId)
   */
  joinChat(chatId) {
    if (!this.isReady()) {
      console.warn("[Socket] Cannot join chat - not connected");
      return;
    }
    this.socket.emit("join_chat", chatId);
    console.log("[Socket] Joined chat:", chatId);
  }

  /**
   * Leave a chat room gracefully
   * Backend expects: socket.emit('leave_chat', chatId)
   */
  leaveChat(chatId) {
    if (!this.isReady()) return;
    this.socket.emit("leave_chat", chatId);
    console.log("[Socket] Left chat:", chatId);
  }

  /**
   * Send a message in a chat
   * Backend expects: socket.emit('send_message', { chatId, content })
   */
//   sendMessage(chatId, content) {
//     if (!this.isReady()) {
//       console.warn("[Socket] Cannot send message - not connected");
//       return;
//     }
//     // this.socket.emit("send_message", {
//     //   chatId,
//     //   content,
//     // });
//     socket.emit("send_message", {
//   chatId,
//   content,
//   tempId, // ✅ MUST be sent
// });
//   }
sendMessage(chatId, data) {
  if (!this.isReady()) {
    console.warn("[Socket] Cannot send message - not connected");
    return;
  }

  this.socket.emit("send_message", data); // ✅ correct
}

  /**
   * Listen for incoming messages
   * Backend emits: socket.on('message_received', { message, chatId, timestamp })
   */
  onMessage(callback) {
    if (!this.socket) return;
    this.socket.on("message_received", (data) => {
      console.log("[Socket] Message received in chat:", data.chatId);
      callback(data);
    });
  }

  /**
   * Remove message listener
   */
  offMessage(callback) {
    if (!this.socket) return;
    this.socket.off("message_received", callback);
  }

  /**
   * Send typing start indicator
   * Backend expects: socket.emit('typing_start', { chatId })
   */
  startTyping(chatId) {
    console.log("startTyping called with chatId:", chatId)
    if (!this.isReady()) return;
    this.socket.emit("typing_start", { chatId });
  }

  /**
   * Send typing stop indicator
   * Backend expects: socket.emit('typing_stop', { chatId })
   */
  stopTyping(chatId) {
    if (!this.isReady()) return;
    this.socket.emit("typing_stop", { chatId });
  }

  /**
   * Listen for typing indicators from other users
   * Backend emits: socket.on('typing_indicator', { userId, isTyping })
   */
  onTyping(callback) {
    if (!this.socket) return;
    this.socket.on("typing_indicator", callback);
  }

  /**
   * Remove typing listener
   */
  offTyping(callback) {
    if (!this.socket) return;
    this.socket.off("typing_indicator", callback);
  }

  /**
   * Listen for socket authentication success
   */
  onAuthSuccess(callback) {
    if (!this.socket) return;
    this.socket.on("auth_success", callback);
  }

  /**
   * Remove socket authentication success listener
   */
  offAuthSuccess(callback) {
    if (!this.socket) return;
    this.socket.off("auth_success", callback);
  }

  /**
   * Listen for socket authentication failure
   */
  onAuthError(callback) {
    if (!this.socket) return;
    this.socket.on("auth_error", callback);
  }

  /**
   * Remove socket authentication failure listener
   */
  offAuthError(callback) {
    if (!this.socket) return;
    this.socket.off("auth_error", callback);
  }

  /**
   * Mark messages as read
   * Backend expects: socket.emit('mark_as_read', { chatId })
   */
  markMessagesAsRead(chatId) {
    if (!this.isReady()) return;
    this.socket.emit("mark_as_read", { chatId });
  }

  /**
   * Listen for message read confirmations
   * Backend emits: socket.on('messages_read', { userId, chatId })
   */
  onMessagesRead(callback) {
    if (!this.socket) return;
    this.socket.on("messages_read", callback);
  }

  // ===== USER PRESENCE EVENTS =====

  /**
   * Get list of currently active/online users
   * Backend expects: socket.emit('get_active_users')
   */
  getActiveUsers() {
    if (!this.isReady()) return;
    this.socket.emit("get_active_users");
  }

  /**
   * Listen for active users list
   * Backend emits: socket.on('active_users_list', { users, count })
   */
  onActiveUsersList(callback) {
    if (!this.socket) return;
    this.socket.on("active_users_list", callback);
  }

  /**
   * Listen for user coming online
   * Backend emits: socket.on('user_online', { userId, isOnline })
   */
  onUserOnline(callback) {
    if (!this.socket) return;
    this.socket.on("user_online", callback);
  }

  /**
   * Listen for user going offline
   * Backend emits: socket.on('user_offline', { userId, isOnline, lastSeen })
   */
  onUserOffline(callback) {
    if (!this.socket) return;
    this.socket.on("user_offline", callback);
  }

  /**
   * Listen for any user status change
   */
  onUserStatus(callback) {
    if (!this.socket) return;
    this.socket.on("user_online", (data) => callback({ ...data, event: "online" }));
    this.socket.on("user_offline", (data) => callback({ ...data, event: "offline" }));
  }

  /**
   * Remove user online listener
   */
  offUserOnline(callback) {
    if (!this.socket) return;
    this.socket.off("user_online", callback);
  }

  /**
   * Remove user offline listener
   */
  offUserOffline(callback) {
    if (!this.socket) return;
    this.socket.off("user_offline", callback);
  }

  // ===== NOTIFICATION EVENTS =====

  /**
   * Subscribe to receive notifications
   * Backend expects: socket.emit('subscribe_notifications')
   */
  subscribeToNotifications() {
    if (!this.isReady()) return;
    this.socket.emit("subscribe_notifications");
  }

  /**
   * Listen for incoming notifications
   * Backend emits: socket.on('notification_received', { notification, unreadCount })
   */
  onNotification(callback) {
    if (!this.socket) return;
    this.socket.on("notification_received", callback);
  }

  /**
   * Remove notification listener
   */
  offNotification(callback) {
    if (!this.socket) return;
    this.socket.off("notification_received", callback);
  }

  // ===== GENERIC EVENT HANDLERS =====

  /**
   * Generic event listener for custom events
   */
  on(eventName, callback) {
    if (!this.socket) return;
    this.socket.on(eventName, callback);
  }

  /**
   * Generic event emitter for custom events
   */
  emit(eventName, data) {
    if (!this.isReady()) {
      console.warn(`[Socket] Cannot emit ${eventName} - not connected`);
      return;
    }
    this.socket.emit(eventName, data);
  }

  /**
   * Remove new post listener
   */
  offNewPost(callback) {
    if (!this.socket) return;
    this.socket.off("new_post", callback);
  }

  /**
   * Remove post like updated listener
   */
  offPostLikeUpdated(callback) {
    if (!this.socket) return;
    this.socket.off("post_like_updated", callback);
  }

  /**
   * Remove message read listener
   */
  offMessagesRead(callback) {
    if (!this.socket) return;
    this.socket.off("messages_read", callback);
  }

  /**
   * Remove generic listener
   */
  off(eventName, callback) {
    if (!this.socket) return;
    this.socket.off(eventName, callback);
  }
}

// Export singleton instance
export default new SocketService();
