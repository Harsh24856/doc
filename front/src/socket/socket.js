import { io } from "socket.io-client";
import API_BASE_URL from "../config/api.js";

const socket = io(API_BASE_URL, {
  auth: {
    token: localStorage.getItem("token"),
  },
  autoConnect: false, // Don't auto-connect, wait for explicit connection
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  timeout: 10000,
});

// Only connect if user is authenticated
const token = localStorage.getItem("token");
if (token) {
  socket.connect();
}

// Handle connection errors gracefully
socket.on("connect_error", (error) => {
  // Suppress connection refused errors (server not running) - only log once
  if (error.message.includes("ECONNREFUSED") || 
      error.message.includes("ERR_CONNECTION_REFUSED") ||
      error.message.includes("xhr poll error")) {
    // Only log once to avoid spam
    if (!socket._connectionRefusedLogged) {
      console.warn("⚠️  Backend server not available. Socket.IO will retry automatically.");
      socket._connectionRefusedLogged = true;
    }
    return; // Don't log the full error
  }
  console.warn("🔴 Socket.IO connection error:", error.message);
});

socket.on("connect", () => {
  console.log("🟢 Socket.IO connected to", API_BASE_URL);
  // Reset the flag when successfully connected
  socket._connectionRefusedLogged = false;
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket.IO disconnected:", reason);
});

export default socket;