import express from "express";
import multer from "multer";
import auth from "../middleware/auth.js";
import supabaseAdmin from "../Admin.js";

const router = express.Router();

/* =========================
   MULTER CONFIG (PDF ONLY)
   ========================= */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files allowed"));
    }
    cb(null, true);
  },
});

/* =========================
   UPLOAD VERIFICATION FILES
   ========================= */
router.post(
  "/upload",
  auth,
  upload.fields([
    { name: "license", maxCount: 1 },
    { name: "id", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log("[UPLOAD] Request received");

    try {
      if (!req.files?.license || !req.files?.id) {
        return res.status(400).json({
          error: "License and ID PDFs are required",
        });
      }

      const userId = req.user.id;
      console.log("[UPLOAD] User:", userId);

      const licenseFile = req.files.license[0];
      const idFile = req.files.id[0];

      const licensePath = `${userId}/license.pdf`;
      const idPath = `${userId}/id.pdf`;

      console.log("[UPLOAD] Uploading to Supabase...");

      /* LICENSE */
      const { error: licErr } = await supabaseAdmin.storage
        .from("verification-docs")
        .upload(licensePath, licenseFile.buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (licErr) throw licErr;

      /* ID */
      const { error: idErr } = await supabaseAdmin.storage
        .from("verification-docs")
        .upload(idPath, idFile.buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (idErr) throw idErr;

      console.log("[UPLOAD] Upload success");

      res.json({
        license_doc_url: licensePath,
        id_doc_url: idPath,
      });
    } catch (err) {
      console.error("[UPLOAD ERROR]:", err.message);
      res.status(400).json({ error: err.message });
    }
  }
);

export default router;