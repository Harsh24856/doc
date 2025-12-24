import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";
import supabaseAdmin from "../Admin.js";
import fetch from "node-fetch";
import FormData from "form-data";

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
   HELPERS
   ========================= */
const normalizeText = (v) =>
  String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeNumber = (v) =>
  String(v || "").replace(/\D/g, "");

/* =========================
   AI VERIFICATION
   ========================= */
router.post(
  "/verifications/:userId/ai-check",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const { userId } = req.params;

      const { data: user } = await supabase
        .from("users")
        .select(`
          role,
          name,
          registration_number,
          registration_council,
          years_of_experience,
          license_doc_url,
          id_doc_url
        `)
        .eq("id", userId)
        .single();

      if (!user) return res.status(404).json({ error: "User not found" });

      const isDoctor = user.role === "doctor";
      const userNameNorm = normalizeText(user.name);

      /* =========================
         DOWNLOAD FILES
         ========================= */
      const download = async (path) => {
        if (!path) return null;
        if (path.startsWith("http")) {
          path = path.split("/storage/v1/object/")[1]?.split("?")[0];
        }
        const { data } = await supabaseAdmin
          .storage
          .from("verification-docs")
          .download(path);
        return data ? Buffer.from(await data.arrayBuffer()) : null;
      };

      const licenseBuffer = await download(user.license_doc_url);
      const idBuffer = await download(user.id_doc_url);

      if (!licenseBuffer)
        return res.status(400).json({ error: "License document missing" });

      /* =========================
         PARALLEL TASKS
         ========================= */
      const ML = process.env.ML_SERVICE_URL;
      const PW = process.env.PLAYWRIGHT_SERVICE_URL;

      const tasks = [];
      let registryIndex = -1;
      let licenseIndex = -1;
      let idIndex = -1;

      if (isDoctor) {
        registryIndex = tasks.length;
        tasks.push(
          fetch(`${PW}/mci-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              registration_number: user.registration_number,
            }),
          })
        );
      }

      licenseIndex = tasks.length;
      const licenseForm = new FormData();
      licenseForm.append("file", licenseBuffer, {
        filename: "license.pdf",
        contentType: "application/pdf",
      });
      tasks.push(fetch(`${ML}/extract-license`, { method: "POST", body: licenseForm }));

      if (idBuffer) {
        idIndex = tasks.length;
        const idForm = new FormData();
        idForm.append("file", idBuffer, {
          filename: "id.pdf",
          contentType: "application/pdf",
        });
        tasks.push(fetch(`${ML}/extract-id-license`, { method: "POST", body: idForm }));
      }

      const responses = await Promise.allSettled(tasks);

      /* =========================
         SCORE CALCULATION
         ========================= */
      let registryScore = 0;
      let licenseScore = 0;
      let idScore = 0;

      let extracted_license = null;
      let extracted_id = null;
      let registry_result = null;

      for (let i = 0; i < responses.length; i++) {
        if (responses[i].status !== "fulfilled") continue;
        const r = responses[i].value;
        if (!r.ok) continue;

        const data = await r.json();

        /* ========= REGISTRY (STRICT 80) ========= */
        if (i === registryIndex && data.result) {
          const registryData = data.result;
          registry_result = registryData;

          let score = 0;

          const dbName = userNameNorm;
          const imrName = normalizeText(registryData.name);

          const dbRegNo = normalizeNumber(user.registration_number);
          const imrRegNo = normalizeNumber(registryData.registration_number);

          const dbCouncil = normalizeText(user.registration_council);
          const imrCouncil = normalizeText(registryData.council);

          const imrYear = parseInt(registryData.year, 10);
          const dbExp = parseInt(user.years_of_experience, 10);
          const currentYear = new Date().getFullYear();

          console.log("[Registry] 🔍 IMR Data:", registryData);

          /* RULE 1 — NAME (+20) */
          if (
            imrName &&
            (dbName === imrName ||
              dbName.includes(imrName) ||
              imrName.includes(dbName))
          ) {
            score += 20;
            console.log("[Registry Rule] ✅ Name match (+20)");
          } else {
            console.log("[Registry Rule] ❌ Name mismatch");
          }

          /* RULE 2 — REGISTRATION NUMBER (+20) */
          let regMatched = false;
          if (imrRegNo && dbRegNo && imrRegNo === dbRegNo) {
            score += 20;
            regMatched = true;
            console.log("[Registry Rule] ✅ Registration number match (+20)");
          } else {
            console.log("[Registry Rule] ❌ Registration number mismatch");
          }

          /* RULE 3 — COUNCIL (+20) */
          if (dbCouncil && imrCouncil && dbCouncil === imrCouncil) {
            score += 20;
            console.log("[Registry Rule] ✅ Council match (+20)");
          } else {
            console.log(
              `[Registry Rule] ❌ Council mismatch (DB: ${user.registration_council}, IMR: ${registryData.council})`
            );
          }

          /* RULE 4 — EXPERIENCE ↔ YEAR (+20) */
          if (regMatched && !isNaN(imrYear) && !isNaN(dbExp)) {
            const calcExp = currentYear - imrYear;
            if (Math.abs(calcExp - dbExp) <= 1) {
              score += 20;
              console.log("[Registry Rule] ✅ Experience-year match (+20)");
            } else {
              console.log(
                `[Registry Rule] ❌ Experience mismatch (IMR:${calcExp}, DB:${dbExp})`
              );
            }
          } else {
            console.log("[Registry Rule] ⚠️ Experience rule skipped (no reg match)");
          }

          registryScore = score;
          console.log(`[Admin] 🏥 Registry Score FINAL: ${registryScore}/80`);
        }

        /* ========= LICENSE OCR (10) ========= */
        if (i === licenseIndex && data.structured_certificate) {
          extracted_license = data.structured_certificate;
          const n = normalizeText(extracted_license.name);
          if (n && (userNameNorm.includes(n) || n.includes(userNameNorm)))
            licenseScore = 10;
        }

        /* ========= ID OCR (10) ========= */
        if (i === idIndex && data.structured_id) {
          extracted_id = data.structured_id;
          const n = normalizeText(extracted_id.name);
          if (n && (userNameNorm.includes(n) || n.includes(userNameNorm)))
            idScore = 10;
        }
      }

      const verification_score = registryScore + licenseScore + idScore;

      let verification_status = "FAILED";
      if (verification_score === 100) verification_status = "VERIFIED";
      else if (verification_score >= 50) verification_status = "PARTIALLY_VERIFIED";

      res.json({
        name: user.name,
        role: user.role,
        verification_score,
        verification_status,
        breakdown: {
          registry_score: registryScore,
          license_ocr_score: licenseScore,
          id_ocr_score: idScore,
        },
        extracted_license,
        extracted_id,
        registry_result,
        method: "Registry(80 strict) + License OCR(10) + ID OCR(10)",
      });
    } catch (err) {
      console.error("[Admin] ❌ AI CHECK ERROR:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;