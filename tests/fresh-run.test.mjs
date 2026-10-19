import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { main } from "../scripts/audit-run.mjs";
import { IMAGE_VERDICTS, PATHS, RUN_COUNT_FIELDS, RUN_FOLDER_PATTERN } from "../scripts/lib/config.mjs";
import { Repository } from "../scripts/lib/repository.mjs";
import { auditRun, manifestProblems, snapshotFolder } from "../scripts/lib/run-audit.mjs";
import { imageToolCalls } from "../scripts/lib/series-audit.mjs";

// A repeated request in Google Antigravity opened four images that an earlier run had left in the output folder,
// made one new image-generation call, saved the new image beside them, delivered all five as one new explanation,
// and called the four old ones "identity consistent". These tests pin the rules that stop that (each Generate
// request is a fresh run in its own folder, an image counts as new only when a call of this run made it, and a
// verdict is conservative), and read run folders the way scripts/audit-run.mjs does, so that an old image cannot
// pass as a new one. docs/evaluation.md records what real runs showed.
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
  assert.match(delivery, /Call a series consistent only when every image of the run is accepted\. Otherwise say how many passed and how many did not, and never describe the run as a successful consistency check/);
  assert.match(delivery, /The counts you give must agree with the calls you made/);
});

test("approval is conservative: a flaw you saw fails the image, a doubt holds it, and neither is softened into a pass", () => {
  const section = gate.slice(gate.indexOf("Approve conservatively."), gate.indexOf("When you cannot view the images"));
  assert.match(section, /You are a model looking at a picture, and a model tends to see what it expects/);
  assert.match(section, /\*\*Clearly wrong: reject it\.\*\* If any observation, anywhere in your notes or your reasoning, names a locked feature as present or changed \(points or tufts that read as ears, a mouth, a third arm, a different body\), the image fails\. You cannot approve it afterwards with a caveat/);
  assert.match(section, /\*\*Material doubt: hold it\.\*\* A hedged observation \("seems", "probably", "slightly different"\), or a feature you cannot make out at the size you see, is a check that did not pass\. The verdict is "needs human review"/);
  assert.match(section, /\*\*Cannot view it: "unable to verify"\.\*\*/);
  assert.match(section, /A series with a rejected, held, or unverified image is never reported as a passed consistency check: the report says how many images passed and how many did not/);
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
/** The row of the nth new image, as a faithful agent records it; overrides break one field. */
function row(n, overrides = {}) {
  return {
    file: `0${n}-new-${n}.jpg`,
    origin: "generated",
    call: n,
    tool_result: `Generated image is saved at /opt/host/brain/new_${n}.jpg`,
    source: `/opt/host/brain/new_${n}.jpg`,
    destination: `${ARCHETYPE}/${RUN}/0${n}-new-${n}.jpg`,
    sha256: sha(image(`new ${n}`)),
    reference: "attached",
    inspected: true,
    verdict: "identity consistent",
    accepted: true,
    ...overrides,
  };
}
/** A run record whose counts are the rows' own; overrides break one field. */
function record(rows, overrides = {}) {
  const fresh = rows.filter((entry) => entry.origin === "generated" || entry.origin === "edited");
  const count = (test) => rows.filter(test).length;
  return {
    run: RUN,
    archetype: "xiaohei",
    mode: "generate",
    tool: "generate_image",
    host_call_records: "a transcript the user can open",
    reference: { file: ".agents/skills/inkexplain/references/archetypes/xiaohei/xiaohei.png", input: "ImagePaths", attached_to_every_call: true },
    images: rows,
    counts: {
      generator_calls: Math.max(fresh.length, ...rows.map((entry) => entry.call ?? 0)),
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
  for (const id of ["RUN-FOLDER", "MANIFEST", "FILES", "HASHES", "NOT-OLD", "ORIGINS", "DESTINATION", "VERDICTS", "REFERENCE", "COUNTS", "UNTOUCHED", "CALLS", "ATTACHED", "SAME-FILE", "PACKAGED"]) assert.equal(status[id], "pass", id);
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
  const unsure = verdicts([row(1), row(2, { verdict: "needs human review", accepted: false }), row(3, { verdict: "needs repair", accepted: false })]);
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
