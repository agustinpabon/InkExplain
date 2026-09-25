// Han-script fixtures are built from code points so this file itself stays
// English-default under the language policy it tests.

import assert from "node:assert/strict";
import test from "node:test";
import { allowlistProblems, scanHanText } from "../../scripts/lib/checks/language.mjs";
import { LANGUAGE_ALLOWLIST } from "../../scripts/lib/config.mjs";
import { createFixture, messages } from "../helpers/fixture.mjs";

const han = (...codePoints) => String.fromCodePoint(...codePoints);
const XIAO_HE = han(0x5c0f, 0x76d2); // a Chinese archetype alias added to the fixture below
const STALE = han(0x8fd9, 0x662f, 0x6ca1, 0x6709, 0x7ffb, 0x8bd1, 0x7684, 0x53e5, 0x5b50); // an untranslated sentence
const LABEL = han(0x8f93, 0x51fa); // a label word

function withHanAlias(fixture) {
  return fixture
    .updateRegistry((data) => data.archetypes[1].aliases.push(XIAO_HE))
    .regenerateDocs();
}

test("a valid fixture passes every language check", (t) => {
  const fixture = createFixture(t);
  for (const result of fixture.run({ only: ["LANG"] })) assert.equal(result.status, "pass", `${result.id}\n${messages(result)}`);
});

test("scanHanText removes allowed tokens before judging a line", () => {
  assert.deepEqual(scanHanText(`Use ${XIAO_HE} here.`, [XIAO_HE]), []);
  assert.deepEqual(scanHanText(`Use ${XIAO_HE}${STALE}.`, [XIAO_HE]).map((finding) => finding.line), [1]);
  assert.deepEqual(scanHanText(`plain\n${STALE}`, []).map((finding) => finding.line), [2]);
});

test("LANG-001 allows archetype aliases anywhere and rejects other Han-script prose", (t) => {
  const fixture = withHanAlias(createFixture(t));
  assert.equal(fixture.check("LANG-001").status, "pass", "the generated routing table contains the alias");
  fixture.append("docs/language-policy.md", `\nThe alias ${XIAO_HE} is fine.\n${STALE}\n`);
  const result = fixture.check("LANG-001");
  assert.match(messages(result), /docs\/language-policy\.md:\d+: unapproved Han-script text/);
  assert.equal(result.issues.length, 1);
});

test("LANG-001 honors path-scoped allowlist entries", (t) => {
  const fixture = createFixture(t).append("examples/prompts.md", `\nLabel: ${LABEL}\n`);
  const policy = { languageAllowlist: [{ category: "user-language visible labels", token: LABEL, paths: ["examples/prompts.md"], rationale: "Shows a label copied exactly." }] };
  assert.equal(fixture.check("LANG-001", { policy }).status, "pass");
  fixture.append("README.md", `\nLabel: ${LABEL}\n`);
  assert.match(messages(fixture.check("LANG-001", { policy })), /^README\.md:\d+: unapproved/m);
});

test("LANG-001 skips localized READMEs", (t) => {
  const fixture = createFixture(t).write("readmes/notes.md", `${STALE}\n`);
  assert.equal(fixture.check("LANG-001").status, "pass");
});

test("LANG-002 rejects broad, stale, or unexplained allowlist entries", () => {
  const exists = (file) => file === "README.md";
  const problems = allowlistProblems(
    [
      { category: "archetype aliases", token: LABEL, paths: ["docs/"], rationale: "Directory scope is too broad." },
      { category: "anything", token: LABEL, paths: ["README.md"], rationale: "Unknown category." },
      { category: "archetype aliases", token: "english", paths: ["README.md"], rationale: "Not Han script." },
      { category: "archetype aliases", token: LABEL, paths: ["gone.md"], rationale: "Stale path entry." },
      { category: "archetype aliases", token: LABEL, paths: ["README.md"], rationale: "" },
    ],
    exists,
  ).join("\n");
  assert.match(problems, /docs\/ must be an exact file/);
  assert.match(problems, /unknown category "anything"/);
  assert.match(problems, /token must contain Han script/);
  assert.match(problems, /gone\.md does not exist/);
  assert.match(problems, /needs a rationale/);
});

test("the shipped allowlist is internally consistent", () => {
  assert.deepEqual(allowlistProblems(LANGUAGE_ALLOWLIST, () => true), []);
});

test("LANG-003 requires the policy to name every surface and category", (t) => {
  const fixture = createFixture(t).replace("docs/language-policy.md", "- archetype aliases", "");
  assert.match(messages(fixture.check("LANG-003")), /does not mention "archetype aliases"/);
});
