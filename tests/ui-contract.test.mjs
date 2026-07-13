import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cssUrl = new URL("../app/globals.css", import.meta.url);

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
  const worker = await readFile(new URL("../worker/index.ts", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /drizzle|next-auth|openai\/chatgpt/i);
  assert.doesNotMatch(worker, /D1Database|R2Bucket|\/api\//);
});
