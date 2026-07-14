import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const contrast = (a: number[], b: number[]) => {
  const luminance = ([r, g, blue]: number[]) => {
    const linear = [r, g, blue].map((value) => {
      const channel = value / 255;
      return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  };
  const first = luminance(a);
  const second = luminance(b);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

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
  for (const theme of ["dark", "light"] as const) {
    const switchButton = page.getByTitle(`Switch to ${theme} mode`);
    if (await switchButton.count()) await switchButton.click();
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    const serious = results.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
    expect(serious, `${theme} theme`).toEqual([]);
  }
});

test("application mark keeps non-text contrast in both themes", async ({ page }) => {
  for (const theme of ["dark", "light"] as const) {
    const switchButton = page.getByTitle(`Switch to ${theme} mode`);
    if (await switchButton.count()) await switchButton.click();
    const colors = await page.locator(".app-mark").first().evaluate((mark) => {
      const parse = (value: string) => value.match(/[\d.]+/g)?.slice(0, 3).map(Number) ?? [];
      const markStyle = getComputedStyle(mark);
      const parentStyle = getComputedStyle(mark.parentElement!);
      const faces = [...mark.querySelectorAll("span")].map((face) => parse(getComputedStyle(face).backgroundColor));
      return {
        background: parse(markStyle.backgroundColor),
        border: parse(markStyle.borderTopColor),
        surrounding: parse(parentStyle.backgroundColor === "rgba(0, 0, 0, 0)" ? getComputedStyle(document.querySelector(".topbar")!).backgroundColor : parentStyle.backgroundColor),
        faces,
        bounds: mark.getBoundingClientRect().toJSON(),
      };
    });
    expect(colors.bounds.width).toBeGreaterThanOrEqual(30);
    expect(colors.bounds.height).toBeGreaterThanOrEqual(30);
    expect(Math.max(contrast(colors.background, colors.surrounding), contrast(colors.border, colors.surrounding))).toBeGreaterThanOrEqual(3);
    for (const face of colors.faces) expect(contrast(face, colors.background)).toBeGreaterThanOrEqual(3);
  }
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

  const lightMode = page.getByTitle("Switch to light mode");
  if (await lightMode.count()) await lightMode.click();
  const unselectedPanel = page.locator(".panel-shape:not(.selected)").first();
  await expect(unselectedPanel).toBeVisible();
  const panelStyle = await unselectedPanel.evaluate((panel) => {
    const style = getComputedStyle(panel);
    return { stroke: style.stroke, width: Number.parseFloat(style.strokeWidth) };
  });
  expect(panelStyle.stroke).not.toBe("none");
  expect(panelStyle.width).toBeGreaterThanOrEqual(0.2);

  await page.getByRole("button", { name: "Validate and export", exact: true }).click();
  await page.getByRole("tab", { name: /Export/i }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export editable SVG/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/\.svg$/i);
});
