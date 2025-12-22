import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import supabaseAdmin from "../Admin.js";

const router = express.Router();

/* GET HOSPITAL VERIFICATION QUEUE (FIFO) */
router.get(
  "/hospitals/queue",
  auth,
  admin,
  async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from("hospitals")
        .select(`
          id,
          hospital_name,
          hospital_city,
          hospital_state,
          verification_submitted_at
        `)
        .eq("verification_status", "pending")
        .order("verification_submitted_at", { ascending: true });

      if (error) {
        throw error;
      }

      return res.json({
        hospitals: data,
      });
    } catch (err) {
      console.error("Error fetching hospital verification queue", err);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

/* GET HOSPITAL PROFILE (ADMIN) */
router.get(
  "/hospitals/:hospitalId/profile",
  auth,
  admin,
  async (req, res) => {
    try {
      const { hospitalId } = req.params;

      const { data: hospital, error } = await supabaseAdmin
        .from("hospitals")
        .select(`
          id,
          hospital_name,
          hospital_type,
          registration_number_hospital,
          hospital_city,
          hospital_state,
          hospital_person_name,
          hospital_person_email,
          hospital_website,
          verification_status,
          verification_submitted_at
        `)
        .eq("id", hospitalId)
        .single();

      if (error || !hospital) {
        return res.status(404).json({
          message: "Hospital not found",
        });
      }

      return res.json({ hospital });
    } catch (err) {
      console.error("Error fetching hospital profile", err);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

/* GET HOSPITAL DOCUMENTS (ADMIN) */
router.get(
  "/hospitals/:hospitalId/documents",
  auth,
  admin,
  async (req, res) => {
    try {
      const { hospitalId } = req.params;

      /*  Fetch document records from DB */
      const { data: documents, error } = await supabaseAdmin
        .from("hospital_documents")
        .select("document_type, file_path")
        .eq("hospital_id", hospitalId);

      if (error) {
        throw error;
      }

      if (!documents || documents.length === 0) {
        return res.json({
          documents: [],
        });
      }

      /*  Convert file_path → signed URL */
      const signedDocuments = await Promise.all(
        documents.map(async (doc) => {
          const { data, error } = await supabaseAdmin.storage
            .from("hospital-verification")
            .createSignedUrl(doc.file_path, 60 * 10); // 10 minutes

          if (error) {
            throw error;
          }

          return {
            document_type: doc.document_type,
            url: data.signedUrl,
          };
        })
      );

      /*  Send to frontend */
      return res.json({
        documents: signedDocuments,
      });
    } catch (err) {
      console.error("Error fetching hospital documents", err);
      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
);

export default router;
