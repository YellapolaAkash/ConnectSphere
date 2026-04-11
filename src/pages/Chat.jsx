import React, { useState, useEffect, useRef } from "react";
import { useChats, useChat, useAllUsersForChat, useStartChat } from "../hooks";
import useAuthStore from "../store/authStore";
import socketService from "../services/socket.service";
import toast from "react-hot-toast";

const Chat = () => {
  const { user } = useAuthStore();
  const { chats, loading: chatsLoading, refetch: refetchChats } = useChats();
  const { users: allUsers, loading: usersLoading } = useAllUsersForChat();
  const { startChat, loading: startingChat } = useStartChat();
  const [selectedChat, setSelectedChat] = useState(null);
  const { messages, loading: messagesLoading, isTyping, sendMessage, sendTyping } = useChat(
    selectedChat?._id
  );
  const [newMessage, setNewMessage] = useState("");
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) {
      toast.error("Cannot send empty message");
      return;
    }

    try {
      await sendMessage(newMessage);

      setNewMessage("");
      // Stop typing indicator
      sendTyping(false);
    } catch (error) {
      toast.error(error.message || "Failed to send message");
      console.error("Error sending message:", error);
    }
  };

  // Handle typing
  const handleTyping = (e) => {
    const text = e.target.value;
    setNewMessage(text);

    // Send typing indicator
    if (!typingTimeout && text.length > 0) {
      sendTyping(true);
    }

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set new timeout
    const newTimeout = setTimeout(() => {
      sendTyping(false);
      setTypingTimeout(null);
    }, 2000);

    setTypingTimeout(newTimeout);
  };

  const getOtherUser = (chat) => {
    if (!chat|| !chat.participants) return null;
    return chat.participants.find((p) => p._id !== user?._id) || chat.participants[0];
  };

  return (
    <div className="h-screen flex bg-white">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-xl font-bold">Messages</h2>
        </div>

        {/* Chats */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {chatsLoading || usersLoading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : (
            <>
              {/* Existing Chats */}
              {chats.length > 0 && (
                <div className="mb-4">
                  <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50">Recent Chats</h3>
                  {chats.map((chat) => {
                    const otherUser = getOtherUser(chat);
                    return (
                      <button
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition border-l-4 ${
                          selectedChat?._id === chat._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent"
                        }`}
                      >
                        <img
                          src={otherUser?.avatar ? (otherUser.avatar.startsWith('http') ? otherUser.avatar : `http://localhost:5000${otherUser.avatar}`) : "👤"}
                          alt={otherUser?.name}
                          className="w-10 h-10 rounded-full bg-gray-200 text-xl flex items-center justify-center"
                          onError={(e) => (e.target.textContent = "👤")}
                        />
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-semibold truncate">
                            {chat.isGroup ? chat.groupName : otherUser?.name}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {chat.lastMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* All Users */}
              <div>
                <h3 className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-50">All Users</h3>
                {allUsers
                  .filter((u) => u._id !== user?._id) // Exclude current user
                  .map((chatUser) => {
                    // Check if there's already a chat with this user
                    const existingChat = chats.find((chat) =>
                      !chat.isGroup && chat.participants.some((p) => p._id === chatUser._id)
                    );

                    return (
                      <button
                        key={chatUser._id}
                        onClick={async () => {
                          if (existingChat) {
                            setSelectedChat(existingChat);
                          } else {
                            // Start new chat
                            const newChat = await startChat(chatUser._id);
                            if (newChat) {
                              setSelectedChat(newChat);
                              refetchChats(); // Refresh chats list
                            }
                          }
                        }}
                        disabled={startingChat}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-gray-100 transition border-l-4 ${
                          selectedChat && !selectedChat.isGroup &&
                          getOtherUser(selectedChat)?._id === chatUser._id
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent"
                        }`}
                      >
                        <div className="relative">
                          <img
                            src={chatUser.avatar ? (chatUser.avatar.startsWith('http') ? chatUser.avatar : `http://localhost:5000${chatUser.avatar}`) : "👤"}
                            alt={chatUser.name}
                            className="w-10 h-10 rounded-full bg-gray-200 text-xl flex items-center justify-center"
                            onError={(e) => (e.target.textContent = "👤")}
                          />
                          {/* Online indicator */}
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className="font-semibold truncate">{chatUser.name}</p>
                          <p className="text-sm text-gray-600 truncate">
                            {existingChat ? "Tap to continue chat" : "Start new chat"}
                          </p>
                        </div>
                        {startingChat && (
                          <div className="text-blue-500 text-sm">Starting...</div>
                        )}
                      </button>
                    );
                  })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="border-b border-gray-200 p-4 flex items-center gap-3 bg-white sticky top-0">
            <img
              src={getOtherUser(selectedChat)?.avatar ? (getOtherUser(selectedChat).avatar.startsWith('http') ? getOtherUser(selectedChat).avatar : `http://localhost:5000${getOtherUser(selectedChat).avatar}`) : "👤"}
              alt={getOtherUser(selectedChat)?.name}
              className="w-10 h-10 rounded-full bg-gray-200 text-xl flex items-center justify-center"
              onError={(e) => (e.target.textContent = "👤")}
            />
            <div className="flex-1">
              <h3 className="font-semibold">
                {selectedChat.isGroup
                  ? selectedChat.groupName
                  : getOtherUser(selectedChat)?.name}
              </h3>
              <p className="text-sm text-green-500">Online</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messagesLoading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Start a conversation 💬</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`flex ${msg.sender?._id === user?._id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender?._id === user?._id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-gray-800"
                      }`}
                    >
                      {selectedChat.isGroup && msg.sender?._id !== user?._id && (
                        <p className="text-xs font-semibold mb-1 opacity-75">
                          {msg.sender?.name}
                        </p>
                      )}
                      <p className="break-words">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">
                      <p className="text-sm italic">
                        {getOtherUser(selectedChat)?.name} is typing...
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4 bg-white">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Type a message..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={messagesLoading}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || messagesLoading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
          <p className="text-lg">Select a conversation to start chatting 💬</p>
        </div>
      )}
    </div>
  );
};

export default Chat;