import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
    const { name, email, password, role } = req.body;
  
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }
  
    try {
      // Check existing user
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("email", email)
        .single();
  
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Insert user
      const { data, error } = await supabase
        .from("users")
        .insert([
          { name, email, password: hashedPassword, role: role || "user" }
        ])
        .select()
        .single();
  
      if (error) throw error;
  
      // 🔑 CREATE JWT
      const token = jwt.sign(
        {
          id: data.id,
          email: data.email,
          role: data.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
  
      // ✅ RETURN TOKEN + USER
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
      res.status(500).json({ error: err.message });
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