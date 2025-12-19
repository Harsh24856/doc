import express from "express";
import supabase from "../db.js";

const router = express.Router();

router.post("/submit", async (req, res) => {
  const { name, email, message } = req.body;

  const { error } = await supabase
    .from("feedback")
    .insert([{ name, email, message }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
});

export default router;