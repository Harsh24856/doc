import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";
import supabaseAdmin from "../Admin.js";
import verificationRoutes from "./verification.js";
import { io } from "../server.js";

const router = express.Router();

/* =========================
   ADMIN ONLY
   ========================= */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

/* =========================
   GET PENDING USERS
   ========================= */
router.get("/verifications/pending", auth, adminOnly, async (req, res) => {
  console.log("[Admin] 📋 Fetching pending verifications");
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
      role,
        registration_number,
        registration_council,
        year_of_graduation,
        verification_status,
      license_doc_url,
      id_doc_url
      `)
      .eq("verification_status", "pending");

  if (error) {
    console.error("[Admin] ❌ Error fetching pending:", error.message);
    return res.status(500).json({ error: error.message });
  }
  console.log(`[Admin] ✅ Found ${data?.length || 0} pending verifications`);
  res.json(data);
});

/* =========================
   GET DOCUMENT (SIGNED URL)
   ========================= */
router.get(
  "/verifications/:userId/document/:type",
  auth,
  adminOnly,
  async (req, res) => {
      const { userId, type } = req.params;
    console.log(`[Admin] 📄 Getting ${type} document for user: ${userId}`);

      if (!["license", "id"].includes(type)) {
      console.error(`[Admin] ❌ Invalid document type: ${type}`);
        return res.status(400).json({ error: "Invalid document type" });
      }

    const { data: user } = await supabase
        .from("users")
        .select(`${type}_doc_url`)
        .eq("id", userId)
        .single();

    if (!user || !user[`${type}_doc_url`]) {
      console.error(`[Admin] ❌ Document not found for user ${userId}, type: ${type}`);
      return res.status(404).json({ error: "Document not found" });
      }

    let path = user[`${type}_doc_url`];
    if (path.startsWith("http")) {
      path = path.split("/storage/v1/object/")[1]?.split("?")[0];
      }

    const { data, error } =
        await supabaseAdmin.storage
          .from("verification-docs")
        .createSignedUrl(path, 3600);

    if (error) {
      console.error(`[Admin] ❌ Error creating signed URL:`, error.message);
      return res.status(500).json({ error: error.message });
      }
    console.log(`[Admin] ✅ Signed URL created for ${type} document`);
    res.json({ url: data.signedUrl });
  }
);

/* =========================
   AI VERIFICATION (Delegates to verification.js)
   ========================= */
router.use("/verifications", verificationRoutes);

/* =========================
   APPROVE / REJECT
   ========================= */
router.post(
  "/verifications/:userId/:action",
  auth,
  adminOnly,
  async (req, res) => {
    const { userId, action } = req.params;
    const { rejection_reason } = req.body || {};

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const updates =
      action === "approve"
        ? {
            verified: true,
            verification_status: "approved",
            rejection_reason: null,
            updated_at: new Date().toISOString(),
          }
        : {
            verified: false,
            verification_status: "rejected",
            rejection_reason: rejection_reason?.trim() || null,
            updated_at: new Date().toISOString(),
          };

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      message: `User ${action}d successfully`,
      ...(rejection_reason && { rejection_reason }),
    });

    if (io) {
      io.to(String(userId)).emit("notifications_updated");
    }
  }
);





export default router;