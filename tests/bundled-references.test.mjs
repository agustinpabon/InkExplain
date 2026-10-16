import assert from "node:assert/strict";
import crypto from "node:crypto";
import path from "node:path";
import test from "node:test";
import { gitBlobSha1 } from "../scripts/lib/provenance.mjs";
import { readPngInfo } from "../scripts/lib/images.mjs";
import { Repository } from "../scripts/lib/repository.mjs";

// A reference image that belongs to someone else must be a copy that can be checked against its source. Its rights
// record names the source, the commit, and the file's hashes; this test fails if the bundled file stops matching them.
const repo = new Repository(path.resolve(import.meta.dirname, ".."));

test("the Go gopher reference is an unmodified copy of Takuya Ueda's drawing, as its rights record says", () => {
  const record = repo.readText("skills/inkexplain/references/archetypes/gopher/rights.md");
  const blob = /git blob SHA-1 `([0-9a-f]{40})`/.exec(record)?.[1];
  const sha256 = /SHA-256 `([0-9a-f]{64})`/.exec(record)?.[1];
  const commit = /at commit `([0-9a-f]{40})`/.exec(record)?.[1];
  assert.ok(blob && sha256 && commit, "rights.md records the source commit and both hashes");
  assert.ok(record.includes("https://github.com/golang-samples/gopher-vector"), "and names the source repository");

  const file = repo.readBuffer("skills/inkexplain/references/archetypes/gopher/gopher.png");
  assert.equal(gitBlobSha1(file), blob, "the bundled file is the recorded git blob, so it is not an adaptation");
  assert.equal(crypto.createHash("sha256").update(file).digest("hex"), sha256);
  assert.deepEqual(readPngInfo(file), { width: 1634, height: 2224 });
  assert.match(record, /114063 bytes/);
  assert.equal(file.length, 114063);
});

test("the credit for the reference drawing travels with the character: registry, rights record, credits, and the rights note", () => {
  const registry = JSON.parse(repo.readText("skills/inkexplain/registry.json"));
  const gopher = registry.archetypes.find((archetype) => archetype.id === "gopher");
  for (const term of ["Takuya Ueda", "Creative Commons Attribution 3.0", "https://github.com/golang-samples/gopher-vector"]) {
    assert.ok(gopher.legalNotice.attributionTerms.includes(term), `the registry names ${term}`);
    for (const file of ["ATTRIBUTIONS.md", "skills/inkexplain/references/archetypes/gopher/rights.md", "skills/inkexplain/references/archetypes/gopher/prompts.md"]) {
      assert.ok(repo.readText(file).includes(term), `${file} names ${term}`);
    }
  }
  assert.match(gopher.legalNotice.license, /CC BY 3\.0/);
});
