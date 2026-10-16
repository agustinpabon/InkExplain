import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  BackgroundError,
  MIN_BACKGROUND_LUMINANCE,
  backgroundPhrase,
  buildAliasIndex,
  findAliasMentions,
  isValidIsoDate,
  normalizeName,
  outputDirectory,
  parseRegistry,
  relativeLuminance,
  resolveArchetypeRequest,
  resolveBackground,
  validateRegistryData,
} from "../../scripts/lib/registry.mjs";
import { FIXTURE_BACKGROUND, fixtureRegistryData } from "../helpers/fixture.mjs";

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

test("normalizeName ignores invisible joiners and variation selectors, and treats every dash as a separator", () => {
  const joiner = String.fromCodePoint(0x200d);
  const nonJoiner = String.fromCodePoint(0x200c);
  const selector = String.fromCodePoint(0xfe0f);
  assert.equal(normalizeName(`Ferris${nonJoiner}`), "ferris", "a trailing joiner does not make another name");
  assert.equal(normalizeName(`Fer${joiner}ris${selector}`), "ferris");
  assert.equal(normalizeName("Ian–Xiaohei"), "ian xiaohei", "an en dash separates like a hyphen");
  assert.equal(normalizeName("Ian—Xiaohei"), "ian xiaohei", "and so does an em dash");
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
  for (const id of ["ink", "stickman", "xiaohei", "littlebox", "ferris", "seal", "openclaw", "gopher", "tux"]) {
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
    stickman: ["Stickman", "stickman", "STICK MAN", "stick figure", "Stick-Figure", "stick person", "stickperson", "Inkman", "monigote", "Muñeco de palitos", "figura de palitos", "bonhomme allumette", "Strichmännchen", "boneco palito", "火柴人", "棒人間"],
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

// A fixture whose "demo" archetype offers a page color, the way Littlebox does.
function withBackground(mutate = () => {}) {
  const data = fixtureRegistryData();
  data.archetypes[1].styleSheet.background = structuredClone(FIXTURE_BACKGROUND);
  mutate(data.archetypes[1].styleSheet.background);
  return data;
}

function backgroundIssues(mutate) {
  return validateRegistryData(withBackground(mutate)).map((issue) => `${issue.where}: ${issue.message}`).join("\n");
}

test("relativeLuminance runs from black to white, and every shipped page color is light", () => {
  assert.equal(relativeLuminance("#000000"), 0);
  assert.equal(relativeLuminance("#FFFFFF"), 1);
  assert.ok(relativeLuminance("#E6E6FA") > MIN_BACKGROUND_LUMINANCE);
  assert.ok(relativeLuminance("#222222") < MIN_BACKGROUND_LUMINANCE);
  const { registry } = parseRegistry(REAL_REGISTRY_TEXT);
  for (const archetype of registry.archetypes) {
    const policy = archetype.styleSheet.background;
    if (policy === undefined) continue;
    for (const swatch of [policy.default, ...policy.presets]) {
      assert.ok(relativeLuminance(swatch.hex) >= MIN_BACKGROUND_LUMINANCE, `${archetype.id} ${swatch.name}`);
    }
  }
});

test("a page-color policy validates: one default, optional presets, light uppercase colors, no repeated names", () => {
  assert.equal(backgroundIssues(() => {}), "");
  assert.equal(backgroundIssues((background) => delete background.presets), "", "presets are optional");
  const cases = [
    [(background) => (background.default.hex = "#ffffff"), /default\.hex: must be an uppercase #RRGGBB color/],
    [(background) => (background.default.hex = "white"), /default\.hex: must be an uppercase #RRGGBB color/],
    [(background) => (background.presets[1].hex = "#1A237E"), /presets\[1\]\.hex: must be a light color/],
    [(background) => (background.presets[0].name = "Warm Off-White"), /presets\[0\]\.name: must be a lowercase color name/],
    [(background) => (background.presets[0].aliases = ["Cream"]), /presets\[0\]\.aliases: must be an array of lowercase color names/],
    [(background) => (background.presets[2].hex = "#E3F2FD"), /duplicate background color #E3F2FD/],
    [(background) => background.presets[2].aliases.push("pale sky blue"), /duplicate background name "pale sky blue"/],
    [(background) => background.presets[0].aliases.push("White"), /duplicate background name "White"/],
    [(background) => (background.colour = "red"), /styleSheet\.background: unknown field "colour"/],
    [(background) => (background.presets = "lavender"), /presets: must be an array of colors/],
    [(background) => (background.presets[0] = "lavender"), /presets\[0\]: must be an object with a name and a hex color/],
    [(background) => delete background.default, /default: must be an object with a name and a hex color/],
  ];
  for (const [mutate, pattern] of cases) assert.match(backgroundIssues(mutate), pattern);
  const data = fixtureRegistryData();
  data.archetypes[1].styleSheet.background = "white";
  assert.match(validateRegistryData(data).map((issue) => issue.message).join("\n"), /must be an object with a default color and optional presets/);
});

test("resolveBackground gives the default, picks a preset by name, alias, or color, and accepts other light colors", () => {
  const { registry } = load(withBackground());
  const demo = registry.byId.get("demo");
  const pick = ({ name, hex, kind }) => ({ name, hex, kind });
  const white = { name: "pure white", hex: "#FFFFFF", kind: "default" };
  for (const request of [undefined, null, "", "   ", "white", "White", "pure white", "Pure White Background", "#ffffff", "#FFFFFF"]) {
    assert.deepEqual(pick(resolveBackground(demo, request)), white, JSON.stringify(request));
  }
  const lavender = { name: "pale lavender", hex: "#E6E6FA", kind: "preset" };
  for (const request of ["lavender", "Pale Lavender", "pale-lavender", "pale lavender background", "#e6e6fa", "my lilac #E6E6FA"]) {
    assert.deepEqual(pick(resolveBackground(demo, request)), lavender, request);
  }
  assert.deepEqual(pick(resolveBackground(demo, "cream")), { name: "warm off-white", hex: "#FFFCF5", kind: "preset" });
  assert.deepEqual(pick(resolveBackground(demo, "off white")), { name: "warm off-white", hex: "#FFFCF5", kind: "preset" });
  assert.deepEqual(pick(resolveBackground(demo, "sky blue")), { name: "pale sky blue", hex: "#E3F2FD", kind: "preset" });

  const mint = resolveBackground(demo, "Mint Green #dff5e6");
  assert.deepEqual(pick(mint), { name: "mint green", hex: "#DFF5E6", kind: "custom" });
  assert.equal(mint.phrase, "mint green background #DFF5E6");
  assert.deepEqual(pick(resolveBackground(demo, "#FDF6E3")), { name: "custom", hex: "#FDF6E3", kind: "custom" });
  assert.equal(resolveBackground(demo).phrase, backgroundPhrase({ name: "pure white", hex: "#FFFFFF" }));
});

test("resolveBackground refuses what it cannot honor and says why", () => {
  const { registry } = load(withBackground());
  const demo = registry.byId.get("demo");
  const refuses = (request, pattern) => assert.throws(() => resolveBackground(demo, request), (error) => error instanceof BackgroundError && pattern.test(error.message), String(request));
  refuses("mint", /unknown background "mint"; Demo Crab offers pure white \(default\), warm off-white, pale sky blue, pale lavender, or any light #RRGGBB color/);
  refuses("facade", /unknown background "facade"/);
  refuses("#12345", /unknown background/);
  refuses("#GGGGGG", /unknown background/);
  refuses("#222222", /#222222 is too dark: black marker lines and a white character body need a light page/);
  refuses("navy #1A237E", /#1A237E is too dark/);
  refuses("Mint Green! #DFF5E6", /color name "Mint Green!" must be lowercase words/);
  refuses(`${"long ".repeat(10)}#DFF5E6`, /color name .* must be lowercase words of at most 30 characters/);
  // An archetype that offers no choice has a fixed page.
  assert.throws(() => resolveBackground(registry.byId.get("ink"), "white"), (error) => error instanceof BackgroundError && /InkExplain Sketch draws on a fixed background/.test(error.message));
});

test("the shipped Littlebox registry entry makes pure white the default, with the other three as presets", () => {
  const { registry } = parseRegistry(REAL_REGISTRY_TEXT);
  const littlebox = registry.byId.get("littlebox");
  const policy = littlebox.styleSheet.background;
  assert.deepEqual([policy.default.name, policy.default.hex], ["pure white", "#FFFFFF"]);
  assert.deepEqual(policy.presets.map((preset) => preset.hex), ["#FFFCF5", "#E3F2FD", "#E6E6FA"]);
  assert.equal(resolveBackground(littlebox).phrase, "pure white background #FFFFFF");
  assert.equal(resolveBackground(littlebox, "pale lavender").hex, "#E6E6FA");
  for (const archetype of registry.archetypes.filter((candidate) => candidate.id !== "littlebox")) {
    assert.equal(archetype.styleSheet.background, undefined, `${archetype.id} keeps its fixed background`);
  }
});
