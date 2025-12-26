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

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is not set");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    // Handle different response formats
    let rawText;
    if (typeof response.text === 'string') {
      rawText = response.text;
    } else if (response.response && response.response.text) {
      rawText = response.response.text;
    } else if (response.candidates && response.candidates[0] && response.candidates[0].content) {
      rawText = response.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected response format:", JSON.stringify(response, null, 2));
      throw new Error("Unexpected response format from Gemini API");
    }

    const cleanedText = rawText
      .replace(/```json/i, "")
      .replace(/```/g, "")
      .trim();

    try {
      return JSON.parse(cleanedText);
    } catch (parseErr) {
      console.error("RAW GEMINI OUTPUT:", rawText);
      console.error("JSON Parse Error:", parseErr.message);
      throw new Error(`Gemini returned invalid JSON: ${parseErr.message}`);
    }
  } catch (err) {
    console.error("[aiService] Error calling Gemini API:", err.message);
    console.error("[aiService] Error stack:", err.stack);
    throw err;
  }
}
