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
        .select(`
          id,
          hospital_name,
          hospital_type,
          registration_number_hospital,
          hospital_city,
          hospital_state,
          hospital_person_name,
          hospital_person_email,
          hospital_website,
          verification_status
        `)
        .eq("user_id", userId)
        .single();

      if (hospitalError) {
        console.error("[Dashboard] Error fetching hospital:", hospitalError);
        // If hospital doesn't exist, return empty jobs array
        return res.json({
          role,
          profile,
          hospital: null,
          postedJobs: [],
        });
      }

      if (!hospital) {
        return res.json({
          role,
          profile,
          hospital: null,
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

      // Count total applications and get application statuses for all jobs posted by this hospital
      let totalApplications = 0;
      let applicationStatuses = [];
      let applicationDates = []; // For monthly histogram
      if (postedJobs && postedJobs.length > 0) {
        const jobIds = postedJobs.map(job => job.id);
        const { count, error: appCountError } = await supabase
          .from("job_applications")
          .select("*", { count: "exact", head: true })
          .in("job_id", jobIds);

        if (!appCountError && count !== null) {
          totalApplications = count;
        }

        // Fetch application statuses and dates for charts
        const { data: applications, error: appStatusError } = await supabase
          .from("job_applications")
          .select("verification_status, created_at")
          .in("job_id", jobIds);

        if (!appStatusError && applications) {
          applicationStatuses = applications.map(app => app.verification_status || "pending");
          applicationDates = applications.map(app => app.created_at).filter(date => date);
        }
      }

      return res.json({
        role,
        profile,
        hospital,
        postedJobs: postedJobs || [],
        totalApplications,
        applicationStatuses, // For pie chart
        applicationDates,    // For monthly histogram
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
        verification_status,
        interview_date,
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