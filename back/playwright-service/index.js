import express from "express";
import { checkIMR } from "./imrCheck.js";

const app = express();
app.use(express.json());

app.post("/mci-check", async (req, res) => {
  try {
    const { name, registration_number } = req.body;

    if (!name || !registration_number) {
      return res.status(400).json({ error: "Name and registration number required" });
    }

    console.log(`[Playwright] Checking: ${name} - ${registration_number}`);
    const result = await checkIMR(name, registration_number);
    console.log(`[Playwright] Result:`, result.status);
    res.json(result);
  } catch (err) {
    console.error("[Playwright] Error in /mci-check:", err);
    res.status(500).json({
      status: "ERROR",
      error: err.message || "Internal server error"
    });
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "playwright-service" });
});

app.listen(9000, "0.0.0.0", () =>
  console.log("🟢 IMR Playwright running on http://0.0.0.0:9000")
);