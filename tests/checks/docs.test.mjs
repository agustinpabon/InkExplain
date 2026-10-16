import assert from "node:assert/strict";
import test from "node:test";
import { createFixture, messages } from "../helpers/fixture.mjs";

const SPANISH = {
  code: "es",
  label: "Español",
  file: "readmes/README.es.md",
  strings: { archetype: "Arquetipo", category: "Categoría", summary: "Estilo", legalStatus: "Estado legal", default: "predeterminado" },
};

function addSpanish(fixture, { credits = true } = {}) {
  const locales = JSON.parse(fixture.read("readmes/locales.json"));
  locales.locales.push(SPANISH);
  fixture.write("readmes/locales.json", JSON.stringify(locales));
  fixture.write(
    "readmes/README.es.md",
    [
      "# InkExplain",
      "",
      "<!-- inkexplain:languages:start -->",
      "<!-- inkexplain:languages:end -->",
      "",
      "Instala `skills/inkexplain` e invoca `$inkexplain`.",
      "",
      "<!-- inkexplain:archetypes:start -->",
      "<!-- inkexplain:archetypes:end -->",
      "",
      ...(credits ? ["<!-- inkexplain:credits:start -->", "Créditos.", "<!-- inkexplain:credits:end -->", ""] : []),
    ].join("\n"),
  );
  return fixture.regenerateDocs();
}

test("a valid fixture passes every documentation check", (t) => {
  const fixture = createFixture(t);
  for (const result of fixture.run({ only: ["DOC"] })) assert.equal(result.status, "pass", `${result.id}\n${messages(result)}`);
});

test("DOC-001 requires the canonical README identity and credits", (t) => {
  const fixture = createFixture(t);
  fixture.replace("README.md", "# InkExplain", "# Visual Thing");
  fixture.replace("README.md", "*Ideas made visual.*", "");
  fixture.replace("README.md", "Builds on earlier MIT-licensed work; see ATTRIBUTIONS.md.", "");
  const text = messages(fixture.check("DOC-001"));
  assert.match(text, /first title must be "# InkExplain"/);
  assert.match(text, /does not state "Ideas made visual\."/);
  assert.match(text, /needs a non-empty credits region/);
});

test("DOC-002 reports broken links and anchors, but not links inside code", (t) => {
  const fixture = createFixture(t);
  fixture.write("docs/guide.md", "# Guide\n\n## Install\n");
  fixture.append(
    "README.md",
    "\n[ok](docs/guide.md#install) [bad anchor](docs/guide.md#nope) [gone](docs/missing.md) [up](../outside.md)\n```\n[ignored](nowhere.md)\n```\n",
  );
  const text = messages(fixture.check("DOC-002"));
  assert.match(text, /anchor #nope does not exist in docs\/guide\.md/);
  assert.match(text, /link docs\/missing\.md does not resolve/);
  assert.match(text, /link \.\.\/outside\.md leaves the repository/);
  assert.doesNotMatch(text, /nowhere\.md|#install/);
});

test("DOC-003 detects stale generated README regions", (t) => {
  const fixture = createFixture(t).updateRegistry((data) => {
    data.archetypes[1].summary = "A crustacean mascot used to exercise third-party archetype rules.";
  });
  assert.match(messages(fixture.check("DOC-003")), /README\.md: generated regions are out of date/);
  fixture.regenerateDocs();
  assert.equal(fixture.check("DOC-003").status, "pass");
});

test("DOC-003 also covers the gallery page's generated data", (t) => {
  const fixture = createFixture(t);
  assert.equal(fixture.check("DOC-003").status, "pass");
  fixture.updateRegistry((data) => {
    data.archetypes[1].summary = "A crustacean mascot used to exercise third-party archetype rules.";
  });
  const text = messages(fixture.check("DOC-003"));
  assert.match(text, /README\.md: generated regions are out of date/);
  assert.match(text, /examples\/gallery\/index\.html: generated regions are out of date/);
  fixture.regenerateDocs();
  assert.equal(fixture.check("DOC-003").status, "pass");

  fixture.remove("examples/gallery/index.html");
  assert.match(messages(fixture.check("DOC-003")), /examples\/gallery\/index\.html: examples\/gallery\/index\.html is missing/);
});

test("DOC-004 keeps identity and credits in every translation", (t) => {
  const fixture = addSpanish(createFixture(t), { credits: false });
  assert.match(messages(fixture.check("DOC-004")), /README\.es\.md: needs a non-empty credits region/);

  fixture.replace("readmes/README.es.md", "`$inkexplain`", "`$otra`");
  assert.match(messages(fixture.check("DOC-004")), /does not keep "\$inkexplain" unchanged/);
});

test("DOC-004 rejects missing and unlisted translations", (t) => {
  const fixture = addSpanish(createFixture(t));
  assert.equal(fixture.check("DOC-004").status, "pass");
  fixture.write("readmes/README.it.md", "# InkExplain\n");
  assert.match(messages(fixture.check("DOC-004")), /README\.it\.md: not listed in readmes\/locales\.json/);
  fixture.remove("readmes/README.es.md");
  assert.match(messages(fixture.check("DOC-004")), /README\.es\.md: localized README is missing/);
});

test("DOC-005 requires prompts for the default, each archetype, mixed requests, and prompt mode", (t) => {
  const fixture = createFixture(t).write(
    "examples/prompts.md",
    "# Prompts\n\n```text\nUse $inkexplain with Demo Crab.\n```\n",
  );
  const text = messages(fixture.check("DOC-005"));
  assert.match(text, /no prompt exercises the default archetype/);
  assert.match(text, /no prompt exercises a mixed-archetype request/);
  assert.match(text, /no prompt selects archetype guarded/);
  assert.match(text, /no prompt exercises prompt mode/);
  assert.doesNotMatch(text, /archetype demo/);
});
