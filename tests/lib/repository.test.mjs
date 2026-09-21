import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PathError, Repository, isWithin, normalizeRelativePath, normalizeText } from "../../scripts/lib/repository.mjs";

function tempRoot(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "inkexplain-repo-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test("normalizeRelativePath accepts clean relative paths", () => {
  assert.equal(normalizeRelativePath("docs/a.md"), "docs/a.md");
  assert.equal(normalizeRelativePath("docs/./a.md"), "docs/a.md");
  assert.equal(normalizeRelativePath("docs/sub/../a.md"), "docs/a.md");
  assert.equal(normalizeRelativePath("docs/"), "docs");
});

test("normalizeRelativePath rejects traversal, absolute paths, drive letters, and backslashes", () => {
  for (const bad of ["../outside.md", "docs/../../x", "/etc/passwd", "C:/Windows", "c:\\temp", "docs\\a.md", "", "a\0b"]) {
    assert.throws(() => normalizeRelativePath(bad), PathError, bad);
  }
});

test("isWithin compares relative paths without escaping", () => {
  assert.equal(isWithin("skills/inkexplain", "skills/inkexplain/references/a.md"), true);
  assert.equal(isWithin("skills/inkexplain", "skills/inkexplain"), true);
  assert.equal(isWithin("skills/inkexplain", "skills/other/a.md"), false);
  assert.equal(isWithin("skills/inkexplain", "skills/inkexplain/../../x"), false);
});

test("normalizeText converts CRLF and CR to LF and drops a BOM", () => {
  assert.equal(normalizeText("\uFEFFa\r\nb\rc\n"), "a\nb\nc\n");
});

test("Repository reads text with normalized line endings", (t) => {
  const root = tempRoot(t);
  fs.writeFileSync(path.join(root, "a.md"), "---\r\nname: x\r\n---\r\n");
  const repo = new Repository(root);
  assert.equal(repo.readText("a.md"), "---\nname: x\n---\n");
  assert.equal(repo.readTextIfExists("missing.md"), null);
  assert.throws(() => repo.readText("missing.md"), /missing/);
});

test("Repository.resolve never leaves the root", (t) => {
  const repo = new Repository(tempRoot(t));
  assert.throws(() => repo.resolve("../secret"), PathError);
  assert.ok(repo.resolve("a/b.md").startsWith(repo.root));
});

test("Repository.walk is sorted, recursive, and skips ignored directories", (t) => {
  const root = tempRoot(t);
  for (const file of ["b.md", "a/z.md", "a/y.md", ".git/config", "node_modules/m/index.js", "outputs/x.png", ".agents/skills/s.md"]) {
    fs.mkdirSync(path.join(root, path.dirname(file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), "x");
  }
  assert.deepEqual(new Repository(root).walk(), ["a/y.md", "a/z.md", "b.md"]);
});

test("Repository.walk reports symlinks only on request and never follows them", (t) => {
  const root = tempRoot(t);
  const outside = tempRoot(t);
  fs.writeFileSync(path.join(outside, "secret.md"), "secret");
  fs.writeFileSync(path.join(root, "real.md"), "real");
  try {
    fs.symlinkSync(outside, path.join(root, "linked"), "junction");
  } catch (error) {
    t.skip(`symlinks unavailable here: ${error.code}`);
    return;
  }
  const repo = new Repository(root);
  assert.deepEqual(repo.walk(), ["real.md"]);
  assert.deepEqual(repo.walk("", { includeSymlinks: true }), ["linked", "real.md"]);
  assert.equal(repo.isSymlink("linked"), true);
});
