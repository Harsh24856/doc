import express from "express";
import auth from "../middleware/auth.js";
import uploadHospital from "../middleware/uploadHospital.js";
import supabaseAdmin from "../Admin.js";

const router = express.Router();

/* UPLOAD HOSPITAL DOCUMENT */
router.post(
  "/documents/upload",
  auth,
  uploadHospital.single("document"),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { document_type } = req.body;
      const file = req.file;

      /* Basic Validation */
      if (!file || !document_type) {
        return res.status(400).json({
          message: "Document file and document_type are required",
        });
      }

      const allowedTypes = [
        "registration",
        "authorization",
        "address",
        "gst",
        "nabh",
      ];

      if (!allowedTypes.includes(document_type)) {
        return res.status(400).json({
          message: "Invalid document type",
        });
      }

      /* Fetch Hospital */
      const { data: hospital, error: hospitalError } = await supabaseAdmin
        .from("hospitals")
        .select("id, verified")
        .eq("user_id", userId)
        .single();

      if (hospitalError || !hospital) {
        return res.status(403).json({
          message: "Hospital not found for this user",
        });
      }

      /* Lock if Verified */
      if (hospital.verified === true) {
        return res.status(403).json({
          message: "Verified hospitals cannot modify documents",
        });
      }

      /* Upload to Storage */
      const filePath = `${hospital.id}/${document_type}.pdf`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("hospital-verification")
        .upload(filePath, file.buffer, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      /* Store Metadata */
      await supabaseAdmin.from("hospital_documents").insert([
        {
          hospital_id: hospital.id,
          document_type,
          file_path: filePath,
        },
      ]);

      /* Success */
      return res.json({
        message: "Document uploaded successfully",
        document_type,
      });
    } catch (err) {
      console.error("[HOSPITAL DOCUMENT UPLOAD ERROR]", err.message);
      return res.status(500).json({
        error: err.message,
      });
    }
  }
);

export default router;
