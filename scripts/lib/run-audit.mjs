// Audits one run folder of generated images against its run record.
//
// A report that says "five images generated" is a claim. The run folder, the run record (manifest.json), and the
// host's log of image calls are the evidence. This reads them and checks the rules of references/workflow/delivery.md
// that they can show: the run has its own folder, every image in it is a row of the record, a new image was made by a
// call of this run and is not a copy of an image that was already in the archetype's folder, a reused image is
// labeled as reused, no image is "identity consistent" without having been inspected, and the counts add up. An
// approved image must also have its observations on record (what was seen, one entry for each identity check of its
// pack, and the defects found, none for an approved image), and its meaning must be reviewed apart from its identity (the
// facts the plan set, the numbers and words read off the picture, and what it says alone): an image that is on-model and
// misleading is not accepted. Repairs must stay within two for one image and six for the run, every call must be an
// image or a failed call, and a series must have its gate recorded. With a log of the
// host's calls it also checks that the run did not claim more calls than were made. It cannot say whether an image is
// right: that is for a person, or an agent looking at the image. It can say that nobody wrote down what they saw.
//
// Offline, like every script here. The CLI is scripts/audit-run.mjs.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { IMAGE_VERDICTS, MEANING_VERDICTS, PATHS, REPAIR_LIMITS, REVIEWERS, RUN_COUNT_FIELDS, RUN_FOLDER_PATTERN, RUN_MANIFEST } from "./config.mjs";
import { auditSeries } from "./series-audit.mjs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
const IMAGE_FILE = /\.(?:png|jpe?g|webp)$/i;
// A copy of the packaged reference that was made for a tool that cannot read the skill folder: not one of the run's images.
const REFERENCE_COPY = /^identity-reference\.(?:png|jpe?g|webp)$/i;
const ORIGINS = ["generated", "edited", "reused"];
const REFERENCE_STATES = ["attached", "not supplied"];
const MAX_FILES = 5000;
// What a check says when it does not say what was seen: a bare approval. The method asks for "ears: none, the top is
// one smooth dome", never "ok".
const NOT_AN_OBSERVATION = new Set(["ok", "okay", "fine", "good", "pass", "passed", "yes", "true", "correct", "consistent", "matches", "match", "same", "none", "n/a", "na", "no issues", "no issue", "as expected", "as specified"]);

const bare = (value) => String(value).trim().toLowerCase().replace(/[\s.!]+$/g, "");
const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const hashOf = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
const isRegularFile = (file) => {
  try {
    const stat = fs.lstatSync(file);
    return stat.isFile() && !stat.isSymbolicLink();
  } catch {
    return false;
  }
};
const isInside = (child, parent) => {
  const relative = path.relative(parent, child);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
};
const shown = (items, limit = 4) => `${items.slice(0, limit).join("; ")}${items.length > limit ? `; and ${items.length - limit} more` : ""}`;

/** The files under `folder`, without the folder `skip`, without symbolic links, and never more than a bound. */
function filesUnder(folder, skip = null) {
  const found = [];
  const walk = (directory) => {
    let entries;
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(directory, entry.name);
      if (entry.isSymbolicLink() || (skip !== null && path.resolve(full) === path.resolve(skip))) continue;
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && found.length < MAX_FILES) found.push(full);
    }
  };
  walk(folder);
  return found;
}
const imagesUnder = (folder, skip) => filesUnder(folder, skip).filter((file) => IMAGE_FILE.test(file));

/**
 * The files of an archetype's folder as [{ path, sha256 }], with each path from the workspace in POSIX form. Take it
 * before a run and hand it to auditRun as `before`, to check afterwards that earlier output was not deleted, moved,
 * or changed, and that the run wrote nothing outside its own folder.
 */
export function snapshotFolder(archetypeFolder, workspace = null) {
  const folder = path.resolve(archetypeFolder);
  const root = workspace === null ? path.dirname(path.dirname(folder)) : path.resolve(workspace);
  return filesUnder(folder)
    .map((file) => ({ path: path.relative(root, file).split(path.sep).join("/"), sha256: hashOf(file) }))
    .sort((a, b) => (a.path < b.path ? -1 : 1));
}

/**
 * The names of the rows of an archetype's "Identity checks" table in its prompts.md, as the pack words them, or [] when
 * its pack has no such table. An approved image has to answer each of them in its record.
 */
export function packIdentityChecks(archetype, root = REPO_ROOT) {
  if (typeof archetype !== "string" || !/^[a-z0-9-]+$/.test(archetype)) return [];
  let text;
  try {
    text = fs.readFileSync(path.join(root, PATHS.archetypesDir, archetype, "prompts.md"), "utf8");
  } catch {
    return [];
  }
  const start = text.indexOf("### Identity checks");
  if (start === -1) return [];
  const names = [];
  let inTable = false;
  for (const line of text.slice(start).split("\n").slice(1)) {
    if (/^#{1,3} /.test(line)) break;
    if (!line.trim().startsWith("|")) {
      if (inTable) break;
      continue;
    }
    const cells = line.split("|").map((cell) => cell.trim());
    if (!inTable) {
      inTable = cells[1]?.toLowerCase() === "check";
      continue;
    }
    if (/^:?-+:?$/.test(cells[1] ?? "")) continue;
    if (cells[1]) names.push(cells[1]);
  }
  return names;
}

/** What is wrong with the shape of a run record, as a list of plain sentences. */
export function manifestProblems(manifest, folderName) {
  if (!isObject(manifest)) return ["the record is not a JSON object"];
  const problems = [];
  if (manifest.run !== folderName) problems.push(`"run" is ${JSON.stringify(manifest.run)}, not the folder's name ${folderName}`);
  for (const key of ["archetype", "tool", "host_call_records"]) {
    if (typeof manifest[key] !== "string" || manifest[key].trim() === "") problems.push(`"${key}" is missing`);
  }
  if (!["generate", "edit"].includes(manifest.mode)) problems.push('"mode" must be "generate" or "edit"');
  if (!isObject(manifest.reference) || typeof manifest.reference.attached_to_every_call !== "boolean") {
    problems.push('"reference.attached_to_every_call" must be true or false');
  } else if (manifest.reference.attached_to_every_call && (typeof manifest.reference.file !== "string" || typeof manifest.reference.input !== "string")) {
    problems.push('an attached reference names its "file" and its "input"');
  }
  if (!Number.isInteger(manifest.planned_images) || manifest.planned_images < 1) problems.push('"planned_images" must be the whole number of pictures the plan asked for');
  if (!isObject(manifest.repairs) || !Number.isInteger(manifest.repairs.used) || manifest.repairs.used < 0) problems.push('"repairs.used" must be a whole number');
  else {
    if (manifest.repairs.per_image_limit !== undefined && manifest.repairs.per_image_limit !== REPAIR_LIMITS.perImage) problems.push(`"repairs.per_image_limit" is ${manifest.repairs.per_image_limit}, and the limit is ${REPAIR_LIMITS.perImage}`);
    if (manifest.repairs.series_limit !== undefined && manifest.repairs.series_limit !== REPAIR_LIMITS.perSeries) problems.push(`"repairs.series_limit" is ${manifest.repairs.series_limit}, and the limit is ${REPAIR_LIMITS.perSeries}`);
  }
  if (!REVIEWERS.includes(manifest.reviewed_by)) problems.push(`"reviewed_by" must be ${REVIEWERS.map((name) => `"${name}"`).join(", ")}`);
  if (!Array.isArray(manifest.failed_calls)) problems.push('"failed_calls" must be a list, empty when every call returned an image');
  else if (manifest.failed_calls.some((entry) => !isObject(entry) || !Number.isInteger(entry.call) || entry.call < 1 || typeof entry.error !== "string" || entry.error.trim() === "")) {
    problems.push('each failed call is { "call": its number, "error": "the tool\'s own words" }');
  }
  if (!Array.isArray(manifest.images)) problems.push('"images" must be a list');
  if (!isObject(manifest.counts)) problems.push('"counts" is missing');
  else {
    for (const key of RUN_COUNT_FIELDS) {
      if (!Number.isInteger(manifest.counts[key]) || manifest.counts[key] < 0) problems.push(`counts.${key} must be a whole number`);
    }
  }
  return problems;
}

/**
 * Check one run folder. Options: `calls` (the image-tool calls found in the host's log, from imageToolCalls), `exact`
 * (the log covers this run alone, so the numbers of calls must be equal), `reference` (the packaged file every call
 * must attach, as for auditSeries), `workspace` (the project folder, when the run folder is not under its assets/),
 * `before` (snapshotFolder of the archetype's folder, taken before the run), and `identityChecks` (the names an
 * approved image must answer, by default the rows of its pack's "Identity checks", from packIdentityChecks).
 * Returns { results, ok, manifest }, each result being { id, title, status: "pass" | "fail" | "skip" | "note", detail }.
 */
export function auditRun(runFolder, { calls = null, exact = false, reference = null, workspace = null, before = null, identityChecks = null } = {}) {
  const results = [];
  const add = (id, title, status, detail = "") => results.push({ id, title, status, detail });
  const finish = (manifest = null) => ({ results, ok: results.every((result) => result.status !== "fail"), manifest });

  const folder = path.resolve(runFolder);
  const name = path.basename(folder);
  const archetypeFolder = path.dirname(folder);
  const assetsFolder = path.dirname(archetypeFolder);
  const root = workspace === null ? path.dirname(assetsFolder) : path.resolve(workspace);
  const relative = (file) => path.relative(root, file).split(path.sep).join("/");

  const placed = RUN_FOLDER_PATTERN.test(name) && path.basename(assetsFolder) === "assets";
  add("RUN-FOLDER", "the run has its own folder, assets/<slug>-<suffix>/run-<id>/", placed ? "pass" : "fail", placed ? name : `${relative(folder)} is not assets/<slug>-<suffix>/run-YYYYMMDD-HHMMSS-xxxx`);

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(folder, RUN_MANIFEST), "utf8"));
  } catch (error) {
    add("MANIFEST", "the run record exists and is valid JSON", "fail", error.code === "ENOENT" ? `${RUN_MANIFEST} is missing, so nothing says what this run did` : `cannot read ${RUN_MANIFEST}: ${error.message}`);
    return finish();
  }
  const problems = manifestProblems(manifest, name);
  add("MANIFEST", "the run record has the fields the report depends on", problems.length === 0 ? "pass" : "fail", problems.length === 0 ? `${manifest.run}, ${manifest.images.length} rows` : shown(problems, 6));
  if (!isObject(manifest) || !Array.isArray(manifest.images)) return finish(manifest);

  const rows = manifest.images.filter(isObject);
  const fresh = rows.filter((row) => row.origin === "generated" || row.origin === "edited");
  const reused = rows.filter((row) => row.origin === "reused");
  const here = (row) => path.join(folder, String(row.file));

  // Every image in the folder is a row, and every row made in this run has its file.
  const present = fs.readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isFile() && IMAGE_FILE.test(entry.name) && !REFERENCE_COPY.test(entry.name)).map((entry) => entry.name);
  const listed = new Set(fresh.map((row) => row.file));
  const unlisted = present.filter((file) => !listed.has(file));
  const missing = fresh.filter((row) => typeof row.file !== "string" || path.basename(row.file) !== row.file || !isRegularFile(here(row))).map((row) => String(row.file));
  const fileProblems = [...unlisted.map((file) => `${file} is in the run folder and not in the record`), ...missing.map((file) => `${file} is a row of the record and not a file of the run folder`)];
  add("FILES", "every image in the run folder is a row of the record, and every row has its file", fileProblems.length === 0 ? "pass" : "fail", fileProblems.length === 0 ? `${fresh.length} files` : shown(fileProblems));

  // Hashes: a recorded hash must be the file's own, and a missing one is said.
  const actual = new Map(fresh.filter((row) => !missing.includes(String(row.file))).map((row) => [row, hashOf(here(row))]));
  const wrongHash = [...actual].filter(([row, hash]) => typeof row.sha256 === "string" && row.sha256.toLowerCase() !== hash).map(([row]) => String(row.file));
  const noHash = fresh.filter((row) => row.sha256 === null || row.sha256 === undefined).length;
  add("HASHES", "each recorded hash is the file's own", wrongHash.length === 0 ? "pass" : "fail", wrongHash.length === 0 ? `${fresh.length - noHash} hashes match${noHash > 0 ? `; ${noHash} rows have none (the host could not compute one)` : ""}` : `the file differs from the record: ${shown(wrongHash)}`);

  // An old image copied into the run does not become a new one.
  const sources = new Set(fresh.filter((row) => typeof row.source === "string").map((row) => path.resolve(path.isAbsolute(row.source) ? row.source : path.join(root, row.source))));
  const earlier = new Map();
  for (const file of imagesUnder(archetypeFolder, folder)) {
    if (!sources.has(path.resolve(file))) earlier.set(hashOf(file), file);
  }
  const copies = [];
  const seen = new Map();
  for (const [row, hash] of actual) {
    if (earlier.has(hash)) copies.push(`${row.file} is byte for byte the earlier image ${relative(earlier.get(hash))}`);
    if (seen.has(hash)) copies.push(`${row.file} is byte for byte ${seen.get(hash)}, another row of this run`);
    else seen.set(hash, String(row.file));
  }
  add("NOT-OLD", "no new image is a copy of an image that was already in the archetype's folder", copies.length === 0 ? "pass" : "fail", copies.length === 0 ? `compared with ${earlier.size} earlier images` : shown(copies));

  // Where each row came from.
  const origin = [];
  const callNumbers = new Map();
  for (const row of rows) {
    const label = String(row.file);
    if (!ORIGINS.includes(row.origin)) {
      origin.push(`${label}: "origin" must be generated, edited, or reused`);
      continue;
    }
    if (row.origin === "reused") {
      if (row.call !== null && row.call !== undefined) origin.push(`${label}: a reused image has no call`);
      const earlierPath = typeof row.file === "string" && !path.isAbsolute(row.file) && !row.file.split("/").includes("..") ? path.join(root, ...row.file.split("/")) : null;
      if (earlierPath === null || !isRegularFile(earlierPath)) origin.push(`${label}: a reused image's file is the earlier image's path from the workspace, and it must exist`);
      else if (!isInside(earlierPath, assetsFolder) || isInside(earlierPath, folder)) origin.push(`${label}: a reused image must be an earlier output outside this run folder`);
      else if (typeof row.sha256 === "string" && row.sha256.toLowerCase() !== hashOf(earlierPath)) origin.push(`${label}: the earlier image is not the one recorded`);
      continue;
    }
    if (!Number.isInteger(row.call) || row.call < 1) origin.push(`${label}: a ${row.origin} image needs the number of the call that made it`);
    else if (callNumbers.has(row.call)) origin.push(`${label}: call ${row.call} also made ${callNumbers.get(row.call)}`);
    else callNumbers.set(row.call, label);
    if (typeof row.tool_result !== "string" || row.tool_result.trim() === "") origin.push(`${label}: no "tool_result": nothing quotes what the tool returned`);
    if (row.source !== null && typeof row.source !== "string") origin.push(`${label}: "source" is the path the tool reported, or null`);
    if (typeof row.source === "string") {
      const sourcePath = path.resolve(path.isAbsolute(row.source) ? row.source : path.join(root, row.source));
      if (isInside(sourcePath, archetypeFolder) && !isInside(sourcePath, folder)) origin.push(`${label}: its source is an earlier output in the archetype's folder`);
    }
    if (row.origin === "generated" && row.from !== undefined) origin.push(`${label}: a generated image has no "from"`);
    if (row.origin === "edited") {
      // The image it was edited from: by its path from the workspace, or in full when it is a file inside the workspace.
      let from = null;
      if (typeof row.from === "string" && row.from !== "") {
        if (path.isAbsolute(row.from)) from = path.resolve(row.from);
        else if (!row.from.split(/[\\/]/).includes("..")) from = path.join(root, ...row.from.split(/[\\/]/));
      }
      if (from === null || !isInside(from, root) || !isRegularFile(from)) origin.push(`${label}: an edited image names the earlier image it came from, and it must be a file of the workspace`);
    }
  }
  add("ORIGINS", "each row is generated by a call of this run, edited from a named image, or reused and labeled", origin.length === 0 ? "pass" : "fail", origin.length === 0 ? `${fresh.length} made by calls, ${reused.length} reused` : shown(origin, 8));

  // Where each file was saved: a destination that is given must be the file's place in this run folder.
  const expectedPrefix = relative(folder);
  const posixOf = (value) => String(value).split(path.sep).join("/").replaceAll("\\", "/");
  const misplaced = fresh.filter((row) => typeof row.destination === "string" && typeof row.file === "string" && posixOf(row.destination) !== `${expectedPrefix}/${row.file}`).map((row) => `${row.file}: its destination is ${row.destination}`);
  const undeclared = fresh.filter((row) => typeof row.destination !== "string").length;
  add(
    "DESTINATION",
    "each row says where its file was saved, and that is the run folder",
    misplaced.length > 0 ? "fail" : undeclared > 0 ? "note" : "pass",
    misplaced.length > 0 ? shown(misplaced) : undeclared > 0 ? `${undeclared} rows give no destination: the file name and the run folder say where each one is` : `${fresh.length} files saved in ${expectedPrefix}`,
  );

  // The verdicts. An image is accepted only when both reviews pass: its identity is "identity consistent" and its meaning
  // is "accurate". An image can be on-model and still say something false, and it is then not accepted.
  const meaningOf = (row) => (isObject(row.meaning) && MEANING_VERDICTS.includes(row.meaning.verdict) ? row.meaning.verdict : null);
  const verdicts = [];
  for (const row of rows) {
    const label = String(row.file);
    if (!IMAGE_VERDICTS.includes(row.verdict)) verdicts.push(`${label}: the verdict must be one of ${IMAGE_VERDICTS.map((v) => `"${v}"`).join(", ")}`);
    if (typeof row.inspected !== "boolean" || typeof row.accepted !== "boolean") verdicts.push(`${label}: "inspected" and "accepted" must be true or false`);
    if (row.inspected === false && row.verdict !== "unable to verify") verdicts.push(`${label}: an image that was not inspected can only be "unable to verify"`);
    if (row.verdict === "identity consistent" && row.inspected !== true) verdicts.push(`${label}: "identity consistent" needs an inspection`);
    if (row.accepted === true && row.verdict !== "identity consistent") verdicts.push(`${label}: only an "identity consistent" image is accepted`);
    if (row.accepted === true && meaningOf(row) !== "accurate") verdicts.push(`${label}: accepted, and its meaning is ${meaningOf(row) === null ? "not on record" : `"${meaningOf(row)}"`}: an image that is on-model and not accurate is not accepted`);
    if (row.accepted === false && row.inspected === true && row.verdict === "identity consistent" && meaningOf(row) === "accurate") verdicts.push(`${label}: both reviews passed, and the image is not accepted`);
  }
  add("VERDICTS", "a verdict is one of four phrases, and nothing unseen is approved", verdicts.length === 0 ? "pass" : "fail", verdicts.length === 0 ? `${rows.length} verdicts` : shown(verdicts));

  // The review: what was seen is on record, and an image with a defect on record is not approved. A verdict with
  // nothing behind it, which is what an agent writes when it confirms an image instead of looking at it, fails here.
  const required = identityChecks ?? packIdentityChecks(manifest.archetype);
  const review = [];
  let looked = 0;
  for (const row of fresh) {
    if (row.inspected !== true) continue;
    looked += 1;
    const label = String(row.file);
    const entries = isObject(row.checks) ? Object.entries(row.checks) : [];
    if (entries.length === 0) review.push(`${label}: no "checks", so nothing on record says what was seen`);
    for (const [key, value] of entries) {
      if (typeof value !== "string" || NOT_AN_OBSERVATION.has(bare(value))) review.push(`${label}: the check "${key}" says ${JSON.stringify(value)}, which is not an observation`);
    }
    if (!Array.isArray(row.defects) || row.defects.some((defect) => typeof defect !== "string" || defect.trim() === "")) {
      review.push(`${label}: "defects" must be a list of plain sentences, empty when none was found`);
    } else if (row.verdict === "identity consistent" && row.defects.length > 0) {
      review.push(`${label}: "identity consistent" with a defect on record: ${shown(row.defects, 2)}`);
    } else if ((row.verdict === "needs repair" || row.verdict === "needs human review") && row.defects.length === 0) {
      review.push(`${label}: "${row.verdict}" names no defect`);
    }
    if (row.verdict === "identity consistent" && required.length > 0) {
      const answered = new Set(entries.map(([key]) => key.trim().toLowerCase()));
      const lacking = required.filter((name) => !answered.has(name.toLowerCase()));
      if (lacking.length > 0) review.push(`${label}: no answer to the pack's identity checks: ${lacking.join(", ")}`);
    }
  }
  const selfReviewed = manifest.reviewed_by === "self";
  add(
    "REVIEW",
    "every inspected image has what was seen on record, and an approved image has no defect on record",
    review.length === 0 ? "pass" : "fail",
    review.length === 0 ? `${looked} inspected images, each with its checks and defects on record; reviewed by ${manifest.reviewed_by}${selfReviewed ? ": a self-assessment by the agent that made the images, not an independent or human review" : ""}` : shown(review, 6),
  );

  // The meaning: a second review, apart from the identity review, of what the picture says. The facts the plan set, the
  // numbers and the words read off the picture, and what a reader takes from it alone are on record, and a picture with
  // a meaning defect on record is not accurate. It cannot say that the picture is true: it can say that nobody looked.
  const meaningProblems = [];
  let meant = 0;
  const said = (value, allowNone) => typeof value === "string" && value.trim() !== "" && ((allowNone && bare(value) === "none") || !NOT_AN_OBSERVATION.has(bare(value)));
  for (const row of fresh) {
    if (row.inspected !== true) continue;
    meant += 1;
    const label = String(row.file);
    const meaning = row.meaning;
    if (!isObject(meaning)) {
      meaningProblems.push(`${label}: no "meaning", so nothing on record says what the picture says`);
      continue;
    }
    const facts = isObject(meaning.facts) ? Object.entries(meaning.facts) : [];
    if (facts.length === 0) meaningProblems.push(`${label}: "meaning.facts" lists no fact that the picture had to keep true`);
    for (const [fact, shownOf] of facts) {
      if (!said(shownOf, false)) meaningProblems.push(`${label}: the fact "${fact}" says ${JSON.stringify(shownOf)}, which does not say what the picture shows`);
    }
    for (const key of ["numbers", "labels", "alone"]) {
      if (!said(meaning[key], key !== "alone")) meaningProblems.push(`${label}: "meaning.${key}" is ${JSON.stringify(meaning[key])}, which does not say what was read off the picture`);
    }
    if (!MEANING_VERDICTS.includes(meaning.verdict)) {
      meaningProblems.push(`${label}: "meaning.verdict" must be ${MEANING_VERDICTS.map((v) => `"${v}"`).join(", ")}`);
    } else if (!Array.isArray(meaning.defects) || meaning.defects.some((defect) => typeof defect !== "string" || defect.trim() === "")) {
      meaningProblems.push(`${label}: "meaning.defects" must be a list of plain sentences, empty when none was found`);
    } else if (meaning.verdict === "accurate" && meaning.defects.length > 0) {
      meaningProblems.push(`${label}: "accurate" with a defect of meaning on record: ${shown(meaning.defects, 2)}`);
    } else if ((meaning.verdict === "misleading" || meaning.verdict === "needs human review") && meaning.defects.length === 0) {
      meaningProblems.push(`${label}: "${meaning.verdict}" names no defect`);
    }
  }
  add(
    "MEANING",
    "every inspected image has its meaning reviewed on record, apart from its identity, and an accurate image has no defect of meaning on record",
    meaningProblems.length === 0 ? "pass" : "fail",
    meaningProblems.length === 0 ? `${meant} inspected images, each with the facts it keeps true, the numbers and words read off it, and what it says alone on record` : shown(meaningProblems, 6),
  );

  // The reference.
  const states = fresh.map((row) => row.reference);
  const badState = fresh.filter((row) => !REFERENCE_STATES.includes(row.reference)).map((row) => String(row.file));
  const allAttached = fresh.length > 0 && states.every((state) => state === "attached");
  const claimed = manifest.reference?.attached_to_every_call === true;
  const referenceProblems = [];
  if (badState.length > 0) referenceProblems.push(`"reference" must be "attached" or "not supplied": ${shown(badState)}`);
  if (claimed && fresh.length > 0 && !allAttached) referenceProblems.push('the record says the reference was attached to every call, and some row says otherwise');
  if (!claimed && fresh.length > 0 && states.every((state) => state === "attached")) referenceProblems.push("every row says the reference was attached, and the record says it was not");
  add("REFERENCE", "the reference is reported as attached only where a row says so", referenceProblems.length === 0 ? "pass" : "fail", referenceProblems.length === 0 ? (claimed ? "attached to every call, through " + manifest.reference.input : "not supplied on every call: the report must say so") : shown(referenceProblems));

  // The counts.
  // Each image is in one place: failed when either review rejects it, accepted when both pass, held otherwise.
  const bucket = (row) => {
    if (!IMAGE_VERDICTS.includes(row.verdict)) return null;
    const meaning = meaningOf(row) ?? "unable to verify";
    if (row.verdict === "needs repair" || meaning === "misleading") return "failed";
    return row.verdict === "identity consistent" && meaning === "accurate" ? "accepted" : "held";
  };
  const count = (name) => rows.filter((row) => bucket(row) === name).length;
  const computed = {
    new_images: fresh.length,
    reused_images: reused.length,
    failed_images: count("failed"),
    held_images: count("held"),
    accepted_images: count("accepted"),
  };
  const countProblems = Object.entries(computed).filter(([key, value]) => manifest.counts?.[key] !== value).map(([key, value]) => `${key} is ${manifest.counts?.[key]} and the rows say ${value}`);
  // Every call is an image of the record or a failed call of the record, so a call that made an image nobody kept
  // cannot hide from the count of repairs.
  const failedCalls = (Array.isArray(manifest.failed_calls) ? manifest.failed_calls : []).filter((entry) => isObject(entry) && Number.isInteger(entry.call));
  const calledTotal = manifest.counts?.generator_calls;
  if (Number.isInteger(calledTotal)) {
    if (calledTotal !== fresh.length + failedCalls.length) countProblems.push(`generator_calls is ${calledTotal}, and ${fresh.length} images plus ${failedCalls.length} failed calls make ${fresh.length + failedCalls.length}`);
    const accounted = [...callNumbers.keys(), ...failedCalls.map((entry) => entry.call)];
    const repeated = [...new Set(accounted.filter((number, index) => accounted.indexOf(number) !== index))];
    const missing = Array.from({ length: Math.max(calledTotal, 0) }, (_, index) => index + 1).filter((number) => !accounted.includes(number));
    if (repeated.length > 0) countProblems.push(`call ${repeated.join(", ")} is recorded twice`);
    if (missing.length > 0) countProblems.push(`call ${missing.join(", ")} is neither an image of the record nor a failed call`);
  }
  if (computed.new_images + computed.reused_images !== computed.accepted_images + computed.failed_images + computed.held_images) countProblems.push("new plus reused is not accepted plus failed plus held");
  add("COUNTS", "the counts are the rows' counts, and every call is an image or a failed call", countProblems.length === 0 ? "pass" : "fail", countProblems.length === 0 ? `${manifest.counts.generator_calls} calls, ${computed.new_images} new, ${computed.reused_images} reused, ${computed.failed_images} failed, ${computed.held_images} held, ${computed.accepted_images} accepted` : shown(countProblems));

  // Repairs and the series gate. A scene's final image is the last attempt of its chain of repair_of, and earlier
  // attempts stay in the folder and in the counts.
  const repairRows = fresh.filter((row) => row.repair_of !== undefined && row.repair_of !== null);
  const repairedFiles = new Set(repairRows.map((row) => String(row.repair_of)));
  const finals = fresh.filter((row) => !repairedFiles.has(String(row.file)));
  if (manifest.mode !== "generate") {
    add("REPAIRS", "repairs stay within the limits: two for one image, six for the run", "skip", "an edit run has no series plan");
    add("SERIES", "the series gate was run and recorded", "skip", "an edit run has no series plan");
  } else {
    const repairProblems = [];
    const byFile = new Map(fresh.map((row) => [String(row.file), row]));
    const parentOf = new Map();
    for (const row of repairRows) {
      const target = byFile.get(String(row.repair_of));
      if (typeof row.repair_of !== "string" || target === undefined || target === row) repairProblems.push(`${row.file}: "repair_of" names no other image of this run`);
      else if (Number.isInteger(row.call) && Number.isInteger(target.call) && target.call >= row.call) repairProblems.push(`${row.file}: it repairs ${row.repair_of}, which a later call made`);
      else parentOf.set(String(row.file), String(row.repair_of));
    }
    const repairsOf = new Map();
    for (const file of parentOf.keys()) {
      let root = file;
      for (let hops = 0; parentOf.has(root) && hops <= fresh.length; hops += 1) root = parentOf.get(root);
      repairsOf.set(root, (repairsOf.get(root) ?? 0) + 1);
    }
    for (const [root, made] of repairsOf) {
      if (made > REPAIR_LIMITS.perImage) repairProblems.push(`${root} was repaired ${made} times, and the limit for one image is ${REPAIR_LIMITS.perImage}`);
    }
    if (repairRows.length > REPAIR_LIMITS.perSeries) repairProblems.push(`the run made ${repairRows.length} repairs, and the limit for a series is ${REPAIR_LIMITS.perSeries}`);
    if (Number.isInteger(manifest.repairs?.used) && manifest.repairs.used !== repairRows.length) repairProblems.push(`repairs.used is ${manifest.repairs.used}, and ${repairRows.length} rows have repair_of`);
    const planned = manifest.planned_images;
    if (Number.isInteger(planned)) {
      const firstAttempts = fresh.length - repairRows.length;
      if (firstAttempts > planned) repairProblems.push(`${firstAttempts} images are first attempts, and the plan asked for ${planned}: a repair that does not say it is one, or a picture nobody planned`);
      if (fresh.length > planned + REPAIR_LIMITS.perSeries) repairProblems.push(`${fresh.length} images were made, and ${planned} planned plus ${REPAIR_LIMITS.perSeries} repairs allow ${planned + REPAIR_LIMITS.perSeries}`);
    } else {
      repairProblems.push('"planned_images" is missing, so nothing says how many pictures were planned and the limit on repairs cannot be checked');
    }
    add(
      "REPAIRS",
      "repairs stay within the limits: two for one image, six for the run",
      repairProblems.length === 0 ? "pass" : "fail",
      repairProblems.length === 0 ? `${repairRows.length} repairs of the ${REPAIR_LIMITS.perSeries} allowed, ${fresh.length} images for ${planned} planned` : shown(repairProblems, 6),
    );

    if (finals.length < 2) {
      add("SERIES", "the series gate was run and recorded", "skip", "a single picture has no series to compare");
    } else {
      const seriesProblems = [];
      const gate = manifest.series_review;
      if (!isObject(gate)) {
        seriesProblems.push('no "series_review": the series gate was not run, or was not recorded');
      } else {
        const finalFiles = finals.map((row) => String(row.file));
        const opened = new Set(Array.isArray(gate.images_opened) ? gate.images_opened.map(String) : []);
        const notOpened = finalFiles.filter((file) => !opened.has(file));
        if (notOpened.length > 0) seriesProblems.push(`the gate did not open every final image: ${shown(notOpened)}`);
        if (manifest.reference?.attached_to_every_call === true && gate.reference_opened !== true) seriesProblems.push("the reference was attached, and the gate does not say it was opened beside the images");
        const pairs = Array.isArray(gate.pairs_compared) ? gate.pairs_compared.filter((pair) => Array.isArray(pair) && pair.length === 2 && pair.every((file) => finalFiles.includes(String(file)))) : [];
        if (pairs.length < finals.length - 1) seriesProblems.push(`the gate compared ${pairs.length} pairs of final images (a pair is two file names of this run), and ${finals.length} images need at least ${finals.length - 1}`);
        if (typeof gate.observations !== "string" || gate.observations.trim() === "" || NOT_AN_OBSERVATION.has(bare(gate.observations))) seriesProblems.push('"series_review.observations" says nothing about what was seen across the images');
        if (typeof gate.passed !== "boolean") {
          seriesProblems.push('"series_review.passed" must be true or false');
        } else if (gate.passed === true) {
          const notApproved = finals.filter((row) => row.accepted !== true).map((row) => String(row.file));
          if (notApproved.length > 0) seriesProblems.push(`the gate says the series passed, and ${notApproved.length} final images were not approved: ${shown(notApproved)}`);
        }
      }
      add("SERIES", "the series gate was run and recorded", seriesProblems.length === 0 ? "pass" : "fail", seriesProblems.length === 0 ? `${finals.length} final images opened and compared${gate.passed === true ? ", and the series passed" : ", and the gate says the series did not pass"}` : shown(seriesProblems, 6));
    }
  }

  // Earlier output, when it was listed before the run.
  if (before === null) {
    add("UNTOUCHED", "earlier output is untouched and nothing was written outside the run folder", "skip", "no listing from before the run was given");
  } else {
    const untouched = [];
    for (const entry of before) {
      const earlierFile = path.join(root, ...String(entry.path).split("/"));
      if (!isRegularFile(earlierFile)) untouched.push(`${entry.path} was deleted or moved`);
      else if (hashOf(earlierFile) !== entry.sha256) untouched.push(`${entry.path} was changed`);
    }
    const known = new Set(before.map((entry) => entry.path));
    const runPrefix = `${relative(folder)}/`;
    for (const entry of snapshotFolder(archetypeFolder, root)) {
      if (!known.has(entry.path) && !entry.path.startsWith(runPrefix)) untouched.push(`${entry.path} is new and outside the run folder`);
    }
    add("UNTOUCHED", "earlier output is untouched and nothing was written outside the run folder", untouched.length === 0 ? "pass" : "fail", untouched.length === 0 ? `${before.length} earlier files, all as they were` : shown(untouched));
  }

  // The host's own log of the calls, when there is one.
  if (calls === null) {
    add("CALLS", "the run did not claim more image-tool calls than the host's log shows", "skip", "no log was given, so the counts are the agent's own");
  } else {
    const found = calls.length;
    const claimedCalls = manifest.counts?.generator_calls;
    const callProblems = [];
    if (Number.isInteger(claimedCalls) && claimedCalls > found) callProblems.push(`the record claims ${claimedCalls} image-tool calls, and the log shows ${found}`);
    if (fresh.length > found) callProblems.push(`${fresh.length} images are listed as made by a call, and the log shows ${found} calls`);
    if (exact && Number.isInteger(claimedCalls) && claimedCalls !== found) callProblems.push(`the log covers this run alone and shows ${found} calls, and the record says ${claimedCalls}`);
    add("CALLS", "the run did not claim more image-tool calls than the host's log shows", callProblems.length === 0 ? "pass" : "fail", callProblems.length === 0 ? `the log shows ${found} calls; the record says ${claimedCalls}` : shown(callProblems));
    if (found > claimedCalls && !exact) add("LOG-HOLDS-MORE", "the log holds more calls than this record", "note", `${found - claimedCalls} calls in the log are not in this run's record: other runs of the conversation, or calls the record left out`);
    if (reference) {
      for (const result of auditSeries(calls, { reference, mode: manifest.reference?.attached_to_every_call === false ? "text-only" : "attached" }).results) {
        if (!["SAME-CHARACTER", "CALLS"].includes(result.id)) results.push({ ...result, title: `in the log, ${result.title}` });
      }
    }
  }
  return finish(manifest);
}

/** The run's counts as one line, from its record. */
export function summaryLine(manifest) {
  const counts = isObject(manifest?.counts) ? manifest.counts : {};
  return `${manifest?.run ?? "(no run)"}: ${counts.generator_calls ?? "?"} image-tool calls, ${counts.new_images ?? "?"} new images, ${counts.reused_images ?? "?"} reused, ${counts.failed_images ?? "?"} failed, ${counts.held_images ?? "?"} held, ${counts.accepted_images ?? "?"} accepted`;
}
