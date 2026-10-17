import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { describeSet, gitBlobSha1, imageNames, loadProvenance, setFor, validateProvenanceData } from "../../scripts/lib/provenance.mjs";
import { loadRegistry } from "../../scripts/lib/registry.mjs";
import { Repository } from "../../scripts/lib/repository.mjs";
import { createFixture, fixtureProvenanceData, makePng } from "../helpers/fixture.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");
const SHA = "30a9d4e05124fda05356acb679fa2989ed5cb51c";

const copy = () => ({
  directory: "examples/gallery/en/demo",
  origin: "historical",
  source: {
    project: "Example Illustrations",
    repository: "https://github.com/example/example-illustrations",
    commit: SHA,
    path: "examples/images",
    license: "MIT",
    copyright: "Copyright (c) 2026 Example",
    firstPublished: "2026-06-15",
  },
  files: { "01-demo-scene.png": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391" },
});

const manifestWith = (set) => ({ schemaVersion: 1, sets: [set] });
const problems = (data) => validateProvenanceData(data).map((issue) => `${issue.where}: ${issue.message}`).join("\n");

test("gitBlobSha1 is the hash git uses for a file, so a copy can be checked against its upstream tree", () => {
  assert.equal(gitBlobSha1(Buffer.alloc(0)), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
  assert.equal(gitBlobSha1(Buffer.from("test content\n")), "d670460b4b4aece5915caf5c68d12f560a9fe3e4");
  assert.equal(gitBlobSha1(Buffer.from("hello world")), "95d09f2b10159347eece71399a7e2e907ea3df4f");
  assert.notEqual(gitBlobSha1(makePng(4, 3)), gitBlobSha1(makePng(5, 3)));
});

test("a copy of another project's files and an InkExplain render are both valid sets", () => {
  assert.equal(problems(manifestWith(copy())), "");
  assert.equal(problems(fixtureProvenanceData()), "");
});

test("the manifest rejects what would make a source claim untrustworthy", () => {
  const cases = [
    [(data) => (data.schemaVersion = 2), /schemaVersion: must be 1/],
    [(data) => (data.sets = []), /sets: must be a non-empty array/],
    [(data) => (data.extra = true), /unknown field "extra"/],
    [(data) => (data.sets[0].origin = "found online"), /origin: must be one of historical, inkexplain/],
    [(data) => delete data.sets[0].source, /a historical set needs a source object/],
    [(data) => (data.sets[0].source.repository = "https://example.com/x/y"), /repository: must be a https:\/\/github\.com\/<owner>\/<repository> URL/],
    [(data) => (data.sets[0].source.commit = "30a9d4e"), /commit: must be the full 40-character commit hash/],
    [(data) => (data.sets[0].source.firstPublished = "2026-13-40"), /firstPublished: must be the YYYY-MM-DD day/],
    [(data) => delete data.sets[0].source.license, /license: must be a non-empty string/],
    [(data) => (data.sets[0].source.path = "../elsewhere"), /path: .*escapes/],
    [(data) => (data.sets[0].source.colour = "red"), /unknown field "colour"/],
    [(data) => (data.sets[0].reviewedBy = "Someone"), /reviewedBy: belongs to an inkexplain set/],
    [(data) => (data.sets[0].directory = "examples/gallery/fr/demo"), /directory: must look like examples\/gallery\/<en\|zh>\/<archetype id>/],
    [(data) => (data.sets[0].directory = "somewhere/else"), /directory: must look like/],
    [(data) => (data.sets[0].files = {}), /files: must map every image name to its git blob SHA-1/],
    [(data) => (data.sets[0].files = { "Bad Name.png": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391" }), /gallery files are named NN-kebab-slug\.png/],
    [(data) => (data.sets[0].files["01-demo-scene.png"] = "E69DE29B"), /must be a 40-character lowercase git blob SHA-1/],
    [(data) => (data.sets[0].note = " "), /note: must be a non-empty string when present/],
    [(data) => data.sets.push(structuredClone(data.sets[0])), /sets\[1\]\.directory: duplicate set for examples\/gallery\/en\/demo/],
  ];
  for (const [mutate, pattern] of cases) {
    const data = manifestWith(copy());
    mutate(data);
    assert.match(problems(data), pattern);
  }
  assert.match(problems(null), /the manifest must be a JSON object/);
  assert.match(problems([]), /the manifest must be a JSON object/);
});

test("an InkExplain render needs its tool, its date, its terms, and a named reviewer, and is never a claimed copy", () => {
  const cases = [
    [(set) => delete set.generated, /generated: an inkexplain set needs the tool and the date it was generated/],
    [(set) => (set.generated.tool = "tool"), /generated\.tool: must name the image tool, not a placeholder/],
    [(set) => (set.generated.date = "yesterday"), /generated\.date: must be the real YYYY-MM-DD generation date/],
    [(set) => (set.generated.model = "unknown"), /generated\.model: must name the model the tool reports, or be left out when it does not say/],
    [(set) => delete set.generated.terms, /generated\.terms: must say whose terms govern the output of the tool, with a link to them/],
    [(set) => (set.generated.terms = "TBD"), /generated\.terms: must say whose terms govern/],
    [(set) => (set.generated.colour = "red"), /unknown field "colour"/],
    [(set) => (set.reviewedBy = "Reviewer"), /reviewedBy: needs the person who reviewed these renders, not a placeholder/],
    [(set) => delete set.reviewedOn, /reviewedOn: needs the real YYYY-MM-DD review date/],
    [(set) => (set.source = copy().source), /source: an inkexplain set is not a copy/],
  ];
  for (const [mutate, pattern] of cases) {
    const data = fixtureProvenanceData();
    mutate(data.sets[0]);
    assert.match(problems(data), pattern);
  }
  // The model is optional: a tool that does not say which model it ran is recorded without one.
  const data = fixtureProvenanceData();
  delete data.sets[0].generated.model;
  assert.equal(problems(data), "");
});

test("an InkExplain render records, for every image, the idea it explains, the prompt as sent, and how it was made", () => {
  const FILE = "01-demo-scene.png";
  const cases = [
    [(set) => delete set.items, /items: an inkexplain set needs a record for every image: its concept, its prompt, and how it was made/],
    [(set) => (set.items = {}), /items\.01-demo-scene\.png: every image needs a record of its concept, its prompt, and how it was made/],
    [(set) => (set.items["02-extra.png"] = structuredClone(set.items[FILE])), /items\.02-extra\.png: is a record for an image that is not listed in files/],
    [(set) => (set.items[FILE] = "a note"), /items\.01-demo-scene\.png: must be an object/],
    [(set) => (set.items[FILE].concept = "TODO"), /items\.01-demo-scene\.png\.concept: must be the idea the image explains, not a placeholder/],
    [(set) => delete set.items[FILE].prompt, /items\.01-demo-scene\.png\.prompt: must be the complete prompt as it was sent, not a placeholder/],
    [(set) => (set.items[FILE].operation = "retouched"), /items\.01-demo-scene\.png\.operation: must be one of generated, edited, by-hand/],
    [(set) => (set.items[FILE].operation = "edited"), /items\.01-demo-scene\.png\.edit: an edited image must say what was changed and with which tool/],
    [(set) => (set.items[FILE].edit = "fixed a label"), /items\.01-demo-scene\.png\.edit: belongs to an edited image only/],
    [(set) => (set.items[FILE].colour = "red"), /unknown field "colour"/],
  ];
  for (const [mutate, pattern] of cases) {
    const data = fixtureProvenanceData();
    mutate(data.sets[0]);
    assert.match(problems(data), pattern);
  }
  const edited = fixtureProvenanceData();
  Object.assign(edited.sets[0].items[FILE], { operation: "edited", edit: "Replaced the label 'Ouput' with 'Output' in the tool's editor." });
  assert.equal(problems(edited), "", "an edited image names what was changed");
  const byHand = fixtureProvenanceData();
  byHand.sets[0].items[FILE] = { concept: "A reference drawing made by hand.", operation: "by-hand" };
  assert.equal(problems(byHand), "", "art made by hand has no prompt");
  const copied = manifestWith(copy());
  copied.sets[0].items = fixtureProvenanceData().sets[0].items;
  assert.match(problems(copied), /items: belongs to an inkexplain set, not a copy of another project's files/);
});

test("loadProvenance reads the manifest and reports a missing, malformed, or invalid file without throwing", (t) => {
  const fixture = createFixture(t);
  const ok = loadProvenance(new Repository(fixture.root));
  assert.deepEqual(ok.issues, []);
  assert.equal(ok.manifest.sets.length, 1);

  fixture.write("examples/gallery/provenance.json", "{ not json");
  const broken = loadProvenance(new Repository(fixture.root));
  assert.equal(broken.manifest, null);
  assert.match(broken.issues[0].message, /invalid JSON/);

  fixture.write("examples/gallery/provenance.json", JSON.stringify({ schemaVersion: 1, sets: [{ origin: "historical" }] }));
  const invalid = loadProvenance(new Repository(fixture.root));
  assert.equal(invalid.manifest, null);
  assert.ok(invalid.issues.length > 1);

  fixture.remove("examples/gallery/provenance.json");
  const missing = loadProvenance(new Repository(fixture.root));
  assert.deepEqual([missing.manifest, missing.missing], [null, true]);
});

test("setFor finds a directory's set, and describeSet says in one sentence where the images came from", () => {
  const manifest = { schemaVersion: 1, sets: [copy(), { ...fixtureProvenanceData().sets[0], directory: "examples/gallery/zh/demo" }] };
  assert.equal(setFor(manifest, "examples/gallery/en/demo").origin, "historical");
  assert.equal(setFor(manifest, "examples/gallery/en/nowhere"), undefined);
  assert.equal(setFor(null, "examples/gallery/en/demo"), undefined);
  assert.equal(describeSet(manifest.sets[0]), "Unmodified copies of Example Illustrations images (MIT, Copyright (c) 2026 Example), first published 2026-06-15.");
  assert.equal(describeSet(manifest.sets[1]), "InkExplain renders generated with Fixture image tool (fixture-model-1) on 2026-01-02, reviewed by Fixture Reviewer on 2026-01-02.");
  const withoutModel = structuredClone(manifest.sets[1]);
  delete withoutModel.generated.model;
  assert.equal(describeSet(withoutModel), "InkExplain renders generated with Fixture image tool on 2026-01-02, reviewed by Fixture Reviewer on 2026-01-02.");
});

test("imageNames lists only the PNGs of a directory", (t) => {
  const fixture = createFixture(t);
  fixture.write("examples/gallery/en/demo/02-more.png", makePng());
  fixture.write("examples/gallery/en/demo/notes.txt", "x");
  assert.deepEqual(imageNames(new Repository(fixture.root), "examples/gallery/en/demo"), ["01-demo-scene.png", "02-more.png"]);
  assert.deepEqual(imageNames(new Repository(fixture.root), "examples/gallery/en/none"), []);
});

test("the shipped manifest records only the sets whose samples are approved: Xiaohei's two, unmodified copies with a commit and a first-published day", () => {
  const repo = new Repository(REPO_ROOT);
  const { manifest, issues } = loadProvenance(repo);
  assert.deepEqual(issues, []);
  assert.equal(manifest.sets.length, 2);
  assert.equal(manifest.sets.reduce((count, set) => count + Object.keys(set.files).length, 0), 16);
  assert.ok(manifest.sets.every((set) => set.origin === "historical" && /^[0-9a-f]{40}$/.test(set.source.commit)));
  assert.deepEqual(
    manifest.sets.map((set) => set.directory),
    ["en/xiaohei", "zh/xiaohei"].map((name) => `examples/gallery/${name}`),
  );
  const projects = Object.fromEntries(manifest.sets.map((set) => [set.directory.replace("examples/gallery/", ""), set.source.project]));
  assert.equal(projects["zh/xiaohei"], "Ian Xiaohei Illustrations", "the Chinese Xiaohei images come from Ian's own repository");
  assert.equal(projects["en/xiaohei"], "Visual IP Illustrations");
  // Every recorded set belongs to an archetype whose samples are approved, and no approved set is missing.
  const registry = loadRegistry(repo).registry;
  const approved = registry.archetypes.filter((archetype) => archetype.sampleGates.status === "approved").flatMap((archetype) => archetype.sampleGates.directories);
  assert.deepEqual(manifest.sets.map((set) => set.directory).sort(), [...approved].sort());
});
