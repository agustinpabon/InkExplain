import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { PACK_FILES } from "../../scripts/lib/config.mjs";
import { parseRegistry } from "../../scripts/lib/registry.mjs";
import { Repository } from "../../scripts/lib/repository.mjs";
import {
  OverlayRepository,
  ScaffoldInputError,
  ScaffoldRefusal,
  applyScaffold,
  buildEntry,
  insertRegistryEntry,
  normalizeInput,
  planScaffold,
} from "../../scripts/lib/scaffold.mjs";
import { FIXTURE_POLICY, createFixture, messages, snapshot } from "../helpers/fixture.mjs";

const PACKS = "skills/inkexplain/references/archetypes";
const FOX = Object.freeze({ id: "example-fox", name: "Example Fox" });
const FULL = Object.freeze({
  ...FOX,
  category: "mascot",
  summary: "Example Fox, a sparse orange fox that digs and sorts ideas into tidy piles.",
  aliases: ["the fox"],
  excludedTerms: ["fox"],
  features: ["orange fox body", "white-tipped tail"],
  actions: ["dig", "carry", "sort", "guard"],
  poses: ["front paws planted on the object"],
  palette: ["black ink", "fox orange"],
  rightsHolder: "Jane Artist",
  license: "CC BY 4.0",
  source: "https://example.org/fox",
  credit: "Example Fox by Jane Artist (https://example.org/fox), CC BY 4.0",
});

const plan = (fixture, options = FOX) => planScaffold(new Repository(fixture.root), options, { policy: FIXTURE_POLICY });

function refusalOf(action) {
  try {
    action();
  } catch (error) {
    assert.ok(error instanceof ScaffoldRefusal, `expected a refusal, got ${error}`);
    return error;
  }
  return assert.fail("expected a refusal");
}

function inputError(options, message) {
  assert.throws(() => normalizeInput(options), (error) => error instanceof ScaffoldInputError && message.test(error.message), JSON.stringify(options));
}

test("normalizeInput accepts a name and an id alone, and cleans a full request", () => {
  const minimal = normalizeInput(FOX);
  assert.equal(minimal.category, "mascot", "an unknown origin is treated as a third party's");
  assert.equal(minimal.thirdParty, true);
  assert.deepEqual([minimal.features, minimal.actions, minimal.palette, minimal.aliases], [[], [], [], []]);
  assert.equal(minimal.rightsHolder, null);

  const full = normalizeInput({ ...FULL, name: "  Example   Fox ", features: ["orange fox body", "Orange  fox body", "white-tipped tail"] });
  assert.equal(full.name, "Example Fox");
  assert.deepEqual(full.features, ["orange fox body", "white-tipped tail"], "repeats are dropped");
  assert.equal(full.source, "https://example.org/fox");
});

test("normalizeInput rejects an id that is not lowercase kebab-case, including path traversal", () => {
  inputError({ name: "Fox" }, /--id is required/);
  for (const id of ["../evil", "a/b", "a\\b", "Bad_ID", "Fox", "1fox", "-fox", "fox-", "fox--den", "fox den", "", ".", "x".repeat(41)]) {
    inputError({ ...FOX, id }, /--id|is required/);
  }
});

test("normalizeInput rejects unusable names, text, categories, sources, and canvases", () => {
  inputError({ id: "fox" }, /--name is required/);
  for (const name of ["Bad [Name]", "Back`tick", "Pipe|Name", "Tab\u0007Bell", "x".repeat(60), "-Fox"]) inputError({ ...FOX, name }, /--name/);
  assert.equal(normalizeInput({ ...FOX, name: "Line\n Break" }).name, "Line Break", "whitespace collapses to single spaces");
  inputError({ ...FOX, category: "celebrity" }, /--category must be one of house-style, mascot, tribute-character, animation-preset/);
  inputError({ ...FOX, summary: "x".repeat(241) }, /--summary is 241 characters; the limit is 240/);
  inputError({ ...FOX, features: ["a [bracketed] feature"] }, /--feature must not contain brackets or backticks/);
  inputError({ ...FOX, actions: ["dig\u0007"] }, /--action must not contain control characters/);
  inputError({ ...FOX, palette: [" "] }, /--palette must not be empty/);
  for (const source of ["javascript:alert(1)", "ftp://example.org/x", "example.org/fox", "https://example.org/a b", "data:text/html,x"]) {
    inputError({ ...FOX, source }, /--source .* must be an http or https URL/);
  }
  inputError({ ...FOX, canvas: "white background" }, /--canvas .* must start with the aspect ratio/);
  assert.equal(normalizeInput({ ...FOX, canvas: "1:1 on warm paper" }).canvas, "1:1 on warm paper");
});

test("normalizeInput refuses a third party's rights for a category that is original to InkExplain", () => {
  for (const [key, flag] of [["rightsHolder", "--rights-holder"], ["license", "--license"], ["source", "https://example.org/x"], ["credit", "--credit"]]) {
    inputError({ ...FOX, category: "house-style", [key]: key === "source" ? flag : "Someone" }, /records a third party's rights, but house-style is original to InkExplain/);
  }
  assert.equal(normalizeInput({ ...FOX, category: "animation-preset" }).thirdParty, false);
});

test("buildEntry marks everything the contributor did not give, and invents nothing about rights", () => {
  const entry = buildEntry(normalizeInput(FOX));
  assert.equal(entry.status, "experimental");
  assert.equal(entry.outputSuffix, "example-fox");
  assert.deepEqual(entry.aliases, ["Example Fox"]);
  assert.equal(entry.excludedTerms, undefined);
  assert.match(entry.summary, /^TODO: /);
  assert.deepEqual(entry.contract.identityMarkers, ["TODO: first visible identity marker"]);
  assert.deepEqual(entry.contract.isolationMarkers, ["Example Fox"]);
  assert.equal(entry.motionDna.signatureActions.length, 3);
  assert.ok(entry.motionDna.signatureActions.every((action) => action.startsWith("TODO: ")));
  assert.deepEqual(entry.styleSheet.palette, ["black ink", "TODO: accent color"]);
  const legal = entry.legalNotice;
  for (const field of [legal.credit, legal.rightsHolder, legal.license]) assert.match(field, /^UNRESOLVED: /);
  assert.deepEqual(legal.attributionTerms, [legal.rightsHolder]);
  assert.equal(legal.restrictions.length, 1);
  assert.deepEqual(entry.sampleGates, { status: "pending", decision: "No samples reviewed yet.", directories: [] });
});

test("buildEntry keeps what the contributor gave and pads the actions to three", () => {
  const entry = buildEntry(normalizeInput({ ...FULL, actions: ["dig"], aliases: ["the fox", "Example Fox", "THE FOX"] }));
  assert.deepEqual(entry.aliases, ["Example Fox", "the fox"]);
  assert.deepEqual(entry.excludedTerms, ["fox"]);
  assert.deepEqual(entry.motionDna.signatureActions, ["dig", "TODO: second signature action", "TODO: third signature action"]);
  assert.deepEqual(entry.motionDna.poses, ["front paws planted on the object"]);
  assert.deepEqual(entry.legalNotice.attributionTerms, ["Jane Artist", "https://example.org/fox"]);
  assert.equal(entry.legalNotice.license, "CC BY 4.0");
  assert.ok(!JSON.stringify(entry.legalNotice).includes("UNRESOLVED"));

  const original = buildEntry(normalizeInput({ ...FOX, category: "house-style" }));
  assert.deepEqual(original.legalNotice, { credit: "Original to InkExplain", rightsHolder: "InkExplain contributors", license: "MIT", attributionTerms: [], restrictions: [] });
});

test("insertRegistryEntry appends one entry in the file's own layout and leaves every other byte alone", (t) => {
  const fixture = createFixture(t);
  const before = fixture.read("skills/inkexplain/registry.json");
  const entry = buildEntry(normalizeInput(FULL));
  const after = insertRegistryEntry(before, entry);
  assert.ok(after.startsWith(before.slice(0, before.lastIndexOf("\n  ]\n}"))), "everything before the end is unchanged");
  assert.ok(after.endsWith("\n  ]\n}\n"));
  const data = JSON.parse(after);
  assert.equal(data.archetypes.length, JSON.parse(before).archetypes.length + 1);
  assert.deepEqual(data.archetypes.at(-1), entry);
  assert.match(after, /\n {4}\{\n {6}"id": "example-fox",/, "entries sit at four spaces, fields at six");
  assert.match(after, /"aliases": \["Example Fox", "the fox"\],/, "short lists stay on one line");
  assert.throws(() => insertRegistryEntry('{ "archetypes": [] }', entry), ScaffoldRefusal);
});

test("OverlayRepository shows pending files next to the checkout without touching the disk", (t) => {
  const fixture = createFixture(t);
  const before = snapshot(fixture.root);
  const overlay = new OverlayRepository(fixture.root, { "docs/new/guide.md": "# Guide\r\n", "README.md": "# Replaced\n" });
  assert.equal(overlay.readText("docs/new/guide.md"), "# Guide\n", "line endings are normalized like the checkout's");
  assert.equal(overlay.readText("README.md"), "# Replaced\n");
  assert.ok(overlay.isFile("docs/new/guide.md") && !overlay.isDirectory("docs/new/guide.md"));
  assert.ok(overlay.isDirectory("docs/new") && overlay.exists("docs/new") && !overlay.isFile("docs/new"));
  assert.equal(overlay.size("docs/new/guide.md"), Buffer.byteLength("# Guide\r\n"));
  assert.equal(overlay.readTextIfExists("docs/missing.md"), null);
  assert.deepEqual(overlay.entries("docs").filter((entry) => entry.name === "new"), [{ name: "new", path: "docs/new", type: "directory" }]);
  assert.ok(overlay.entries("docs").some((entry) => entry.name === "language-policy.md"), "checkout entries stay");
  assert.ok(overlay.walk("docs").includes("docs/new/guide.md") && overlay.walk().includes("docs/new/guide.md"));
  assert.ok(overlay.textFiles().includes("docs/new/guide.md"));
  assert.ok(overlay.isFile("LICENSE") && overlay.readText("LICENSE").startsWith("MIT License"), "untouched files read through");
  assert.deepEqual(snapshot(fixture.root), before, "nothing was written");
  assert.equal(fixture.read("README.md").startsWith("# InkExplain"), true);
});

test("planScaffold adds a third-party archetype and leaves its rights UNRESOLVED", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture);
  assert.deepEqual(result.archetype, { id: "example-fox", name: "Example Fox", category: "mascot", status: "experimental", outputFolder: "assets/<article-slug>-example-fox/" });
  assert.deepEqual(
    result.create.map((file) => file.path),
    PACK_FILES.map((file) => `${PACKS}/example-fox/${file}`),
    "the five pack files, rights first",
  );
  const modified = result.modify.map((file) => file.path);
  for (const file of ["skills/inkexplain/registry.json", "ATTRIBUTIONS.md", "examples/prompts.md", "skills/inkexplain/references/routing.md", "README.md", "examples/gallery/index.html"]) {
    assert.ok(modified.includes(file), `${file} is updated`);
  }
  assert.deepEqual(result.validation, { checks: result.validation.checks, failedBefore: 0, failedAfter: 0 });

  const rights = result.create[0].content;
  assert.match(rights, /- Rights holder: UNRESOLVED: record the rights holder\./);
  assert.match(rights, /- Source: UNRESOLVED: record the official source URL/);
  assert.match(rights, /- License: UNRESOLVED: record the license\./);
  assert.match(rights, /Until every UNRESOLVED item above is settled/);
  const prompts = result.create[4].content;
  assert.match(prompts, /Output folder: `assets\/<article-slug>-example-fox\/`/);
  assert.match(prompts, /\nRights note: \[append the rights note from this file\]\.\n```/, "a third-party template keeps its rights-note field");
  assert.match(prompts, /## Rights note\n[\s\S]*experimental archetype and its rights are not yet confirmed\. UNRESOLVED: write the credit line the license requires, then replace this note\. No logos/);
  assert.ok(result.placeholders.length > 10);
  assert.ok(result.placeholders.every((item) => /\b(?:TODO|UNRESOLVED)\b/.test(item.text)));
  assert.ok(result.placeholders.some((item) => item.path === "ATTRIBUTIONS.md"));
});

test("planScaffold adds an original house style with no rights to settle", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, { ...FULL, category: "house-style", rightsHolder: undefined, license: undefined, source: undefined, credit: undefined });
  const text = result.create.map((file) => file.content).join("\n");
  assert.ok(!text.includes("UNRESOLVED"), "an original archetype records no third-party rights");
  assert.ok(!text.includes("## Rights note"), "and carries no rights note");
  assert.ok(!result.create[4].content.includes("Rights note: ["), "nor a rights-note field");
  assert.match(result.create[0].content, /Original to InkExplain: declared by the contributor who added it/);
  assert.ok(result.modify.find((file) => file.path === "ATTRIBUTIONS.md").after.includes("- Original to InkExplain: declared by the contributor"));
});

test("an applied scaffold passes every repository check, adds without overwriting, and is selectable", (t) => {
  const fixture = createFixture(t);
  const before = snapshot(fixture.root);
  const result = plan(fixture, FULL);
  assert.deepEqual(snapshot(fixture.root), before, "planning writes nothing");
  applyScaffold(fixture.root, result);

  const after = snapshot(fixture.root);
  const created = new Set(result.create.map((file) => file.path));
  const modified = new Set(result.modify.map((file) => file.path));
  for (const [file, hash] of before) assert.equal(hash !== after.get(file), modified.has(file), `${file} changes exactly when the plan says so`);
  for (const file of created) assert.ok(!before.has(file) && after.has(file), `${file} is new`);
  assert.equal(after.size, before.size + created.size);

  for (const check of fixture.run()) assert.equal(check.status, "pass", `${check.id}\n${messages(check)}`);
  const registry = parseRegistry(fixture.read("skills/inkexplain/registry.json")).registry;
  assert.equal(registry.byId.get("example-fox").status, "experimental");
  assert.equal(registry.aliasIndex.get("the fox").archetypeId, "example-fox", "an alias selects it");
  assert.ok(fixture.read("examples/prompts.md").includes("$inkexplain Use Example Fox."));
  assert.match(fixture.read("ATTRIBUTIONS.md"), /### Example Fox\n\n- Example Fox is a `mascot` archetype[\s\S]*Rights holder: Jane Artist\./);
  assert.ok(fixture.read("README.md").includes("`example-fox`"), "the README table lists it");
});

test("planScaffold refuses conflicts, and says why", (t) => {
  const fixture = createFixture(t);
  const before = snapshot(fixture.root);
  const problems = (options) => refusalOf(() => plan(fixture, options)).problems.join("\n");

  assert.match(problems({ id: "demo", name: "Other Crab" }), /archetype id "demo" is already in the registry/);
  assert.match(problems({ id: "other-crab", name: "Other Crab", aliases: ["demo mascot"] }), /alias "demo mascot" collides with archetype demo/);
  assert.match(problems({ id: "another", name: "Demo Crab" }), /alias "Demo Crab" collides with archetype demo/);
  assert.match(problems({ id: "another", name: "Crab" }), /excluded term "crab" is a selectable name of archetype another/, "a name another archetype excludes");
  assert.match(problems({ id: "big-demo", name: "Big Demo" }), /output folder suffix "big-demo" clashes with demo's "demo"/);
  assert.equal(plan(fixture, { id: "demo-two", name: "Demo Two" }).archetype.id, "demo-two", "a longer suffix that merely starts with another is fine");

  fixture.write(`${PACKS}/stray/rights.md`, "# Stray\n");
  assert.match(problems({ id: "stray", name: "Stray" }), /archetypes\/stray already exists; the scaffold never overwrites a pack/);

  fixture.append("ATTRIBUTIONS.md", "\n### Example Fox\n\n- Already credited.\n");
  assert.match(problems(FOX), /ATTRIBUTIONS\.md already has a section named "Example Fox"/);
  fixture.append("examples/prompts.md", "\n### Example Fox\n\nAlready here.\n");
  assert.match(problems(FOX), /examples\/prompts\.md already has a section named "Example Fox"/);

  const unchanged = snapshot(fixture.root);
  for (const [file, hash] of before) {
    if (!["ATTRIBUTIONS.md", "examples/prompts.md"].includes(file)) assert.equal(unchanged.get(file), hash, file);
  }
});

test("planScaffold refuses an unreadable registry or locales file", (t) => {
  const broken = createFixture(t).write("skills/inkexplain/registry.json", "{ not json");
  assert.match(refusalOf(() => plan(broken)).problems.join("\n"), /invalid JSON/);
  const missing = createFixture(t).remove("skills/inkexplain/registry.json");
  assert.match(refusalOf(() => plan(missing)).problems.join("\n"), /file is missing/);
  const locales = createFixture(t).remove("readmes/locales.json");
  assert.match(refusalOf(() => plan(locales)).message, /Cannot read the README locales/);
});

test("planScaffold refuses a result that would break a repository check, and writes nothing", (t) => {
  const fixture = createFixture(t);
  const before = snapshot(fixture.root);
  // The Sketch pack says "ink figure", which is the Sketch archetype's own marker; a character of that name leaks into it.
  const error = refusalOf(() => plan(fixture, { id: "figure", name: "Ink Figure" }));
  assert.match(error.message, /would break the repository checks, so nothing was written/);
  assert.match(error.problems.join("\n"), /SCHEMA-007 .*mentions "Ink Figure", which belongs to archetype figure/);
  assert.deepEqual(snapshot(fixture.root), before);

  // A check that already failed before the change does not block it.
  const failing = createFixture(t).write("docs/language-policy.md", "# Language policy\n");
  assert.ok(failing.check("LANG-003").status === "fail");
  const result = plan(failing, FOX);
  assert.ok(result.validation.failedBefore > 0 && result.validation.failedAfter === result.validation.failedBefore);
});

test("applyScaffold never overwrites a file and undoes what it did when a write fails", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);
  // Something appears at a planned path after planning, as if another process had written it.
  const taken = `${PACKS}/example-fox/style.md`;
  fixture.write(taken, "keep me\n");
  const withTaken = snapshot(fixture.root);
  assert.throws(() => applyScaffold(fixture.root, result), /EEXIST/);
  assert.equal(fixture.read(taken), "keep me\n", "the existing file is untouched");
  assert.deepEqual(snapshot(fixture.root), withTaken, "the files created before the failure are gone, and no existing file changed");
  assert.ok(before.size + 1 === withTaken.size);
});

test("applyScaffold undoes everything when the verification it is given finds a problem", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);
  const error = (() => {
    try {
      applyScaffold(fixture.root, result, { verify: () => ["SCHEMA-099 something broke"] });
    } catch (caught) {
      return caught;
    }
    return null;
  })();
  assert.ok(error instanceof ScaffoldRefusal);
  assert.deepEqual(error.problems, ["SCHEMA-099 something broke"]);
  assert.deepEqual(snapshot(fixture.root), before, "created files, new directories, and edits are all undone");
  assert.ok(!fs.existsSync(path.join(fixture.root, PACKS, "example-fox")), "the pack folder is gone too");
});

test("from scaffold to active: a promoted archetype must settle every marker and stop calling itself experimental", (t) => {
  const fixture = createFixture(t);
  applyScaffold(fixture.root, plan(fixture, { ...FULL, category: "house-style", rightsHolder: undefined, license: undefined, source: undefined, credit: undefined }));
  assert.equal(fixture.check("SCHEMA-010").status, "pass", "markers are fine while the archetype is experimental");

  const promote = () => {
    fixture.updateRegistry((data) => {
      data.archetypes.find((archetype) => archetype.id === "example-fox").status = "active";
    });
  };
  promote();
  const refused = messages(fixture.check("SCHEMA-010"));
  assert.match(refused, /archetype example-fox is active but still has a scaffold placeholder: .*TODO: describe in two or three sentences/);
  assert.match(refused, /archetype example-fox is active but its pack still says it is experimental: .*status `experimental`/);
  assert.match(messages(fixture.check("LEGAL-003")), /does not state status active/);

  // The contributor writes the missing text and updates the status wording.
  for (const file of PACK_FILES) {
    const pack = `${PACKS}/example-fox/${file}`;
    fixture.write(pack, fixture.read(pack).replace(/TODO:[^|\n]*/g, "Written by the contributor.").replace(/experimental/gi, "active"));
  }
  assert.equal(fixture.check("SCHEMA-010").status, "pass", messages(fixture.check("SCHEMA-010")));
  assert.equal(fixture.check("LEGAL-003").status, "pass");
  fixture.regenerateDocs();
  for (const check of fixture.run()) assert.equal(check.status, "pass", `${check.id}\n${messages(check)}`);

  // A third-party archetype also has to settle its rights before it can be promoted.
  const other = createFixture(t);
  applyScaffold(other.root, plan(other, FOX));
  other.updateRegistry((data) => {
    data.archetypes.find((archetype) => archetype.id === "example-fox").status = "active";
  });
  assert.match(messages(other.check("SCHEMA-010")), /UNRESOLVED: record the rights holder/);
});
