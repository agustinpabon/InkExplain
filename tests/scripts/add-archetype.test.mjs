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

function run(args, root, { io } = {}) {
  let stdout = "";
  let stderr = "";
  const code = main(root === undefined ? args : ["--root", root, ...args], {
    stdout: { write: (chunk) => (stdout += chunk) },
    stderr: { write: (chunk) => (stderr += chunk) },
    policy: FIXTURE_POLICY,
    io,
  });
  return { code, stdout, stderr };
}

/** The real file API, except that the new rights.md is written with a broken link in it: what the checks find on disk is not what they found in memory. */
function corruptingIo() {
  return {
    ...fs,
    writeFileSync(file, data, ...rest) {
      const corrupt = String(file).replaceAll("\\", "/").endsWith("/example-fox/rights.md") && typeof data === "string";
      return fs.writeFileSync(file, corrupt ? `${data}\n[broken](docs/nope.md)\n` : data, ...rest);
    },
  };
}

/** The real file API, except that examples/prompts.md locks once written, so it cannot be put back, and README.md fails like a full disk. */
function brokenDisk() {
  let locked = false;
  return {
    ...fs,
    writeFileSync(file, ...rest) {
      const name = String(file).replaceAll("\\", "/");
      if (name.endsWith("/examples/prompts.md")) {
        if (locked) throw Object.assign(new Error("EBUSY: resource busy or locked"), { code: "EBUSY" });
        locked = true;
      }
      if (name.endsWith("/README.md")) throw Object.assign(new Error("ENOSPC: no space left on device, write"), { code: "ENOSPC" });
      return fs.writeFileSync(file, ...rest);
    },
  };
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
  assert.deepEqual(
    { ...report.checks, checks: undefined },
    { checks: undefined, failedChecksBefore: 0, failedChecksAfter: 0, issuesBefore: 0, issuesAfter: 0 },
    "the report says how many checks failed before and after, and not the private list the verification uses",
  );
  assert.ok(Number.isInteger(report.checks.checks) && report.checks.checks > 0);
  assert.ok(report.placeholders.length > 0 && report.placeholders.every((item) => item.path && item.line > 0 && /TODO|UNRESOLVED/.test(item.text)));
  assert.equal(report.nextSteps.length, 5);
  assert.ok(report.nextSteps.some((step) => step.includes("example-fox")), "the id is filled into the next steps");

  const dry = JSON.parse(run(["--id", "another-fox", "--name", "Another Fox", "--dry-run", "--json"], fixture.root).stdout);
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
  refused(fixture, [...FOX, "--canvas", "0:9 tall"], 2, /--canvas .* must start with the aspect ratio/);
  refused(fixture, ["--id", "con", "--name", "Con"], 2, /--id "con" is a reserved device name on Windows/);
  refused(fixture, [...FOX, "--alias", "a\\b"], 2, /--alias .* must be at most 59 characters of letters/);
  refused(fixture, [...FOX, "--summary", "~~~ not a sentence"], 2, /--summary must start with a letter or a digit/);
  refused(fixture, [...FOX, "--bogus"], 2, /Unknown option '--bogus'/);
  refused(fixture, [...FOX, "stray"], 2, /Unexpected argument 'stray'/);
  assert.match(run(FOX.slice(0, 2), fixture.root).stderr, /Usage:/, "a usage error repeats the usage");
});

test("a flag that takes one value is a usage error when it is given twice, instead of the last one winning", (t) => {
  const fixture = createFixture(t);
  refused(fixture, ["--id", "a-fox", "--id", "b-fox", "--name", "Fox"], 2, /--id was given more than once; it takes one value/);
  refused(fixture, [...FOX, "--summary", "A fox.", "--summary", "Another fox."], 2, /--summary was given more than once/);
  refused(fixture, [...FOX, "--category", "mascot", "--category", "house-style"], 2, /--category was given more than once/);
  const twice = run([...FOX, "--root", fixture.root, "--root", fixture.root]);
  assert.equal(twice.code, 2);
  assert.match(twice.stderr, /--root was given more than once/);
  // The flags that are meant to repeat still do.
  const many = run([...FOX, "--alias", "the fox", "--alias", "a fox", "--feature", "orange body", "--feature", "white tail", "--dry-run"], fixture.root);
  assert.equal(many.code, 0, many.stderr);
});

test("an id that git ignores and a source with a password are refused before anything is written", (t) => {
  const fixture = createFixture(t);
  refused(fixture, ["--id", "dist", "--name", "Dist Fox"], 2, /--id "dist" is a folder name that git ignores and the repository checks skip/);
  refused(fixture, ["--id", "outputs", "--name", "Outputs Fox"], 2, /--id "outputs" is a folder name that git ignores/);
  refused(fixture, [...FOX, "--source", "https://user:hunter2secret@example.org/fox"], 2, /--source must not carry a user name or password/);
});

test("checks that find a problem on disk that they did not find in memory undo every change and say what they found", (t) => {
  const fixture = createFixture(t);
  const before = snapshot(fixture.root);
  const result = run(FOX, fixture.root, { io: corruptingIo() });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /The repository checks failed after writing, so the changes were undone\.\n {2}- PKG-004 skills\/inkexplain\/references\/archetypes\/example-fox\/rights\.md: .*docs\/nope\.md does not resolve\nNothing was changed\./);
  assert.equal(result.stdout, "");
  assert.deepEqual(snapshot(fixture.root), before, "the pack, the registry entry, and the documents are all as they were");
});

test("a failure that was already there is tolerated, and a different one that the write causes is still caught", (t) => {
  const fixture = createFixture(t).write("docs/language-policy.md", "# Language policy\n");
  const before = snapshot(fixture.root);
  const caught = run(FOX, fixture.root, { io: corruptingIo() });
  assert.equal(caught.code, 1);
  assert.match(caught.stderr, /PKG-004 skills\/inkexplain\/references\/archetypes\/example-fox\/rights\.md: .*docs\/nope\.md does not resolve/);
  assert.doesNotMatch(caught.stderr, /LANG-003/, "the problem that was already there is not blamed on the new archetype");
  assert.deepEqual(snapshot(fixture.root), before);

  assert.equal(run(FOX, fixture.root).code, 0, "without the new problem the same run goes through");
});

test("a rollback that cannot finish says what is left and that the repository is not as it was, and does not claim every change was undone", (t) => {
  const fixture = createFixture(t);
  const result = run(FOX, fixture.root, { io: brokenDisk() });
  assert.equal(result.code, 1);
  assert.match(result.stderr, /^Writing failed \(ENOSPC: no space left on device, write\), and one change could not be undone:\n {2}- restore examples\/prompts\.md: EBUSY/);
  assert.match(result.stderr, /The repository is not as it was\. Review `git status` and undo these by hand\./);
  assert.doesNotMatch(result.stderr, /Every change was undone/);
  assert.equal(result.stdout, "");
  assert.ok(fixture.read("examples/prompts.md").includes("$inkexplain Use Example Fox."), "the file that could not be put back really still has the new text");
  assert.ok(!fixture.exists(PACK), "everything else was undone");
});

test("a checkout with Windows line endings is planned, written, and restored byte for byte", (t) => {
  const fixture = createFixture(t);
  for (const file of ["ATTRIBUTIONS.md", "examples/prompts.md"]) fixture.write(file, fixture.read(file).replaceAll("\r\n", "\n").replaceAll("\n", "\r\n"));
  const before = snapshot(fixture.root);
  const undone = run(FOX, fixture.root, { io: corruptingIo() });
  assert.equal(undone.code, 1, undone.stderr);
  assert.deepEqual(snapshot(fixture.root), before, "the files that were rewritten come back with their original bytes, line endings included");
  const done = run(FOX, fixture.root);
  assert.equal(done.code, 0, `the pre-check reads the files the way the plan did: ${done.stderr}`);
  assert.match(fixture.read("examples/prompts.md"), /\$inkexplain Use Example Fox\./);
});

test("an empty --root is a usage error, not the current folder", () => {
  for (const root of ["", "   "]) {
    const { code, stdout, stderr } = run([...FOX, "--root", root]);
    assert.equal(code, 2);
    assert.match(stderr, /--root needs a directory/);
    assert.equal(stdout, "");
  }
});

test("a name in another script, or written with combining marks, goes through every check", (t) => {
  const acute = String.fromCodePoint(0x301);
  for (const [id, name] of [["zoe-fox", "Zoë Fox"], ["cafe-fox", `Cafe${acute} Fox`], ["namaste", "नमस्ते"], ["sawasdee", "สวัสดี"]]) {
    const fixture = createFixture(t);
    const { code, stderr } = run(["--id", id, "--name", name], fixture.root);
    assert.equal(code, 0, `${name}\n${stderr}`);
    assert.match(fixture.read("ATTRIBUTIONS.md"), new RegExp(`### ${name.normalize("NFC")}\\n`), "the credit is headed by the composed name");
    for (const check of fixture.run()) assert.equal(check.status, "pass", `${name}: ${check.id}\n${messages(check)}`);
  }
});

test("a repository that already fails a check can still take an archetype, and the report says so", (t) => {
  const fixture = createFixture(t).write("docs/language-policy.md", "# Language policy\n");
  const dry = run([...FOX, "--dry-run"], fixture.root);
  assert.equal(dry.code, 0, dry.stderr);
  assert.match(dry.stdout, /Checks: 1 of \d+ fail \(\d+ issues?\), as they already did before this change\./);

  // The check that failed before still fails after, and the run is not undone for it.
  const real = run(FOX, fixture.root);
  assert.equal(real.code, 0, real.stderr);
  assert.ok(fixture.exists(`${PACK}/rights.md`));
  assert.deepEqual(fixture.run().filter((check) => check.status !== "pass").map((check) => check.id), ["LANG-003"]);
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
  // registry and every real check, and write nothing. The probe is not the documented example, so a
  // contributor who ran the Quick start here for real does not turn this test red.
  const registry = fs.readFileSync(path.join(REPO_ROOT, "skills/inkexplain/registry.json"), "utf8");
  const dry = spawn(["--id", "probe-zzq-fox", "--name", "Probe Zzq Fox", "--dry-run"], elsewhere);
  assert.equal(dry.status, 0, dry.stderr);
  assert.match(dry.stdout, /Probe Zzq Fox \(probe-zzq-fox\) would be added: mascot, experimental/);
  assert.match(dry.stdout, /Checks: all \d+ repository checks pass with the new archetype\./);
  assert.equal(fs.readFileSync(path.join(REPO_ROOT, "skills/inkexplain/registry.json"), "utf8"), registry);
  assert.ok(!fs.existsSync(path.join(REPO_ROOT, "skills/inkexplain/references/archetypes/probe-zzq-fox")), "no pack was written to this repository");
});
