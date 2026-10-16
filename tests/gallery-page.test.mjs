// The gallery page fills prompts in the browser with its own small helpers. They are
// run here, in a sandbox without a DOM, and must agree with the library the CLI uses.

import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import vm from "node:vm";
import { assemblePrompt } from "../scripts/lib/prompt-assembly.mjs";
import { loadRegistry } from "../scripts/lib/registry.mjs";
import { Repository } from "../scripts/lib/repository.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const PAGE = "examples/gallery/index.html";

const repo = new Repository(REPO_ROOT);
const { registry } = loadRegistry(repo);
const html = repo.readText(PAGE);
const data = JSON.parse(/<script type="application\/json" id="inkexplain-data">([\s\S]*?)<\/script>/.exec(html)[1]);

const start = html.indexOf("/* ---- pure helpers");
const end = html.indexOf("/* ---- end pure helpers ---- */");
assert.ok(start !== -1 && end > start, "the page marks its pure helpers");
const helpers = vm.runInNewContext(
  `${html.slice(start, end)}\n({ LIMITS, parseLabels, formatLabels, joinValue, fillPrompt, swatchFor, licenseTone, shortLicense });`,
  {},
);
// Objects built inside the sandbox have another realm's prototypes; compare plain copies.
const plain = (value) => JSON.parse(JSON.stringify(value));

test("parseLabels cleans, clips, and limits what a visitor types", () => {
  assert.deepEqual(plain(helpers.parseLabels("lock A, lock B")), ["lock A", "lock B"]);
  assert.deepEqual(plain(helpers.parseLabels(' lock A , "lock B" ,[waiting], , x ')), ["lock A", "lock B", "waiting", "x"]);
  assert.deepEqual(plain(helpers.parseLabels("a,b,c,d,e,f,g,h")), ["a", "b", "c", "d", "e", "f"]);
  assert.deepEqual(plain(helpers.parseLabels("x".repeat(60))), ["x".repeat(40)]);
  assert.deepEqual(plain(helpers.parseLabels("")), []);
  assert.deepEqual(plain(helpers.parseLabels(null)), []);
  assert.equal(helpers.formatLabels(["lock A", "waiting"]), '["lock A", "waiting"]');
  assert.deepEqual(plain(helpers.LIMITS), { concept: 400, action: 300, label: 40, labels: 6 });
});

test("joinValue drops a value's final period only when the template punctuates after it", () => {
  assert.equal(helpers.joinValue("A thing.", ".\n\nNext"), "A thing");
  assert.equal(helpers.joinValue("Why?", ", caught"), "Why");
  assert.equal(helpers.joinValue("A thing.", " and more"), "A thing.");
  assert.equal(helpers.joinValue("A thing", "."), "A thing");
});

const CASES = [
  {},
  { concept: "Two threads each hold one lock and wait for the other." },
  { concept: "Is a slow consumer the problem?", action: "clamping a key." },
  { concept: "  Spaced   out\n concept  ", action: "  pulling   a lever ", labels: ' lock A , "lock B" ,[waiting], , x ' },
  { concept: "x".repeat(400), action: "y".repeat(300), labels: "a,b,c,d,e,f" },
  { labels: "only labels" },
  { action: "only an action" },
  { concept: "Ends with excitement!", labels: "one" },
];

test("the page fills every archetype's prompt exactly as the library does", () => {
  assert.equal(data.archetypes.length, registry.archetypes.length);
  for (const archetype of data.archetypes) {
    const entry = registry.byId.get(archetype.id);
    for (const values of CASES) {
      const form = { concept: values.concept ?? "", action: values.action ?? "", labels: values.labels ?? "" };
      const page = helpers.fillPrompt(archetype.prompt.template, archetype.prompt.defaults, form);
      const labels = plain(helpers.parseLabels(form.labels));
      const options = {};
      if (form.concept.trim() !== "") options.concept = form.concept;
      if (form.action.trim() !== "") options.action = form.action;
      if (labels.length > 0) options.labels = labels;
      const library = assemblePrompt(repo, entry, options);
      assert.equal(page.text === library.prompt, true, `${archetype.id} with ${JSON.stringify(Object.keys(options))}: page text differs from the library`);
      assert.equal(page.fieldsLeft, library.unfilled.length, `${archetype.id} with ${JSON.stringify(Object.keys(options))}: fields left`);
      assert.equal(page.segments.map((segment) => segment.text).join(""), page.text);
      assert.equal(archetype.prompt.negative, library.negativePrompt, `${archetype.id}: negative prompt`);
      assert.equal(archetype.prompt.aspectRatio, library.aspectRatio, `${archetype.id}: aspect ratio`);
    }
  }
});

test("the page's page-color picker fills a prompt exactly as the library does", () => {
  const offering = data.archetypes.filter((archetype) => archetype.prompt.backgrounds.length > 0);
  assert.deepEqual(offering.map((archetype) => archetype.id), ["littlebox"]);
  for (const archetype of offering) {
    const entry = registry.byId.get(archetype.id);
    const options = { concept: "A queue waits behind one slow worker.", action: "bracing under a heap of coins" };
    const form = { ...options, labels: "" };
    for (const [index, choice] of archetype.prompt.backgrounds.entries()) {
      // The picker's first choice is the default and holds an empty value, as the page builds it.
      const picked = helpers.fillPrompt(archetype.prompt.template, archetype.prompt.defaults, { ...form, background: index === 0 ? "" : choice.phrase });
      const library = assemblePrompt(repo, entry, { ...options, background: choice.name });
      assert.equal(picked.text === library.prompt, true, `${archetype.id} on ${choice.name}: page text differs from the library`);
      assert.equal(picked.fieldsLeft, library.unfilled.length, `${archetype.id} on ${choice.name}: fields left`);
      assert.ok(picked.text.includes(`on a perfectly flat ${choice.phrase}.`), `${archetype.id} on ${choice.name}`);
      assert.ok(!picked.text.includes("@@"), "no placeholder leaks into the prompt");
    }
    // Naming the default phrase explicitly is the same as saying nothing.
    const explicit = helpers.fillPrompt(archetype.prompt.template, archetype.prompt.defaults, { ...form, background: archetype.prompt.defaults.background });
    assert.equal(explicit.text, helpers.fillPrompt(archetype.prompt.template, archetype.prompt.defaults, form).text);
  }
});

test("fillPrompt treats the default page as already chosen, and a picked page as given", () => {
  const littlebox = data.archetypes.find((archetype) => archetype.id === "littlebox");
  const bare = { concept: "", action: "", labels: "" };
  const standard = helpers.fillPrompt(littlebox.prompt.template, littlebox.prompt.defaults, bare);
  assert.ok(standard.text.includes("on a perfectly flat pure white background #FFFFFF."));
  assert.equal(plain(standard.segments).some((segment) => segment.field && /background/.test(segment.text)), false, "the default page is not highlighted as a field to plan");

  const lavender = helpers.fillPrompt(littlebox.prompt.template, littlebox.prompt.defaults, { ...bare, background: "pale lavender background #E6E6FA" });
  assert.deepEqual(plain(lavender.segments).filter((segment) => segment.given).map((segment) => segment.text), ["pale lavender background #E6E6FA"]);
  assert.equal(lavender.fieldsLeft, standard.fieldsLeft, "choosing a page does not change what is left to plan");
  assert.ok(!lavender.text.includes("#FFFFFF"));
});

test("fillPrompt marks bracketed fields and what the visitor gave", () => {
  const archetype = data.archetypes.find((candidate) => candidate.id === "ferris");
  const empty = helpers.fillPrompt(archetype.prompt.template, archetype.prompt.defaults, { concept: "", action: "", labels: "" });
  const marked = plain(empty.segments).filter((segment) => segment.field).map((segment) => segment.text);
  assert.ok(marked.includes("[core idea in one sentence]"));
  assert.ok(marked.includes("[specific physical action]"));
  assert.ok(marked.includes('["label 1", "label 2", "label 3"]'));
  assert.equal(empty.fieldsLeft, marked.length);
  assert.ok(!empty.text.includes("@@"), "no placeholder leaks into the prompt");

  const given = helpers.fillPrompt(archetype.prompt.template, archetype.prompt.defaults, { concept: "An idea.", action: "", labels: "a, b" });
  assert.deepEqual(plain(given.segments).filter((segment) => segment.given).map((segment) => segment.text), ["An idea", '["a", "b"]']);
  assert.equal(given.fieldsLeft, empty.fieldsLeft - 2);
});

test("palette words get a colour, and unknown words get none", () => {
  assert.equal(helpers.swatchFor("explainer blue"), "#2F6FED");
  assert.equal(helpers.swatchFor("highlighter yellow"), "#FFD84D");
  assert.equal(helpers.swatchFor("orange or rust-red"), "#B7410E");
  assert.equal(helpers.swatchFor("pale sky blue"), "#E3F2FD");
  assert.equal(helpers.swatchFor("pale lavender"), "#E6E6FA");
  assert.equal(helpers.swatchFor("pure white"), "#FFFFFF");
  assert.equal(helpers.swatchFor("Black"), "#17181A");
  assert.equal(helpers.swatchFor("iridescent"), null);
  for (const archetype of data.archetypes) {
    for (const name of archetype.style.palette) assert.notEqual(helpers.swatchFor(name), null, `${archetype.id} palette entry "${name}" has a swatch`);
  }
});

test("licence badges: open licences are good, custom terms warn, gated characters are flagged", () => {
  assert.equal(helpers.licenseTone("MIT", "active"), "good");
  assert.equal(helpers.licenseTone("CC0 public-domain dedication", "active"), "good");
  assert.equal(helpers.licenseTone("CC BY 4.0", "active"), "good");
  assert.equal(helpers.licenseTone("No separate character license recorded; the pack text is MIT", "active"), "warn");
  assert.equal(helpers.licenseTone("Free to use and modify with credit to Larry Ewing", "active"), "warn");
  assert.equal(helpers.licenseTone("MIT", "gated-authorized"), "bad");
  assert.equal(helpers.shortLicense("No separate character license recorded; the pack text is MIT"), "No separate character license recorded");
  assert.equal(helpers.shortLicense("Free to use and modify with credit to Larry Ewing and The GIMP when asked"), "Free to use and modify with credit to Larry...");
  assert.equal(helpers.shortLicense("CC BY 4.0"), "CC BY 4.0");
});

test("the page is one offline file with the controls the task asks for", () => {
  assert.equal(html.match(/<meta http-equiv="Content-Security-Policy"/g).length, 1);
  assert.match(html, /default-src 'none'/);
  for (const text of ["Archetype gallery", "Copy Prompt", "Copy Negative Prompt", "Copied!", "Prompt generator preview", "Sample calibration images", "Motion and acting", "License and rights"]) {
    assert.ok(html.includes(text), `the page says "${text}"`);
  }
  for (const id of ["category-chips", "technique-chips", "grid", "detail", "theme", "count", "reset"]) {
    assert.ok(html.includes(`id="${id}"`), `the page has #${id}`);
  }
  for (const text of ['id: "in-background"', "Background (optional)", '"Background"']) {
    assert.ok(html.includes(text), `the page offers the page-color picker (${text})`);
  }
  assert.match(html, /prefers-color-scheme: dark/);
  assert.deepEqual(data.archetypes.map((archetype) => archetype.id), ["ink", "stickman", "xiaohei", "littlebox", "ferris", "seal", "openclaw", "gopher", "tux"]);
  assert.deepEqual(data.categories.map((category) => category.label), ["House style", "Mascot", "Tribute character"]);
  assert.deepEqual(data.techniques, ["Ink sketch", "Marker"]);
});
