import express from "express";
import supabase from "../db.js";
import auth from "../middleware/auth.js";
import { io } from "../server.js";

const router = express.Router();

/* =========================
   APPLY FOR A JOB
   ========================= */
router.post("/apply/:jobId", auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Check job exists and get hospital info
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(`
        id,
        title,
        hospital_id,
        hospitals!inner(
          id,
          user_id
        )
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 2️⃣ Get applicant info for notification
    const { data: applicant, error: applicantError } = await supabase
      .from("users")
      .select("id, name, designation, specialization")
      .eq("id", userId)
      .single();

    if (applicantError) {
      console.error("[Job Apply] Error fetching applicant:", applicantError);
    }

    // 3️⃣ Insert application (prevent duplicates via unique constraint)
    const { data: application, error } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      // Duplicate apply
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "You have already applied for this job" });
      }

      throw error;
    }

    // 4️⃣ Emit real-time notification to hospital via Socket.IO
    // The hospital user_id is in job.hospitals.user_id
    if (job.hospitals && job.hospitals.user_id) {
      const hospitalUserId = job.hospitals.user_id;
      
      // Emit notification to hospital
      if (io) {
        io.to(hospitalUserId).emit("new_job_application", {
          job_id: jobId,
          job_title: job.title,
          applicant_id: userId,
          applicant_name: applicant?.name || "Unknown",
          applicant_designation: applicant?.designation || "",
          applicant_specialization: applicant?.specialization || "",
          application_id: application.id,
          created_at: new Date().toISOString(),
        });
        
        console.log(`[Job Apply] ✅ Real-time notification sent to hospital user ${hospitalUserId} for job "${job.title}" from ${applicant?.name || 'Unknown'}`);
      } else {
        console.log(`[Job Apply] ⚠️ Socket.IO not available - notification not sent in real-time`);
      }
    }

    return res.json({
      success: true,
      message: "Job applied successfully",
    });

  } catch (err) {
    console.error("[Job Apply Error]", err.message);
    res.status(500).json({ error: "Failed to apply for job" });
  }
});

export default router;