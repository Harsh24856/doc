import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";
import supabaseAdmin from "../Admin.js";
import fetch from "node-fetch";
import FormData from "form-data";

const router = express.Router();

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
   GET PENDING USERS
   ========================= */
router.get("/verifications/pending", auth, adminOnly, async (req, res) => {
  console.log("[Admin] 📋 Fetching pending verifications");
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
      role,
        registration_number,
        registration_council,
        years_of_experience,
        verification_status,
      license_doc_url,
      id_doc_url
      `)
      .eq("verification_status", "pending");

  if (error) {
    console.error("[Admin] ❌ Error fetching pending:", error.message);
    return res.status(500).json({ error: error.message });
  }
  console.log(`[Admin] ✅ Found ${data?.length || 0} pending verifications`);
  res.json(data);
});

/* =========================
   GET DOCUMENT (SIGNED URL)
   ========================= */
router.get(
  "/verifications/:userId/document/:type",
  auth,
  adminOnly,
  async (req, res) => {
      const { userId, type } = req.params;
    console.log(`[Admin] 📄 Getting ${type} document for user: ${userId}`);

      if (!["license", "id"].includes(type)) {
      console.error(`[Admin] ❌ Invalid document type: ${type}`);
        return res.status(400).json({ error: "Invalid document type" });
      }

    const { data: user } = await supabase
        .from("users")
        .select(`${type}_doc_url`)
        .eq("id", userId)
        .single();

    if (!user || !user[`${type}_doc_url`]) {
      console.error(`[Admin] ❌ Document not found for user ${userId}, type: ${type}`);
      return res.status(404).json({ error: "Document not found" });
      }

    let path = user[`${type}_doc_url`];
    if (path.startsWith("http")) {
      path = path.split("/storage/v1/object/")[1]?.split("?")[0];
      }

    const { data, error } =
        await supabaseAdmin.storage
          .from("verification-docs")
        .createSignedUrl(path, 3600);

    if (error) {
      console.error(`[Admin] ❌ Error creating signed URL:`, error.message);
      return res.status(500).json({ error: error.message });
      }
    console.log(`[Admin] ✅ Signed URL created for ${type} document`);
    res.json({ url: data.signedUrl });
  }
);

/* =========================
   AI VERIFICATION
   ========================= */
router.post(
  "/verifications/:userId/ai-check",
  auth,
  adminOnly,
  async (req, res) => {
    try {
      const { userId } = req.params;
      console.log(`[Admin] 🤖 Starting AI check for user: ${userId}`);

      const { data: user } = await supabase
        .from("users")
        .select("name, role, registration_number, registration_council, years_of_experience, license_doc_url, id_doc_url")
        .eq("id", userId)
        .single();

      if (!user) {
        console.error(`[Admin] ❌ User not found: ${userId}`);
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`[Admin] 👤 User found: ${user.name} (${user.role})`);
      const isDoctor = user.role === "doctor";

      const normalize = (v) =>
        String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const userName = normalize(user.name);

      /* =========================
         DOWNLOAD FILES
         ========================= */
      const download = async (path, type) => {
        if (!path) {
          console.log(`[Admin] ⚠️  No ${type} document path provided`);
          return null;
        }
        try {
          if (path.startsWith("http")) {
            path = path.split("/storage/v1/object/")[1]?.split("?")[0];
      }
          console.log(`[Admin] 📥 Downloading ${type} document: ${path}`);
          const { data, error } = await supabaseAdmin.storage
          .from("verification-docs")
            .download(path);
          
          if (error) {
            console.error(`[Admin] ❌ Error downloading ${type}:`, error.message);
            return null;
          }
          
          if (!data) {
            console.error(`[Admin] ❌ No data returned for ${type} download`);
            return null;
          }
          
          console.log(`[Admin] ✅ ${type} document downloaded successfully`);
          return Buffer.from(await data.arrayBuffer());
        } catch (err) {
          console.error(`[Admin] ❌ Exception downloading ${type}:`, err.message);
          return null;
        }
      };

      const licenseBuffer = await download(user.license_doc_url, "license");
      const idBuffer = await download(user.id_doc_url, "ID");

      if (!licenseBuffer) {
        console.error(`[Admin] ❌ License document missing for user ${userId}`);
        return res.status(400).json({ error: "License document missing" });
      }

      /* =========================
         PARALLEL REQUESTS (PLAYWRIGHT FIRST PRIORITY)
         ========================= */
      const ML = process.env.ML_SERVICE_URL || "http://localhost:8001";
      const PW = process.env.PLAYWRIGHT_SERVICE_URL || "http://localhost:9000";
      console.log(`[Admin] 🔗 ML Service: ${ML}, Playwright Service: ${PW}`);

      const tasks = [];
      let registryIndex = -1;
      let licenseIndex = -1;
      let idIndex = -1;

      // 🥇 FIRST PRIORITY: Registry Check (Playwright)
      if (isDoctor) {
        console.log(`[Admin] 🥇 [PRIORITY] Sending registry check to ${PW}/mci-check`);
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
        console.log(`[Admin] ⚠️  Skipping registry check - not a doctor`);
      }

      // License OCR
      console.log(`[Admin] 📤 Sending license OCR request to ${ML}/extract-license`);
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
        console.log(`[Admin] 📤 Sending ID OCR request to ${ML}/extract-id-license`);
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
        console.log(`[Admin] ⚠️  Skipping ID OCR - no ID document`);
      }

      console.log(`[Admin] ⏳ Waiting for ${tasks.length} parallel requests...`);
      const responses = await Promise.allSettled(tasks);
      console.log(`[Admin] ✅ All requests completed`);

      /* =========================
         SCORE CALCULATION
         ========================= */
      let licenseScore = 0;
      let idScore = 0;
      let registryScore = 0;

      let extracted_license = null;
      let extracted_id = null;
      let registry_result = null;

      console.log(`[Admin] 🧮 Processing ${responses.length} responses...`);
      console.log(`[Admin] 📍 Response indices - Registry: ${registryIndex >= 0 ? registryIndex : 'N/A'}, License: ${licenseIndex}, ID: ${idIndex >= 0 ? idIndex : 'N/A'}`);
      
      for (let i = 0; i < responses.length; i++) {
        const r = responses[i];
        const serviceName = i === registryIndex ? "🏥 Registry (PRIORITY)" : 
                           i === licenseIndex ? "📜 License OCR" : 
                           i === idIndex ? "🆔 ID OCR" : `Request ${i + 1}`;
        
        if (r.status !== "fulfilled") {
          console.error(`[Admin] ❌ ${serviceName} failed:`, r.reason?.message || "Unknown error");
          continue;
        }

        if (!r.value?.ok) {
          console.error(`[Admin] ❌ ${serviceName} returned status: ${r.value?.status}`);
          continue;
        }

        try {
          const data = await r.value.json();
          console.log(`[Admin] 📦 ${serviceName} response data:`, JSON.stringify(data, null, 2));

          // Registry (FIRST PRIORITY)
          if (i === registryIndex) {
            console.log(`[Admin] 🥇 [PRIORITY] Registry check result: ${data.status || "UNKNOWN"}`);
            
            // Process registry result for both SUCCESS and ERROR cases (if data exists)
            if (data.status === "SUCCESS" || data.status === "ERROR") {
              // Playwright returns 'result', map it to 'record' for consistency
              const registryData = data.result || data.record;
              console.log(`[Admin] 🔍 Registry data check - result: ${!!data.result}, record: ${!!data.record}, registryData: ${!!registryData}`);
              
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
                  if (rn && (userName.includes(rn) || rn.includes(userName))) {
                    score += 20;
                    console.log(`[Admin] ✅ Registry Rule 1: Name match (+20)`);
                  } else {
                    console.log(`[Admin] ❌ Registry Rule 1: Name mismatch`);
                  }
                  
                  // Rule 2: Council match (+20)
                  if (rc && uc && (rc === uc || rc.includes(uc) || uc.includes(rc))) {
                    score += 20;
                    console.log(`[Admin] ✅ Registry Rule 2: Council match (+20)`);
                  } else {
                    console.log(`[Admin] ❌ Registry Rule 2: Council mismatch (IMR: ${registryData.council || "N/A"}, DB: ${user.registration_council || "N/A"})`);
                  }
                  
                  // Rule 3: Registration number match (+20)
                  if (rr && ur && rr === ur) {
                    score += 20;
                    console.log(`[Admin] ✅ Registry Rule 3: Registration number match (+20)`);
                  } else {
                    console.log(`[Admin] ❌ Registry Rule 3: Registration number mismatch`);
                  }
                  
                  // Rule 4: Year matches years_of_experience (+20)
                  if (registryData.year && user.years_of_experience) {
                    const registryYear = parseInt(registryData.year, 10);
                    const currentYear = new Date().getFullYear();
                    const expectedYearsOfExp = currentYear - registryYear;
                    const userYearsOfExp = parseInt(user.years_of_experience, 10);
                    
                    // Check if years of experience match (within 1 year tolerance)
                    if (Math.abs(expectedYearsOfExp - userYearsOfExp) <= 1) {
                      score += 20;
                      console.log(`[Admin] ✅ Registry Rule 4: Year matches experience (+20) (Registry Year: ${registryYear}, Expected Exp: ${expectedYearsOfExp}, User Exp: ${userYearsOfExp})`);
                    } else {
                      console.log(`[Admin] ❌ Registry Rule 4: Year doesn't match experience (Registry Year: ${registryYear}, Expected Exp: ${expectedYearsOfExp}, User Exp: ${userYearsOfExp})`);
                    }
                  } else {
                    console.log(`[Admin] ❌ Registry Rule 4: Missing year or experience data (Year: ${registryData.year || "N/A"}, Exp: ${user.years_of_experience || "N/A"})`);
                  }
                  
                  registryScore = score;
                  console.log(`[Admin] 📊 Registry Total Score: ${registryScore}/80`);
                  console.log(`[Admin] 📋 Registry Data:`, JSON.stringify(registryData, null, 2));
                } else {
                  console.log(`[Admin] ⚠️  No valid registry data found (all N/A)`);
                  console.log(`[Admin] 📋 Registry Data:`, JSON.stringify(registryData, null, 2));
                }
              } else if (data.status === "ERROR") {
                console.log(`[Admin] ⚠️  Registry check failed with error: ${data.error || "Unknown error"}`);
                console.log(`[Admin] 📋 Registry result stored but no score assigned due to error`);
              } else {
                console.log(`[Admin] ⚠️  No registry data received`);
              }
            } else {
              console.log(`[Admin] ⚠️  Unexpected registry status: ${data.status}`);
            }
          }
          // License OCR
          else if (i === licenseIndex && data.structured_certificate) {
            console.log(`[Admin] 📜 License OCR result received`);
            extracted_license = data.structured_certificate;
            const n = normalize(extracted_license.name);
            licenseScore = n
              ? (userName.includes(n) || n.includes(userName) ? 10 : 5)
              : 0;
            console.log(`[Admin] 📊 License OCR Score: ${licenseScore} (extracted name: ${extracted_license.name || "N/A"})`);
          }
          // ID OCR
          else if (i === idIndex && data.structured_id) {
            console.log(`[Admin] 🆔 ID OCR result received`);
            extracted_id = data.structured_id;
            const n = normalize(extracted_id.name);
            idScore = n
              ? (userName.includes(n) || n.includes(userName) ? 10 : 5)
              : 0;
            console.log(`[Admin] 📊 ID OCR Score: ${idScore} (extracted name: ${extracted_id.name || "N/A"})`);
          }
          // Fallback: detect by data structure
          else {
            if (data.structured_certificate) {
              console.log(`[Admin] 📜 License OCR result received (detected)`);
              extracted_license = data.structured_certificate;
              const n = normalize(extracted_license.name);
              licenseScore = n
                ? (userName.includes(n) || n.includes(userName) ? 10 : 5)
                : 0;
            }
            if (data.structured_id) {
              console.log(`[Admin] 🆔 ID OCR result received (detected)`);
              extracted_id = data.structured_id;
              const n = normalize(extracted_id.name);
              idScore = n
                ? (userName.includes(n) || n.includes(userName) ? 10 : 5)
                : 0;
            }
            // Playwright returns 'result', check both 'result' and 'record' for compatibility (fallback detection)
            const registryData = data.result || data.record;
            if ((data.status === "SUCCESS" || data.status === "ERROR") && registryData) {
              console.log(`[Admin] 🏥 Registry check result: ${data.status} (detected in fallback)`);
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
                  if (rn && (userName.includes(rn) || rn.includes(userName))) {
                    score += 20;
                    console.log(`[Admin] ✅ Registry Rule 1: Name match (+20)`);
                  } else {
                    console.log(`[Admin] ❌ Registry Rule 1: Name mismatch`);
                  }
                  
                  // Rule 2: Council match (+20)
                  if (rc && uc && (rc === uc || rc.includes(uc) || uc.includes(rc))) {
                    score += 20;
                    console.log(`[Admin] ✅ Registry Rule 2: Council match (+20)`);
                  } else {
                    console.log(`[Admin] ❌ Registry Rule 2: Council mismatch (IMR: ${registryData.council || "N/A"}, DB: ${user.registration_council || "N/A"})`);
                  }
                  
                  // Rule 3: Registration number match (+20)
                  if (rr && ur && rr === ur) {
                    score += 20;
                    console.log(`[Admin] ✅ Registry Rule 3: Registration number match (+20)`);
                  } else {
                    console.log(`[Admin] ❌ Registry Rule 3: Registration number mismatch`);
                  }
                  
                  // Rule 4: Year matches years_of_experience (+20)
                  if (registryData.year && user.years_of_experience) {
                    const registryYear = parseInt(registryData.year, 10);
                    const currentYear = new Date().getFullYear();
                    const expectedYearsOfExp = currentYear - registryYear;
                    const userYearsOfExp = parseInt(user.years_of_experience, 10);
                    
                    // Check if years of experience match (within 1 year tolerance)
                    if (Math.abs(expectedYearsOfExp - userYearsOfExp) <= 1) {
                      score += 20;
                      console.log(`[Admin] ✅ Registry Rule 4: Year matches experience (+20) (Registry Year: ${registryYear}, Expected Exp: ${expectedYearsOfExp}, User Exp: ${userYearsOfExp})`);
                    } else {
                      console.log(`[Admin] ❌ Registry Rule 4: Year doesn't match experience (Registry Year: ${registryYear}, Expected Exp: ${expectedYearsOfExp}, User Exp: ${userYearsOfExp})`);
                    }
                  } else {
                    console.log(`[Admin] ❌ Registry Rule 4: Missing year or experience data (Year: ${registryData.year || "N/A"}, Exp: ${user.years_of_experience || "N/A"})`);
                  }
                  
                  registryScore = score;
                  console.log(`[Admin] 📊 Registry Total Score: ${registryScore}/80`);
                  console.log(`[Admin] 📋 Registry Data:`, JSON.stringify(registryData, null, 2));
                } else {
                  console.log(`[Admin] ⚠️  No valid registry data found (all N/A)`);
                  console.log(`[Admin] 📋 Registry Data:`, JSON.stringify(registryData, null, 2));
                }
              } else if (data.status === "ERROR") {
                console.log(`[Admin] ⚠️  Registry check failed with error: ${data.error || "Unknown error"}`);
                console.log(`[Admin] 📋 Registry result stored but no score assigned due to error`);
              }
            }
          }
        } catch (err) {
          console.error(`[Admin] ❌ Error parsing ${serviceName} response:`, err.message);
        }
      }

      const verification_score = registryScore + licenseScore + idScore;

      let verification_status = "FAILED";
      if (verification_score === 100) verification_status = "VERIFIED";
      else if (verification_score >= 50) verification_status = "PARTIALLY_VERIFIED";

      console.log(`[Admin] 🎯 Final Score: ${verification_score}/100`);
      console.log(`[Admin] 📊 Breakdown: Registry(${registryScore}) + License(${licenseScore}) + ID(${idScore})`);
      console.log(`[Admin] ✅ Verification Status: ${verification_status}`);

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
      console.error("[Admin] ❌ AI CHECK ERROR:", err.message);
      console.error("[Admin] ❌ Stack trace:", err.stack);
      res.status(500).json({ error: err.message });
    }
  }
);

/* =========================
   APPROVE / REJECT
   ========================= */
router.post(
  "/verifications/:userId/:action",
  auth,
  adminOnly,
  async (req, res) => {
    const { userId, action } = req.params;
    console.log(`[Admin] ${action === "approve" ? "✅" : "❌"} ${action.toUpperCase()} request for user: ${userId}`);

    if (!["approve", "reject"].includes(action)) {
      console.error(`[Admin] ❌ Invalid action: ${action}`);
      return res.status(400).json({ error: "Invalid action" });
    }

    const updates =
      action === "approve"
        ? { verified: true, verification_status: "approved" }
        : { verified: false, verification_status: "rejected" };

    const { error } = await supabase.from("users").update(updates).eq("id", userId);

    if (error) {
      console.error(`[Admin] ❌ Error ${action}ing user:`, error.message);
      return res.status(500).json({ error: error.message });
    }

    console.log(`[Admin] ✅ User ${action}d successfully`);
    res.json({ message: `User ${action}d successfully` });
  }
);

export default router;