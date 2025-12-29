import { io } from "socket.io-client";
import API_BASE_URL from "../config/api.js";

const socket = io(API_BASE_URL, {
  auth: {
    token: localStorage.getItem("token"),
  },
  autoConnect: true, // Auto-connect when socket is created
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: Infinity, // Keep trying to reconnect
  timeout: 20000,
  transports: ["websocket", "polling"], // Try both transports
});

// Update auth token when it changes
const updateAuth = () => {
  const token = localStorage.getItem("token");
  if (token) {
    socket.auth = { token };
    if (!socket.connected) {
      socket.connect();
    }
  } else {
    socket.disconnect();
  }
};

// Listen for storage changes (in case token is updated in another tab)
window.addEventListener("storage", (e) => {
  if (e.key === "token") {
    updateAuth();
  }
});

// Handle connection errors gracefully
socket.on("connect_error", (error) => {
  console.warn("🔴 Socket.IO connection error:", error.message);
  // Don't show error to user if server is just not running
  if (error.message.includes("ECONNREFUSED") || error.message.includes("ERR_CONNECTION_REFUSED")) {
    console.warn("⚠️  Backend server may not be running on", API_BASE_URL);
  }
});

socket.on("connect", () => {
  console.log("🟢 Socket.IO connected to", API_BASE_URL);
  // Update auth token on reconnect
  updateAuth();
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket.IO disconnected:", reason);
  // Auto-reconnect unless it's a manual disconnect
  if (reason === "io server disconnect") {
    // Server disconnected the socket, reconnect manually
    socket.connect();
  }
});

socket.on("reconnect", (attemptNumber) => {
  console.log("🟢 Socket.IO reconnected after", attemptNumber, "attempts");
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log("🔄 Socket.IO reconnection attempt", attemptNumber);
});

socket.on("reconnect_error", (error) => {
  console.warn("⚠️  Socket.IO reconnection error:", error.message);
});

socket.on("reconnect_failed", () => {
  console.error("❌ Socket.IO reconnection failed");
});

export default socket;