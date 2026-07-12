import express from "express";
import supabase from "../db.js";
import latency from "../middleware/latency.js";
import redis from "../redis.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* SEARCH USERS AND HOSPITALS (AUTOCOMPLETE) */
router.get("/users", auth, async (req, res) => {
  const start = Date.now();

  const q = req.query.q;

  if (!q || q.length < 2) {
    return res.json([]);
  }

  const cacheKey = `users:search:${JSON.stringify(req.query)}`;

  try {
    // CHECK CACHE
    const cached = await redis.get(cacheKey);

    if (cached) {
      const end = Date.now();
      console.log("Cache HIT response time:", end - start, "ms");

      try {
        return res.json(JSON.parse(cached));
      } catch (parseErr) {
        console.log("Cache parse error, deleting key");
        await redis.del(cacheKey);
      }
    }

    const search = `%${q}%`;

    // USERS QUERY
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
      console.error("Users search error:", usersError.message);
    }

    // HOSPITAL QUERY
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
      console.error("Hospitals search error:", hospitalsError.message);
    }

    const userResults = (users || []).map(user => ({
      ...user,
      type: "user"
    }));

    const hospitalResults = (hospitals || []).map(hospital => ({
      id: hospital.user_id || hospital.id,
      name: hospital.hospital_name,
      type: "hospital",
      location: `${hospital.hospital_city || ""}${hospital.hospital_city && hospital.hospital_state ? ", " : ""}${hospital.hospital_state || ""}`.trim(),
      hospital_type: hospital.hospital_type
    }));

    const results = [...userResults, ...hospitalResults];

    // STORE CACHE
    await redis.set(cacheKey, JSON.stringify(results), { ex: 60 });

    const end = Date.now();
    console.log("Cache MISS response time:", end - start, "ms");

    return res.json(results);

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
  const orderedQuery = Object.keys(req.query)
  .sort()
  .reduce((acc, key) => {
    acc[key] = req.query[key];
    return acc;
  }, {});
  const cacheKey = `doctors:search:${JSON.stringify(orderedQuery)}`;
  const cached = await redis.get(cacheKey);
  if(cached){
    return res.json(cached);
  }
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
    await redis.set(cacheKey, { doctors: doctors || [] }, {ex : 60});
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
  const cacheKey = `profile:${JSON.stringify(id)}`;
  const cached = await redis.get(cacheKey);
  if(cached){
    return res.json(cached);
  }
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
  await redis.set(cacheKey, data, {ex : 120});
  res.json(data);
});

export default router;