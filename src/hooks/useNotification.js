import { useState, useEffect, useCallback, useRef } from "react";
import { notificationService } from "../services/notification.service";
import socketService from "../services/socket.service";
import toast from "react-hot-toast";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications(pageNum, 20);
      const newNotifications = response.notifications || [];
      const totalNotifications = response.total || 0;

      if (pageNum === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
      }

      setTotal(totalNotifications);
      setPage(pageNum);

      // Count unread notifications
      const unread = newNotifications.filter((n) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup Socket.IO for real-time notifications
  useEffect(() => {
    fetchNotifications(1);

    const token = localStorage.getItem("accessToken");
    if (token) {
      socketRef.current = socketService.connect(token);

      const handleNotification = (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.success(`New notification: ${notification.message}`);
      };

      socketService.onNotification(handleNotification);

      return () => {
        socketService.offNotification(handleNotification);
      };
    }
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const deleteNotification = useCallback(async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((n) => n._id !== notificationId)
      );
      setTotal((prev) => prev - 1);
      toast.success("Notification deleted");
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  return {
    notifications,
    loading,
    page,
    total,
    unreadCount,
    hasMore: notifications.length < total,
    loadMore: () => fetchNotifications(page + 1),
    refetch: () => fetchNotifications(1),
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
