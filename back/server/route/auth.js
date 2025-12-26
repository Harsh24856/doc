import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password, role } = req.body;

  console.log("[Auth] Signup request received:", { name, email, role: role || "not provided" });

  if (!name || !email || !password || !role) {
    console.error("[Auth] Missing fields in signup request");
    return res.status(400).json({ message: "Missing fields" });
  }

  const allowedRoles = ["doctor", "hospital"];
  if (!allowedRoles.includes(role)) {
    console.error("[Auth] Invalid role:", role);
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error("[Auth] JWT_SECRET is not set in environment variables");
      throw new Error("Server configuration error: JWT_SECRET missing");
    }

    console.log("[Auth] Checking for existing user with email:", email);
    const { data: existingUser, error: checkError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is expected for new users
      console.error("[Auth] Error checking existing user:", checkError);
      throw checkError;
    }

    if (existingUser) {
      console.error("[Auth] User already exists with email:", email);
      return res.status(409).json({ message: "User already exists" });
    }

    console.log("[Auth] Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("[Auth] Inserting new user into database...");
    const { data, error } = await supabase
      .from("users")
      .insert([
        { name, email, password: hashedPassword, role }
      ])
      .select()
      .single();

    if (error) {
      console.error("[Auth] Error inserting user:", error);
      throw error;
    }

    console.log("[Auth] User created successfully:", data.id);

    if (role === "hospital") {
      console.log("[Auth] Creating hospital record for user:", data.id);
      const { error: hospitalError } = await supabase
        .from("hospitals")
        .insert([
          {
            user_id: data.id,
            hospital_profile_completed: false,
            
          },
        ]);

      if (hospitalError) {
        console.error("[Auth] Hospital insert error:", hospitalError);
        // Don't throw - user is already created, just log the error
        // You might want to handle this differently based on your requirements
        console.warn("[Auth] Warning: User created but hospital record failed");
      } else {
        console.log("[Auth] Hospital record created successfully");
      }
    }

    console.log("[Auth] Generating JWT token...");
    const token = jwt.sign(
      { id: data.id, email: data.email, role: data.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("[Auth] Signup successful for user:", data.id);
    res.status(201).json({
      token,
      user: {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
      },
    });
  } catch (err) {
    console.error("[Auth] Signup error:", err.message);
    console.error("[Auth] Error stack:", err.stack);
    console.error("[Auth] Error details:", JSON.stringify(err, null, 2));
    res.status(500).json({ 
      error: err.message || "Failed to create user",
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();
  
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      const isMatch = await bcrypt.compare(password, user.password);
  
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
  
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
  
      res.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

/* =========================
   GET CURRENT USER (ME)
   ========================= */
router.get("/me", auth, async (req, res) => {
  const userId = req.user.id;
  console.log("[Auth] /me endpoint called for user:", userId);

  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id, name, email, role")
      .eq("id", userId)
      .single();

    if (error || !user) {
      console.error("[Auth] User not found for ID:", userId);
      return res.status(404).json({ message: "User not found" });
    }

    console.log("[Auth] User data retrieved:", { id: user.id, name: user.name, email: user.email });
    res.json(user);
  } catch (err) {
    console.error("[Auth] Error in /me endpoint:", err.message);
    res.status(500).json({ error: err.message });
  }
});
  
  export default router;