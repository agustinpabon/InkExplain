import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { PATHS } from "../scripts/lib/config.mjs";
import { parseFrontmatter } from "../scripts/lib/markdown.mjs";
import { Repository } from "../scripts/lib/repository.mjs";

// The sentences that keep a host from claiming what it did not do. Real Codex sessions broke each of these
// rules before the wording existed: a prompts.md reported as saved after its write failed, a label repainted
// with a typeface, a fixed phrase of a template rewritten, and a request for illustrations of a document sent
// to the host's own image skill. docs/evaluation.md records those runs. Change a sentence here only together
// with a run that shows the behavior still holds.
const repo = new Repository(path.resolve(import.meta.dirname, ".."));
const skill = repo.readText(PATHS.skillFile);
const workflow = (name) => repo.readText(`skills/inkexplain/references/workflow/${name}`);

test("SKILL.md tells a host to report only what it has confirmed", () => {
  assert.match(skill, /Report only what you have confirmed/);
  assert.match(skill, /list the folder before you give a saved path/);
  assert.match(skill, /view an image before you call it reviewed/);
  assert.match(skill, /If a write fails, say so and put the content in your reply/);
});

test("prompt mode puts the prompts in the reply, and a saved file is confirmed before its path is given", () => {
  const delivery = workflow("delivery.md");
  assert.match(delivery, /the reply carries the shot list and every complete prompt/);
  assert.match(delivery, /a link to a file is not the deliverable/);
  assert.match(delivery, /Confirm that a file exists before you report its path/);
  assert.match(delivery, /If a write fails, say so and give the prompts in the reply/);
  assert.doesNotMatch(delivery, /In prompt mode this file is the deliverable/, "the old sentence made the file, not the reply, the deliverable");
});

test("an edit is never a repaint with code or a typeface, and a missing edit tool is said out loud", () => {
  const editing = workflow("editing.md");
  assert.match(editing, /never by repainting pixels with code or a typeface/);
  assert.match(editing, /deliver the edit prompt and say that nothing was edited/);
});

test("a template's fixed words stay as written, and the rule comes with the mistake it prevents", () => {
  const assembly = workflow("prompt-assembly.md");
  assert.match(assembly, /Every word of the template outside a bracket stays as written/);
  assert.match(assembly, /delete only a sentence the pack marks as optional/);
  assert.match(assembly, /caught at its decisive moment\.`, write `Action: pours coins into the tray, caught at its decisive moment\.`/);
  assert.match(assembly, /and not `Action: pours coins into the tray, caught mid-pour\.`/);
});

test("the description names what must reach InkExplain and what must not, within the format's limit", () => {
  const { description } = parseFrontmatter(skill).data;
  assert.ok(description.length <= 1024, `the description is ${description.length} characters`);
  for (const phrase of ["a set of illustrations for a document", "repairing a generated illustration", "never claims an image it did not make"]) {
    assert.ok(description.includes(phrase), `the description says "${phrase}"`);
  }
  assert.match(description, /Not for data charts, logos, UI mockups, or photorealistic images/);
});
