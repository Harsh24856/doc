import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import socket from "../socket/socket";
import ChatInput from "../components/ChatInput";
import MessageBubble from "../components/MessageBubble";
import API_BASE_URL from "../config/api.js";

export default function ChatPage() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const processedMessageIds = useRef(new Set()); // Track processed message IDs to prevent duplicates

  // Ensure socket is connected
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleConnect = () => {
      console.log("Socket connected in ChatPage");
      setSocketConnected(true);
    };

    const handleDisconnect = () => {
      console.log("Socket disconnected in ChatPage");
      setSocketConnected(false);
      // Try to reconnect
      if (localStorage.getItem("token")) {
        setTimeout(() => socket.connect(), 1000);
      }
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Set initial connection state
    setSocketConnected(socket.connected);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // Load chat history
  useEffect(() => {
    if (!userId) return;
    
    // Clear processed IDs when switching users
    processedMessageIds.current.clear();
    
    axios
      .get(`${API_BASE_URL}/messages/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => {
        const loadedMessages = res.data || [];
        // Mark all loaded messages as processed
        loadedMessages.forEach(msg => {
          const messageKey = msg.id || `${msg.text || msg.file_url}-${msg.created_at}`;
          processedMessageIds.current.add(messageKey);
        });
        setMessages(loadedMessages);
        // Scroll to bottom after loading
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      })
      .catch((error) => {
        console.error("Failed to load messages:", error);
        setMessages([]);
      });
  }, [userId]);

  // Realtime messages - set up listeners
  useEffect(() => {
    if (!userId) return;

    // Use refs to track handlers and prevent duplicate listeners
    const handlersRef = { receive: null, sent: null, connect: null };
    let isCleanedUp = false;

    const handleReceiveMessage = (msg) => {
      if (isCleanedUp) return;
      
      console.log("🔵 Received message event:", msg, "current userId:", userId);
      
      // Normalize IDs for comparison (handle both string and number)
      const msgFrom = msg.from ? String(msg.from) : null;
      const currentUserId = String(userId);
      
      // Also try numeric comparison
      const msgFromNum = msg.from ? Number(msg.from) : null;
      const userIdNum = Number(userId);
      
      // Handle messages from the other user
      if (msgFrom === currentUserId || msgFromNum === userIdNum) {
        // Create a unique key for duplicate detection
        const messageKey = msg.id || `${msg.text || msg.file_url}-${msg.created_at}`;
        
        // Check if we've already processed this message
        if (processedMessageIds.current.has(messageKey)) {
          console.log("⚠️ Duplicate message ignored (already processed):", messageKey);
          return;
        }
        
        setMessages((prev) => {
          // Double-check in state as well
          const exists = prev.some(
            (m) => {
              // Check by ID if available
              if (m.id && msg.id && m.id === msg.id) return true;
              // Check by content and timestamp
              if (m.text === msg.text && 
                  msg.created_at &&
                  m.created_at === msg.created_at &&
                  m.type === (msg.type || "text")) return true;
              // Check by file URL if it's a file message
              if (msg.file_url && m.file_url === msg.file_url && 
                  m.created_at === msg.created_at) return true;
              return false;
            }
          );
          if (exists) {
            console.log("⚠️ Duplicate message ignored (in state)");
            return prev;
          }
          
          // Mark as processed
          processedMessageIds.current.add(messageKey);
          console.log("➕ Adding new message from other user");
          return [...prev, { ...msg, from: userId }];
        });
      }
    };

    const handleMessageSent = (msg) => {
      if (isCleanedUp) return;
      
      console.log("✅ Message sent confirmation:", msg);
      
      // Handle confirmation of our own sent messages
      if (msg.error) {
        // Remove failed optimistic message
        setMessages((prev) => prev.filter(m => !m.pending));
        return;
      }

      // Create a unique key for duplicate detection
      const messageKey = msg.id || `${msg.text || msg.file_url}-${msg.created_at}`;
      
      // Check if we've already processed this confirmation
      if (processedMessageIds.current.has(`sent-${messageKey}`)) {
        console.log("⚠️ Duplicate message_sent event ignored:", messageKey);
        return;
      }
      
      setMessages((prev) => {
        // Find and replace optimistic message with confirmed one
        const optimisticIndex = prev.findIndex(
          (m) => m.from === "me" && m.pending && 
                 ((m.text && msg.text && m.text.trim() === msg.text.trim()) || 
                  (m.file_url && msg.file_url && m.file_url === msg.file_url))
        );
        
        if (optimisticIndex !== -1) {
          console.log("🔄 Replacing optimistic message");
          // Mark as processed
          processedMessageIds.current.add(`sent-${messageKey}`);
          // Replace optimistic message
          const newMessages = [...prev];
          newMessages[optimisticIndex] = {
            ...msg,
            from: "me",
            pending: false,
          };
          return newMessages;
        }
        
        // Check if message already exists (avoid duplicates) - use multiple checks
        const exists = prev.some(
          (m) => {
            // Check by ID if available
            if (m.id && msg.id && m.id === msg.id) return true;
            // Check by content and sender
            if (m.text === msg.text && m.from === "me" && !m.pending && 
                msg.created_at && m.created_at === msg.created_at) return true;
            // Check by file URL if it's a file message
            if (msg.file_url && m.file_url === msg.file_url && 
                m.from === "me" && !m.pending &&
                msg.created_at && m.created_at === msg.created_at) return true;
            return false;
          }
        );
        if (exists) {
          console.log("⚠️ Duplicate sent message ignored (in state)");
          return prev;
        }
        
        // Mark as processed
        processedMessageIds.current.add(`sent-${messageKey}`);
        console.log("➕ Adding new confirmed message");
        // Add new confirmed message
        return [...prev, { ...msg, from: "me", pending: false }];
      });
    };

    const setupListeners = () => {
      if (isCleanedUp) return;
      
      // Remove existing listeners first to prevent duplicates
      if (handlersRef.receive) {
        socket.off("receive_message", handlersRef.receive);
      }
      if (handlersRef.sent) {
        socket.off("message_sent", handlersRef.sent);
      }

      // Store handlers in ref
      handlersRef.receive = handleReceiveMessage;
      handlersRef.sent = handleMessageSent;

      // Set up listeners
      socket.on("receive_message", handleReceiveMessage);
      socket.on("message_sent", handleMessageSent);

      console.log("✅ Socket listeners set up for userId:", userId);
    };

    // Set up listeners when socket is connected
    if (socket.connected) {
      setupListeners();
    }

    // Also set up listeners when socket connects
    const onConnect = () => {
      if (isCleanedUp) return;
      console.log("Socket connected, setting up listeners");
      setupListeners();
    };

    handlersRef.connect = onConnect;
    socket.on("connect", onConnect);

    return () => {
      isCleanedUp = true;
      console.log("🧹 Cleaning up socket listeners");
      
      if (handlersRef.receive) {
        socket.off("receive_message", handlersRef.receive);
      }
      if (handlersRef.sent) {
        socket.off("message_sent", handlersRef.sent);
      }
      if (handlersRef.connect) {
        socket.off("connect", handlersRef.connect);
      }
    };
  }, [userId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (payload) => {
    // Ensure socket is connected before sending
    if (!socket.connected) {
      console.warn("Socket not connected, attempting to connect...");
      socket.connect();
      // Wait a bit for connection, then send
      setTimeout(() => {
        if (socket.connected) {
          sendMessageInternal(payload);
        } else {
          alert("Connection lost. Please check your internet connection.");
        }
      }, 500);
      return;
    }

    sendMessageInternal(payload);
  };

  const sendMessageInternal = (payload) => {
    // Create optimistic message with temporary ID
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      from: "me",
      ...payload,
      created_at: new Date().toISOString(),
      pending: true,
    };

    // Add optimistic message immediately
    setMessages((prev) => [...prev, optimisticMessage]);

    // Send via socket
    console.log("Emitting send_message:", { to: userId, ...payload });
    socket.emit("send_message", {
      to: userId,
      ...payload,
    });
  };

  return (
    <div className="h-screen max-h-screen flex flex-col bg-white">
      {/* Mobile-optimized header */}
      <div className="flex-shrink-0 px-4 py-3 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`} title={socketConnected ? 'Connected' : 'Disconnected'} />
            {!socketConnected && <span className="text-xs text-gray-500">Connecting...</span>}
          </div>
        </div>
      </div>

      {/* Messages container with proper mobile scrolling */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        style={{ 
          WebkitOverflowScrolling: "touch",
          minHeight: 0 // Important for flex scrolling on mobile
        }}
      >
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble 
              key={msg.id || msg.created_at || i} 
              msg={msg} 
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - fixed at bottom */}
      <div className="flex-shrink-0 border-t bg-white">
        <ChatInput onSend={sendMessage} />
      </div>
    </div>
  );
}