import express from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

router.post("/upload", auth, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user.id;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    if (!file.buffer) {
      return res.status(500).json({ error: "File buffer not available" });
    }

    // Sanitize filename to prevent path traversal
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filePath = `chat/${userId}/${randomUUID()}-${sanitizedFilename}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("chat-files")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      console.error("[File Upload] Supabase upload error:", uploadError);
      return res.status(500).json({ 
        error: uploadError.message || "Failed to upload file to storage" 
      });
    }

    const { data: urlData } = supabase.storage
      .from("chat-files")
      .getPublicUrl(filePath);

    if (!urlData || !urlData.publicUrl) {
      console.error("[File Upload] Failed to get public URL");
      return res.status(500).json({ error: "Failed to generate file URL" });
    }

    const type = file.mimetype.startsWith("image/")
      ? "image"
      : "document";

    res.json({
      url: urlData.publicUrl,
      name: file.originalname,
      type,
    });
  } catch (err) {
    console.error("[File Upload] Unexpected error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;