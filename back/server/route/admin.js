import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";
import supabaseAdmin from "../Admin.js";
import fetch from "node-fetch";
import FormData from "form-data";

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
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        registration_number,
        registration_council,
        verification_status,
        license_doc_url
      `)
      .eq("verification_status", "pending");

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  }
);

/* =========================
   GET DOCUMENT (SIGNED URL)
   ========================= */
router.get(
  "/verifications/:userId/document/:type",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const { userId, type } = req.params;

      if (!["license", "id"].includes(type)) {
        return res.status(400).json({ error: "Invalid document type" });
      }

      const { data: user, error } = await supabase
        .from("users")
        .select(`${type}_doc_url`)
        .eq("id", userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: "User not found" });
      }

      let filePath = user[`${type}_doc_url`];
      if (filePath.startsWith("http")) {
        filePath = filePath.split("/storage/v1/object/")[1]?.split("?")[0];
      }

      const { data: signed, error: signError } =
        await supabaseAdmin.storage
          .from("verification-docs")
          .createSignedUrl(filePath, 3600);

      if (signError) {
        return res.status(500).json({ error: signError.message });
      }

      res.json({ url: signed.signedUrl });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);

/* =========================
   AI + REGISTRY VERIFICATION
   ========================= */
router.post(
  "/verifications/:userId/ai-check",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const { userId } = req.params;

      /* 1️⃣ Fetch user */
      const { data: user, error } = await supabase
        .from("users")
        .select("name, registration_number, license_doc_url")
        .eq("id", userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: "User not found" });
      }

      /* 2️⃣ Download license PDF */
      let filePath = user.license_doc_url;
      if (filePath.startsWith("http")) {
        filePath = filePath.split("/storage/v1/object/")[1]?.split("?")[0];
      }

      const { data: fileData, error: fileError } =
        await supabaseAdmin.storage
          .from("verification-docs")
          .download(filePath);

      if (fileError) {
        return res.status(500).json({ error: fileError.message });
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());

      /* 3️⃣ Prepare OCR request */
      const form = new FormData();
      form.append("file", buffer, {
        filename: "license.pdf",
        contentType: "application/pdf",
      });

      /* ===============================
         RUN BOTH MODELS IN PARALLEL
         =============================== */
      const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8001";
      const PLAYWRIGHT_SERVICE_URL = process.env.PLAYWRIGHT_SERVICE_URL || "http://localhost:9000";

      const [ocrRes, imrRes] = await Promise.allSettled([
        fetch(`${ML_SERVICE_URL}/extract-license`, {
          method: "POST",
          body: form,
        }),
        fetch(`${PLAYWRIGHT_SERVICE_URL}/mci-check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: user.name,
            registration_number: user.registration_number
          }),
        })
      ]);

      /* ===============================
         OCR RESULT (10%)
         =============================== */
      let ocrScore = 0;
      let extractedTable = null;

      console.log("\n[AI Check] ========================================");
      console.log("[AI Check] User:", user.name, "| Reg:", user.registration_number);
      console.log("[AI Check] ========================================\n");

      if (ocrRes.status === "fulfilled" && ocrRes.value.ok) {
        const ocrJson = await ocrRes.value.json();
        extractedTable = ocrJson.structured_certificate;

        console.log("[OCR Result] Full response:", JSON.stringify(ocrJson, null, 2));
        console.log("[OCR Result] Extracted name:", extractedTable?.name);
        console.log("[OCR Result] Extracted registration:", extractedTable?.registration_number);

        const normalize = v =>
          String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

        const userNameNorm = normalize(user.name);
        const extractedNameNorm = normalize(extractedTable?.name);
        const userRegNorm = normalize(user.registration_number);
        const extractedRegNorm = normalize(extractedTable?.registration_number);

        console.log("[OCR Result] Normalized comparison:");
        console.log("  - User name:", userNameNorm);
        console.log("  - Extracted name:", extractedNameNorm);
        console.log("  - User reg:", userRegNorm);
        console.log("  - Extracted reg:", extractedRegNorm);

        const nameMatch =
          userNameNorm.includes(extractedNameNorm) ||
          extractedNameNorm.includes(userNameNorm);

        const regMatch = userRegNorm === extractedRegNorm;

        console.log("[OCR Result] Matches - Name:", nameMatch, "| Reg:", regMatch);

        if (nameMatch && regMatch) {
          ocrScore = 10;
          console.log("[OCR Result] ✅ Score: 10/10");
        } else {
          console.log("[OCR Result] ❌ Score: 0/10");
        }
      } else {
        console.log("[OCR Result] ❌ Failed or rejected");
        if (ocrRes.status === "rejected") {
          console.log("[OCR Result] Error:", ocrRes.reason);
        } else if (ocrRes.status === "fulfilled" && !ocrRes.value.ok) {
          const errorText = await ocrRes.value.text();
          console.log("[OCR Result] HTTP Error:", ocrRes.value.status, errorText);
        }
      }

      /* ===============================
         PLAYWRIGHT RESULT (90%)
         =============================== */
      let imrScore = 0;
      let imrResult = null;

      if (imrRes.status === "fulfilled" && imrRes.value.ok) {
        imrResult = await imrRes.value.json();

        console.log("\n[IMR Result] Full response:", JSON.stringify(imrResult, null, 2));

        if (imrResult.status === "FOUND" && imrResult.record) {
          const record = imrResult.record;

          console.log("[IMR Result] Record found:");
          console.log("  - Name:", record.name);
          console.log("  - Registration:", record.registration_number);
          console.log("  - Council:", record.state_medical_council);
          console.log("  - Year:", record.year_of_info);

          // Validate that record has required fields
          if (!record.name || !record.registration_number) {
            console.log("[IMR Result] ❌ Invalid record: missing name or registration");
            console.log("[IMR Result] ❌ Score: 0/90 (invalid data)");
          } else {
            const normalize = (v) =>
              String(v || "")
                .toLowerCase()
                .replace(/^(dr\.?|doctor)\s+/i, "")
                .replace(/[^a-z0-9]/g, "");

            const userNameNorm = normalize(user.name);
            const imrNameNorm = normalize(record.name);
            const userRegNorm = normalize(user.registration_number);
            const imrRegNorm = normalize(record.registration_number);

            console.log("[IMR Result] Normalized comparison:");
            console.log("  - User name:", userNameNorm);
            console.log("  - IMR name:", imrNameNorm);
            console.log("  - User reg:", userRegNorm);
            console.log("  - IMR reg:", imrRegNorm);

            // Only match if both normalized values are non-empty
            const nameMatch =
              userNameNorm.length > 0 &&
              imrNameNorm.length > 0 &&
              (userNameNorm.includes(imrNameNorm) ||
                imrNameNorm.includes(userNameNorm));

            const regMatch =
              userRegNorm.length > 0 &&
              imrRegNorm.length > 0 &&
              userRegNorm === imrRegNorm;

            console.log("[IMR Result] Matches - Name:", nameMatch, "| Reg:", regMatch);

            if (nameMatch) {
              imrScore = 90;
              console.log("[IMR Result] ✅ Score: 90/90");
            } else {
              console.log("[IMR Result] ❌ Score: 0/90 (name mismatch)");
            }
          }
        } else {
          console.log("[IMR Result] ❌ Status:", imrResult.status);
          if (imrResult.error) {
            console.log("[IMR Result] Error:", imrResult.error);
          }
        }
      } else {
        console.log("[IMR Result] ❌ Failed or rejected");
        if (imrRes.status === "rejected") {
          console.log("[IMR Result] Error:", imrRes.reason);
        } else if (imrRes.status === "fulfilled" && !imrRes.value.ok) {
          const errorText = await imrRes.value.text();
          console.log("[IMR Result] HTTP Error:", imrRes.value.status, errorText);
        }
      }

      /* ===============================
         FINAL SCORE
         =============================== */
      const verification_score = ocrScore + imrScore;

      let verification_status = "FAILED";
      if (verification_score === 100) {
        verification_status = "VERIFIED";
      } else if (verification_score >= 10) {
        verification_status = "PARTIALLY_VERIFIED";
      }

      /* ===============================
         RESPONSE TO FRONTEND
         =============================== */
      res.json({
        resume_name: user.name,
        resume_registration_number: user.registration_number,
        verification_score,
        verification_status,
        breakdown: {
          ocr_score: ocrScore,
          registry_score: imrScore
        },
        extracted_license: extractedTable,
        registry_result: imrResult,
        method: "OCR (10%) + NMC Registry (90%)"
      });

    } catch (err) {
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
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: `User ${action}d successfully` });
  }
);

export default router;