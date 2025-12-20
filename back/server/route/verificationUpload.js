import express from "express";
import multer from "multer";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   MULTER CONFIG (PDF ONLY)
   ========================= */
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Only PDF files allowed"));
    } else {
      cb(null, true);
    }
  },
});

/* =========================
   UPLOAD VERIFICATION DOCS
   ========================= */
router.post(
  "/upload",
  auth,
  upload.fields([
    { name: "license", maxCount: 1 },
    { name: "id", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      console.log("[Upload] User:", userId);

      if (!req.files?.license || !req.files?.id) {
        return res.status(400).json({
          error: "Both license and ID PDFs are required",
        });
      }

      const licenseFile = req.files.license[0];
      const idFile = req.files.id[0];

      const licensePath = `${userId}/license.pdf`;
      const idPath = `${userId}/id.pdf`;

      console.log("[Upload] Uploading to storage:", {
        licensePath,
        idPath,
      });

      /* 🔐 SERVICE ROLE UPLOAD (NO RLS) */
      const { error: licErr } = await supabase.storage
        .from("verification-docs")
        .upload(licensePath, licenseFile.buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (licErr) throw licErr;

      const { error: idErr } = await supabase.storage
        .from("verification-docs")
        .upload(idPath, idFile.buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (idErr) throw idErr;

      res.json({
        license_doc_url: licensePath,
        id_doc_url: idPath,
      });
    } catch (err) {
      console.error("[Upload] Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  }
);

export default router;