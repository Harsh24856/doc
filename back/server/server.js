import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import test from "./route/test.js";
import fetchtest from "./route/fetch.js";
import authRoutes from "./route/auth.js";
import hospitalProfile from "./route/hospitalProfile.js"
import hospitalFetch from "./route/hospitalFetch.js"
import adminHospital from "./route/adminHospital.js"
import job from "./route/job.js"
import getStatus from "./route/getStatus.js"
import profileRoutes from "./route/profile.js";
import auth from "./middleware/auth.js";
import verificationRoutes from "./route/verification.js";
import adminRoutes from "./route/admin.js";
import verificationUpload from "./route/verificationUpload.js";
import hospitalDocuments from "./route/hospitalDocuments.js";

import usersRoutes from "./route/users.js";
import messagesRoutes from "./route/messages.routes.js";
import uploadRoutes from "./route/message_upload.js";
import newsRoutes from "./route/news.js";
import whoRoutes from "./route/who.js";
import searchRoutes from "./route/search.js";
import jobApplications from "./route/jobApplications.js";
import dashboardRoutes from "./route/dashboard.js";
import appliedRoutes from "./route/applied.js";
import notificationsRoutes from "./route/notifications.js";
import resumeApprovalRoutes from "./route/resumeApproval.js";

import supabase from "./db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------------- MIDDLEWARE ---------------- */
// CORS configuration - allow all origins in development, specific origins in production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        "http://localhost:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5173",
      ]
    : true, // Allow all origins in development (for network access)
    credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());

/* ---------------- ROUTES ---------------- */
app.use("/test", test);
app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.json({ message: "Server is running" });
});

app.get("/test-auth", auth, (req, res) => {
  res.json({ user: req.user });
});

app.use("/admin", fetchtest);
app.use("/hospital", hospitalProfile);
app.use("/hospital", hospitalFetch);
app.use("/hospital", hospitalDocuments);
app.use( job);
app.use("/admin", adminHospital);

app.use("/profile", profileRoutes);
app.use("/verification", verificationUpload);
app.use("/verification", verificationRoutes);
app.use("/admin", adminRoutes);
app.use("/applications", jobApplications);
app.use("/api", dashboardRoutes);
app.use("/jobs", appliedRoutes);
app.use("/notifications", notificationsRoutes);
app.use("/resume", resumeApprovalRoutes);
app.use("/applications", resumeApprovalRoutes);
app.use("/get-status", getStatus);

/*  CHAT ROUTES */
app.use("/users", usersRoutes);
app.use("/messages", messagesRoutes);
app.use("/chat", uploadRoutes);

/*  NEWS ROUTES */
app.use("/news", newsRoutes);
app.use("/who", whoRoutes);
app.use("/search", searchRoutes);

/* ---------------- ERROR HANDLER ---------------- */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);
  console.error("GLOBAL ERROR Stack:", err.stack);
  console.error("GLOBAL ERROR Path:", req.path);
  // Return appropriate status code based on error type
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({ error: err.message });
});

/* ---------------- SOCKET.IO ---------------- */
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:5174",
          "http://127.0.0.1:5173",
        ]
      : true, // Allow all origins in development (for network access)
    credentials: true,
  },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("Unauthorized"));

  try {
    socket.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new Error("Invalid token"));
  }
});

io.on("connection", (socket) => {
  const myId = socket.user.id;
  const myIdStr = String(myId);
  
  // Join room with both string and number formats to ensure compatibility
  socket.join(myIdStr);
  socket.join(String(Number(myId))); // Also join with numeric string
  
  console.log("🟢 Socket connected:", myId, "joined rooms:", [myIdStr, String(Number(myId))]);

  socket.on("send_message", async (msg) => {
    const { to, type, text, file_url, file_name } = msg;

    // Validate message
    if (!text && !file_url) {
      console.warn("Empty message rejected");
      return;
    }
    if (text && text.length > 1000) {
      console.warn("Message too long");
      return;
    }

    try {
      // Insert message into database
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: myId,
          receiver_id: to,
          type: type || "text",
          content: text || "",
          file_url: file_url || null,
          file_name: file_name || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving message:", error);
        socket.emit("message_sent", {
          error: true,
          message: "Failed to save message",
        });
        return;
      }

      console.log("Message saved:", data.id, "from", myId, "to", to);

      // Send confirmation to sender
      socket.emit("message_sent", {
        id: data.id,
        from: "me",
        type: data.type || "text",
        text: data.content || "",
        file_url: data.file_url,
        file_name: data.file_name,
        created_at: data.created_at,
      });

      // Send message to receiver - try both string and number formats
      const receiverRoomStr = String(to);
      const receiverRoomNum = String(Number(to));
      
      console.log("📤 Sending message to receiver. to:", to, "rooms:", receiverRoomStr, receiverRoomNum);
      console.log("📤 Connected sockets in rooms:", {
        [receiverRoomStr]: io.sockets.adapter.rooms.get(receiverRoomStr)?.size || 0,
        [receiverRoomNum]: io.sockets.adapter.rooms.get(receiverRoomNum)?.size || 0
      });
      
      const messagePayload = {
        id: data.id,
        from: myId,
        type: data.type || "text",
        text: data.content || "",
        file_url: data.file_url,
        file_name: data.file_name,
        created_at: data.created_at,
      };
      
      // Emit to both string and numeric room formats to ensure delivery
      io.to(receiverRoomStr).emit("receive_message", messagePayload);
      if (receiverRoomStr !== receiverRoomNum) {
        io.to(receiverRoomNum).emit("receive_message", messagePayload);
      }
      
      // Also broadcast to all OTHER connected sockets (fallback - client will filter)
      // This ensures delivery even if room matching fails
      socket.broadcast.emit("receive_message", messagePayload);

      console.log("✅ Message emitted to receiver");
    } catch (err) {
      console.error("Unexpected error in send_message:", err);
      socket.emit("message_sent", {
        error: true,
        message: "Failed to send message",
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", myId);
  });
});

// Export io for use in other modules (after initialization)
export { io };

/* ---------------- START ---------------- */
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});