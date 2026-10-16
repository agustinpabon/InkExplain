import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { USAGE, main } from "../../scripts/explain.mjs";
import { assemblePrompt } from "../../scripts/lib/prompt-assembly.mjs";
import { loadRegistry, packFilePath } from "../../scripts/lib/registry.mjs";
import { Repository } from "../../scripts/lib/repository.mjs";
import { createFixture } from "../helpers/fixture.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const CLI = path.join(REPO_ROOT, "scripts", "explain.mjs");
const repo = new Repository(REPO_ROOT);
const { registry } = loadRegistry(repo);

function run(args) {
  let stdout = "";
  let stderr = "";
  const code = main(args, { stdout: { write: (chunk) => (stdout += chunk) }, stderr: { write: (chunk) => (stderr += chunk) } });
  return { code, stdout, stderr };
}

/** A run that must be refused: exit code, a message on stderr, and nothing on stdout. */
function refused(args, code, message) {
  const result = run(args);
  assert.equal(result.code, code, `${args.join(" ")}\n${result.stderr}`);
  assert.match(result.stderr, message, args.join(" "));
  assert.equal(result.stdout, "", `${args.join(" ")} printed to stdout`);
  return result;
}

test("--help and -h print the usage and exit 0", () => {
  for (const flag of ["--help", "-h"]) {
    const { code, stdout, stderr } = run([flag]);
    assert.equal(code, 0);
    assert.equal(stdout, `${USAGE}\n`);
    assert.equal(stderr, "");
  }
  for (const flag of ["--list", "--archetype", "--concept", "--action", "--label", "--aspect", "--background", "--format", "--root", "--help"]) {
    assert.ok(USAGE.includes(flag), `usage documents ${flag}`);
  }
  assert.equal(run(["--help", "--bogus"]).code, 2, "an unknown flag is still an error");
  assert.equal(run(["--help", "--list"]).stdout, `${USAGE}\n`, "help wins over other commands");
});

test("--list prints every archetype with category, style, status, and license", () => {
  const { code, stdout, stderr } = run(["--list"]);
  assert.equal(code, 0);
  assert.equal(stderr, "");
  const lines = stdout.split("\n");
  assert.equal(lines[0], `InkExplain archetypes (${registry.archetypes.length})`);
  const header = lines[2];
  for (const title of ["ID", "NAME", "CATEGORY", "STATUS", "STYLE", "SAMPLES", "LICENSE"]) assert.ok(header.includes(title), title);
  const rows = lines.slice(4, 4 + registry.archetypes.length);
  assert.deepEqual(rows.map((row) => row.split(/\s{2,}/)[0]), registry.archetypes.map((archetype) => archetype.id));
  const row = (id) => rows.find((candidate) => candidate.startsWith(`${id} `));
  assert.match(row("ferris"), /^ferris\s+Ferris\s+mascot\s+active\s+Ink sketch\s+pending\s+CC0 public-domain dedication$/);
  assert.match(row("littlebox"), /tribute-character\s+active\s+Marker\s+pending\s+MIT$/);
  assert.match(row("xiaohei"), /mascot\s+active\s+Ink sketch\s+approved\s+MIT/, "Xiaohei is the one archetype with a review made for InkExplain");
  assert.match(row("tux"), /mascot\s+active\s+Ink sketch\s+pending\s+Free to use and modify/);
  assert.match(stdout, /Default archetype: ink \(used when --archetype is omitted\)\./);
  assert.equal(run(["--list"]).stdout, stdout, "deterministic");
});

test("--list --format json is the same listing with rights holders and aliases", () => {
  const { code, stdout } = run(["--list", "--format", "json"]);
  assert.equal(code, 0);
  const rows = JSON.parse(stdout);
  assert.deepEqual(rows.map((row) => row.id), registry.archetypes.map((archetype) => archetype.id));
  assert.deepEqual(rows.filter((row) => row.default).map((row) => row.id), ["ink"]);
  const ferris = rows.find((row) => row.id === "ferris");
  assert.equal(ferris.rightsHolder, "Karen Rustad Tolva");
  assert.equal(ferris.samples, "pending");
  assert.equal(rows.find((row) => row.id === "xiaohei").samples, "approved");
  assert.equal(ferris.thirdParty, true);
  assert.equal(ferris.outputFolder, "assets/<article-slug>-ferris/");
  assert.ok(ferris.aliases.includes("Rust mascot"));
  assert.equal(rows.find((row) => row.id === "ink").thirdParty, false);
  assert.deepEqual(rows.find((row) => row.id === "littlebox").background, {
    default: "pure white #FFFFFF",
    presets: ["warm off-white #FFFCF5", "pale sky blue #E3F2FD", "pale lavender #E6E6FA"],
  });
  assert.deepEqual(rows.filter((row) => row.background !== null).map((row) => row.id), ["littlebox"], "only Littlebox offers a page color");
});

test("--background keeps Littlebox on pure white by default and honors a preset or a light color", () => {
  const base = ["--archetype", "littlebox", "--concept", "A queue waits behind one slow worker."];
  const standard = run(base);
  assert.equal(standard.code, 0, standard.stderr);
  assert.match(standard.stdout, /^Background: pure white #FFFFFF \(default\)$/m);
  assert.match(standard.stdout, /on a perfectly flat pure white background #FFFFFF\./);
  assert.doesNotMatch(standard.stdout, /#E3F2FD|#E6E6FA|lavender|sky blue/i);
  assert.doesNotMatch(standard.stdout, /^ *\d+\. .*background/im, "the default page is not a field left to plan");

  const lavender = run([...base, "--background", "lavender"]);
  assert.equal(lavender.code, 0, lavender.stderr);
  assert.match(lavender.stdout, /^Background: pale lavender #E6E6FA \(preset\)$/m);
  assert.match(lavender.stdout, /on a perfectly flat pale lavender background #E6E6FA\./);
  assert.doesNotMatch(lavender.stdout, /#FFFFFF/);

  assert.match(run([...base, "--background", "#E3F2FD"]).stdout, /^Background: pale sky blue #E3F2FD \(preset\)$/m);
  assert.match(run([...base, "--background", "Pale Sky Blue"]).stdout, /^Background: pale sky blue #E3F2FD \(preset\)$/m);
  assert.match(run([...base, "--background", "#FDF6E3"]).stdout, /^Background: custom #FDF6E3 \(custom\)$/m);
  assert.match(run([...base, "--background", "mint green #DFF5E6"]).stdout, /on a perfectly flat mint green background #DFF5E6\./);
  // Asking for the default by name is the same as saying nothing.
  assert.equal(run([...base, "--background", "white"]).stdout, standard.stdout);
});

test("--background --format json and prompt report the page, and a series never alternates it", () => {
  const concepts = ["A bottleneck sets the speed of the whole pipeline.", "A tender memory.", "A technical index speeds up a query.", "A quiet reflection.", "A system of three services."];
  const pages = (extra) =>
    concepts.map((concept) => JSON.parse(run(["--archetype", "littlebox", "--concept", concept, ...extra, "--format", "json"]).stdout).background);
  assert.deepEqual([...new Set(pages([]).map((page) => JSON.stringify(page)))], [JSON.stringify({ name: "pure white", hex: "#FFFFFF", kind: "default" })]);
  assert.deepEqual(
    [...new Set(pages(["--background", "pale lavender"]).map((page) => JSON.stringify(page)))],
    [JSON.stringify({ name: "pale lavender", hex: "#E6E6FA", kind: "preset" })],
  );
  assert.equal(JSON.parse(run(["--archetype", "ferris", "--concept", "x", "--format", "json"]).stdout).background, null);
  const prompt = run(["--archetype", "littlebox", "--concept", "x", "--background", "cream", "--format", "prompt"]).stdout;
  assert.match(prompt, /on a perfectly flat warm off-white background #FFFCF5\./);
});

test("--background is refused when the color is dark or unknown, or the archetype has a fixed page", () => {
  const base = ["--archetype", "littlebox", "--concept", "x"];
  refused([...base, "--background", "#222222"], 2, /the background #222222 is too dark: black marker lines and a white character body need a light page/);
  refused([...base, "--background", "mint"], 2, /unknown background "mint"; Littlebox offers pure white \(default\), warm off-white, pale sky blue, pale lavender, or any light #RRGGBB color/);
  refused([...base, "--background", "facade"], 2, /unknown background "facade"/);
  refused([...base, "--background", "  "], 2, /--background needs a color name or a #RRGGBB value/);
  refused(["--archetype", "ferris", "--concept", "x", "--background", "lavender"], 2, /Ferris draws on a fixed background and takes no background option/);
  refused(["--concept", "x", "--background", "white"], 2, /InkExplain Sketch draws on a fixed background and takes no background option/);
  refused(["--list", "--background", "white"], 2, /--list cannot be combined with --background/);
  refused(["--background", "white"], 2, /--concept is required/);
});

test("--archetype and --concept assemble the prompt, negative prompt, and aspect ratio", () => {
  const concept = "Two threads each hold one lock and wait for the other.";
  const { code, stdout, stderr } = run(["--archetype", "ferris", "--concept", concept]);
  assert.equal(code, 0);
  assert.equal(stderr, "");
  const expected = assemblePrompt(repo, registry.byId.get("ferris"), { concept });
  assert.ok(stdout.includes(expected.prompt), "the prompt is the library's");
  assert.ok(stdout.includes(expected.negativePrompt), "the negative prompt is the library's");
  assert.match(stdout, /^Archetype: Ferris \(ferris\), mascot, active$/m);
  assert.match(stdout, /^Aspect ratio: 16:9$/m);
  assert.match(stdout, /^Output folder: assets\/<article-slug>-ferris\/$/m);
  assert.match(stdout, /^Credit: Ferris the Rustacean was created by Karen Rustad Tolva/m);
  assert.match(stdout, /^Scene: Two threads each hold one lock and wait for the other\.$/m);
  assert.match(stdout, /^Rights note: Ferris the Rustacean/m);
  assert.match(stdout, /^PROMPT\n------\nGenerate one standalone 16:9 horizontal article illustration\./m);
  assert.match(stdout, /^NEGATIVE PROMPT\n---------------\nRust or Cargo logos/m);
  assert.match(stdout, /^STILL TO FILL \(7\)$/m, "state, action, structure, positions, props, concept of props, labels");
  assert.match(stdout, /Action: \[specific physical action\] \(fill it with --action\)/);
  assert.match(stdout, /Labels: \["label 1", "label 2", "label 3"\] \(fill it with --label, two to six times\)/);
});

test("--action, --label, and --aspect fill their fields", () => {
  const { code, stdout } = run([
    "-a", "ferris",
    "-c", "Two threads wait on each other.",
    "--action", "clamping a key while reaching for a second one.",
    "--label", "lock A",
    "--label", "lock B",
    "--label", "waiting",
    "--aspect", "1:1",
  ]);
  assert.equal(code, 0);
  assert.match(stdout, /^Aspect ratio: 1:1$/m);
  assert.match(stdout, /^Generate one standalone 1:1 article illustration\.$/m);
  assert.match(stdout, /central action: clamping a key while reaching for a second one, caught at its decisive moment\./);
  assert.match(stdout, /never translated: \["lock A", "lock B", "waiting"\]\./);
  assert.match(stdout, /^STILL TO FILL \(5\)$/m);
  assert.doesNotMatch(stdout, /fill it with --action/);
  assert.match(stdout, /Tools with separate fields: aspect ratio 1:1;/);
});

test("an alias or a different case selects the archetype, and no name selects the default one", () => {
  for (const name of ["Rust mascot", "FERRIS", "  rustacean  "]) {
    assert.match(run(["--archetype", name, "--concept", "x"]).stdout, /^Archetype: Ferris \(ferris\)/m, name);
  }
  assert.match(run(["--concept", "A cache is a promise you keep renewing."]).stdout, /^Archetype: InkExplain Sketch \(ink\), house-style, active$/m);
  assert.doesNotMatch(run(["--concept", "x"]).stdout, /Rights note|^Credit:/m, "the house style needs no rights note");
});

test("--format prompt prints the prompt alone, and --format json the whole result", () => {
  const options = { concept: "Two threads wait on each other.", action: "clamping a key", labels: ["lock A", "lock B"] };
  const args = ["--archetype", "gopher", "--concept", options.concept, "--action", options.action, "--label", "lock A", "--label", "lock B"];
  const library = assemblePrompt(repo, registry.byId.get("gopher"), options);

  const prompt = run([...args, "--format", "prompt"]);
  assert.equal(prompt.code, 0);
  assert.equal(prompt.stdout, `${library.prompt}\n`);

  const json = JSON.parse(run([...args, "--format", "json"]).stdout);
  assert.deepEqual(json.archetype, { id: "gopher", name: "Go Gopher", category: "mascot", status: "active" });
  assert.equal(json.aspectRatio, "16:9");
  assert.equal(json.prompt, library.prompt);
  assert.equal(json.negativePrompt, library.negativePrompt);
  assert.equal(json.rightsNote, library.rightsNote);
  assert.match(json.credit, /Renee French/);
  assert.equal(json.outputFolder, "assets/<article-slug>-gopher/");
  assert.match(json.source, /archetypes\/gopher\/prompts\.md$/);
  assert.deepEqual(json.notices, []);
  assert.deepEqual(json.unfilled.map((entry) => entry.slot), [null, null, null, null], "only the planner's fields are left");
  assert.deepEqual(json.unfilled.map((entry) => entry.optional), [true, false, false, false], "the reference sentence may be deleted");
  assert.match(run([...args, "--format", "text"]).stdout, /optional: delete the sentence when it does not apply/);
});

test("every shipped archetype assembles from the command line, with its rights note when third-party", () => {
  for (const archetype of registry.archetypes) {
    const { code, stdout, stderr } = run(["--archetype", archetype.id, "--concept", "A queue waits behind one slow worker."]);
    assert.equal(code, 0, `${archetype.id}\n${stderr}`);
    assert.match(stdout, /^Scene: A queue waits behind one slow worker\.$/m, archetype.id);
    assert.match(stdout, /^NEGATIVE PROMPT$/m, archetype.id);
    assert.equal(/^Rights note: /m.test(stdout), archetype.thirdParty, `${archetype.id} rights note`);
  }
});

test("a gated or experimental archetype says what that means", (t) => {
  const fixture = createFixture(t);
  const gated = run(["--root", fixture.root, "--archetype", "guarded", "--concept", "x"]);
  assert.equal(gated.code, 0, gated.stderr);
  assert.match(gated.stdout, /^Gated archetype: use it only within your own authorization, and do not publish its images without one\.$/m);
  assert.deepEqual(JSON.parse(run(["--root", fixture.root, "--archetype", "guarded", "--concept", "x", "--format", "json"]).stdout).notices.length, 1);

  fixture.updateRegistry((data) => (data.archetypes[1].status = "experimental"));
  const experimental = run(["--root", fixture.root, "--archetype", "demo", "--concept", "x"]);
  assert.match(experimental.stdout, /^Experimental archetype: its pack has not been tried with real renders yet\.$/m);
  assert.doesNotMatch(run(["--root", fixture.root, "--archetype", "ink", "--concept", "x"]).stdout, /Gated|Experimental/);
});

test("a name that selects nothing is refused with the closest archetypes", () => {
  const typo = refused(["--archetype", "ferrys", "--concept", "x"], 2, /Unknown archetype "ferrys"\. Did you mean: ferris/);
  assert.match(typo.stderr, /Run with --list to see every archetype\./);
  assert.match(typo.stderr, /^Usage:/m, "the usage follows the error");
  refused(["--archetype", "penguin", "--concept", "x"], 2, /"penguin" is too generic to select an archetype\. Did you mean: tux/);
  refused(["--archetype", "nonsense words", "--concept", "x"], 2, /Unknown archetype "nonsense words"\./);
  const everyActive = registry.archetypes.filter((archetype) => archetype.inAll).length;
  refused(["--archetype", "all archetypes", "--concept", "x"], 2, new RegExp(`takes one archetype; "all archetypes" selects ${everyActive}`));
  refused(["--archetype", "  ", "--concept", "x"], 2, /--archetype needs an id or an alias/);
});

test("missing or conflicting flags are usage errors", () => {
  refused([], 2, /Nothing to do: give --list, or --concept/);
  refused(["--archetype", "ferris"], 2, /--concept is required to assemble a prompt/);
  refused(["--action", "pulling"], 2, /--concept is required/);
  refused(["--list", "--concept", "x"], 2, /--list cannot be combined with --concept/);
  refused(["--list", "--archetype", "ferris"], 2, /--list cannot be combined with --archetype/);
  refused(["--list", "--format", "prompt"], 2, /--format prompt applies to a prompt, not to --list/);
  refused(["--concept", "x", "--format", "xml"], 2, /--format must be one of text, json, prompt, got "xml"/);
  refused(["--bogus"], 2, /Unknown option '--bogus'/);
  refused(["ferris"], 2, /Unexpected argument 'ferris'/);
  refused(["--concept"], 2, /--concept.* argument missing/);
});

test("input the person got wrong is a usage error that names the problem", () => {
  const ok = ["--archetype", "ferris"];
  refused([...ok, "--concept", "x", "--aspect", "wide"], 2, /aspect ratio must look like 16:9, got "wide"/);
  refused([...ok, "--concept", "x", "--aspect", "100:9"], 2, /aspect ratio must look like 16:9/);
  refused([...ok, "--concept", "   "], 2, /the concept must not be empty/);
  refused([...ok, "--concept", "x".repeat(401)], 2, /the concept is 401 characters; the limit is 400/);
  refused([...ok, "--concept", "x", "--action", "y".repeat(301)], 2, /the action is 301 characters; the limit is 300/);
  refused([...ok, "--concept", "x", "--label", 'say "hi"'], 2, /must not contain quotes or brackets/);
  refused([...ok, "--concept", "x", "--label", "[field]"], 2, /must not contain quotes or brackets/);
  refused([...ok, "--concept", "x", ...Array.from({ length: 7 }, (_, i) => ["--label", `label ${i}`]).flat()], 2, /two to six labels; got 7/);
});

test("a repository the tool cannot use is a failure, not a usage error", (t) => {
  const fixture = createFixture(t);
  const demo = loadRegistry(new Repository(fixture.root)).registry.byId.get("demo");
  const base = ["--root", fixture.root, "--archetype", "demo", "--concept", "x"];
  assert.equal(run(base).code, 0);

  fixture.write(packFilePath(demo, "prompts.md"), "# Demo Prompts\n\n## Generation prompt\n\n```text\nDraw one idea.\n```\n");
  refused(base, 1, /Cannot assemble a prompt for demo: .*the generation prompt lacks the \[core idea in one sentence\] field/);

  fixture.remove(packFilePath(demo, "prompts.md"));
  refused(base, 1, /Cannot assemble a prompt for demo: .*prompts\.md is missing/);

  fixture.write("skills/inkexplain/registry.json", "{}");
  refused(base, 1, /Cannot read the archetype registry:\n {2}- /);
  refused(["--root", path.join(fixture.root, "no-such-folder"), "--list"], 1, /Cannot read the archetype registry:/);
});

test("the script imports only Node built-ins it needs, and none that reach the network or a shell", () => {
  const source = fs.readFileSync(CLI, "utf8");
  const imports = [...source.matchAll(/^import .* from "([^"]+)";$/gm)].map((match) => match[1]);
  assert.deepEqual(
    imports.filter((specifier) => specifier.startsWith("node:")),
    ["node:path", "node:process", "node:util"],
    "parseArgs, path, and the process object are all it uses",
  );
  assert.ok(imports.filter((specifier) => !specifier.startsWith("node:")).every((specifier) => specifier.startsWith("./lib/")));
  assert.equal(/child_process|node:(?:https?|http2|net|tls|dgram)|\bfetch\s*\(|\beval\s*\(|new\s+Function\s*\(/.test(source), false);
});

test("the real entry point works from any directory and sets the exit code", () => {
  const spawn = (args, cwd) => spawnSync(process.execPath, [CLI, ...args], { cwd, encoding: "utf8" });
  const elsewhere = os.tmpdir();
  const list = spawn(["--list"], elsewhere);
  assert.equal(list.status, 0, list.stderr);
  assert.match(list.stdout, /ferris\s+Ferris\s+mascot/);
  const assembled = spawn(["--archetype", "ferris", "--concept", "A reviewer weighs two claims.", "--format", "prompt"], elsewhere);
  assert.equal(assembled.status, 0, assembled.stderr);
  assert.match(assembled.stdout, /^Generate one standalone 16:9 horizontal article illustration\./);
  assert.equal(spawn(["--archetype", "nope", "--concept", "x"], REPO_ROOT).status, 2);
  assert.equal(spawn(["--nope"], REPO_ROOT).status, 2);
  assert.equal(spawn(["--help"], REPO_ROOT).status, 0);
});
