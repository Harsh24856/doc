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

      // Fetch job id, title, and department
      const { data: jobs, error: jobsError } = await supabase
        .from("jobs")
        .select("id, title, department")
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

      // Fetch hospital information including city
      if (job.hospital_id) {
        const { data: hospital, error: hospitalError } = await supabase
          .from("hospitals")
          .select("hospital_name, hospital_city, hospital_state")
          .eq("id", job.hospital_id)
          .single();

        if (!hospitalError && hospital) {
          job.hospital = {
            name: hospital.hospital_name,
            city: hospital.hospital_city,
            state: hospital.hospital_state,
          };
        }
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
      city,
    } = req.query;

    /* BASE JOB QUERY */
    let query = supabase
      .from("jobs")
      .select(
        "id, title, department, min_salary, max_salary, experience_required, created_at, hospital_id"
      );

    // Department 
    if (department) {
      query = query.ilike("department", `%${department}%`);
    }

    // Job type
    if (job_type) {
      query = query.eq("job_type", job_type);
    }

    // Experience: job requires <= user experience
    if (experience) {
      query = query.lte("experience_required", Number(experience));
    }

    // Salary filters
    if (min_salary) {
      query = query.gte("min_salary", Number(min_salary));
    }

    if (max_salary) {
      query = query.lte("max_salary", Number(max_salary));
    }

    //  NO ordering here
    const { data: jobsData, error } = await query;

    if (error) throw error;

    if (!jobsData || jobsData.length === 0) {
      return res.json({ jobs: [] });
    }

    /* FETCH HOSPITAL INFO */
    const hospitalIds = [
      ...new Set(jobsData.map(j => j.hospital_id).filter(Boolean)),
    ];

    let hospitalsMap = {};

    if (hospitalIds.length > 0) {
      let hospitalQuery = supabase
        .from("hospitals")
        .select("id, hospital_name, hospital_city, hospital_state")
        .in("id", hospitalIds);

      const { data: hospitals, error: hospitalError } = await hospitalQuery;

      if (!hospitalError && hospitals) {
        hospitals.forEach(h => {
          hospitalsMap[h.id] = {
            name: h.hospital_name,
            city: h.hospital_city,
            state: h.hospital_state,
          };
        });
      }
    }

    /* MERGE + CITY FILTER */
    let jobs = jobsData
  .map(job => ({
    id: job.id,
    title: job.title,
    min_salary: job.min_salary,
    max_salary: job.max_salary,
    experience_required: job.experience_required,
    created_at: job.created_at,
    hospital: hospitalsMap[job.hospital_id] || null,
  }))
  .filter(job => {
    if (city && city.trim()) {
      return (
        job.hospital &&
        job.hospital.city &&
        job.hospital.city
          .toLowerCase()
          .includes(city.toLowerCase().trim())
      );
    }
    return true;
  });


    /*CITY RELEVANCE SORT */
    
      const searchCity = city?.toLowerCase().trim() || null;

      jobs.sort((a, b) => {
  /*  MIN salary (higher first) */
  if ((b.min_salary ?? 0) !== (a.min_salary ?? 0)) {
    return (b.min_salary ?? 0) - (a.min_salary ?? 0);
  }

  /*  MAX salary (higher first) */
  if ((b.max_salary ?? 0) !== (a.max_salary ?? 0)) {
    return (b.max_salary ?? 0) - (a.max_salary ?? 0);
  }

  /*  EXPERIENCE required (higher first) */
  if ((b.experience_required ?? 0) !== (a.experience_required ?? 0)) {
    return (b.experience_required ?? 0) - (a.experience_required ?? 0);
  }

  /*  CITY relevance */
  if (searchCity) {
    const cityA = (a.hospital?.city || "").toLowerCase();
    const cityB = (b.hospital?.city || "").toLowerCase();

    // Exact match
    if (cityA === searchCity && cityB !== searchCity) return -1;
    if (cityA !== searchCity && cityB === searchCity) return 1;

    // Starts with
    if (cityA.startsWith(searchCity) && !cityB.startsWith(searchCity)) return -1;
    if (!cityA.startsWith(searchCity) && cityB.startsWith(searchCity)) return 1;

    // Contains
    if (cityA.includes(searchCity) && !cityB.includes(searchCity)) return -1;
    if (!cityA.includes(searchCity) && cityB.includes(searchCity)) return 1;
  }

  /*  FINAL → newest first */
  return new Date(b.created_at) - new Date(a.created_at);
});
    return res.json({ jobs });
  } catch (err) {
    console.error("JOB SEARCH ERROR:", err);
    return res.status(500).json({
      message: "Failed to search jobs",
    });
  }
});


/* DELETE JOB */
router.delete(
  "/jobs/:jobId",
  auth,
  async (req, res) => {
    try {
      const { jobId } = req.params;
      const user = req.user;

      /*  Only hospitals can delete jobs */
      if (user.role !== "hospital") {
        return res.status(403).json({
          message: "Only hospitals can delete jobs",
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

      /*  Delete job */
      const { error: deleteError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", jobId);

      if (deleteError) {
        throw deleteError;
      }

      /*  Respond */
      res.json({
        message: "Job deleted successfully",
      });
    } catch (err) {
      console.error("DELETE JOB ERROR:", err.message);
      res.status(500).json({
        message: "Failed to delete job",
      });
    }
  }
);

export default router;
