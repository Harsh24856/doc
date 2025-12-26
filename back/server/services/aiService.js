import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/**
 * Generate AI insights for hospital verification documents
 * (Gemini-compatible, assistive only)
 */
export async function generateDocumentInsights({
  documentType,
  extractedText,
  hospitalProfile,
}) {
  if (!extractedText || extractedText.length < 50) {
    throw new Error("Insufficient text for AI analysis");
  }

  const prompt = `
You are an assistant helping an admin review hospital verification documents.

IMPORTANT RULES:
- Do NOT approve or reject documents.
- Do NOT say "valid" or "invalid".
- Only extract information and highlight potential issues.
- Be factual and conservative.
- Output ONLY valid JSON.
- Do NOT include explanations outside JSON.

Document type: ${documentType}

Hospital profile (for comparison):
${JSON.stringify(hospitalProfile, null, 2)}

Extracted document text:
"""
${extractedText}
"""

Return JSON in the EXACT format below:
{
  "document_type": "${documentType}",
  "extracted_fields": {
    "hospital_name": "",
    "registration_number": "",
    "issuing_authority": "",
    "address": "",
    "valid_from": "",
    "valid_till": ""
  },
  "observations": [],
  "risk_flags": [],
  "confidence": "low | medium | high"
}

Guidelines:
- If information is missing, leave it empty.
- Add observations only if relevant.
- Add risk_flags only if something needs admin attention.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });

  const rawText = response.text;
  const cleanedText = rawText
  .replace(/```json/i, "")
  .replace(/```/g, "")
  .trim();


  try {
    return JSON.parse(cleanedText);
  } catch (err) {
    console.error("RAW GEMINI OUTPUT:", rawText);
    throw new Error("Gemini returned invalid JSON");
  }
}
