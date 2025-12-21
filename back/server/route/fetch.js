import express from "express";
import supabase from "../db.js";

const router = express.Router();

router.get("/fetch", async (req, res) => {
  const { data, error } = await supabase
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;