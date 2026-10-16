import assert from "node:assert/strict";
import test from "node:test";
import { copyrightHolder } from "../../scripts/lib/checks/legal.mjs";
import { createFixture, messages } from "../helpers/fixture.mjs";

const PACK = "skills/inkexplain/references/archetypes";

test("a valid fixture passes every legal check", (t) => {
  const fixture = createFixture(t);
  for (const result of fixture.run({ only: ["LEGAL"] })) assert.equal(result.status, "pass", `${result.id}\n${messages(result)}`);
});

test("copyrightHolder reads the holder from a copyright line", () => {
  assert.equal(copyrightHolder("Copyright (c) 2026 Alice"), "Alice");
  assert.equal(copyrightHolder("Copyright (c) 2024-2026 Example Studio"), "Example Studio");
});

test("LEGAL-001 keeps the required copyright line", (t) => {
  const fixture = createFixture(t).replace("LICENSE", "Copyright (c) 2026 Agustin Pabon", "Copyright (c) 2026 Someone Else");
  assert.match(messages(fixture.check("LEGAL-001")), /must keep the line "Copyright \(c\) 2026 Agustin Pabon"/);
});

test("LEGAL-001 accepts an additional copyright line for new work", (t) => {
  const fixture = createFixture(t).replace("LICENSE", "Copyright (c) 2026 Agustin Pabon", "Copyright (c) 2026 Agustin Pabon\nCopyright (c) 2026 New Maintainer");
  assert.equal(fixture.check("LEGAL-001").status, "pass");
});

test("LEGAL-001 detects altered MIT terms, regardless of line wrapping", (t) => {
  const fixture = createFixture(t);
  fixture.replace("LICENSE", "to any person obtaining a copy", "to any person\nobtaining a copy");
  assert.equal(fixture.check("LEGAL-001").status, "pass");
  fixture.replace("LICENSE", "NONINFRINGEMENT", "MERCHANTABILITY ONLY");
  assert.match(messages(fixture.check("LEGAL-001")), /MIT warranty disclaimer is missing or altered/);
});

test("LEGAL-002 requires every archetype attribution in ATTRIBUTIONS", (t) => {
  const fixture = createFixture(t).replace("ATTRIBUTIONS.md", "- Example Author", "");
  assert.match(messages(fixture.check("LEGAL-002")), /archetype demo attribution "Example Author" is missing/);
});

test("LEGAL-003 requires rights records to state status, category, holder, and attribution", (t) => {
  const fixture = createFixture(t);
  fixture.write(`${PACK}/guarded/rights.md`, "# Guarded Cat Rights\n\n## Source\n\nx\n\n## Rights and restrictions\n\nx\n\n## Public samples\n\nx\n");
  const text = messages(fixture.check("LEGAL-003"));
  assert.match(text, /does not state status gated-authorized/);
  assert.match(text, /does not state category tribute-character/);
  assert.match(text, /does not name the rights holder "Example Studio"/);
  assert.match(text, /does not record attribution "Example Studio"/);
});

test("LEGAL-005 requires an Origins section that credits every origin with a link and a license", (t) => {
  assert.equal(createFixture(t).check("LEGAL-005").status, "pass");

  const missing = createFixture(t);
  missing.write("ATTRIBUTIONS.md", missing.read("ATTRIBUTIONS.md").replace(/## Origins[\s\S]*?(?=## Trademarks)/, ""));
  assert.match(messages(missing.check("LEGAL-005")), /needs a "## Origins" section that credits the projects InkExplain builds on/);

  const empty = createFixture(t);
  empty.write("ATTRIBUTIONS.md", empty.read("ATTRIBUTIONS.md").replace(/(## Origins\n\n)[^\n]*\n/, "$1Nothing to credit.\n"));
  assert.match(messages(empty.check("LEGAL-005")), /must list each origin project with a bold name/);

  const bare = createFixture(t);
  bare.replace("ATTRIBUTIONS.md", ` (<https://github.com/example-origin/example-origin-kit>), MIT License`, "");
  const text = messages(bare.check("LEGAL-005"));
  assert.match(text, /origin "Example Origin Kit" needs a link to its repository, on the same line/);
  assert.match(text, /origin "Example Origin Kit" needs its license, on the same line/);
});

test("LEGAL-005 requires the origins to name every copyright holder LICENSE keeps besides the maintainer", (t) => {
  const fixture = createFixture(t).replace("ATTRIBUTIONS.md", "by Ian and Agustin Pabon", "by Agustin Pabon");
  assert.match(messages(fixture.check("LEGAL-005")), /the Origins section must credit "Ian", whose copyright LICENSE keeps/);
  const credited = createFixture(t).replace("ATTRIBUTIONS.md", "by Ian and Agustin Pabon", "by Ian");
  assert.equal(credited.check("LEGAL-005").status, "pass", "the maintainer's own line needs no origin entry");
});

test("LEGAL-003 requires a rights record for the house style too", (t) => {
  const fixture = createFixture(t).remove(`${PACK}/ink/rights.md`);
  assert.match(messages(fixture.check("LEGAL-003")), /archetype ink has no rights record/);
});

test("LEGAL-004 protects gated archetypes", (t) => {
  const fixture = createFixture(t).updateRegistry((data) => {
    data.archetypes[2].sampleGates = {
      status: "approved",
      decision: "Approved without authorization.",
      reviewer: "Someone",
      date: "2026-01-01",
      directories: [],
    };
    // A gated mascot: tribute characters already need restrictions at the schema level.
    data.archetypes[2].category = "mascot";
    data.archetypes[2].legalNotice.restrictions = [];
  });
  const text = messages(fixture.check("LEGAL-004"));
  assert.match(text, /gated archetype guarded must list its restrictions/);
  assert.match(text, /cannot approve public samples without a recorded sampleGates\.authorization/);
});

test("LEGAL-004 accepts gated samples only with a recorded authorization", (t) => {
  const fixture = createFixture(t).updateRegistry((data) => {
    data.archetypes[2].sampleGates = {
      status: "approved",
      decision: "Approved under a written license from the rights holder.",
      reviewer: "Rights Reviewer",
      date: "2026-01-01",
      authorization: "License agreement 2026-001",
      directories: [],
    };
  });
  assert.equal(fixture.check("LEGAL-004").status, "pass");
});
