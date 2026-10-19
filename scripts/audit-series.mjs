#!/usr/bin/env node
// Check the image-tool calls that a real agent run made against the character lock.
//
//   node scripts/audit-series.mjs --reference references/archetypes/xiaohei/xiaohei.png <session-rollout.jsonl>
//   node scripts/audit-series.mjs --reference references/archetypes/xiaohei/xiaohei.png --prompts assets/repo-xiaohei/prompts.md <session-rollout.jsonl>
//   node scripts/audit-series.mjs --mode text-only calls.json
//
// The log is a Codex session rollout (the .jsonl file under CODEX_HOME/sessions), an Antigravity transcript
// (transcript.jsonl in the conversation's .system_generated/logs folder), or a JSON list of
// { "prompt", "referenced_image_paths" } objects for any other host (reference_image_paths and description
// are read too). A report that says a reference was attached is a claim; this reads what each call passed.
// It cannot say whether a character looks right: look at the images.
//
// Offline and read-only, like every script here. Exit codes: 0 no check failed, 1 some check failed, 2 usage error.

import fs from "node:fs";
import process from "node:process";
import { parseArgs } from "node:util";
import { isMain } from "./lib/entrypoint.mjs";
import { auditSeries, characterParagraphs, imageToolCalls } from "./lib/series-audit.mjs";

export const USAGE = [
  "usage: node scripts/audit-series.mjs [options] <log>",
  "",
  "  <log>                  a Codex session rollout (.jsonl), an Antigravity transcript.jsonl, or a JSON list of image-tool calls",
  "  --reference <suffix>   the packaged file every call must attach, such as references/archetypes/xiaohei/xiaohei.png",
  "  --mode <mode>          attached (default: the tool takes images) or text-only (it does not)",
  "  --prompts <file>       the run's prompts.md, to check that every prompt carries the same Character paragraph",
  "  --json                 print the results as JSON",
  "  --help, -h             show this help",
].join("\n");

export function main(argv, out = process.stdout, err = process.stderr) {
  let parsed;
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        reference: { type: "string" },
        mode: { type: "string", default: "attached" },
        prompts: { type: "string" },
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
  if (positionals.length !== 1 || !["attached", "text-only"].includes(values.mode)) {
    err.write(`${USAGE}\n`);
    return 2;
  }

  let log;
  let prompts = null;
  try {
    log = fs.readFileSync(positionals[0], "utf8");
    if (values.prompts !== undefined) prompts = characterParagraphs(fs.readFileSync(values.prompts, "utf8"));
  } catch (error) {
    err.write(`cannot read ${error.path ?? "a file"}: ${error.message}\n`);
    return 2;
  }

  const { results, ok } = auditSeries(imageToolCalls(log), { reference: values.reference, mode: values.mode, characterParagraphs: prompts });
  if (values.json) {
    out.write(`${JSON.stringify({ ok, results }, null, 2)}\n`);
  } else {
    for (const { id, title, status, detail } of results) {
      out.write(`${status.toUpperCase().padEnd(4)}  ${id.padEnd(14)} ${title}${detail === "" ? "" : `: ${detail}`}\n`);
    }
    out.write(`${ok ? "No check failed." : "Some check failed: the calls do not show the lock that the report describes."}\n`);
  }
  return ok ? 0 : 1;
}

if (isMain(import.meta.filename)) process.exitCode = main(process.argv.slice(2));
