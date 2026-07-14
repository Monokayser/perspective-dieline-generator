import { defineConfig } from "@playwright/test";

const browsers = ["chromium", "firefox", "webkit"] as const;
const viewports = [
  { name: "phone", width: 360, height: 800, deviceScaleFactor: 3 },
  { name: "tablet", width: 768, height: 1024, deviceScaleFactor: 2 },
  { name: "desktop", width: 1440, height: 900, deviceScaleFactor: 1 },
  { name: "wide", width: 1920, height: 1080, deviceScaleFactor: 1 },
];

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: { timeout: 12_000 },
  fullyParallel: true,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "work/playwright-report" }],
  ],
  use: {
    baseURL: process.env.PDG_E2E_URL ?? "http://127.0.0.1:5173",
    colorScheme: "dark",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 5173",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: browsers.flatMap((browserName) =>
    viewports.map(({ name, width, height, deviceScaleFactor }) => ({
      name: `${browserName}-${name}`,
      use: { browserName, viewport: { width, height }, deviceScaleFactor },
    })),
  ),
});
