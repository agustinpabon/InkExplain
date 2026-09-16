#!/usr/bin/env node
// Validate the InkExplain repository and skill package.
//
//   node scripts/validate.mjs                 run every check
//   node scripts/validate.mjs --only SCHEMA   run one area (or a check id such as DOC-002)
//   node scripts/validate.mjs --json          machine-readable results
//   node scripts/validate.mjs --list          list checks without running them
//
// Exit codes: 0 all checks passed, 1 at least one check failed, 2 usage error.

import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { EXIT, createContext, exitCodeFor, filterChecks, formatJson, formatText, runChecks } from "./lib/check-runner.mjs";
import { ALL_CHECKS } from "./lib/checks/index.mjs";

const USAGE = `Usage: node scripts/validate.mjs [--root <dir>] [--only <ID|AREA>[,...]] [--json] [--verbose] [--list]`;

export function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
  let options;
  try {
    ({ values: options } = parseArgs({
      args: argv,
      options: {
        root: { type: "string" },
        only: { type: "string", multiple: true },
        json: { type: "boolean", default: false },
        verbose: { type: "boolean", default: false },
        list: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
      strict: true,
      allowPositionals: false,
    }));
  } catch (error) {
    stderr.write(`${error.message}\n${USAGE}\n`);
    return EXIT.usage;
  }
  if (options.help) {
    stdout.write(`${USAGE}\n`);
    return EXIT.ok;
  }

  const selectors = (options.only ?? []).flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
  const checks = filterChecks(ALL_CHECKS, selectors);
  if (checks.length === 0) {
    stderr.write(`No checks match ${selectors.join(", ")}.\n${USAGE}\n`);
    return EXIT.usage;
  }
  if (options.list) {
    stdout.write(`${checks.map((check) => `${check.id}\t${check.title}`).join("\n")}\n`);
    return EXIT.ok;
  }

  const root = path.resolve(options.root ?? path.join(import.meta.dirname, ".."));
  const results = runChecks(checks, createContext(root));
  stdout.write(`${options.json ? formatJson(results) : formatText(results, { verbose: options.verbose })}\n`);
  return exitCodeFor(results);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  process.exitCode = main();
}

// [stage] test(checks/branding): verify that clean attribution names do not trigger false positives
