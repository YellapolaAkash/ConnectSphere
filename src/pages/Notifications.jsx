import React, { useEffect } from "react";
import { useNotifications } from "../hooks";

const Notifications = () => {
  const {
    notifications,
    loading,
    unreadCount,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case "like":
        return "👍";
      case "comment":
        return "💬";
      case "follow":
        return "👤";
      case "message":
        return "💌";
      default:
        return "🔔";
    }
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return `${Math.floor(seconds / 2592000)}mo ago`;
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
          <h1 className="text-2xl font-bold">Notifications</h1>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                {unreadCount} New
              </span>
            )}
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-500 hover:text-blue-600 font-semibold text-sm"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div>
          {loading && notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <p className="text-lg">No notifications yet 🔔</p>
            </div>
          ) : (
            <>
              {notifications.map((notif) => (
                <div
                  key={notif._id}
                  className={`p-6 border-b border-gray-100 cursor-pointer transition hover:bg-gray-50 flex items-center justify-between ${
                    !notif.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex-1 flex items-center gap-4">
                    <img
                      src={notif.relatedUser?.avatar ? (notif.relatedUser.avatar.startsWith('http') ? notif.relatedUser.avatar : `http://localhost:5000${notif.relatedUser.avatar}`) : "👤"}
                      alt={notif.relatedUser?.name}
                      className="w-12 h-12 rounded-full bg-gray-200 text-lg flex items-center justify-center"
                      onError={(e) => (e.target.textContent = "👤")}
                    />
                    <div
                      onClick={() => markAsRead(notif._id)}
                      className="flex-1"
                    >
                      <p className="font-semibold">
                        {notif.relatedUser?.name}{" "}
                        <span className="font-normal text-gray-600">
                          {notif.message}
                        </span>
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getNotificationIcon(notif.type)}
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                    <button
                      onClick={() => deleteNotification(notif._id)}
                      className="text-red-500 hover:text-red-700 text-sm ml-2"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="p-6 text-center">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
                  >
                    {loading ? "Loading..." : "Load More"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;