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
  console.warn("🔴 Socket.IO connection error:", error.message);
  // Don't show error to user if server is just not running
  if (error.message.includes("ECONNREFUSED") || error.message.includes("ERR_CONNECTION_REFUSED")) {
    console.warn("⚠️  Backend server may not be running on", API_BASE_URL);
  }
});

socket.on("connect", () => {
  console.log("🟢 Socket.IO connected to", API_BASE_URL);
});

socket.on("disconnect", (reason) => {
  console.log("🔴 Socket.IO disconnected:", reason);
});

export default socket;