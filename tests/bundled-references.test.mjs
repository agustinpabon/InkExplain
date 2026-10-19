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
  // Both Creative Commons licenses ask for a copy of the license or its link with every copy of the work.
  for (const term of [
    "Takuya Ueda",
    "Creative Commons Attribution 3.0",
    "https://creativecommons.org/licenses/by/3.0/",
    "https://creativecommons.org/licenses/by/4.0/",
    "https://github.com/golang-samples/gopher-vector",
  ]) {
    assert.ok(gopher.legalNotice.attributionTerms.includes(term), `the registry names ${term}`);
    for (const file of ["ATTRIBUTIONS.md", "skills/inkexplain/references/archetypes/gopher/rights.md", "skills/inkexplain/references/archetypes/gopher/prompts.md"]) {
      assert.ok(repo.readText(file).includes(term), `${file} names ${term}`);
    }
  }
  assert.match(gopher.legalNotice.license, /CC BY 3\.0/);
});

test("the Xiaohei reference is the crop its rights record describes: same hashes, size, and dimensions, from a recorded source and commit", () => {
  const record = repo.readText("skills/inkexplain/references/archetypes/xiaohei/rights.md");
  const bundled = repo.readBuffer("skills/inkexplain/references/archetypes/xiaohei/xiaohei.png");
  assert.ok(record.includes(`git blob SHA-1 \`${gitBlobSha1(bundled)}\``), "the bundled file is the recorded git blob");
  assert.ok(record.includes(`SHA-256 \`${crypto.createHash("sha256").update(bundled).digest("hex")}\``), "and the recorded SHA-256");
  assert.deepEqual(readPngInfo(bundled), { width: 181, height: 208 });
  assert.match(record, /34803 bytes, 181 x 208 pixels/);
  assert.equal(bundled.length, 34803);

  // The record also names where the crop came from, so anyone can cut it again and compare.
  assert.match(record, /`4102eb807f03bcb6e538a16e8b31b41db8b5b954`/);
  assert.match(record, /git blob SHA-1 `6b2fcb8c5710ea90826ffe73f5729e85b5df57ad`/);
  assert.match(record, /SHA-256 `b14ca58c823e54fa08b4db310cdac19f133d86ae006708527f4b19417391e7f1`/);
  assert.match(record, /1672 x 940 pixels/);
  assert.ok(record.includes("https://github.com/helloianneo/ian-xiaohei-illustrations"));
  assert.match(record, /MIT/);
  assert.match(record, /Copyright \(c\) 2026 Ian/);
});

test("the credit for the crop travels with it: the installed license keeps Ian's line, and the credits describe the crop as a crop", () => {
  assert.match(repo.readText("skills/inkexplain/LICENSE.md"), /Copyright \(c\) 2026 Ian/);
  const attributions = repo.readText("ATTRIBUTIONS.md");
  assert.match(attributions, /`skills\/inkexplain\/references\/archetypes\/xiaohei\/xiaohei\.png` is the archetype's identity reference: a crop of one of Ian's drawings/);
  assert.match(repo.readText("docs/provenance.md"), /`skills\/inkexplain\/references\/archetypes\/xiaohei\/xiaohei\.png` is a crop/);
});
