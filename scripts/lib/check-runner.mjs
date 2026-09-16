// Check model, execution, and reporting.
//
// A check is { id, area, title, requires?, run(context) } where run returns an
// array of issues: { message, path?, line? }. An empty array means the check
// passed. A check that throws fails with a "check crashed" issue instead of
// aborting the run, so one defect never hides the results of other checks.

import { LANGUAGE_ALLOWLIST, ORIGIN_IDENTIFIER_ALLOWLIST } from "./config.mjs";
import { loadLocales } from "./docs-render.mjs";
import { loadRegistry } from "./registry.mjs";
import { Repository } from "./repository.mjs";

export const EXIT = Object.freeze({ ok: 0, failed: 1, usage: 2 });

const CHECK_ID_PATTERN = /^[A-Z]+-\d{3}$/;

export function defineCheck(definition) {
  const { id, area, title, run, requires = [] } = definition;
  if (!CHECK_ID_PATTERN.test(id)) throw new Error(`check id ${id} must look like AREA-001`);
  if (typeof run !== "function") throw new Error(`check ${id} needs a run function`);
  return Object.freeze({ id, area, title, run, requires: Object.freeze([...requires]) });
}

/**
 * Shared state handed to every check. `policy` carries the allowlists so tests
 * can validate small fixture repositories against fixture-specific policy.
 */
export function createContext(root, { policy = {} } = {}) {
  const repo = new Repository(root);
  const loaded = loadRegistry(repo);
  const localeResult = loadLocales(repo);
  return {
    repo,
    registry: loaded.registry,
    registrySchemaIssues: loaded.schemaIssues,
    registryAliasIssues: loaded.aliasIssues,
    locales: localeResult.locales,
    localeIssues: localeResult.issues,
    policy: {
      languageAllowlist: LANGUAGE_ALLOWLIST,
      originAllowlist: ORIGIN_IDENTIFIER_ALLOWLIST,
      ...policy,
    },
  };
}

const PREREQUISITES = {
  registry: (context) => context.registry !== null,
  locales: (context) => context.locales.length > 0,
};

/** Select checks by id or area prefix (case-insensitive). */
export function filterChecks(checks, selectors = []) {
  if (selectors.length === 0) return checks;
  const wanted = selectors.map((selector) => selector.toUpperCase());
  return checks.filter((check) => wanted.some((selector) => check.id === selector || check.area === selector));
}

export function runChecks(checks, context) {
  const ids = new Set();
  const results = [];
  for (const check of checks) {
    if (ids.has(check.id)) throw new Error(`duplicate check id ${check.id}`);
    ids.add(check.id);
    const missing = check.requires.filter((requirement) => !PREREQUISITES[requirement]?.(context));
    if (missing.length > 0) {
      results.push({ ...describe(check), status: "skip", issues: [{ message: `skipped: ${missing.join(", ")} unavailable` }] });
      continue;
    }
    let issues;
    try {
      issues = check.run(context) ?? [];
    } catch (error) {
      issues = [{ message: `check crashed: ${error?.stack ?? error}` }];
    }
    results.push({ ...describe(check), status: issues.length === 0 ? "pass" : "fail", issues });
  }
  return results;
}

function describe(check) {
  return { id: check.id, area: check.area, title: check.title };
}

function summarize(results) {
  const count = (status) => results.filter((result) => result.status === status).length;
  return { total: results.length, passed: count("pass"), failed: count("fail"), skipped: count("skip") };
}

export function exitCodeFor(results) {
  return results.some((result) => result.status === "fail") ? EXIT.failed : EXIT.ok;
}

function formatLocation(issue) {
  if (!issue.path) return "";
  return issue.line ? `${issue.path}:${issue.line}: ` : `${issue.path}: `;
}

export function formatText(results, { verbose = false } = {}) {
  const lines = [];
  for (const result of results) {
    lines.push(`[${result.status.toUpperCase()}] ${result.id} ${result.title}`);
    if (result.status !== "pass" || verbose) {
      for (const issue of result.issues) lines.push(`    - ${formatLocation(issue)}${issue.message}`);
    }
  }
  const { total, passed, failed, skipped } = summarize(results);
  lines.push(`Summary: total=${total} passed=${passed} failed=${failed} skipped=${skipped}`);
  return lines.join("\n");
}

export function formatJson(results) {
  return JSON.stringify({ summary: summarize(results), results }, null, 2);
}

// [stage] refactor(validate): print clear summary box showing total passed and failed checks
