import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import test from "node:test";

const assets = new URL("../dist/client/assets/", import.meta.url);

test("initial application assets remain within release budgets", async () => {
  const names = await readdir(assets);
  const css = names.filter((name) => name.endsWith(".css"));
  const applicationScripts = names.filter((name) => name.endsWith(".js") && !name.includes("analysis.worker"));
  assert.ok(css.length > 0, "The build must emit application CSS.");
  assert.ok(applicationScripts.length > 0, "The build must emit application JavaScript.");

  const cssGzipBytes = gzipSync(Buffer.concat(await Promise.all(css.map((name) => readFile(new URL(name, assets)))))).length;
  assert.ok(cssGzipBytes <= 20 * 1024, `CSS is ${(cssGzipBytes / 1024).toFixed(1)} KiB gzip; budget is 20 KiB.`);

  const scriptSizes = await Promise.all(applicationScripts.map(async (name) => ({ name, bytes: gzipSync(await readFile(new URL(name, assets))).length })));
  const largest = scriptSizes.sort((a, b) => b.bytes - a.bytes)[0];
  assert.ok(largest.bytes <= 150 * 1024, `${largest.name} is ${(largest.bytes / 1024).toFixed(1)} KiB gzip; budget is 150 KiB.`);

  const worker = names.find((name) => name.includes("analysis.worker"));
  assert.ok(worker, "OpenCV must remain isolated in a lazy analysis worker.");
});

