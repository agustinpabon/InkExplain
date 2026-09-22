import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  buildAliasIndex,
  findAliasMentions,
  isValidIsoDate,
  normalizeName,
  outputDirectory,
  parseRegistry,
  resolveArchetypeRequest,
  validateRegistryData,
} from "../../scripts/lib/registry.mjs";
import { fixtureRegistryData } from "../helpers/fixture.mjs";

const REAL_REGISTRY_TEXT = fs.readFileSync(path.join(import.meta.dirname, "../../skills/inkexplain/registry.json"), "utf8");

function load(data = fixtureRegistryData()) {
  const result = parseRegistry(JSON.stringify(data));
  assert.deepEqual(result.schemaIssues, []);
  return result;
}

function schemaMessages(mutate) {
  const data = fixtureRegistryData();
  mutate(data);
  return validateRegistryData(data).map((issue) => `${issue.where}: ${issue.message}`).join("\n");
}

test("normalizeName folds case, width, and separators", () => {
  assert.equal(normalizeName("  Ian-Xiaohei "), "ian xiaohei");
  assert.equal(normalizeName("Tux_Penguin"), "tux penguin");
  assert.equal(normalizeName("ＧＯ　Gopher"), "go gopher");
});

test("isValidIsoDate rejects impossible dates", () => {
  assert.equal(isValidIsoDate("2026-02-28"), true);
  assert.equal(isValidIsoDate("2026-02-30"), false);
  assert.equal(isValidIsoDate("2026-6-1"), false);
  assert.equal(isValidIsoDate("date"), false);
});

test("the fixture registry is valid", () => {
  assert.deepEqual(validateRegistryData(fixtureRegistryData()), []);
});

test("schema validation catches structural mistakes", () => {
  const cases = [
    [(data) => (data.archetypes[1].colour = "red"), /unknown field "colour"/],
    [(data) => (data.archetypes[1].id = "Demo Crab"), /archetypes\[1\]\.id: must be lowercase kebab-case/],
    [(data) => (data.archetypes[1].status = "approved"), /archetypes\[1\]\.status: must be one of active, experimental, gated-authorized/],
    [(data) => (data.archetypes[1].category = "celebrity"), /archetypes\[1\]\.category: must be one of/],
    [(data) => (data.archetypes[2].outputSuffix = "demo"), /duplicate output suffix "demo"/],
    [(data) => (data.archetypes[2].id = "demo"), /duplicate archetype id "demo"/],
    [(data) => (data.defaultArchetype = "nope"), /defaultArchetype: must name an existing archetype id/],
    [(data) => (data.defaultArchetype = "guarded"), /the default archetype must be an active house-style/],
    [(data) => (data.defaultArchetype = "demo"), /the default archetype must be an active house-style/],
    [(data) => (data.archetypes[1].legalNotice.attributionTerms = []), /third-party archetypes must list at least one attribution term/],
    [(data) => (data.archetypes[2].legalNotice.restrictions = []), /tribute characters must state their rights boundaries/],
    [(data) => delete data.archetypes[1].legalNotice.rightsHolder, /legalNotice\.rightsHolder: must be a non-empty string/],
    [(data) => (data.archetypes[1].motionDna.signatureActions = ["pinch"]), /signatureActions: must list at least 3 non-empty entries/],
    [(data) => (data.archetypes[1].motionDna.tempo = "fast"), /motionDna: unknown field "tempo"/],
    [(data) => (data.archetypes[1].styleSheet.palette = []), /styleSheet\.palette: must list at least 1 non-empty entry/],
    [(data) => (data.archetypes[1].styleSheet = "loose ink"), /styleSheet: must be an object/],
    [(data) => (data.archetypes[1].contract.identityMarkers = []), /identityMarkers: must list at least 1 non-empty entry/],
    [(data) => (data.archetypes[1].contract.styleMarkers = ["x"]), /contract: unknown field "styleMarkers"/],
    [(data) => (data.archetypes[1].summary = "x".repeat(241)), /summary: must be a one-sentence summary/],
    [(data) => (data.schemaVersion = 1), /schemaVersion: must be 2/],
    [(data) => (data.routes = data.archetypes), /unknown field "routes"/],
  ];
  for (const [mutate, pattern] of cases) assert.match(schemaMessages(mutate), pattern);
});

test("house styles need no attribution terms", () => {
  assert.equal(schemaMessages(() => {}), "");
  assert.doesNotMatch(schemaMessages((data) => (data.archetypes[0].legalNotice.attributionTerms = [])), /attribution term/);
});

test("approved samples need a real reviewer and date; other statuses publish nothing", () => {
  assert.match(schemaMessages((data) => (data.archetypes[1].sampleGates.reviewer = "reviewer")), /named reviewer, not a placeholder/);
  assert.match(schemaMessages((data) => (data.archetypes[1].sampleGates.reviewer = "  PENDING ")), /named reviewer/);
  assert.match(schemaMessages((data) => (data.archetypes[1].sampleGates.date = "2026-13-01")), /real YYYY-MM-DD review date/);
  assert.match(
    schemaMessages((data) => (data.archetypes[2].sampleGates.directories = ["examples/gallery/en/guarded"])),
    /must be empty while samples are withheld/,
  );
  assert.match(schemaMessages((data) => (data.archetypes[1].sampleGates.directories = ["../outside"])), /escapes the repository root/);
  assert.match(schemaMessages((data) => (data.archetypes[1].sampleGates.decision = "ok")), /explain the decision/);
  assert.match(schemaMessages((data) => (data.archetypes[1].sampleGates.authorization = " ")), /authorization: must be a non-empty string/);
});

test("alias index accepts an alias that restates the id but rejects collisions", () => {
  const archetypes = fixtureRegistryData().archetypes.map((archetype) => ({ ...archetype, excludedTerms: archetype.excludedTerms ?? [] }));
  assert.deepEqual(buildAliasIndex(archetypes).problems, []);

  archetypes[2] = { ...archetypes[2], aliases: ["Guarded Cat", "demo mascot"] };
  assert.match(buildAliasIndex(archetypes).problems.map((p) => p.message).join("\n"), /"demo mascot" collides with archetype demo/);

  archetypes[2] = { ...archetypes[2], aliases: ["Guarded Cat", "guarded-cat"] };
  assert.match(buildAliasIndex(archetypes).problems.map((p) => p.message).join("\n"), /duplicates another alias/);

  archetypes[2] = { ...archetypes[2], aliases: ["Guarded Cat"], excludedTerms: ["ink sketch"] };
  assert.match(
    buildAliasIndex(archetypes).problems.map((p) => p.message).join("\n"),
    /excluded term "ink sketch" is a selectable name of archetype ink/,
  );

  archetypes[2] = { ...archetypes[2], aliases: ["Guarded Cat", "All Archetypes"], excludedTerms: [] };
  assert.match(buildAliasIndex(archetypes).problems.map((p) => p.message).join("\n"), /is reserved/);
});

test("archetype resolution: default, single, mixed, all, unknown, and excluded", () => {
  const data = fixtureRegistryData();
  data.archetypes.push({
    ...structuredClone(data.archetypes[1]),
    id: "draft",
    name: "Draft Owl",
    status: "experimental",
    aliases: ["Draft Owl"],
    excludedTerms: [],
    outputSuffix: "draft",
    contract: { identityMarkers: ["owl"], isolationMarkers: ["Draft Owl"] },
  });
  const { registry } = load(data);
  const ids = (result) => result.archetypes.map((archetype) => archetype.id);

  assert.deepEqual([resolveArchetypeRequest(registry).mode, ids(resolveArchetypeRequest(registry))], ["default", ["ink"]]);
  assert.deepEqual(ids(resolveArchetypeRequest(registry, "  DEMO-mascot ")), ["demo"]);
  assert.equal(resolveArchetypeRequest(registry, ["demo"]).mode, "single");

  const mixed = resolveArchetypeRequest(registry, ["Guarded Cat", "Demo Crab", "demo"]);
  assert.equal(mixed.mode, "mixed");
  assert.deepEqual(ids(mixed), ["guarded", "demo"], "request order is kept and duplicates collapse");

  const all = resolveArchetypeRequest(registry, ["all archetypes"]);
  assert.deepEqual(ids(all), ["ink", "demo"], "gated and experimental archetypes are not part of 'all archetypes'");
  assert.equal(all.expandedAll, true);
  assert.deepEqual(ids(resolveArchetypeRequest(registry, ["every character", "Guarded Cat", "Draft Owl"])), ["ink", "demo", "guarded", "draft"]);

  const unknown = resolveArchetypeRequest(registry, ["Demo Crabb"]);
  assert.equal(unknown.mode, "unresolved");
  assert.deepEqual(unknown.unknown[0].suggestions, ["demo"]);

  const excluded = resolveArchetypeRequest(registry, ["crab"]);
  assert.equal(excluded.mode, "unresolved", "an excluded term never falls back to an archetype");
  assert.deepEqual(excluded.excluded[0].suggestions, ["demo"]);
});

test("output directories are deterministic and unique per archetype", () => {
  const { registry } = load();
  assert.equal(outputDirectory(registry.byId.get("ink")), "assets/<article-slug>-illustrations/");
  assert.equal(outputDirectory(registry.byId.get("demo"), "my-post"), "assets/my-post-demo/");
  const dirs = registry.archetypes.map((archetype) => outputDirectory(archetype));
  assert.equal(new Set(dirs).size, dirs.length);
});

test("findAliasMentions respects word boundaries and matches Han-script aliases", () => {
  const { registry } = parseRegistry(REAL_REGISTRY_TEXT);
  const archetypesIn = (text) => [...new Set(findAliasMentions(registry, text).map((mention) => mention.archetypeId))];
  assert.deepEqual(archetypesIn("Use Tux for this"), ["tux"]);
  assert.deepEqual(archetypesIn("a tuxedo and a seashell"), []);
  // Han aliases match inside running Han text, which has no word boundaries.
  const draw = String.fromCodePoint(0x753b, 0x4e00, 0x5f20);
  assert.deepEqual(archetypesIn(`${String.fromCodePoint(0x7528)}${String.fromCodePoint(0x5c0f, 0x76d2)}${draw}`), ["littlebox"]);
  assert.deepEqual(archetypesIn("Go-Gopher and ferris"), ["gopher", "ferris"]);
});

test("the shipped registry keeps its archetypes with InkExplain Sketch as the default", () => {
  const { registry, schemaIssues, aliasIssues } = parseRegistry(REAL_REGISTRY_TEXT);
  assert.deepEqual(schemaIssues, []);
  assert.deepEqual(aliasIssues, []);
  assert.equal(registry.skill, "inkexplain");
  // New archetypes may be added freely; these must not disappear by accident.
  for (const id of ["ink", "xiaohei", "littlebox", "ferris", "seal", "openclaw", "gopher", "tux"]) {
    assert.ok(registry.byId.has(id), id);
  }
  assert.equal(registry.archetypes[0].id, "ink", "the default archetype is listed first");
  assert.equal(registry.defaultArchetype.id, "ink");
  assert.equal(registry.defaultArchetype.category, "house-style");
  assert.equal(outputDirectory(registry.defaultArchetype), "assets/<article-slug>-illustrations/");
});

test("shipped aliases resolve to their archetypes", () => {
  const { registry } = parseRegistry(REAL_REGISTRY_TEXT);
  const expectations = {
    xiaohei: ["Xiaohei", "xiaohei", "小黑", "Ian Xiaohei"],
    littlebox: ["小盒", "Littlebox", "纸盒", "paper-box", "carton"],
    ferris: ["Ferris", "Rust mascot", "Rust crab", "Rustacean", "Rust 吉祥物", "Rust 螃蟹"],
    seal: ["Seal", "hoodie seal", "white seal", "blue hoodie seal", "海豹", "连帽衫海豹", "白色海豹", "蓝色连帽衫海豹"],
    openclaw: ["OpenClaw", "openclaw", "OpenClaw logo", "OpenClaw mascot", "OpenClaw 助手", "OpenClaw 吉祥物"],
    gopher: ["Go Gopher", "Gopher", "golang gopher", "Go mascot", "Go 吉祥物", "Gopher 吉祥物"],
    tux: ["Tux", "tux", "Linux Mascot", "Linux mascot", "Linux", "linux", "Linux penguin", "Tux penguin"],
  };
  for (const [archetypeId, aliases] of Object.entries(expectations)) {
    for (const alias of aliases) {
      const result = resolveArchetypeRequest(registry, [alias]);
      assert.deepEqual([result.mode, result.archetypes.map((archetype) => archetype.id)], ["single", [archetypeId]], alias);
    }
  }
  for (const term of ["go", "penguin", "logo"]) {
    assert.equal(resolveArchetypeRequest(registry, [term]).mode, "unresolved", term);
  }
});

test("the shipped registry has no gated archetypes, so 'all archetypes' is every active one", () => {
  const { registry } = parseRegistry(REAL_REGISTRY_TEXT);
  assert.deepEqual(registry.archetypes.filter((archetype) => archetype.gated), []);
  const all = resolveArchetypeRequest(registry, ["all archetypes"]).archetypes.map((archetype) => archetype.id);
  const active = registry.archetypes.filter((archetype) => archetype.status === "active").map((archetype) => archetype.id);
  assert.deepEqual(all, active);
  const xiaohei = registry.byId.get("xiaohei");
  assert.equal(xiaohei.legalNotice.license, "MIT");
  assert.match(xiaohei.legalNotice.credit, /Ian Xiaohei Illustrations by Ian/);
});
