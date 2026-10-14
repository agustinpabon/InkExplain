import assert from "node:assert/strict";
import test from "node:test";
import { readPngInfo, svgProblems } from "../../scripts/lib/images.mjs";
import { makePng } from "../helpers/fixture.mjs";

test("readPngInfo reads dimensions from a valid PNG", () => {
  assert.deepEqual(readPngInfo(makePng(16, 9)), { width: 16, height: 9 });
});

test("readPngInfo rejects files that are not complete PNGs", () => {
  const png = makePng();
  assert.throws(() => readPngInfo(Buffer.from("GIF89a....................................")), /bad signature/);
  assert.throws(() => readPngInfo(png.subarray(0, png.length - 12)), /truncated/);
  const wrongChunk = Buffer.from(png);
  wrongChunk.write("IDAT", 12, "ascii");
  assert.throws(() => readPngInfo(wrongChunk), /IHDR/);
  const zeroWidth = Buffer.from(png);
  zeroWidth.writeUInt32BE(0, 16);
  assert.throws(() => readPngInfo(zeroWidth), /implausible PNG dimensions/);
});

test("svgProblems accepts a plain, self-contained SVG", () => {
  assert.deepEqual(svgProblems('<?xml version="1.0"?>\n<!-- logo -->\n<svg viewBox="0 0 1 1"><rect width="1" height="1"/></svg>\n'), []);
});

test("svgProblems rejects scripts, handlers, external references, and missing viewBox", () => {
  const cases = [
    ['<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>', /<script>/],
    ['<svg viewBox="0 0 1 1" onload="x()"></svg>', /event handler/],
    ['<svg viewBox="0 0 1 1"><image href="https://example.com/x.png"/></svg>', /external or executable/],
    ['<svg viewBox="0 0 1 1"><style>@import url(https://x);</style></svg>', /external styles/],
    ['<svg width="10"></svg>', /viewBox/],
    ["<html></html>", /does not start with an <svg>/],
  ];
  for (const [svg, pattern] of cases) assert.match(svgProblems(svg).join("\n"), pattern, svg);
});
