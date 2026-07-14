import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("pdg-onboarding-complete", "true");
  });
  await page.goto("/");
});

test("renders the five-phase workbench without horizontal overflow", async ({ page }) => {
  for (const phase of ["Source", "Analyze", "Measure", "Design", "Deliver"]) {
    await expect(page.getByRole("button", { name: new RegExp(phase) })).toBeVisible();
  }

  await expect(page.getByRole("button", { name: /Source/ })).toHaveAttribute(
    "aria-current",
    "step",
  );

  const layout = await page.evaluate(() => {
    const bodyStyle = getComputedStyle(document.body);
    return {
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      fontFamily: bodyStyle.fontFamily,
      fontSize: Number.parseFloat(bodyStyle.fontSize),
    };
  });

  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(layout.fontFamily).toMatch(/Inter|system-ui|Segoe UI/);
  expect(layout.fontSize).toBeGreaterThanOrEqual(14);
});

test("has no serious automated accessibility violations", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  const serious = results.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
  expect(serious).toEqual([]);
});

test("completes sample analysis through SVG export", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.endsWith("-desktop"));
  test.setTimeout(120_000);

  await page.getByRole("button", { name: /Load guided sample project/i }).click();
  await expect(page.getByRole("button", { name: /Analyze/ })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await expect(page.getByRole("button", { name: /Rerun local analysis/i })).toBeVisible({
    timeout: 60_000,
  });

  await page.getByRole("button", { name: /Continue to Measure/i }).click();
  await page.getByRole("button", { name: /Confirm and continue/i }).click();
  await page.getByRole("button", { name: /Generate 1:1 dieline/i }).click();
  await expect(page.getByText(/0 errors.*0 warnings/i)).toBeVisible();

  await page.getByRole("button", { name: "Validate and export", exact: true }).click();
  await page.getByRole("tab", { name: /Export/i }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export editable SVG/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.svg$/i);
});
