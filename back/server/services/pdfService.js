import pdf from "pdf-parse";
import supabaseAdmin from "../Admin.js";
import visionClient from "./googleVisionClient.js";

import fs from "fs";
import path from "path";
import os from "os";

/* Download PDF from Supabase */
async function fetchPdfBuffer(filePath) {
  const { data, error } = await supabaseAdmin.storage
    .from("hospital-verification")
    .download(filePath);

  if (error) {
    throw new Error(`Failed to download PDF: ${error.message}`);
  }

  const arrayBuffer = await data.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/* Digital PDF text extraction */
async function extractTextFromPdf(buffer) {
  const result = await pdf(buffer);
  return result.text ? result.text.trim() : "";
}

/* Scanned PDF OCR: PDF → Image → Vision */
async function extractTextFromPdfViaImage(buffer) {
  // Lazy import pdf-poppler to prevent server crash if package/system deps are missing
  let pdfPoppler;
  try {
    pdfPoppler = (await import("pdf-poppler")).default;
  } catch (err) {
    console.error("[PDF Service] pdf-poppler import failed:", err.message);
    throw new Error("pdf-poppler is not available. Please install poppler-utils system dependencies.");
  }

  // Create temp directory
  let tempDir;
  try {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-ocr-"));

    // Write PDF temporarily
    const pdfPath = path.join(tempDir, "input.pdf");
    fs.writeFileSync(pdfPath, buffer);

    const opts = {
      format: "png",
      out_dir: tempDir,
      out_prefix: "page",
      page: 1, // FIRST PAGE ONLY (safe + fast)
    };

    // Convert PDF → PNG
    await pdfPoppler.convert(pdfPath, opts);

    const imagePath = path.join(tempDir, "page-1.png");
    
    // Check if image file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error("PDF conversion failed: output image not found");
    }

    const imageBuffer = fs.readFileSync(imagePath);

    // OCR image with Google Vision
    const [result] = await visionClient.documentTextDetection({
      image: {
        content: imageBuffer.toString("base64"),
      },
    });

    const fullText = result?.fullTextAnnotation?.text || "";
    return fullText.trim();
  } catch (error) {
    console.error("[PDF Service] OCR processing failed:", error.message);
    throw new Error(`Failed to extract text via OCR: ${error.message}`);
  } finally {
    // Always cleanup temp directory
    if (tempDir) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("[PDF Service] Failed to cleanup temp directory:", cleanupError.message);
      }
    }
  }
}

/*
  Main function:
  1. Download PDF
  2. Try digital text extraction
  3. Fallback to scanned-PDF OCR (pdf-poppler + Vision)
 */
export async function extractPdfText(filePath) {
  if (!filePath) {
    throw new Error("filePath is required");
  }

  try {
    const buffer = await fetchPdfBuffer(filePath);

    //  Try digital PDF text
    let text = await extractTextFromPdf(buffer);

    // Fallback: scanned PDF OCR (only if digital extraction failed or insufficient)
    if (!text || text.length < 50) {
      try {
        text = await extractTextFromPdfViaImage(buffer);
      } catch (ocrError) {
        // Check if it's a system dependency issue
        const isSystemDependencyError = 
          ocrError.message.includes("Library not loaded") ||
          ocrError.message.includes("dyld") ||
          ocrError.message.includes("cairo") ||
          ocrError.message.includes("poppler-utils");
        
        if (isSystemDependencyError) {
          console.warn("[PDF Service] OCR unavailable - system dependencies missing (cairo/poppler). Install via: brew install cairo poppler");
          // If OCR is unavailable due to missing system deps, return whatever text we have
          if (!text || text.length < 10) {
            throw new Error("PDF text extraction failed. Digital extraction returned insufficient text and OCR is unavailable (missing system dependencies). Please install: brew install cairo poppler");
          }
          // Return the text we have, even if it's less than 50 chars
          console.warn(`[PDF Service] Returning ${text.length} characters from digital extraction (OCR unavailable)`);
          return text;
        }
        
        console.error("[PDF Service] OCR fallback failed:", ocrError.message);
        // For other OCR errors, throw if we have no text at all
        if (!text) {
          throw new Error(`Failed to extract text: ${ocrError.message}`);
        }
        // If we have some text, return it even if short
        console.warn(`[PDF Service] OCR failed, returning ${text.length} characters from digital extraction`);
        return text;
      }
    }

    if (!text || text.length < 50) {
      throw new Error("Failed to extract readable text from PDF (minimum 50 characters required)");
    }

    return text;
  } catch (error) {
    console.error("[PDF Service] extractPdfText error:", error.message);
    throw error;
  }
}
