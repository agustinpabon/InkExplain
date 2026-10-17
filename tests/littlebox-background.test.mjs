// Littlebox draws on a pure white page unless the user names another. This file checks that
// promise at every entry point a person or an agent can reach, against the real repository:
// the registry, the pack the agent reads, the template the CLI fills, the CLI itself, the
// generated routing document, the gallery data, and every README table.

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { main } from "../scripts/explain.mjs";
import { buildGalleryData } from "../scripts/lib/gallery-data.mjs";
import { extractCodeBlocks, sectionBody } from "../scripts/lib/markdown.mjs";
import { assemblePrompt, matchesTemplate, parsePromptPack, scanTemplate } from "../scripts/lib/prompt-assembly.mjs";
import { loadLocales } from "../scripts/lib/docs-render.mjs";
import { loadRegistry, packFilePath } from "../scripts/lib/registry.mjs";
import { Repository } from "../scripts/lib/repository.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const repo = new Repository(REPO_ROOT);
const { registry } = loadRegistry(repo);
const littlebox = registry.byId.get("littlebox");
const pack = (file) => repo.readText(packFilePath(littlebox, file));
const BLUE_OR_LAVENDER = /#E3F2FD|#E6E6FA|lavender|sky[- ]blue|pale blue/i;

function cli(args) {
  let stdout = "";
  let stderr = "";
  const code = main(args, { stdout: { write: (chunk) => (stdout += chunk) }, stderr: { write: (chunk) => (stderr += chunk) } });
  return { code, stdout, stderr };
}

test("the registry makes pure white the default page, and the presets are only offered", () => {
  const policy = littlebox.styleSheet.background;
  assert.deepEqual([policy.default.name, policy.default.hex], ["pure white", "#FFFFFF"]);
  assert.deepEqual(policy.presets.map((preset) => `${preset.name} ${preset.hex}`), ["warm off-white #FFFCF5", "pale sky blue #E3F2FD", "pale lavender #E6E6FA"]);
  assert.doesNotMatch(`${littlebox.summary} ${littlebox.styleSheet.canvas}`, BLUE_OR_LAVENDER, "neither the summary nor the canvas rule describes the look as blue or lavender");
  assert.ok(littlebox.styleSheet.palette.includes("pure white"));
  assert.ok(littlebox.styleSheet.avoid.some((entry) => /tinted, alternating, or mood-picked backgrounds/.test(entry)));
});

test("the pack tells an agent: white by default, one page per set, another only on request, never by mood", () => {
  const style = pack("style.md");
  const canvas = sectionBody(style, "Canvas");
  assert.match(canvas, /pure white `#FFFFFF`/);
  assert.match(canvas, /This is the default/);
  for (const hex of ["#FFFCF5", "#E3F2FD", "#E6E6FA"]) assert.ok(canvas.includes(hex), `the presets include ${hex}`);
  assert.match(canvas, /Every image in a set uses the same background/);
  assert.match(canvas, /Never alternate backgrounds, rotate them for rhythm, or pick one from the idea's mood or topic/);
  assert.match(canvas, /no blue for technical ideas, no lavender for emotional ones/);
  assert.match(canvas, /only when the user explicitly asks for variety/);
  assert.match(canvas, /Use another background only when the user asks for it/);

  const prompts = pack("prompts.md");
  assert.match(sectionBody(prompts, "Planning fields"), /\*\*Background\*\*: pure white `#FFFFFF`, or the one background the user named; the same for every image in the set/);
  assert.match(sectionBody(prompts, "Review and repair"), /One clean, flat background: `#FFFFFF` unless the user named another, and identical in every image of the set/);
  assert.match(sectionBody(prompts, "Edit prompts"), /### Restore the background/);
});

test("none of the old policy survives in any pack file: no assigned, balanced, or mood-picked backgrounds", () => {
  const retired = [
    /assigned for the whole set/i,
    /assign backgrounds during planning/i,
    /kept balanced/i,
    /rebalance/i,
    /split equally/i,
    /sky blue and lavender balanced/i,
    /pale sky blue or lavender/i,
    /for technical, structural, systems/i,
    /for reflective, creative, emotional/i,
    /long runs of one color/i,
    /each image's background, so the set's balance/i,
  ];
  for (const file of ["rights.md", "identity.md", "style.md", "motion-and-acting.md", "prompts.md"]) {
    const text = pack(file);
    for (const pattern of retired) assert.doesNotMatch(text, pattern, `${file} still carries the retired rule ${pattern}`);
  }
  // The only blue or lavender left in the style sheet is the opt-in preset offer and the rule that forbids picking by mood.
  const mentions = pack("style.md").split("\n").filter((line) => BLUE_OR_LAVENDER.test(line));
  assert.equal(mentions.length, 2, `style.md names blue and lavender twice, both times as an offer or a prohibition:\n${mentions.join("\n")}`);
  assert.match(mentions[0], /Presets: warm off-white/);
  assert.match(mentions[1], /Never alternate backgrounds,.* no lavender for emotional ones/);
});

test("the generation template holds the default in exactly one field, and keeps it out of everything else", () => {
  const { template } = parsePromptPack(pack("prompts.md"));
  const fields = scanTemplate(template).filter((field) => field.slot === "background");
  assert.deepEqual(fields.map((field) => field.field), ["pure white background #FFFFFF"]);
  assert.doesNotMatch(template, BLUE_OR_LAVENDER);
  // The prompt blocks that follow are the template's siblings: the review rules never ask for blue or lavender either.
  for (const block of extractCodeBlocks(sectionBody(pack("prompts.md"), "Edit prompts"))) {
    assert.doesNotMatch(block.content, /#E3F2FD|#E6E6FA/, "an edit prompt never forces blue or lavender");
  }
});

test("the CLI draws on white by default, honors an override, and gives a whole set the same page", () => {
  const concepts = [
    "A bottleneck sets the speed of the whole pipeline.",
    "A tender memory of a first job.",
    "A technical index speeds up a query.",
    "A quiet reflection after a failed launch.",
    "A system of three services.",
    "An uncertain forecast.",
    "A narrative arc from doubt to proof.",
    "A clear method for reviewing code.",
  ];
  const pageOf = (stdout) => /^Background: (.*)$/m.exec(stdout)[1];
  const standard = concepts.map((concept) => cli(["--archetype", "littlebox", "--concept", concept]));
  for (const result of standard) {
    assert.equal(result.code, 0, result.stderr);
    assert.doesNotMatch(result.stdout, BLUE_OR_LAVENDER);
  }
  assert.deepEqual([...new Set(standard.map((result) => pageOf(result.stdout)))], ["pure white #FFFFFF (default)"]);

  const asked = concepts.map((concept) => cli(["--archetype", "Littlebox", "--concept", concept, "--background", "lavender"]));
  assert.deepEqual([...new Set(asked.map((result) => pageOf(result.stdout)))], ["pale lavender #E6E6FA (preset)"]);
  for (const result of asked) assert.doesNotMatch(result.stdout, /#FFFFFF/);
});

test("every Littlebox prompt on any page is a faithful instance of the template", () => {
  const { template } = parsePromptPack(pack("prompts.md"));
  for (const request of [undefined, "white", "warm off-white", "pale sky blue", "lavender", "#FDF6E3"]) {
    const { prompt } = assemblePrompt(repo, littlebox, { concept: "Two threads wait on each other.", background: request });
    assert.deepEqual(matchesTemplate(template, prompt), { ok: true, problems: [] }, String(request));
  }
});

test("the generated routing document states the rule on the Littlebox card", () => {
  const routing = repo.readText("skills/inkexplain/references/routing.md");
  const card = sectionBody(routing, "Littlebox (`littlebox`)");
  assert.match(card, /- Background: pure white background #FFFFFF by default, and the same in every image of a set\./);
  assert.match(card, /Offered only when the user asks: warm off-white #FFFCF5 \(also "off-white", "cream"\); pale sky blue #E3F2FD \(also "sky blue", "light blue"\); pale lavender #E6E6FA \(also "lavender"\)\./);
  assert.match(card, /Never alternate backgrounds, rotate them for rhythm, or choose one from the idea's mood or topic\./);
  assert.match(card, /Canvas: 16:9 on one flat pure white background \(#FFFFFF\) unless the user names another/);
  // No other card claims a page choice.
  assert.equal(routing.match(/- Background: /g).length, 1);
});

test("the gallery data and every README describe Littlebox on a pure white page", () => {
  const data = buildGalleryData(repo, registry);
  const entry = data.archetypes.find((archetype) => archetype.id === "littlebox");
  assert.equal(entry.prompt.backgrounds[0].phrase, "pure white background #FFFFFF");
  assert.doesNotMatch(entry.summary, BLUE_OR_LAVENDER);

  const { locales } = loadLocales(repo);
  assert.ok(locales.length > 1, "the translations are checked too");
  for (const locale of locales) {
    const text = repo.readText(locale.file);
    assert.ok(text.includes(littlebox.tagline), `${locale.file} carries the registry tagline`);
    const row = text.split("\n").find((line) => line.includes("<b>Littlebox</b>"));
    assert.ok(row, `${locale.file} has a Littlebox row`);
    assert.doesNotMatch(row, BLUE_OR_LAVENDER, `${locale.file}: the Littlebox row does not call it blue or lavender`);
  }
});

test("the Littlebox walkthrough draws on the default page", () => {
  const walkthrough = sectionBody(repo.readText("docs/walkthroughs.md"), "3. A blocked event loop in async Python, drawn by Littlebox");
  assert.ok(walkthrough, "the walkthrough exists");
  const prompt = extractCodeBlocks(walkthrough).find((block) => block.content.startsWith("Generate one standalone"));
  assert.match(prompt.content, /on a perfectly flat pure white background #FFFFFF\./);
  assert.doesNotMatch(prompt.content, BLUE_OR_LAVENDER);
  assert.match(walkthrough, /pure white unless you ask for another/);
});
