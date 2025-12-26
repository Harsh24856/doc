import express from "express";
import supabase from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* =========================
   👥 GET JOB APPLICANTS (HOSPITAL ONLY)
   ========================= */
router.get("/:jobId/applicants", auth, async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Only hospitals can view applicants
    if (userRole !== "hospital") {
      return res.status(403).json({ message: "Only hospitals can view applicants" });
    }

    // 1️⃣ Get the hospital record for this user
    const { data: hospital, error: hospitalError } = await supabase
      .from("hospitals")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (hospitalError || !hospital) {
      console.error("[Applicants] Hospital not found for user:", userId);
      return res.status(404).json({ message: "Hospital not found" });
    }

    // 2️⃣ Verify job belongs to this hospital
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, hospital_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.hospital_id !== hospital.id) {
      console.error("[Applicants] Job doesn't belong to hospital. Job hospital_id:", job.hospital_id, "Hospital id:", hospital.id);
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 2️⃣ Fetch applicants
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        applied_at,
        users (
          id,
          name,
          designation,
          specialization,
          verification_status
        )
      `)
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false });

    if (error) {
      console.error("[Applicants] Error fetching applicants:", error);
      console.error("[Applicants] Error details:", JSON.stringify(error, null, 2));
      throw error;
    }

    // Map data to include verification_status from users table
    const applicantsWithStatus = (data || []).map(applicant => ({
      ...applicant,
      verification_status: applicant.users?.verification_status || "pending"
    }));

    res.json({
      applicants: applicantsWithStatus,
    });

  } catch (err) {
    console.error("[Applicants Fetch Error]", err.message);
    res.status(500).json({ message: "Failed to fetch applicants" });
  }
});

export default router;