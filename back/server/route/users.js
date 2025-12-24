import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  try {
    const myId = req.user.id;

    // Get all unique conversation partners (users I've sent messages to or received from)
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("sender_id, receiver_id, content, created_at")
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order("created_at", { ascending: false });

    if (messagesError) {
      console.error("[Users] Error fetching messages:", messagesError);
      return res.status(500).json({ error: messagesError.message });
    }

    if (!messages || messages.length === 0) {
      return res.json([]);
    }

    // Get unique user IDs I've conversed with
    const conversationPartners = new Set();
    const lastMessages = {}; // userId -> last message
    const unreadCounts = {}; // userId -> unread count

    messages.forEach((msg) => {
      const partnerId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id;
      conversationPartners.add(partnerId);

      // Track last message for each conversation
      if (!lastMessages[partnerId] || new Date(msg.created_at) > new Date(lastMessages[partnerId].created_at)) {
        lastMessages[partnerId] = {
          content: msg.content || "",
          created_at: msg.created_at,
          isFromMe: msg.sender_id === myId,
        };
      }

      // Count unread messages (messages sent to me)
      // For now, count all messages received as unread (can be enhanced later with read tracking)
      if (msg.receiver_id === myId) {
        unreadCounts[partnerId] = (unreadCounts[partnerId] || 0) + 1;
      }
    });

    // Fetch user details for conversation partners
    const partnerIds = Array.from(conversationPartners);
    if (partnerIds.length === 0) {
      return res.json([]);
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, designation, specialization")
      .in("id", partnerIds);

    if (usersError) {
      console.error("[Users] Error fetching users:", usersError);
      return res.status(500).json({ error: usersError.message });
    }

    // Combine user data with conversation metadata
    const conversations = (users || []).map((user) => {
      const lastMsg = lastMessages[user.id];
      return {
        ...user,
        lastMessage: lastMsg?.content || null,
        isFromMe: lastMsg?.isFromMe || false,
        unreadCount: unreadCounts[user.id] || 0,
        lastMessageTime: lastMsg?.created_at || null,
      };
    });

    // Sort: unread messages first, then by last message time
    conversations.sort((a, b) => {
      // First sort by unread count (unread first)
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      
      // If both have unread or both don't, sort by last message time
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime) - new Date(a.lastMessageTime);
      }
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return 0;
    });

    res.json(conversations);
  } catch (err) {
    console.error("[Users] Unexpected error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;