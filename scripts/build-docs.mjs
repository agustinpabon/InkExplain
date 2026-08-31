#!/usr/bin/env node
// Regenerate documents derived from skills/inkexplain/registry.json and
// readmes/locales.json: references/routing.md plus the language selector and
// archetype table regions of every README.
//
//   node scripts/build-docs.mjs           write updated files
//   node scripts/build-docs.mjs --check   exit 1 if any file is out of date
//
// Exit codes: 0 up to date (or written), 1 out of date or invalid input, 2 usage error.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { EXIT } from "./lib/check-runner.mjs";
import { loadLocales, planGeneratedDocuments } from "./lib/docs-render.mjs";
import { loadRegistry } from "./lib/registry.mjs";
import { Repository } from "./lib/repository.mjs";

const USAGE = "Usage: node scripts/build-docs.mjs [--check] [--root <dir>]";

export function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
  let options;
  try {
    ({ values: options } = parseArgs({
      args: argv,
      options: { check: { type: "boolean", default: false }, root: { type: "string" } },
      strict: true,
      allowPositionals: false,
    }));
  } catch (error) {
    stderr.write(`${error.message}\n${USAGE}\n`);
    return EXIT.usage;
  }

  const repo = new Repository(path.resolve(options.root ?? path.join(import.meta.dirname, "..")));
  const { registry, schemaIssues, aliasIssues } = loadRegistry(repo);
  const { locales, issues: localeIssues } = loadLocales(repo);
  const inputProblems = [
    ...schemaIssues.map((issue) => `registry.json ${issue.where}: ${issue.message}`),
    ...aliasIssues.map((issue) => `registry.json ${issue.where}: ${issue.message}`),
    ...localeIssues.map((issue) => `locales.json ${issue}`),
  ];
  if (inputProblems.length > 0 || !registry) {
    stderr.write(`Cannot generate documents:\n${inputProblems.map((problem) => `  - ${problem}`).join("\n")}\n`);
    return EXIT.failed;
  }

  // Files with structural problems (missing file or region markers) are reported
  // and skipped; every other generated document is still brought up to date.
  const plans = planGeneratedDocuments(repo, registry, locales);
  const structural = plans.flatMap((plan) => plan.problems);
  const stale = plans.filter((plan) => plan.problems.length === 0 && plan.current !== plan.expected);
  const reportStructural = () => {
    if (structural.length > 0) stderr.write(`Cannot generate:\n${structural.map((problem) => `  - ${problem}`).join("\n")}\n`);
  };

  if (options.check) {
    reportStructural();
    if (stale.length > 0) {
      stdout.write(`Out of date (run npm run build:docs):\n${stale.map((plan) => `  - ${plan.path}`).join("\n")}\n`);
    } else if (structural.length === 0) {
      stdout.write("Generated documents are up to date.\n");
    }
    return stale.length === 0 && structural.length === 0 ? EXIT.ok : EXIT.failed;
  }
  for (const plan of stale) {
    fs.mkdirSync(path.dirname(repo.resolve(plan.path)), { recursive: true });
    fs.writeFileSync(repo.resolve(plan.path), plan.expected, "utf8");
    stdout.write(`updated ${plan.path}\n`);
  }
  if (stale.length === 0 && structural.length === 0) stdout.write("Generated documents are up to date.\n");
  reportStructural();
  return structural.length === 0 ? EXIT.ok : EXIT.failed;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  process.exitCode = main();
}

// [stage] standardize error reporting
