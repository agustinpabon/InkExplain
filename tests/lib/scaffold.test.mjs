import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { IGNORED_DIRECTORIES, PACK_FILES, SCAFFOLD_PLACEHOLDER } from "../../scripts/lib/config.mjs";
import { ID_PATTERN, parseRegistry } from "../../scripts/lib/registry.mjs";
import { Repository } from "../../scripts/lib/repository.mjs";
import {
  OverlayRepository,
  ScaffoldInputError,
  ScaffoldRefusal,
  ScaffoldRollbackError,
  applyScaffold,
  buildEntry,
  checkRepository,
  describeIssue,
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

function thrownBy(action) {
  try {
    action();
  } catch (error) {
    return error;
  }
  return assert.fail("expected an error");
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
  inputError({ ...FOX, features: ["a [bracketed] feature"] }, /--feature must not contain brackets, backticks, angle brackets, pipes, or backslashes/);
  inputError({ ...FOX, actions: ["dig\u0007"] }, /--action must not contain control characters/);
  inputError({ ...FOX, palette: [" "] }, /--palette must not be empty/);
  for (const source of ["javascript:alert(1)", "ftp://example.org/x", "example.org/fox", "https://example.org/a b", "data:text/html,x"]) {
    inputError({ ...FOX, source }, /--source .* must be an http or https URL/);
  }
  inputError({ ...FOX, canvas: "white background" }, /--canvas .* must start with the aspect ratio/);
  assert.equal(normalizeInput({ ...FOX, canvas: "1:1 on warm paper" }).canvas, "1:1 on warm paper");
});

test("normalizeInput refuses an id that Windows treats as a device, because git there cannot make its folder", () => {
  for (const id of ["con", "prn", "aux", "nul", "com1", "com9", "lpt1", "lpt9"]) inputError({ ...FOX, id }, /--id "[a-z0-9]+" is a reserved device name on Windows/);
  for (const id of ["console", "com10", "auxiliary", "nul-fox"]) assert.equal(normalizeInput({ ...FOX, id }).id, id, "only the exact names are reserved");
});

test("normalizeInput reads names in any script, stores them composed, and keeps text that would break Markdown out", () => {
  const acute = String.fromCodePoint(0x301);
  assert.equal(normalizeInput({ ...FOX, name: `Cafe${acute} Fox` }).name, "Café Fox".normalize("NFC"), "a decomposed name is stored composed");
  for (const name of ["Café Fox", "नमस्ते", "สวัสดี", "ポチ", "Zoë's Fox", "R2-D2 & Co.", "Fox 2"]) assert.equal(normalizeInput({ ...FOX, name }).name, name.normalize("NFC"), name);
  assert.equal(normalizeInput({ ...FOX, aliases: [`Cafe${acute}`] }).aliases[0], "Café".normalize("NFC"));

  // An alias or an excluded term is matched against the user's words, so it takes the same characters a name does.
  for (const term of ["a\\b", "a|b", "fox/den", "a<b>", "~~~", "=fox"]) {
    inputError({ ...FOX, aliases: [term] }, /--alias .* must be at most 59 characters of letters, digits/);
    inputError({ ...FOX, excludedTerms: [term] }, /--exclude .* must be at most 59 characters of letters, digits/);
  }
  // Text that opens a line of Markdown must not be able to turn it into a heading, a list, a quote, or a code fence.
  for (const opener of ["~~~ fence", "# Heading", "- item", "> quote", "| cell", "* star"]) {
    inputError({ ...FOX, summary: opener }, /--summary must start with a letter or a digit/);
    inputError({ ...FOX, medium: opener }, /--medium must start with a letter or a digit/);
    inputError({ ...FOX, linework: opener }, /--linework must start with a letter or a digit/);
  }
});

test("normalizeInput refuses invalid Unicode, invisible and bidirectional characters, and text that would restructure the Markdown", () => {
  const halfPair = String.fromCharCode(0xd800);
  inputError({ ...FOX, features: [`orange${halfPair}tail`] }, /--feature is not valid Unicode text/);
  inputError({ ...FOX, name: `Fox${halfPair}` }, /--name is not valid Unicode text/);

  // Bidirectional controls reorder what a reader sees; the Hangul fillers, soft hyphen, and word joiner show nothing at all.
  for (const code of [0x202e, 0x2066, 0x200f, 0x061c, 0x3164, 0x115f, 0x00ad, 0x2060]) {
    const hidden = String.fromCodePoint(code);
    inputError({ ...FOX, summary: `A${hidden}B fox` }, /--summary must not contain invisible or bidirectional control characters \(U\+[0-9A-F]{4}\)/);
    inputError({ ...FOX, rightsHolder: `Jane${hidden}Artist` }, /--rights-holder must not contain invisible or bidirectional control characters/);
    inputError({ ...FOX, name: `Fox${hidden}` }, /--name must not contain invisible or bidirectional control characters/);
  }
  inputError({ ...FOX, name: String.fromCodePoint(0x3164) }, /--name must not contain invisible/, "a name of one invisible letter has nothing to show");
  const joiner = String.fromCodePoint(0x200c);
  assert.equal(normalizeInput({ ...FOX, name: `می${joiner}خواهم` }).name, `می${joiner}خواهم`, "the zero-width non-joiner is part of how Persian is written");

  // Raw HTML, a pipe, or a backslash would break a table cell or the Markdown the text is written into.
  for (const text of ["Fox <!-- hides the rest", "Fox | tricks", "Fox \\| tricks", "Fox <b>bold</b>", "C:\\fox"]) {
    inputError({ ...FOX, summary: text }, /--summary must not contain brackets, backticks, angle brackets, pipes, or backslashes/);
    inputError({ ...FOX, credit: text }, /--credit must not contain brackets, backticks, angle brackets, pipes, or backslashes/);
  }

  // A number and a dot or bracket at the start of a line is a list item.
  for (const opener of ["1. Fox", "12) Fox", "3."]) inputError({ ...FOX, summary: opener }, /--summary must start with a letter or a digit, and not as a numbered list item/);
  inputError({ ...FOX, name: "1. Fox" }, /--name .* must not open like a numbered list item/);
  inputError({ ...FOX, aliases: ["2. the fox"] }, /--alias .* must not open like a numbered list item/);
  assert.equal(normalizeInput({ ...FOX, name: "3.14 Fox" }).name, "3.14 Fox", "a number inside a name is fine");
  assert.equal(normalizeInput({ ...FOX, summary: "2 foxes dig." }).summary, "2 foxes dig.");
});

test("normalizeInput takes the punctuation that real names carry, and refuses a blank symbol", () => {
  for (const name of ["Zoë’s Fox", "Ferris–Crab", "col·legi", "ポチ・ミニ", "O'Brien & Sons", "Fox+Hound_2", "ཝ་ཡོང་"]) {
    assert.equal(normalizeInput({ ...FOX, name }).name, name.normalize("NFC"), name);
  }
  // The variation selectors that spell emoji and CJK variants are kept, since normalizeName ignores them.
  const selector = String.fromCodePoint(0xfe0f);
  assert.equal(normalizeInput({ ...FOX, features: [`red heart ❤${selector}`] }).features[0], `red heart ❤${selector}`);
  // BRAILLE PATTERN BLANK shows as empty space but is a symbol, so it is refused by name.
  const blank = String.fromCodePoint(0x2800);
  inputError({ ...FOX, credit: `Jane${blank}Artist` }, /--credit must not contain invisible or bidirectional control characters \(U\+2800\)/);
  inputError({ ...FOX, name: `Fox${blank}` }, /--name must not contain invisible/);
});

test("a name that differs from an existing one only by an invisible joiner or a dash is the same name", (t) => {
  const fixture = createFixture(t);
  const joiner = String.fromCodePoint(0x200d);
  const nonJoiner = String.fromCodePoint(0x200c);
  assert.match(refusalOf(() => plan(fixture, { id: "other-crab", name: `Demo Crab${nonJoiner}` })).problems.join("\n"), /alias .* collides with archetype demo/);
  assert.match(refusalOf(() => plan(fixture, { id: "other-crab", name: "Other Crab", aliases: [`Demo${joiner} Crab`] })).problems.join("\n"), /collides with archetype demo/);
  assert.match(refusalOf(() => plan(fixture, { id: "other-crab", name: "Other Crab", aliases: ["Demo–Crab"] })).problems.join("\n"), /collides with archetype demo/, "an en dash separates like a hyphen");
});

test("normalizeInput refuses a source link that carries credentials, and one the table cannot hold", () => {
  for (const source of ["https://user:hunter2secret@example.org/fox", "https://token@example.org/fox", "http://:password@example.org/"]) {
    inputError({ ...FOX, source }, /--source must not carry a user name or password/);
  }
  for (const source of ["https://example.org/a|b", "https://example.org/a\\b"]) inputError({ ...FOX, source }, /--source must not contain brackets, backticks, angle brackets, pipes, or backslashes/);
  assert.equal(normalizeInput({ ...FOX, source: "https://example.org/fox?id=1#top" }).source, "https://example.org/fox?id=1#top");
});

test("normalizeInput takes a canvas only when it opens with a real aspect ratio", () => {
  for (const canvas of ["0:9 tall", "16:0 wide", "100:1 banner", "16:09 wide", ":9 tall", "16:9x", "16:9é", "wide 16:9"]) inputError({ ...FOX, canvas }, /--canvas .* must start with the aspect ratio/);
  for (const canvas of ["1:1", "16:9", "3:4 portrait", "99:1 strip", "4:3, on kraft paper"]) assert.equal(normalizeInput({ ...FOX, canvas }).canvas, canvas);
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
  assert.deepEqual(result.validation, { checks: result.validation.checks, failedChecksBefore: 0, failedChecksAfter: 0, issuesBefore: 0, issuesAfter: 0, expectedIssues: [] });

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
  assert.ok(result.placeholders.every((item) => SCAFFOLD_PLACEHOLDER.test(item.text)));
  assert.ok(result.placeholders.some((item) => item.path === "ATTRIBUTIONS.md"));
});

test("the markers a plan reports sit on the lines they are reported at, in the files as written", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture);
  applyScaffold(fixture.root, result);
  assert.ok(result.placeholders.some((item) => item.path === "skills/inkexplain/registry.json"), "the registry entry carries markers");
  for (const item of result.placeholders) {
    const line = fixture.read(item.path).split("\n")[item.line - 1];
    assert.match(line, SCAFFOLD_PLACEHOLDER, `${item.path}:${item.line} holds a marker`);
  }
});

test("a tribute character's rights boundaries stay an open marker, because only the rights holder can set them", (t) => {
  const entry = buildEntry(normalizeInput({ ...FOX, category: "tribute-character" }));
  assert.equal(entry.legalNotice.restrictions.length, 2);
  assert.match(entry.legalNotice.restrictions[1], /^UNRESOLVED: record the rights boundaries/);
  const mascot = buildEntry(normalizeInput(FOX));
  assert.equal(mascot.legalNotice.restrictions.length, 1, "a mascot needs no boundaries beyond the generic one");
  const fixture = createFixture(t);
  assert.equal(plan(fixture, { ...FOX, category: "tribute-character" }).archetype.category, "tribute-character");
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

test("planScaffold refuses an id that is a folder git ignores or the checks skip, so its pack would never be committed or scanned", (t) => {
  const rules = [
    "# a comment",
    "build/",
    "/tmp/",
    "**/cache/",
    "vendor",
    "Zed/",
    "sketch/",
    "!sketch/",
    "*.log",
    "notes.txt",
    "  indented/",
    "wild*/",
    "skills/inkexplain/references/archetypes/pathy/",
  ].join("\n");
  const fixture = createFixture(t).write(".gitignore", `${rules}\r\n`);
  for (const id of ["dist", "outputs", "generated", "build", "tmp", "cache", "vendor", "zed"]) {
    const error = thrownBy(() => plan(fixture, { id, name: "Some Fox" }));
    assert.ok(error instanceof ScaffoldInputError, `${id}: ${error}`);
    assert.match(error.message, new RegExp(`--id "${id}" is a folder name that git ignores and the repository checks skip`));
  }
  // What git would not ignore as a folder named like the id is accepted.
  for (const id of ["builder", "notes", "sketch", "indented", "wildcat", "pathy"]) assert.equal(plan(fixture, { id, name: `${id} Fox` }).archetype.id, id, id);
  // A negation cannot bring back a folder that the checks themselves skip.
  assert.ok(thrownBy(() => plan(createFixture(t).write(".gitignore", "!dist/\n"), { id: "dist", name: "Dist Fox" })) instanceof ScaffoldInputError);
});

test("every folder this repository's .gitignore names that an id could be is one the checks skip, so no archetype can hide in it", () => {
  const folders = fs
    .readFileSync(path.join(import.meta.dirname, "../../.gitignore"), "utf8")
    .split("\n")
    .map((line) => /^(?:\/|\*\*\/)?([A-Za-z0-9._-]+)\/$/.exec(line.trimEnd())?.[1])
    .filter((name) => name !== undefined && ID_PATTERN.test(name));
  assert.ok(folders.length > 0, "the repository ignores generated/, outputs/, and dist/");
  for (const folder of folders) assert.ok(IGNORED_DIRECTORIES.includes(folder), `${folder}/ is in .gitignore but not in IGNORED_DIRECTORIES (scripts/lib/config.mjs), so the checks would still scan it`);
});

test("planScaffold says what to do when a pack folder is already there, as an interrupted run leaves it", (t) => {
  const fixture = createFixture(t).write(`${PACKS}/example-fox/rights.md`, "# Half a pack\n");
  const problems = refusalOf(() => plan(fixture, FOX)).problems.join("\n");
  assert.match(problems, /archetypes\/example-fox already exists; the scaffold never overwrites a pack \(if an earlier run was interrupted, check git status, remove that folder, and run again\)/);
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
  assert.ok(result.validation.issuesBefore > 0 && result.validation.issuesAfter === result.validation.issuesBefore);
  assert.equal(result.validation.failedChecksBefore, 1);
});

test("an issue that already existed is not new when the scaffold moves its line", (t) => {
  // The new table row shifts every line below it, so a line-anchored issue the repository already had must not read as a new one.
  const fixture = createFixture(t).append("README.md", "\nSee the [missing guide](docs/nope.md).\n");
  assert.match(messages(fixture.check("DOC-002")), /README\.md:\d+: link docs\/nope\.md does not resolve/);
  const result = plan(fixture, FOX);
  assert.equal(result.validation.failedChecksBefore, 1);
  assert.equal(result.validation.failedChecksAfter, 1);
  applyScaffold(fixture.root, result, { verify: () => [] });
  assert.match(messages(fixture.check("DOC-002")), /docs\/nope\.md does not resolve/);
});

test("issues are counted every time they occur, and a repeat of an old message is a new occurrence", (t) => {
  const link = "See the [missing guide](docs/nope.md).\n";
  const fixture = createFixture(t).append("README.md", `\n${link}\n${link}\n${link}`);
  const result = plan(fixture, FOX);
  assert.equal(result.validation.issuesBefore, 3, "three broken links are three issues, not one");
  assert.equal(result.validation.issuesAfter, 3);
  assert.equal(result.validation.failedChecksBefore, 1);
  applyScaffold(fixture.root, result);

  // A fourth copy of the same link has the same message as the first three, and is still new.
  fixture.append("README.md", `\n${link}`);
  const found = checkRepository(new Repository(fixture.root), { policy: FIXTURE_POLICY, expectedIssues: result.validation.expectedIssues });
  assert.equal(found.failures.length, 4);
  assert.equal(found.unexpected.length, 1);
});

test("a problem the scaffold causes is caught even when it also repairs another, so the counts stay equal", (t) => {
  // The README's archetype table is stale, so DOC-003 fails before, and regenerating it repairs that. The new
  // name already appears once in another pack, so SCHEMA-007 fails after. One issue before and one after is
  // not "nothing new": the issues are different ones.
  const fixture = createFixture(t)
    .replace("README.md", "| Demo Crab ", "| Demo Crabs ")
    .append(`${PACKS}/demo/identity.md`, "\nZorp Wombat shows up here once.\n");
  assert.deepEqual(fixture.run().filter((check) => check.status === "fail").map((check) => check.id), ["DOC-003"], "one issue before");
  const error = refusalOf(() => plan(fixture, { id: "zorp-wombat", name: "Zorp Wombat" }));
  assert.deepEqual(error.problems, [`SCHEMA-007 ${PACKS}/demo/identity.md: archetype demo mentions "Zorp Wombat", which belongs to archetype zorp-wombat`]);
});

test("a check that already crashes does not make the new archetype look like the cause", (t) => {
  const fixture = createFixture(t);
  // With no language allowlist the language checks crash, before and after, and the stack in each report names
  // the line of scaffold.mjs that ran them, which is not the same line the second time.
  const policy = { languageAllowlist: null };
  const result = planScaffold(new Repository(fixture.root), FOX, { policy });
  assert.ok(result.validation.failedChecksBefore >= 1, "the checks do crash with this policy");
  assert.equal(result.validation.issuesAfter, result.validation.issuesBefore);
  const verify = () => checkRepository(new Repository(fixture.root), { policy, expectedIssues: result.validation.expectedIssues }).unexpected.map(describeIssue);
  applyScaffold(fixture.root, result, { verify });
  assert.ok(fixture.exists(`${PACKS}/example-fox/rights.md`), "it was written, not refused");
});

/** The real file API, except that writing the named files fails the way a locked or read-only file does. */
function failingIo(...names) {
  return {
    ...fs,
    existsSync: fs.existsSync,
    readFileSync: fs.readFileSync,
    mkdirSync: fs.mkdirSync,
    rmSync: fs.rmSync,
    writeFileSync(file, ...rest) {
      if (names.some((name) => String(file).replaceAll("\\", "/").endsWith(name))) {
        throw Object.assign(new Error(`EPERM: operation not permitted, open '${path.basename(String(file))}'`), { code: "EPERM" });
      }
      return fs.writeFileSync(file, ...rest);
    },
  };
}

test("applyScaffold writes nothing when a file it would create exists, or a file it would edit has changed, since planning", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);

  fixture.write(`${PACKS}/example-fox/style.md`, "keep me\n");
  const taken = snapshot(fixture.root);
  const refused = refusalOf(() => applyScaffold(fixture.root, result));
  assert.match(refused.message, /changed after the plan was made, so nothing was written/);
  assert.deepEqual(refused.problems, [`${PACKS}/example-fox/style.md now exists`]);
  assert.deepEqual(snapshot(fixture.root), taken, "nothing was written, and the file that appeared is untouched");
  fixture.remove(`${PACKS}/example-fox`);

  // An edit made to ATTRIBUTIONS.md after planning must not be overwritten by the plan's older copy.
  fixture.append("ATTRIBUTIONS.md", "\nA paragraph added by hand after planning.\n");
  const edited = snapshot(fixture.root);
  assert.deepEqual(refusalOf(() => applyScaffold(fixture.root, result)).problems, ["ATTRIBUTIONS.md changed"]);
  assert.deepEqual(snapshot(fixture.root), edited);
  assert.notDeepEqual(edited, before);
});

test("applyScaffold refuses, rather than failing halfway, when a file it would edit has been deleted since planning", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  fixture.remove("examples/prompts.md");
  const taken = snapshot(fixture.root);
  const error = refusalOf(() => applyScaffold(fixture.root, result));
  assert.deepEqual(error.problems, ["examples/prompts.md changed"]);
  assert.deepEqual(snapshot(fixture.root), taken, "nothing was written");
});

test("applyScaffold undoes everything, and never overwrites, when a file appears while it writes", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);
  // Another process creates style.md just before this one writes it: the exclusive create must fail, not overwrite.
  const racing = {
    ...failingIo(),
    writeFileSync(file, ...rest) {
      if (String(file).replaceAll("\\", "/").endsWith("/example-fox/style.md")) fs.writeFileSync(file, "written by someone else\n");
      return fs.writeFileSync(file, ...rest);
    },
  };
  assert.throws(() => applyScaffold(fixture.root, result, { io: racing }), /EEXIST/);
  assert.equal(fixture.read(`${PACKS}/example-fox/style.md`), "written by someone else\n", "the other file is untouched");
  fixture.remove(`${PACKS}/example-fox`);
  assert.deepEqual(snapshot(fixture.root), before, "everything else is as it was");
});

/** The named file can be written once and is then locked: the first write succeeds, and so its undo fails. */
function lockingIo(name) {
  let written = false;
  return {
    ...failingIo(),
    writeFileSync(file, ...rest) {
      if (String(file).replaceAll("\\", "/").endsWith(name)) {
        if (written) throw Object.assign(new Error(`EBUSY: resource busy or locked, open '${path.basename(String(file))}'`), { code: "EBUSY" });
        written = true;
      }
      return fs.writeFileSync(file, ...rest);
    },
  };
}

test("a write that fails before it changes anything is undone completely, and nothing is reported as left behind", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);
  // examples/prompts.md is read-only: the registry and ATTRIBUTIONS.md were already edited when its write fails.
  const error = thrownBy(() => applyScaffold(fixture.root, result, { io: failingIo("examples/prompts.md") }));
  assert.ok(!(error instanceof ScaffoldRollbackError), "the file never changed, so there is nothing to restore");
  assert.equal(error.code, "EPERM");
  assert.deepEqual(snapshot(fixture.root), before, "the pack, the registry entry, and the credit are all gone again");
});

test("when part of an undo fails, the rest is still undone and what remains is reported", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  // examples/prompts.md takes the new text, and is then locked, so it cannot be put back; README.md then fails to write.
  const locked = lockingIo("examples/prompts.md");
  const io = {
    ...locked,
    writeFileSync(file, ...rest) {
      if (String(file).replaceAll("\\", "/").endsWith("/README.md")) throw Object.assign(new Error("ENOSPC: no space left on device, write"), { code: "ENOSPC" });
      return locked.writeFileSync(file, ...rest);
    },
  };
  const error = thrownBy(() => applyScaffold(fixture.root, result, { io }));
  assert.ok(error instanceof ScaffoldRollbackError, String(error));
  assert.match(error.message, /^Writing failed \(ENOSPC: no space left on device, write\), and one change could not be undone$/);
  assert.deepEqual(error.leftovers.map((item) => item.split(":")[0]), ["restore examples/prompts.md"]);
  assert.match(error.cause.message, /ENOSPC/);
  assert.ok(fixture.read("examples/prompts.md").includes("$inkexplain Use Example Fox."), "the locked file still holds the new text, and the report says so");
  assert.ok(!fixture.exists(`${PACKS}/example-fox`) && !fixture.read("ATTRIBUTIONS.md").includes("### Example Fox") && !fixture.read("skills/inkexplain/registry.json").includes("example-fox"), "everything else was undone");
});

test("when the checks fail after writing and the undo cannot finish, the message names the problem and what is left", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const error = thrownBy(() => applyScaffold(fixture.root, result, { io: lockingIo("examples/prompts.md"), verify: () => ["SCHEMA-099 something broke"] }));
  assert.ok(error instanceof ScaffoldRollbackError, String(error));
  assert.match(error.message, /^Writing failed \(the repository checks failed after writing: SCHEMA-099 something broke\), and one change could not be undone$/);
  assert.deepEqual(error.leftovers.map((item) => item.split(":")[0]), ["restore examples/prompts.md"]);
  assert.ok(!fixture.exists(`${PACKS}/example-fox`), "everything else was undone, the pack folder included");
});

test("applyScaffold undoes everything when the verification it is given finds a problem", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);
  const error = thrownBy(() => applyScaffold(fixture.root, result, { verify: () => ["SCHEMA-099 something broke"] }));
  assert.ok(error instanceof ScaffoldRefusal);
  assert.deepEqual(error.problems, ["SCHEMA-099 something broke"]);
  assert.deepEqual(snapshot(fixture.root), before, "created files, new directories, and edits are all undone");
  assert.ok(!fs.existsSync(path.join(fixture.root, PACKS, "example-fox")), "the pack folder is gone too");
});

test("a rollback removes every folder the run created, deepest first, and no folder that was already there", (t) => {
  const fixture = createFixture(t);
  const before = snapshot(fixture.root);
  // Two sibling folders under one new parent: the parent can only go once both children have.
  const nested = {
    create: [
      { path: "docs/new/deep/guide.md", content: "# Guide\n" },
      { path: "docs/new/other/two.md", content: "# Two\n" },
      { path: "docs/new/top.md", content: "# Top\n" },
    ],
    modify: [],
  };
  const error = thrownBy(() => applyScaffold(fixture.root, nested, { verify: () => ["SCHEMA-099 something broke"] }));
  assert.ok(error instanceof ScaffoldRefusal, `the refusal, with nothing left over: ${error}`);
  assert.ok(!fs.existsSync(path.join(fixture.root, "docs/new")), "every new folder is gone");
  assert.ok(fs.existsSync(path.join(fixture.root, "docs")), "the folder that was already there stays");
  assert.deepEqual(snapshot(fixture.root), before);
});

test("a rollback never deletes a file somebody else put into a folder it created, and does not call that folder its own leftover", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);
  const racing = {
    ...failingIo(),
    writeFileSync(file, ...rest) {
      // While the pack is being written, another process drops its own file into the new folder.
      if (String(file).replaceAll("\\", "/").endsWith("/example-fox/style.md")) fs.writeFileSync(path.join(path.dirname(String(file)), "notes.md"), "mine\n");
      return fs.writeFileSync(file, ...rest);
    },
  };
  const error = thrownBy(() => applyScaffold(fixture.root, result, { io: racing, verify: () => ["SCHEMA-099 something broke"] }));
  assert.ok(error instanceof ScaffoldRefusal, `the run is undone as far as it can be, and the folder is not blamed on it: ${error}`);
  assert.equal(fixture.read(`${PACKS}/example-fox/notes.md`), "mine\n", "the other file is untouched");
  assert.deepEqual(fs.readdirSync(path.join(fixture.root, PACKS, "example-fox")), ["notes.md"], "the five pack files are gone");
  fixture.remove(`${PACKS}/example-fox`);
  assert.deepEqual(snapshot(fixture.root), before, "everything else is as it was");
});

test("a pack that another run writes into the folder this run just made is left alone as well", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const otherRun = plan(fixture, FULL);
  let raced = false;
  const io = {
    ...failingIo(),
    mkdirSync(directory, ...rest) {
      const made = fs.mkdirSync(directory, ...rest);
      // This run made the folder; straight after, the other run writes its whole pack into it.
      if (!raced && String(directory).replaceAll("\\", "/").endsWith("/archetypes/example-fox")) {
        raced = true;
        for (const { path: file, content } of otherRun.create) fs.writeFileSync(path.join(fixture.root, file), content);
      }
      return made;
    },
  };
  const error = thrownBy(() => applyScaffold(fixture.root, result, { io }));
  assert.equal(error.code, "EEXIST");
  assert.ok(!(error instanceof ScaffoldRollbackError), `the folder holds the other run's files, so it is not this run's leftover: ${error}`);
  for (const { path: file, content } of otherRun.create) assert.equal(fixture.read(file), content, `${file} is still the other run's`);
});

test("a file that somebody edited after this run wrote it is left as it is, and reported, instead of being rewritten", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);
  const handEdit = "\nA paragraph a person added while the checks were running.\n";
  const verify = () => {
    fs.appendFileSync(path.join(fixture.root, "README.md"), handEdit);
    return ["SCHEMA-099 something broke"];
  };
  const error = thrownBy(() => applyScaffold(fixture.root, result, { verify }));
  assert.ok(error instanceof ScaffoldRollbackError, String(error));
  assert.match(error.message, /^Writing failed \(the repository checks failed after writing: SCHEMA-099 something broke\), and one change could not be undone$/);
  assert.deepEqual(error.leftovers, ["restore README.md: it was changed after this run wrote it, so it was left as it is"]);
  assert.ok(fixture.read("README.md").endsWith(handEdit), "the person's paragraph is still there");
  const after = snapshot(fixture.root);
  for (const [file, hash] of before) if (file !== "README.md") assert.equal(after.get(file), hash, `${file} is as it was`);
  assert.equal(after.size, before.size, "the pack is gone");
});

test("a file whose exclusive create succeeded but whose write then failed is removed, not left empty", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);
  // A full disk: the exclusive create makes the file, and the write that follows fails.
  const io = {
    ...failingIo(),
    writeFileSync(file, ...rest) {
      if (String(file).replaceAll("\\", "/").endsWith("/example-fox/style.md")) {
        fs.writeFileSync(file, "", { flag: "wx" });
        throw Object.assign(new Error("ENOSPC: no space left on device, write"), { code: "ENOSPC" });
      }
      return fs.writeFileSync(file, ...rest);
    },
  };
  const error = thrownBy(() => applyScaffold(fixture.root, result, { io }));
  assert.equal(error.code, "ENOSPC", "the failure is reported as it was");
  assert.ok(!(error instanceof ScaffoldRollbackError), "and nothing is left over");
  assert.deepEqual(snapshot(fixture.root), before, "the empty file and its folder are gone");
});

test("a pack that another run created first is left alone, and the report does not claim it as this run's", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const otherRun = plan(fixture, FULL);
  let raced = false;
  const io = {
    ...failingIo(),
    mkdirSync(directory, ...rest) {
      // The other run writes the whole pack just before this run makes the folder.
      if (!raced && String(directory).replaceAll("\\", "/").endsWith("/archetypes/example-fox")) {
        raced = true;
        for (const { path: file, content } of otherRun.create) {
          fs.mkdirSync(path.dirname(path.join(fixture.root, file)), { recursive: true });
          fs.writeFileSync(path.join(fixture.root, file), content);
        }
      }
      return fs.mkdirSync(directory, ...rest);
    },
  };
  const error = thrownBy(() => applyScaffold(fixture.root, result, { io }));
  assert.equal(error.code, "EEXIST");
  assert.ok(!(error instanceof ScaffoldRollbackError), `there is nothing of this run's to report: ${error}`);
  for (const { path: file, content } of otherRun.create) assert.equal(fixture.read(file), content, `${file} is still the other run's`);
});

test("an edit made to a file after the pre-check and before it is written is never written over", (t) => {
  const fixture = createFixture(t);
  const result = plan(fixture, FULL);
  const before = snapshot(fixture.root);
  let reads = 0;
  const io = {
    ...failingIo(),
    readFileSync(file, ...rest) {
      // The pre-check reads ATTRIBUTIONS.md first; the second read is the one just before it is written.
      if (String(file).replaceAll("\\", "/").endsWith("/ATTRIBUTIONS.md") && (reads += 1) === 2) fs.appendFileSync(file, "\nA line added by hand in between.\n");
      return fs.readFileSync(file, ...rest);
    },
  };
  const error = refusalOf(() => applyScaffold(fixture.root, result, { io }));
  assert.match(error.message, /changed while it was being written, so the changes were undone/);
  assert.deepEqual(error.problems, ["ATTRIBUTIONS.md changed"]);
  assert.ok(fixture.read("ATTRIBUTIONS.md").endsWith("A line added by hand in between.\n"), "the hand edit survives");
  const after = snapshot(fixture.root);
  for (const [file, hash] of before) if (file !== "ATTRIBUTIONS.md") assert.equal(after.get(file), hash, `${file} is as it was`);
  assert.equal(after.size, before.size, "the pack and its folder are gone");
});

test("a generated document that is missing is created, and removed again if the run is undone", (t) => {
  const fixture = createFixture(t).remove("skills/inkexplain/references/routing.md");
  const result = plan(fixture, FULL);
  assert.equal(result.modify.find((file) => file.path.endsWith("references/routing.md")).before, null, "the plan knows it was missing");
  const before = snapshot(fixture.root);
  refusalOf(() => applyScaffold(fixture.root, result, { verify: () => ["SCHEMA-099 something broke"] }));
  assert.deepEqual(snapshot(fixture.root), before, "the document the run created is gone again");

  applyScaffold(fixture.root, result);
  assert.ok(fixture.exists("skills/inkexplain/references/routing.md"));
  for (const check of fixture.run()) assert.equal(check.status, "pass", `${check.id}\n${messages(check)}`);
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
  assert.match(refused, /archetype example-fox is active but still says it is experimental: .*status `experimental`/);
  assert.match(refused, /examples\/prompts\.md: archetype example-fox is active but still says it is experimental: .*stays `experimental`/, "the example prompt says it too");
  assert.match(messages(fixture.check("LEGAL-003")), /does not state status active/);

  // The contributor writes the missing text and updates the status wording, in the pack and in the example prompt.
  for (const file of PACK_FILES) {
    const pack = `${PACKS}/example-fox/${file}`;
    fixture.write(pack, fixture.read(pack).replace(/TODO:[^|\n]*/g, "Written by the contributor.").replace(/experimental/gi, "active"));
  }
  assert.match(messages(fixture.check("SCHEMA-010")), /examples\/prompts\.md/, "one claim is left, and it is named");
  fixture.write("examples/prompts.md", fixture.read("examples/prompts.md").replace(/ and stays `experimental` until its renders have been reviewed, so each delivery says so/, ""));
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
