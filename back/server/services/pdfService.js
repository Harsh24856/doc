import pdf from "pdf-parse";
import supabaseAdmin from "../Admin.js";
import visionClient from "./googleVisionClient.js";

import fs from "fs";
import path from "path";
import os from "os";
import pdfPoppler from "pdf-poppler";

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

  // Create temp directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pdf-ocr-"));

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
  const imageBuffer = fs.readFileSync(imagePath);

  // OCR image with Google Vision
  const [result] = await visionClient.documentTextDetection({
    image: {
      content: imageBuffer.toString("base64"),
    },
  });

  // Cleanup temp files
  fs.rmSync(tempDir, { recursive: true, force: true });

  const fullText = result?.fullTextAnnotation?.text || "";
  return fullText.trim();
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

  const buffer = await fetchPdfBuffer(filePath);

  //  Try digital PDF text
  let text = await extractTextFromPdf(buffer);

  // Fallback: scanned PDF OCR
  if (!text || text.length < 50) {
    text = await extractTextFromPdfViaImage(buffer);
  }

  if (!text || text.length < 50) {
    throw new Error("Failed to extract readable text from PDF");
  }

  return text;
}
