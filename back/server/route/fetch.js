import express from "express";
import supabaseAdmin from "../Admin.js";

const router = express.Router();

router.get("/fetch", async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from("feedback")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;