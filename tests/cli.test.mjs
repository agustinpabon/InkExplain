import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { main as buildDocs } from "../scripts/build-docs.mjs";
import { ALL_CHECKS } from "../scripts/lib/checks/index.mjs";
import { main as validate } from "../scripts/validate.mjs";
import { createFixture } from "./helpers/fixture.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
// The fixture repository does not contain the real language allowlist's files,
// so CLI runs against fixtures select every check except LANG-002.
const FIXTURE_CHECKS = ALL_CHECKS.map((check) => check.id).filter((id) => id !== "LANG-002").join(",");

function capture(run, args) {
  let stdout = "";
  let stderr = "";
  const code = run(args, { stdout: { write: (chunk) => (stdout += chunk) }, stderr: { write: (chunk) => (stderr += chunk) } });
  return { code, stdout, stderr };
}

test("validate exits 0 when every selected check passes", (t) => {
  const fixture = createFixture(t);
  const { code, stdout } = capture(validate, ["--root", fixture.root, "--only", FIXTURE_CHECKS]);
  assert.equal(code, 0, stdout);
  assert.match(stdout, /Summary: total=33 passed=33 failed=0 skipped=0/);
});

test("validate exits 1 and names the failing check and file", (t) => {
  const fixture = createFixture(t).remove("skills/inkexplain/references/archetypes/demo/rights.md");
  const { code, stdout } = capture(validate, ["--root", fixture.root, "--only", "SCHEMA"]);
  assert.equal(code, 1);
  assert.match(stdout, /\[FAIL\] SCHEMA-003 /);
  assert.match(stdout, /archetypes\/demo\/rights\.md: archetype demo is missing a pack file/);
});

test("validate exits 2 for usage errors", () => {
  assert.equal(capture(validate, ["--bogus"]).code, 2);
  assert.equal(capture(validate, ["--only", "NOPE-999"]).code, 2);
  assert.equal(capture(validate, ["positional"]).code, 2);
});

test("validate --json reports every check in catalog order", (t) => {
  const fixture = createFixture(t);
  const { code, stdout } = capture(validate, ["--root", fixture.root, "--json"]);
  const report = JSON.parse(stdout);
  assert.deepEqual(report.results.map((result) => result.id), ALL_CHECKS.map((check) => check.id));
  assert.equal(report.summary.total, ALL_CHECKS.length);
  assert.ok(report.results.every((result) => ["pass", "fail", "skip"].includes(result.status) && Array.isArray(result.issues)));
  assert.equal(code, report.summary.failed > 0 ? 1 : 0);
});

test("validate --only filters by area or id, and --list prints the catalog", () => {
  const listed = capture(validate, ["--list", "--only", "SEC,DOC-001"]).stdout.trim().split("\n");
  assert.deepEqual(
    listed.map((line) => line.split("\t")[0]),
    ["DOC-001", "SEC-001", "SEC-002", "SEC-003", "SEC-004"],
  );
  assert.equal(capture(validate, ["--help"]).code, 0);
});

test("check ids are unique and grouped by area", () => {
  const ids = ALL_CHECKS.map((check) => check.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const check of ALL_CHECKS) assert.ok(check.id.startsWith(`${check.area}-`), check.id);
});

test("build-docs --check reports stale documents, and build-docs repairs them", (t) => {
  const fixture = createFixture(t);
  assert.equal(capture(buildDocs, ["--check", "--root", fixture.root]).code, 0);
  fixture.updateRegistry((data) => (data.archetypes[1].summary = "A crustacean mascot for the docs test."));
  const stale = capture(buildDocs, ["--check", "--root", fixture.root]);
  assert.equal(stale.code, 1);
  assert.match(stale.stdout, /skills\/inkexplain\/references\/routing\.md/);
  assert.match(stale.stdout, /README\.md/);
  const write = capture(buildDocs, ["--root", fixture.root]);
  assert.equal(write.code, 0);
  assert.match(write.stdout, /updated README\.md/);
  assert.equal(capture(buildDocs, ["--check", "--root", fixture.root]).code, 0);
  assert.match(fixture.read("README.md"), /A crustacean mascot for the docs test./);
});

test("build-docs refuses to run on an invalid registry", (t) => {
  const fixture = createFixture(t).write("skills/inkexplain/registry.json", "{}");
  const result = capture(buildDocs, ["--root", fixture.root]);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Cannot generate documents/);
});

test("the real CLI entry point sets the process exit code", (t) => {
  const fixture = createFixture(t);
  const ok = spawnSync(process.execPath, ["scripts/validate.mjs", "--root", fixture.root, "--only", "PKG"], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(ok.status, 0, ok.stdout + ok.stderr);
  fixture.remove("skills/inkexplain/SKILL.md");
  const failed = spawnSync(process.execPath, ["scripts/validate.mjs", "--root", fixture.root, "--only", "PKG"], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(failed.status, 1);
  const usage = spawnSync(process.execPath, ["scripts/validate.mjs", "--nope"], { cwd: REPO_ROOT, encoding: "utf8" });
  assert.equal(usage.status, 2);
});

// [stage] test(cli): verify that unknown command line flags trigger error messages
