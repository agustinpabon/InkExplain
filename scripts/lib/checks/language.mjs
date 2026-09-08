// LANG: English-default surfaces with narrow, auditable multilingual exceptions.

import { defineCheck } from "../check-runner.mjs";
import {
  LANGUAGE_ALLOWLIST,
  LANGUAGE_DEFAULT_SURFACES,
  LANGUAGE_EXCEPTION_CATEGORIES,
  LANGUAGE_SCAN_EXCLUDED_PREFIXES,
  PATHS,
} from "../config.mjs";
import { excerpt } from "./support.mjs";

const HAN = /\p{Script=Han}/u;

/** Han-script tokens a file may contain: archetype aliases everywhere, allowlist entries by path. */
function allowedHanTokens(registry, file, allowlist = LANGUAGE_ALLOWLIST) {
  const tokens = new Set();
  for (const archetype of registry.archetypes) {
    for (const alias of archetype.aliases) if (HAN.test(alias)) tokens.add(alias);
  }
  for (const entry of allowlist) {
    if (entry.paths.includes(file)) tokens.add(entry.token);
  }
  return [...tokens].sort((a, b) => b.length - a.length);
}

/** Findings for lines that still contain Han script once every allowed token is removed. */
export function scanHanText(text, tokens) {
  const findings = [];
  for (const [index, line] of text.split("\n").entries()) {
    if (!HAN.test(line)) continue;
    let residual = line;
    for (const token of tokens) residual = residual.replaceAll(token, " ");
    if (HAN.test(residual)) findings.push({ line: index + 1, excerpt: excerpt(line) });
  }
  return findings;
}

function scannedLanguageFiles(repo) {
  return repo.textFiles().filter((file) => !LANGUAGE_SCAN_EXCLUDED_PREFIXES.some((prefix) => file.startsWith(prefix)));
}

/** Policy problems with allowlist entries. Exposed for tests. */
export function allowlistProblems(allowlist, fileExists) {
  const problems = [];
  for (const [index, entry] of allowlist.entries()) {
    const where = `allowlist[${index}] (${entry.token ?? "?"})`;
    if (!LANGUAGE_EXCEPTION_CATEGORIES.includes(entry.category)) problems.push(`${where}: unknown category ${JSON.stringify(entry.category)}`);
    if (typeof entry.token !== "string" || !HAN.test(entry.token)) problems.push(`${where}: token must contain Han script`);
    if (typeof entry.rationale !== "string" || entry.rationale.trim().length < 10) problems.push(`${where}: needs a rationale`);
    if (!Array.isArray(entry.paths) || entry.paths.length === 0) {
      problems.push(`${where}: needs at least one exact file path`);
      continue;
    }
    for (const filePath of entry.paths) {
      if (/[*?[\]]/.test(filePath) || filePath.endsWith("/")) problems.push(`${where}: ${filePath} must be an exact file, not a pattern or directory`);
      else if (!fileExists(filePath)) problems.push(`${where}: ${filePath} does not exist; remove the stale path`);
    }
  }
  return problems;
}

export const languageChecks = [
  defineCheck({
    id: "LANG-001",
    area: "LANG",
    title: "English-default files contain Han script only as approved tokens",
    requires: ["registry"],
    run({ repo, registry, policy }) {
      const issues = [];
      for (const file of scannedLanguageFiles(repo)) {
        const text = repo.readText(file);
        if (!HAN.test(text)) continue;
        for (const finding of scanHanText(text, allowedHanTokens(registry, file, policy.languageAllowlist))) {
          issues.push({ path: file, line: finding.line, message: `unapproved Han-script text: ${finding.excerpt}` });
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "LANG-002",
    area: "LANG",
    title: "language allowlist entries stay narrow and current",
    run({ repo, policy }) {
      return allowlistProblems(policy.languageAllowlist, (filePath) => repo.isFile(filePath)).map((message) => ({
        path: "scripts/lib/config.mjs",
        message,
      }));
    },
  }),

  defineCheck({
    id: "LANG-003",
    area: "LANG",
    title: "the language policy documents every default surface and exception category",
    run({ repo }) {
      const text = repo.readTextIfExists(PATHS.languagePolicy);
      if (text === null) return [{ path: PATHS.languagePolicy, message: "language policy is missing" }];
      const issues = [];
      for (const label of [...LANGUAGE_DEFAULT_SURFACES, ...LANGUAGE_EXCEPTION_CATEGORIES]) {
        if (!text.toLowerCase().includes(label.toLowerCase())) {
          issues.push({ path: PATHS.languagePolicy, message: `does not mention ${JSON.stringify(label)}` });
        }
      }
      return issues;
    },
  }),
];
