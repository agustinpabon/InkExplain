import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { isMain } from "../../scripts/lib/entrypoint.mjs";

const SCRIPTS = path.resolve(import.meta.dirname, "../../scripts");
const ENTRY_POINTS = ["validate.mjs", "build-docs.mjs", "explain.mjs", "add-archetype.mjs"];

/** A folder that reaches the scripts through a link: a junction on Windows, a symbolic link elsewhere. */
function linkedScripts(t) {
  const holder = fs.mkdtempSync(path.join(os.tmpdir(), "inkexplain-link-"));
  t.after(() => fs.rmSync(holder, { recursive: true, force: true }));
  const link = path.join(holder, "linked-scripts");
  fs.symlinkSync(SCRIPTS, link, "junction");
  return link;
}

test("isMain compares real paths, so a script started through a link still counts as started directly", (t) => {
  const link = linkedScripts(t);
  const real = path.join(SCRIPTS, "validate.mjs");
  assert.ok(isMain(real, real));
  assert.ok(isMain(real, path.join(link, "validate.mjs")), "the same file under another path is the same script");
  assert.ok(isMain(path.join(link, "validate.mjs"), real));
  assert.ok(!isMain(real, path.join(SCRIPTS, "explain.mjs")), "another script is not");
  assert.ok(!isMain(real, undefined), "no entry (an interactive session) is not");
  assert.ok(isMain(path.join(SCRIPTS, "missing.mjs"), path.join(SCRIPTS, "missing.mjs")), "a path that cannot be resolved falls back to comparing the paths as given");
  assert.ok(!isMain(path.join(SCRIPTS, "missing.mjs"), real));
});

test("every script runs when it is started through a link to the scripts folder, and does not exit 0 without doing anything", (t) => {
  const link = linkedScripts(t);
  for (const name of ENTRY_POINTS) {
    // An unknown flag is a usage error (exit 2). If the entry check failed, the script would do nothing and exit 0.
    const result = spawnSync(process.execPath, [path.join(link, name), "--bogus"], { encoding: "utf8", cwd: os.tmpdir() });
    assert.equal(result.status, 2, `${name}: ${result.stdout}${result.stderr}`);
    assert.match(result.stderr, /Usage|Unknown option/i, name);
  }
});

test("a script that is imported rather than started does not run", () => {
  const source = ENTRY_POINTS.map((name) => `await import(${JSON.stringify(pathToFileURL(path.join(SCRIPTS, name)).href)});`).join("\n");
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", source], { encoding: "utf8", cwd: os.tmpdir() });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout + result.stderr, "", "importing prints nothing and sets no exit code");
});
