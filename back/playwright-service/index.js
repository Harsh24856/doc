import express from "express";
import { checkIMR } from "./imrCheck.js";

const app = express();
app.use(express.json());

app.post("/mci-check", async (req, res) => {
  const { name, registration_number } = req.body;

  if (!name || !registration_number) {
    return res.status(400).json({ error: "Name and registration number required" });
  }

  const result = await checkIMR(name, registration_number);
  res.json(result);
});

app.listen(9000, () =>
  console.log("🟢 IMR Playwright running on http://localhost:9000")
);