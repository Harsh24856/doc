import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import supabase from "../db.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
    const { name, email, password, role } = req.body;
  
    if (!name || !email || !password ||!role) {
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
  
  export default router;