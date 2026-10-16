// LEGAL: license text, copyright notices, origins, and direct attribution for
// every archetype that depicts a third-party character.

import { defineCheck } from "../check-runner.mjs";
import { LEGAL, PATHS } from "../config.mjs";
import { sectionBody } from "../markdown.mjs";
import { packFilePath } from "../registry.mjs";

const collapse = (text) => text.replace(/\s+/g, " ").trim();

/** The holder named in a "Copyright (c) YEAR Holder" line. */
export function copyrightHolder(line) {
  return line.replace(/^Copyright \(c\) \d{4}(?:\s*-\s*\d{4})?\s+/, "").trim();
}

// A notice is a marker ("Copyright", "Copyright:", "(c)", "©", or the word followed by either symbol), the
// years, and the holder. The years are one year, a range ("2024-2026", "2024 – 2026", "2019/2020", "2019-21",
// "2024-present"), or a comma list of them, and may be followed by a comma, colon, or full stop, as in the
// common "Copyright (c) 2015, Holder". A list or quote marker in front ("- ", "1. ", "> ", "**") is allowed.
// White space is collapsed before matching and the patterns have no nested quantifiers, so no line can make
// them slow. A notice with no year, or with the holder before the year, is not read: it cannot be told from prose.
const YEAR_RANGE = String.raw`\d{4}(?: ?[-–—/] ?(?:\d{4}|\d{2}|present))?`;
const NOTICE_YEARS = String.raw`${YEAR_RANGE}(?:, ?${YEAR_RANGE})*`;
const NOTICE_MARKER = String.raw`(?:copyright:?|\(c\)|©)(?: ?(?:\(c\)|©))? ?`;
const NOTICE = new RegExp(String.raw`^(?:(?:[>*+-]|\d{1,3}[.)]) ?)*${NOTICE_MARKER}(${NOTICE_YEARS})[,.:]? (\S.*)$`, "i");
// The same opening, but also after a table pipe, which copyrightNotice does not read.
const NOTICE_LIKE = new RegExp(String.raw`^(?:(?:[>*+|-]|\d{1,3}[.)]) ?)*${NOTICE_MARKER}\d`, "i");

const squeeze = (line) => line.replace(/\s+/g, " ").trim();

/**
 * The notice a line carries, in one canonical form ("Copyright (c) 2026 Holder"), or null. The usual
 * spellings of the marker, the years, and the list or emphasis around them read as the same notice, so a
 * holder does not drop out of a comparison by being written another way.
 */
export function copyrightNotice(line) {
  const match = NOTICE.exec(squeeze(line));
  if (match === null) return null;
  const years = match[1].replace(/ ?([-–—/]) ?/g, (_, dash) => (dash === "/" ? "/" : "-")).replace(/, ?/g, ", ");
  // Emphasis and spaces that trail the holder are dropped by trimming from the end: a pattern for it would take quadratic time.
  let end = match[2].length;
  while (end > 0 && " *_`".includes(match[2][end - 1])) end -= 1;
  const holder = match[2].slice(0, end);
  return holder === "" ? null : `Copyright (c) ${years} ${holder}`;
}

/**
 * Whether a line opens like a notice (the marker, then a year), whether or not copyrightNotice can read it.
 * Such a line that cannot be read, a table row or a notice without a holder, must be reported, not skipped.
 */
export function looksLikeNotice(line) {
  return NOTICE_LIKE.test(squeeze(line));
}

function mentionsName(text, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "u").test(text);
}

export const legalChecks = [
  defineCheck({
    id: "LEGAL-001",
    area: "LEGAL",
    title: "LICENSE keeps the MIT terms and the original copyright",
    run({ repo }) {
      const text = repo.readTextIfExists(PATHS.license);
      if (text === null) return [{ path: PATHS.license, message: "LICENSE is missing" }];
      const issues = [];
      const flat = collapse(text);
      if (!/^MIT License\b/.test(flat)) issues.push({ path: PATHS.license, line: 1, message: 'must start with "MIT License"' });
      for (const line of LEGAL.requiredCopyrightLines) {
        if (!text.split("\n").some((candidate) => candidate.trim() === line)) {
          issues.push({ path: PATHS.license, message: `must keep the line "${line}"` });
        }
      }
      for (const [label, clause] of [
        ["permission grant", LEGAL.mitPermission],
        ["notice condition", LEGAL.mitCondition],
        ["warranty disclaimer", LEGAL.mitDisclaimer],
      ]) {
        if (!flat.includes(collapse(clause))) issues.push({ path: PATHS.license, message: `MIT ${label} is missing or altered` });
      }
      return issues;
    },
  }),

  defineCheck({
    id: "LEGAL-002",
    area: "LEGAL",
    title: "ATTRIBUTIONS credits every third-party archetype's rights holder",
    requires: ["registry"],
    run({ repo, registry }) {
      const text = repo.readTextIfExists(PATHS.attributions);
      if (text === null) return [{ path: PATHS.attributions, message: "ATTRIBUTIONS.md is missing" }];
      const issues = [];
      for (const archetype of registry.archetypes) {
        for (const term of archetype.legalNotice.attributionTerms) {
          if (!text.includes(term)) {
            issues.push({ path: PATHS.attributions, message: `archetype ${archetype.id} attribution ${JSON.stringify(term)} is missing` });
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "LEGAL-003",
    area: "LEGAL",
    title: "every rights.md states status, category, and direct attribution",
    requires: ["registry"],
    run({ repo, registry }) {
      const issues = [];
      for (const archetype of registry.archetypes) {
        const filePath = packFilePath(archetype, "rights.md");
        const text = repo.readTextIfExists(filePath);
        if (text === null) {
          issues.push({ path: filePath, message: `archetype ${archetype.id} has no rights record` });
          continue;
        }
        if (!text.includes(archetype.status)) issues.push({ path: filePath, message: `does not state status ${archetype.status}` });
        if (!text.includes(archetype.category)) issues.push({ path: filePath, message: `does not state category ${archetype.category}` });
        if (archetype.thirdParty && !text.includes(archetype.legalNotice.rightsHolder)) {
          issues.push({ path: filePath, message: `does not name the rights holder ${JSON.stringify(archetype.legalNotice.rightsHolder)}` });
        }
        for (const term of archetype.legalNotice.attributionTerms) {
          if (!text.includes(term)) issues.push({ path: filePath, message: `does not record attribution ${JSON.stringify(term)}` });
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "LEGAL-004",
    area: "LEGAL",
    title: "gated archetypes keep their rights boundaries and sample gates",
    requires: ["registry"],
    run({ registry }) {
      const issues = [];
      const where = { path: PATHS.registryFile };
      for (const archetype of registry.archetypes.filter((candidate) => candidate.gated)) {
        if (archetype.legalNotice.restrictions.length === 0) {
          issues.push({ ...where, message: `gated archetype ${archetype.id} must list its restrictions` });
        }
        if (archetype.sampleGates.status === "approved" && !archetype.sampleGates.authorization) {
          issues.push({
            ...where,
            message: `gated archetype ${archetype.id} cannot approve public samples without a recorded sampleGates.authorization`,
          });
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "LEGAL-005",
    area: "LEGAL",
    title: "ATTRIBUTIONS credits the projects InkExplain originates from",
    run({ repo }) {
      const text = repo.readTextIfExists(PATHS.attributions);
      // LEGAL-002 reports a missing file.
      if (text === null) return [];
      const where = { path: PATHS.attributions };
      const origins = sectionBody(text, LEGAL.originsSection);
      if (origins === null || origins.trim() === "") {
        return [{ ...where, message: `needs a "## ${LEGAL.originsSection}" section that credits the projects InkExplain builds on` }];
      }
      const issues = [];
      const items = [...origins.matchAll(/^\s*[-*]\s+\*\*([^*]+)\*\*(.*)$/gm)];
      if (items.length === 0) issues.push({ ...where, message: `the ${LEGAL.originsSection} section must list each origin project with a bold name` });
      for (const [, name, rest] of items) {
        if (!/https:\/\/github\.com\/[A-Za-z0-9-]+\/[A-Za-z0-9._-]+/.test(rest)) {
          issues.push({ ...where, message: `origin ${JSON.stringify(name)} needs a link to its repository, on the same line` });
        }
        if (!/\b(?:MIT|CC0|CC BY|Apache|BSD)\b|licen[sc]e/i.test(rest)) {
          issues.push({ ...where, message: `origin ${JSON.stringify(name)} needs its license, on the same line` });
        }
      }
      // Every copyright holder LICENSE keeps, apart from the maintainer, is an origin and must be named.
      for (const line of LEGAL.requiredCopyrightLines.filter((candidate) => candidate !== LEGAL.maintainerCopyrightLine)) {
        const holder = copyrightHolder(line);
        if (!mentionsName(origins, holder)) issues.push({ ...where, message: `the ${LEGAL.originsSection} section must credit ${JSON.stringify(holder)}, whose copyright LICENSE keeps` });
      }
      return issues;
    },
  }),

  defineCheck({
    id: "LEGAL-006",
    area: "LEGAL",
    title: "the installed skill carries the MIT terms and every copyright notice",
    run({ repo }) {
      const text = repo.readTextIfExists(PATHS.packageLicense);
      if (text === null) {
        return [{ path: PATHS.packageLicense, message: "missing: installers copy only the skill folder, so the license must be inside it" }];
      }
      const issues = [];
      const flat = collapse(text);
      for (const [label, clause] of [
        ["permission grant", LEGAL.mitPermission],
        ["notice condition", LEGAL.mitCondition],
        ["warranty disclaimer", LEGAL.mitDisclaimer],
      ]) {
        if (!flat.includes(collapse(clause))) issues.push({ path: PATHS.packageLicense, message: `MIT ${label} is missing or altered` });
      }
      // Every holder the repository's LICENSE or the MIT notice in ATTRIBUTIONS.md names must be named here too.
      const present = new Set(text.split("\n").map(copyrightNotice).filter(Boolean));
      const wanted = new Set();
      for (const source of [PATHS.license, PATHS.attributions]) {
        for (const [index, line] of (repo.readTextIfExists(source) ?? "").split("\n").entries()) {
          const notice = copyrightNotice(line);
          if (notice !== null) wanted.add(notice);
          // A line that opens like a notice but cannot be read would let its holder drop out unseen, so it fails.
          else if (looksLikeNotice(line)) {
            issues.push({ path: source, line: index + 1, message: `this line opens like a copyright notice but cannot be read as one; write it as "Copyright (c) 2026 Holder" so the installed license can be compared with it: ${line.trim().slice(0, 80)}` });
          }
        }
      }
      for (const notice of wanted) {
        if (!present.has(notice)) issues.push({ path: PATHS.packageLicense, message: `must keep the line "${notice}" that ${PATHS.license} or ${PATHS.attributions} names` });
      }
      return issues;
    },
  }),
];
