import express from "express";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   🔍 SEARCH USERS (AUTOCOMPLETE)
   ========================= */
router.get("/users", async (req, res) => {
  const q = req.query.q;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      name,
      designation,
      specialization
    `)
    .eq("profile_completed", true)
    .ilike("name", `%${q}%`)
    .limit(10);

  if (error) {
    console.error("[Search Error]", error.message);
    return res.status(500).json({ error: "Search failed" });
  }

  res.json(data);
});

/* =========================
   👤 PUBLIC PROFILE
   ========================= */
router.get("/profile/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      name,
      role,
      designation,
      specialization,
      hospital_affiliation,
      qualifications,
      skills,
      bio
    `)
    .eq("id", id)
    .eq("profile_completed", true)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Profile not found" });
  }

  res.json(data);
});

export default router;