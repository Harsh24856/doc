import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import supabase from "../db.js";

export default function setupSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
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

    console.log("Socket connected:", myId);

    socket.on("send_message", async ({ to, text, type, file_url, file_name }) => {
      // Validate message
      if (!text && !file_url) return;
      if (text && text.length > 1000) return;

      try {
        // Insert message into database
        const { data, error } = await supabase.from("messages").insert({
          sender_id: myId,
          receiver_id: to,
          content: text || "",
          type: type || "text",
          file_url: file_url || null,
          file_name: file_name || null,
        }).select().single();

        if (error) {
          console.error("Error saving message:", error);
          // Still emit to sender for confirmation, but mark as error
          socket.emit("message_sent", {
            error: true,
            message: "Failed to save message",
          });
          return;
        }

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

        // Send message to receiver
        io.to(to).emit("receive_message", {
          from: myId,
          type: data.type || "text",
          text: data.content || "",
          file_url: data.file_url,
          file_name: data.file_name,
          created_at: data.created_at,
        });
      } catch (err) {
        console.error("Unexpected error in send_message:", err);
        socket.emit("message_sent", {
          error: true,
          message: "Failed to send message",
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", myId);
    });
  });
}