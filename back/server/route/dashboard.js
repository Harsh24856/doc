import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   📊 DASHBOARD
   ========================= */
router.get("/dashboard", auth, async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    /* =========================
       👤 PROFILE DATA (COMMON)
       ========================= */
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        role,
        phone,
        designation,
        specialization,
        hospital_affiliation,
        years_of_experience,
        bio,
        profile_completed
      `)
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    /* =========================
       🏥 HOSPITAL → POSTED JOBS
       ========================= */
    if (role === "hospital") {
      // First, get the hospital record for this user
      const { data: hospital, error: hospitalError } = await supabase
        .from("hospitals")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (hospitalError) {
        console.error("[Dashboard] Error fetching hospital:", hospitalError);
        // If hospital doesn't exist, return empty jobs array
        return res.json({
          role,
          profile,
          postedJobs: [],
        });
      }

      if (!hospital) {
        return res.json({
          role,
          profile,
          postedJobs: [],
        });
      }

      // Then, get jobs for this hospital
      const { data: postedJobs, error } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          department,
          job_type,
          created_at
        `)
        .eq("hospital_id", hospital.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[Dashboard] Error fetching posted jobs:", error);
        throw error;
      }

      return res.json({
        role,
        profile,
        postedJobs: postedJobs || [],
      });
    }

    /* =========================
       👨‍⚕️ USER / DOCTOR → APPLIED JOBS
       ========================= */
    const { data: appliedJobs, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        created_at,
        jobs (
          id,
          title,
          department,
          job_type,
          min_salary,
          max_salary
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      role,
      profile,
      appliedJobs,
    });

  } catch (err) {
    console.error("[Dashboard Error]", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;