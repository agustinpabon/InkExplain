import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import {
  CATEGORY_LABELS,
  SAMPLE_LABELS,
  STATUS_LABELS,
  TOKENS,
  buildGalleryData,
  captionOf,
  renderGalleryData,
  sampleImages,
  techniqueOf,
} from "../../scripts/lib/gallery-data.mjs";
import { CATEGORIES, STATUSES, loadRegistry, packFilePath } from "../../scripts/lib/registry.mjs";
import { Repository } from "../../scripts/lib/repository.mjs";
import { FIXTURE_BACKGROUND, makePng, createFixture } from "../helpers/fixture.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "../..");

function load(root) {
  const repo = new Repository(root);
  return { repo, registry: loadRegistry(repo).registry };
}

test("every category and status has a label, so the page never shows a raw id", () => {
  for (const id of Object.keys(CATEGORIES)) assert.ok(CATEGORY_LABELS[id], `category ${id}`);
  for (const id of Object.keys(STATUSES)) assert.ok(STATUS_LABELS[id], `status ${id}`);
  assert.deepEqual(Object.keys(SAMPLE_LABELS), ["approved", "pending", "withheld"]);
});

test("techniqueOf reads the style sheet: marker work is Marker, everything else Ink sketch", () => {
  const sheet = (medium, linework) => ({ styleSheet: { medium, linework } });
  assert.equal(techniqueOf(sheet("Bold rough marker illustration", "Thick, rough black marker")), "Marker");
  assert.equal(techniqueOf(sheet("A drawing", "Chunky brush-pen strokes")), "Marker");
  assert.equal(techniqueOf(sheet("A drawing", "Dry-brush texture")), "Marker");
  assert.equal(techniqueOf(sheet("A sparse hand-drawn article sketch", "Rough black linework")), "Ink sketch");
  assert.equal(techniqueOf(sheet("An explainer's hand-drawn ink sketch", "Medium-thin black ink")), "Ink sketch");
});

test("captionOf turns a sample file name into a caption", () => {
  assert.equal(captionOf("01-two-breakpoints.png"), "Two breakpoints");
  assert.equal(captionOf("08-trust-bridge.png"), "Trust bridge");
  assert.equal(captionOf("demo.png"), "Demo");
});

test("buildGalleryData lists archetypes in registry order with their facets", (t) => {
  const { repo, registry } = load(createFixture(t).root);
  const data = buildGalleryData(repo, registry);
  assert.deepEqual(data.archetypes.map((archetype) => archetype.id), ["ink", "demo", "guarded"]);
  assert.equal(data.defaultArchetype, "ink");
  assert.deepEqual(data.archetypes.map((archetype) => archetype.isDefault), [true, false, false]);
  assert.deepEqual(data.categories, [
    { id: "house-style", label: "House style" },
    { id: "mascot", label: "Mascot" },
    { id: "tribute-character", label: "Tribute character" },
  ]);
  assert.deepEqual(data.techniques, ["Ink sketch"]);
  assert.deepEqual(data.statuses.map((status) => status.id), ["active", "experimental", "gated-authorized"]);
  const demo = data.archetypes[1];
  assert.equal(demo.outputFolder, "assets/<article-slug>-demo/");
  assert.deepEqual(demo.legal, {
    credit: "Demo Crab by Example Author",
    rightsHolder: "Example Author",
    license: "CC0",
    restrictions: ["No logos."],
    thirdParty: true,
  });
  assert.deepEqual(demo.motion.signatureActions, ["pinch", "scuttle", "sort"]);
  assert.deepEqual(demo.style.palette, ["coral orange"]);
});

test("only approved samples are listed, relative to the page, with their language", (t) => {
  const fixture = createFixture(t);
  // A stray image in a withheld archetype's folder must never reach the page.
  fixture.write("examples/gallery/en/guarded/01-leak.png", makePng());
  fixture.write("examples/gallery/zh/demo/02-second-scene.png", makePng());
  fixture.write("examples/gallery/en/demo/notes.txt", "not an image");
  fixture.updateRegistry((data) => data.archetypes[1].sampleGates.directories.push("examples/gallery/zh/demo"));
  const { repo, registry } = load(fixture.root);
  const data = buildGalleryData(repo, registry);
  assert.deepEqual(data.archetypes[1].samples.images, [
    { src: "en/demo/01-demo-scene.png", caption: "Demo scene", language: "en" },
    { src: "zh/demo/02-second-scene.png", caption: "Second scene", language: "zh" },
  ]);
  assert.deepEqual(data.archetypes[0].samples, { status: "pending", decision: "No samples in this fixture yet.", images: [] });
  assert.equal(data.archetypes[2].samples.status, "withheld");
  assert.deepEqual(data.archetypes[2].samples.images, []);
  assert.deepEqual(sampleImages(repo, registry.byId.get("guarded")), []);
});

test("each archetype carries a prompt template with the page's placeholders and its own negative prompt", (t) => {
  const { repo, registry } = load(createFixture(t).root);
  const data = buildGalleryData(repo, registry);
  for (const archetype of data.archetypes) {
    assert.equal(archetype.prompt.aspectRatio, "16:9", archetype.id);
    for (const token of [TOKENS.concept, TOKENS.action, TOKENS.labels]) {
      assert.ok(archetype.prompt.template.includes(token), `${archetype.id} ${token}`);
    }
    assert.ok(!archetype.prompt.template.includes(TOKENS.background), `${archetype.id} offers no page color, so its template has no background token`);
    assert.match(archetype.prompt.template.split("\n")[0], /^Draw one idea with /, archetype.id);
    assert.deepEqual(archetype.prompt.defaults, {
      concept: "[core idea in one sentence]",
      action: "[specific physical action]",
      labels: '["label 1", "label 2", "label 3"]',
      background: null,
    });
    assert.deepEqual(archetype.prompt.backgrounds, [], archetype.id);
    assert.equal(archetype.style.background, null, archetype.id);
    assert.ok(archetype.prompt.negative.length > 20, archetype.id);
  }
  const [ink, demo] = data.archetypes;
  assert.doesNotMatch(ink.prompt.template, /Rights note/);
  assert.match(demo.prompt.template, /^Rights note: .*Credit: Demo Crab by Example Author\./m);
  assert.ok(demo.prompt.negative.startsWith("logos"), "the avoid list leads");
});

test("an archetype that offers a page color gets a background token, its default, and the choices", (t) => {
  const fixture = createFixture(t);
  fixture.updateRegistry((data) => (data.archetypes[1].styleSheet.background = structuredClone(FIXTURE_BACKGROUND)));
  fixture.rewritePack("demo");
  const { repo, registry } = load(fixture.root);
  const [ink, demo] = buildGalleryData(repo, registry).archetypes;

  assert.ok(demo.prompt.template.includes(`flat ${TOKENS.background}.`), "the field became the page placeholder");
  assert.doesNotMatch(demo.prompt.template, /#FFFFFF|\[pure white/, "no default is baked into the template, so a visitor's pick can replace it");
  assert.equal(demo.prompt.defaults.background, "pure white background #FFFFFF");
  assert.deepEqual(demo.prompt.backgrounds.map((choice) => choice.phrase), [
    "pure white background #FFFFFF",
    "warm off-white background #FFFCF5",
    "pale sky blue background #E3F2FD",
    "pale lavender background #E6E6FA",
  ]);
  assert.deepEqual(demo.style.background, {
    default: { name: "pure white", hex: "#FFFFFF" },
    presets: [
      { name: "warm off-white", hex: "#FFFCF5" },
      { name: "pale sky blue", hex: "#E3F2FD" },
      { name: "pale lavender", hex: "#E6E6FA" },
    ],
  });
  assert.equal(ink.style.background, null);
  assert.deepEqual(ink.prompt.backgrounds, []);
});

test("the shipped gallery data gives Littlebox, and only Littlebox, a page color with pure white first", () => {
  const { repo, registry } = load(REPO_ROOT);
  const data = buildGalleryData(repo, registry);
  const withChoice = data.archetypes.filter((archetype) => archetype.prompt.backgrounds.length > 0);
  assert.deepEqual(withChoice.map((archetype) => archetype.id), ["littlebox"]);
  const [littlebox] = withChoice;
  assert.equal(littlebox.prompt.backgrounds[0].hex, "#FFFFFF");
  assert.equal(littlebox.style.background.default.name, "pure white");
  assert.ok(littlebox.prompt.template.includes(`flat ${TOKENS.background}.`));
  assert.deepEqual(littlebox.style.palette, ["black", "amber", "coral", "pure white"]);
  assert.doesNotMatch(`${littlebox.summary} ${littlebox.style.canvas}`, /E3F2FD|E6E6FA|lavender|sky/i, "the default is not described as blue or lavender");
});

test("a pack that drops a shared field fails the build with the file named", (t) => {
  const fixture = createFixture(t);
  const { registry } = load(fixture.root);
  const demo = registry.byId.get("demo");
  fixture.replace(packFilePath(demo, "prompts.md"), 'Labels: ["label 1", "label 2", "label 3"].', "Labels: none.");
  const { repo } = load(fixture.root);
  assert.throws(
    () => buildGalleryData(repo, registry),
    (error) => {
      assert.match(error.message, /demo\/prompts\.md: the generation prompt lacks the \["label 1", "label 2", "label 3"\] field/);
      return true;
    },
  );
  fixture.remove(packFilePath(demo, "prompts.md"));
  assert.throws(() => buildGalleryData(load(fixture.root).repo, registry), /demo\/prompts\.md is missing/);
});

test("renderGalleryData embeds JSON that cannot end its script element", () => {
  // Built from char codes so no raw separator appears in this source file.
  const separators = String.fromCharCode(0x2028, 0x2029);
  const data = { note: "</script><script>alert(1)</script> <!-- x -->", line: `a${separators[0]}b${separators[1]}c`, ok: "fine > & ' \"" };
  const block = renderGalleryData(data);
  assert.ok(block.startsWith('<script type="application/json" id="inkexplain-data">\n'));
  assert.ok(block.endsWith("\n</script>"));
  const inner = block.slice(block.indexOf(">") + 1, block.lastIndexOf("</script>"));
  assert.ok(!inner.includes("<"), "no raw < inside the block");
  assert.ok(!separators.split("").some((separator) => inner.includes(separator)), "no raw line separators");
  assert.deepEqual(JSON.parse(inner), data, "the escapes round-trip");
  assert.equal(renderGalleryData(data), block, "deterministic");
});

test("the shipped gallery data covers every archetype, and every listed image exists", () => {
  const { repo, registry } = load(REPO_ROOT);
  const data = buildGalleryData(repo, registry);
  assert.deepEqual(data.archetypes.map((archetype) => archetype.id), registry.archetypes.map((archetype) => archetype.id));
  assert.equal(data.archetypes.length, 8);
  for (const archetype of data.archetypes) {
    const entry = registry.byId.get(archetype.id);
    if (archetype.samples.status !== "approved") {
      assert.deepEqual(archetype.samples.images, [], `${archetype.id} publishes nothing while samples are ${archetype.samples.status}`);
      continue;
    }
    assert.ok(archetype.samples.images.length > 0, archetype.id);
    for (const image of archetype.samples.images) {
      const file = path.posix.join("examples/gallery", image.src);
      assert.ok(repo.isFile(file), `${archetype.id}: ${file}`);
      assert.ok(entry.sampleGates.directories.includes(path.posix.dirname(file)), `${archetype.id}: ${file} sits in an approved directory`);
    }
  }
  assert.deepEqual(
    data.archetypes.filter((archetype) => archetype.samples.images.length > 0).map((archetype) => archetype.id),
    ["xiaohei", "littlebox", "ferris", "seal", "openclaw", "gopher"],
  );
  const xiaohei = data.archetypes.find((archetype) => archetype.id === "xiaohei").samples.images.map((image) => image.src);
  assert.equal(xiaohei.filter((src) => src.startsWith("en/xiaohei/")).length, 8, "Xiaohei ships the English-labeled set");
  assert.equal(xiaohei.filter((src) => src.startsWith("zh/xiaohei/")).length, 8, "Xiaohei ships the Chinese-labeled set");
});
