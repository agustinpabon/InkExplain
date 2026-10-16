// The README's walkthroughs quote complete prompts. They are copies of text that lives in
// each archetype's prompts.md, so this test fails when a pack changes and a README prompt does not.

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { extractCodeBlocks, sectionBody } from "../scripts/lib/markdown.mjs";
import { buildNegativePrompt, defaultAspect, matchesTemplate, parsePromptPack } from "../scripts/lib/prompt-assembly.mjs";
import { findAliasMentions, loadRegistry, packFilePath, resolveArchetypeRequest } from "../scripts/lib/registry.mjs";
import { Repository } from "../scripts/lib/repository.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const SECTION = "From Code to Hand-Drawn Metaphor (Walkthroughs)";

const repo = new Repository(REPO_ROOT);
const { registry } = loadRegistry(repo);
const section = sectionBody(repo.readText("README.md"), SECTION);
const walkthroughs = (section ?? "")
  .split(/^### /m)
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

test("the README has the walkthrough section with one example each for Ferris, the Go Gopher, and Littlebox", () => {
  assert.ok(section, `README.md has no "## ${SECTION}" section`);
  assert.deepEqual(
    walkthroughs.map((walkthrough) => resolveArchetypeRequest(registry, [walkthrough.archetypeName]).archetypes[0]?.id),
    ["ferris", "gopher", "littlebox"],
  );
  assert.deepEqual(walkthroughs.map((walkthrough) => walkthrough.languageBlocks.map((block) => block.info)), [["rust"], ["go"], ["python"]]);
});

for (const [index, id] of ["ferris", "gopher", "littlebox"].entries()) {
  test(`walkthrough ${index + 1} (${id}): the prompt is a faithful instance of the archetype's template`, () => {
    const walkthrough = walkthroughs[index];
    const archetype = registry.byId.get(id);
    const pack = parsePromptPack(repo.readText(packFilePath(archetype, "prompts.md")));
    assert.ok(walkthrough.prompt, `${id} walkthrough has a complete prompt`);

    const match = matchesTemplate(pack.template, walkthrough.prompt.content);
    assert.deepEqual(match.problems, [], `${id}: change the README prompt to follow ${packFilePath(archetype, "prompts.md")}`);
    // Booleans keep a failure readable: a prompt is several kilobytes of text.
    assert.equal(/(?<!\.)\.\.(?!\.)|\.,|,\./.test(walkthrough.prompt.content), false, `${id} prompt has doubled punctuation`);
    // The labels list is written in brackets by design; any other bracket is a field nobody filled.
    assert.equal(/\[(?!")[^\]\n]*\]/.test(walkthrough.prompt.content), false, `${id} prompt still has an unfilled bracketed field`);
    assert.equal(walkthrough.prompt.content.includes(pack.rightsNote.replace(/\.+$/, "")), true, `${id} prompt carries the rights note`);
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
