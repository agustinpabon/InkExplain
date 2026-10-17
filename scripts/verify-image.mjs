#!/usr/bin/env node
// Check that the images an agent reports are real raster images in the right folder.
//
//   node scripts/verify-image.mjs assets/cache-illustrations/01-fast-lane.png
//   node scripts/verify-image.mjs --workspace /path/to/project assets/a/01-x.png assets/a/02-y.png
//
// Offline and read-only, like every script here. Exit codes: 0 every image is valid, 1 some image is not, 2 usage error.

import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { isMain } from "./lib/entrypoint.mjs";
import { validateGeneratedImage } from "./lib/generated-image.mjs";

export function main(argv, out = process.stdout, err = process.stderr) {
  let parsed;
  try {
    parsed = parseArgs({ args: argv, allowPositionals: true, options: { workspace: { type: "string" }, help: { type: "boolean", short: "h" } } });
  } catch (error) {
    err.write(`${error.message}\n`);
    return 2;
  }
  if (parsed.values.help || parsed.positionals.length === 0) {
    (parsed.values.help ? out : err).write("usage: node scripts/verify-image.mjs [--workspace <dir>] <assets/folder/NN-name.png>...\n");
    return parsed.values.help ? 0 : 2;
  }
  const workspace = path.resolve(parsed.values.workspace ?? ".");
  let status = 0;
  for (const reported of parsed.positionals) {
    const result = validateGeneratedImage(workspace, reported);
    if (result.ok) out.write(`ok    ${reported}  ${result.format} ${result.width}x${result.height}, ${result.bytes} bytes\n`);
    else { status = 1; out.write(`FAIL  ${reported}  ${result.problems.join("; ")}\n`); }
  }
  return status;
}

if (isMain(import.meta.filename)) process.exitCode = main(process.argv.slice(2));
