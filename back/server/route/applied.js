import express from "express";
import supabase from "../db.js";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";

const router = express.Router();

/* =========================
   👥 GET JOB APPLICANTS (HOSPITAL THAT POSTED OR ADMIN)
   ========================= */
router.get("/:jobId/applicants", auth, async (req, res) => {
  const { jobId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Check if user is admin
    const isAdmin = userRole === "admin";
    
    // Only hospitals and admins can view applicants
    if (userRole !== "hospital" && !isAdmin) {
      return res.status(403).json({ message: "Only hospitals and admins can view applicants" });
    }

    // 2️⃣ Verify job exists and get hospital_id
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, hospital_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // If not admin, verify job belongs to this hospital
    if (!isAdmin) {
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

      if (job.hospital_id !== hospital.id) {
        console.error("[Applicants] Job doesn't belong to hospital. Job hospital_id:", job.hospital_id, "Hospital id:", hospital.id);
        return res.status(403).json({ message: "Unauthorized" });
      }
    }

    // 2️⃣ Fetch applicants
    const { data, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        applied_at,
        verification_status,
        interview_date,
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

    // Map data - use verification_status from job_applications, fallback to users table
    const applicantsWithStatus = (data || []).map(applicant => ({
      ...applicant,
      verification_status: applicant.verification_status || applicant.users?.verification_status || "pending"
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