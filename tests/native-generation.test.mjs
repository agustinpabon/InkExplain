import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateGeneratedImage } from "../scripts/lib/generated-image.mjs";
import { main as verifyMain } from "../scripts/verify-image.mjs";
import { PATHS } from "../scripts/lib/config.mjs";
import { parseFrontmatter } from "../scripts/lib/markdown.mjs";
import { Repository } from "../scripts/lib/repository.mjs";
import { makePng } from "./helpers/fixture.mjs";

// A request for images must reach the host's own image tool, and a path may be reported only for a real image.
// Why: the Xiaohei skill this one grew from says "use the built-in image_gen, one image per call" and nothing
// else, and it generates. InkExplain used to describe image tools in the abstract and let an agent conclude
// "no tool" from a missing API key, which sent explicit requests to Prompt mode. These tests pin the wording
// that fixes that; docs/evaluation.md records the host runs behind it.
const repo = new Repository(path.resolve(import.meta.dirname, ".."));
const skill = repo.readText(PATHS.skillFile);
const tools = repo.readText("skills/inkexplain/references/workflow/image-tools.md");
const { description } = parseFrontmatter(skill).data;

test("an explicit request for images is routed to Generate mode, and the description says what it generates", () => {
  assert.match(skill, /\| Generate \| the user wants images \("generate", "create", "make", "illustrate"\) and a raster image tool is callable/);
  assert.match(skill, /A request for images means Generate mode/);
  for (const phrase of ["hand-drawn explanatory illustrations", "generate 2 illustrations explaining X", "make 3 illustrations for", "built-in image tool", "$imagegen", "GenerateImage"]) {
    assert.ok(description.includes(phrase), `the description says ${phrase}`);
  }
  assert.ok(skill.split("\n").length <= 80, "SKILL.md stays within 80 lines");
});

test("Prompt mode is not chosen because InkExplain bundles no generator or because no API key is set", () => {
  assert.match(skill, /Do not pick Prompt mode because InkExplain bundles no generator, because no key is set, or before you have looked at the tools you can call/);
  assert.doesNotMatch(skill, /does not include an image generator/);
  assert.match(tools, /An absent key never means an absent tool/);
  assert.match(tools, /Needs no `OPENAI_API_KEY`/);
});

test("in Codex the built-in image_gen tool is reached through $imagegen, one call per image, and copied into the workspace", () => {
  assert.match(tools, /built-in `image_gen` tool, normally reached through the installed `\$imagegen` skill/);
  assert.match(tools, /One image, one call/);
  assert.match(tools, /\$CODEX_HOME\/generated_images/);
  assert.match(tools, /Copy the chosen image into the output folder/);
  assert.match(tools, /keep the original where it is/);
});

test("a tool is found by looking at the callable tools, and a skill file, a display helper, or drawing code is not one", () => {
  assert.match(tools, /Read the whole list of tools you can call right now: built-in tools and every `mcp__<server>__<tool>` name/);
  assert.match(tools, /The built-in one being absent does not end the search: a connected tool counts/);
  assert.match(tools, /a skill file by itself, a missing API key, a display helper \(`view_image`, `generatedImage`\), and drawing code/);
  assert.match(tools, /If, after reading every name, none generates images, you do not have one\. If one does, call it: do not choose Prompt mode first/);
});

test("hosts without a built-in generator are named as such, and Prompt mode is the answer when nothing is callable", () => {
  assert.match(tools, /Claude Code and Gemini CLI have no built-in generator/);
  assert.match(tools, /otherwise use Prompt mode/);
  assert.match(tools, /Cursor \(Agent, 2\.4 or later\) \| `GenerateImage`/);
});

test("a failed or refused generation is reported, retried once, and never replaced by a drawing or an invented path", () => {
  assert.match(tools, /retry that image once, with the same prompt/);
  assert.match(tools, /switch the remaining images to Prompt mode, say why/);
  assert.match(tools, /Never replace a failed image with your own drawing, with code, or with a path you did not create/);
  assert.match(tools, /A path you did not list is not a path you may report/);
});

test("there is no automatic paid fallback: the Codex CLI and API route needs the user's explicit request", () => {
  assert.match(tools, /Never run its `scripts\/image_gen\.py` CLI, and never fall back to the API on your own/);
  assert.match(tools, /continue only if the user asks for it/);
  assert.match(tools, /Never install a tool, add a key, or sign in to a service for the user/);
  assert.match(skill, /Never switch to a paid API or key, install a tool, or sign in anywhere on your own/);
});

test("the archetype survives the call: each image is generated from its own assembled prompt, unchanged", () => {
  assert.match(tools, /from that image's own assembled prompt \(`prompt-assembly\.md`\), unchanged/);
  assert.match(tools, /do not wrap the prompt in another template/);
  assert.match(skill, /Each archetype keeps its own identity, style, prompts, and output folder/);
});

// ---- the path an agent reports -------------------------------------------------------------------------

function workspace(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ie-img-"));
  for (const [name, content] of Object.entries(files)) {
    const file = path.join(root, ...name.split("/"));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
  return root;
}
const GOOD = "assets/cache-littlebox/01-fast-lane.png";

test("a real PNG in the output folder is accepted, with its size", () => {
  const root = workspace({ [GOOD]: makePng(640, 360) });
  const result = validateGeneratedImage(root, GOOD);
  assert.deepEqual([result.ok, result.format, result.width, result.height], [true, "png", 640, 360]);
});

test("a path that was never written is refused: no fabricated paths", () => {
  const root = workspace({});
  const result = validateGeneratedImage(root, GOOD);
  assert.equal(result.ok, false);
  assert.match(result.problems[0], /does not exist/);
});

test("placeholders are refused: an empty file, text or SVG renamed .png, and a vector file", () => {
  const root = workspace({
    "assets/a-b/01-empty.png": "",
    "assets/a-b/02-text.png": "this is not an image",
    "assets/a-b/03-svg.png": '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"></svg>',
    "assets/a-b/04-vector.svg": "<svg/>",
    "assets/a-b/05-tiny.png": makePng(4, 3),
  });
  for (const [name, pattern] of [["01-empty.png", /empty/], ["02-text.png", /not a PNG, JPEG, or WebP/], ["03-svg.png", /not a PNG, JPEG, or WebP/], ["04-vector.svg", /file name must look like/], ["05-tiny.png", /implausible size/]]) {
    const result = validateGeneratedImage(root, `assets/a-b/${name}`);
    assert.equal(result.ok, false, name);
    assert.match(result.problems.join(";"), pattern, name);
  }
});

test("paths outside assets/<folder>/ are refused: escapes, absolute paths, the skill folder, and wrong names", () => {
  const root = workspace({ [GOOD]: makePng(640, 360), "skills/inkexplain/01-x.png": makePng(640, 360) });
  for (const reported of ["../assets/a-b/01-x.png", "assets/../../01-x.png", "/etc/01-x.png", "C:/x/01-x.png", "assets\\a-b\\01-x.png", "skills/inkexplain/01-x.png", "assets/a-b/c/01-x.png", "assets/A_B/01-x.png", "assets/a-b/Fast Lane.png", "", "assets/a-b/./01-x.png"]) {
    assert.equal(validateGeneratedImage(root, reported).ok, false, reported);
  }
});

test("a symbolic link is refused, and a wrong extension is reported", (t) => {
  const root = workspace({ [GOOD]: makePng(640, 360), "assets/cache-littlebox/02-as-jpg.jpg": makePng(640, 360) });
  const mismatch = validateGeneratedImage(root, "assets/cache-littlebox/02-as-jpg.jpg");
  assert.equal(mismatch.ok, false);
  assert.match(mismatch.problems.join(";"), /does not match the png content/);
  try {
    fs.symlinkSync(path.join(root, ...GOOD.split("/")), path.join(root, "assets/cache-littlebox/03-link.png"));
  } catch {
    t.skip("symbolic links are not available here");
    return;
  }
  assert.match(validateGeneratedImage(root, "assets/cache-littlebox/03-link.png").problems[0], /symbolic link/);
});

test("the command checks every path and exits 1 when one is not a real image", () => {
  const root = workspace({ [GOOD]: makePng(640, 360) });
  const collect = () => ({ text: "", write(chunk) { this.text += chunk; } });
  const out = collect();
  assert.equal(verifyMain(["--workspace", root, GOOD], out, collect()), 0);
  assert.match(out.text, /^ok {4}assets\/cache-littlebox\/01-fast-lane\.png {2}png 640x360/);
  const bad = collect();
  assert.equal(verifyMain(["--workspace", root, GOOD, "assets/cache-littlebox/02-missing.png"], bad, collect()), 1);
  assert.match(bad.text, /FAIL {2}assets\/cache-littlebox\/02-missing\.png {2}the file does not exist/);
  assert.equal(verifyMain([], collect(), collect()), 2);
});
