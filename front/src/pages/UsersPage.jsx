import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { fetchUsers } from "../config/users";
import UserCard from "../components/UserCard";
import ChatInput from "../components/ChatInput";
import MessageBubble from "../components/MessageBubble";
import socket from "../socket/socket";
import API_BASE_URL from "../config/api.js";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const location = useLocation();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const loadUsers = () => {
    fetchUsers()
      .then(setUsers)
      .catch((error) => {
        // Suppress connection errors when server is not running
        if (error.code === "ERR_NETWORK" || error.message?.includes("ERR_CONNECTION_REFUSED")) {
          console.warn("⚠️  Backend server not available. Users list will be empty.");
        } else {
          console.error("Failed to load users:", error);
        }
        setUsers([]);
      });
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Refresh users list when returning to this page
  useEffect(() => {
    if (location.pathname === "/messages") {
      loadUsers();
    }
  }, [location.pathname]);

  // Refresh on window focus to update unread counts
  useEffect(() => {
    const handleFocus = () => {
      loadUsers();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  // Scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load chat history when user is selected
  useEffect(() => {
    if (!selectedUserId) {
      setMessages([]);
      return;
    }

    // Find selected user details
    const user = users.find(u => u.id === selectedUserId);
    setSelectedUser(user);

    // Load messages
    axios
      .get(`${API_BASE_URL}/messages/${selectedUserId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        setMessages(res.data || []);
        // Scroll to bottom after messages load
        setTimeout(scrollToBottom, 100);
      })
      .catch((error) => {
        // Suppress connection errors when server is not running
        if (error.code === "ERR_NETWORK" || error.message?.includes("ERR_CONNECTION_REFUSED")) {
          console.warn("⚠️  Backend server not available. Messages cannot be loaded.");
        } else {
          console.error("Failed to load messages:", error);
        }
        setMessages([]);
      });
  }, [selectedUserId, users]);

  // Realtime messages
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (msg.from === selectedUserId) {
        setMessages((prev) => [...prev, msg]);
        // Refresh users list to update unread counts
        loadUsers();
        // Scroll to bottom when new message arrives
        setTimeout(scrollToBottom, 100);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => socket.off("receive_message", handleReceiveMessage);
  }, [selectedUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = (payload) => {
    if (!selectedUserId) return;

    socket.emit("send_message", {
      to: selectedUserId,
      ...payload,
    });

    setMessages((prev) => [
      ...prev,
      { from: "me", ...payload },
    ]);

    // Scroll to bottom after sending message
    setTimeout(scrollToBottom, 100);

    // Refresh users list to update last message
    setTimeout(() => loadUsers(), 500);
  };

  const handleUserClick = (userId) => {
    setSelectedUserId(userId);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-gray-50 via-white to-gray-50 py-6 px-4">
      <div className="max-w-7xl mx-auto h-[calc(100vh-120px)] flex flex-col md:flex-row rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        {/* Left Sidebar - Users List */}
        <div className="w-full md:w-80 lg:w-96 bg-white flex flex-col border-r border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
                💬
              </div>
              <h2 className="text-2xl font-bold text-white">Messages</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {users.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">💬</div>
                <p className="text-gray-500 font-medium">No conversations yet</p>
                <p className="text-sm text-gray-400 mt-2">Start chatting with someone!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => handleUserClick(user.id)}
                    className={`rounded-2xl transition-all duration-300 ${
                      selectedUserId === user.id 
                        ? 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent)]/80 shadow-lg scale-[1.02]' 
                        : 'bg-gray-50 hover:bg-gray-100 hover:shadow-md'
                    }`}
                  >
                    <UserCard
                      user={user}
                      onClick={() => handleUserClick(user.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Chat Interface */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-white">
          {selectedUserId ? (
            <>
              {/* Chat Header */}
              <div className="bg-white border-b border-gray-200 p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] 
                               flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {selectedUser?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedUser?.name || selectedUser?.email || "Chat"}
                    </h3>
                    {selectedUser?.designation && (
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedUser.designation}
                        {selectedUser.specialization && ` • ${selectedUser.specialization}`}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-6 space-y-4"
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">💬</div>
                      <p className="text-lg font-semibold text-gray-600 mb-2">No messages yet</p>
                      <p className="text-sm text-gray-400">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, i) => (
                      <MessageBubble key={i} msg={msg} />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Input */}
              <div className="bg-white border-t border-gray-200 p-4">
                <ChatInput onSend={sendMessage} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-8xl mb-6">💬</div>
                <p className="text-2xl font-bold text-gray-800 mb-3">Select a conversation</p>
                <p className="text-gray-500">Choose a person from the list to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}