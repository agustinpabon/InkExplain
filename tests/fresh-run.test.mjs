import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { main } from "../scripts/audit-run.mjs";
import { IMAGE_VERDICTS, PATHS, REPAIR_LIMITS, REVIEWERS, RUN_COUNT_FIELDS, RUN_FOLDER_PATTERN } from "../scripts/lib/config.mjs";
import { Repository } from "../scripts/lib/repository.mjs";
import { auditRun, manifestProblems, packIdentityChecks, snapshotFolder } from "../scripts/lib/run-audit.mjs";
import { imageToolCalls } from "../scripts/lib/series-audit.mjs";

// A repeated request in Google Antigravity opened four images that an earlier run had left in the output folder,
// made one new image-generation call, saved the new image beside them, delivered all five as one new explanation,
// and called the four old ones "identity consistent". These tests pin the rules that stop that (each Generate
// request is a fresh run in its own folder, an image counts as new only when a call of this run made it, and a
// verdict is conservative), and read run folders the way scripts/audit-run.mjs does, so that an old image cannot
// pass as a new one. docs/evaluation.md records what real runs showed.
//
// The next request in Antigravity made five new images in a fresh run folder, and the record was right about
// everything but the pictures: two had a white band across the black body, two had scribbles in it, and all five
// were "identity consistent", with nothing on record about what had been seen. And a Codex run made eight repairs
// where the limit is six, without saying so. The tests from "the review is recorded before the verdict" on pin the
// rules for that and read records like those two: an approval with nothing behind it, and repairs past their limit,
// fail.
const repo = new Repository(path.resolve(import.meta.dirname, ".."));
const workflow = (name) => repo.readText(`${PATHS.workflowDir}/${name}`);
const delivery = workflow("delivery.md");
const gate = workflow("qa-checklist.md");
const lock = workflow("character-lock.md");
const skill = repo.readText(PATHS.skillFile);

test("every Generate request is a fresh run in its own folder, and what an earlier run left there is never touched, rated, or delivered", () => {
  assert.match(delivery, /Every Generate or Edit request is a new run with its own folder, `assets\/<article-slug>-<suffix>\/run-<id>\/`/);
  assert.match(delivery, /Never delete, overwrite, move, or rename them, and do not open, review, rate, or deliver them/);
  assert.match(delivery, /They never count as images generated now/);
  assert.match(delivery, /Fresh generation is the default for "generate", "illustrate", and "explain visually", also when the folder already exists and when the request repeats an earlier one/);
  assert.match(delivery, /do not stop after one call because earlier images already cover the topic/);
  assert.match(delivery, /The run folder holds the images, `prompts\.md`, `manifest\.json`/);
  assert.match(skill, /Every Generate request is a fresh run in a new folder, `assets\/<article-slug>-<suffix>\/run-<id>\/`: what earlier runs left in the archetype's folder is not opened, rated, or delivered unless the user asked to reuse it/);
  assert.match(skill, /Write only to the new run folder, `assets\/<article-slug>-<suffix>\/run-<id>\/`, or to a folder the user names inside the workspace, and never delete, move, or overwrite what exists/);
  assert.match(lock, /A series is the images this run generated, and nothing else/);
  assert.match(lock, /Every image of the request is generated in this run\. Do not stop after one call because earlier images already show the topic, and do not fill the series with them/);
  assert.match(gate, /The series is the images this run generated and nothing else: earlier output in the archetype's folder is not part of it, and you do not open it, rate it, or let it carry the result/);
  const id = /as in `(run-\d{8}-\d{6}-[0-9a-f]{4})`/.exec(delivery)?.[1];
  assert.ok(id && RUN_FOLDER_PATTERN.test(id), "the method's example id has the format the script reads");
});

test("reusing earlier images needs the user's words, is labeled, and is never counted as generated now", () => {
  assert.match(delivery, /Reuse earlier images only when the user asks for it in words: reuse, continue, add to, or edit them/);
  assert.match(delivery, /every place that shows it says "reused, not generated in this run"/);
  assert.match(delivery, /An edit is a new generation: its result is a new file in this run, with the earlier image as its source/);
  assert.match(delivery, /An image you did not generate in this run is "reused", never "generated"/);
  assert.match(skill, /Generation is fresh by default: an image counts as new only if you called the image tool for it in this run, and what an earlier run left in a folder never does\. Reuse earlier images only when the user asks, and label them reused/);
});

test("the run record names the call behind each new image, and its example is valid input for the script that reads it", () => {
  const section = delivery.slice(delivery.indexOf("## The run record"), delivery.indexOf("## Repository explanations"));
  const example = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(section)[1].replace(/<[^>"]*>/g, "x").replace(/"sha256": "x"/, '"sha256": null'));
  assert.deepEqual(manifestProblems(example, example.run), [], "the example in delivery.md has every field the script requires");
  const table = section.slice(section.indexOf("| Count |"));
  for (const field of RUN_COUNT_FIELDS) assert.ok(table.includes(`\`${field}\``), `the counts table names ${field}`);
  assert.match(section, /A file that is merely in a folder, however recent its date or whatever its hash, is not evidence of a call\. If you cannot quote what the tool returned for an image, the image is not "generated"/);
  assert.match(section, /It identifies a file\. It never shows that a tool made it/);
  assert.match(section, /`destination` is where you saved the file, from the workspace, inside the run folder/);
  assert.match(section, /`new_images` plus `reused_images` always equals `accepted_images` plus `failed_images` plus `held_images`, and `new_images` never exceeds `generator_calls`/);
  assert.match(section, /Never fill the counts in from the files you find in a folder/);
  assert.match(section, /With none, the counts are your own, and the report says so/);
  assert.match(section, /`reference` is `attached` only when that call passed the packaged identity reference through the tool's image input/);
});

test("the four verdicts of the method are the four the script knows, and a qualifier is not a verdict", () => {
  const section = delivery.slice(delivery.indexOf("| Verdict |"), delivery.indexOf("## Delivery report"));
  const rows = [...section.matchAll(/^\| ([A-Z][a-z ]+) \| (?!It means)/gm)].map((match) => match[1].toLowerCase());
  assert.deepEqual(rows, [...IMAGE_VERDICTS], "delivery.md lists the same verdicts, in the same order, as the script");
  assert.match(section, /Say the verdict as one of these four phrases, with no qualifier: "identity consistent \(slight variation\)" is not a verdict, and an image that needs a qualifier is not consistent/);
  assert.match(delivery, /Call a series consistent only when the final image of every scene is accepted\. Otherwise say how many scenes passed and how many did not, name the defect of each that did not, list the rejected attempts, and never describe the run as a successful consistency check/);
  assert.match(delivery, /The counts you give must agree with the calls you made/);
});

test("approval is conservative: a flaw you saw fails the image, a doubt holds it, and neither is softened into a pass", () => {
  const section = gate.slice(gate.indexOf("Approve conservatively."), gate.indexOf("When you cannot view the images"));
  assert.match(section, /You are a model looking at a picture, and a model tends to see what it expects/);
  assert.match(section, /\*\*Clearly wrong: reject it\.\*\* If any observation, anywhere in your notes or your reasoning, names a locked feature as present or changed \(points or tufts that read as ears, a mouth, a third arm, a different body\), the image fails\. You cannot approve it afterwards with a caveat/);
  assert.match(section, /\*\*Material doubt: hold it\.\*\* A hedged observation \("seems", "probably", "slightly different"\), or a feature you cannot make out at the size you see, is a check that did not pass\. The verdict is "needs human review"/);
  assert.match(section, /\*\*Cannot view it: "unable to verify"\.\*\*/);
  assert.match(section, /A series whose final image for any scene was rejected, held, or unverified is never reported as a passed consistency check: the report says how many scenes passed and how many did not, and lists every rejected attempt with its defect/);
  assert.match(gate, /When the repairs are spent, the report lists the image as needing repair or needing human review, with what you saw, and never as approved/);
  assert.match(skill, /Approve conservatively: an image you cannot clearly pass is not "identity consistent", and a series with such an image is never reported as a passed consistency check/);
});

test("a reference counts as attached only when the call passed the file through the tool's input, and the report gives the run's counts", () => {
  assert.match(lock, /The words "Image 1" in the prompt, an image you opened earlier in the conversation, and an old render in the output folder are not an attachment either: only the file passed through the input on that call makes it reference-guided, and the run record names the input and the file for every call/);
  assert.match(lock, /Each repair is another call, so it counts in the run record as a generator call and a new image/);
  assert.match(skill, /The reply carries the run's counts and each image's status/);
  assert.match(skill, /Count your image-tool calls and make the counts you report agree with them/);
  assert.match(delivery, /the run folder and its counts in one line, for example "run-20261019-143502-7f3a: 6 image-tool calls, 6 new images, 0 reused, 2 failed, 0 held, 4 accepted", and whether the host keeps a record of the calls that can be opened, or the counts are your own/);
});

test("a JPEG is named as a JPEG, and the tool's own answer says which file a call made", () => {
  assert.match(delivery, /A tool that writes a JPEG gives a `\.jpg` file: never rename it to `\.png`/);
  assert.match(workflow("image-tools.md"), /Copy the image the tool reported for this call, never the newest file in that folder, into this run's folder/);
  assert.match(workflow("image-tools.md"), /If the tool's result asks you not to show the path to the user, keep it in the run record and leave it out of the reply/);
});

test("the review is recorded before the verdict: what was seen, every defect, and who looked, and the checklist says how to look", () => {
  const section = gate.slice(gate.indexOf("## Review one image"), gate.indexOf("## Pass checks"));
  assert.match(section, /A verdict with nothing recorded behind it is not a review/);
  assert.match(section, /The tool's text \(its echo of your prompt, the path it saved\) is not the image, and what you asked for is not what was drawn/);
  assert.match(section, /\*\*Look at the body first\.\*\* Everything inside the character's outline that is not the flat fill \(a line, a stroke, a mark, a texture, a second color\)/);
  assert.match(section, /then each limb where it meets the body, and whether it crosses the body/);
  assert.match(section, /Never "ok", and never the pack's own sentence: a check that repeats the specification describes the specification, not the picture/);
  assert.match(section, /\*\*List the defects\.\*\* A defect is a rule the picture breaks: a locked feature, or a rule of the pack's style or labels, including what the plan never asked for/);
  assert.match(section, /Look for each of them, one by one\. The picture is not approved until you have looked and found none, and an empty list says that you did/);
  assert.match(section, /A matter of degree is not a defect, and goes in the check's answer instead: a leg a little shorter or longer than the reference's, eyes a little smaller, a figure a little larger or smaller than planned, a different lean, a wobble in the outline/);
  assert.match(section, /Degree becomes a defect when the character stops reading as the reference's: stubby legs far shorter than the reference's, pinpoint eyes, a figure twice the size of another image, another body shape/);
  assert.match(section, /A way to make the picture better is not a defect either; a rule it breaks is/);
  assert.match(section, /Any defect: "needs repair"\. A doubt that the picture does not settle at the size you see: "needs human review"/);
  assert.match(section, /Your review is a self-assessment: the agent that made the images is checking its own work/);
  assert.match(section, /Record `reviewed_by` as `self`, and say so in the report/);
  assert.match(section, /It becomes `independent` only when another agent or model, not told your verdict, looked at every final image and the reference and listed the defects it saw \(any defect it lists fails the image, by the same line between a defect and a matter of degree\), and `human` only when the user or another person says they checked/);
  assert.match(gate, /any line, stroke, mark, or texture on a solid body that the reference does not have \(a white band where an arm crosses it, scribbles in the fill\)/);
  assert.match(gate, /A wobble in the outline, a slightly longer leg, a smaller eye, a figure a little larger than planned, or a different lean is not: write it in the check, and let it pass/);
  assert.match(delivery, /`checks` is what you saw, written before the verdict: one entry for each row of the pack's "Identity checks"/);
  assert.match(delivery, /`verdict` is one of the four phrases under "Status of each image", and it follows from `defects`: any listed defect makes it "needs repair"/);
  assert.match(delivery, /A final image whose record lists a defect is not accepted/);
  assert.match(delivery, /`reviewed_by` is `self` when only the agent that made the images looked at them, `independent` when another agent or model that was not told your verdict looked at every final image and the reference, and `human` when the user or another person says they checked\. Write `self` unless the others really happened/);
  assert.match(delivery, /`defects` lists each rule the picture breaks, including what the plan never asked for[^\n]*A matter of degree \(a leg a little shorter, a figure a little larger than planned\) is written in its check and is not a defect, until the character stops reading as the reference's/);
  assert.match(delivery, /A defect you can see \(a white line, stripe, or scribble on a solid body, a mouth, ears, a tail, an extra or fused limb\) makes the image "needs repair" however good the rest is/);
  assert.match(delivery, /who reviewed the images \(`reviewed_by`\) and what that means: a review by the agent that made them is a self-assessment that can miss a defect/);
  assert.match(skill, /open the saved file, write what you see into `checks` and every flaw into `defects` in the run record, and let the verdict follow/);
  assert.match(skill, /A mark, stripe, texture, mouth, ears, tail, or extra or fused limb that you can see fails the image whatever else is right, and your own review is a self-assessment: say so/);
  for (const reviewer of REVIEWERS) assert.ok(delivery.includes(`\`${reviewer}\``) && gate.includes(`\`${reviewer}\``), `${reviewer} is named by both files`);
});

test("the repair limits are one rule everywhere, and the record carries the count that stops a repair", () => {
  assert.equal(REPAIR_LIMITS.perImage, 2);
  assert.equal(REPAIR_LIMITS.perSeries, 6);
  assert.match(lock, /at most two repair attempts per image and six per series/);
  assert.match(lock, /Write the new `used` number before you make a repair call, and make the call only if both limits still hold/);
  assert.match(lock, /When an image has had two repairs, or `repairs\.used` is six, stop: do not make another call to improve it, name the defect that remains and say that the limit was reached, and never raise a limit in the record/);
  assert.match(lock, /A call that returns no image is not a repair: list it under `failed_calls` and retry it once/);
  assert.match(skill, /stop after three attempts on one image and six repairs in the series/);
  assert.match(gate, /After three attempts on the same image \(the first and two repairs\), stop and report the remaining problem instead of looping/);
  assert.match(delivery, /`repairs\.used` is the number of rows that have `repair_of`, and the limits are two repairs for one image and six for the run: write the new number before a repair call/);
  assert.match(delivery, /The most image-tool calls a run may make is `planned_images` plus six repairs plus one retry for each call that returns no image/);
  assert.match(delivery, /`generator_calls` is `new_images` plus the calls listed in `failed_calls`: the calls are numbered 1 to `generator_calls`, each is an image row or a failed call, and none is missing or repeated/);
  assert.match(delivery, /the repairs used \(`repairs\.used` of six\) and, for every image that still fails, the defect you saw and whether the repair limit was reached/);
  const example = JSON.parse(/```json\n([\s\S]*?)\n```/.exec(delivery)[1].replace(/<[^>"]*>/g, "x").replace(/"sha256": "x"/, '"sha256": null'));
  assert.deepEqual(example.repairs, { used: 0, per_image_limit: REPAIR_LIMITS.perImage, series_limit: REPAIR_LIMITS.perSeries }, "the example record states the limits the script enforces");
});

test("a figure is posed so that no limb crosses a solid body, and a repair may move the object to the arm's own side", () => {
  assert.match(lock, /Pose it so that no limb has to cross the front of a solid body: a limb drawn over a solid fill shows as a white line, and that breaks the lock/);
  assert.match(lock, /Put the object on the side of the arm that reaches it, turn the figure toward it, and use one arm when one is enough/);
  assert.match(lock, /A repair may change the pose when the pose caused the fault: an arm that has to cross the body to reach its object is what draws the white line, so put the object on that arm's own side/);
});

// What a run folder looks like on disk, built the way a faithful agent would write it, then broken one thing at a time.
const ARCHETYPE = "assets/example-repo-xiaohei";
const RUN = "run-20261019-143502-7f3a";
const REFERENCE = "references/archetypes/xiaohei/xiaohei.png";
const PACKAGED = "/opt/agent/project/.agents/skills/inkexplain/references/archetypes/xiaohei/xiaohei.png";
const OLD = ["01-old-spine.jpg", "02-old-money.jpg", "03-old-review.jpg", "04-old-books.jpg"];

const sha = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const image = (label) => Buffer.from(`not an image, only bytes that differ: ${label}`);
const statuses = (report) => Object.fromEntries(report.results.map((result) => [result.id, result.status]));
const detail = (report, id) => report.results.find((result) => result.id === id)?.detail ?? "";
const failures = (report) => report.results.filter((result) => result.status === "fail").map((result) => result.id);

function workspace(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ie-run-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}
function put(root, relative, content) {
  const file = path.join(root, ...relative.split("/"));
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  return file;
}
function withOldImages(root) {
  for (const name of OLD) put(root, `${ARCHETYPE}/${name}`, image(name));
}
// What an approved image answers: one entry for each row of the pack's "Identity checks", in the agent's own words.
const CHECKS = Object.fromEntries(packIdentityChecks("xiaohei").map((name) => [name, `${name.toLowerCase()}: two white dots on a flat black dome, nothing else white on the body`]));
// What a rejected attempt records: the defect that was seen, and the verdict that follows from it.
const FAILING = { verdict: "needs repair", accepted: false, defects: ["a white band across the lower body where the arm crosses it"] };

/** The row of the nth new image, as a faithful agent records it; overrides break one field. */
function row(n, overrides = {}) {
  const file = overrides.file ?? `0${n}-new-${n}.jpg`;
  return {
    file,
    origin: "generated",
    call: n,
    tool_result: `Generated image is saved at /opt/host/brain/new_${n}.jpg`,
    source: `/opt/host/brain/new_${n}.jpg`,
    destination: `${ARCHETYPE}/${RUN}/${file}`,
    sha256: sha(image(`new ${n}`)),
    reference: "attached",
    inspected: true,
    checks: CHECKS,
    defects: [],
    verdict: "identity consistent",
    accepted: true,
    ...overrides,
  };
}
/** A run record whose counts are the rows' own; overrides break one field. */
function record(rows, overrides = {}) {
  const fresh = rows.filter((entry) => entry.origin === "generated" || entry.origin === "edited");
  const count = (test) => rows.filter(test).length;
  const repairs = fresh.filter((entry) => entry.repair_of);
  const repaired = new Set(repairs.map((entry) => entry.repair_of));
  const finals = fresh.filter((entry) => !repaired.has(entry.file));
  const failed = overrides.failed_calls ?? [];
  return {
    run: RUN,
    archetype: "xiaohei",
    mode: "generate",
    tool: "generate_image",
    host_call_records: "a transcript the user can open",
    reference: { file: ".agents/skills/inkexplain/references/archetypes/xiaohei/xiaohei.png", input: "ImagePaths", attached_to_every_call: true },
    planned_images: fresh.length - repairs.length,
    repairs: { used: repairs.length, per_image_limit: REPAIR_LIMITS.perImage, series_limit: REPAIR_LIMITS.perSeries },
    reviewed_by: "self",
    images: rows,
    failed_calls: failed,
    series_review: finals.length < 2 ? null : {
      reference_opened: true,
      images_opened: finals.map((entry) => entry.file),
      pairs_compared: finals.slice(1).map((entry, index) => [finals[index].file, entry.file]),
      observations: "the body is a flat black dome in every final image, with two white dots and nothing else white; the limbs are thin single strokes",
      passed: finals.every((entry) => entry.verdict === "identity consistent" && entry.accepted === true),
    },
    counts: {
      generator_calls: fresh.length + failed.length,
      new_images: fresh.length,
      reused_images: count((entry) => entry.origin === "reused"),
      failed_images: count((entry) => entry.verdict === "needs repair"),
      held_images: count((entry) => entry.verdict === "needs human review" || entry.verdict === "unable to verify"),
      accepted_images: count((entry) => entry.verdict === "identity consistent"),
    },
    ...overrides,
  };
}
/** Write the run folder: each new image's file (its bytes default to the row's own), and the record. Returns the folder. */
function writeRun(root, rows, { folder = RUN, contents = {}, overrides = {}, manifest = true } = {}) {
  for (const entry of rows) {
    if (entry.origin === "generated" || entry.origin === "edited") put(root, `${ARCHETYPE}/${folder}/${entry.file}`, contents[entry.file] ?? image(`new ${entry.call}`));
  }
  if (manifest) put(root, `${ARCHETYPE}/${folder}/manifest.json`, JSON.stringify(record(rows, overrides), null, 2));
  return path.join(root, ...`${ARCHETYPE}/${folder}`.split("/"));
}
const calls = (n, references = [PACKAGED]) => imageToolCalls(JSON.stringify(Array.from({ length: n }, (_, index) => ({ prompt: `prompt ${index + 1}`, referenced_image_paths: references }))));
const five = () => [1, 2, 3, 4, 5].map((n) => row(n));

test("a fresh run beside four old images passes, and the old images are exactly as they were", (t) => {
  const root = workspace(t);
  withOldImages(root);
  const before = snapshotFolder(path.join(root, ARCHETYPE));
  assert.deepEqual(before.map((entry) => entry.path), OLD.map((name) => `${ARCHETYPE}/${name}`));
  const folder = writeRun(root, five());
  const report = auditRun(folder, { before, calls: calls(5), exact: true, reference: REFERENCE });
  assert.equal(report.ok, true, JSON.stringify(report.results.filter((result) => result.status === "fail")));
  const status = statuses(report);
  for (const id of ["RUN-FOLDER", "MANIFEST", "FILES", "HASHES", "NOT-OLD", "ORIGINS", "DESTINATION", "VERDICTS", "REVIEW", "REFERENCE", "COUNTS", "REPAIRS", "SERIES", "UNTOUCHED", "CALLS", "ATTACHED", "SAME-FILE", "PACKAGED"]) assert.equal(status[id], "pass", id);
  assert.match(detail(report, "NOT-OLD"), /compared with 4 earlier images/);
  assert.match(detail(report, "COUNTS"), /5 calls, 5 new, 0 reused, 0 failed, 0 held, 5 accepted/);
  for (const name of OLD) assert.deepEqual(fs.readFileSync(path.join(root, ...`${ARCHETYPE}/${name}`.split("/"))), image(name), `${name} is as it was`);
});

test("the reproduced failure is caught: four old images copied into the run, one new call, five images called generated", (t) => {
  const root = workspace(t);
  withOldImages(root);
  const rows = five();
  const contents = Object.fromEntries([1, 2, 3, 4].map((n) => [`0${n}-new-${n}.jpg`, image(OLD[n - 1])]));
  const folder = writeRun(root, rows, { contents });
  const report = auditRun(folder, { calls: calls(1), reference: REFERENCE });
  assert.equal(report.ok, false);
  assert.deepEqual(failures(report).sort(), ["CALLS", "HASHES", "NOT-OLD"], "the copies, the hashes that no longer match the recorded ones, and five images from one call");
  assert.match(detail(report, "NOT-OLD"), /01-new-1\.jpg is byte for byte the earlier image assets\/example-repo-xiaohei\/01-old-spine\.jpg/);
  assert.match(detail(report, "CALLS"), /the record claims 5 image-tool calls, and the log shows 1/);
  assert.match(detail(report, "CALLS"), /5 images are listed as made by a call, and the log shows 1 calls/);
  // Even with every hash rewritten to fit the copies, the old bytes are still found and the calls still do not add up.
  const honestHashes = rows.map((entry, index) => (index < 4 ? { ...entry, sha256: sha(image(OLD[index])) } : entry));
  const rewritten = auditRun(writeRun(workspace(t), honestHashes, { contents }), { calls: calls(1) });
  assert.ok(failures(rewritten).includes("CALLS"));
});

test("an old image cannot be listed as made by a call: its source is an earlier output, or no answer from the tool is quoted", (t) => {
  const root = workspace(t);
  withOldImages(root);
  const rows = [row(1, { source: `${ARCHETYPE}/${OLD[0]}` }), row(2, { tool_result: "" }), row(3, { call: 2 }), row(4, { call: null }), row(5, { from: `${ARCHETYPE}/${OLD[1]}` })];
  const report = auditRun(writeRun(root, rows), {});
  assert.equal(report.ok, false);
  const problems = detail(report, "ORIGINS");
  assert.match(problems, /01-new-1\.jpg: its source is an earlier output in the archetype's folder/);
  assert.match(problems, /02-new-2\.jpg: no "tool_result": nothing quotes what the tool returned/);
  assert.match(problems, /03-new-3\.jpg: call 2 also made 02-new-2\.jpg/);
  assert.match(problems, /04-new-4\.jpg: a generated image needs the number of the call that made it/);
  assert.match(problems, /05-new-5\.jpg: a generated image has no "from"/);
});

test("an edited image names the image it came from: a file of the workspace, by its path from the workspace or in full", (t) => {
  const edited = (makeFrom) => {
    const root = workspace(t);
    withOldImages(root);
    return auditRun(writeRun(root, [row(1), row(2, { origin: "edited", from: makeFrom(root) })]), {});
  };
  assert.equal(statuses(edited(() => `${ARCHETYPE}/${OLD[0]}`)).ORIGINS, "pass");
  // An agent that writes the whole path of an earlier image of this workspace is not refused for it.
  const full = edited((root) => path.join(root, ...`${ARCHETYPE}/${OLD[0]}`.split("/")));
  assert.equal(statuses(full).ORIGINS, "pass", detail(full, "ORIGINS"));
  // A file outside the workspace, a missing file, and no path at all are.
  const elsewhere = workspace(t);
  put(elsewhere, "somewhere/else.jpg", image("a file of another project"));
  const outside = edited(() => path.join(elsewhere, "somewhere", "else.jpg"));
  assert.match(detail(outside, "ORIGINS"), /02-new-2\.jpg: an edited image names the earlier image it came from, and it must be a file of the workspace/);
  assert.match(detail(edited(() => `${ARCHETYPE}/09-never-existed.jpg`), "ORIGINS"), /must be a file of the workspace/);
  assert.match(detail(edited(() => undefined), "ORIGINS"), /must be a file of the workspace/);
  assert.match(detail(edited(() => `../${ARCHETYPE}/${OLD[0]}`), "ORIGINS"), /must be a file of the workspace/);
});

test("a run folder has to look like one: its own name, a record, and no image the record does not list", (t) => {
  const root = workspace(t);
  const stray = writeRun(root, five());
  put(root, `${ARCHETYPE}/${RUN}/06-stray.jpg`, image("stray"));
  const unlisted = auditRun(stray, {});
  assert.equal(statuses(unlisted).FILES, "fail");
  assert.match(detail(unlisted, "FILES"), /06-stray\.jpg is in the run folder and not in the record/);

  const named = writeRun(workspace(t), five(), { folder: "run-1" });
  assert.match(detail(auditRun(named, {}), "RUN-FOLDER"), /is not assets\/<slug>-<suffix>\/run-YYYYMMDD-HHMMSS-xxxx/);

  const bare = writeRun(workspace(t), five(), { manifest: false });
  const none = auditRun(bare, {});
  assert.equal(none.ok, false);
  assert.match(detail(none, "MANIFEST"), /manifest\.json is missing, so nothing says what this run did/);

  const wrongRun = auditRun(writeRun(workspace(t), five(), { overrides: { run: "run-20261019-143502-ffff" } }), {});
  assert.match(detail(wrongRun, "MANIFEST"), /"run" is "run-20261019-143502-ffff", not the folder's name run-20261019-143502-7f3a/);

  const shapeless = manifestProblems({ run: RUN, images: "none", counts: { generator_calls: -1 } }, RUN);
  assert.ok(shapeless.length >= 6, shapeless.join("; "));
  assert.deepEqual(manifestProblems("text", RUN), ["the record is not a JSON object"]);
});

test("a reused image is labeled, is never counted as generated now, and does not hide inside the run folder", (t) => {
  const reusedRow = (overrides = {}) => ({ file: `${ARCHETYPE}/${OLD[0]}`, origin: "reused", call: null, sha256: null, inspected: false, verdict: "unable to verify", accepted: false, ...overrides });
  const root = workspace(t);
  withOldImages(root);
  const rows = [row(1), row(2), reusedRow({ sha256: sha(image(OLD[0])) })];
  const good = auditRun(writeRun(root, rows), { calls: calls(2), exact: true });
  assert.equal(good.ok, true, JSON.stringify(good.results.filter((result) => result.status === "fail")));
  assert.match(detail(good, "ORIGINS"), /2 made by calls, 1 reused/);
  assert.match(detail(good, "COUNTS"), /2 calls, 2 new, 1 reused, 0 failed, 1 held, 2 accepted/);
  // A reused row that leaves the "call" field out says the same as one that gives null.
  const { call: _omitted, ...withoutCall } = reusedRow({ sha256: sha(image(OLD[0])) });
  assert.equal(auditRun(withOldFolder(t, [row(1), row(2), withoutCall]), {}).ok, true);

  // Counting the reused image as a new one, or giving it a call, or recording the wrong earlier file, is refused.
  const asNew = auditRun(writeRun(workspace(t), rows, { overrides: { counts: { generator_calls: 2, new_images: 3, reused_images: 0, failed_images: 0, held_images: 1, accepted_images: 2 } } }), {});
  assert.equal(asNew.ok, false);
  assert.match(detail(asNew, "COUNTS"), /new_images is 3 and the rows say 2/);
  const withCall = withOldFolder(t, [row(1), row(2), reusedRow({ call: 3 })]);
  assert.match(detail(auditRun(withCall, {}), "ORIGINS"), /a reused image has no call/);
  const wrongFile = withOldFolder(t, [row(1), row(2), reusedRow({ sha256: sha(image("another image")) })]);
  assert.match(detail(auditRun(wrongFile, {}), "ORIGINS"), /the earlier image is not the one recorded/);
  const missingFile = withOldFolder(t, [row(1), row(2), reusedRow({ file: `${ARCHETYPE}/09-never-existed.jpg` })]);
  assert.match(detail(auditRun(missingFile, {}), "ORIGINS"), /a reused image's file is the earlier image's path from the workspace, and it must exist/);
  const insideRun = withOldFolder(t, [row(1), row(2), reusedRow({ file: `${ARCHETYPE}/${RUN}/01-new-1.jpg` })]);
  assert.match(detail(auditRun(insideRun, {}), "ORIGINS"), /a reused image must be an earlier output outside this run folder/);
  // A reused image nobody looked at this run is not approved: it is held.
  const approvedUnseen = withOldFolder(t, [row(1), row(2), reusedRow({ verdict: "identity consistent", accepted: true })]);
  assert.match(detail(auditRun(approvedUnseen, {}), "VERDICTS"), /"identity consistent" needs an inspection and an accepted image/);
});
/** A workspace holding the four old images and a run folder with these rows. */
function withOldFolder(t, rows) {
  const root = workspace(t);
  withOldImages(root);
  return writeRun(root, rows);
}

test("a reference is reported as attached only where the rows and the log say so", (t) => {
  const mixed = withOldFolder(t, [row(1), row(2, { reference: "not supplied" }), row(3)]);
  const claimed = auditRun(mixed, {});
  assert.match(detail(claimed, "REFERENCE"), /the record says the reference was attached to every call, and some row says otherwise/);

  // A record that claims attachment while every row says "not supplied" is not rescued by the claim.
  const claimsAll = auditRun(withOldFolder(t, [row(1, { reference: "not supplied" }), row(2, { reference: "not supplied" })]), {});
  assert.equal(statuses(claimsAll).REFERENCE, "fail");
  assert.match(detail(claimsAll, "REFERENCE"), /the record says the reference was attached to every call, and some row says otherwise/);
  // A text-only run that says so is honest, and the check reminds the report to say it too.
  const noReference = writeRun(workspace(t), [row(1, { reference: "not supplied" }), row(2, { reference: "not supplied" })], { overrides: { reference: { file: null, input: null, attached_to_every_call: false } } });
  const textOnlyReport = auditRun(noReference, {});
  assert.equal(statuses(textOnlyReport).REFERENCE, "pass");
  assert.match(detail(textOnlyReport, "REFERENCE"), /not supplied on every call: the report must say so/);

  // The log has the last word on a claim of attachment.
  const noPaths = auditRun(withOldFolder(t, [row(1), row(2)]), { calls: calls(2, []), reference: REFERENCE });
  assert.equal(noPaths.ok, false);
  assert.equal(statuses(noPaths).ATTACHED, "fail");
  assert.match(detail(noPaths, "ATTACHED"), /call 1, 2 passed no reference/);
  const aRender = auditRun(withOldFolder(t, [row(1), row(2)]), { calls: calls(2, [`${ARCHETYPE}/${OLD[0]}`]), reference: REFERENCE });
  assert.equal(statuses(aRender).NOTRENDER ?? statuses(aRender)["NO-RENDER"], "fail", "an old render is not the identity reference");
});

test("a verdict is one of four phrases, and nothing that was not inspected, or only half approved, counts as accepted", (t) => {
  const verdicts = (rows, overrides) => auditRun(withOldFolder(t, rows), overrides ?? {});
  const unseen = verdicts([row(1, { inspected: false })]);
  assert.match(detail(unseen, "VERDICTS"), /01-new-1\.jpg: an image that was not inspected can only be "unable to verify"/);
  const qualified = verdicts([row(1, { verdict: "identity consistent (slight silhouette variation)" })]);
  assert.match(detail(qualified, "VERDICTS"), /the verdict must be one of "identity consistent", "needs repair", "needs human review", "unable to verify"/);
  const halfApproved = verdicts([row(1, { verdict: "needs human review", accepted: true })]);
  assert.match(detail(halfApproved, "VERDICTS"), /only an "identity consistent" image is accepted/);
  const unsure = verdicts([row(1), row(2, { verdict: "needs human review", accepted: false, defects: ["a mark at the arm's tip that the picture does not settle"] }), row(3, FAILING)]);
  assert.equal(unsure.ok, true, "holding and rejecting are honest verdicts");
  assert.match(detail(unsure, "COUNTS"), /3 calls, 3 new, 0 reused, 1 failed, 1 held, 1 accepted/);
  for (const verdict of IMAGE_VERDICTS) assert.ok(verdict === verdict.toLowerCase());
});

test("recorded hashes are the files' own, and a run with no hashes says so instead of passing quietly", (t) => {
  const changed = auditRun(withOldFolder(t, [row(1, { sha256: sha(image("something else")) })]), {});
  assert.equal(statuses(changed).HASHES, "fail");
  assert.match(detail(changed, "HASHES"), /the file differs from the record: 01-new-1\.jpg/);
  const none = auditRun(withOldFolder(t, [row(1, { sha256: null }), row(2, { sha256: null })]), {});
  assert.equal(statuses(none).HASHES, "pass");
  assert.match(detail(none, "HASHES"), /0 hashes match; 2 rows have none/);
});

test("a row says where its file was saved, and a destination outside the run folder is refused", (t) => {
  const elsewhere = auditRun(withOldFolder(t, [row(1, { destination: `${ARCHETYPE}/01-new-1.jpg` }), row(2)]), {});
  assert.equal(elsewhere.ok, false);
  assert.equal(statuses(elsewhere).DESTINATION, "fail");
  assert.match(detail(elsewhere, "DESTINATION"), /01-new-1\.jpg: its destination is assets\/example-repo-xiaohei\/01-new-1\.jpg/);
  // A record made by an earlier text has no destination: the audit says so and goes on, since the file's name and the folder give it.
  const none = auditRun(withOldFolder(t, [row(1, { destination: undefined }), row(2, { destination: undefined })]), {});
  assert.equal(none.ok, true, JSON.stringify(none.results.filter((result) => result.status === "fail")));
  assert.equal(statuses(none).DESTINATION, "note");
  assert.match(detail(none, "DESTINATION"), /2 rows give no destination/);
  assert.match(detail(auditRun(withOldFolder(t, [row(1)]), {}), "DESTINATION"), /1 files saved in assets\/example-repo-xiaohei\/run-20261019-143502-7f3a/);
});

test("earlier output must be untouched, and nothing may be written outside the run folder", (t) => {
  const root = workspace(t);
  withOldImages(root);
  const before = snapshotFolder(path.join(root, ARCHETYPE));
  const folder = writeRun(root, five());
  assert.equal(statuses(auditRun(folder, { before })).UNTOUCHED, "pass");

  fs.writeFileSync(path.join(root, ...`${ARCHETYPE}/${OLD[0]}`.split("/")), image("overwritten"));
  fs.rmSync(path.join(root, ...`${ARCHETYPE}/${OLD[1]}`.split("/")));
  put(root, `${ARCHETYPE}/05-stray.jpg`, image("a new file beside the run, not in it"));
  const report = auditRun(folder, { before });
  assert.equal(report.ok, false);
  assert.equal(statuses(report).UNTOUCHED, "fail");
  assert.match(detail(report, "UNTOUCHED"), /01-old-spine\.jpg was changed/);
  assert.match(detail(report, "UNTOUCHED"), /02-old-money\.jpg was deleted or moved/);
  assert.match(detail(report, "UNTOUCHED"), /05-stray\.jpg is new and outside the run folder/);
});

test("the log decides how many calls there were: a run cannot claim more, and with the log of one run alone it claims exactly as many", (t) => {
  const folder = withOldFolder(t, five());
  assert.equal(auditRun(folder, { calls: calls(6) }).ok, true);
  const more = auditRun(folder, { calls: calls(6) });
  assert.match(detail(more, "LOG-HOLDS-MORE"), /1 calls in the log are not in this run's record/);
  assert.equal(more.results.find((result) => result.id === "LOG-HOLDS-MORE").status, "note");
  const exact = auditRun(folder, { calls: calls(6), exact: true });
  assert.equal(exact.ok, false);
  assert.match(detail(exact, "CALLS"), /the log covers this run alone and shows 6 calls, and the record says 5/);
  assert.equal(auditRun(folder, { calls: calls(5), exact: true }).ok, true);
  assert.equal(statuses(auditRun(folder, {})).CALLS, "skip", "without a log the counts are the agent's own, and the check says it did not run");
});

// ---- the second Antigravity failure, and the repair limits --------------------------------------------------------

/** Rows of scenes with the given numbers of repairs: every attempt but a scene's last is rejected, and each repair names what it repairs. */
function scenesWithRepairs(repairsPerScene, failedAt = []) {
  const rows = [];
  let call = 0;
  repairsPerScene.forEach((repairs, scene) => {
    let previous = null;
    for (let attempt = 0; attempt <= repairs; attempt += 1) {
      do {
        call += 1;
      } while (failedAt.includes(call));
      const file = `0${scene + 1}-scene-${scene + 1}${attempt === 0 ? "" : `-v${attempt + 1}`}.jpg`;
      rows.push(row(call, { file, ...(previous === null ? {} : { repair_of: previous }), ...(attempt === repairs ? {} : FAILING) }));
      previous = file;
    }
  });
  return rows;
}
const refused = (numbers) => numbers.map((call) => ({ call, error: "http 400 moderation_blocked: no image returned" }));

test("the second reproduced failure is caught: five images called identity consistent, with nothing on record about what was seen", (t) => {
  // The record a faithful agent wrote in a real run: the provenance in full, and for the pictures a verdict and "inspected".
  const asWritten = five().map(({ checks, defects, ...rest }) => rest);
  const absent = { planned_images: undefined, repairs: undefined, reviewed_by: undefined, failed_calls: undefined, series_review: undefined };
  const report = auditRun(writeRun(workspace(t), asWritten, { overrides: absent }), { calls: calls(5), exact: true, reference: REFERENCE });
  assert.equal(report.ok, false);
  const status = statuses(report);
  for (const id of ["RUN-FOLDER", "FILES", "HASHES", "NOT-OLD", "ORIGINS", "DESTINATION", "VERDICTS", "REFERENCE", "COUNTS", "CALLS", "ATTACHED"]) assert.equal(status[id], "pass", `${id}: what the fresh-run rules already cover still passes`);
  assert.deepEqual(failures(report).sort(), ["MANIFEST", "REPAIRS", "REVIEW", "SERIES"]);
  assert.match(detail(report, "REVIEW"), /01-new-1\.jpg: no "checks", so nothing on record says what was seen/);
  assert.match(detail(report, "SERIES"), /no "series_review": the series gate was not run, or was not recorded/);
  assert.match(detail(report, "REPAIRS"), /"planned_images" is missing/);
  assert.match(detail(report, "MANIFEST"), /"reviewed_by" must be "self", "independent", "human"/);
});

test("an image with a defect on record is not approved, and a check that only says ok, or is left out, is not an answer", (t) => {
  const review = (rows, options = {}) => auditRun(withOldFolder(t, rows), options);
  const stripe = review([row(1), row(2, { defects: ["a white band across the lower body where the arm crosses it"] }), row(3)]);
  assert.equal(stripe.ok, false);
  assert.match(detail(stripe, "REVIEW"), /02-new-2\.jpg: "identity consistent" with a defect on record: a white band across the lower body where the arm crosses it/);
  assert.match(detail(review([row(1), row(2, { verdict: "needs repair", accepted: false }), row(3)]), "REVIEW"), /02-new-2\.jpg: "needs repair" names no defect/);
  assert.match(detail(review([row(1, { checks: { ...CHECKS, Arms: "ok" } })]), "REVIEW"), /01-new-1\.jpg: the check "Arms" says "ok", which is not an observation/);
  const { Arms: _left, ...withoutArms } = CHECKS;
  assert.match(detail(review([row(1, { checks: withoutArms })]), "REVIEW"), /01-new-1\.jpg: no answer to the pack's identity checks: Arms/);
  assert.match(detail(review([row(1, { defects: undefined })]), "REVIEW"), /01-new-1\.jpg: "defects" must be a list of plain sentences, empty when none was found/);

  // A rejection with its defect on record is honest, and the audit says who reviewed.
  const honest = review([row(1), row(2, FAILING), row(3)]);
  assert.equal(honest.ok, true, JSON.stringify(honest.results.filter((result) => result.status === "fail")));
  assert.match(detail(honest, "REVIEW"), /3 inspected images, each with its checks and defects on record; reviewed by self: a self-assessment by the agent that made the images, not an independent or human review/);
  assert.match(detail(honest, "SERIES"), /3 final images opened and compared, and the gate says the series did not pass/);
  // Only the named reviewers are allowed, and the audit does not call another reviewer a self-assessment.
  assert.match(detail(auditRun(writeRun(workspace(t), five(), { overrides: { reviewed_by: "the agent, twice" } }), {}), "MANIFEST"), /"reviewed_by" must be "self", "independent", "human"/);
  const independent = auditRun(writeRun(workspace(t), five(), { overrides: { reviewed_by: "independent" } }), {});
  assert.equal(independent.ok, true);
  assert.doesNotMatch(detail(independent, "REVIEW"), /self-assessment/);
});

test("repairs stay within two for one image and six for the run, and a repair that does not say it is one still counts", (t) => {
  const audit = (rows, overrides = {}, options = {}) => auditRun(writeRun(workspace(t), rows, { overrides }), options);
  // Exactly at the limits passes: six repairs, never more than two on one scene.
  const atTheLimit = audit(scenesWithRepairs([2, 2, 2]));
  assert.equal(atTheLimit.ok, true, JSON.stringify(atTheLimit.results.filter((result) => result.status === "fail")));
  assert.match(detail(atTheLimit, "REPAIRS"), /6 repairs of the 6 allowed, 9 images for 3 planned/);
  // A third repair of one image, and a seventh of the run.
  const third = audit(scenesWithRepairs([3, 0]));
  assert.equal(statuses(third).REPAIRS, "fail");
  assert.match(detail(third, "REPAIRS"), /01-scene-1\.jpg was repaired 3 times, and the limit for one image is 2/);
  assert.match(detail(audit(scenesWithRepairs([2, 2, 2, 1])), "REPAIRS"), /the run made 7 repairs, and the limit for a series is 6/);
  // The record's own counter has to be the rows', and a limit raised in the record is not a limit.
  assert.match(detail(audit(scenesWithRepairs([1, 0]), { repairs: { used: 0, per_image_limit: 2, series_limit: 6 } }), "REPAIRS"), /repairs\.used is 0, and 1 rows have repair_of/);
  assert.match(detail(audit(scenesWithRepairs([1, 0]), { repairs: { used: 1, per_image_limit: 9, series_limit: 99 } }), "MANIFEST"), /"repairs\.per_image_limit" is 9, and the limit is 2/);
  // A repair that does not say it is one is a first attempt, and the plan did not ask for it.
  assert.match(detail(audit([row(1, FAILING), row(2, { file: "01-new-1-v2.jpg" })], { planned_images: 1 }), "REPAIRS"), /2 images are first attempts, and the plan asked for 1: a repair that does not say it is one, or a picture nobody planned/);
  assert.match(detail(audit([row(1), row(2, { repair_of: "09-nowhere.jpg" })]), "REPAIRS"), /02-new-2\.jpg: "repair_of" names no other image of this run/);
  assert.match(detail(audit([row(1, { repair_of: "02-new-2.jpg", ...FAILING }), row(2)]), "REPAIRS"), /01-new-1\.jpg: it repairs 02-new-2\.jpg, which a later call made/);

  // The run that made eight repairs where the limit is six, and two calls the tool refused: every call adds up, and the limit does not.
  const rows = scenesWithRepairs([2, 2, 2, 1, 1, 0, 0, 0], [5, 9]);
  assert.equal(rows.length, 16);
  const report = audit(rows, { failed_calls: refused([5, 9]) }, { calls: calls(18), exact: true, reference: REFERENCE });
  assert.equal(statuses(report).COUNTS, "pass", "every one of the 18 calls is an image or a refused call");
  assert.equal(statuses(report).CALLS, "pass");
  assert.deepEqual(failures(report), ["REPAIRS"]);
  assert.match(detail(report, "REPAIRS"), /the run made 8 repairs, and the limit for a series is 6/);
  assert.match(detail(report, "COUNTS"), /18 calls, 16 new, 0 reused, 8 failed, 0 held, 8 accepted/);
});

test("every call is an image of the record or a failed call of the record, so an image nobody kept cannot hide a repair", (t) => {
  const counts = record(five()).counts;
  const hidden = auditRun(writeRun(workspace(t), five(), { overrides: { counts: { ...counts, generator_calls: 6 } } }), {});
  assert.equal(statuses(hidden).COUNTS, "fail");
  assert.match(detail(hidden, "COUNTS"), /generator_calls is 6, and 5 images plus 0 failed calls make 5/);
  assert.match(detail(hidden, "COUNTS"), /call 6 is neither an image of the record nor a failed call/);
  // Listed as a refused call, the same six calls add up, and the log of six agrees.
  const listed = auditRun(writeRun(workspace(t), five(), { overrides: { failed_calls: refused([6]) } }), { calls: calls(6), exact: true });
  assert.equal(listed.ok, true, JSON.stringify(listed.results.filter((result) => result.status === "fail")));
  assert.match(detail(listed, "COUNTS"), /6 calls, 5 new, 0 reused, 0 failed, 0 held, 5 accepted/);
  // A refused call cannot borrow an image's number, and its entry needs the tool's own words.
  assert.match(detail(auditRun(writeRun(workspace(t), five(), { overrides: { failed_calls: refused([2]) } }), {}), "COUNTS"), /call 2 is recorded twice/);
  assert.match(detail(auditRun(writeRun(workspace(t), five(), { overrides: { failed_calls: [{ call: 6 }] } }), {}), "MANIFEST"), /each failed call is \{ "call": its number, "error": "the tool's own words" \}/);
});

test("a series of two or more pictures records its gate: every final image opened, the pairs compared, and no pass claimed over a failed final", (t) => {
  const gateOf = (overrides) => auditRun(writeRun(workspace(t), five(), { overrides: { series_review: { ...record(five()).series_review, ...overrides } } }), {});
  const partial = gateOf({ reference_opened: false, images_opened: ["01-new-1.jpg"], pairs_compared: [["01-new-1.jpg", "02-new-2.jpg"]], observations: "ok" });
  assert.equal(statuses(partial).SERIES, "fail");
  assert.match(detail(partial, "SERIES"), /the gate did not open every final image: 02-new-2\.jpg; 03-new-3\.jpg; 04-new-4\.jpg; 05-new-5\.jpg/);
  assert.match(detail(partial, "SERIES"), /the reference was attached, and the gate does not say it was opened beside the images/);
  assert.match(detail(partial, "SERIES"), /the gate compared 1 pairs of final images, and 5 images need at least 4/);
  assert.match(detail(partial, "SERIES"), /"series_review\.observations" says nothing about what was seen across the images/);
  // A pass cannot be claimed over a rejected final image.
  const rows = [row(1), row(2, FAILING), row(3)];
  const claimed = auditRun(writeRun(workspace(t), rows, { overrides: { series_review: { ...record(rows).series_review, passed: true } } }), {});
  assert.match(detail(claimed, "SERIES"), /the gate says the series passed, and 1 final images were not approved: 02-new-2\.jpg/);
  // Rejected attempts do not stop a series from passing: the gate judges the final image of each scene.
  const repaired = auditRun(writeRun(workspace(t), scenesWithRepairs([1, 0])), {});
  assert.equal(repaired.ok, true, JSON.stringify(repaired.results.filter((result) => result.status === "fail")));
  assert.match(detail(repaired, "SERIES"), /2 final images opened and compared, and the series passed/);
  assert.match(detail(repaired, "COUNTS"), /3 calls, 3 new, 0 reused, 1 failed, 0 held, 2 accepted/);
  // One picture has no series, and an edit run has no plan to hold it to.
  assert.equal(statuses(auditRun(withOldFolder(t, [row(1)]), {})).SERIES, "skip");
  const edit = auditRun(writeRun(workspace(t), five(), { overrides: { mode: "edit" } }), {});
  assert.equal(statuses(edit).REPAIRS, "skip");
  assert.equal(statuses(edit).SERIES, "skip");
});

test("the command snapshots a folder, audits a run, and exits 0, 1, or 2", (t) => {
  const root = workspace(t);
  withOldImages(root);
  const collect = () => ({ text: "", write(chunk) { this.text += chunk; } });
  const snapshot = collect();
  assert.equal(main(["--snapshot", path.join(root, ARCHETYPE)], snapshot, collect()), 0);
  const listing = JSON.parse(snapshot.text);
  assert.equal(listing.length, 4);
  const beforeFile = path.join(root, "before.json");
  fs.writeFileSync(beforeFile, snapshot.text);

  const folder = writeRun(root, five());
  const logFile = path.join(root, "calls.json");
  fs.writeFileSync(logFile, JSON.stringify(Array.from({ length: 5 }, (_, index) => ({ prompt: `p${index}`, referenced_image_paths: [PACKAGED] }))));
  const good = collect();
  assert.equal(main(["--before", beforeFile, "--calls", logFile, "--exact", "--reference", REFERENCE, folder], good, collect()), 0, good.text);
  assert.match(good.text, /^PASS {2}UNTOUCHED /m);
  assert.match(good.text, /^Record: run-20261019-143502-7f3a: 5 image-tool calls, 5 new images, 0 reused, 0 failed, 0 held, 5 accepted$/m);
  assert.match(good.text, /No check failed\./);

  fs.writeFileSync(logFile, JSON.stringify([{ prompt: "only one", referenced_image_paths: [PACKAGED] }]));
  const bad = collect();
  assert.equal(main(["--calls", logFile, folder], bad, collect()), 1);
  assert.match(bad.text, /^FAIL {2}CALLS /m);
  assert.match(bad.text, /Some check failed/);
  const asJson = collect();
  assert.equal(main(["--json", folder], asJson, collect()), 0);
  assert.equal(JSON.parse(asJson.text).ok, true);

  const err = collect();
  assert.equal(main([], collect(), err), 2);
  assert.equal(main([path.join(root, "nowhere")], collect(), err), 2);
  assert.equal(main(["--exact", folder], collect(), err), 2, "--exact needs a log");
  assert.equal(main(["--calls", path.join(root, "missing.json"), folder], collect(), err), 2);
  fs.writeFileSync(beforeFile, JSON.stringify({ not: "a listing" }));
  assert.equal(main(["--before", beforeFile, folder], collect(), err), 2);
  assert.equal(main(["--help"], collect(), err), 0);
});
