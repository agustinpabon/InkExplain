import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { PACK_FILES, PATHS, WORKFLOW_MODULES } from "../scripts/lib/config.mjs";
import { readPngInfo } from "../scripts/lib/images.mjs";
import { assemblePrompt, matchesTemplate, parsePromptPack, scanTemplate } from "../scripts/lib/prompt-assembly.mjs";
import { loadRegistry, packFilePath, referenceImagePath } from "../scripts/lib/registry.mjs";
import { Repository } from "../scripts/lib/repository.mjs";

// A series keeps one recognizable character only if the identity travels with every call: the same bundled picture,
// the same words, and a gate that looks at the result. Real runs broke each of these rules before the wording
// existed (a series whose character grew ears and thick limbs while the agent reported its identity as preserved).
// These tests pin the packaging and the sentences that carry the rules; docs/evaluation.md records the real runs
// behind them, and scripts/audit-series.mjs checks the calls a real run made.
const ROOT = path.resolve(import.meta.dirname, "..");
const repo = new Repository(ROOT);
const { registry } = loadRegistry(repo);
const workflow = (name) => repo.readText(`${PATHS.workflowDir}/${name}`);
const lock = workflow("character-lock.md");
const tools = workflow("image-tools.md");
const gate = workflow("qa-checklist.md");
const delivery = workflow("delivery.md");
const skill = repo.readText(PATHS.skillFile);
const xiaohei = registry.byId.get("xiaohei");
const xiaoheiPrompts = repo.readText(packFilePath(xiaohei, "prompts.md"));
const xiaoheiIdentity = repo.readText(packFilePath(xiaohei, "identity.md"));
const { template } = parsePromptPack(xiaoheiPrompts);

const paragraphOf = (text, name) => text.split(/\n{2,}/).find((paragraph) => paragraph.startsWith(`${name}:`));

// ---- the reference is packaged -----------------------------------------------------------------------------

test("the Xiaohei identity reference ships inside the installable skill, and its path resolves in an installed copy", (t) => {
  // The skills CLI copies the whole skill folder and nothing else, so an installed copy is a copy of that folder.
  const installed = fs.mkdtempSync(path.join(os.tmpdir(), "ie-install-"));
  t.after(() => fs.rmSync(installed, { recursive: true, force: true }));
  fs.cpSync(path.join(ROOT, PATHS.packageDir), installed, { recursive: true });

  const relative = referenceImagePath(xiaohei);
  assert.equal(relative, "references/archetypes/xiaohei/xiaohei.png");
  const file = path.join(installed, ...relative.split("/"));
  const bytes = fs.readFileSync(file);
  assert.deepEqual(readPngInfo(bytes), { width: 181, height: 208 });
  assert.ok(bytes.length < 100 * 1024, "a small reference, not a gallery scene");
  assert.ok(bytes.equals(repo.readBuffer(`${PATHS.packageDir}/${relative}`)), "the installed bytes are the repository's bytes");

  // The routing file inside the install is where an agent learns of it, and the path it gives resolves in the install.
  const routing = fs.readFileSync(path.join(installed, "references", "routing.md"), "utf8");
  const card = routing.slice(routing.indexOf("### Xiaohei"), routing.indexOf("### Ferris"));
  const listed = /- Identity reference: `([^`]+)`/.exec(card)?.[1];
  assert.equal(listed, relative);
  assert.ok(fs.existsSync(path.join(installed, ...listed.split("/"))));
});

test("the reference is a small cropped identity picture, not a gallery scene, and the gallery is not what the lock uses", () => {
  const bytes = repo.readBuffer(`${PATHS.packageDir}/references/archetypes/xiaohei/xiaohei.png`);
  const { width, height } = readPngInfo(bytes);
  assert.ok(width <= 400 && height <= 400, `${width}x${height} is a crop of one figure, not a 16:9 scene`);
  assert.ok(width / height < 1.2, "close to square, not a landscape page");
  // README and gallery images are published samples; the lock's file is packaged beside the pack that uses it.
  assert.ok(!referenceImagePath(xiaohei).startsWith("examples/") && !referenceImagePath(xiaohei).startsWith("assets/"));
  assert.match(repo.readText(packFilePath(xiaohei, "rights.md")), /a crop of one of Ian's own drawings: not a new render, and not an unmodified copy/);
});

test("the rights record names the crop's source, its rectangle, how it was made, and both files' hashes", () => {
  const record = repo.readText(packFilePath(xiaohei, "rights.md"));
  assert.match(record, /09-common-pits-no-title\.png/);
  assert.match(record, /at the commit above/);
  assert.match(record, /crop=181:208:108:385/);
  assert.match(record, /with no scaling and no edit/);
  assert.match(record, /All 112944 color samples of the crop were compared with the source rectangle and none differs/);
  const bundled = repo.readBuffer(`${PATHS.packageDir}/references/archetypes/xiaohei/xiaohei.png`);
  assert.ok(record.includes(`SHA-256 \`${crypto.createHash("sha256").update(bundled).digest("hex")}\``), "the bundled file's SHA-256 is on record");
  assert.match(record, /Never present `xiaohei\.png` as a new illustration or as an InkExplain render/);
});

// ---- the identity is a lock, not a suggestion -----------------------------------------------------------------

test("Xiaohei's silhouette no longer adapts to the job: what is free, locked, and never allowed to change is explicit", () => {
  assert.doesNotMatch(xiaoheiIdentity, /may adapt to the job/);
  assert.doesNotMatch(xiaoheiIdentity, /a funnel, a shadow, a hole/);
  const series = xiaoheiIdentity.slice(xiaoheiIdentity.indexOf("## Series lock"), xiaoheiIdentity.indexOf("## Recognition"));
  for (const free of ["where Xiaohei stands in the frame", "its size", "which way it faces", "its acting", "the angle of its arms and legs", "what it holds, pulls, pushes, or stamps"]) {
    assert.ok(series.includes(free), `free: ${free}`);
  }
  assert.match(series, /\*\*Locked\*\*[^\n]*two plain white dot eyes, about one eighth of the body wide, with no pupils, and no other white on the body; exactly two thin single-stroke legs, about a third as long as the body is tall; at most two thin single-stroke arms; no mouth, ears, tail, or snout/);
  assert.match(series, /\*\*Never allowed to change\*\*: the species[^\n]*the facial anatomy, the number of limbs, the ears \(there are none\), the tail \(there is none\), the body's identity, the eye design, and the drawing style/);
  assert.match(series, /Xiaohei never becomes the prop: if the metaphor needs a funnel, a hole, or a box, draw that object and let Xiaohei work it/);
});

test("the failure modes name the drift a real series showed: ears, shape, limbs, face, and texture", () => {
  for (const drift of ["Cat drift: ears, horns, tufts, or bumps on the head, a tail, a snout or whiskers", "Shape drift", "Limb drift: thick, tapered, doubled, fused, hollow, or extra arms or legs", "Face drift: pupils", "Texture: hatching"]) {
    assert.ok(xiaoheiIdentity.includes(drift), drift);
  }
  assert.match(xiaoheiIdentity, /Two arms raised on either side of the head also read as ears/);
});

test("the Character paragraph fixes the anatomy and says what Xiaohei is not, in words an image model cannot read as a cat", () => {
  const character = paragraphOf(template, "Character");
  for (const phrase of [
    "single solid black body shaped like a smooth rounded dome or bean",
    "perfectly flat, uniform black ink",
    "nothing sticking out of the top or the sides except the limbs",
    "two small round plain white dot eyes",
    "each about one eighth as wide as the body",
    "no pupils, highlights, eyelashes, or eyebrows, and no nose or mouth",
    "a deadpan expression",
    "The two eyes are the only white on the body: no white lines, outlines, or marks",
    "exactly two thin legs, each one single black ink stroke about a third as long as the body is tall",
    "at most two, each one thin single black ink stroke that leaves the body at its side outline and never crosses the front of the black fill",
    "no hands, fingers, gloves, or mittens",
    "Xiaohei is not a cat or any other animal: no ears, no horns, no tufts or bumps on the head, no tail, no snout or whiskers, no fur",
    "Never thick, doubled, fused, hollow, or extra limbs",
  ]) {
    assert.ok(character.includes(phrase), phrase);
  }
  for (const marker of xiaohei.contract.identityMarkers) assert.ok(character.toLowerCase().includes(marker), `registry marker ${marker}`);
});

test("the reference sentence is optional, names its role, and never lets the reference be copied", () => {
  const fields = scanTemplate(template).filter((field) => field.optional);
  assert.equal(fields.length, 1);
  assert.match(fields[0].field, /^Reference sentence: Image 1 is Xiaohei's identity and style reference: draw this exact character in a new pose and scene, and do not copy the reference's pose, props, or layout\.$/);
  assert.equal(fields[0].section, "Character");
});

test("a series of prompts shares one Character paragraph, whatever the scenes, and a repair keeps it", () => {
  const scenes = [
    ["A request enters through one gate.", "holds one gate open for each request"],
    ["Raw data is cleaned before it is stored.", "scrubs each card on a small washboard"],
    ["Two services agree on one contract.", "hands one shared sheet across a narrow gap"],
    ["A slow result is kept close for next time.", "stacks copies of one card on a nearby shelf"],
  ];
  const prompts = scenes.map(([concept, action], index) => assemblePrompt(repo, xiaohei, { concept, action, labels: ["one", "two", `n${index}`] }).prompt);
  const characters = prompts.map((prompt) => paragraphOf(prompt, "Character"));
  assert.equal(new Set(characters).size, 1, "every prompt carries the same Character paragraph, word for word");
  assert.ok(characters[0].includes("[Reference sentence:"), "the sentence is kept or deleted for the whole series, never decided per image");
  assert.equal(new Set(prompts).size, 4, "only the scene differs");

  // Keeping the sentence for every image (brackets removed), or deleting it from every image, is a faithful instance of the template.
  const sentence = scanTemplate(template).find((field) => field.optional).field.replace("Reference sentence: ", "");
  for (const prompt of prompts) {
    assert.deepEqual(matchesTemplate(template, prompt.replace(/\[Reference sentence: ([^\]]*)\]/, "$1").replace(/\[(?!")[^\]\n]*\]/g, "filled")).problems, []);
    assert.deepEqual(matchesTemplate(template, prompt.replace(/ ?\[Reference sentence:[^\]]*\]/, "").replace(/\[(?!")[^\]\n]*\]/g, "filled")).problems, []);
  }
  assert.ok(sentence.startsWith("Image 1 is"), "the attached reference is image 1");

  // A repair adds one Correction paragraph after the Action paragraph and nothing else changes.
  const paragraphs = prompts[0].split(/\n{2,}/);
  const at = paragraphs.findIndex((paragraph) => paragraph.startsWith("Action:"));
  const corrected = [...paragraphs.slice(0, at + 1), "Correction: Xiaohei must match Image 1 exactly. The top of the body is one smooth dome with nothing on it, no ears.", ...paragraphs.slice(at + 1)].join("\n\n");
  assert.equal(paragraphOf(corrected, "Character"), characters[0]);
  assert.equal(corrected.split(/\n{2,}/).length, paragraphs.length + 1);
  assert.ok(xiaoheiPrompts.includes("Correction: Xiaohei must match Image 1 exactly."), "the pack ships the correction form");
});

test("the pack's identity checks cover each thing the real series got wrong, and an unanswerable row fails", () => {
  const checks = xiaoheiPrompts.slice(xiaoheiPrompts.indexOf("### Identity checks"), xiaoheiPrompts.indexOf("## Delivery notes"));
  for (const row of ["| Body |", "| Top of the head |", "| Eyes |", "| Face |", "| Legs |", "| Arms |", "| Line and fill |", "| Size |", "| Page and accents |"]) {
    assert.ok(checks.includes(row), row);
  }
  assert.match(checks, /ears, horns, tufts, bumps/);
  assert.match(checks, /pupils, irises, highlights/);
  assert.match(checks, /thick, tapered, doubled, fused, or hollow legs/);
  assert.match(checks, /A row you cannot answer from the image fails/);
  assert.match(checks, /Generate the image again with `xiaohei\.png` attached and the "Correction for a series" paragraph[^|]*never edit or attach the failed image/);
});

test("every other archetype states what is locked, free, and rejected in a series, in its own terms", () => {
  for (const archetype of registry.archetypes.filter((candidate) => candidate.id !== "xiaohei")) {
    const identity = repo.readText(packFilePath(archetype, "identity.md"));
    const section = identity.slice(identity.indexOf("## Series lock"), identity.indexOf("## Recognition"));
    assert.ok(identity.includes("## Series lock"), `${archetype.id} has a series lock`);
    for (const label of ["**Locked** in a series", "**Free**", "**Rejected**"]) assert.ok(section.includes(label), `${archetype.id}: ${label}`);
  }
  // Their designs differ, and the locks say so: Tux keeps its pupils, Littlebox its tape, Stickman its proportions.
  assert.match(repo.readText(packFilePath(registry.byId.get("tux"), "identity.md")), /large oval eyes with dark pupils and small highlights, the yellow-orange beak/);
  assert.match(repo.readText(packFilePath(registry.byId.get("littlebox"), "identity.md")), /exactly one amber seam tape with its jagged front tab/);
  assert.match(repo.readText(packFilePath(registry.byId.get("stickman"), "identity.md")), /proportions \(5H tall\)/);
});

// ---- the shared method: reference, detection, honesty, gate ----------------------------------------------------

test("SKILL.md routes to the lock and to the repository method, and stays within its limit", () => {
  assert.ok(WORKFLOW_MODULES.includes("character-lock.md") && WORKFLOW_MODULES.includes("repository-explanation.md"));
  assert.match(skill, /references\/workflow\/character-lock\.md/);
  assert.match(skill, /references\/workflow\/repository-explanation\.md/);
  assert.match(skill, /the same bundled identity reference on every call, never an earlier render/);
  assert.match(skill, /Say a reference was attached only if the tool received the file, and an identity was consistent only if you compared the image with it/);
  assert.ok(skill.split("\n").length <= 80);
});

test("the reference is supplied to every call as an actual image input, always the same packaged file", () => {
  assert.match(lock, /On every call, pass the packaged reference through that input, by its absolute path inside this skill's folder/);
  assert.match(lock, /If the tool takes several images, the identity reference goes first, and a second image is added only for a stated purpose/);
  assert.match(lock, /\*\*Always the same file\.\*\* The packaged file, every time\. Never a render: not image 1 for image 2, not "the previous image"/);
  assert.match(lock, /never an option that selects recent images from the conversation \(in Codex, `num_last_images_to_include`\)/);
  assert.match(lock, /Do not count on the tool remembering earlier images either: every call carries the identity itself/);
  assert.match(lock, /copy the reference into the run folder as `identity-reference\.png` \(it is not one of the run's images\), attach the copy, and say so in the report/);
});

test("a path in the prompt text is not an attachment, and a failed attachment is never dropped quietly", () => {
  assert.match(lock, /A path written in the prompt text, a file you opened in a viewer, and a description of the reference are not an attachment/);
  assert.match(lock, /Say "attached" only when the call passed the file through the tool's own image input/);
  assert.match(lock, /do not quietly retry without it and go on as if it were attached/);
  assert.match(tools, /Do not drop the reference and carry on as if it were attached/);
  assert.match(tools, /whether the identity reference was attached and through which input/);
});

test("tool capability is read from the tool's parameters, host by host, and never assumed", () => {
  assert.match(tools, /read the tool's own parameter list, not its name and not this table/);
  assert.match(tools, /Do not assume that a host takes image references, edits images, or keeps an image session because another host does/);
  assert.match(tools, /do not claim a capability you did not see in the tool's definition/);
  assert.match(tools, /\*\*Codex\*\*: `referenced_image_paths`, a list of local file paths\. Checked by InkExplain's own runs/);
  assert.match(tools, /its `num_last_images_to_include` selects recent conversation images, earlier renders among them: never use it for an identity reference/);
  assert.match(tools, /\*\*Cursor\*\*: users report a `reference_image_paths` parameter[^\n]*Not checked here/);
  assert.match(tools, /\*\*Google Antigravity\*\*: in the one transcript InkExplain has seen, `generate_image` took `Prompt`, `ImageName`, `AspectRatio`, and `ImagePaths`, a list of file paths[^\n]*One transcript is not a definition: read the tool's own parameter list/);
  assert.match(tools, /\*\*Any other tool\*\*: whatever its parameters say\. An image-path or reference-image input counts, and a prompt-only tool takes none/);
  assert.match(tools, /A prompt-only tool takes none, so the series runs on the written lock alone and the report says so/);
  assert.match(tools, /Claude Code and Gemini CLI have no built-in generator/);
});

test("with no image input the lock is text-only, and the report says that the reference was not supplied", () => {
  assert.match(lock, /Run the text-only lock: the Character paragraph exactly as the template has it, with the reference sentence deleted from every prompt/);
  assert.match(lock, /"Reference not supplied: the image tool has no image input, so the identity rests on the written lock alone\."/);
  assert.match(lock, /Never describe such a series as reference-guided/);
  assert.match(lock, /A tool that only reads images already in the conversation[^\n]*If you cannot guarantee that, treat the tool as taking no images/);
  assert.match(lock, /\*\*A tool that only edits\*\* an image you give it is not used to draw new scenes from the reference/);
  assert.match(delivery, /"reference not supplied: <why>"/);
});

test("the series gate asks for observations, rejects on one material violation, and cannot pass what it cannot see", () => {
  const section = gate.slice(gate.indexOf("## Series gate"), gate.indexOf("## Iteration moves"));
  assert.match(section, /with what you see, one line per check: "ears: none, the top is one smooth dome", never "ok"/);
  assert.match(section, /A check you cannot answer from the image has failed/);
  assert.match(section, /An image is approved only when every line says what you see and none of them shows a material violation\. One material identity violation fails it, however good the picture is/);
  for (const material of ["a different kind of figure", "pupils, extra or missing eyes, a mouth, brows", "ears, horns, a tail, or a snout", "thick, doubled, fused, or hollow", "a size jump of more than about two times"]) {
    assert.ok(section.includes(material), material);
  }
  assert.match(section, /When you cannot view the images, no check can pass: every image is "unable to verify"/);
  assert.match(section, /never offer file checks or pixel statistics as evidence about anatomy/);
  assert.match(section, /The review is yours: do not call it independent, external, or a second opinion unless another agent or a person looked at the images/);
  assert.match(section, /Compare the images with each other, two at a time/);
});

test("a rejected image is regenerated from the same reference with a correction, in bounded attempts, and the failed image is never the source", () => {
  assert.match(lock, /An identity failure is repaired by generating the image again, not by editing it: the same prompt, the same reference attached, and one `Correction:` paragraph added directly after the Action paragraph/);
  assert.match(lock, /do not attach or edit the failed image: it would carry its mistakes into the new one/);
  assert.match(lock, /at most two repair attempts per image and six per series\. Each repair is another call, so it counts in the run record as a generator call and a new image\. An image that still fails is not approved/);
  assert.match(lock, /Report it as needing repair, with what you saw, and keep it apart from the approved images/);
  assert.match(workflow("editing.md"), /the failed image is not attached/);
  assert.match(workflow("prompt-assembly.md"), /A repair adds one `Correction:` paragraph directly after the Action paragraph and changes nothing else/);
  assert.match(skill, /stop after three attempts on one image/);
});

test("the report separates generated, file verified, visually inspected, identity consistent, needs repair, needs human review, and unable to verify", () => {
  for (const term of ["| Generated |", "| File verified |", "| Visually inspected |", "| Identity consistent |", "| Needs repair |", "| Needs human review |", "| Unable to verify |"]) {
    assert.ok(delivery.includes(term), term);
  }
  assert.match(delivery, /A file check never makes an image consistent\. An image you did not inspect is "unable to verify", whatever the file check says/);
  assert.match(delivery, /"identity reference attached to every call \(`<file>`, through `<input>`\)" or "reference not supplied: <why>"/);
});

test("every pack's tool notes and templates agree with the shared lock about the reference", () => {
  assert.match(xiaoheiPrompts, /attach `xiaohei\.png` through the tool's image input on every call of a series, as `references\/workflow\/character-lock\.md` says/);
  assert.match(repo.readText(packFilePath(registry.byId.get("gopher"), "rights.md")), /the default for a series whenever the image tool takes reference images/);
  for (const archetype of registry.archetypes.filter((candidate) => candidate.referenceImage)) {
    const text = PACK_FILES.map((file) => repo.readText(packFilePath(archetype, file))).join("\n");
    assert.ok(text.includes(archetype.referenceImage), `${archetype.id}'s pack names its reference ${archetype.referenceImage}`);
  }
  for (const archetype of registry.archetypes.filter((candidate) => !candidate.referenceImage)) {
    assert.equal(referenceImagePath(archetype), null, `${archetype.id} bundles none, and the lock then rests on the written paragraph`);
  }
});
