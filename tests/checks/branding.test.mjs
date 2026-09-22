import assert from "node:assert/strict";
import test from "node:test";
import { originIdentifierFindings, originIdentifiers } from "../../scripts/lib/checks/branding.mjs";
import { FIXTURE_ORIGIN, createFixture, messages } from "../helpers/fixture.mjs";

const ATTRIBUTIONS = [
  "# Attributions",
  "",
  "## Character archetypes",
  "",
  "- **Not An Origin** by Someone (<https://github.com/someone/not-an-origin>)",
  "",
  "## Origins",
  "",
  "- **Paper Lantern Kit** by Ana (<https://github.com/ana-dev/paper-lantern-kit>): the first skill.",
  "- **Fork Of Lanterns** by Ben (https://github.com/benb/fork-of-lanterns.): the multi-character fork.",
  "",
  "## Trademarks",
  "",
  "- **Ignored** after the section.",
].join("\n");

test("a valid fixture passes every branding check", (t) => {
  const fixture = createFixture(t);
  for (const result of fixture.run({ only: ["BRAND"] })) assert.equal(result.status, "pass", `${result.id}\n${messages(result)}`);
});

test("originIdentifiers reads project names, accounts, and repositories from Origins only", () => {
  const values = originIdentifiers(ATTRIBUTIONS).map((identifier) => identifier.value);
  assert.deepEqual(values.sort(), ["Fork Of Lanterns", "Paper Lantern Kit", "ana-dev", "benb"].sort());
  assert.deepEqual(originIdentifiers("# No origins here\n"), []);
  assert.deepEqual(originIdentifiers(null), []);
});

test("originIdentifierFindings matches names regardless of case and separators", () => {
  const identifiers = originIdentifiers(ATTRIBUTIONS);
  const text = [
    "Paper Lantern Kit is the old name.",
    "Clone paper-lantern-kit or PAPER_LANTERN_KIT.",
    "Ask ana-dev.",
    "A paper lantern is fine on its own.",
    "So is a fork of the lantern idea.",
  ].join("\n");
  const lines = [...new Set(originIdentifierFindings("docs/x.md", text, identifiers).map((finding) => finding.line))];
  assert.deepEqual(lines, [1, 2, 3]);
});

test("BRAND-001 allows origin names in ATTRIBUTIONS, rights records, and README credits only", (t) => {
  const fixture = createFixture(t);
  fixture.append("skills/inkexplain/references/archetypes/demo/rights.md", `\nPack format from ${FIXTURE_ORIGIN.name}.\n`);
  fixture.replace("README.md", "Builds on earlier MIT-licensed work", `Builds on ${FIXTURE_ORIGIN.name}`);
  assert.equal(fixture.check("BRAND-001").status, "pass");

  fixture.append("README.md", `\nInstall ${FIXTURE_ORIGIN.repository} with $${FIXTURE_ORIGIN.repository}.\n`);
  fixture.write("docs/guide.md", `# Guide\n\nFollow ${FIXTURE_ORIGIN.account} for updates.\n`);
  fixture.append("skills/inkexplain/references/archetypes/demo/style.md", `\nStyle borrowed from ${FIXTURE_ORIGIN.name}.\n`);
  const text = messages(fixture.check("BRAND-001"));
  assert.match(text, /^README\.md:\d+: origin project name "Example Origin Kit"/m);
  assert.match(text, /^docs\/guide\.md:3: origin account "example-origin"/m);
  assert.match(text, /archetypes\/demo\/style\.md:\d+: origin project name "Example Origin Kit"/);
});

test("BRAND-002 requires one identity across package, metadata, and docs", (t) => {
  const fixture = createFixture(t);
  fixture.replace("package.json", '"name": "inkexplain"', '"name": "visual-thing"');
  fixture.replace("skills/inkexplain/agents/openai.yaml", 'display_name: "InkExplain"', 'display_name: "Ink Explain"');
  fixture.replace("examples/prompts.md", "Use $inkexplain to illustrate this article.", "Use the skill to illustrate this article.");
  fixture.replace("examples/prompts.md", "$inkexplain", "$other");
  fixture.replace("examples/prompts.md", "$inkexplain", "$other");
  fixture.replace("examples/prompts.md", "$inkexplain", "$other");
  fixture.replace("examples/prompts.md", "$inkexplain", "$other");
  const text = messages(fixture.check("BRAND-002"));
  assert.match(text, /package\.json: name must be inkexplain/);
  assert.match(text, /openai\.yaml: display_name must be InkExplain/);
  assert.match(text, /examples\/prompts\.md: must use the invocation \$inkexplain/);
});
