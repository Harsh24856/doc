import express from "express";
import { checkIMR } from "./imrCheck.js";

const app = express();
app.use(express.json());

/* =========================
   REGISTRY CHECK
   ========================= */
app.post("/mci-check", async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("[Playwright Service] 📥 RECEIVED REGISTRY CHECK REQUEST");
  console.log("=".repeat(60));

  try {
    const { name, registration_number } = req.body;

    console.log(`[Playwright Service] 📋 Request Details:`);
    console.log(`  Name: ${name || "MISSING"}`);
    console.log(`  Registration Number: ${registration_number || "MISSING"}`);

    if (!name || !registration_number) {
      return res.json({
        status: "ERROR",
        error: "Name and registration number required",
      });
    }

    console.log("[Playwright Service] 🚀 Starting IMR check...");

    // HARD KILL SAFETY (3 minutes)
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("IMR check timed out after 3 minutes")),
        180000
      )
    );

    const result = await Promise.race([
      checkIMR(name, registration_number),
      timeoutPromise,
    ]);

    console.log(`[Playwright Service] ✅ Completed with status: ${result.status}`);
    console.log("=".repeat(60) + "\n");

    // Always return SUCCESS / ERROR in-body (never crash admin flow)
    return res.json(result);

  } catch (err) {
    console.error("[Playwright Service] ❌ IMR CHECK FAILED:", err.message);

    return res.json({
      status: "ERROR",
      error: err.message,
    });
  }
});

/* =========================
   HEALTH CHECK
   ========================= */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "playwright-service",
  });
});

/* =========================
   START SERVER
   ========================= */
const PORT = 9000;
app.listen(PORT, "0.0.0.0", () => {
  const headlessMode =
    process.env.HEADLESS === "false" ? "visible" : "headless";

  console.log(`🟢 IMR Playwright Service running on http://0.0.0.0:${PORT}`);
  console.log(`🖥️  Browser mode: ${headlessMode}`);
});