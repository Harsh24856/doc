import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

router.get("/:userId", auth, async (req, res) => {
  try {
  const myId = req.user.id;
  const otherId = req.params.userId;

    if (!otherId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Query messages between two users using or() filter
    // Format: (sender_id=myId AND receiver_id=otherId) OR (sender_id=otherId AND receiver_id=myId)
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .or(
        `and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`
    )
    .order("created_at", { ascending: true });

  if (error) {
      console.error("[Messages] Supabase error:", error);
    return res.status(500).json({ error: error.message });
  }

  res.json(
      (data || []).map((msg) => ({
      from: msg.sender_id === myId ? "me" : otherId,
        type: msg.type || "text",
        text: msg.content || "",
        file_url: msg.file_url || null,
        file_name: msg.file_name || null,
      created_at: msg.created_at,
    }))
  );
  } catch (err) {
    console.error("[Messages] Unexpected error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;