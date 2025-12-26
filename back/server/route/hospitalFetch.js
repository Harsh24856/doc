import express from "express";
import supabase from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.get("/fetch", auth, async (req, res) => {
  const hospitalId = req.user.id;

  try {
    const { data, error } = await supabase
      .from("hospitals")
      .select(`
      hospital_name,
      hospital_type,
      registration_number_hospital,
      hospital_city,
      hospital_state,
      hospital_person_name,
      hospital_person_email,
      hospital_website
    `)
      .eq("user_id", hospitalId)
      .single();

    if (error) {
      // Handle "not found" error gracefully
      if (error.code === "PGRST116") {
        // Return empty form data if hospital doesn't exist yet
        return res.json({
          hospital_name: "",
          hospital_type: "",
          registration_number_hospital: "",
          hospital_city: "",
          hospital_state: "",
          hospital_person_name: "",
          hospital_person_email: "",
          hospital_website: "",
        });
      }
      console.error("[Hospital Fetch] Error:", error);
      throw error;
    }

    if (!data) {
      // Return empty form data if hospital doesn't exist yet
      return res.json({
        hospital_name: "",
        hospital_type: "",
        registration_number_hospital: "",
        hospital_city: "",
        hospital_state: "",
        hospital_person_name: "",
        hospital_person_email: "",
        hospital_website: "",
      });
    }

    res.json(data);
  } catch (err) {
    console.error("[Hospital Fetch] Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
