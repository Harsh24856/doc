import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import test from "./route/test.js";
import fetchtest from "./route/fetch.js";
import authRoutes from "./route/auth.js";
import hospitalProfile from "./route/hospitalProfile.js"
import hospitalFetch from "./route/hospitalFetch.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin : "http://localhost:5173"
}));
app.use(express.json());

app.use("/test", test);
app.use("/auth", authRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({ message: "Server is running" });
});
app.use("/admin", fetchtest);
app.use("/hospital", hospitalProfile);
app.use("/hospital", hospitalFetch);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});