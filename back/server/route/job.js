import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

router.post("/jobs", auth, async (req, res) => {
  try {
    const user = req.user; 

    //  Only hospitals can post jobs
    if (user.role !== "hospital") {
      return res.status(403).json({
        message: "Only hospitals can post job openings",
      });
    }

    //  Fetch hospital & verify status
    const { data: hospital, error: hospitalError } = await supabase
      .from("hospitals")
      .select("id, verification_status")
      .eq("user_id", user.id)
      .single();

    if (hospitalError || !hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    if (hospital.verification_status !== "verified") {
      return res.status(403).json({
        message: "Hospital must be verified to post jobs",
      });
    }

    //  Validate input
    const {
      title,
      department,
      job_type,
      experience_required,
      min_salary,
      max_salary,
      description,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        message: "Job title and description are required",
      });
    }

    const allowedJobTypes = ["full-time", "part-time", "contract"];
    if (job_type && !allowedJobTypes.includes(job_type)) {
      return res.status(400).json({ message: "Invalid job type" });
    }

    //  Insert job
    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .insert({
        hospital_id: hospital.id,
        title,
        department,
        job_type,
        experience_required,
        min_salary,
        max_salary,
        description,
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    res.status(201).json({
      message: "Job posted successfully",
      job,
    });
  } catch (err) {
    console.error("JOB POST ERROR:", err.message);
    res.status(500).json({ message: "Failed to post job" });
  }
});

router.get(
  "/jobs/titles",
  auth,
  async (req, res) => {
    try {
      const user = req.user;

      // Only hospital users
      if (user.role !== "hospital") {
        return res.status(403).json({
          message: "Only hospitals can view their job titles",
        });
      }

      // Get hospital ID
      const { data: hospital, error: hospitalError } = await supabase
        .from("hospitals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (hospitalError || !hospital) {
        return res.status(404).json({
          message: "Hospital not found",
        });
      }

      // Fetch only job id + title
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title")
        .eq("hospital_id", hospital.id)
        .order("created_at", { ascending: false });

      if (jobsError) {
        throw jobsError;
      }

      res.json({
        jobs,
      });
    } catch (err) {
      console.error("FETCH JOB TITLES ERROR:", err.message);
      res.status(500).json({
        message: "Failed to fetch job titles",
      });
    }
  }
);

router.get(
  "/jobs/:jobId",
  async (req, res) => {
    try {
      const { jobId } = req.params;

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .select(`
          id,
          title,
          department,
          job_type,
          experience_required,
          min_salary,
          max_salary,
          description,
          hospital_id,
          created_at
        `)
        .eq("id", jobId)
        .single();

      if (jobError || !job) {
        return res.status(404).json({
          message: "Job not found",
        });
      }

      res.json({ job });
    } catch (err) {
      console.error("FETCH JOB DETAIL ERROR:", err.message);
      res.status(500).json({
        message: "Failed to fetch job details",
      });
    }
  }
);

router.patch(
  "/jobs/:jobId",
  auth,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const user = req.user;

      /*  Only hospitals can update jobs */
      if (user.role !== "hospital") {
        return res.status(403).json({
          message: "Only hospitals can update jobs",
        });
      }

      /*  Find hospital linked to this user */
      const { data: hospital, error: hospitalError } = await supabase
        .from("hospitals")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (hospitalError || !hospital) {
        return res.status(404).json({
          message: "Hospital not found",
        });
      }

      /*  Ensure job exists AND belongs to this hospital */
      const { data: existingJob, error: jobError } = await supabase
        .from("jobs")
        .select("id")
        .eq("id", jobId)
        .eq("hospital_id", hospital.id)
        .single();

      if (jobError || !existingJob) {
        return res.status(404).json({
          message: "Job not found or access denied",
        });
      }

      /*  Accept full formData (safe fields only) */
      const {
        title,
        department,
        job_type,
        experience_required,
        min_salary,
        max_salary,
        description,
      } = req.body;

      const updatePayload = {
        title,
        department,
        job_type,
        experience_required,
        min_salary,
        max_salary,
        description,
      };

      /*  Update job */
      const { data: updatedJob, error: updateError } = await supabase
        .from("jobs")
        .update(updatePayload)
        .eq("id", jobId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      /*  Respond */
      res.json({
        message: "Job updated successfully",
        job: updatedJob,
      });
    } catch (err) {
      console.error("UPDATE JOB ERROR:", err.message);
      res.status(500).json({
        message: "Failed to update job",
      });
    }
  }
);

router.get(
  "/jobs",
  async (req, res) => {
    try {
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("id, title, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      res.json({
        jobs,
      });
    } catch (err) {
      console.error("FETCH ALL JOBS ERROR:", err.message);
      res.status(500).json({
        message: "Failed to fetch jobs",
      });
    }
  }
);

router.get("/search", async (req, res) => {
  try {
    const {
      department,
      job_type,
      experience,
      min_salary,
      max_salary,
    } = req.query;

    // Base query — SAME SHAPE AS /jobs
    let query = supabase
      .from("jobs")
      .select("id, title, created_at");

    // Department search (PRIMARY)
    if (department) {
      query = query.ilike("department", `%${department}%`);
    }

    // Job type filter
    if (job_type) {
      query = query.eq("job_type", job_type);
    }

    // Experience filter
    if (experience) {
      query = query.ilike("experience_required", `%${experience}%`);
    }

    // Salary overlap filtering
    if (min_salary) {
  query = query.gte("min_salary", Number(min_salary));
}

if (max_salary) {
  query = query.lte("max_salary", Number(max_salary));
}

    // Order newest first
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ jobs: data });
  } catch (err) {
    console.error("JOB SEARCH ERROR:", err.message);
    res.status(500).json({
      message: "Failed to search jobs",
    });
  }
});




export default router;
