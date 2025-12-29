import express from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import supabaseAdmin from "../Admin.js";
import { extractPdfText } from "../services/pdfService.js";
import { generateDocumentInsights } from "../services/aiService.js";
import { sendHospitalVerificationEmail, sendHospitalRejectionEmail } from "../services/resendEmail.js";

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

router.get(
  "/hospitals/:hospitalId/documents/:documentType/text",
  auth,
  admin,
  async (req, res) => {
    try {
      const { hospitalId, documentType } = req.params;

      //  Fetch document metadata
      const { data: doc, error } = await supabaseAdmin
        .from("hospital_documents")
        .select("file_path")
        .eq("hospital_id", hospitalId)
        .eq("document_type", documentType)
        .single();

      if (error || !doc) {
        return res.status(404).json({
          message: "Document not found",
        });
      }

      // Extract text
      const text = await extractPdfText(doc.file_path);

      // Return extracted text (for testing)
      return res.json({
        hospital_id: hospitalId,
        document_type: documentType,
        text_preview: text.substring(0, 2000), // limit output
        text_length: text.length,
      });
    } catch (err) {
      console.error("PDF extraction error:", err);
      return res.status(500).json({
        message: "Failed to extract PDF text",
      });
    }
  }
);

router.get(
  "/hospitals/:hospitalId/documents/:documentType/insights",
  auth,
  admin,
  async (req, res) => {
    try {
      const { hospitalId, documentType } = req.params;

      /*  Fetch document record */
      const { data: document, error: docError } = await supabaseAdmin
        .from("hospital_documents")
        .select("file_path")
        .eq("hospital_id", hospitalId)
        .eq("document_type", documentType)
        .single();

      if (docError || !document) {
        return res.status(404).json({
          message: "Document not found",
        });
      }

      /*  Extract text from PDF */
      const extractedText = await extractPdfText(document.file_path);

      /*  Fetch hospital profile */
      const { data: hospital, error: hospitalError } = await supabaseAdmin
        .from("hospitals")
        .select(`
          hospital_name,
          hospital_city,
          hospital_state,
          registration_number_hospital
        `)
        .eq("id", hospitalId)
        .single();

      if (hospitalError || !hospital) {
        return res.status(404).json({
          message: "Hospital not found",
        });
      }

      /*  Generate AI insights */
      const insights = await generateDocumentInsights({
        documentType,
        extractedText,
        hospitalProfile: hospital,
      });

      /*  Respond */
      return res.json({
        hospital_id: hospitalId,
        document_type: documentType,
        insights,
      });
    } catch (err) {
      console.error("AI INSIGHTS ERROR:", err.message);
      console.error("AI INSIGHTS ERROR Stack:", err.stack);
      return res.status(500).json({
        message: "Failed to generate document insights",
        error: err.message,
      });
    }
  }
);

router.patch(
  "/hospitals/:hospitalId/status",
  auth,
  admin,
  async (req, res) => {
    try {
      const { hospitalId } = req.params;
      const { status, reason } = req.body;

      //  Validate status
      const allowedStatuses = ["pending", "verified", "rejected"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      //  Fetch hospital
      const { data: hospital, error: fetchError } = await supabaseAdmin
        .from("hospitals")
        .select("user_id, hospital_name")
        .eq("id", hospitalId)
        .single();

      if (fetchError || !hospital) {
        return res.status(404).json({ message: "Hospital not found" });
      }

      //  Fetch user email
      const { data: user, error: userFetchError } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", hospital.user_id)
        .single();

      if (userFetchError || !user) {
        return res.status(404).json({ message: "User not found" });
      }

      //  Prepare update payload
      const updatePayload = {
        verification_status: status,
        updated_at: new Date().toISOString(),
      };

      if (status === "rejected") {
        updatePayload.rejection_reason = reason || null;
      }

      if(status === "approved"){
        updatePayload.rejection_reason = null;
      }

      //  Update hospital status
      const { error: updateError } = await supabaseAdmin
        .from("hospitals")
        .update(updatePayload)
        .eq("id", hospitalId);

      if (updateError) {
        throw updateError;
      }

      //  RESPOND TO CLIENT IMMEDIATELY (IMPORTANT)
      res.json({ message: "Hospital status updated successfully" });

      //  SEND EMAIL IN BACKGROUND (NON-BLOCKING)
      // if (status === "verified") {
      //   sendHospitalVerificationEmail({
      //     hospitalEmail: user.email,
      //     hospitalName: hospital.hospital_name,
      //   }).catch(err => {
      //     console.error("EMAIL ERROR (verified):", err.message);
      //   });
      // }

      // if (status === "rejected") {
      //   sendHospitalRejectionEmail({
      //     hospitalEmail: user.email,
      //     hospitalName: hospital.hospital_name,
      //     rejectionReason: reason,
      //   }).catch(err => {
      //     console.error("EMAIL ERROR (rejected):", err.message);
      //   });
      // }

    } catch (err) {
      console.error("STATUS UPDATE ERROR:", err.message);
      res.status(500).json({ message: "Failed to update status" });
    }
  }
);



export default router;
