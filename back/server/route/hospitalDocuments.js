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
      console.log("[Hospital Upload] Fetching hospital for user:", userId);
      const { data: hospital, error: hospitalError } = await supabaseAdmin
        .from("hospitals")
        .select("id, verification_status")
        .eq("user_id", userId)
        .single();

      if (hospitalError) {
        console.error("[Hospital Upload] Error fetching hospital:", hospitalError);
        console.error("[Hospital Upload] Error code:", hospitalError.code);
        // If hospital doesn't exist, return 404 instead of 403
        if (hospitalError.code === "PGRST116") {
          return res.status(404).json({
            message: "Hospital profile not found. Please complete your hospital profile first.",
          });
        }
        return res.status(500).json({
          message: "Error fetching hospital information",
          error: hospitalError.message,
        });
      }

      if (!hospital) {
        console.error("[Hospital Upload] Hospital not found for user:", userId);
        return res.status(404).json({
          message: "Hospital profile not found. Please complete your hospital profile first.",
        });
      }

      console.log("[Hospital Upload] Hospital found:", { id: hospital.id, status: hospital.verification_status });

      /* Lock if Verified */
      const status = hospital.verification_status || "not_submitted";
      if (status === "approved" || status === "verified") {
        console.log("[Hospital Upload] Blocked: Hospital is verified");
        return res.status(403).json({
          message: "Verified hospitals cannot modify documents",
        });
      }

      // Allow uploads for: not_submitted, null, or any status except approved/verified
      console.log("[Hospital Upload] Proceeding with upload, status:", status);

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
      const { data, error } = await supabaseAdmin
      .from("hospital_documents")
      .upsert(
      {
        hospital_id : hospital.id,
        document_type,
        file_path : filePath,
        uploaded_at: new Date(),
      },
      {
       onConflict: "hospital_id,document_type"
      }
    );

    if (error) {
     console.error(error);
    }

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

router.post("/documents/send", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    /* Fetch hospital */
    const { data: hospital, error: hospitalError } = await supabaseAdmin
      .from("hospitals")
      .select("id, verification_status")
      .eq("user_id", userId)
      .single();

    if (hospitalError || !hospital) {
      return res.status(404).json({
        message: "Hospital not found",
      });
    }

    /*  Prevent re-submission */
    if (hospital.verification_status === "pending") {
      return res.status(400).json({
        message: "Verification already submitted",
      });
    }

    if (hospital.verification_status === "approved") {
      return res.status(400).json({
        message: "Hospital already verified",
      });
    }

    /*  Check required documents */
    const REQUIRED_DOCS = [
      "registration",
      "authorization",
      "address",
    ];

    const { data: documents, error: docsError } = await supabaseAdmin
      .from("hospital_documents")
      .select("document_type")
      .eq("hospital_id", hospital.id)
      .in("document_type", REQUIRED_DOCS);

    if (docsError) {
      throw docsError;
    }

    const uploadedTypes = documents.map((d) => d.document_type);
    const missingDocs = REQUIRED_DOCS.filter(
      (doc) => !uploadedTypes.includes(doc)
    );

    if (missingDocs.length > 0) {
      return res.status(400).json({
        message: "Required documents not uploaded",
        missing_documents: missingDocs,
      });
    }

    /*  Mark verification as pending */
    const { error: updateError } = await supabaseAdmin
      .from("hospitals")
      .update({
        verification_status: "pending",
        verification_submitted_at: new Date(),
      })
      .eq("id", hospital.id);

    if (updateError) {
      throw updateError;
    }

    /*  Success */
    return res.json({
      message: "Hospital sent for verification",
      verification_status: "pending",
    });
  } catch (err) {
    console.error("Error in sending for verification:", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});

router.get("/status", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: hospital, error: hospitalError } = await supabaseAdmin
      .from("hospitals")
      .select("verification_status")
      .eq("user_id", userId)
      .single();

    if (hospitalError) {
      // If hospital doesn't exist yet, return default status
      if (hospitalError.code === "PGRST116") {
        return res.json({
          verification_status: "not_submitted",
        });
      }
      console.error("[Hospital Status] Error:", hospitalError);
      return res.status(500).json({
        message: "Internal server error",
      });
    }

    if (!hospital) {
      return res.json({
        verification_status: "not_submitted",
      });
    }

    return res.json({
      verification_status: hospital.verification_status || "not_submitted",
    });
  } catch (err) {
    console.error("Error in fetching verification status", err);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
});



export default router;
