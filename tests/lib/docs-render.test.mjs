import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERATED_NOTICE,
  legalStatus,
  parseLocales,
  planGeneratedDocuments,
  renderArchetypeList,
  renderLanguageSelector,
  renderRoutingDoc,
} from "../../scripts/lib/docs-render.mjs";
import { parseRegistry, referencePaths } from "../../scripts/lib/registry.mjs";
import { Repository } from "../../scripts/lib/repository.mjs";
import { createFixture, fixtureRegistryData } from "../helpers/fixture.mjs";

const { registry } = parseRegistry(JSON.stringify(fixtureRegistryData()));
const english = {
  code: "en",
  label: "English",
  file: "README.md",
  strings: { archetype: "Archetype", category: "Category", summary: "Style summary", legalStatus: "Legal status", default: "default" },
};
const spanish = {
  code: "es",
  label: "Español",
  file: "readmes/README.es.md",
  strings: { archetype: "Arquetipo", category: "Categoría", summary: "Estilo", legalStatus: "Estado legal", default: "predeterminado" },
};

test("routing.md rendering is deterministic and complete", () => {
  const text = renderRoutingDoc(registry);
  assert.equal(text, renderRoutingDoc(registry));
  assert.ok(text.startsWith(GENERATED_NOTICE));
  assert.match(text, /use the default archetype, `ink` \(InkExplain Sketch\)/);
  for (const archetype of registry.archetypes) {
    assert.ok(text.includes(`### ${archetype.name} (\`${archetype.id}\``), archetype.id);
    for (const file of referencePaths(archetype)) assert.ok(text.includes(`\`${file}\``), file);
  }
  assert.match(text, /- Never selects: `crab`/);
  assert.match(text, /Use only within your own authorization\./);
  assert.match(text, /- Motion DNA: Demo Crab, with both claws\. Signature actions: pinch, scuttle, sort\./);
  assert.match(text, /- Style sheet: Hand-drawn sketch\. Canvas: 16:9 white\. Linework: Loose black ink\. Palette: coral orange\./);
  assert.match(text, /- Credit: Original to InkExplain\. Rights holder: InkExplain contributors\. License: MIT\./);
  assert.match(text, /- `tribute-character`: /);
  assert.match(text, /- `gated-authorized`: /);
});

test("referencePaths lists the five pack files with rights first", () => {
  assert.deepEqual(referencePaths(registry.byId.get("demo")), [
    "references/archetypes/demo/rights.md",
    "references/archetypes/demo/identity.md",
    "references/archetypes/demo/style.md",
    "references/archetypes/demo/motion-and-acting.md",
    "references/archetypes/demo/prompts.md",
  ]);
});

test("the character grid is localized in its marks, keeps identifiers and registry data, and shows previews only where one exists", () => {
  const grid = renderArchetypeList(registry, spanish, new Set(["demo"]));
  assert.ok(grid.startsWith("<table>") && grid.endsWith("</table>"));
  assert.match(grid, /<td width="50%" valign="top"><b>InkExplain Sketch<\/b> · predeterminado<br>/);
  assert.match(grid, /<a href="\.\.\/assets\/examples\/demo\.png"><img src="\.\.\/assets\/examples\/thumbs\/demo\.png" alt="Demo Crab[^"]*, a real render" width="100%"><\/a><br><b>Demo Crab<\/b><br>.* · <a href="\.\.\/assets\/examples\/demo\.png">full size<\/a><br><sub>CC0 · Example Author<\/sub><\/td>/);
  assert.equal((grid.match(/<img /g) ?? []).length, 1, "only the character with a render gets a thumbnail");
  assert.match(grid, /<b>[^<]+<\/b> · <code>gated-authorized<\/code>/);
  assert.equal((grid.match(/<td /g) ?? []).length, registry.archetypes.length);
  assert.equal((grid.match(/<tr>/g) ?? []).length, Math.ceil(registry.archetypes.length / 2));
  assert.match(renderArchetypeList(registry, english), /^<table>/, "no previews at all still renders the grid");
});

test("legal status combines status, license, and rights holder", () => {
  assert.equal(legalStatus(registry.byId.get("demo")), "`active` · CC0 · Example Author");
});

test("language selectors link relative to each README", () => {
  assert.equal(renderLanguageSelector([english, spanish], english), "<details>\n<summary>Languages</summary>\n\n**English** · [Español](./readmes/README.es.md)\n\n</details>");
  assert.equal(renderLanguageSelector([english, spanish], spanish), "<details>\n<summary>Languages</summary>\n\n[English](../README.md) · **Español**\n\n</details>");
});

test("parseLocales validates locale data", () => {
  assert.deepEqual(parseLocales(JSON.stringify({ locales: [english, spanish] })).issues, []);
  const broken = { ...spanish, file: "readmes/README.spanish.md", strings: { ...spanish.strings, archetype: "" } };
  const issues = parseLocales(JSON.stringify({ locales: [english, broken] })).issues.join("\n");
  assert.match(issues, /file must be readmes\/README\.es\.md/);
  assert.match(issues, /strings\.archetype must be non-empty/);
  assert.match(parseLocales(JSON.stringify({ locales: [spanish] })).issues.join("\n"), /first locale must be "en"/);
  assert.match(parseLocales("{").issues[0], /invalid JSON/);
});

test("planGeneratedDocuments flags stale and malformed regions", (t) => {
  const fixture = createFixture(t);
  const repo = () => new Repository(fixture.root);
  const plans = () => planGeneratedDocuments(repo(), registry, [english]);
  assert.ok(plans().every((plan) => plan.current === plan.expected && plan.problems.length === 0));

  fixture.replace("README.md", "<b>Demo Crab</b>", "<b>Old Name</b>");
  assert.notEqual(plans()[1].current, plans()[1].expected);

  fixture.replace("README.md", "<!-- inkexplain:archetypes:end -->", "");
  assert.match(plans()[1].problems.join("\n"), /missing <!-- inkexplain:archetypes:end -->/);
});

test("planGeneratedDocuments plans the gallery page's data region after routing and the READMEs", (t) => {
  const fixture = createFixture(t);
  const repo = () => new Repository(fixture.root);
  const plans = planGeneratedDocuments(repo(), registry, [english]);
  assert.deepEqual(plans.map((plan) => plan.kind), ["routing", "readme", "gallery"]);
  const gallery = plans.at(-1);
  assert.equal(gallery.path, "examples/gallery/index.html");
  assert.deepEqual(gallery.problems, []);
  assert.equal(gallery.current, gallery.expected, "a freshly generated fixture is current");
  assert.match(gallery.expected, /<script type="application\/json" id="inkexplain-data">/);
  assert.match(gallery.expected, /"name": "Demo Crab"/);

  // A registry change leaves the page stale until it is regenerated.
  fixture.updateRegistry((data) => (data.archetypes[1].summary = "A changed summary for the gallery."));
  const changed = parseRegistry(fixture.read("skills/inkexplain/registry.json")).registry;
  const stale = planGeneratedDocuments(repo(), changed, [english]).at(-1);
  assert.notEqual(stale.current, stale.expected);
  assert.match(stale.expected, /A changed summary for the gallery\./);
  assert.ok(stale.expected.startsWith(stale.current.slice(0, stale.current.indexOf("<!-- inkexplain:gallery-data:start -->"))), "only the region changes");
});

test("gallery plan problems: missing page, missing or broken markers, and a pack that cannot be filled", (t) => {
  const fixture = createFixture(t);
  const plan = () => planGeneratedDocuments(new Repository(fixture.root), registry, [english]).at(-1);
  const page = fixture.read("examples/gallery/index.html");

  fixture.write("examples/gallery/index.html", page.replace("<!-- inkexplain:gallery-data:end -->", ""));
  assert.match(plan().problems.join("\n"), /index\.html: missing <!-- inkexplain:gallery-data:end -->/);

  fixture.write("examples/gallery/index.html", page.replace(/<!-- inkexplain:gallery-data:(?:start|end) -->/g, ""));
  assert.match(plan().problems.join("\n"), /index\.html has no generated gallery-data region/);

  fixture.write("examples/gallery/index.html", page);
  fixture.write("skills/inkexplain/references/archetypes/demo/prompts.md", "# Demo Prompts\n\n## Generation prompt\n\n```text\nDraw one idea.\n```\n");
  assert.match(plan().problems.join("\n"), /index\.html: skills\/inkexplain\/references\/archetypes\/demo\/prompts\.md: the generation prompt lacks the \[core idea in one sentence\] field/);

  fixture.remove("examples/gallery/index.html");
  assert.deepEqual(plan().problems, ["examples/gallery/index.html is missing"]);
  assert.equal(plan().expected, null);
});
