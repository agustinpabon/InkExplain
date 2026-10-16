// docs/walkthroughs.md quotes complete prompts. They are copies of text that lives in each
// archetype's prompts.md, so this test fails when a pack changes and a walkthrough prompt does not.

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { extractCodeBlocks } from "../scripts/lib/markdown.mjs";
import { buildNegativePrompt, defaultAspect, matchesTemplate, parsePromptPack } from "../scripts/lib/prompt-assembly.mjs";
import { findAliasMentions, loadRegistry, packFilePath, resolveArchetypeRequest } from "../scripts/lib/registry.mjs";
import { Repository } from "../scripts/lib/repository.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const FILE = "docs/walkthroughs.md";
const EXPECTED = [
  { id: "ferris", language: "rust" },
  { id: "gopher", language: "go" },
  { id: "littlebox", language: "python" },
  { id: "stickman", language: "python" },
];

const repo = new Repository(REPO_ROOT);
const { registry } = loadRegistry(repo);
const walkthroughs = repo
  .readText(FILE)
  .split(/^## /m)
  .slice(1)
  .map((body) => {
    const heading = body.split("\n")[0];
    const blocks = extractCodeBlocks(body);
    return {
      heading,
      archetypeName: /drawn by (?:the )?(.+)$/.exec(heading)?.[1],
      languageBlocks: blocks.filter((block) => block.info !== "text"),
      ask: blocks.find((block) => block.info === "text" && block.content.includes("$inkexplain")),
      prompt: blocks.find((block) => block.info === "text" && block.content.startsWith("Generate one standalone")),
      parameters: blocks.find((block) => block.info === "text" && block.content.startsWith("Aspect ratio:")),
    };
  });

test("the walkthroughs cover Ferris, the Go Gopher, Littlebox, and Stickman, each with its own code", () => {
  assert.equal(walkthroughs.length, EXPECTED.length);
  assert.deepEqual(
    walkthroughs.map((walkthrough) => resolveArchetypeRequest(registry, [walkthrough.archetypeName]).archetypes[0]?.id),
    EXPECTED.map((entry) => entry.id),
  );
  assert.deepEqual(
    walkthroughs.map((walkthrough) => walkthrough.languageBlocks.map((block) => block.info)),
    EXPECTED.map((entry) => [entry.language]),
  );
});

test("the README points at the walkthroughs instead of carrying them", () => {
  const readme = repo.readText("README.md");
  assert.match(readme, /\[docs\/walkthroughs\.md\]\(docs\/walkthroughs\.md\)/);
  assert.doesNotMatch(readme, /Generate one standalone/, "no complete prompt is quoted in the README");
  for (const name of ["Ferris", "Go Gopher", "Littlebox", "Stickman"]) assert.ok(readme.includes(name), `the pointer names ${name}`);
});

for (const [index, { id }] of EXPECTED.entries()) {
  test(`walkthrough ${index + 1} (${id}): the prompt is a faithful instance of the archetype's template`, () => {
    const walkthrough = walkthroughs[index];
    const archetype = registry.byId.get(id);
    const pack = parsePromptPack(repo.readText(packFilePath(archetype, "prompts.md")));
    assert.ok(walkthrough.prompt, `${id} walkthrough has a complete prompt`);

    const match = matchesTemplate(pack.template, walkthrough.prompt.content);
    assert.deepEqual(match.problems, [], `${id}: change the walkthrough prompt to follow ${packFilePath(archetype, "prompts.md")}`);
    // Booleans keep a failure readable: a prompt is several kilobytes of text.
    assert.equal(/(?<!\.)\.\.(?!\.)|\.,|,\./.test(walkthrough.prompt.content), false, `${id} prompt has doubled punctuation`);
    // The labels list is written in brackets by design; any other bracket is a field nobody filled.
    assert.equal(/\[(?!")[^\]\n]*\]/.test(walkthrough.prompt.content), false, `${id} prompt still has an unfilled bracketed field`);
    if (pack.rightsNote !== null) {
      assert.equal(walkthrough.prompt.content.includes(pack.rightsNote.replace(/\.+$/, "")), true, `${id} prompt carries the rights note`);
    }
  });

  test(`walkthrough ${index + 1} (${id}): aspect ratio and negative prompt match what InkExplain derives`, () => {
    const walkthrough = walkthroughs[index];
    const archetype = registry.byId.get(id);
    const pack = parsePromptPack(repo.readText(packFilePath(archetype, "prompts.md")));
    const aspect = defaultAspect(archetype);
    assert.equal(
      walkthrough.parameters?.content,
      `Aspect ratio: ${aspect}\nNegative prompt: ${buildNegativePrompt(archetype, pack.negativePrompt)}`,
    );
    assert.ok(walkthrough.prompt.content.startsWith(`Generate one standalone ${aspect} `));
  });

  test(`walkthrough ${index + 1} (${id}): the request selects that archetype and no other`, () => {
    const mentioned = new Set(findAliasMentions(registry, walkthroughs[index].ask.content.replaceAll("$inkexplain", "")).map((mention) => mention.archetypeId));
    assert.deepEqual([...mentioned], [id]);
  });
}

test("the Stickman walkthrough keeps the whole identity contract and a single accent", () => {
  const prompt = walkthroughs[3].prompt.content;
  const { template } = parsePromptPack(repo.readText(packFilePath(registry.byId.get("stickman"), "prompts.md")));
  const characterOf = (text) => text.split("\n\n").find((paragraph) => paragraph.startsWith("Character: "));
  assert.equal(characterOf(prompt), characterOf(template), "the Character block is quoted unchanged");
  assert.match(prompt, /one vermilion accent #E4572E only on the middle card of the standing stack/);
  assert.match(prompt, /Pose: Carry\. Expression: focused\./);
});
