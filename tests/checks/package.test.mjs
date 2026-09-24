import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createFixture, makePng, messages } from "../helpers/fixture.mjs";

const SKILL = "skills/inkexplain/SKILL.md";
const AGENT = "skills/inkexplain/agents/openai.yaml";

test("a valid fixture passes every package check", (t) => {
  const fixture = createFixture(t);
  for (const result of fixture.run({ only: ["PKG"] })) assert.equal(result.status, "pass", `${result.id}\n${messages(result)}`);
});

test("PKG-001 reports missing required package files", (t) => {
  const fixture = createFixture(t).remove("skills/inkexplain/references/workflow/qa-checklist.md");
  const result = fixture.check("PKG-001");
  assert.equal(result.status, "fail");
  assert.match(messages(result), /references\/workflow\/qa-checklist\.md: required package file is missing/);
});

test("PKG-002 enforces the skill name, description, and allowed keys", (t) => {
  const fixture = createFixture(t);
  fixture.replace(SKILL, "name: inkexplain", "name: visual-thing");
  assert.match(messages(fixture.check("PKG-002")), /name must be "inkexplain"/);

  fixture.replace(SKILL, "name: visual-thing", "name: inkexplain\nversion: 2");
  assert.match(messages(fixture.check("PKG-002")), /unsupported frontmatter key "version"/);

  fixture.replace(SKILL, "version: 2\n", "");
  fixture.replace(SKILL, "for fixtures.", `for fixtures ${"x".repeat(1100)}.`);
  assert.match(messages(fixture.check("PKG-002")), /limit is 1024/);
});

test("PKG-002 keeps the discovery description English-default", (t) => {
  const fixture = createFixture(t);
  fixture.replace(SKILL, "for fixtures.", `for fixtures ${String.fromCodePoint(0x753b, 0x56fe)}.`);
  assert.match(messages(fixture.check("PKG-002")), /English-default/);
});

test("PKG-003 requires concise SKILL.md routing to every module", (t) => {
  const fixture = createFixture(t);
  fixture.replace(SKILL, "- `references/workflow/delivery.md`", "- delivery");
  fixture.replace(SKILL, "## Rules", "## Principles");
  const text = messages(fixture.check("PKG-003"));
  assert.match(text, /does not route to references\/workflow\/delivery\.md/);
  assert.match(text, /missing section "## Rules"/);

  fixture.append(SKILL, "line\n".repeat(600));
  assert.match(messages(fixture.check("PKG-003")), /keep SKILL.md under 80/);
});

test("PKG-004 rejects package links that dangle or escape the package", (t) => {
  const fixture = createFixture(t);
  fixture.append(SKILL, "\nSee [missing](references/nope.md), [outside](../../README.md), and `references/archetypes/ghost/style.md`.\n");
  const text = messages(fixture.check("PKG-004"));
  assert.match(text, /link references\/nope\.md does not resolve/);
  assert.match(text, /leaves the skill package/);
  assert.match(text, /package path references\/archetypes\/ghost\/style\.md does not exist/);
});

test("PKG-004 ignores workspace output placeholders", (t) => {
  const fixture = createFixture(t);
  fixture.append(SKILL, "\nSave to `assets/<article-slug>-illustrations/`.\n");
  assert.equal(fixture.check("PKG-004").status, "pass");
});

test("PKG-005 validates openai.yaml structure and branding", (t) => {
  const fixture = createFixture(t);
  fixture.replace(AGENT, 'display_name: "InkExplain"', "display_name: Old: Name");
  const text = messages(fixture.check("PKG-005"));
  assert.match(text, /plain values cannot contain/);
  assert.match(text, /display_name must be "InkExplain"/);

  fixture.replace(AGENT, "display_name: Old: Name", 'display_name: "InkExplain"');
  fixture.replace(AGENT, "Turn ideas into illustrations.", "x".repeat(130));
  assert.match(messages(fixture.check("PKG-005")), /keep it under 120/);

  fixture.replace(AGENT, "allow_implicit_invocation: true", 'allow_implicit_invocation: "yes"');
  assert.match(messages(fixture.check("PKG-005")), /must be true or false/);
});

test("PKG-006 keeps generated output and stray files out of the package", (t) => {
  const fixture = createFixture(t);
  fixture.write("skills/inkexplain/assets/my-post-illustrations/01-x.png", makePng());
  fixture.write("skills/inkexplain/notes.txt", "scratch");
  const text = messages(fixture.check("PKG-006"));
  assert.match(text, /belong in the user's workspace/);
  assert.match(text, /file type \.txt is not part of the skill package/);
});

test("PKG-006 rejects symlinks inside the package", (t) => {
  const fixture = createFixture(t);
  try {
    fs.symlinkSync(fixture.path("docs"), fixture.path("skills/inkexplain/linked"), "junction");
  } catch (error) {
    t.skip(`symlinks unavailable: ${error.code}`);
    return;
  }
  assert.match(messages(fixture.check("PKG-006")), /symbolic links are not allowed/);
});

// [stage] engines node missing
