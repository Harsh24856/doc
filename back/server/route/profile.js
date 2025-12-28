import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";
import supabaseAdmin from "../Admin.js";

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
   MEDICAL RESUME (GET & PUT)
   ========================= */
router.get("/medical-resume", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        role,
        phone,
        designation,
        specialization,
        registration_number,
        registration_council,
        year_of_graduation,
        years_of_experience,
        hospital_affiliation,
        qualifications,
        skills,
        bio,
        profile_completed,
        verification_status,
        license_doc_url,
        id_doc_url
      `)
      .eq("id", userId)
      .single();

    if (error) {
      console.error("[Profile] Error fetching medical resume:", error.message);
      return res.status(500).json({ error: error.message });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("[Profile] Error in GET /medical-resume:", err.message);
    res.status(500).json({ error: err.message });
  }
});

router.put("/medical-resume", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const updateData = { ...req.body };
    const shouldSubmit = updateData.submit === true;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.email;
    delete updateData.role;
    delete updateData.submit; // Remove submit flag from update data

    // Prepare update object
    const updateObject = { ...updateData };

    // Only set profile_completed if explicitly submitting
    if (shouldSubmit) {
      // Set profile_completed to true when user submits (just once)
      updateObject.profile_completed = true;
    }
    // If not submitting, don't change profile_completed (keep existing value)

    const { data, error } = await supabase
      .from("users")
      .update(updateObject)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("[Profile] Error updating medical resume:", error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error("[Profile] Error in PUT /medical-resume:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   HELPERS
   ========================= */
const normalizeText = (v) =>
  String(v || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const normalizeNumber = (v) =>
  String(v || "").replace(/\D/g, "");

/* =========================
   GET PENDING USERS
   ========================= */
router.get("/verifications/pending", auth, adminOnly, async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select(`
      id,
      name,
      email,
      role,
      phone,
      designation,
      specialization,
      registration_number,
      registration_council,
      year_of_graduation,
      hospital_affiliation,
      qualifications,
      skills,
      bio,
      verification_status,
      license_doc_url,
      id_doc_url
    `)
    .eq("verification_status", "pending");

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

/* =========================
   VIEW RESUME (Full resume with documents)
   ========================= */
router.get("/resume/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterId = req.user.id;
    const requesterRole = req.user.role;
    
    console.log("[Profile] Fetching resume for user:", userId, "by:", requesterId);

    // Get user's full profile data
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        phone,
        role,
        designation,
        specialization,
        registration_number,
        registration_council,
        year_of_graduation,
        years_of_experience,
        hospital_affiliation,
        qualifications,
        skills,
        bio,
        profile_completed,
        verification_status,
        license_doc_url,
        id_doc_url
      `)
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("[Profile] Error fetching user:", userError);
      return res.status(404).json({ error: "User not found" });
    }

    // Only return if profile is completed
    if (!user.profile_completed) {
      return res.status(404).json({ error: "Profile not completed" });
    }

    // Generate signed URLs for documents if they exist
    let licenseUrl = null;
    let idUrl = null;

    if (user.license_doc_url) {
      let licensePath = user.license_doc_url;
      if (licensePath.startsWith("http")) {
        licensePath = licensePath.split("/storage/v1/object/")[1]?.split("?")[0];
      }
      
      const { data: licenseData, error: licenseError } = await supabaseAdmin.storage
        .from("verification-docs")
        .createSignedUrl(licensePath, 3600); // 1 hour expiry
      
      if (!licenseError && licenseData) {
        licenseUrl = licenseData.signedUrl;
      }
    }

    if (user.id_doc_url) {
      let idPath = user.id_doc_url;
      if (idPath.startsWith("http")) {
        idPath = idPath.split("/storage/v1/object/")[1]?.split("?")[0];
      }
      
      const { data: idData, error: idError } = await supabaseAdmin.storage
        .from("verification-docs")
        .createSignedUrl(idPath, 3600); // 1 hour expiry
      
      if (!idError && idData) {
        idUrl = idData.signedUrl;
      }
    }

    res.json({
      ...user,
      license_doc_url: licenseUrl,
      id_doc_url: idUrl,
    });
  } catch (err) {
    console.error("[Profile] Error in GET /resume/:userId:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   PUBLIC PROFILE (No auth required)
   ========================= */
router.get("/public/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("[Profile] Fetching public profile for user:", userId);
    
    // First, get the user to check their role
    const { data: user, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        role,
        profile_completed
      `)
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("[Profile] Error fetching user:", userError.message);
      console.error("[Profile] Error code:", userError.code);
      if (userError.code === "PGRST116") {
        return res.status(404).json({ error: "User not found" });
      }
      return res.status(500).json({ error: userError.message });
    }

    if (!user) {
      console.error("[Profile] User not found for ID:", userId);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("[Profile] User found:", { id: user.id, name: user.name, role: user.role, profile_completed: user.profile_completed });

    // If user is a hospital, fetch from hospitals table
    if (user.role === "hospital") {
      console.log("[Profile] Fetching hospital profile for user:", userId);
      
      const { data: hospital, error: hospitalError } = await supabase
        .from("hospitals")
        .select(`
          id,
          user_id,
          hospital_name,
          hospital_type,
          hospital_city,
          hospital_state,
          hospital_person_name,
          hospital_person_email,
          hospital_website,
          hospital_profile_completed,
          verification_status
        `)
        .eq("user_id", userId)
        .single();

      if (hospitalError) {
        console.error("[Profile] Error fetching hospital:", hospitalError.message);
        return res.status(404).json({ error: "Hospital profile not found" });
      }

      if (!hospital) {
        return res.status(404).json({ error: "Hospital profile not found" });
      }

      // Check if hospital profile is completed
      if (!hospital.hospital_profile_completed) {
        console.log("[Profile] Hospital profile not completed for user:", userId);
        return res.status(404).json({ error: "Hospital profile not available. Profile has not been completed." });
      }

      // Return hospital data in a format similar to user profile
      console.log("[Profile] Returning hospital profile for user:", userId);
      return res.json({
        id: user.id,
        name: hospital.hospital_name,
        role: "hospital",
        designation: hospital.hospital_type || "Hospital",
        specialization: null,
        hospital_affiliation: hospital.hospital_name,
        qualifications: null,
        skills: null,
        bio: `${hospital.hospital_name}${hospital.hospital_city ? `, ${hospital.hospital_city}` : ""}${hospital.hospital_state ? `, ${hospital.hospital_state}` : ""}`,
        profile_completed: hospital.hospital_profile_completed,
        verification_status: hospital.verification_status,
        // Additional hospital-specific fields
        hospital_city: hospital.hospital_city,
        hospital_state: hospital.hospital_state,
        hospital_person_name: hospital.hospital_person_name,
        hospital_person_email: hospital.hospital_person_email,
        hospital_website: hospital.hospital_website,
      });
    }

    // For regular users/doctors, fetch full user profile
    const { data: fullUser, error: fullUserError } = await supabase
      .from("users")
      .select(`
        id,
        name,
        role,
        designation,
        specialization,
        hospital_affiliation,
        qualifications,
        skills,
        bio,
        profile_completed,
        verification_status
      `)
      .eq("id", userId)
      .single();

    if (fullUserError) {
      console.error("[Profile] Error fetching full user profile:", fullUserError.message);
      return res.status(500).json({ error: fullUserError.message });
    }

    if (!fullUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Only return profile if it's completed
    if (!fullUser.profile_completed) {
      console.log("[Profile] Profile not completed for user:", userId);
      return res.status(404).json({ error: "Profile not available. User has not completed their profile." });
    }

    console.log("[Profile] Returning public profile for user:", userId);
    res.json(fullUser);
  } catch (err) {
    console.error("[Profile] Error in GET /public/:userId:", err.message);
    console.error("[Profile] Stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   AI VERIFICATION (Removed - now handled by verification.js)
   ========================= */

//    router.get("/verification-status", auth, async (req, res) => { 
//   try {
//     const userId = req.user.id;

//     const { data: doctor, error } = await supabase
//       .from("users")
//       .select("verification_status")
//       .eq("id", userId)
//       .single();

//     if (error || !doctor) {
//       console.error("Could not find doctor profile", error);
//       return res.status(404).json({
//         message: "Doctor profile not found",
//       });
//     }

//     return res.json({
//       verification_status: doctor.verification_status,
//     });
//   } catch (err) {
//     console.error("Error fetching the verification status", err);
//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// });


export default router;