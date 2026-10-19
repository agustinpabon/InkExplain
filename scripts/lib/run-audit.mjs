// Audits one run folder of generated images against its run record.
//
// A report that says "five images generated" is a claim. The run folder, the run record (manifest.json), and the
// host's log of image calls are the evidence. This reads them and checks the rules of references/workflow/delivery.md
// that they can show: the run has its own folder, every image in it is a row of the record, a new image was made by a
// call of this run and is not a copy of an image that was already in the archetype's folder, a reused image is
// labeled as reused, no image is "identity consistent" without having been inspected, and the counts add up. With a
// log of the host's calls it also checks that the run did not claim more calls than were made. It cannot say whether
// an image is right: that is for a person, or an agent looking at the image.
//
// Offline, like every script here. The CLI is scripts/audit-run.mjs.

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { IMAGE_VERDICTS, RUN_COUNT_FIELDS, RUN_FOLDER_PATTERN, RUN_MANIFEST } from "./config.mjs";
import { auditSeries } from "./series-audit.mjs";

const IMAGE_FILE = /\.(?:png|jpe?g|webp)$/i;
// A copy of the packaged reference that was made for a tool that cannot read the skill folder: not one of the run's images.
const REFERENCE_COPY = /^identity-reference\.(?:png|jpe?g|webp)$/i;
const ORIGINS = ["generated", "edited", "reused"];
const REFERENCE_STATES = ["attached", "not supplied"];
const MAX_FILES = 5000;

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
 * and `before` (snapshotFolder of the archetype's folder, taken before the run).
 * Returns { results, ok, manifest }, each result being { id, title, status: "pass" | "fail" | "skip" | "note", detail }.
 */
export function auditRun(runFolder, { calls = null, exact = false, reference = null, workspace = null, before = null } = {}) {
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
      const from = typeof row.from === "string" && !path.isAbsolute(row.from) && !row.from.split("/").includes("..") ? path.join(root, ...row.from.split("/")) : null;
      if (from === null || !isRegularFile(from)) origin.push(`${label}: an edited image names the earlier image it came from, and it must exist`);
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

  // The verdicts.
  const verdicts = [];
  for (const row of rows) {
    const label = String(row.file);
    if (!IMAGE_VERDICTS.includes(row.verdict)) verdicts.push(`${label}: the verdict must be one of ${IMAGE_VERDICTS.map((v) => `"${v}"`).join(", ")}`);
    if (typeof row.inspected !== "boolean" || typeof row.accepted !== "boolean") verdicts.push(`${label}: "inspected" and "accepted" must be true or false`);
    if (row.inspected === false && row.verdict !== "unable to verify") verdicts.push(`${label}: an image that was not inspected can only be "unable to verify"`);
    if (row.verdict === "identity consistent" && (row.inspected !== true || row.accepted !== true)) verdicts.push(`${label}: "identity consistent" needs an inspection and an accepted image`);
    if (row.accepted === true && row.verdict !== "identity consistent") verdicts.push(`${label}: only an "identity consistent" image is accepted`);
  }
  add("VERDICTS", "a verdict is one of four phrases, and nothing unseen is approved", verdicts.length === 0 ? "pass" : "fail", verdicts.length === 0 ? `${rows.length} verdicts` : shown(verdicts));

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
  const count = (predicate) => rows.filter(predicate).length;
  const computed = {
    new_images: fresh.length,
    reused_images: reused.length,
    failed_images: count((row) => row.verdict === "needs repair"),
    held_images: count((row) => row.verdict === "needs human review" || row.verdict === "unable to verify"),
    accepted_images: count((row) => row.verdict === "identity consistent"),
  };
  const countProblems = Object.entries(computed).filter(([key, value]) => manifest.counts?.[key] !== value).map(([key, value]) => `${key} is ${manifest.counts?.[key]} and the rows say ${value}`);
  const calledAtLeast = Math.max(fresh.length, ...callNumbers.keys(), 0);
  if (Number.isInteger(manifest.counts?.generator_calls) && manifest.counts.generator_calls < calledAtLeast) countProblems.push(`generator_calls is ${manifest.counts.generator_calls} and the rows need at least ${calledAtLeast}`);
  if (computed.new_images + computed.reused_images !== computed.accepted_images + computed.failed_images + computed.held_images) countProblems.push("new plus reused is not accepted plus failed plus held");
  add("COUNTS", "the counts are the rows' counts, and new images never exceed calls", countProblems.length === 0 ? "pass" : "fail", countProblems.length === 0 ? `${manifest.counts.generator_calls} calls, ${computed.new_images} new, ${computed.reused_images} reused, ${computed.failed_images} failed, ${computed.held_images} held, ${computed.accepted_images} accepted` : shown(countProblems));

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
