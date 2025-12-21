import express from "express";
import auth from "../middleware/auth.js";
import supabase from "../db.js";

const router = express.Router();

/* =========================
   UPDATE MEDICAL RESUME
   ========================= */
router.put("/medical-resume", auth, async (req, res) => {
  console.log("\n[PUT /profile/medical-resume] =====================");
  console.log("[PUT Medical Resume] Step 1: Request received");
  
  const userId = req.user.id;
  console.log("[PUT Medical Resume] User ID:", userId);
  console.log("[PUT Medical Resume] Authenticated user:", req.user?.email);
  console.log("[PUT Medical Resume] Request body:", JSON.stringify(req.body, null, 2));

  const allowedFields = [
    "role",
    "name",
    "phone",
    "designation",
    "specialization",
    "registration_number",
    "years_of_experience",
    "hospital_affiliation",
    "qualifications",
    "skills",
    "bio",
  ];

  console.log("[PUT Medical Resume] Step 2: Filtering allowed fields and converting data types");
  const updates = {};
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      let value = req.body[key];
      
      // Convert qualifications and skills to arrays if they're strings
      if (key === "qualifications" || key === "skills") {
        if (typeof value === "string") {
          // Handle comma-separated string
          value = value.split(",").map((item) => item.trim()).filter(Boolean);
          console.log(`[PUT Medical Resume] Converted ${key} from string to array:`, value);
        } else if (!Array.isArray(value)) {
          // If it's not a string and not an array, wrap it in an array
          value = [value].filter(Boolean);
          console.log(`[PUT Medical Resume] Converted ${key} to array:`, value);
        }
        // If it's already an array, use it as-is
      }
      
      // Convert years_of_experience to number
      if (key === "years_of_experience" && value !== null && value !== undefined) {
        value = Number(value);
        if (isNaN(value)) {
          console.log(`[PUT Medical Resume] ⚠️ Invalid number for ${key}, setting to null`);
          value = null;
        }
      }
      
      updates[key] = value;
    }
  }
  console.log("[PUT Medical Resume] Filtered and converted updates:", JSON.stringify(updates, null, 2));

  try {
    console.log("[PUT Medical Resume] Step 3: Fetching current user data");
    // 🔍 Fetch current role + profile status
    const { data: currentUser, error } = await supabase
      .from("users")
      .select("role, profile_completed")
      .eq("id", userId)
      .single();

    console.log("[PUT Medical Resume] Current user data:", currentUser);
    console.log("[PUT Medical Resume] Has error:", !!error);

    if (error) {
      console.error("[PUT Medical Resume] ❌ Error fetching current user:", error.message);
      throw error;
    }

    console.log("[PUT Medical Resume] Step 4: Validating role updates");
    // 🚫 Block admin role
    if (updates.role === "admin") {
      console.log("[PUT Medical Resume] ⚠️ Admin role blocked, removing from updates");
      delete updates.role;
    }

    // 🔒 Lock role after first completion
    if (updates.role && currentUser.profile_completed) {
      console.log("[PUT Medical Resume] ⚠️ Role change blocked - profile already completed");
      console.log("[PUT Medical Resume] Current role:", currentUser.role);
      console.log("[PUT Medical Resume] Attempted role:", updates.role);
      delete updates.role;
    }

    console.log("[PUT Medical Resume] Step 5: Updating user in database");
    console.log("[PUT Medical Resume] Final updates to apply:", JSON.stringify(updates, null, 2));

    const { error: updateError } = await supabase
      .from("users")
      .update({
        ...updates,
        profile_completed: true,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[PUT Medical Resume] ❌ Database update error:", updateError.message);
      console.error("[PUT Medical Resume] Error details:", updateError);
      throw updateError;
    }

    console.log("[PUT Medical Resume] ✅ Profile updated successfully");
    console.log("[PUT Medical Resume] ✅ Sending response");
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("[PUT Medical Resume] ❌ Error:", err.message);
    console.error("[PUT Medical Resume] Error stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   GET MEDICAL RESUME
   ========================= */
router.get("/medical-resume", auth, async (req, res) => {
  console.log("\n[GET /profile/medical-resume] =====================");
  console.log("[GET Medical Resume] Step 1: Request received");
  
  const userId = req.user.id;
  console.log("[GET Medical Resume] User ID:", userId);
  console.log("[GET Medical Resume] Authenticated user:", req.user?.email);

  try {
    console.log("[GET Medical Resume] Step 2: Fetching user data from database");
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        role,
        name,
        email,
        phone,
        designation,
        specialization,
        registration_number,
        years_of_experience,
        hospital_affiliation,
        qualifications,
        skills,
        bio,
        profile_completed
      `)
      .eq("id", userId)
      .single();

    console.log("[GET Medical Resume] Step 3: Database query executed");
    console.log("[GET Medical Resume] Has data:", !!data);
    console.log("[GET Medical Resume] Has error:", !!error);

    if (error) {
      console.error("[GET Medical Resume] ❌ Database error:", error.message);
      console.error("[GET Medical Resume] Error details:", error);
      throw error;
    }

    console.log("[GET Medical Resume] ✅ Data retrieved successfully");
    console.log("[GET Medical Resume] User name:", data?.name);
    console.log("[GET Medical Resume] Profile completed:", data?.profile_completed);
    console.log("[GET Medical Resume] ✅ Sending response");
    
    res.json(data);
  } catch (err) {
    console.error("[GET Medical Resume] ❌ Error:", err.message);
    console.error("[GET Medical Resume] Error stack:", err.stack);
    res.status(500).json({ error: err.message });
  }
});

export default router;