import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";
import supabaseAdmin from "../Admin.js";

const router = express.Router();

/* =========================
   ADMIN MIDDLEWARE
   ========================= */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

/* =========================
   GET PENDING VERIFICATIONS
   ========================= */
router.get(
  "/verifications/pending",
  auth,
  adminOnly,
  async (req, res) => {
    console.log("[Admin] Fetching pending verifications");

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        role,
        registration_council,
        verification_status,
        license_doc_url,
        id_doc_url
      `)
      .eq("verification_status", "pending");

    if (error) {
      console.error("[Admin] Fetch error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  }
);

/* =========================
   GET DOCUMENT SIGNED URL
   ========================= */
router.get(
  "/verifications/:userId/document/:type",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const { userId, type } = req.params;
      console.log("[Admin] Getting document:", { userId, type });

      if (!["license", "id"].includes(type)) {
        return res.status(400).json({ error: "Invalid document type" });
      }

      // Fetch user data to get document URL
      const { data: user, error: userError } = await supabase
        .from("users")
        .select(`${type}_doc_url`)
        .eq("id", userId)
        .single();

      if (userError || !user) {
        console.error("[Admin] User fetch error:", userError?.message);
        return res.status(404).json({ error: "User not found" });
      }

      const docUrl = user[`${type}_doc_url`];
      if (!docUrl) {
        return res.status(404).json({ error: "Document not found" });
      }

      console.log("[Admin] Document URL from DB:", docUrl);

      // Extract file path from URL or use directly
      let filePath = docUrl;
      if (docUrl.includes("/storage/v1/object/")) {
        // Extract path from full Supabase URL
        const urlParts = docUrl.split("/storage/v1/object/");
        if (urlParts.length > 1) {
          filePath = urlParts[1].split("?")[0]; // Remove query params
        }
      } else if (docUrl.startsWith("http")) {
        // Extract path from any HTTP URL
        const url = new URL(docUrl);
        filePath = url.pathname.replace(/^\/storage\/v1\/object\//, "");
      }

      console.log("[Admin] Extracted file path:", filePath);

      // Generate signed URL (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
        .from("verification-docs")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error("[Admin] Signed URL error:", signedUrlError.message);
        return res.status(500).json({ error: signedUrlError.message });
      }

      console.log("[Admin] Signed URL generated successfully");
      res.json({ url: signedUrlData.signedUrl });
    } catch (err) {
      console.error("[Admin] Document error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

/* =========================
   APPROVE / REJECT USER
   ========================= */
router.post(
  "/verifications/:userId/:action",
  auth,
  adminOnly,
  async (req, res) => {
    const { userId, action } = req.params;

    console.log("[Admin] Action:", userId, action);

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ error: "Invalid action" });
    }

    const updates =
      action === "approve"
        ? { verified: true, verification_status: "approved" }
        : { verified: false, verification_status: "rejected" };

    const { error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId);

    if (error) {
      console.error("[Admin] Update error:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: `User ${action}d successfully` });
  }
);


export default router;