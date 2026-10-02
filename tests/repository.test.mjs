// Acceptance tests against the real repository: the shipped InkExplain package
// must pass every check and keep its identity, archetypes, rights, and notices.

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { createContext, runChecks } from "../scripts/lib/check-runner.mjs";
import { ALL_CHECKS } from "../scripts/lib/checks/index.mjs";
import { LEGAL, PACK_FILES, PATHS, PRODUCT, SKILL_MAX_LINES } from "../scripts/lib/config.mjs";
import { extractHeadings, parseFrontmatter, sectionBody } from "../scripts/lib/markdown.mjs";
import { outputDirectory, packFilePath } from "../scripts/lib/registry.mjs";
import { getPath, parseYaml } from "../scripts/lib/yaml-lite.mjs";
import { messages } from "./helpers/fixture.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const context = createContext(ROOT);
const { repo, registry } = context;

test("the repository passes every validation check", () => {
  const failing = runChecks(ALL_CHECKS, context).filter((result) => result.status !== "pass");
  assert.deepEqual(
    failing.map((result) => `${result.id} ${result.title}\n${messages(result)}`),
    [],
  );
});

test("the canonical skill is named inkexplain and lives in skills/inkexplain", () => {
  assert.equal(PATHS.packageDir, "skills/inkexplain");
  assert.ok(repo.isFile("skills/inkexplain/SKILL.md"));
  assert.equal(parseFrontmatter(repo.readText(PATHS.skillFile)).data.name, "inkexplain");
  assert.equal(registry.skill, "inkexplain");
  assert.equal(JSON.parse(repo.readText("package.json")).name, "inkexplain");
});

test("SKILL.md stays a short entry point; detail loads progressively", () => {
  const lines = repo.readText(PATHS.skillFile).split("\n").length;
  assert.ok(lines <= SKILL_MAX_LINES, `SKILL.md has ${lines} lines`);
  assert.equal(SKILL_MAX_LINES, 80);
});

test("$inkexplain is the advertised invocation everywhere", () => {
  const agent = parseYaml(repo.readText(PATHS.agentFile)).value;
  assert.match(getPath(agent, "interface.default_prompt"), /\$inkexplain\b/);
  for (const locale of context.locales) {
    const text = repo.readText(locale.file);
    assert.ok(text.includes("$inkexplain"), locale.file);
    assert.equal(extractHeadings(text).find((heading) => heading.level === 1)?.text, PRODUCT.name, locale.file);
  }
  for (const file of [PATHS.skillFile, PATHS.promptExamples, "AGENTS.md"]) assert.ok(repo.readText(file).includes("$inkexplain"), file);
});

test("README leads with the InkExplain brand statement and the contributor walkthrough", () => {
  const readme = repo.readText(PATHS.readme);
  assert.ok(readme.includes(PRODUCT.tagline));
  assert.ok(readme.includes(PRODUCT.description));
  assert.ok(sectionBody(readme, "Adding New Characters and Animation Styles"), "README explains how to add an archetype");
});

test("every archetype has its five pack files", () => {
  for (const archetype of registry.archetypes) {
    for (const file of PACK_FILES) assert.ok(repo.isFile(packFilePath(archetype, file)), `${archetype.id}/${file}`);
  }
});

test("third-party archetypes carry a rights note; none is gated", () => {
  for (const archetype of registry.archetypes.filter((candidate) => candidate.thirdParty)) {
    assert.match(repo.readText(packFilePath(archetype, "prompts.md")), /## Rights note/, archetype.id);
  }
  assert.deepEqual(registry.archetypes.filter((archetype) => archetype.gated).map((archetype) => archetype.id), []);
});

test("withheld and pending archetypes publish no sample images", () => {
  const images = repo.walk("examples").concat(repo.walk(`${PATHS.packageDir}/assets`));
  for (const archetype of registry.archetypes.filter((candidate) => candidate.sampleGates.status !== "approved")) {
    const leaked = images.filter((file) => file.split("/").includes(archetype.id));
    assert.deepEqual(leaked, [], archetype.id);
  }
});

test("the license keeps the MIT notice and ATTRIBUTIONS credits third-party archetypes", () => {
  const license = repo.readText(PATHS.license);
  assert.match(license, /^Copyright \(c\) 2026 Ian$/m);
  assert.match(license, /^Copyright \(c\) 2026 Agustin Pabon$/m);
  const attributions = repo.readText(PATHS.attributions);
  for (const term of ["Ian Xiaohei Illustrations", "okooo5km", "Renee French", "Karen Rustad Tolva", "Larry Ewing", "OpenClaw Foundation"]) {
    assert.ok(attributions.includes(term), term);
  }
});

test("output folders are deterministic and unique", () => {
  const folders = registry.archetypes.map((archetype) => outputDirectory(archetype));
  assert.equal(new Set(folders).size, folders.length);
  assert.equal(outputDirectory(registry.defaultArchetype), "assets/<article-slug>-illustrations/");
  assert.equal(outputDirectory(registry.byId.get("tux"), "my-post"), "assets/my-post-tux/");
});

// [stage] test(checks/assets): verify AST-002 flags images with invalid aspect ratios
