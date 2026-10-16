import assert from "node:assert/strict";
import test from "node:test";
import { FIXTURE_BACKGROUND, createFixture, makePng, messages } from "../helpers/fixture.mjs";

const PACK = "skills/inkexplain/references/archetypes";

/** A fixture whose "demo" archetype offers a page color, with its pack rewritten to carry it. */
function fixtureWithBackground(t) {
  const fixture = createFixture(t);
  fixture.updateRegistry((data) => (data.archetypes[1].styleSheet.background = structuredClone(FIXTURE_BACKGROUND)));
  return fixture.rewritePack("demo").regenerateDocs();
}

test("a valid fixture passes every schema check", (t) => {
  const fixture = createFixture(t);
  for (const result of fixture.run({ only: ["SCHEMA"] })) assert.equal(result.status, "pass", `${result.id}\n${messages(result)}`);
});

test("SCHEMA-001 reports schema errors and makes dependent checks skip", (t) => {
  const fixture = createFixture(t).updateRegistry((data) => {
    data.archetypes[1].category = "celebrity";
  });
  const results = fixture.run({ only: ["SCHEMA"] });
  assert.match(messages(results[0]), /archetypes\[1\]\.category: must be one of house-style, mascot, tribute-character, animation-preset/);
  assert.ok(results.slice(1).every((result) => result.status === "skip"));
});

test("SCHEMA-001 reports invalid JSON", (t) => {
  const fixture = createFixture(t).write("skills/inkexplain/registry.json", "{ not json");
  assert.match(messages(fixture.check("SCHEMA-001")), /invalid JSON/);
});

test("SCHEMA-002 rejects aliases claimed by two archetypes", (t) => {
  const fixture = createFixture(t).updateRegistry((data) => {
    data.archetypes[2].aliases.push("Demo-Mascot");
  });
  assert.match(messages(fixture.check("SCHEMA-002")), /"Demo-Mascot" collides with archetype demo/);
});

test("SCHEMA-003 requires the five pack files and rejects strays", (t) => {
  const fixture = createFixture(t);
  fixture.remove(`${PACK}/demo/rights.md`);
  fixture.write(`${PACK}/demo/notes.md`, "# Notes\n");
  fixture.write(`${PACK}/demo/reference.png`, makePng());
  fixture.write(`${PACK}/stray/style.md`, "# Stray\n");
  fixture.write(`${PACK}/README.md`, "# Loose file\n");
  const text = messages(fixture.check("SCHEMA-003"));
  assert.match(text, /demo\/rights\.md: archetype demo is missing a pack file/);
  assert.match(text, /notes\.md: not one of the five pack files/);
  assert.match(text, /reference\.png: archetype demo pack asset is not referenced/);
  assert.match(text, /archetypes\/stray: pack directory has no archetype/);
  assert.match(text, /archetypes\/README\.md: files belong inside an archetype pack directory/);
});

test("SCHEMA-003 accepts a pack asset that a pack file references", (t) => {
  const fixture = createFixture(t);
  fixture.write(`${PACK}/demo/reference.png`, makePng());
  fixture.append(`${PACK}/demo/identity.md`, "\nAttach `reference.png` as the identity reference.\n");
  assert.equal(fixture.check("SCHEMA-003").status, "pass");
});

test("SCHEMA-004 requires the standard sections, and a rights note for third-party archetypes", (t) => {
  const fixture = createFixture(t);
  fixture.replace(`${PACK}/demo/motion-and-acting.md`, "## Patterns", "## Layouts");
  fixture.replace(`${PACK}/guarded/prompts.md`, "## Rights note", "## Notes");
  fixture.replace(`${PACK}/ink/prompts.md`, "## Review and repair", "## Review");
  const text = messages(fixture.check("SCHEMA-004"));
  assert.match(text, /demo\/motion-and-acting\.md: missing section "## Patterns"/);
  assert.match(text, /guarded\/prompts\.md: missing section "## Rights note"/);
  assert.match(text, /ink\/prompts\.md: missing section "## Review and repair"/);
  assert.doesNotMatch(text, /ink\/prompts\.md: missing section "## Rights note"/, "house styles need no rights note");
});

test("SCHEMA-005 carries identity markers, palette, and signature actions into the pack", (t) => {
  const fixture = createFixture(t);
  fixture.replace(`${PACK}/demo/prompts.md`, "Draw one idea with orange shell.", "Draw one idea.");
  fixture.write(`${PACK}/ink/style.md`, fixture.read(`${PACK}/ink/style.md`).replaceAll("explainer blue", "blue"));
  fixture.write(`${PACK}/guarded/motion-and-acting.md`, fixture.read(`${PACK}/guarded/motion-and-acting.md`).replaceAll("pounce, ", ""));
  const text = messages(fixture.check("SCHEMA-005"));
  assert.match(text, /demo\/prompts\.md: archetype demo identity marker "orange shell" is missing/);
  assert.match(text, /ink\/style\.md: archetype ink palette entry "explainer blue" is missing/);
  assert.match(text, /guarded\/motion-and-acting\.md: archetype guarded signature action "pounce" is missing/);
});

test("SCHEMA-006 carries the output folder, a text prompt, status, and rights note", (t) => {
  const fixture = createFixture(t);
  fixture.replace(`${PACK}/ink/prompts.md`, "```text", "```md");
  fixture.replace(`${PACK}/guarded/prompts.md`, "assets/<article-slug>-guarded/", "assets/somewhere/");
  fixture.replace(`${PACK}/guarded/prompts.md`, "Status: `gated-authorized`. Credit:", "Credit:");
  fixture.replace(`${PACK}/demo/prompts.md`, "## Rights note\n\n```text", "## Rights note\n\n```md");
  const text = messages(fixture.check("SCHEMA-006"));
  assert.match(text, /ink\/prompts\.md: needs at least one ```text generation prompt block/);
  assert.match(text, /guarded\/prompts\.md: does not state the output folder/);
  assert.match(text, /guarded\/prompts\.md: the rights note does not state the status gated-authorized/);
  assert.match(text, /demo\/prompts\.md: "## Rights note" needs a ```text block/);
});

test("SCHEMA-007 keeps archetype markers out of other packs", (t) => {
  const fixture = createFixture(t).append(`${PACK}/ink/style.md`, "\nNever draw the demo crab here.\n");
  const result = fixture.check("SCHEMA-007");
  assert.match(messages(result), /ink\/style\.md:\d+: archetype ink mentions "Demo Crab", which belongs to archetype demo/);
});

test("SCHEMA-008 detects a hand-edited or stale routing.md", (t) => {
  const fixture = createFixture(t).append("skills/inkexplain/references/routing.md", "\nManual edit.\n");
  assert.match(messages(fixture.check("SCHEMA-008")), /out of date with registry\.json/);
  fixture.regenerateDocs();
  assert.equal(fixture.check("SCHEMA-008").status, "pass");
});

test("SCHEMA-009 passes when the style sheet and the prompt carry the page-color policy, and when there is none", (t) => {
  assert.equal(fixtureWithBackground(t).check("SCHEMA-009").status, "pass");
  assert.equal(createFixture(t).check("SCHEMA-009").status, "pass", "an archetype with a fixed page has nothing to carry");
});

test("SCHEMA-009 requires the generation prompt to name the registry's default page in exactly one field", (t) => {
  const wrong = fixtureWithBackground(t);
  wrong.replace(`${PACK}/demo/prompts.md`, "[pure white background #FFFFFF]", "[pale lavender background #E6E6FA]");
  assert.match(messages(wrong.check("SCHEMA-009")), /demo\/prompts\.md: the generation prompt needs exactly one \[pure white background #FFFFFF\] field/);

  const missing = fixtureWithBackground(t);
  missing.replace(`${PACK}/demo/prompts.md`, "[pure white background #FFFFFF]", "pure white");
  assert.match(messages(missing.check("SCHEMA-009")), /needs exactly one \[pure white background #FFFFFF\] field/);

  const doubled = fixtureWithBackground(t);
  doubled.replace(`${PACK}/demo/prompts.md`, "[pure white background #FFFFFF]", "[pure white background #FFFFFF] or [pure white background #FFFFFF]");
  assert.match(messages(doubled.check("SCHEMA-009")), /needs exactly one \[pure white background #FFFFFF\] field/);
});

test("SCHEMA-009 requires every page color in the style sheet", (t) => {
  const fixture = fixtureWithBackground(t);
  fixture.write(`${PACK}/demo/style.md`, fixture.read(`${PACK}/demo/style.md`).replaceAll("#E6E6FA", "#E6E6F0"));
  assert.match(messages(fixture.check("SCHEMA-009")), /demo\/style\.md: archetype demo background "pale lavender" #E6E6FA is missing/);
});

test("SCHEMA-009 rejects a page-color field in a pack whose archetype offers no choice", (t) => {
  const fixture = createFixture(t);
  fixture.replace(`${PACK}/ink/prompts.md`, "Scene: [core idea in one sentence].", "Style: [pure white background #FFFFFF].\n\nScene: [core idea in one sentence].");
  assert.match(messages(fixture.check("SCHEMA-009")), /ink\/prompts\.md: has a \[pure white background #FFFFFF\] field, but archetype ink declares no styleSheet\.background/);
});

test("a new archetype needs only a registry entry, a pack, and regenerated docs", (t) => {
  const fixture = createFixture(t).addArchetype({
    id: "paper-fox",
    name: "Paper Fox",
    category: "animation-preset",
    status: "experimental",
    summary: "An origami fox that folds itself into each idea.",
    aliases: ["Paper Fox", "origami fox"],
    outputSuffix: "paper-fox",
    motionDna: { actor: "The paper fox", signatureActions: ["fold", "unfold", "leap"], poses: ["mid-fold"], timing: "Three beats: flat, folding, folded" },
    styleSheet: { medium: "Cut paper", canvas: "16:9 white", linework: "Crisp creases", palette: ["kraft brown"], avoid: ["glossy 3D"] },
    legalNotice: { credit: "Original to InkExplain", rightsHolder: "InkExplain contributors", license: "MIT", attributionTerms: [], restrictions: [] },
    sampleGates: { status: "pending", decision: "No renders reviewed yet.", directories: [] },
    contract: { identityMarkers: ["folded paper fox"], isolationMarkers: ["Paper Fox"] },
  });
  assert.equal(fixture.check("SCHEMA-008").status, "fail", "routing.md is stale until docs are rebuilt");
  fixture.regenerateDocs();
  const failing = fixture.run({ only: ["SCHEMA", "LEGAL", "DOC-003"] }).filter((result) => result.status !== "pass");
  assert.deepEqual(failing.map((result) => `${result.id}\n${messages(result)}`), []);
  assert.match(fixture.read("README.md"), /Paper Fox \(`paper-fox`\)/);
  assert.match(fixture.read("skills/inkexplain/references/routing.md"), /### Paper Fox \(`paper-fox`\)/);
});

test("SCHEMA-010 lets an experimental archetype carry scaffold placeholders and refuses them on any other", (t) => {
  const fixture = createFixture(t);
  assert.equal(fixture.check("SCHEMA-010").status, "pass");
  fixture.append(`${PACK}/demo/identity.md`, "\nTODO: describe the shell.\n");
  const refused = fixture.check("SCHEMA-010");
  assert.equal(refused.status, "fail");
  assert.match(messages(refused), /demo\/identity\.md:\d+: archetype demo is active but still has a scaffold placeholder: .*TODO: describe the shell\./);
  fixture.append(`${PACK}/guarded/rights.md`, "\nUNRESOLVED: record the license.\n");
  assert.match(messages(fixture.check("SCHEMA-010")), /archetype guarded is gated-authorized but still has a scaffold placeholder/, "any status but experimental");

  fixture.updateRegistry((data) => {
    data.archetypes[1].status = "experimental";
    data.archetypes[2].status = "experimental";
  });
  assert.equal(fixture.check("SCHEMA-010").status, "pass", "markers are fine while the archetype is experimental");
});

test("SCHEMA-010 also reads the registry entry and the archetype's own credit in ATTRIBUTIONS", (t) => {
  const fixture = createFixture(t).updateRegistry((data) => {
    data.archetypes[1].summary = "TODO: write a summary.";
  });
  const registry = fixture.check("SCHEMA-010");
  assert.match(messages(registry), /registry\.json: archetype demo is active but still has a scaffold placeholder: .*TODO: write a summary\./);
  assert.ok(registry.issues.every((issue) => issue.line === undefined), "an entry has no line of its own");

  fixture.updateRegistry((data) => {
    data.archetypes[1].summary = "A crab.";
  });
  fixture.append("ATTRIBUTIONS.md", "\n### Demo Crab\n\n- UNRESOLVED: record the rights holder.\n");
  assert.match(messages(fixture.check("SCHEMA-010")), /ATTRIBUTIONS\.md: archetype demo is active but still has a scaffold placeholder: .*UNRESOLVED: record the rights holder\./);
});

test("SCHEMA-010 refuses a promoted pack that still calls itself experimental", (t) => {
  const fixture = createFixture(t);
  fixture.append(`${PACK}/demo/prompts.md`, "\nEvery delivery says the pack is experimental.\n");
  assert.match(messages(fixture.check("SCHEMA-010")), /demo\/prompts\.md:\d+: archetype demo is active but still says it is experimental: .*Every delivery says the pack is experimental\./);
  fixture.updateRegistry((data) => {
    data.archetypes[1].status = "experimental";
  });
  assert.equal(fixture.check("SCHEMA-010").status, "pass", "an experimental archetype may say so");
});

test("SCHEMA-010 reads a claim about the status and the marker's colon, not the bare words", (t) => {
  const fixture = createFixture(t);
  // Prose that merely uses the words is not a stale claim, so a promoted pack may keep it.
  fixture.append(`${PACK}/demo/style.md`, "\nLoose, experimental linework is welcome here, a to-do list is a fine prop, and a sign that reads TODO needs no colon.\n");
  assert.equal(fixture.check("SCHEMA-010").status, "pass", messages(fixture.check("SCHEMA-010")));
  for (const claim of ["The look remains experimental.", "This pack is still experimental.", "It is an experimental archetype.", "Status: `experimental`."]) {
    const pack = createFixture(t);
    pack.append(`${PACK}/demo/style.md`, `\n${claim}\n`);
    assert.match(messages(pack.check("SCHEMA-010")), /demo\/style\.md:\d+: archetype demo is active but still says it is experimental/, claim);
  }
});

test("SCHEMA-010 also reads the archetype's own credit and example prompt", (t) => {
  const credit = createFixture(t).append("ATTRIBUTIONS.md", "\n### Demo Crab\n\n- Demo Crab is still experimental.\n");
  const flagged = credit.check("SCHEMA-010");
  assert.match(messages(flagged), /ATTRIBUTIONS\.md: archetype demo is active but still says it is experimental: .*Demo Crab is still experimental\./);
  assert.ok(flagged.issues.every((issue) => issue.line === undefined), "a section has no line of its own");

  const example = createFixture(t).append("examples/prompts.md", "\n### Demo Crab\n\nDemo Crab stays experimental until its renders are reviewed.\n");
  assert.match(messages(example.check("SCHEMA-010")), /examples\/prompts\.md: archetype demo is active but still says it is experimental/);

  // A section that belongs to no active archetype is not read.
  const other = createFixture(t).append("ATTRIBUTIONS.md", "\n### Other Crab\n\n- Other Crab is experimental.\n");
  assert.equal(other.check("SCHEMA-010").status, "pass");
});
