import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

router.get("/", auth, async (req, res) => {
  const myId = req.user.id;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, name")
    .neq("id", myId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

export default router;