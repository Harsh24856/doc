import { chromium } from "playwright";

/**
 * Verify doctor from NMC Indian Medical Register
 * @param {string} name
 * @param {string} registration_number
 */
export async function checkIMR(name, registration_number) {
  const browser = await chromium.launch({
    headless: true     // set true in production
  });

  const page = await browser.newPage();

  try {
    // 1️⃣ Open IMR page
    await page.goto(
      "https://nmc.org.in/information-desk/indian-medical-register/",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    // 2️⃣ Doctor Name
    await page.waitForSelector("#doctorName", { timeout: 60000 });
    await page.click("#doctorName");
    await page.fill("#doctorName", "");
    await page.type("#doctorName", name, { delay: 100 });

    // 3️⃣ Registration Number
    await page.waitForSelector("#doctorRegdNo", { timeout: 60000 });
    await page.click("#doctorRegdNo");
    await page.fill("#doctorRegdNo", "");
    await page.type("#doctorRegdNo", registration_number, { delay: 100 });

    // 4️⃣ Submit
    await page.waitForSelector("#doctor_advance_Details", { timeout: 30000 });
    await page.click("#doctor_advance_Details");

    // 5️⃣ Wait for table (AJAX)
    await page.waitForSelector("#doct_info5 tbody tr", {
      timeout: 60000
    });

    // 6️⃣ Extract FIRST ROW ONLY
    const record = await page.evaluate(() => {
      const row = document.querySelector("#doct_info5 tbody tr");
      if (!row) return null;

      const td = row.querySelectorAll("td");

      return {
        serial_no: td[0]?.innerText.trim(),
        year_of_info: td[1]?.innerText.trim(),
        registration_number: td[2]?.innerText.trim(),
        state_medical_council: td[3]?.innerText.trim(),
        name: td[4]?.innerText.trim(),
        father_name: td[5]?.innerText.trim()
      };
    });

    await browser.close();

    return {
      status: record ? "FOUND" : "NOT_FOUND",
      source: "NMC_IMR",
      record
    };

  } catch (err) {
    await browser.close();
    return {
      status: "ERROR",
      error: err.message
    };
  }
}