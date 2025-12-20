import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   SUBMIT VERIFICATION
   ========================= */
router.post("/submit", auth, async (req, res) => {
  const userId = req.user.id;
  const { license_doc_url, id_doc_url, registration_council } = req.body;

  console.log("[Verification] Submit:", {
    userId,
    license_doc_url,
    id_doc_url,
  });

  if (!license_doc_url || !id_doc_url) {
    return res.status(400).json({
      error: "Document paths missing",
    });
  }

  const { error } = await supabase
    .from("users")
    .update({
      license_doc_url,
      id_doc_url,
      registration_council,
      verification_status: "pending",
      verified: false,
    })
    .eq("id", userId);

  if (error) {
    console.error("[Verification] DB error:", error.message);
    return res.status(500).json({ error: error.message });
  }

  res.json({ message: "Verification submitted" });
});

export default router;