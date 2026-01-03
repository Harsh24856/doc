import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";
import supabaseAdmin from "../Admin.js";
import fetch from "node-fetch";
import FormData from "form-data";

const router = express.Router();

 const normalize = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ") // remove dots, commas, numbers
    .replace(/\s+/g, " ")
    .trim();
  
  const getTokens = (str) =>
  str
    .split(" ")
    .filter(
      (w) =>
        w.length >= 3 &&                 // avoid "dr", "mr", "r"
        !["dr", "mr", "ms", "mrs"].includes(w)
    );

const safeNameMatch = (a, b) => {
   if (!a || !b) return false;

   const na = normalize(a);
   const nb = normalize(b);

   // Rule 1: Minimum length safeguard
   if (na.length < 6 || nb.length < 6) return false;

   const ta = getTokens(na);
   const tb = getTokens(nb);

   if (ta.length === 0 || tb.length === 0) return false;

  const matches = ta.filter(t => tb.includes(t));

   // Rule 2: Require strong overlap
    return (
     matches.length >= 2 ||                       // at least 2 words match
     matches.length / Math.min(ta.length, tb.length) >= 0.6
      );
   };

 const safeCouncilMatch = (a, b) => {
   if (!a || !b) return false;

    const na = normalize(a);
    const nb = normalize(b);

    if (na.length < 6 || nb.length < 6) return false;

     return (
        na === nb ||
        na.includes(nb) && nb.length >= 6 ||
        nb.includes(na) && na.length >= 6
      );
  };

/* =========================
   ADMIN ONLY
   ========================= */
const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access only" });
  }
  next();
};

/* =========================
   HELPERS
   ========================= */
const normalizeText = (v) =>
  String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeNumber = (v) =>
  String(v || "").replace(/\D/g, "");

/* =========================
   AI VERIFICATION
   ========================= */
router.post(
  "/:userId/ai-check",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[Verification] 🤖 Starting AI check for user: ${userId}`);

      const { data: user } = await supabase
        .from("users")
        .select("name, role, registration_number, registration_council, year_of_graduation, license_doc_url, id_doc_url")
        .eq("id", userId)
        .single();

      if (!user) {
        console.error(`[Verification] ❌ User not found: ${userId}`);
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`[Verification] 👤 User found: ${user.name} (${user.role})`);
      const isDoctor = user.role === "doctor";

      const normalize = (v) =>
        String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const userName = normalize(user.name);

      /* =========================
         DOWNLOAD FILES
         ========================= */
      const download = async (path, type) => {
        if (!path) {
          console.log(`[Verification] ⚠️  No ${type} document path provided`);
          return null;
        }
        try {
          if (path.startsWith("http")) {
            path = path.split("/storage/v1/object/")[1]?.split("?")[0];
          }
          console.log(`[Verification] 📥 Downloading ${type} document: ${path}`);
          const { data, error } = await supabaseAdmin.storage
            .from("verification-docs")
            .download(path);
          
          if (error) {
            console.error(`[Verification] ❌ Error downloading ${type}:`, error.message);
            return null;
          }
          
          if (!data) {
            console.error(`[Verification] ❌ No data returned for ${type} download`);
            return null;
          }
          
          console.log(`[Verification] ✅ ${type} document downloaded successfully`);
          return Buffer.from(await data.arrayBuffer());
        } catch (err) {
          console.error(`[Verification] ❌ Exception downloading ${type}:`, err.message);
          return null;
        }
      };

      const licenseBuffer = await download(user.license_doc_url, "license");
      const idBuffer = await download(user.id_doc_url, "ID");

      if (!licenseBuffer) {
        console.error(`[Verification] ❌ License document missing for user ${userId}`);
        return res.status(400).json({ error: "License document missing" });
      }

      /* =========================
         PARALLEL REQUESTS (PLAYWRIGHT FIRST PRIORITY)
         ========================= */
      const ML = process.env.ML_SERVICE_URL || "http://localhost:8001";
      const PW = process.env.PLAYWRIGHT_SERVICE_URL || "http://localhost:9000";
      console.log(`[Verification] 🔗 ML Service: ${ML}, Playwright Service: ${PW}`);

      const tasks = [];
      let registryIndex = -1;
      let licenseIndex = -1;
      let idIndex = -1;

      // 🥇 FIRST PRIORITY: Registry Check (Playwright)
      if (isDoctor) {
        console.log(`[Verification] 🥇 [PRIORITY] Sending registry check to ${PW}/mci-check`);
        registryIndex = tasks.length;
        tasks.push(
          fetch(`${PW}/mci-check`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: user.name,
              registration_number: user.registration_number,
            }),
          })
        );
      } else {
        console.log(`[Verification] ⚠️  Skipping registry check - not a doctor`);
      }

      // License OCR
      console.log(`[Verification] 📤 Sending license OCR request to ${ML}/extract-license`);
      licenseIndex = tasks.length;
      const licenseForm = new FormData();
      licenseForm.append("file", licenseBuffer, {
        filename: "license.pdf",
        contentType: "application/pdf",
      });

      tasks.push(
        fetch(`${ML}/extract-license`, { method: "POST", body: licenseForm })
      );

      // ID OCR
      if (idBuffer) {
        console.log(`[Verification] 📤 Sending ID OCR request to ${ML}/extract-id-license`);
        idIndex = tasks.length;
        const idForm = new FormData();
        idForm.append("file", idBuffer, {
          filename: "id.pdf",
          contentType: "application/pdf",
        });
        tasks.push(
          fetch(`${ML}/extract-id-license`, { method: "POST", body: idForm })
        );
      } else {
        console.log(`[Verification] ⚠️  Skipping ID OCR - no ID document`);
      }

      console.log(`[Verification] ⏳ Waiting for ${tasks.length} parallel requests...`);
      const responses = await Promise.allSettled(tasks);
      console.log(`[Verification] ✅ All requests completed`);

      /* =========================
         SCORE CALCULATION
         ========================= */
      let licenseScore = 0;
      let idScore = 0;
      let registryScore = 0;

      let extracted_license = null;
      let extracted_id = null;
      let registry_result = null;

      console.log(`[Verification] 🧮 Processing ${responses.length} responses...`);
      console.log(`[Verification] 📍 Response indices - Registry: ${registryIndex >= 0 ? registryIndex : 'N/A'}, License: ${licenseIndex}, ID: ${idIndex >= 0 ? idIndex : 'N/A'}`);
      
      for (let i = 0; i < responses.length; i++) {
        const r = responses[i];
        const serviceName = i === registryIndex ? "🏥 Registry (PRIORITY)" : 
                           i === licenseIndex ? "📜 License OCR" : 
                           i === idIndex ? "🆔 ID OCR" : `Request ${i + 1}`;
        
        if (r.status !== "fulfilled") {
          console.error(`[Verification] ❌ ${serviceName} failed:`, r.reason?.message || "Unknown error");
          continue;
        }

        if (!r.value?.ok) {
          console.error(`[Verification] ❌ ${serviceName} returned status: ${r.value?.status}`);
          continue;
        }

        try {
          const data = await r.value.json();
          console.log(`[Verification] 📦 ${serviceName} response data:`, JSON.stringify(data, null, 2));

          // Registry (FIRST PRIORITY)
          if (i === registryIndex) {
            console.log(`[Verification] 🥇 [PRIORITY] Registry check result: ${data.status || "UNKNOWN"}`);
            
            // Process registry result for both SUCCESS and ERROR cases (if data exists)
            if (data.status === "SUCCESS" || data.status === "ERROR") {
              // Playwright returns 'result', map it to 'record' for consistency
              const registryData = data.result || data.record;
              console.log(`[Verification] 🔍 Registry data check - result: ${!!data.result}, record: ${!!data.record}, registryData: ${!!registryData}`);
              
              // Store full result with both 'result' and 'record' for compatibility
              registry_result = {
                ...data,
                record: registryData,
                result: registryData
              };

              if (registryData && data.status === "SUCCESS") {
                // Check if data is valid (not all N/A)
                const hasValidData = registryData.registration_number && 
                                     registryData.registration_number !== "N/A" &&
                                     registryData.name && 
                                     registryData.name !== "N/A";

                if (hasValidData) {
                  // New scoring rules: +20 for each match
                  let score = 0;
                  
                  // Normalize data for comparison
                  const rn = normalize(registryData.name);
                  const rr = normalize(registryData.registration_number);
                  const ur = normalize(user.registration_number);
                  const rc = normalize(registryData.council || "");
                  const uc = normalize(user.registration_council || "");


                  
                  // Rule 1: Name match (+20)
                  if (safeNameMatch(userName, rn)) {
                    score += 20;
                    console.log(`[Verification] ✅ Registry Rule 1: Name match (+20)`);
                  } else {
                    console.log(`[Verification] ❌ Registry Rule 1: Name mismatch`);
                  }
                  
                  // Rule 2: Council match (+20)
                  if (safeCouncilMatch(rc, uc)) {
                    score += 20;
                    console.log(`[Verification] ✅ Registry Rule 2: Council match (+20)`);
                  } else {
                    console.log(`[Verification] ❌ Registry Rule 2: Council mismatch (IMR: ${registryData.council || "N/A"}, DB: ${user.registration_council || "N/A"})`);
                  }
                  
                  // Rule 3: Registration number match (+20)
                  if (rr && ur && rr === ur) {
                    score += 20;
                    console.log(`[Verification] ✅ Registry Rule 3: Registration number match (+20)`);
                  } else {
                    console.log(`[Verification] ❌ Registry Rule 3: Registration number mismatch`);
                  }
                  
                  // Rule 4: Year matches year_of_graduation (+20)
                  if (registryData.year && user.year_of_graduation) {
                    const registryYear = parseInt(registryData.year, 10);
                    const userGraduationYear = parseInt(user.year_of_graduation, 10);
                    
                    // Check if graduation year matches (exact match or within 1 year tolerance)
                    if (registryYear === userGraduationYear || Math.abs(registryYear - userGraduationYear) <= 1) {
                      score += 20;
                      console.log(`[Verification] ✅ Registry Rule 4: Year matches graduation (+20) (Registry Year: ${registryYear}, User Graduation: ${userGraduationYear})`);
                    } else {
                      console.log(`[Verification] ❌ Registry Rule 4: Year doesn't match graduation (Registry Year: ${registryYear}, User Graduation: ${userGraduationYear})`);
                    }
                  } else {
                    console.log(`[Verification] ❌ Registry Rule 4: Missing year or graduation data (Year: ${registryData.year || "N/A"}, Graduation: ${user.year_of_graduation || "N/A"})`);
                  }
                  
                  registryScore = score;
                  console.log(`[Verification] 📊 Registry Total Score: ${registryScore}/80`);
                  console.log(`[Verification] 📋 Registry Data:`, JSON.stringify(registryData, null, 2));
                } else {
                  console.log(`[Verification] ⚠️  No valid registry data found (all N/A)`);
                  console.log(`[Verification] 📋 Registry Data:`, JSON.stringify(registryData, null, 2));
                }
              } else if (data.status === "ERROR") {
                console.log(`[Verification] ⚠️  Registry check failed with error: ${data.error || "Unknown error"}`);
                console.log(`[Verification] 📋 Registry result stored but no score assigned due to error`);
              } else {
                console.log(`[Verification] ⚠️  No registry data received`);
              }
            } else {
              console.log(`[Verification] ⚠️  Unexpected registry status: ${data.status}`);
            }
          }
          // License OCR
          else if (i === licenseIndex && data.structured_certificate) {
            console.log(`[Verification] 📜 License OCR result received`);
            extracted_license = data.structured_certificate;
            const n = normalize(extracted_license.name);
            licenseScore = n
              ? (userName.includes(n) || n.includes(userName) ? 10 : 5)
              : 0;
            console.log(`[Verification] 📊 License OCR Score: ${licenseScore} (extracted name: ${extracted_license.name || "N/A"})`);
          }
          // ID OCR
          else if (i === idIndex && data.structured_id) {
            console.log(`[Verification] 🆔 ID OCR result received`);
            extracted_id = data.structured_id;
            const n = normalize(extracted_id.name);
            idScore = n
              ? (userName.includes(n) || n.includes(userName) ? 10 : 5)
              : 0;
            console.log(`[Verification] 📊 ID OCR Score: ${idScore} (extracted name: ${extracted_id.name || "N/A"})`);
          }
          // Fallback: detect by data structure
          else {
            if (data.structured_certificate) {
              console.log(`[Verification] 📜 License OCR result received (detected)`);
              extracted_license = data.structured_certificate;
              const n = normalize(extracted_license.name);
              licenseScore = n
                ? (userName.includes(n) || n.includes(userName) ? 10 : 5)
                : 0;
            }
            if (data.structured_id) {
              console.log(`[Verification] 🆔 ID OCR result received (detected)`);
              extracted_id = data.structured_id;
              const n = normalize(extracted_id.name);
              idScore = n
                ? (userName.includes(n) || n.includes(userName) ? 10 : 5)
                : 0;
            }
            // Playwright returns 'result', check both 'result' and 'record' for compatibility (fallback detection)
            const registryData = data.result || data.record;
            if ((data.status === "SUCCESS" || data.status === "ERROR") && registryData) {
              console.log(`[Verification] 🏥 Registry check result: ${data.status} (detected in fallback)`);
              // Store full result with both 'result' and 'record' for compatibility
              registry_result = {
                ...data,
                record: registryData,
                result: registryData
              };
              
              // Only score if status is SUCCESS and data is valid
              if (data.status === "SUCCESS") {
                // Check if data is valid (not all N/A)
                const hasValidData = registryData.registration_number && 
                                     registryData.registration_number !== "N/A" &&
                                     registryData.name && 
                                     registryData.name !== "N/A";

                if (hasValidData) {
                  // New scoring rules: +20 for each match
                  let score = 0;
                  
                  // Normalize data for comparison
                  const rn = normalize(registryData.name);
                  const rr = normalize(registryData.registration_number);
                  const ur = normalize(user.registration_number);
                  const rc = normalize(registryData.council || "");
                  const uc = normalize(user.registration_council || "");
                  
                  // Rule 1: Name match (+20)
                  if (safeNameMatch(userName, rn)) {
                    score += 20;
                    console.log(`[Verification] ✅ Registry Rule 1: Name match (+20)`);
                  } else {
                    console.log(`[Verification] ❌ Registry Rule 1: Name mismatch`);
                  }
                  
                  // Rule 2: Council match (+20)
                  if (safeCouncilMatch(rc, uc)) {
                    score += 20;
                    console.log(`[Verification] ✅ Registry Rule 2: Council match (+20)`);
                  } else {
                    console.log(`[Verification] ❌ Registry Rule 2: Council mismatch (IMR: ${registryData.council || "N/A"}, DB: ${user.registration_council || "N/A"})`);
                  }
                  
                  // Rule 3: Registration number match (+20)
                  if (rr && ur && rr === ur) {
                    score += 20;
                    console.log(`[Verification] ✅ Registry Rule 3: Registration number match (+20)`);
                  } else {
                    console.log(`[Verification] ❌ Registry Rule 3: Registration number mismatch`);
                  }
                  
                  // Rule 4: Year matches year_of_graduation (+20)
                  if (registryData.year && user.year_of_graduation) {
                    const registryYear = parseInt(registryData.year, 10);
                    const userGraduationYear = parseInt(user.year_of_graduation, 10);
                    
                    // Check if graduation year matches (exact match or within 1 year tolerance)
                    if (registryYear === userGraduationYear || Math.abs(registryYear - userGraduationYear) <= 1) {
                      score += 20;
                      console.log(`[Verification] ✅ Registry Rule 4: Year matches graduation (+20) (Registry Year: ${registryYear}, User Graduation: ${userGraduationYear})`);
                    } else {
                      console.log(`[Verification] ❌ Registry Rule 4: Year doesn't match graduation (Registry Year: ${registryYear}, User Graduation: ${userGraduationYear})`);
                    }
                  } else {
                    console.log(`[Verification] ❌ Registry Rule 4: Missing year or graduation data (Year: ${registryData.year || "N/A"}, Graduation: ${user.year_of_graduation || "N/A"})`);
                  }
                  
                  registryScore = score;
                  console.log(`[Verification] 📊 Registry Total Score: ${registryScore}/80`);
                  console.log(`[Verification] 📋 Registry Data:`, JSON.stringify(registryData, null, 2));
                } else {
                  console.log(`[Verification] ⚠️  No valid registry data found (all N/A)`);
                  console.log(`[Verification] 📋 Registry Data:`, JSON.stringify(registryData, null, 2));
                }
              } else if (data.status === "ERROR") {
                console.log(`[Verification] ⚠️  Registry check failed with error: ${data.error || "Unknown error"}`);
                console.log(`[Verification] 📋 Registry result stored but no score assigned due to error`);
              }
            }
          }
        } catch (err) {
          console.error(`[Verification] ❌ Error parsing ${serviceName} response:`, err.message);
        }
      }

      const verification_score = registryScore + licenseScore + idScore;

      let verification_status = "FAILED";
      if (verification_score === 100) verification_status = "VERIFIED";
      else if (verification_score >= 50) verification_status = "PARTIALLY_VERIFIED";

      console.log(`[Verification] 🎯 Final Score: ${verification_score}/100`);
      console.log(`[Verification] 📊 Breakdown: Registry(${registryScore}) + License(${licenseScore}) + ID(${idScore})`);
      console.log(`[Verification] ✅ Verification Status: ${verification_status}`);

      res.json({
        name: user.name,
        role: user.role,
        verification_score,
        verification_status,
        breakdown: {
          registry_score: registryScore,
          license_ocr_score: licenseScore,
          id_ocr_score: idScore,
        },
        extracted_license,
        extracted_id,
        registry_result,
        method: isDoctor
          ? "Registry(80) + License OCR(10) + ID OCR(10)"
          : "License OCR(10) + ID OCR(10)",
      });
    } catch (err) {
      console.error("[Verification] ❌ AI CHECK ERROR:", err.message);
      console.error("[Verification] ❌ Stack trace:", err.stack);
      res.status(500).json({ error: err.message });
    }
  }
);

/* =========================
   SUBMIT VERIFICATION
   ========================= */
router.post("/submit", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { license_doc_url, id_doc_url, registration_council } = req.body;

    if (!license_doc_url || !id_doc_url) {
      return res.status(400).json({ error: "Both license and ID documents are required" });
    }

    // Check if user already has a pending or approved verification
    const { data: existingUser, error: userError } = await supabase
      .from("users")
      .select("verification_status")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("[Verification Submit] Error fetching user:", userError);
      return res.status(500).json({ error: "Failed to fetch user data" });
    }

    if (existingUser?.verification_status === "pending") {
      return res.status(400).json({ error: "Verification already submitted and pending review" });
    }

    if (existingUser?.verification_status === "approved" || existingUser?.verification_status === "verified") {
      return res.status(400).json({ error: "User is already verified" });
    }

    // Allow resubmission if rejected or if status is null/not_submitted

    // Update user with verification documents and set status to pending
    const { error: updateError } = await supabase
      .from("users")
      .update({
        license_doc_url,
        id_doc_url,
        registration_council: registration_council || null,
        verification_status: "pending",
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[Verification Submit] Error updating user:", updateError);
      return res.status(500).json({ error: "Failed to submit verification" });
    }

    console.log(`[Verification Submit] ✅ Verification submitted for user: ${userId}`);
    res.json({
      message: "Verification submitted successfully",
      verification_status: "pending",
    });
  } catch (err) {
    console.error("[Verification Submit] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;