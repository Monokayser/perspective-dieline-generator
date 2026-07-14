import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const baseURL = process.env.PDG_SCREENSHOT_URL ?? "http://127.0.0.1:5173";
const output = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));
await mkdir(output, { recursive: true });

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem("pdg-onboarding-complete", "true"));
  await page.goto(baseURL);
  await page.getByRole("button", { name: /Load guided sample project/i }).click();
  await page.getByRole("button", { name: /Rerun local analysis/i }).waitFor({ timeout: 60_000 });
  await page.screenshot({ path: join(output, "analysis-workspace.png"), fullPage: true });

  await page.getByRole("button", { name: /Continue to Measure/i }).click();
  await page.getByRole("button", { name: /Confirm and continue/i }).click();
  await page.getByRole("button", { name: /Generate 1:1 dieline/i }).click();
  await page.getByRole("tab", { name: /Print preview/i }).click();
  await page.screenshot({ path: join(output, "print-preview.png"), fullPage: true });

  await page.getByTitle("Switch to light mode").click();
  await page.getByRole("tab", { name: /Dieline editor/i }).click();
  await page.screenshot({ path: join(output, "light-workbench.png"), fullPage: true });
  await context.close();

  const mobile = await browser.newContext({
    colorScheme: "dark",
    viewport: { width: 360, height: 800 },
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.addInitScript(() => localStorage.setItem("pdg-onboarding-complete", "true"));
  await mobilePage.goto(baseURL);
  await mobilePage.waitForTimeout(1_000);
  await mobilePage.screenshot({ path: join(output, "mobile-workbench.png"), fullPage: true });
  await mobile.close();
} finally {
  await browser.close();
}
