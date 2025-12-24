import { chromium } from "playwright";

export async function checkIMR(name, registration_number) {
  console.log("\n" + "=".repeat(60));
  console.log("[Playwright IMR Check] 🚀 Starting IMR verification (NON-BLOCKING LOAD)");
  console.log("=".repeat(60));

  const browser = await chromium.launch({
    headless: true,
    devtools: true,
    
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  });

  const page = await context.newPage();

  // ⛔ Disable Playwright timeouts (important)
  page.setDefaultTimeout(180000);
  page.setDefaultNavigationTimeout(180000);

  const url =
    "https://www.nmc.org.in/information-desk/indian-medical-register/";

  try {
    /* =========================
       STEP 1: START NAVIGATION (NON-BLOCKING)
       ========================= */
    console.log("[Playwright IMR Check] 🌐 Starting navigation (do NOT wait)...");
    page.goto(url).catch(() => {
      console.log("[Playwright IMR Check] ⚠️ Initial navigation still loading...");
    });

    /* =========================
       STEP 2: FIXED WAIT (NO INTERRUPTION)
       ========================= */
    console.log("[Playwright IMR Check] ⏳ Waiting 5 seconds...");
    await page.waitForTimeout(5000);

    /* =========================
       STEP 3: FORCE RELOAD
       ========================= */
    console.log("[Playwright IMR Check] 🔄 Forcing reload...");
    page.reload().catch(() => {
      console.log("[Playwright IMR Check] ⚠️ Reload still loading...");
    });

    /* =========================
       STEP 4: WAIT AFTER RELOAD
       ========================= */
  
    await page.waitForTimeout(2000);

    /* =========================
       STEP 5: FILL FORM
       ========================= */
    console.log("[Playwright IMR Check] ✍️ Filling form...");
    await page.waitForSelector("#doctorName");
    await page.waitForSelector("#doctorRegdNo");

    await page.fill("#doctorName", name);
    await page.fill("#doctorRegdNo", registration_number);

    /* =========================
       STEP 6: SUBMIT
       ========================= */
    console.log("[Playwright IMR Check] 🔍 Submitting search...");
    await page.click("#doctor_advance_Details");

    /* =========================
       STEP 7: WAIT FOR RESULT
       ========================= */
    console.log("[Playwright IMR Check] ⏳ Waiting for result...");

    let result = null;

    while (!result) {
      result = await page.evaluate(() => {
        const noData = document.querySelector("td.dataTables_empty");
        if (
          noData &&
          noData.innerText.trim() === "No data available in table"
        ) {
          return { noData: true };
        }

        const row = document.querySelector("#doct_info5 tbody tr");
        if (!row) return null;

        const td = row.querySelectorAll("td");
        if (td.length < 6) return null;

        const isEmpty = Array.from(td)
          .slice(1, 6)
          .every((cell) => !cell.innerText.trim());

        if (isEmpty) return null;

        return {
          year: td[1]?.innerText.trim() || "N/A",
          registration_number: td[2]?.innerText.trim() || "N/A",
          council: td[3]?.innerText.trim() || "N/A",
          name: td[4]?.innerText.trim() || "N/A",
          father_name: td[5]?.innerText.trim() || "N/A",
        };
      });

      if (!result) {
        await page.waitForTimeout(5000);
        console.log("[Playwright IMR Check] ⏳ Still waiting...");
      }
    }

    /* =========================
       STEP 8: FORMAT RESPONSE
       ========================= */
    if (result.noData) {
      result = {
        year: "N/A",
        registration_number: "N/A",
        council: "N/A",
        name: "N/A",
        father_name: "N/A",
      };
    }

    console.log("\n[Playwright IMR Check] 📋 FINAL RESULT:");
    console.log("-".repeat(60));
    console.log("Status: SUCCESS");
    console.log(JSON.stringify(result, null, 2));
    console.log("-".repeat(60));

    await browser.close();
    console.log("[Playwright IMR Check] 🔒 Browser closed");

    return {
      status: "SUCCESS",
      result,
    };

  } catch (err) {
    console.error("[Playwright IMR Check] ❌ ERROR:", err.message);

    await browser.close();

    return {
      status: "ERROR",
      error: err.message,
    };
  }
}