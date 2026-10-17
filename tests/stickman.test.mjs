// Stickman is InkExplain's own recurring stick figure. These tests pin what makes it a character
// rather than a pictogram (its identity contract), what makes it a distinct archetype rather than a
// second Sketch, and the ways a person or an agent can reach it.

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { main } from "../scripts/explain.mjs";
import { buildGalleryData } from "../scripts/lib/gallery-data.mjs";
import { readPngInfo, svgProblems } from "../scripts/lib/images.mjs";
import { sectionBody } from "../scripts/lib/markdown.mjs";
import { assemblePrompt, matchesTemplate, parsePromptPack, scanTemplate } from "../scripts/lib/prompt-assembly.mjs";
import { findAliasMentions, loadRegistry, packFilePath, resolveArchetypeRequest } from "../scripts/lib/registry.mjs";
import { Repository } from "../scripts/lib/repository.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const repo = new Repository(REPO_ROOT);
const { registry } = loadRegistry(repo);
const stickman = registry.byId.get("stickman");
const sketch = registry.byId.get("ink");
const pack = (file) => repo.readText(packFilePath(stickman, file));
const lower = (text) => text.toLowerCase();

function cli(args) {
  let stdout = "";
  let stderr = "";
  const code = main(args, { stdout: { write: (chunk) => (stdout += chunk) }, stderr: { write: (chunk) => (stderr += chunk) } });
  return { code, stdout, stderr };
}

test("Stickman is an original house style that ships experimental until real renders are reviewed", () => {
  assert.equal(stickman.category, "house-style");
  assert.equal(stickman.thirdParty, false, "an original character needs no rights note");
  assert.equal(stickman.status, "experimental", "no render has been reviewed, so the registry must not claim otherwise");
  assert.equal(stickman.sampleGates.status, "pending");
  assert.deepEqual(stickman.sampleGates.directories, []);
  assert.deepEqual(stickman.legalNotice.attributionTerms, []);
  assert.equal(stickman.legalNotice.credit, "Original to InkExplain");
  assert.equal(stickman.legalNotice.license, "MIT");
  assert.equal(stickman.outputSuffix, "stickman");
  assert.notEqual(registry.defaultArchetype, stickman, "InkExplain Sketch stays the default");
  assert.match(pack("rights.md"), /Original to InkExplain/);
  assert.match(pack("rights.md"), /not an image-model render/);
});

test("every way of asking for a stick figure selects Stickman, in several languages", () => {
  const names = [
    "Stickman", "stickman", "STICK MAN", "stick-man", "stick figure", "Stick-Figure", "stick person", "stickperson", "Inkman",
    "monigote", "muñeco de palitos", "figura de palitos", "bonhomme allumette", "Strichmännchen", "boneco palito", "火柴人", "棒人間",
  ];
  for (const name of names) {
    const result = resolveArchetypeRequest(registry, [name]);
    assert.deepEqual([result.mode, result.archetypes.map((archetype) => archetype.id)], ["single", ["stickman"]], name);
  }
  // Natural requests: the alias search finds the name inside a sentence and nothing else.
  for (const request of [
    "Explain this algorithm using a stickman. Generate three illustrations.",
    "Draw it as a stick figure.",
    "Hazlo con un monigote.",
    "Use a stick person for every image.",
  ]) {
    const mentioned = new Set(findAliasMentions(registry, request).map((mention) => mention.archetypeId));
    assert.deepEqual([...mentioned], ["stickman"], request);
  }
});

test("generic words do not pick Stickman, and Sketch's own names do not either", () => {
  for (const term of ["figure", "person", "human", "man", "people", "doodle"]) {
    const result = resolveArchetypeRequest(registry, [term]);
    assert.equal(result.mode, "unresolved", term);
    assert.deepEqual(result.excluded.map((entry) => entry.name), [term]);
    assert.ok(result.excluded[0].suggestions.includes("stickman"), `${term} suggests Stickman`);
  }
  for (const name of ["InkExplain Sketch", "ink sketch", "no character", "house style"]) {
    assert.deepEqual(resolveArchetypeRequest(registry, [name]).archetypes.map((archetype) => archetype.id), ["ink"], name);
  }
  // Naming nothing still gives the default; the topic never selects a character.
  assert.equal(resolveArchetypeRequest(registry, []).archetypes[0].id, "ink");
});

test("Stickman joins a mixed request by name, and 'all archetypes' leaves an experimental pack out", () => {
  const mixed = resolveArchetypeRequest(registry, ["Stickman", "Ferris"]);
  assert.equal(mixed.mode, "mixed");
  assert.deepEqual(mixed.archetypes.map((archetype) => archetype.id), ["stickman", "ferris"]);
  const all = resolveArchetypeRequest(registry, ["all archetypes"]).archetypes.map((archetype) => archetype.id);
  assert.ok(!all.includes("stickman"));
  assert.ok(all.includes("ink"));
});

test("the identity contract is stated the same way in the identity sheet and in the prompt", () => {
  const identity = pack("identity.md");
  const { template } = parsePromptPack(pack("prompts.md"));
  const character = template.split("\n\n").find((paragraph) => paragraph.startsWith("Character: "));
  assert.ok(character, "the template has a Character block");

  // Every registry marker is stated in both places.
  for (const marker of stickman.contract.identityMarkers) {
    assert.ok(lower(identity).includes(marker), `identity.md names "${marker}"`);
    assert.ok(lower(character).includes(marker), `the Character block names "${marker}"`);
  }
  // The proportions add up: head 1 + spine 1.6 + legs 2.4 = 5 heads, and both files say so.
  assert.match(identity, /standing figure is 5H tall/);
  assert.match(identity, /1\.6H long/);
  assert.match(identity, /1\.0H \+ 1\.0H/);
  assert.match(identity, /1\.2H \+ 1\.2H/);
  assert.match(character, /1\.6 heads long/);
  assert.match(character, /each arm is two heads long/);
  assert.match(character, /each leg is 2\.4 heads long/);
  assert.match(character, /standing height is five heads/);
  assert.equal(1 + 1.6 + 2.4, 5);
  // The face is dots and brows only, in both places, and the hands are deliberately absent.
  for (const text of [identity, character]) {
    assert.match(text, /no mouth, nose, ears, or hair|No mouth, nose, ears, or hair/);
    assert.match(lower(text), /hands: none|\*\*hands\*\*: none/);
    assert.match(lower(text), /never a stiff t-pose|never a stiff t-pose/);
  }
});

test("the prompt states the figure in positive terms, and keeps its bans for the Constraints and the negative prompt", () => {
  const { template, negativePrompt } = parsePromptPack(pack("prompts.md"));
  const paragraphs = Object.fromEntries(template.split("\n\n").map((paragraph) => [paragraph.split(":")[0], paragraph]));
  for (const cue of ["open round head", "dot eyes", "curved spine line", "two-segment limbs", "foot ticks", "asymmetrical", "weight on one leg", "five heads"]) {
    assert.ok(lower(paragraphs.Character).includes(cue), `the Character block says "${cue}"`);
  }
  assert.match(paragraphs.Style, /pure white background #FFFFFF/);
  assert.match(paragraphs.Style, /brush-pen marker line, medium-bold/);
  assert.match(paragraphs.Constraints, /No pictogram, restroom-sign, emoji, mascot, or children's activity-book look/);
  assert.match(paragraphs.Constraints, /No hands, fingers, shoes, clothes, hat, hair, mouth, ears, or accessories/);
  for (const ban of ["pictogram", "restroom sign", "emoji", "T-pose", "hands", "mouth", "gradient", "drop shadow"]) {
    assert.ok(negativePrompt.includes(ban), `the negative prompt lists ${ban}`);
  }
  assert.ok(negativePrompt.startsWith("pictogram"), "the pack's own negative prompt is used, not a derived one");
});

test("the palette is black ink on pure white with at most one vermilion accent, and nothing else", () => {
  assert.deepEqual(stickman.styleSheet.palette, ["black ink", "pure white", "vermilion accent"]);
  const style = pack("style.md");
  assert.match(style, /#111111/);
  assert.match(style, /#FFFFFF/);
  assert.match(style, /#E4572E/);
  assert.match(style, /at most one accent/);
  assert.match(style, /No second accent, no color fill, and no colored figure/);
  const { template } = parsePromptPack(pack("prompts.md"));
  assert.match(template, /one vermilion accent #E4572E only on \[the one object, mark, or label that carries the idea, or "none"\]/);
  assert.match(template, /No other color\./);
  // Sketch's accents belong to Sketch: no blue, no highlighter, no signal red leaks across.
  for (const text of [pack("style.md"), pack("prompts.md"), pack("identity.md")]) {
    assert.doesNotMatch(lower(text), /explainer blue|highlighter|signal red/);
  }
});

test("Stickman is clearly not a second Sketch: different actor rule, line, palette, and face", () => {
  assert.notEqual(stickman.styleSheet.linework, sketch.styleSheet.linework);
  assert.deepEqual(
    stickman.styleSheet.palette.filter((entry) => sketch.styleSheet.palette.includes(entry)),
    ["black ink"],
    "both draw in black ink, and share no accent",
  );
  assert.match(stickman.styleSheet.linework, /medium-bold/);
  assert.match(sketch.styleSheet.linework, /Medium-thin/);
  // Sketch's actor is optional and anonymous; Stickman's is one recurring character with a face.
  assert.match(sketch.motionDna.actor, /hands entering the frame, or the working object/);
  assert.match(stickman.motionDna.actor, /one recurring stick figure/);
  assert.match(repo.readText(packFilePath(sketch, "identity.md")), /never a character|not a personality|pen, not a personality/i);
  assert.match(pack("identity.md"), /It is a character, not a pictogram/);
  // Each pack stays in its own lane: neither names the other's markers.
  assert.doesNotMatch(lower(repo.readText(packFilePath(sketch, "prompts.md"))), /stickman|vermilion/);
  assert.doesNotMatch(lower(pack("prompts.md")), /ink figure|highlighter/);
  // The user-facing comparison exists.
  assert.match(repo.readText("docs/visual-system.md"), /\| \| InkExplain Sketch \| Stickman \|/);
});

test("the pose vocabulary covers the registry's signature actions and the expressions are brows only", () => {
  const motion = pack("motion-and-acting.md");
  const poses = sectionBody(motion, "Pose vocabulary");
  const rows = poses.split("\n").filter((line) => /^\| [A-Z]/.test(line) && !line.startsWith("| Pose"));
  assert.ok(rows.length >= 12, `at least twelve named poses, found ${rows.length}`);
  for (const action of stickman.motionDna.signatureActions) {
    assert.ok(lower(poses).includes(action.toLowerCase()), `the pose table covers "${action}"`);
  }
  const expressions = sectionBody(motion, "Expressions");
  for (const name of ["Calm", "Focused", "Puzzled", "Startled", "Pleased"]) assert.match(expressions, new RegExp(`\\| ${name} \\|`));
  assert.match(expressions, /The dot eyes never do, and the face never gets a mouth/);
  assert.match(sectionBody(motion, "Originality"), /never share both the pose and the main object/);
});

test("the planning fields keep a series consistent: pose, expression, accent, and the unchanged Character block", () => {
  const planning = sectionBody(pack("prompts.md"), "Planning fields");
  for (const field of ["**Pose**", "**Expression**", "**Accent**", "**Series contract**"]) assert.ok(planning.includes(field), field);
  const prompts = ["A bottleneck sets the pipeline's speed.", "Regret grows when a decision waits.", "A cache is a promise you keep renewing."].map(
    (concept) => assemblePrompt(repo, stickman, { concept, action: "leaning back on a rope" }).prompt,
  );
  const characterOf = (prompt) => prompt.split("\n\n").find((paragraph) => paragraph.startsWith("Character: "));
  assert.equal(new Set(prompts.map(characterOf)).size, 1, "the identity contract is identical in every prompt of a set");
  assert.equal(new Set(prompts.map((prompt) => prompt.split("\n\n")[1])).size, 1, "so is the style block");
});

test("Stickman assembles through the library and the command line, and is flagged experimental", () => {
  const template = parsePromptPack(pack("prompts.md")).template;
  const fields = scanTemplate(template);
  assert.deepEqual(fields.filter((field) => field.slot !== null).map((field) => field.slot), ["aspect", "action", "scene", "labels"], "the shared fields, and no page-color field");
  const result = assemblePrompt(repo, stickman, { concept: "Two threads wait on each other.", action: "holding back a funnel with both arms", labels: ["lock A", "lock B"] });
  assert.deepEqual(matchesTemplate(template, result.prompt.replace("[structure type]", "Concept metaphor")).problems.filter((problem) => !/Composition|Supporting|Color/.test(problem)), []);
  assert.equal(result.background, null, "the page is fixed pure white");
  assert.equal(result.rightsNote, null);
  assert.equal(result.outputFolder, "assets/<article-slug>-stickman/");

  const run = cli(["--archetype", "stick figure", "--concept", "A queue waits behind one slow worker."]);
  assert.equal(run.code, 0, run.stderr);
  assert.match(run.stdout, /^Archetype: Stickman \(stickman\), house-style, experimental$/m);
  assert.match(run.stdout, /^Experimental archetype: its pack has not been tried with real renders yet\.$/m);
  assert.doesNotMatch(run.stdout, /Rights note|^Credit:|^Background:/m);
  assert.match(run.stdout, /^Output folder: assets\/<article-slug>-stickman\/$/m);
  assert.match(run.stdout, /^NEGATIVE PROMPT\n---------------\npictogram, restroom sign/m);
  assert.match(run.stdout, /Pose: \[pose from the pose vocabulary, different from the previous image\]/);
  assert.match(run.stdout, /\[the one object, mark, or label that carries the idea, or "none"\]/);

  const refused = cli(["--archetype", "stickman", "--concept", "x", "--background", "lavender"]);
  assert.equal(refused.code, 2);
  assert.match(refused.stderr, /Stickman draws on a fixed background and takes no background option/);
});

test("the bundled pose sheet is a real PNG, the SVG source is safe and wordless, and both are referenced", () => {
  const png = repo.readBuffer(packFilePath(stickman, "pose-sheet.png"));
  assert.deepEqual(readPngInfo(png), { width: 1200, height: 900 });
  assert.ok(png.length < 300 * 1024, "the reference stays light enough to ship in the skill");
  for (const file of ["identity.md", "prompts.md"]) assert.ok(pack(file).includes("pose-sheet.png"), `${file} references the sheet`);
  assert.match(pack("identity.md"), /attach it as an identity and proportion reference only/);
  assert.match(pack("identity.md"), /Never copy its poses, props, or layout/);

  const svg = repo.readText("assets/brand/stickman-pose-sheet.svg");
  assert.deepEqual(svgProblems(svg), []);
  assert.doesNotMatch(svg, /<text\b|<image\b|<style\b|font-family/i, "the sheet draws no text and loads nothing");
  assert.match(svg, /<title id="title">Stickman pose and expression reference sheet<\/title>/);
  for (const pose of ["carry", "pull", "push", "point", "weigh", "bridge", "stack", "shrug"]) assert.ok(svg.includes(pose), `the sheet describes the ${pose} pose`);
  // Only the ink and the one accent appear, as the style sheet promises.
  const colors = new Set([...svg.matchAll(/#[0-9A-Fa-f]{6}\b/g)].map((match) => match[0].toUpperCase()));
  assert.deepEqual([...colors].sort(), ["#111111", "#E4572E", "#FFFFFF"]);
});

test("the gallery lists Stickman as a pending marker-style tile with no invented samples", () => {
  const data = buildGalleryData(repo, registry);
  const entry = data.archetypes.find((archetype) => archetype.id === "stickman");
  assert.equal(entry.technique, "Marker");
  assert.equal(entry.status, "experimental");
  assert.deepEqual(entry.samples.images, []);
  assert.equal(entry.samples.status, "pending");
  assert.equal(entry.legal.thirdParty, false);
  assert.deepEqual(entry.prompt.backgrounds, []);
  assert.ok(entry.prompt.template.includes("@@concept@@") && entry.prompt.template.includes("@@labels@@"));
  assert.deepEqual(
    data.archetypes.slice(0, 4).map((archetype) => archetype.id),
    ["ink", "littlebox", "stickman", "xiaohei"],
    "the showcase order: the default, Littlebox, Stickman, then Xiaohei",
  );
});
