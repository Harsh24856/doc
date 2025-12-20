import express from "express";
import supabase from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/fetch", auth, async (req, res) => {
  const hospitalId = req.user.id;

  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
      hospital_name,
      hospital_type,
      registration_number_hospital,
      hospital_city,
      hospital_state,
      hospital_person_name,
      hospital_person_email,
      hospital_website
    `)

      .eq("id", hospitalId)
      .eq("role", "hospital")
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
