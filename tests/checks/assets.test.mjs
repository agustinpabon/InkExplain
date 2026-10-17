import assert from "node:assert/strict";
import test from "node:test";
import { classifyImage } from "../../scripts/lib/checks/assets.mjs";
import { createFixture, makePng, messages } from "../helpers/fixture.mjs";

test("a valid fixture passes every asset check", (t) => {
  const fixture = createFixture(t);
  for (const result of fixture.run({ only: ["ASSET"] })) assert.equal(result.status, "pass", `${result.id}\n${messages(result)}`);
});

test("classifyImage places images by location", () => {
  assert.deepEqual(classifyImage("examples/gallery/en/demo/01-a.png"), {
    kind: "gallery",
    language: "en",
    archetypeId: "demo",
    name: "01-a.png",
    directory: "examples/gallery/en/demo",
  });
  assert.equal(classifyImage("skills/inkexplain/assets/demo/a.png").kind, "calibration");
  assert.equal(classifyImage("skills/inkexplain/references/archetypes/demo/ref.png").kind, "archetype-reference");
  assert.equal(classifyImage("assets/brand/mark.svg").kind, "brand");
  assert.equal(classifyImage("docs/screenshot.png").kind, "other");
});

test("ASSET-001 rejects broken PNGs, unsafe SVGs, and other formats", (t) => {
  const fixture = createFixture(t);
  fixture.write("examples/gallery/en/demo/02-broken.png", Buffer.from("not a png at all, just text padding"));
  fixture.write("assets/brand/bad.svg", '<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>');
  fixture.write("assets/brand/hero.gif", Buffer.from("GIF89a"));
  const text = messages(fixture.check("ASSET-001"));
  assert.match(text, /02-broken\.png: not a PNG file/);
  assert.match(text, /bad\.svg: SVG contains a <script> element/);
  assert.match(text, /hero\.gif: \.gif images are not supported/);
});

test("ASSET-002 publishes images only for approved archetypes and directories", (t) => {
  const fixture = createFixture(t);
  fixture.write("examples/gallery/en/guarded/01-cat.png", makePng());
  fixture.write("examples/gallery/en/ink/01-sketch.png", makePng());
  fixture.write("examples/gallery/zh/demo/01-demo.png", makePng());
  fixture.write("examples/gallery/en/demo/Bad Name.png", makePng());
  fixture.write("examples/gallery/en/ghost/01-x.png", makePng());
  fixture.write("examples/loose.png", makePng());
  const text = messages(fixture.check("ASSET-002"));
  assert.match(text, /guarded\/01-cat\.png: archetype guarded public samples are withheld/);
  assert.match(text, /ink\/01-sketch\.png: archetype ink public samples are pending/);
  assert.match(text, /zh\/demo\/01-demo\.png: examples\/gallery\/zh\/demo is not an approved sample directory/);
  assert.match(text, /Bad Name\.png: gallery files are named NN-kebab-slug\.png/);
  assert.match(text, /ghost\/01-x\.png: folder ghost does not match any archetype id/);
  assert.match(text, /examples\/loose\.png: images belong in/);
});

test("ASSET-002 treats package calibration folders like gallery folders", (t) => {
  const fixture = createFixture(t);
  fixture.write("skills/inkexplain/assets/demo/01-calibration.png", makePng());
  assert.match(messages(fixture.check("ASSET-002")), /skills\/inkexplain\/assets\/demo is not an approved sample directory/);
  fixture.updateRegistry((data) => data.archetypes[1].sampleGates.directories.push("skills/inkexplain/assets/demo"));
  assert.equal(fixture.check("ASSET-002").status, "pass");
});

const MANIFEST = "examples/gallery/provenance.json";

test("ASSET-003 passes when every published image is recorded and unchanged, and when nothing is published", (t) => {
  assert.equal(createFixture(t).check("ASSET-003").status, "pass");
  const empty = createFixture(t).remove("examples/gallery/en/demo").remove(MANIFEST);
  assert.equal(empty.check("ASSET-003").status, "pass", "no published samples, so nothing to explain");
});

test("ASSET-003 needs a manifest as soon as anything is published, and reports a broken one", (t) => {
  const fixture = createFixture(t).remove(MANIFEST);
  assert.match(messages(fixture.check("ASSET-003")), /provenance\.json: missing; every published sample needs a recorded source/);
  fixture.write(MANIFEST, "{ not json");
  assert.match(messages(fixture.check("ASSET-003")), /provenance\.json: \$: invalid JSON/);
  fixture.write(MANIFEST, JSON.stringify({ schemaVersion: 1, sets: [{ directory: "examples/gallery/en/demo", origin: "found online", files: {} }] }));
  assert.match(messages(fixture.check("ASSET-003")), /sets\[0\]\.origin: must be one of historical, inkexplain/);
});

test("ASSET-003 catches a changed copy, an unrecorded image, a missing one, and a set with no images", (t) => {
  const fixture = createFixture(t);
  fixture.write("examples/gallery/en/demo/01-demo-scene.png", makePng(6, 5));
  fixture.write("examples/gallery/en/demo/02-extra.png", makePng());
  fixture.write("examples/gallery/zh/demo/01-other.png", makePng());
  const manifest = JSON.parse(fixture.read(MANIFEST));
  // The manifest stays valid, so ASSET-003 reports what is wrong with the images: every file has its record.
  const item = structuredClone(manifest.sets[0].items["01-demo-scene.png"]);
  manifest.sets[0].files["03-gone.png"] = "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391";
  manifest.sets[0].items["03-gone.png"] = item;
  manifest.sets.push({
    ...structuredClone(manifest.sets[0]),
    directory: "examples/gallery/en/ghost",
    files: { "01-x.png": "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391" },
    items: { "01-x.png": item },
  });
  fixture.write(MANIFEST, JSON.stringify(manifest));
  const text = messages(fixture.check("ASSET-003"));
  assert.match(text, /en\/demo\/01-demo-scene\.png: differs from the copy on record \(git blob [0-9a-f]{10}\.\.\.\); an edited image is not a copy/);
  assert.match(text, /en\/demo\/02-extra\.png: is not listed in the provenance manifest/);
  assert.match(text, /en\/demo\/03-gone\.png: is listed in the provenance manifest but the image is missing/);
  assert.match(text, /examples\/gallery\/zh\/demo: published samples have no set in examples\/gallery\/provenance\.json/);
  assert.match(text, /provenance\.json: describes examples\/gallery\/en\/ghost, which has no gallery images/);
});

test("ASSET-003 accepts a copy of another project's files once its hash and source are recorded", (t) => {
  const fixture = createFixture(t);
  const manifest = JSON.parse(fixture.read(MANIFEST));
  const [name, hash] = Object.entries(manifest.sets[0].files)[0];
  manifest.sets[0] = {
    directory: manifest.sets[0].directory,
    origin: "historical",
    source: {
      project: "Example Illustrations",
      repository: "https://github.com/example/example-illustrations",
      commit: "30a9d4e05124fda05356acb679fa2989ed5cb51c",
      path: "examples/images",
      license: "MIT",
      copyright: "Copyright (c) 2026 Example",
      firstPublished: "2026-06-15",
    },
    files: { [name]: hash },
  };
  fixture.write(MANIFEST, JSON.stringify(manifest));
  assert.equal(fixture.check("ASSET-003").status, "pass");
});

/** The fixture's published set, recorded as copies of another project's images first published on `firstPublished`. */
function copiesPublishedOn(fixture, firstPublished) {
  const manifest = JSON.parse(fixture.read(MANIFEST));
  const [name, hash] = Object.entries(manifest.sets[0].files)[0];
  manifest.sets[0] = {
    directory: manifest.sets[0].directory,
    origin: "historical",
    source: {
      project: "Example Illustrations",
      repository: "https://github.com/example/example-illustrations",
      commit: "30a9d4e05124fda05356acb679fa2989ed5cb51c",
      path: "examples/images",
      license: "MIT",
      copyright: "Copyright (c) 2026 Example",
      firstPublished,
    },
    files: { [name]: hash },
  };
  fixture.write(MANIFEST, JSON.stringify(manifest));
  return fixture;
}

const reviewedOn = (fixture, date) => fixture.updateRegistry((data) => (data.archetypes[1].sampleGates.date = date));

test("ASSET-004 flags a review dated before, or on the day of, the publication of the copies it approves", (t) => {
  // The fixture's gate says 2026-01-02, long before the copies below were published upstream.
  const early = copiesPublishedOn(createFixture(t), "2026-06-15");
  assert.match(
    messages(early.check("ASSET-004")),
    /registry\.json: archetype demo records a review on 2026-01-02, but examples\/gallery\/en\/demo holds copies first published by Example Illustrations on 2026-06-15; review the copies and record the day you did/,
  );
  assert.equal(early.check("ASSET-004").status, "fail");
  assert.equal(reviewedOn(early, "2026-06-15").check("ASSET-004").status, "fail", "the day of publication is not a review either");
  assert.equal(reviewedOn(early, "2026-06-16").check("ASSET-004").status, "pass", "a review after the publication is possible");
});

test("ASSET-004 leaves InkExplain renders, pending gates, and a missing manifest to the other checks", (t) => {
  assert.equal(createFixture(t).check("ASSET-004").status, "pass", "the fixture's set is an InkExplain render, reviewed by its author");
  const pending = copiesPublishedOn(createFixture(t), "2026-06-15").updateRegistry((data) => {
    data.archetypes[1].sampleGates = { status: "pending", decision: "Not reviewed yet.", directories: [] };
  });
  assert.equal(pending.check("ASSET-004").status, "pass", "a pending gate records no review");
  const missing = createFixture(t).remove(MANIFEST);
  assert.equal(missing.check("ASSET-004").status, "pass", "ASSET-003 reports the missing manifest");
});
