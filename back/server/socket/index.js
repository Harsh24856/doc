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

    socket.on("send_message", async ({ to, text }) => {
      if (!text || text.length > 1000) return;

      await supabase.from("messages").insert({
        sender_id: myId,
        receiver_id: to,
        content: text,
      });

      io.to(to).emit("receive_message", {
        from: myId,
        text,
        created_at: new Date(),
      });
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", myId);
    });
  });
}