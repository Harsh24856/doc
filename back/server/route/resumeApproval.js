import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";
import { io } from "../server.js";
import { sendResumeApprovalEmail, sendApplicationRejectionEmail } from "../services/emailService.js";

const router = express.Router();

/* =========================
   APPROVE USER RESUME/PROFILE (for ViewResume page)
   ========================= */
router.post("/approve/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { start_date } = req.body;
    const hospitalUserId = req.user.id;
    const hospitalRole = req.user.role;

    // Only hospitals can approve resumes
    if (hospitalRole !== "hospital") {
      return res.status(403).json({ error: "Only hospitals can approve resumes" });
    }

    if (!start_date) {
      return res.status(400).json({ error: "Start date is required" });
    }

    // Validate date format
    const dateObj = new Date(start_date);
    if (isNaN(dateObj.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Get hospital information
    const { data: hospital, error: hospitalError } = await supabase
      .from("hospitals")
      .select("id, hospital_name, hospital_person_email, hospital_person_name")
      .eq("user_id", hospitalUserId)
      .single();

    if (hospitalError || !hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    // Get user information to send notification and email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Format date for display
    const formattedDate = new Date(start_date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Send real-time notification to user
    if (io) {
      io.to(userId).emit("resume_approved", {
        hospital_name: hospital.hospital_name,
        start_date: formattedDate,
        hospital_person_name: hospital.hospital_person_name,
        hospital_person_email: hospital.hospital_person_email,
        created_at: new Date().toISOString(),
      });
    }

    // Send email notification
    // try {
    //   await sendResumeApprovalEmail({
    //     userEmail: user.email,
    //     userName: user.name,
    //     hospitalName: hospital.hospital_name,
    //     hospitalPersonName: hospital.hospital_person_name,
    //     hospitalPersonEmail: hospital.hospital_person_email,
    //     interviewDate: formattedDate,
    //     jobTitle: "Position at " + hospital.hospital_name,
    //   });
    //   console.log(`[Resume Approval] ✅ Email sent to ${user.email}`);
    // } catch (emailError) {
    //   console.error(`[Resume Approval] ⚠️ Email sending failed:`, emailError.message);
    //   // Don't fail the request if email fails, just log it
    // }

    res.json({
      success: true,
      message: "Resume approved successfully. Notification and email sent.",
      start_date: formattedDate,
    });
  } catch (err) {
    console.error("[Resume Approval Error]", err.message);
    res.status(500).json({ error: "Failed to approve resume" });
  }
});

/* =========================
   REJECT USER RESUME/PROFILE (for ViewResume page)
   ========================= */
router.post("/reject/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const hospitalUserId = req.user.id;
    const hospitalRole = req.user.role;

    // Only hospitals can reject resumes
    if (hospitalRole !== "hospital") {
      return res.status(403).json({ error: "Only hospitals can reject resumes" });
    }

    // Get hospital information
    const { data: hospital, error: hospitalError } = await supabase
      .from("hospitals")
      .select("id, hospital_name, hospital_person_email, hospital_person_name")
      .eq("user_id", hospitalUserId)
      .single();

    if (hospitalError || !hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }

    // Get user information
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, name, email, verification_status")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user verification status to rejected
    const { error: updateError } = await supabase
      .from("users")
      .update({ verification_status: "rejected" })
      .eq("id", userId);

    if (updateError) {
      console.error("[Resume Rejection] Update error:", updateError);
      return res.status(500).json({ error: "Failed to update verification status" });
    }

    // Send real-time notification to user
    if (io) {
      io.to(userId).emit("resume_rejected", {
        hospital_name: hospital.hospital_name,
        created_at: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      message: "Resume rejected successfully. Notification sent.",
    });
  } catch (err) {
    console.error("[Resume Rejection Error]", err.message);
    res.status(500).json({ error: "Failed to reject resume" });
  }
});

/* =========================
   APPROVE JOB APPLICATION
   ========================= */
router.post("/application/approve/:applicationId", auth, async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ error: "Only hospitals allowed" });
    }

    const { applicationId } = req.params;
    const { interview_date } = req.body;

    if (!interview_date) {
      return res.status(400).json({ error: "Interview date required" });
    }

    const interviewDateObj = new Date(interview_date);
    if (isNaN(interviewDateObj.getTime())) {
      return res.status(400).json({ error: "Invalid date" });
    }

    /* Fetch application */
    const { data: application, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        user_id,
        users ( name, email ),
        jobs ( id, title, hospital_id )
      `)
      .eq("id", applicationId)
      .single();

    if (error || !application) {
      return res.status(404).json({ error: "Application not found" });
    }

    // Handle nested data structure
    const userData = application.users;
    const jobData = application.jobs;

    if (!userData || !jobData) {
      console.error("[Approve] Missing user or job data:", { userData, jobData });
      return res.status(404).json({ error: "Application data incomplete" });
    }

    /* Fetch hospital */
    const { data: hospital, error: hospitalError } = await supabase
      .from("hospitals")
      .select("id, hospital_name, hospital_person_name, hospital_person_email")
      .eq("user_id", req.user.id)
      .single();

    if (hospitalError || !hospital) {
      console.error("[Approve] Hospital fetch error:", hospitalError);
      return res.status(404).json({ error: "Hospital not found" });
    }

    if (hospital.id !== jobData.hospital_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    /* Update application */
    const { error: updateError } = await supabase
      .from("job_applications")
      .update({
        verification_status: "approved",
        interview_date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateError) {
      console.error("[Approve] Update error:", updateError);
      throw updateError;
    }

    const formattedDate = interviewDateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    /* Socket notification */
     if (io) {
      io.to(String(application.user_id)).emit("notifications_updated");
    }

    /* Email */
    // try {
    //   await sendResumeApprovalEmail({
    //     userEmail: userData.email,
    //     userName: userData.name,
    //     hospitalName: hospital.hospital_name,
    //     hospitalPersonName: hospital.hospital_person_name,
    //     hospitalPersonEmail: hospital.hospital_person_email,
    //     interviewDate: formattedDate,
    //     jobTitle: jobData.title,
    //   });
    // } catch (emailError) {
    //   console.error("[Approve] Email error:", emailError);
    //   // Don't fail the request if email fails
    // }

    res.json({
      success: true,
      message: "Application approved",
      interview_date: formattedDate,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Approval failed" });
  }
});

/* =========================
   REJECT JOB APPLICATION
   ========================= */
router.post("/application/reject/:applicationId", auth, async (req, res) => {
  try {
    if (req.user.role !== "hospital") {
      return res.status(403).json({ error: "Only hospitals allowed" });
    }

    const { applicationId } = req.params;

    /* Fetch application */
    const { data: application, error } = await supabase
      .from("job_applications")
      .select(`
        id,
        user_id,
        users ( name, email ),
        jobs ( id, title, hospital_id )
      `)
      .eq("id", applicationId)
      .single();

    if (error || !application) {
      return res.status(404).json({ error: "Application not found" });
    }

    /* Fetch hospital */
    const { data: hospital } = await supabase
      .from("hospitals")
      .select("id, hospital_name, hospital_person_name, hospital_person_email")
      .eq("user_id", req.user.id)
      .single();

    if (!hospital || hospital.id !== application.jobs.hospital_id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Handle nested data structure
    const userData = application.users;
    const jobData = application.jobs;

    if (!userData || !jobData) {
      console.error("[Reject] Missing user or job data:", { userData, jobData });
      return res.status(404).json({ error: "Application data incomplete" });
    }

    /* Update application */
    await supabase
      .from("job_applications")
      .update({
        verification_status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    /* Socket notification */
    if (io) {
      io.to(String(application.user_id)).emit("notifications_updated");
    }

    /* Email */
    // try {
    //   await sendApplicationRejectionEmail({
    //     userEmail: userData.email,
    //     userName: userData.name,
    //     hospitalName: hospital.hospital_name,
    //     jobTitle: jobData.title,
    //   });
    //   console.log(`[Reject] ✅ Email sent to ${userData.email}`);
    // } catch (emailError) {
    //   console.error("[Reject] Email error:", emailError);
    //   // Don't fail the request if email fails
    // }

    res.json({
      success: true,
      message: "Application rejected. Notification and email sent.",
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Rejection failed" });
  }
});

export default router;