import { useState, useEffect, useCallback, useRef } from "react";
import { chatService } from "../services/chat.service";
import socketService from "../services/socket.service";
import toast from "react-hot-toast";

export const useChats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchChats = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await chatService.getChats(pageNum, 10);
      const newChats = response.chats || [];
      const totalChats = response.total || 0;

      if (pageNum === 1) {
        setChats(newChats);
      } else {
        setChats((prev) => [...prev, ...newChats]);
      }

      setTotal(totalChats);
      setPage(pageNum);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats(1);
  }, []);

  return {
    chats,
    loading,
    page,
    total,
    hasMore: chats.length < total,
    loadMore: () => fetchChats(page + 1),
    refetch: () => fetchChats(1),
    setChats,
  };
};

export const useCreateChat = () => {
  const [loading, setLoading] = useState(false);

  const createChat = useCallback(async (participantIds, isGroup = false) => {
    try {
      setLoading(true);
      const response = await chatService.createChat({
        participantIds,
        isGroup,
      });
      toast.success("Chat created!");
      return response.chat || response;
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createChat, loading };
};

/**
 * useChat Hook - Real-time chat messaging with WebSocket
 * Handles loading messages, real-time updates, and typing indicators
 * 
 * Backend WebSocket Events:
 * - join_chat: Join a chat room
 * - send_message: Send message to chat
 * - message_received: Listen for new messages { message, chatId, timestamp }
 * - typing_start/stop: Typing indicators
 * - typing_indicator: Listen for { userId, isTyping }
 * - mark_as_read: Mark messages read
 * - messages_read: Listen for { userId, chatId }
 */
export const useChat = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [page, setPage] = useState(1);
  const socketRef = useRef(null);
  const loadedChatsRef = useRef(new Set());
  const typingTimeoutRef = useRef(null);

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!chatId || loadedChatsRef.current.has(chatId)) return;

    try {
      setLoading(true);
      const response = await chatService.getMessages(chatId, 1, 50);
      const chatMessages = response.messages || [];
      
      // Sort messages by createdAt (oldest first)
      const sortedMessages = chatMessages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      setMessages(sortedMessages);
      loadedChatsRef.current.add(chatId);
      
      // Mark messages as read
      socketService.markMessagesAsRead(chatId);
    } catch (err) {
      console.error("[useChat] Failed to load messages:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // ===== SOCKET.IO SETUP FOR CHAT =====
  useEffect(() => {
    if (!chatId) return;

    setMessages([]); // Clear messages when switching chats
    setTypingUsers(new Set()); // Clear typing users
    loadMessages();

    const token = localStorage.getItem("accessToken");
    if (token) {
      socketRef.current = socketService.connect(token);

      const joinCurrentChat = () => {
        if (!chatId) return;
        socketService.joinChat(chatId);
        console.log("[useChat] Joined chat after auth:", chatId);
      };

      // ===== LISTEN FOR NEW MESSAGES =====
      const handleMessage = (data) => {
        if (data?.chatId === chatId && data?.message) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === data.message._id)) {
              console.log("[useChat] Duplicate message prevented:", data.message._id);
              return prev;
            }
            console.log("[useChat] Message received:", data.message._id);
            return [...prev, data.message];
          });
        }
      };

      // ===== LISTEN FOR TYPING INDICATORS =====
      const handleTyping = (data) => {
        if (data?.userId && data?.isTyping !== undefined) {
          setTypingUsers((prev) => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.userId);
            } else {
              newSet.delete(data.userId);
            }
            setIsTyping(newSet.size > 0);
            return newSet;
          });

          if (data.isTyping) {
            setTimeout(() => {
              setTypingUsers((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.userId);
                setIsTyping(newSet.size > 0);
                return newSet;
              });
            }, 5000);
          }
        }
      };

      // ===== LISTEN FOR MESSAGE READ CONFIRMATIONS =====
      const handleMessagesRead = (data) => {
        console.log("[useChat] Messages read by:", data?.userId);
      };

      const handleAuthSuccess = () => {
        joinCurrentChat();
      };

      const handleAuthError = (error) => {
        console.warn("[useChat] Socket auth failed:", error);
      };

      socketService.onAuthSuccess(handleAuthSuccess);
      socketService.onAuthError(handleAuthError);
      socketService.onMessage(handleMessage);
      socketService.onTyping(handleTyping);
      socketService.onMessagesRead(handleMessagesRead);

      if (socketService.isReady()) {
        joinCurrentChat();
      }

      return () => {
        socketService.offAuthSuccess(handleAuthSuccess);
        socketService.offAuthError(handleAuthError);
        socketService.offMessage(handleMessage);
        socketService.offTyping(handleTyping);
        socketService.offMessagesRead(handleMessagesRead);
        socketService.leaveChat(chatId);
      };
    }
  }, [chatId]);

  // ===== SEND MESSAGE =====
  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim()) {
        toast.error("Message cannot be empty");
        return null;
      }

      // Create optimistic message
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        sender: user,
        content,
        createdAt: new Date(),
        isOptimistic: true,
      };

      // Add optimistic message to local state
      setMessages((prev) => [...prev, optimisticMessage]);
      
      // Stop typing indicator
      socketService.stopTyping(chatId);

      try {
        // Try to emit the socket send immediately for instant delivery
        if (socketService.isReady()) {
          // socketService.sendMessage(chatId, content);
          socketService.sendMessage(chatId, {
            chatId,
            content,
            tempId: optimisticMessage._id, // 🔥 IMPORTANT
          });
        }

        // Persist via API so the message is stored reliably
        const response = await chatService.sendMessage(chatId, { content });
        const realMessage = response.message || response;

        // Replace optimistic message with real message
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === optimisticMessage._id ? realMessage : msg
          )
        );
        
        return realMessage;
      } catch (err) {
        // Remove optimistic message on error
        setMessages((prev) =>
          prev.filter((msg) => msg._id !== optimisticMessage._id)
        );
        console.error("[useChat] Send message error:", err);
        toast.error(err.message);
        throw err;
      }
    },
    [chatId]
  );

  // ===== HANDLE TYPING INDICATOR =====
  const sendTyping = useCallback(
    (isTyping) => {
      if (isTyping) {
        console.log(chatId,"chatId chatId chatId chatId")
        socketService.startTyping(chatId);
      } else {
        socketService.stopTyping(chatId);
      }

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Auto-stop typing after 3 seconds of inactivity
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => {
          socketService.stopTyping(chatId);
        }, 3000);
      }
    },
    [chatId]
  );

  // ===== MARK MESSAGES AS READ =====
  const markAsRead = useCallback(() => {
    socketService.markMessagesAsRead(chatId);
  }, [chatId]);

  return {
    messages,
    loading,
    isTyping,
    typingUsers,
    page,
    sendMessage,
    sendTyping,
    markAsRead,
    loadMore: async () => {
      if (!chatId) return;
      try {
        const response = await chatService.getMessages(chatId, page + 1, 50);
        const newMessages = (response.messages || []).sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        setMessages((prev) => [...newMessages, ...prev]);
        setPage((p) => p + 1);
      } catch (err) {
        console.error("[useChat] Error loading more messages:", err);
        toast.error(err.message);
      }
    },
  };
};

export const useAllUsersForChat = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await chatService.getAllUsersForChat();
      setUsers(response.users || response);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, loading, error, refetch: fetchUsers };
};

export const useStartChat = () => {
  const [loading, setLoading] = useState(false);

  const startChat = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await chatService.startChatWithUser(userId);
      toast.success("Chat started!");
      return response.chat || response;
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { startChat, loading };
};
