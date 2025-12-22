import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import socket from "../socket/socket";
import ChatInput from "../components/ChatInput";
import MessageBubble from "../components/MessageBubble";
import API_BASE_URL from "../config/api.js";

export default function ChatPage() {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);

  // Load chat history
  useEffect(() => {
    if (!userId) return;
    
    axios
      .get(`${API_BASE_URL}/messages/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      })
      .then((res) => setMessages(res.data || []))
      .catch((error) => {
        console.error("Failed to load messages:", error);
        setMessages([]);
      });
  }, [userId]);

  // Realtime messages
  useEffect(() => {
    socket.on("receive_message", (msg) => {
      if (msg.from === userId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    return () => socket.off("receive_message");
  }, [userId]);

  const sendMessage = (payload) => {
    socket.emit("send_message", {
      to: userId,
      ...payload,
    });

    setMessages((prev) => [
      ...prev,
      { from: "me", ...payload },
    ]);
  };

  return (
    <div className="h-[90vh] max-w-xl mx-auto flex flex-col border">
      <div className="flex-1 p-3 overflow-y-auto">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
      </div>

      <ChatInput onSend={sendMessage} />
    </div>
  );
}