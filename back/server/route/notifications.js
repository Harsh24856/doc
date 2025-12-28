import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   GET NOTIFICATIONS
   ========================= */
router.get("/", auth, async (req, res) => {
  try {
    const notifications = [];
    // console.log("REQ USER:", req.user);
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "hospital") {
       const { data: hospital, error: hospitalError } = await supabase
       .from("hospitals")
       .select("id, verification_status, rejection_reason, updated_at")
  .eq("user_id", userId)
  .single();

if (!hospitalError && hospital) {
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

    if (role === "user" || role === "doctor") {
      const { data: applications, error } = await supabase
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

      if (error) {
        console.error("[Notifications] Error fetching applications:", error.message);
        return res.json({
          notifications: [],
          unread_count: 0,
        });
      }

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
            message: `Your application for "${app.jobs?.title || "job"}" has been approved! Interview date: ${interviewDate}`,
            link: `/jobs/view/${app.jobs?.id || ""}`,
            read: false,
            created_at: app.created_at || new Date().toISOString(),
          });
        } else if (app.verification_status === "rejected") {
          notifications.push({
            id: `job-rejected-${app.id}`,
            type: "job",
            title: "Application Rejected",
            message: `Your application for "${app.jobs?.title || "job"}" has been rejected.`,
            link: `/jobs/view/${app.jobs?.id || ""}`,
            read: false,
            created_at: app.created_at || new Date().toISOString(),
          });
        }
      });
    }
    notifications.sort(
       (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    res.json({
      notifications,
    });
  } catch (err) {
    console.error("[Notifications] Error in GET /:", err.message);
    res.status(500).json({
      notifications: [],
      unread_count: 0,
      error: "Failed to fetch notifications",
    });
  }
});

/* =========================
   GET UNREAD COUNT
   ========================= */
// router.get("/unread-count", auth, async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const role = req.user.role;
//     let unreadCount = 0;

//     if (role === "user" || role === "doctor") {
//       // Count approved/rejected applications (these are notifications)
//       const { data: applications } = await supabase
//         .from("job_applications")
//         .select("id, verification_status")
//         .eq("user_id", userId)
//         .in("verification_status", ["approved", "rejected"]);

//       unreadCount = applications?.length || 0;
//     } else if (role === "hospital") {
//       // For hospitals, count recent job applications
//       const { data: hospital } = await supabase
//         .from("hospitals")
//         .select("id")
//         .eq("user_id", userId)
//         .single();

//       if (hospital) {
//         const { data: jobs } = await supabase
//           .from("jobs")
//           .select("id")
//           .eq("hospital_id", hospital.id);

//         if (jobs && jobs.length > 0) {
//           const jobIds = jobs.map(j => j.id);
//           const sevenDaysAgo = new Date();
//           sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//           const { data: applications } = await supabase
//             .from("job_applications")
//             .select("id")
//             .in("job_id", jobIds)
//             .gte("created_at", sevenDaysAgo.toISOString());

//           unreadCount = applications?.length || 0;
//         }
//       }
//     }

//     res.json({ count: unreadCount });
//   } catch (err) {
//     console.error("[Notifications] Error fetching unread count:", err.message);
//     res.json({ count: 0 });
//   }
// });

export default router;