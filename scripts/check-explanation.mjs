#!/usr/bin/env node
// Check that the files a repository explanation cites exist, and that its line ranges fit.
//
//   node scripts/check-explanation.mjs --root ../the-repository assets/the-repository-xiaohei/explanation.md
//   node scripts/check-explanation.mjs --root ../the-repository --min-files 8 explanation.md
//
// An agent that explains a repository is asked to cite `path:line` for every claim and never to invent a path
// (references/workflow/repository-explanation.md). This looks each cited file up in the checkout it was read from.
// It also fails an explanation that calls something impenetrable, unbreakable, or 100% secure: a file can show what the
// code does and never how strong it is. It cannot say whether a file shows what the explanation claims: a person reads
// that. Offline and read-only, like every script here. Exit codes: 0 every reference resolves and nothing is promised
// that a file cannot show, 1 some reference does not resolve, too few files are cited, or such a promise is made,
// 2 usage error.

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { isMain } from "./lib/entrypoint.mjs";
import { checkExplanation } from "./lib/explanation-check.mjs";

export const USAGE = [
  "usage: node scripts/check-explanation.mjs --root <repository> [options] <explanation.md>",
  "",
  "  --root <dir>        the checkout the explanation was written from (required)",
  "  --min-files <n>     fail unless at least n distinct files are cited (default 1)",
  "  --help, -h          show this help",
].join("\n");

export function main(argv, out = process.stdout, err = process.stderr) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, allowPositionals: true, options: { root: { type: "string" }, "min-files": { type: "string", default: "1" }, help: { type: "boolean", short: "h", default: false } } });
  } catch (error) {
    err.write(`${error.message}\n\n${USAGE}\n`);
    return 2;
  }
  const { values, positionals } = parsed;
  if (values.help) {
    out.write(`${USAGE}\n`);
    return 0;
  }
  const minimum = Number(values["min-files"]);
  if (values.root === undefined || positionals.length !== 1 || !Number.isInteger(minimum) || minimum < 0) {
    err.write(`${USAGE}\n`);
    return 2;
  }

  let markdown;
  let report;
  try {
    markdown = fs.readFileSync(positionals[0], "utf8");
    const root = path.resolve(values.root);
    // A link in the explanation is relative to the explanation's own folder, which is inside the checkout it explains.
    const folder = path.relative(root, path.dirname(path.resolve(positionals[0]))).replaceAll("\\", "/");
    report = checkExplanation(markdown, root, { documentDirectory: folder.startsWith("..") || path.isAbsolute(folder) ? undefined : folder });
  } catch (error) {
    err.write(`cannot read ${error.path ?? "a file"}: ${error.message}\n`);
    return 2;
  }

  const cited = new Set(report.results.map((result) => result.resolved).filter(Boolean));
  for (const result of report.results) {
    const where = `line ${result.line}`;
    if (result.status === "found") out.write(`ok     ${result.text}  ->  ${result.resolved}${result.lines === null ? "" : ` (${result.lines} lines)`}\n`);
    else if (result.status === "ambiguous") out.write(`WARN   ${result.text}  ->  several files end that way, so the reference does not say which (${where})\n`);
    else if (result.status === "beyond") out.write(`FAIL   ${result.text}  ->  ${result.resolved} has ${result.lines} lines (${where})\n`);
    else out.write(`FAIL   ${result.text}  ->  no such file in the checkout (${where})\n`);
  }
  for (const claim of report.claims) out.write(`FAIL   "${claim.text}"  ->  a promise a source file cannot show (line ${claim.line}): say what the code does and what was not checked\n`);
  const short = cited.size < minimum;
  out.write(`${report.results.length} references to ${cited.size} distinct files in a checkout of ${report.files} files; ${report.problems.length} do not resolve.${short ? ` Fewer than the ${minimum} files required.` : ""}${report.claims.length > 0 ? ` ${report.claims.length} absolute claims.` : ""}\n`);
  return report.problems.length === 0 && !short && report.claims.length === 0 ? 0 : 1;
}

if (isMain(import.meta.filename)) process.exitCode = main(process.argv.slice(2));
