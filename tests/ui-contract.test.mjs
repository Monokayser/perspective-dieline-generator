import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssUrl = new URL("../src/styles/globals.css", import.meta.url);
const sampleImageUrl = new URL("../src/lib/sample-image.ts", import.meta.url);

test("typography and compact layouts retain robust cross-platform fallbacks", async () => {
  const css = await readFile(cssUrl, "utf8");
  assert.match(css, /--font-sans:[^;]*Inter[^;]*Segoe UI[^;]*Roboto[^;]*Helvetica[^;]*Arial[^;]*Noto Sans[^;]*sans-serif/);
  assert.match(css, /--font-mono:[^;]*JetBrains Mono[^;]*Consolas[^;]*monospace/);
  assert.match(css, /@media \(max-width: 1100px\)/);
  assert.match(css, /@media \(max-width: 600px\)/);
  assert.match(css, /min-width: 44px; min-height: 44px/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /font-size: 1rem/);
});

test("accessibility preferences have explicit rendering contracts", async () => {
  const css = await readFile(cssUrl, "utf8");
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /prefers-contrast: more/);
  assert.match(css, /forced-colors: active/);
  assert.match(css, /:focus-visible/);
});

test("production source excludes starter authentication and database code", async () => {
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /drizzle|next-auth|openai\/chatgpt|vinext|cloudflare|wrangler/i);
});

test("application mark and dieline panels use explicit theme-aware tokens", async () => {
  const css = await readFile(cssUrl, "utf8");
  for (const token of [
    "--app-mark-background",
    "--app-mark-face-top",
    "--app-mark-face-left",
    "--app-mark-face-right",
    "--app-mark-border",
    "--dieline-panel-fill",
    "--dieline-panel-stroke",
  ]) {
    assert.match(css, new RegExp(`${token}:`));
  }
});

test("sample-image typography uses the self-hosted variable font with system fallbacks", async () => {
  const source = await readFile(sampleImageUrl, "utf8");
  assert.match(source, /"Inter Variable", "Segoe UI", Arial, sans-serif/);
  assert.doesNotMatch(source, /px Inter, Arial, sans-serif/);
});
