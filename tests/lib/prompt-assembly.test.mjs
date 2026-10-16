import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  MAX_LABELS,
  PromptAssemblyError,
  PromptInputError,
  assemblePrompt,
  buildNegativePrompt,
  defaultAspect,
  fillTemplate,
  formatLabels,
  matchesTemplate,
  normalizeAspect,
  parsePromptPack,
  requireSlots,
  scanTemplate,
  slotDefaults,
  withRightsNote,
} from "../../scripts/lib/prompt-assembly.mjs";
import { loadRegistry, packFilePath } from "../../scripts/lib/registry.mjs";
import { Repository } from "../../scripts/lib/repository.mjs";
import { createFixture } from "../helpers/fixture.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

// The shape every shipped template shares, with one optional sentence and a rights note.
const TEMPLATE = [
  "Generate one standalone [16:9] horizontal article illustration.",
  "Style: sparse sketch. No gradients, no shadows.",
  "Action: The actor is [state] and performs the central action: [specific physical action], caught at its decisive moment. Keep it simple.",
  "Scene: [core idea in one sentence].",
  "Composition: [structure type]. [Exact positions and flow.] The action takes about 35-55% of the canvas.",
  'Labels: handwritten: ["label 1", "label 2", "label 3"]. Keep them short.',
  "Reference: Match the actor. [Reference sentence: Match the attached reference image, but not its pose.]",
  "Rights note: [append the rights note from this file].",
].join("\n\n");

const NOTE = "Credit Jane Artist. No logos.";

function packText({ template = TEMPLATE, negative = null, note = NOTE } = {}) {
  const lines = ["# Example Prompts", "", "## Generation prompt", "", "```text", template, "```", ""];
  if (negative) lines.push("### Negative prompt", "", "```text", negative, "```", "");
  lines.push("## Edit prompts", "", "```text", "Not the template.", "```", "");
  if (note) lines.push("## Rights note", "", "```text", note, "```", "");
  return lines.join("\n");
}

test("parsePromptPack reads the template, rights note, and the pack's own negative prompt", () => {
  const pack = parsePromptPack(packText({ negative: "blurry, watermark" }));
  assert.equal(pack.template, TEMPLATE);
  assert.equal(pack.rightsNote, NOTE);
  assert.equal(pack.negativePrompt, "blurry, watermark");
  assert.deepEqual(parsePromptPack(packText({ note: null })).rightsNote, null);
  assert.equal(parsePromptPack(packText()).negativePrompt, null);
  assert.throws(() => parsePromptPack("# X\n\n## Generation prompt\n\nNo block here.\n"), PromptAssemblyError);
  assert.throws(() => parsePromptPack("# X\n\n## Edit prompts\n\n```text\nx\n```\n"), /no ```text block under "Generation prompt"/);
});

test("scanTemplate classifies the shared fields and leaves pack-specific ones to the planner", () => {
  const fields = scanTemplate(TEMPLATE);
  assert.deepEqual(
    fields.map((field) => field.slot),
    ["aspect", null, "action", "scene", null, null, "labels", null, "rightsNote"],
  );
  assert.deepEqual(
    fields.map((field) => field.section),
    ["Canvas", "Action", "Action", "Scene", "Composition", "Composition", "Labels", "Reference", "Rights note"],
  );
  assert.deepEqual(fields.filter((field) => field.optional).map((field) => field.field.slice(0, 19)), ["Reference sentence:"]);
  assert.deepEqual(slotDefaults(TEMPLATE), {
    scene: "[core idea in one sentence]",
    action: "[specific physical action]",
    labels: '["label 1", "label 2", "label 3"]',
    rightsNote: "[append the rights note from this file]",
  });
});

test("fillTemplate fills the shared slots and reports every other field", () => {
  const { text, unfilled } = fillTemplate(TEMPLATE, {
    aspect: "16:9",
    scene: "Two threads wait on each other.",
    action: "clamping a key.",
    labels: ["lock A", "lock B"],
    rightsNote: NOTE,
  });
  assert.match(text, /^Generate one standalone 16:9 horizontal article illustration\.$/m);
  assert.match(text, /^Scene: Two threads wait on each other\.$/m);
  assert.match(text, /central action: clamping a key, caught at its decisive moment\./);
  assert.match(text, /^Labels: handwritten: \["lock A", "lock B"\]\. Keep them short\.$/m);
  assert.match(text, /^Rights note: Credit Jane Artist\. No logos\.$/m);
  assert.deepEqual(
    unfilled.map((entry) => `${entry.section}: ${entry.field.slice(0, 24)}`),
    ["Action: state", "Composition: structure type", "Composition: Exact positions and flow", "Reference: Reference sentence: Matc"],
  );
  assert.deepEqual(unfilled.map((entry) => entry.optional), [false, false, false, true]);
  assert.ok(matchesTemplate(TEMPLATE, text).ok);
});

test("fillTemplate leaves unfilled slots bracketed and never doubles punctuation", () => {
  const bare = fillTemplate(TEMPLATE, {});
  assert.ok(bare.text.includes("Scene: [core idea in one sentence]."));
  assert.deepEqual(bare.unfilled.map((entry) => entry.slot).filter(Boolean), ["action", "scene", "labels", "rightsNote"]);
  for (const scene of ["Ends with a period.", "Ends with a question?", "Ends with excitement!", "Ends with nothing"]) {
    const text = fillTemplate(TEMPLATE, { scene }).text;
    assert.doesNotMatch(text, /[.!?]\.|\.\./, scene);
  }
  assert.match(fillTemplate(TEMPLATE, { action: "ends here." }).text, /action: ends here, caught/);
  // Labels given as text are used verbatim, which is how the gallery plants its placeholders.
  assert.match(fillTemplate(TEMPLATE, { labels: "@@labels@@" }).text, /handwritten: @@labels@@\. Keep/);
});

test("the aspect ratio replaces every spelling a template uses and drops 'horizontal' when it no longer fits", () => {
  const first = (template, aspect) => fillTemplate(template, { aspect }).text.split("\n")[0];
  assert.equal(first("Generate one standalone [16:9] horizontal article illustration.", "16:9"), "Generate one standalone 16:9 horizontal article illustration.");
  assert.equal(first("Generate one standalone [16:9 horizontal] article illustration.", "21:9"), "Generate one standalone 21:9 horizontal article illustration.");
  assert.equal(first("Generate one standalone [16:9] illustration that explains a single idea.", "4:3"), "Generate one standalone 4:3 illustration that explains a single idea.");
  assert.equal(first("Generate one standalone 16:9 horizontal article illustration that explains one idea.", "1:1"), "Generate one standalone 1:1 article illustration that explains one idea.");
  assert.equal(first("Generate one standalone [16:9] horizontal article illustration.", "9:16"), "Generate one standalone 9:16 article illustration.");
  assert.equal(first("Generate one standalone [16:9] horizontal article illustration.", "3:2"), "Generate one standalone 3:2 horizontal article illustration.");
  // Only the opening paragraph names the canvas.
  assert.equal(fillTemplate("Opening [16:9].\n\nLater: the 16:9 crop stays.", { aspect: "1:1" }).text, "Opening 1:1.\n\nLater: the 16:9 crop stays.");
});

test("normalizeAspect and defaultAspect", () => {
  assert.equal(normalizeAspect("16:9"), "16:9");
  assert.equal(normalizeAspect(" 4:3 "), "4:3");
  assert.equal(normalizeAspect("09:16"), "9:16");
  for (const bad of ["16x9", "0:5", "5:0", "100:9", "016:9", "16:", "", "wide"]) {
    assert.throws(() => normalizeAspect(bad), PromptAssemblyError, bad);
  }
  assert.equal(defaultAspect({ styleSheet: { canvas: "4:3 on a plain page" } }), "4:3");
  assert.equal(defaultAspect({ styleSheet: { canvas: "Landscape, generous whitespace" } }), "16:9");
});

test("formatLabels quotes labels and rejects what would break the template", () => {
  assert.equal(formatLabels(["lock A", "waiting"]), '["lock A", "waiting"]');
  assert.equal(formatLabels(["  spaced   out  "]), '["spaced out"]');
  assert.throws(() => formatLabels([]), PromptAssemblyError);
  assert.throws(() => formatLabels(Array.from({ length: MAX_LABELS + 1 }, (_, index) => `label ${index}`)), /two to six labels/);
  assert.throws(() => formatLabels(['say "hi"']), /quotes or brackets/);
  assert.throws(() => formatLabels(["[field]"]), /quotes or brackets/);
  assert.throws(() => formatLabels(["x".repeat(41)]), /a label is 41 characters; the limit is 40/);
  assert.doesNotThrow(() => formatLabels(["x".repeat(40)]));
  assert.throws(() => formatLabels(["   "]), /must not be empty/);
});

test("what a person typed wrong is a PromptInputError; a broken pack is only a PromptAssemblyError", (t) => {
  const fixtureRepo = new Repository(createFixture(t).root);
  const demo = loadRegistry(fixtureRepo).registry.byId.get("demo");
  const mistakes = [
    () => normalizeAspect("wide"),
    () => formatLabels([]),
    () => formatLabels(['say "hi"']),
    () => formatLabels(Array.from({ length: MAX_LABELS + 1 }, () => "x")),
    () => assemblePrompt(fixtureRepo, demo, { concept: " " }),
  ];
  for (const attempt of mistakes) assert.throws(attempt, (error) => error instanceof PromptInputError && error instanceof PromptAssemblyError);
  const packProblems = [() => requireSlots("Draw.", ["scene"], "pack"), () => parsePromptPack("# nothing")];
  for (const attempt of packProblems) {
    assert.throws(attempt, (error) => error instanceof PromptAssemblyError && !(error instanceof PromptInputError));
  }
});

test("matchesTemplate accepts faithful instances and names what was changed", () => {
  const filled = fillTemplate(TEMPLATE, { aspect: "16:9", scene: "S", action: "A", labels: ["a"], rightsNote: NOTE }).text;
  // The planner fills the remaining fields and may delete the optional sentence.
  const finished = filled
    .replace("[state]", "bracing")
    .replace("[structure type]", "Concept metaphor")
    .replace("[Exact positions and flow.]", "Left to right.")
    .replace(/ ?\[Reference sentence:[^\]]*\]/, "");
  assert.deepEqual(matchesTemplate(TEMPLATE, finished), { ok: true, problems: [] });

  const edited = finished.replace("sparse sketch", "polished render");
  const styleProblem = matchesTemplate(TEMPLATE, edited);
  assert.equal(styleProblem.ok, false);
  assert.match(styleProblem.problems.join("\n"), /paragraph 2 \(Style\) differs from the template/);

  const missing = matchesTemplate(TEMPLATE, finished.split("\n\n").slice(0, -1).join("\n\n"));
  assert.match(missing.problems.join("\n"), /expected 8 paragraphs, found 7/);

  const empty = matchesTemplate(TEMPLATE, finished.replace("Scene: S.", "Scene: ."));
  assert.match(empty.problems.join("\n"), /paragraph 4 \(Scene\)/);

  const tail = matchesTemplate(TEMPLATE, finished.replace("canvas.", "canvas, always."));
  assert.match(tail.problems.join("\n"), /paragraph 5 \(Composition\) does not end with/);

  const reordered = matchesTemplate(TEMPLATE, finished.replace("Action: The actor is", "Move: The actor is"));
  assert.match(reordered.problems.join("\n"), /paragraph 3 \(Action\) does not start with/);
});

test("buildNegativePrompt prefers the pack's list, then the avoid list plus uncovered shared items", () => {
  const archetype = { styleSheet: { avoid: ["logos and badges", "gradients and shadows."] } };
  assert.equal(buildNegativePrompt(archetype, "pack list"), "pack list");
  const derived = buildNegativePrompt(archetype).split(", ");
  assert.deepEqual(derived.slice(0, 2), ["logos and badges", "gradients and shadows"]);
  assert.ok(derived.includes("paper texture"));
  assert.ok(!derived.includes("logos"), "already covered by the avoid list");
  assert.ok(!derived.includes("gradients"), "already covered by the avoid list");
  assert.ok(!derived.includes("drop shadows"), "already covered by the avoid list");
  assert.equal(buildNegativePrompt(archetype, ""), buildNegativePrompt(archetype));
});

test("withRightsNote adds the note to a third-party prompt that lacks it, once", () => {
  const thirdParty = { thirdParty: true };
  assert.equal(withRightsNote("Prompt.", thirdParty, NOTE), `Prompt.\n\nRights note: ${NOTE}`);
  assert.equal(withRightsNote("Prompt. Credit Jane Artist. No logos", thirdParty, NOTE), "Prompt. Credit Jane Artist. No logos");
  assert.equal(withRightsNote("Prompt.", { thirdParty: false }, NOTE), "Prompt.");
  assert.equal(withRightsNote("Prompt.", thirdParty, null), "Prompt.");
});

test("requireSlots fails loudly when a template cannot take what a caller wants to fill", () => {
  assert.doesNotThrow(() => requireSlots(TEMPLATE, ["scene", "action", "labels"], "prompts.md"));
  const bare = "Draw one idea.\n\nScene: [core idea in one sentence].";
  assert.doesNotThrow(() => requireSlots(bare, ["scene"], "prompts.md"));
  assert.throws(() => requireSlots(bare, ["scene", "action", "labels"], "pack/prompts.md"), (error) => {
    assert.ok(error instanceof PromptAssemblyError);
    assert.match(error.message, /^pack\/prompts\.md: the generation prompt lacks the action field before "caught at its decisive moment" and the \["label 1", "label 2", "label 3"\] field$/);
    return true;
  });
});

test("assemblePrompt works on a repository and keeps the rights note of third-party archetypes", (t) => {
  const fixture = createFixture(t);
  const repo = new Repository(fixture.root);
  const { registry } = loadRegistry(repo);
  const demo = registry.byId.get("demo");
  const result = assemblePrompt(repo, demo, { concept: "  A crab   sorts slips.  ", action: "pinching a slip", labels: ["slips", "stack"] });
  assert.equal(result.aspectRatio, "16:9");
  assert.match(result.prompt, /^Scene: A crab sorts slips\.$/m);
  assert.match(result.prompt, /^Action: The actor performs pinching a slip, caught at its decisive moment\.$/m);
  assert.match(result.prompt, /^Labels: \["slips", "stack"\]\.$/m);
  assert.match(result.prompt, /^Rights note: .*Credit: Demo Crab by Example Author\./m);
  assert.equal(result.rightsNote.includes("Demo Crab by Example Author"), true);
  assert.equal(result.outputFolder, "assets/<article-slug>-demo/");
  assert.equal(result.sourceFile, packFilePath(demo, "prompts.md"));
  assert.deepEqual(result.unfilled, []);

  const house = assemblePrompt(repo, registry.byId.get("ink"), {});
  assert.equal(house.rightsNote, null);
  assert.deepEqual(house.unfilled.map((entry) => entry.slot), ["action", "scene", "labels"]);
  assert.match(house.negativePrompt, /^logos, /);
});

test("assemblePrompt rejects input a template or a person got wrong", (t) => {
  const fixture = createFixture(t);
  const repo = new Repository(fixture.root);
  const { registry } = loadRegistry(repo);
  const demo = registry.byId.get("demo");
  assert.throws(() => assemblePrompt(repo, demo, { aspect: "wide" }), /aspect ratio must look like 16:9/);
  assert.throws(() => assemblePrompt(repo, demo, { concept: "   " }), /the concept must not be empty/);
  assert.throws(() => assemblePrompt(repo, demo, { concept: "x".repeat(401) }), /the concept is 401 characters/);
  assert.throws(() => assemblePrompt(repo, demo, { action: "bad\u0007bell" }), /control characters/);
  assert.throws(() => assemblePrompt(repo, demo, { labels: ["a", "b", "c", "d", "e", "f", "g"] }), /two to six labels/);

  fixture.write(packFilePath(demo, "prompts.md"), "# Demo Prompts\n\n## Generation prompt\n\n```text\nDraw one idea.\n```\n");
  assert.throws(() => assemblePrompt(new Repository(fixture.root), demo, { concept: "x" }), /lacks the \[core idea in one sentence\] field/);
  assert.doesNotThrow(() => assemblePrompt(new Repository(fixture.root), demo, {}), "nothing to fill, nothing to miss");

  fixture.remove(packFilePath(demo, "prompts.md"));
  assert.throws(() => assemblePrompt(new Repository(fixture.root), demo, {}), /prompts\.md is missing/);
});

test("every shipped archetype assembles a prompt that is a faithful instance of its own template", () => {
  const repo = new Repository(REPO_ROOT);
  const { registry } = loadRegistry(repo);
  const options = { concept: "Two threads each hold a lock.", action: "clamping a key", labels: ["lock A", "lock B"] };
  for (const archetype of registry.archetypes) {
    const pack = parsePromptPack(repo.readText(packFilePath(archetype, "prompts.md")));
    const result = assemblePrompt(repo, archetype, options);
    assert.ok(matchesTemplate(pack.template, result.prompt).ok, `${archetype.id}: ${matchesTemplate(pack.template, result.prompt).problems.join("; ")}`);
    assert.match(result.prompt.split("\n")[0], /^Generate one standalone 16:9 /, archetype.id);
    assert.match(result.prompt, /Scene: Two threads each hold a lock\./, archetype.id);
    assert.match(result.prompt, /clamping a key, caught at its decisive moment/, archetype.id);
    assert.ok(result.prompt.includes('["lock A", "lock B"]'), archetype.id);
    assert.doesNotMatch(result.prompt, /(?<!\.)\.\.(?!\.)|\.,|,\./, `${archetype.id} has doubled punctuation`);
    assert.deepEqual(result.unfilled.filter((entry) => entry.slot !== null), [], archetype.id);
    assert.ok(result.negativePrompt.length > 40, archetype.id);
    if (archetype.thirdParty) {
      assert.ok(result.rightsNote, `${archetype.id} has a rights note`);
      assert.ok(result.prompt.includes(result.rightsNote.replace(/\.+$/, "")), `${archetype.id} carries its rights note`);
    }
  }
});

test("the shipped templates keep the fields the CLI and the gallery fill, and Xiaohei keeps its own negative prompt", () => {
  const repo = new Repository(REPO_ROOT);
  const { registry } = loadRegistry(repo);
  for (const archetype of registry.archetypes) {
    const { template } = parsePromptPack(repo.readText(packFilePath(archetype, "prompts.md")));
    assert.doesNotThrow(() => requireSlots(template, ["scene", "action", "labels"], archetype.id), archetype.id);
  }
  const xiaohei = registry.byId.get("xiaohei");
  const pack = parsePromptPack(repo.readText(packFilePath(xiaohei, "prompts.md")));
  assert.ok(pack.negativePrompt?.startsWith("cute mascot, kawaii"));
  assert.equal(assemblePrompt(repo, xiaohei, {}).negativePrompt, pack.negativePrompt);
});
