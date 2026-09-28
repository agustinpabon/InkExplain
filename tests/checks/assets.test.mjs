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
