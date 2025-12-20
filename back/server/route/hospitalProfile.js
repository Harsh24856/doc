import express from "express";
import supabase from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/profile", auth, async (req, res) => {
  const userId = req.user.id;
  const body = req.body;

  const requiredFields = [
    "hospital_name",
    "registration_number_hospital",
    "hospital_city",
    "hospital_state",
    "hospital_person_name",
    "hospital_person_email",
  ];

  const hospitalProfileCompleted = requiredFields.every(
    (field) => body[field] && body[field].trim() !== ""
  );

  try {
    const updateData = {
      hospital_name: body.hospital_name,
      hospital_type: body.hospital_type,
      registration_number_hospital: body.registration_number_hospital,
      hospital_city: body.hospital_city,
      hospital_state: body.hospital_state,
      hospital_person_name: body.hospital_person_name,
      hospital_person_email: body.hospital_person_email,
      hospital_website: body.hospital_website,
      hospital_profile_completed: hospitalProfileCompleted,
    };

    const { error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", userId)
      .eq("role", "hospital");

    if (error) throw error;

    res.json({
      message: "Hospital profile updated successfully",
      hospital_profile_completed: hospitalProfileCompleted,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
