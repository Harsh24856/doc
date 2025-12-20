import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   UPDATE MEDICAL RESUME
   ========================= */
router.put("/medical-resume", auth, async (req, res) => {
  const userId = req.user.id;

  // 🔐 Allowed fields (role allowed ONCE)
  const allowedFields = [
    "role",
    "name",
    "email",
    "phone",
    "designation",
    "specialization",
    "registration_number",
    "years_of_experience",
    "hospital_affiliation",
    "qualifications",
    "skills",
    "bio",
  ];

  // 🛑 Filter request body
  const updates = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  try {
    // ❌ Never allow admin role from resume (security measure)
    if (updates.role === "admin") {
      console.log("[Profile] Attempt to set admin role blocked for user:", userId);
      delete updates.role;
    }

    const { error } = await supabase
      .from("users")
      .update({
        ...updates,
        profile_completed: true,
      })
      .eq("id", userId);

    if (error) throw error;

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET MEDICAL RESUME
   ========================= */
router.get("/medical-resume", auth, async (req, res) => {
  const userId = req.user.id;

  try {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        role,
        name,
        email,
        phone,
        designation,
        specialization,
        registration_number,
        years_of_experience,
        hospital_affiliation,
        qualifications,
        skills,
        bio,
        profile_completed
      `)
      .eq("id", userId)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error("Profile fetch error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;