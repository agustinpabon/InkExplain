// The provenance manifest of the gallery (examples/gallery/provenance.json) says where every
// published sample set came from. A historical set is an unmodified copy of files in an upstream
// repository at a recorded commit; an inkexplain set is a render made for this project, recorded
// with its tool, date, and reviewer. Each image carries its git blob SHA-1, the same hash git
// uses for the file in the upstream tree, so anyone can check a copy against its source.
//
// The manifest is evidence, not a lock: editing a historical image is possible, but it shows up
// as a hash change that must be explained by relabelling the set.

import crypto from "node:crypto";
import path from "node:path";
import { GALLERY_FILE_PATTERN, GALLERY_LANGUAGES, PATHS } from "./config.mjs";
import { isValidIsoDate } from "./registry.mjs";
import { normalizeRelativePath } from "./repository.mjs";

export const ORIGINS = Object.freeze({
  historical: "An unmodified copy of a file published by another project, under that project's license.",
  inkexplain: "A render made for InkExplain with an image tool, reviewed by a named person.",
});

const ROOT_KEYS = new Set(["$comment", "schemaVersion", "sets"]);
const SET_KEYS = new Set(["directory", "origin", "source", "generated", "reviewedBy", "reviewedOn", "note", "files"]);
const SOURCE_KEYS = new Set(["project", "repository", "commit", "path", "license", "copyright", "firstPublished"]);
const GENERATED_KEYS = new Set(["tool", "date"]);
const PLACEHOLDERS = new Set(["", "reviewer", "tool", "pending", "tbd", "todo", "n/a", "na", "unknown", "-"]);
const SHA_PATTERN = /^[0-9a-f]{40}$/;

/** The git blob SHA-1 of a file's bytes: what `git hash-object <file>` prints. */
export function gitBlobSha1(buffer) {
  return crypto
    .createHash("sha1")
    .update(Buffer.from(`blob ${buffer.length}`))
    .update(Buffer.from([0]))
    .update(buffer)
    .digest("hex");
}

function isText(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkKeys(object, allowed, where, issues) {
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) issues.push({ where, message: `unknown field ${JSON.stringify(key)}` });
  }
}

function isNamed(value) {
  return isText(value) && !PLACEHOLDERS.has(value.trim().toLowerCase());
}

function validateSource(source, where, issues) {
  if (!isPlainObject(source)) {
    issues.push({ where, message: "a historical set needs a source object" });
    return;
  }
  checkKeys(source, SOURCE_KEYS, where, issues);
  for (const field of ["project", "path", "license", "copyright"]) {
    if (!isText(source[field])) issues.push({ where: `${where}.${field}`, message: "must be a non-empty string" });
  }
  if (typeof source.repository !== "string" || !/^https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/.test(source.repository)) {
    issues.push({ where: `${where}.repository`, message: "must be a https://github.com/<owner>/<repository> URL" });
  }
  if (typeof source.commit !== "string" || !SHA_PATTERN.test(source.commit)) {
    issues.push({ where: `${where}.commit`, message: "must be the full 40-character commit hash that was inspected" });
  }
  if (!isValidIsoDate(source.firstPublished)) {
    issues.push({ where: `${where}.firstPublished`, message: "must be the YYYY-MM-DD day the source first published these files" });
  }
  if (isText(source.path)) {
    try {
      if (normalizeRelativePath(source.path) !== source.path) issues.push({ where: `${where}.path`, message: "must be a normalized path inside the source repository" });
    } catch (error) {
      issues.push({ where: `${where}.path`, message: error.message });
    }
  }
}

function validateSet(set, index, issues) {
  const where = `sets[${index}]`;
  if (!isPlainObject(set)) {
    issues.push({ where, message: "must be an object" });
    return;
  }
  checkKeys(set, SET_KEYS, where, issues);
  const directory = set.directory;
  if (typeof directory !== "string") {
    issues.push({ where: `${where}.directory`, message: "must be the repository-relative directory of the images" });
  } else {
    const match = directory.match(new RegExp(`^${PATHS.galleryDir}/([a-z]{2})/([a-z][a-z0-9-]*)$`));
    if (match === null || !GALLERY_LANGUAGES.includes(match[1])) {
      issues.push({ where: `${where}.directory`, message: `must look like ${PATHS.galleryDir}/<${GALLERY_LANGUAGES.join("|")}>/<archetype id>` });
    }
  }
  if (!Object.hasOwn(ORIGINS, set.origin)) {
    issues.push({ where: `${where}.origin`, message: `must be one of ${Object.keys(ORIGINS).join(", ")}` });
  }
  if (set.origin === "historical") {
    validateSource(set.source, `${where}.source`, issues);
    for (const field of ["generated", "reviewedBy", "reviewedOn"]) {
      if (set[field] !== undefined) issues.push({ where: `${where}.${field}`, message: "belongs to an inkexplain set, not a copy of another project's files" });
    }
  } else if (set.origin === "inkexplain") {
    if (set.source !== undefined) issues.push({ where: `${where}.source`, message: "an inkexplain set is not a copy; record how it was generated instead" });
    if (!isPlainObject(set.generated)) {
      issues.push({ where: `${where}.generated`, message: "an inkexplain set needs the tool and the date it was generated" });
    } else {
      checkKeys(set.generated, GENERATED_KEYS, `${where}.generated`, issues);
      if (!isNamed(set.generated.tool)) issues.push({ where: `${where}.generated.tool`, message: "must name the image tool, not a placeholder" });
      if (!isValidIsoDate(set.generated.date)) issues.push({ where: `${where}.generated.date`, message: "must be the real YYYY-MM-DD generation date" });
    }
    if (!isNamed(set.reviewedBy)) issues.push({ where: `${where}.reviewedBy`, message: "needs the person who reviewed these renders, not a placeholder" });
    if (!isValidIsoDate(set.reviewedOn)) issues.push({ where: `${where}.reviewedOn`, message: "needs the real YYYY-MM-DD review date" });
  }
  if (set.note !== undefined && !isText(set.note)) issues.push({ where: `${where}.note`, message: "must be a non-empty string when present" });
  if (!isPlainObject(set.files) || Object.keys(set.files).length === 0) {
    issues.push({ where: `${where}.files`, message: "must map every image name to its git blob SHA-1" });
  } else {
    for (const [name, sha] of Object.entries(set.files)) {
      if (!GALLERY_FILE_PATTERN.test(name)) issues.push({ where: `${where}.files.${name}`, message: "gallery files are named NN-kebab-slug.png" });
      if (typeof sha !== "string" || !SHA_PATTERN.test(sha)) issues.push({ where: `${where}.files.${name}`, message: "must be a 40-character lowercase git blob SHA-1" });
    }
  }
}

/** Structural validation of parsed provenance.json data. Returns a list of { where, message }. */
export function validateProvenanceData(data) {
  const issues = [];
  if (!isPlainObject(data)) return [{ where: "$", message: "the manifest must be a JSON object" }];
  checkKeys(data, ROOT_KEYS, "$", issues);
  if (data.schemaVersion !== 1) issues.push({ where: "schemaVersion", message: "must be 1" });
  if (!Array.isArray(data.sets) || data.sets.length === 0) {
    issues.push({ where: "sets", message: "must be a non-empty array" });
    return issues;
  }
  data.sets.forEach((set, index) => validateSet(set, index, issues));
  const seen = new Set();
  for (const [index, set] of data.sets.entries()) {
    if (typeof set?.directory !== "string") continue;
    if (seen.has(set.directory)) issues.push({ where: `sets[${index}].directory`, message: `duplicate set for ${set.directory}` });
    seen.add(set.directory);
  }
  return issues;
}

/**
 * Read the manifest. Returns { manifest, issues }: manifest is null when the file is missing or
 * invalid, and issues says why. A repository without published samples may have no manifest.
 */
export function loadProvenance(repo) {
  const file = PATHS.galleryProvenance;
  if (!repo.isFile(file)) return { manifest: null, issues: [{ where: file, message: "file is missing" }], missing: true };
  let data;
  try {
    data = JSON.parse(repo.readText(file));
  } catch (error) {
    return { manifest: null, issues: [{ where: "$", message: `invalid JSON: ${error.message}` }], missing: false };
  }
  const issues = validateProvenanceData(data);
  return { manifest: issues.length === 0 ? data : null, issues, missing: false };
}

/** The set recorded for a gallery directory, or undefined. */
export function setFor(manifest, directory) {
  return manifest?.sets.find((set) => set.directory === directory);
}

/** One sentence a person can read in the gallery: where the images came from. */
export function describeSet(set) {
  if (set.origin === "historical") {
    const { project, license, copyright, firstPublished } = set.source;
    return `Unmodified copies of ${project} images (${license}, ${copyright}), first published ${firstPublished}.`;
  }
  return `InkExplain renders generated with ${set.generated.tool} on ${set.generated.date}, reviewed by ${set.reviewedBy} on ${set.reviewedOn}.`;
}

/** Image files of a gallery directory, as names, in sorted order. */
export function imageNames(repo, directory) {
  return repo
    .entries(directory)
    .filter((entry) => entry.type === "file" && path.posix.extname(entry.name).toLowerCase() === ".png")
    .map((entry) => entry.name);
}
