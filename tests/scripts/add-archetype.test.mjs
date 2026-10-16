import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { USAGE, main } from "../../scripts/add-archetype.mjs";
import { FIXTURE_POLICY, createFixture, messages, snapshot } from "../helpers/fixture.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const CLI = path.join(REPO_ROOT, "scripts", "add-archetype.mjs");
const PACK = "skills/inkexplain/references/archetypes/example-fox";
const FOX = ["--id", "example-fox", "--name", "Example Fox"];

function run(args, root) {
  let stdout = "";
  let stderr = "";
  const code = main(root === undefined ? args : ["--root", root, ...args], {
    stdout: { write: (chunk) => (stdout += chunk) },
    stderr: { write: (chunk) => (stderr += chunk) },
    policy: FIXTURE_POLICY,
  });
  return { code, stdout, stderr };
}

/** A run that must be refused with this exit code and message, printing nothing to stdout and changing nothing. */
function refused(fixture, args, code, message) {
  const before = snapshot(fixture.root);
  const result = run(args, fixture.root);
  assert.equal(result.code, code, `${args.join(" ")}\n${result.stderr}`);
  assert.match(result.stderr, message, args.join(" "));
  assert.equal(result.stdout, "", `${args.join(" ")} printed to stdout`);
  assert.deepEqual(snapshot(fixture.root), before, `${args.join(" ")} changed the repository`);
  return result;
}

test("--help and -h print the usage and exit 0, and the usage documents every flag", () => {
  for (const flag of ["--help", "-h"]) {
    const { code, stdout, stderr } = run([flag]);
    assert.equal(code, 0);
    assert.equal(stdout, `${USAGE}\n`);
    assert.equal(stderr, "");
  }
  const flags = [
    "--id", "--name", "--category", "--summary", "--alias", "--exclude", "--feature", "--action", "--pose", "--palette", "--avoid",
    "--medium", "--canvas", "--linework", "--rights-holder", "--license", "--source", "--credit", "--dry-run", "--json", "--root", "--help",
  ];
  for (const flag of flags) assert.ok(USAGE.includes(flag), `usage documents ${flag}`);
  assert.match(USAGE, /npm run archetype:add -- --id <id> --name/);
  assert.equal(run(["--help", "--bogus"]).code, 2, "an unknown flag is still an error");
});

test("--dry-run says what would change, passes the checks, and writes nothing", (t) => {
  const fixture = createFixture(t);
  const before = snapshot(fixture.root);
  const { code, stdout, stderr } = run([...FOX, "--dry-run"], fixture.root);
  assert.equal(code, 0, stderr);
  assert.match(stdout, /^Example Fox \(example-fox\) would be added: mascot, experimental\. Output folder: assets\/<article-slug>-example-fox\//);
  assert.match(stdout, /Dry run: nothing was written\./);
  assert.match(stdout, /Would create \(5\):\n {2}skills\/inkexplain\/references\/archetypes\/example-fox\/rights\.md/);
  assert.match(stdout, /Would update \(3\):\n {2}skills\/inkexplain\/registry\.json\n {2}ATTRIBUTIONS\.md\n {2}examples\/prompts\.md/);
  assert.match(stdout, /Would regenerate \(\d+, regenerated from the registry\):/);
  assert.match(stdout, /Checks: all \d+ repository checks pass with the new archetype\./);
  assert.match(stdout, /Still yours to settle: \d+ TODO or UNRESOLVED markers in 7 files\./);
  assert.deepEqual(snapshot(fixture.root), before);
});

test("a real run creates the pack, updates the registry and credits, and leaves a repository that passes every check", (t) => {
  const fixture = createFixture(t);
  const { code, stdout, stderr } = run(FOX, fixture.root);
  assert.equal(code, 0, stderr);
  assert.match(stdout, /^Example Fox \(example-fox\) added: mascot, experimental\./);
  assert.match(stdout, /Created \(5\):/);
  for (const file of ["rights.md", "identity.md", "style.md", "motion-and-acting.md", "prompts.md"]) assert.ok(fixture.exists(`${PACK}/${file}`), file);
  assert.match(fixture.read("skills/inkexplain/registry.json"), /"id": "example-fox"/);
  assert.match(fixture.read("ATTRIBUTIONS.md"), /### Example Fox/);
  assert.match(fixture.read("examples/prompts.md"), /\$inkexplain Use Example Fox\./);
  assert.match(stdout, /Next steps:\n {2}1\. Settle the rights first/);
  assert.match(stdout, /5\. Try it with real renders/);
  for (const check of fixture.run()) assert.equal(check.status, "pass", `${check.id}\n${messages(check)}`);
  assert.equal(run(FOX, fixture.root).code, 1, "running it again is refused, never repeated");
});

test("--json reports what was done in a form a script can read", (t) => {
  const fixture = createFixture(t);
  const { code, stdout } = run([...FOX, "--category", "house-style", "--json"], fixture.root);
  assert.equal(code, 0);
  const report = JSON.parse(stdout);
  assert.equal(report.dryRun, false);
  assert.deepEqual(report.archetype, { id: "example-fox", name: "Example Fox", category: "house-style", status: "experimental", outputFolder: "assets/<article-slug>-example-fox/" });
  assert.equal(report.created.length, 5);
  assert.deepEqual(report.updated, ["skills/inkexplain/registry.json", "ATTRIBUTIONS.md", "examples/prompts.md"]);
  assert.ok(report.regenerated.includes("README.md"));
  assert.equal(report.checks.failedAfter, 0);
  assert.ok(report.placeholders.length > 0 && report.placeholders.every((item) => item.path && item.line > 0 && /TODO|UNRESOLVED/.test(item.text)));
  assert.equal(report.nextSteps.length, 5);
  assert.ok(report.nextSteps.some((step) => step.includes("example-fox")), "the id is filled into the next steps");

  const dry = JSON.parse(run([...FOX, "--id", "another-fox", "--name", "Another Fox", "--dry-run", "--json"], fixture.root).stdout);
  assert.equal(dry.dryRun, true);
});

test("everything the contributor gives is used, and fewer markers are left", (t) => {
  const minimal = createFixture(t);
  const full = createFixture(t);
  const count = (fixture, args) => JSON.parse(run([...FOX, ...args, "--json"], fixture.root).stdout).placeholders.length;
  const given = [
    "--summary", "Example Fox, a sparse orange fox that digs and sorts ideas.", "--alias", "the fox", "--exclude", "fox",
    "--feature", "orange fox body", "--feature", "white-tipped tail", "--action", "dig", "--action", "carry", "--action", "sort",
    "--pose", "front paws planted on the object", "--palette", "black ink", "--palette", "fox orange", "--avoid", "realistic fur",
    "--medium", "Sparse marker sketch", "--canvas", "1:1 on warm paper", "--linework", "Bold brush pen",
    "--rights-holder", "Jane Artist", "--license", "CC BY 4.0", "--source", "https://example.org/fox", "--credit", "Example Fox by Jane Artist, CC BY 4.0",
  ];
  assert.ok(count(full, given) < count(minimal, []));

  const entry = JSON.parse(full.read("skills/inkexplain/registry.json")).archetypes.at(-1);
  assert.equal(entry.id, "example-fox");
  assert.deepEqual(entry.aliases, ["Example Fox", "the fox"]);
  assert.deepEqual(entry.excludedTerms, ["fox"]);
  assert.deepEqual(entry.contract.identityMarkers, ["orange fox body", "white-tipped tail"]);
  assert.deepEqual(entry.motionDna.signatureActions, ["dig", "carry", "sort"]);
  assert.deepEqual(entry.styleSheet, { medium: "Sparse marker sketch", canvas: "1:1 on warm paper", linework: "Bold brush pen", palette: ["black ink", "fox orange"], avoid: ["realistic fur"] });
  assert.deepEqual(entry.legalNotice, {
    credit: "Example Fox by Jane Artist, CC BY 4.0",
    rightsHolder: "Jane Artist",
    license: "CC BY 4.0",
    attributionTerms: ["Jane Artist", "https://example.org/fox"],
    restrictions: ["No logos, and no claims of affiliation, endorsement, sponsorship, or approval by the rights holder."],
  });
  assert.equal(entry.status, "experimental");
  assert.equal(entry.sampleGates.status, "pending");
  assert.ok(full.read(`${PACK}/prompts.md`).includes("Generate one standalone [16:9] horizontal"), "the first field still names the ratio");
});

test("a request the repository cannot take is refused with exit 1, says why, and changes nothing", (t) => {
  const fixture = createFixture(t);
  refused(fixture, ["--id", "demo", "--name", "Another Crab"], 1, /Another Crab \(demo\) cannot be added\.\n {2}- archetype id "demo" is already in the registry/);
  refused(fixture, ["--id", "crab-two", "--name", "Crab Two", "--alias", "demo mascot"], 1, /alias "demo mascot" collides with archetype demo/);
  refused(fixture, ["--id", "ink", "--name", "InkExplain Sketch Two"], 1, /archetype id "ink" is already in the registry/);
  fixture.write("skills/inkexplain/references/archetypes/stray/notes.md", "# stray\n");
  refused(fixture, ["--id", "stray", "--name", "Stray"], 1, /already exists; the scaffold never overwrites a pack/);
  refused(fixture, ["--id", "figure", "--name", "Ink Figure"], 1, /would break the repository checks, so nothing was written[\s\S]*SCHEMA-007/);
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "inkexplain-not-a-checkout-"));
  t.after(() => fs.rmSync(empty, { recursive: true, force: true }));
  const result = run(FOX, empty);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /Cannot read the archetype registry\./);
  assert.deepEqual(fs.readdirSync(empty), [], "nothing was created in a folder that is not a checkout");
});

test("input the contributor got wrong is a usage error that names the problem, and changes nothing", (t) => {
  const fixture = createFixture(t);
  refused(fixture, ["--name", "Example Fox"], 2, /--id is required/);
  refused(fixture, ["--id", "example-fox"], 2, /--name is required/);
  for (const id of ["../evil", "..\\evil", "Bad_ID", "UPPER", "a/b", "-x", "x".repeat(41)]) refused(fixture, ["--id", id, "--name", "Fox"], 2, /--id/);
  refused(fixture, [...FOX, "--category", "celebrity"], 2, /--category must be one of/);
  refused(fixture, ["--id", "example-fox", "--name", "Bad [Name]"], 2, /--name/);
  refused(fixture, [...FOX, "--summary", "x".repeat(300)], 2, /--summary is 300 characters; the limit is 240/);
  refused(fixture, [...FOX, "--source", "javascript:alert(1)"], 2, /--source .* must be an http or https URL/);
  refused(fixture, [...FOX, "--category", "house-style", "--license", "MIT"], 2, /--license records a third party's rights, but house-style is original to InkExplain/);
  refused(fixture, [...FOX, "--canvas", "white"], 2, /--canvas .* must start with the aspect ratio/);
  refused(fixture, [...FOX, "--bogus"], 2, /Unknown option '--bogus'/);
  refused(fixture, [...FOX, "stray"], 2, /Unexpected argument 'stray'/);
  assert.match(run(FOX.slice(0, 2), fixture.root).stderr, /Usage:/, "a usage error repeats the usage");
});

test("the script imports only Node built-ins it needs, and none that reach the network or a shell", () => {
  for (const file of [CLI, path.join(REPO_ROOT, "scripts", "lib", "scaffold.mjs")]) {
    const source = fs.readFileSync(file, "utf8");
    const imports = [...source.matchAll(/^import .* from "([^"]+)";$/gm)].map((match) => match[1]);
    assert.ok(imports.filter((specifier) => specifier.startsWith("node:")).every((specifier) => ["node:fs", "node:path", "node:process", "node:util"].includes(specifier)), `${path.basename(file)}: ${imports.join(", ")}`);
    assert.ok(imports.filter((specifier) => !specifier.startsWith("node:")).every((specifier) => specifier.startsWith("./")));
    assert.equal(/child_process|node:(?:https?|http2|net|tls|dgram)|\bfetch\s*\(|\beval\s*\(|new\s+Function\s*\(/.test(source), false, path.basename(file));
  }
});

test("npm run archetype:add is wired to the script", () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, "package.json"), "utf8"));
  assert.equal(manifest.scripts["archetype:add"], "node scripts/add-archetype.mjs");
});

test("the real entry point works from any directory, sets the exit code, and a dry run on this repository writes nothing", () => {
  const spawn = (args, cwd) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
  const elsewhere = os.tmpdir();
  const help = spawn(["--help"], elsewhere);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /^Usage:\n {2}npm run archetype:add/);
  assert.equal(spawn(["--id", "../x", "--name", "X"], elsewhere).status, 2);
  assert.equal(spawn(["--nope"], REPO_ROOT).status, 2);

  // The scaffold has to keep working on the repository that ships it: plan a new archetype against the real
  // registry and every real check, and write nothing.
  const registry = fs.readFileSync(path.join(REPO_ROOT, "skills/inkexplain/registry.json"), "utf8");
  const dry = spawn([...FOX, "--dry-run"], elsewhere);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /would be added: mascot, experimental/);
  assert.match(dry.stdout, /Checks: all \d+ repository checks pass with the new archetype\./);
  assert.equal(fs.readFileSync(path.join(REPO_ROOT, "skills/inkexplain/registry.json"), "utf8"), registry);
  assert.ok(!fs.existsSync(path.join(REPO_ROOT, PACK)), "no pack was written to this repository");
});
