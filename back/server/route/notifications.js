import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

/* GET NOTIFICATIONS */
router.get("/", auth, async (req, res) => {
  try {
    const notifications = [];
    const userId = req.user.id;
    const role = req.user.role;

    /*  READ COUNT */
    const { data: userMeta, error: userMetaError } = await supabase
      .from("users")
      .select("notifications_read_count")
      .eq("id", userId)
      .single();

    const readCount = userMetaError
      ? 0
      : userMeta?.notifications_read_count || 0;

    /*  HOSPITAL VERIFICATION  */
    if (role === "hospital") {
      const { data: hospital } = await supabase
        .from("hospitals")
        .select("id, verification_status, rejection_reason, updated_at")
        .eq("user_id", userId)
        .single();

      if (hospital) {
        if (hospital.verification_status === "verified") {
          notifications.push({
            id: `hospital-verified-${hospital.id}`,
            type: "verification",
            title: "Hospital Verified",
            message: "Your hospital profile has been successfully verified.",
            link: "/hospital-profile",
            read: false,
            created_at: hospital.updated_at,
          });
        }

        if (hospital.verification_status === "rejected") {
          notifications.push({
            id: `hospital-rejected-${hospital.id}`,
            type: "verification",
            title: "Hospital Verification Rejected",
            message: hospital.rejection_reason
              ? `Reason: ${hospital.rejection_reason}`
              : "Your hospital profile was rejected. Please review and resubmit.",
            link: "/hospital-profile",
            read: false,
            created_at: hospital.updated_at,
          });
        }
      }
    }

    /*  DOCTOR / USER VERIFICATION */
    if (role === "user" || role === "doctor") {
      const { data: doctor } = await supabase
        .from("users")
        .select("id, verification_status, rejection_reason, updated_at")
        .eq("id", userId)
        .single();

      if (doctor) {
        if (doctor.verification_status === "approved") {
          notifications.push({
            id: `doctor-verified-${doctor.id}`,
            type: "verification",
            title: "Verification Approved",
            message: "Your doctor profile has been successfully verified.",
            link: "/profile",
            read: false,
            created_at: doctor.updated_at,
          });
        }

        if (doctor.verification_status === "rejected") {
          notifications.push({
            id: `doctor-rejected-${doctor.id}`,
            type: "verification",
            title: "Verification Rejected",
            message: doctor.rejection_reason
              ? `Reason: ${doctor.rejection_reason}`
              : "Your verification was rejected. Please review and resubmit.",
            link: "/profile",
            read: false,
            created_at: doctor.updated_at,
          });
        }
      }

      /* JOB APPLICATION UPDATES */
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
        .order("created_at", { ascending: false });

      applications?.forEach((app) => {
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
            message: `Your application for "${
              app.jobs?.title || "job"
            }" has been approved! Interview date: ${interviewDate}`,
            link: `/jobs/view/${app.jobs?.id || ""}`,
            read: false,
            created_at: app.created_at,
          });
        }

        if (app.verification_status === "rejected") {
          notifications.push({
            id: `job-rejected-${app.id}`,
            type: "job",
            title: "Application Rejected",
            message: `Your application for "${
              app.jobs?.title || "job"
            }" has been rejected.`,
            link: `/jobs/view/${app.jobs?.id || ""}`,
            read: false,
            created_at: app.created_at,
          });
        }
      });
    }

    /* SORT */
    notifications.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    /*  UNREAD COUNT */
    const totalCount = notifications.length;
    const safeRead = Math.min(readCount, totalCount);
    const unread_count = totalCount - safeRead;


    /* RESPONSE */
    res.json({
      notifications,
      unread_count,
    });
  } catch (err) {
    console.error("[Notifications] Error:", err.message);
    res.status(500).json({
      notifications: [],
      unread_count: 0,
      error: "Failed to fetch notifications",
    });
  }
});

router.post("/mark-read", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let totalCount = 0;

    /*  HOSPITAL VERIFICATION  */
    if (role === "hospital") {
      const { data: hospital } = await supabase
        .from("hospitals")
        .select("verification_status")
        .eq("user_id", userId)
        .single();

      if (
        hospital &&
        (hospital.verification_status === "verified" ||
          hospital.verification_status === "rejected")
      ) {
        totalCount += 1;
      }
    }

    /* DOCTOR / USER VERIFICATION */
    if (role === "user" || role === "doctor") {
      const { data: doctor } = await supabase
        .from("users")
        .select("verification_status")
        .eq("id", userId)
        .single();

      if (
        doctor &&
        (doctor.verification_status === "approved" ||
          doctor.verification_status === "rejected")
      ) {
        totalCount += 1;
      }

      /*  JOB APPLICATION UPDATES */
      const { count: jobCount } = await supabase
        .from("job_applications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("verification_status", ["approved", "rejected"]);

      totalCount += jobCount || 0;
    }

    /*  UPDATE READ COUNT  */
    const { error } = await supabase
      .from("users")
      .update({ notifications_read_count: totalCount })
      .eq("id", userId);

    if (error) throw error;

    res.json({
      success: true,
      read_count: totalCount,
    });
  } catch (err) {
    console.error("[Notifications] mark-read error:", err.message);
    res.status(500).json({
      success: false,
      error: "Failed to mark notifications as read",
    });
  }
});


export default router;
