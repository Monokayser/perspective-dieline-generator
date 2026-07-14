import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const htmlUrl = new URL("../dist/index.html", import.meta.url);

test("static build emits the accessible local-first boot shell", async () => {
  const html = await readFile(htmlUrl, "utf8");
  assert.match(html, /<html lang="en"/i);
  assert.match(html, /<div id="root"><\/div>/i);
  assert.match(html, /Perspective Dieline Generator/i);
  assert.match(html, /rel="canonical" href="https:\/\/monokayser\.github\.io\/perspective-dieline-generator\/"/i);
  assert.match(html, /(?:src|href)="\/assets\/[^"]+\.(?:js|css)"/i);
  assert.doesNotMatch(html, /sign in|database|cloud project sync/i);
});
