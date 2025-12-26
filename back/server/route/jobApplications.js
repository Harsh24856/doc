import express from "express";
import supabase from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

/* =========================
   APPLY FOR A JOB
   ========================= */
router.post("/apply/:jobId", auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user.id;

    // 1️⃣ Check job exists
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return res.status(404).json({ error: "Job not found" });
    }

    // 2️⃣ Insert application (prevent duplicates via unique constraint)
    const { error } = await supabase
      .from("job_applications")
      .insert({
        job_id: jobId,
        user_id: userId,
      });

    if (error) {
      // Duplicate apply
      if (error.code === "23505") {
        return res
          .status(400)
          .json({ error: "You have already applied for this job" });
      }

      throw error;
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