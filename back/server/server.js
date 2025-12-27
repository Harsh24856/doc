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

/* 🔥 CHAT ROUTES */
app.use("/users", usersRoutes);
app.use("/messages", messagesRoutes);
app.use("/chat", uploadRoutes);

/* 🔥 NEWS ROUTES */
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
  socket.join(myId);

  console.log("🟢 Socket connected:", myId);

  socket.on("send_message", async (msg) => {
    const { to, type, text, file_url, file_name } = msg;

    await supabase.from("messages").insert({
      sender_id: myId,
      receiver_id: to,
      type,
      content: text || "",
      file_url: file_url || null,
      file_name: file_name || null,
    });

    io.to(to).emit("receive_message", {
      from: myId,
      type,
      text,
      file_url,
      file_name,
      created_at: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", myId);
  });
});

// Export io for use in other modules (after initialization)
export { io };

/* ---------------- ERROR HANDLING ---------------- */
// Catch unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log the error
});

// Catch uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Don't exit the process, just log the error
});

/* ---------------- START ---------------- */
server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});