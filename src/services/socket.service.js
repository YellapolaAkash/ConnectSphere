import io from "socket.io-client";
import ENV from "../config/env";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // Connect to Socket.IO server
  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    const socketHost = ENV.replace("/api", "");
    this.socket = io(socketHost, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      withCredentials: true,
    });

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("Socket disconnected");
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    return this.socket;
  }

  // Disconnect from Socket.IO server
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  // Join a chat room
  joinChat(chatId) {
    if (!this.socket?.connected) return;
    this.socket.emit("joinChat", { chatId });
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (!this.socket?.connected) return;
    this.socket.emit("leaveChat", { chatId });
  }

  // Send a real-time message
  sendMessage(chatId, content) {
    if (!this.socket?.connected) return;
    this.socket.emit("send_message", { chatId, content });
  }

  // Send typing indicator
  sendTyping(chatId, isTyping) {
    if (!this.socket?.connected) return;
    const event = isTyping ? "typing_start" : "typing_stop";
    this.socket.emit(event, { chatId });
  }

  // Listen for new messages
  onMessage(callback) {
    if (!this.socket) return;
    this.socket.on("message_received", callback);
  }

  // Remove message listener
  offMessage(callback) {
    if (!this.socket) return;
    this.socket.off("message_received", callback);
  }

  // Listen for typing indicators
  onTyping(callback) {
    if (!this.socket) return;
    this.socket.on("typing_indicator", callback);
  }

  // Remove typing listener
  offTyping(callback) {
    if (!this.socket) return;
    this.socket.off("typing_indicator", callback);
  }

  // Listen for user online/offline
  onUserStatus(callback) {
    if (!this.socket) return;
    this.socket.on("userStatus", callback);
  }

  // Remove user status listener
  offUserStatus(callback) {
    if (!this.socket) return;
    this.socket.off("userStatus", callback);
  }

  // Listen for notifications
  onNotification(callback) {
    if (!this.socket) return;
    this.socket.on("notification", callback);
  }

  // Remove notification listener
  offNotification(callback) {
    if (!this.socket) return;
    this.socket.off("notification", callback);
  }

  // Generic event listener
  on(eventName, callback) {
    if (!this.socket) return;
    this.socket.on(eventName, callback);
  }

  // Generic event emitter
  emit(eventName, data) {
    if (!this.socket?.connected) return;
    this.socket.emit(eventName, data);
  }

  // Remove generic listener
  off(eventName, callback) {
    if (!this.socket) return;
    this.socket.off(eventName, callback);
  }
}

// Export singleton instance
export default new SocketService();
