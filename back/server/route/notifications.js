import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   GET NOTIFICATIONS
   ========================= */
router.get("/", auth, async (req, res) => {
  const notifications = [];
  const userId = req.user.id;
  const role = req.user.role;

  if (role === "user" || role === "doctor") {
    const { data: applications } = await supabase
      .from("job_applications")
      .select(`
        id,
        interview_date,
        verification_status,
        created_at,
        jobs ( id, title )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    applications?.forEach(app => {
      if (app.verification_status === "approved") {
        const interviewDate = app.interview_date 
          ? new Date(app.interview_date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "TBD";
        notifications.push({
          id: `job-approved-${app.id}`,
          type: "job",
          title: "Application Approved",
          message: `Your application for "${app.jobs.title}" has been approved! Interview date: ${interviewDate}`,
          link: `/jobs/view/${app.jobs.id}`,
          read: false,
          created_at: app.created_at || new Date().toISOString(),
        });
      } else if (app.verification_status === "rejected") {
        notifications.push({
          id: `job-rejected-${app.id}`,
          type: "job",
          title: "Application Rejected",
          message: `Your application for "${app.jobs.title}" has been rejected.`,
          link: `/jobs/view/${app.jobs.id}`,
          read: false,
          created_at: app.created_at || new Date().toISOString(),
        });
      }
    });
  }

  res.json({
    notifications,
    unread_count: notifications.length,
  });
});

/* =========================
   GET UNREAD COUNT
   ========================= */
router.get("/unread-count", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    let unreadCount = 0;

    if (role === "user" || role === "doctor") {
      // Count approved/rejected applications (these are notifications)
      const { data: applications } = await supabase
        .from("job_applications")
        .select("id, verification_status")
        .eq("user_id", userId)
        .in("verification_status", ["approved", "rejected"]);

      unreadCount = applications?.length || 0;
    } else if (role === "hospital") {
      // For hospitals, count recent job applications
      const { data: hospital } = await supabase
        .from("hospitals")
        .select("id")
        .eq("user_id", userId)
        .single();

      if (hospital) {
        const { data: jobs } = await supabase
          .from("jobs")
          .select("id")
          .eq("hospital_id", hospital.id);

        if (jobs && jobs.length > 0) {
          const jobIds = jobs.map(j => j.id);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

          const { data: applications } = await supabase
            .from("job_applications")
            .select("id")
            .in("job_id", jobIds)
            .gte("created_at", sevenDaysAgo.toISOString());

          unreadCount = applications?.length || 0;
        }
      }
    }

    res.json({ count: unreadCount });
  } catch (err) {
    console.error("[Notifications] Error fetching unread count:", err.message);
    res.json({ count: 0 });
  }
});

export default router;