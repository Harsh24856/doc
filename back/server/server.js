import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import test from "./route/test.js";
import fetchtest from "./route/fetch.js";
import authRoutes from "./route/auth.js";
import profileRoutes from "./route/profile.js";
import auth from "./middleware/auth.js";
import verificationRoutes from "./route/verification.js";
import adminRoutes from "./route/admin.js";
import verificationUpload from "./route/verificationUpload.js";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: [
      "http://localhost:5174",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://0.0.0.0:5173"
    ],
    credentials: true
}));
app.use(express.json());

app.use("/test", test);
app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});
app.get("/test-auth", auth, (req, res) => {
  res.json({ user: req.user });
});
app.use("/admin", fetchtest);
app.use("/profile", profileRoutes);
app.use("/verification", verificationUpload);
app.use("/verification", verificationRoutes);
app.use("/admin", adminRoutes);
/* 🔥 GLOBAL ERROR HANDLER (MANDATORY) */
app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err.message);
  res.status(400).json({ error: err.message });
});
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});