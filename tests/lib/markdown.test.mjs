import assert from "node:assert/strict";
import test from "node:test";
import {
  extractCodeBlocks,
  extractHeadings,
  extractLinks,
  headingAnchors,
  parseFrontmatter,
  readRegion,
  regionLineRanges,
  replaceRegion,
  sectionBody,
  splitTarget,
} from "../../scripts/lib/markdown.mjs";

test("parseFrontmatter reads YAML and reports the body start", () => {
  const result = parseFrontmatter("---\nname: inkexplain\ndescription: Turn ideas into pictures.\n---\n# Title\n");
  assert.equal(result.found, true);
  assert.deepEqual(result.errors, []);
  assert.equal(result.data.name, "inkexplain");
  assert.equal(result.body, "# Title\n");
  assert.equal(result.bodyStartLine, 5);
});

test("parseFrontmatter tolerates CRLF and reports malformed blocks", () => {
  assert.equal(parseFrontmatter("---\r\nname: a\r\n---\r\nbody").data.name, "a");
  assert.equal(parseFrontmatter("no frontmatter").found, false);
  assert.match(parseFrontmatter("---\nname: a\n").errors[0].message, /no closing/);
  const bad = parseFrontmatter("---\nname: a: b\n---\n");
  assert.equal(bad.errors[0].line, 2);
});

test("extractHeadings ignores headings inside code fences", () => {
  const text = "# One\n```md\n# Not a heading\n```\n## Two ##\n~~~\n## Also not\n~~~\n### Three\n";
  assert.deepEqual(
    extractHeadings(text).map((heading) => [heading.level, heading.text, heading.line]),
    [
      [1, "One", 1],
      [2, "Two", 5],
      [3, "Three", 9],
    ],
  );
});

test("sectionBody returns content up to the next heading of the same level", () => {
  const text = "# T\n## A\nalpha\n### A1\nnested\n## B\nbeta\n";
  assert.equal(sectionBody(text, "a"), "alpha\n### A1\nnested");
  assert.equal(sectionBody(text, "B"), "beta");
  assert.equal(sectionBody(text, "missing"), null);
});

test("extractCodeBlocks returns info strings and content", () => {
  const blocks = extractCodeBlocks("x\n```text\nhello\n```\n````md\n```inner```\n````\n");
  assert.deepEqual(
    blocks.map((block) => [block.info, block.content, block.startLine]),
    [
      ["text", "hello", 2],
      ["md", "```inner```", 5],
    ],
  );
});

test("extractLinks finds Markdown and HTML links outside code", () => {
  const text = [
    "[a](docs/a.md) and ![img](assets/x.png \"title\") and [b](<docs/with space.md>)",
    "`[not](a-link.md)` and <img src=\"brand/logo.svg\" alt=\"\"> <a href='https://example.com'>x</a>",
    "```",
    "[inside](code.md)",
    "```",
  ].join("\n");
  assert.deepEqual(
    extractLinks(text).map((link) => [link.target, link.kind, link.line]),
    [
      ["docs/a.md", "link", 1],
      ["assets/x.png", "image", 1],
      ["docs/with space.md", "link", 1],
      ["brand/logo.svg", "image", 2],
      ["https://example.com", "link", 2],
    ],
  );
});

test("splitTarget separates anchors and decodes paths", () => {
  assert.deepEqual(splitTarget("docs/My%20File.md#intro"), { path: "docs/My File.md", anchor: "intro" });
  assert.deepEqual(splitTarget("#only-anchor"), { path: "", anchor: "only-anchor" });
});

test("headingAnchors mirrors GitHub slugs, including duplicates", () => {
  const anchors = headingAnchors("# Hello World\n## Route `id` Rules!\n## Hello World\n## Índice\n");
  for (const anchor of ["hello-world", "route-id-rules", "hello-world-1", "índice"]) assert.ok(anchors.has(anchor), anchor);
});

test("regions can be read, replaced, and located", () => {
  const text = "a\n<!-- inkexplain:routes:start -->\nold\n<!-- inkexplain:routes:end -->\nb\n";
  assert.equal(readRegion(text, "routes").content, "old");
  assert.equal(readRegion(replaceRegion(text, "routes", "new\nlines"), "routes").content, "new\nlines");
  assert.deepEqual(regionLineRanges(text, "routes"), [[2, 4]]);
  assert.equal(readRegion(text, "missing").found, false);
  assert.match(readRegion("<!-- inkexplain:x:start -->", "x").errors[0], /missing/);
  assert.throws(() => replaceRegion("nothing", "routes", "x"), /not found/);
});
