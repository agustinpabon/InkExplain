import assert from "node:assert/strict";
import test from "node:test";
import {
  GENERATED_NOTICE,
  legalStatus,
  parseLocales,
  planGeneratedDocuments,
  renderArchetypeTable,
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

test("archetype tables are localized but keep identifiers and registry data unchanged", () => {
  const table = renderArchetypeTable(registry, spanish);
  assert.match(table, /^\| Arquetipo \| Categoría \| Estilo \| Estado legal \|/);
  assert.match(table, /InkExplain Sketch \(`ink`, predeterminado\)/);
  assert.match(table, /\| Demo Crab \(`demo`\) \| `mascot` \|/);
  assert.match(table, /`gated-authorized` · Proprietary · Example Studio/);
  assert.equal(table.split("\n").length, registry.archetypes.length + 2);
});

test("legal status combines status, license, and rights holder", () => {
  assert.equal(legalStatus(registry.byId.get("demo")), "`active` · CC0 · Example Author");
});

test("language selectors link relative to each README", () => {
  assert.equal(renderLanguageSelector([english, spanish], english), "**English** | [Español](./readmes/README.es.md)");
  assert.equal(renderLanguageSelector([english, spanish], spanish), "[English](../README.md) | **Español**");
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

  fixture.replace("README.md", "| Demo Crab (`demo`) |", "| Old Name |");
  assert.notEqual(plans()[1].current, plans()[1].expected);

  fixture.replace("README.md", "<!-- inkexplain:archetypes:end -->", "");
  assert.match(plans()[1].problems.join("\n"), /missing <!-- inkexplain:archetypes:end -->/);
});
