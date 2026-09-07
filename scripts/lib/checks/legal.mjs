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
];

// [stage] initial legal check
