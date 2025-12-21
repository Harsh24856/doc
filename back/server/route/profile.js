import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   UPDATE MEDICAL RESUME
   ========================= */
   router.put("/medical-resume", auth, async (req, res) => {
    const userId = req.user.id;
  
    const allowedFields = [
      "role",
      "name",
      
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
  
    const updates = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
  
    try {
      // 🔍 Fetch current role + profile status
      const { data: currentUser, error } = await supabase
        .from("users")
        .select("role, profile_completed")
        .eq("id", userId)
        .single();
  
      if (error) throw error;
  
      // 🚫 Block admin role
      if (updates.role === "admin") {
        delete updates.role;
      }
  
      // 🔒 Lock role after first completion
      if (updates.role && currentUser.profile_completed) {
        console.log("[Profile] Role change blocked after completion:", userId);
        delete updates.role;
      }
  
      const { error: updateError } = await supabase
        .from("users")
        .update({
          ...updates,
          profile_completed: true,
        })
        .eq("id", userId);
  
      if (updateError) throw updateError;
  
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