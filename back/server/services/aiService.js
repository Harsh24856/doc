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
You are an assistant helping an admin review hospital verification documents for the DocSpace platform.

IMPORTANT RULES (STRICT):
- Do NOT approve or reject documents.
- Do NOT say "valid" or "invalid".
- Do NOT make legal or compliance conclusions.
- Only extract information and highlight potential issues.
- Be factual, conservative, and neutral.
- Output ONLY valid JSON.
- Do NOT include explanations outside JSON.
- If unsure, leave fields empty and lower confidence.

Document type (expected): ${documentType}

Hospital profile (for comparison):
${JSON.stringify(hospitalProfile, null, 2)}

DOCUMENT INTERPRETATION RULES:

If document_type is "registration":
- This document proves the hospital is officially registered.
- Expect registration-related language such as:
  "registered under", "registration number", "act", "establishment".
- Issuing authority is usually a government or statutory body.
- Validity dates may be missing or perpetual.
- Registration documents do NOT authorize individuals.
- Authorization-style language indicates a mismatch.

If document_type is "authorization":
- This is an INTERNAL hospital-issued document.
- Purpose: authorizing a specific person to register or manage the hospital on the DocSpace platform.
- Expect explicit authorization language such as:
  "we hereby authorize", "authorized representative",
  "authorized signatory", "on behalf of the hospital".
- Expect the name of the authorized person.
- Expect hospital name to be clearly mentioned.
- Purpose should reference DocSpace, online registration, hospital profile management, or similar.
- Issuing authority should be the hospital itself, not a government body.
- Registration certificates, licenses, or government-issued documents submitted here indicate a mismatch.

If document_type is "address":
- Expect address-related content only.
- Registration numbers and authorization language may be absent.
- Address should broadly match hospital city/state.
- Registration or authorization documents submitted as address proof indicate a mismatch.

DOCUMENT TYPE CONSISTENCY CHECK (CRITICAL):
- First infer what the document content most likely represents based on language and structure.
- Compare the inferred document purpose with the provided document_type.
- If the document content appears to represent a DIFFERENT document type than document_type:
  - Set confidence to "low".
  - Add a clear risk_flag explaining the mismatch.
  - Still extract fields if possible.
- This is NOT a rejection, only a classification concern for admin review.

GENERAL COMPARISON RULES:
- Minor spelling variations are acceptable.
- Major mismatches in hospital name or context reduce confidence.
- Missing expected fields reduce confidence.
- Multiple inconsistencies should result in low confidence.

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
- Leave fields empty if not found.
- Add observations only if relevant.
- Add risk_flags only if admin attention is required.
- Confidence must reflect correctness, completeness, AND whether the document matches its expected purpose.
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
