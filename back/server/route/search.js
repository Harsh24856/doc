import express from "express";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   🔍 SEARCH USERS AND HOSPITALS (AUTOCOMPLETE)
   ========================= */
router.get("/users", async (req, res) => {
  const q = req.query.q;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  const search = `%${q}%`;

  try {
    // Search users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        designation,
        specialization,
        hospital_affiliation,
        role
      `)
      .eq("profile_completed", true)
      .or(
        `name.ilike.${search},specialization.ilike.${search},hospital_affiliation.ilike.${search}`
      )
      .limit(10);

    if (usersError) {
      console.error("[Search Error] Users:", usersError.message);
    }

    // Search hospitals (by name, city, or state)
    const { data: hospitals, error: hospitalsError } = await supabase
      .from("hospitals")
      .select(`
        id,
        user_id,
        hospital_name,
        hospital_city,
        hospital_state,
        hospital_type
      `)
      .or(
        `hospital_name.ilike.${search},hospital_city.ilike.${search},hospital_state.ilike.${search}`
      )
      .limit(10);

    if (hospitalsError) {
      console.error("[Search Error] Hospitals:", hospitalsError.message);
    }

    // Combine results with type indicators
    const userResults = (users || []).map(user => ({
      ...user,
      type: "user"
    }));

    const hospitalResults = (hospitals || []).map(hospital => ({
      id: hospital.user_id || hospital.id, // Use user_id for navigation
      name: hospital.hospital_name,
      type: "hospital",
      location: `${hospital.hospital_city || ""}${hospital.hospital_city && hospital.hospital_state ? ", " : ""}${hospital.hospital_state || ""}`.trim(),
      hospital_type: hospital.hospital_type
    }));

    res.json([...userResults, ...hospitalResults]);

  } catch (err) {
    console.error("[Search Error]", err.message);
    return res.status(500).json({ error: "Search failed" });
  }
});

/* =========================
   🔍 SEARCH DOCTORS WITH FILTERS
   ========================= */
router.get("/doctors", async (req, res) => {
  const { name, department, council, registration_number } = req.query;

  try {
    let query = supabase
      .from("users")
      .select(`
        id,
        name,
        designation,
        specialization,
        registration_number,
        registration_council,
        hospital_affiliation,
        qualifications,
        verification_status,
        role
      `)
      .eq("profile_completed", true)
      .eq("role", "doctor");

    // Apply filters
    if (name) {
      query = query.ilike("name", `%${name}%`);
    }

    if (department) {
      query = query.ilike("specialization", `%${department}%`);
    }

    if (council) {
      query = query.ilike("registration_council", `%${council}%`);
    }

    if (registration_number) {
      query = query.ilike("registration_number", `%${registration_number}%`);
    }

    const { data: doctors, error } = await query.order("name", { ascending: true });

    if (error) {
      console.error("[Search Doctors Error]:", error.message);
      return res.status(500).json({ error: "Failed to search doctors" });
    }

    res.json({ doctors: doctors || [] });
  } catch (err) {
    console.error("[Search Doctors Error]:", err.message);
    return res.status(500).json({ error: "Search failed" });
  }
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