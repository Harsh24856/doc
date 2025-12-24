import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";
import supabaseAdmin from "../Admin.js";

const router = express.Router();

/* =========================
   ADMIN ONLY
   ========================= */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

/* =========================
   MEDICAL RESUME (GET & PUT)
   ========================= */
router.get("/medical-resume", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        role,
        phone,
        designation,
        specialization,
        registration_number,
        registration_council,
        year_of_graduation,
        years_of_experience,
        hospital_affiliation,
        qualifications,
        skills,
        bio,
        profile_completed
      `)
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Profile] Error fetching medical resume:", error.message);
      return res.status(500).json({ error: error.message });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("[Profile] Error in GET /medical-resume:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/medical-resume", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = { ...req.body };
    const shouldSubmit = updateData.submit === true;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.email;
    delete updateData.role;
    delete updateData.submit; // Remove submit flag from update data

    // Prepare update object
    const updateObject = { ...updateData };

    // Only set profile_completed if explicitly submitting
    if (shouldSubmit) {
      // Set profile_completed to true when user submits (just once)
      updateObject.profile_completed = true;
    }
    // If not submitting, don't change profile_completed (keep existing value)

    const { data, error } = await supabase
      .from("users")
      .update(updateObject)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("[Profile] Error updating medical resume:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("[Profile] Error in PUT /medical-resume:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   HELPERS
   ========================= */
const normalizeText = (v) =>
  String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeNumber = (v) =>
  String(v || "").replace(/\D/g, "");

/* =========================
   GET PENDING USERS
   ========================= */
router.get("/verifications/pending", auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      name,
      email,
      role,
      phone,
      designation,
      specialization,
      registration_number,
      registration_council,
      year_of_graduation,
      hospital_affiliation,
      qualifications,
      skills,
      bio,
      verification_status,
      license_doc_url,
      id_doc_url
    `)
    .eq("verification_status", "pending");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/* =========================
   PUBLIC PROFILE (No auth required)
   ========================= */
router.get("/public/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: user, error } = await supabase
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
        bio,
        profile_completed,
        verification_status
      `)
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Profile] Error fetching public profile:", error.message);
      return res.status(500).json({ error: error.message });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only return profile if it's completed
    if (!user.profile_completed) {
      return res.status(404).json({ error: "Profile not available" });
    }

    res.json(user);
  } catch (err) {
    console.error("[Profile] Error in GET /public/:userId:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   AI VERIFICATION (Removed - now handled by verification.js)
   ========================= */

export default router;