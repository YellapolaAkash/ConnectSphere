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

export const useChat = (chatId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [page, setPage] = useState(1);
  const socketRef = useRef(null);
  const loadedChatsRef = useRef(new Set());

  // Load initial messages
  const loadMessages = useCallback(async () => {
    if (!chatId || loadedChatsRef.current.has(chatId)) return;

    try {
      setLoading(true);
      const response = await chatService.getMessages(chatId, 1, 50);
      const chatMessages = response.messages || [];
      // Sort messages by createdAt (oldest first)
      const sortedMessages = chatMessages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages(sortedMessages);
      loadedChatsRef.current.add(chatId);
    } catch (err) {
      console.error("Failed to load messages:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [chatId]);

  // Setup Socket.IO
  useEffect(() => {
    if (!chatId) return;

    setMessages([]); // Clear messages when switching chats
    loadMessages();

    const token = localStorage.getItem("accessToken");
    if (token) {
      socketRef.current = socketService.connect(token);

      // Join chat room
      socketService.joinChat(chatId);

      // Listen for new messages
      const handleMessage = (message) => {
        if (message.chatId === chatId) {
          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some(m => m._id === message._id)) return prev;
            return [...prev, message];
          });
        }
      };

      // Listen for typing
      const handleTyping = (data) => {
        setIsTyping(data.isTyping);
      };

      socketService.onMessage(handleMessage);
      socketService.onTyping(handleTyping);

      return () => {
        socketService.offMessage(handleMessage);
        socketService.offTyping(handleTyping);
        socketService.leaveChat(chatId);
      };
    }
  }, [chatId]); // Removed loadMessages from deps to prevent unnecessary re-runs

  // Send message
  const sendMessage = useCallback(
    async (content) => {
      if (!content.trim()) {
        toast.error("Message cannot be empty");
        return null;
      }

      // Create optimistic message
      const optimisticMessage = {
        _id: `temp-${Date.now()}`,
        sender: JSON.parse(localStorage.getItem("user") || "{}"),
        content,
        createdAt: new Date(),
        isOptimistic: true,
      };

      // Add optimistic message to local state
      setMessages((prev) => [...prev, optimisticMessage]);

      try {
        const response = await chatService.sendMessage(chatId, { content });
        const realMessage = response.message || response;
        // Replace optimistic message with real message
        setMessages((prev) => prev.map((msg) => msg._id === optimisticMessage._id ? realMessage : msg));
        return realMessage;
      } catch (err) {
        // Remove optimistic message on error
        setMessages((prev) => prev.filter((msg) => msg._id !== optimisticMessage._id));
        toast.error(err.message);
        throw err;
      }
    },
    [chatId]
  );

  // Send typing indicator
  const sendTyping = useCallback(
    (typing) => {
      socketService.sendTyping(chatId, typing);
    },
    [chatId]
  );

  return {
    messages,
    loading,
    isTyping,
    page,
    sendMessage,
    sendTyping,
    loadMore: async () => {
      if (!chatId) return;
      const response = await chatService.getMessages(chatId, page + 1, 50);
      const newMessages = (response.messages || []).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      setMessages((prev) => [...newMessages, ...prev]);
      setPage((p) => p + 1);
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
