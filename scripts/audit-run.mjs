#!/usr/bin/env node
// Check one run folder of generated images against its run record, and against the host's log of image calls.
//
//   node scripts/audit-run.mjs --snapshot assets/my-repo-xiaohei > before.json     (before the run)
//   node scripts/audit-run.mjs --before before.json assets/my-repo-xiaohei/run-20261019-143502-7f3a
//   node scripts/audit-run.mjs --calls session.jsonl --exact --reference references/archetypes/xiaohei/xiaohei.png <run folder>
//
// The log is a Codex session rollout, an Antigravity transcript (transcript.jsonl in the conversation's
// .system_generated/logs folder), or a JSON list of image-tool calls. A report that says "five images generated" is a
// claim; this reads what the folder, the run record, and the log show. It also fails a record whose approved images
// carry no observations or no review of what the picture says (the numbers and words it shows, the facts it had to
// keep true), whose repairs pass two for one image or six for the run, or whose series gate is missing.
// It cannot say whether an image is right: look at it.
//
// Offline and read-only, like every script here. Exit codes: 0 no check failed, 1 some check failed, 2 usage error.

import fs from "node:fs";
import process from "node:process";
import { parseArgs } from "node:util";
import { isMain } from "./lib/entrypoint.mjs";
import { auditRun, snapshotFolder, summaryLine } from "./lib/run-audit.mjs";
import { imageToolCalls } from "./lib/series-audit.mjs";

export const USAGE = [
  "usage: node scripts/audit-run.mjs [options] <run folder>",
  "       node scripts/audit-run.mjs --snapshot <archetype folder>",
  "",
  "  <run folder>           assets/<slug>-<suffix>/run-<id>/, the folder that holds the run's images and manifest.json",
  "  --snapshot <folder>    print the files of an archetype's folder with their hashes, to be taken before a run and given as --before",
  "  --before <file>        the listing taken before the run: checks that earlier output is untouched and nothing was written outside the run folder",
  "  --calls <log>          the host's log of image calls: a Codex rollout, an Antigravity transcript, or a JSON list",
  "  --exact                the log covers this run alone, so its number of calls must equal the record's",
  "  --reference <suffix>   with --calls: the packaged file every call must attach, such as references/archetypes/xiaohei/xiaohei.png",
  "  --workspace <dir>      the project folder, when the folder is not under its assets/ folder",
  "  --json                 print the results as JSON",
  "  --help, -h             show this help",
].join("\n");

const isFolder = (target) => fs.existsSync(target) && fs.statSync(target).isDirectory();

export function main(argv, out = process.stdout, err = process.stderr) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        snapshot: { type: "string" },
        before: { type: "string" },
        calls: { type: "string" },
        exact: { type: "boolean", default: false },
        reference: { type: "string" },
        workspace: { type: "string" },
        json: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
      },
    });
  } catch (error) {
    err.write(`${error.message}\n\n${USAGE}\n`);
    return 2;
  }
  const { values, positionals } = parsed;
  if (values.help) {
    out.write(`${USAGE}\n`);
    return 0;
  }

  if (values.snapshot !== undefined) {
    if (positionals.length !== 0 || !isFolder(values.snapshot)) {
      err.write(positionals.length !== 0 ? `${USAGE}\n` : `${values.snapshot} is not a folder\n`);
      return 2;
    }
    out.write(`${JSON.stringify(snapshotFolder(values.snapshot, values.workspace ?? null), null, 2)}\n`);
    return 0;
  }

  if (positionals.length !== 1 || (values.exact && values.calls === undefined) || (values.reference !== undefined && values.calls === undefined)) {
    err.write(`${USAGE}\n`);
    return 2;
  }
  if (!isFolder(positionals[0])) {
    err.write(`${positionals[0]} is not a folder\n`);
    return 2;
  }

  let calls = null;
  let before = null;
  try {
    if (values.calls !== undefined) calls = imageToolCalls(fs.readFileSync(values.calls, "utf8"));
    if (values.before !== undefined) before = JSON.parse(fs.readFileSync(values.before, "utf8"));
  } catch (error) {
    err.write(`cannot read ${error.path ?? "a file"}: ${error.message}\n`);
    return 2;
  }
  if (before !== null && (!Array.isArray(before) || before.some((entry) => typeof entry?.path !== "string" || typeof entry?.sha256 !== "string"))) {
    err.write(`${values.before} is not a listing made by --snapshot\n`);
    return 2;
  }

  const { results, ok, manifest } = auditRun(positionals[0], { calls, exact: values.exact, reference: values.reference ?? null, workspace: values.workspace ?? null, before });
  if (values.json) {
    out.write(`${JSON.stringify({ ok, summary: manifest ? summaryLine(manifest) : null, results }, null, 2)}\n`);
  } else {
    for (const { id, title, status, detail } of results) {
      out.write(`${status.toUpperCase().padEnd(4)}  ${id.padEnd(14)} ${title}${detail === "" ? "" : `: ${detail}`}\n`);
    }
    if (manifest) out.write(`Record: ${summaryLine(manifest)}\n`);
    out.write(`${ok ? "No check failed." : "Some check failed: the folder, the record, and the log do not support the report."}\n`);
  }
  return ok ? 0 : 1;
}

if (isMain(import.meta.filename)) process.exitCode = main(process.argv.slice(2));
