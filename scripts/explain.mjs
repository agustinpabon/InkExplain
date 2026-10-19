#!/usr/bin/env node
// Assemble a calibrated image prompt from an archetype's own generation template.
//
//   node scripts/explain.mjs --list
//   node scripts/explain.mjs --archetype ferris --concept "Two threads wait on each other"
//   node scripts/explain.mjs --help
//
// Like every script here it stays offline and shell-free (SEC-004): it reads the
// registry and the archetype packs and prints text. InkExplain ships no image model,
// so the output is for your image tool. Fields only a planner can fill stay in
// [brackets] and are listed after the prompt instead of being invented.
//
// Exit codes: 0 done, 1 the prompt could not be assembled, 2 usage error.

import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { EXIT } from "./lib/check-runner.mjs";
import { isMain } from "./lib/entrypoint.mjs";
import { techniqueOf } from "./lib/gallery-data.mjs";
import { PromptAssemblyError, PromptInputError, assemblePrompt } from "./lib/prompt-assembly.mjs";
import { PATHS } from "./lib/config.mjs";
import { loadRegistry, referenceImagePath, resolveArchetypeRequest } from "./lib/registry.mjs";
import { Repository } from "./lib/repository.mjs";

export const USAGE = [
  "Usage:",
  "  node scripts/explain.mjs --list [--format text|json]",
  '  node scripts/explain.mjs [--archetype <id>] --concept "<idea>" [options]',
  "  node scripts/explain.mjs --help",
  "",
  "Assemble a calibrated image prompt, negative prompt, and aspect ratio from an",
  "archetype's own template. Paste the result into your image tool.",
  "",
  "Commands:",
  "  --list                    list the archetypes with category, style, and license",
  "  --concept, -c <text>      the idea to draw, in one sentence",
  "  --help, -h                show this help",
  "",
  "Options:",
  "  --archetype, -a <name>    archetype id or alias (default: the default archetype)",
  "  --action <text>           what the actor physically does",
  "  --label <text>            a visible label; repeat it for two to six labels",
  "  --aspect <w:h>            aspect ratio (default: the archetype's canvas, 16:9)",
  "  --background <color>      page color, for archetypes that offer one (Littlebox: pure white by default;",
  '                            a preset name such as "lavender", or a light "#RRGGBB")',
  "  --format <format>         text (default), json, or prompt (the prompt alone)",
  "  --root <dir>              repository root (default: this checkout)",
  "",
  "Fields only you can plan stay in [brackets] and are listed after the prompt.",
  "Exit codes: 0 done, 1 the prompt could not be assembled, 2 usage error.",
].join("\n");

const FORMATS = Object.freeze(["text", "json", "prompt"]);

function clip(text, max) {
  return text.length > max ? `${text.slice(0, max - 3).trimEnd()}...` : text;
}

/** The registry as rows for --list: the same facts the gallery shows. */
function listing(registry) {
  return registry.archetypes.map((archetype) => ({
    id: archetype.id,
    name: archetype.name,
    default: archetype === registry.defaultArchetype,
    category: archetype.category,
    status: archetype.status,
    style: techniqueOf(archetype),
    medium: archetype.styleSheet.medium,
    license: archetype.legalNotice.license,
    rightsHolder: archetype.legalNotice.rightsHolder,
    thirdParty: archetype.thirdParty,
    samples: archetype.sampleGates.status,
    outputFolder: `assets/<article-slug>-${archetype.outputSuffix}/`,
    background: backgroundListing(archetype),
    aliases: archetype.aliases,
  }));
}

/** The page colors an archetype offers, or null when its background is fixed. */
function backgroundListing(archetype) {
  const policy = archetype.styleSheet.background;
  if (policy === undefined) return null;
  const describe = ({ name, hex }) => `${name} ${hex}`;
  return { default: describe(policy.default), presets: policy.presets.map(describe) };
}

function renderList(rows) {
  const columns = [
    ["ID", (row) => row.id],
    ["NAME", (row) => row.name],
    ["CATEGORY", (row) => row.category],
    ["STATUS", (row) => row.status],
    ["STYLE", (row) => row.style],
    ["SAMPLES", (row) => row.samples],
    ["LICENSE", (row) => clip(row.license.split(";")[0], 32)],
  ];
  const cells = rows.map((row) => columns.map(([, value]) => value(row)));
  const widths = columns.map(([title], index) => Math.max(title.length, ...cells.map((line) => line[index].length)));
  const format = (line) => line.map((cell, index) => cell.padEnd(widths[index])).join("  ").trimEnd();
  return [
    `InkExplain archetypes (${rows.length})`,
    "",
    format(columns.map(([title]) => title)),
    format(widths.map((width) => "-".repeat(width))),
    ...cells.map(format),
    "",
    `Default archetype: ${rows.find((row) => row.default)?.id} (used when --archetype is omitted).`,
    "Pick one with --archetype <id> or an alias from skills/inkexplain/references/routing.md.",
    "Rights holders and aliases: --list --format json.",
  ].join("\n");
}

/** What a person must know before using the archetype's output. */
function noticesFor(archetype) {
  const notices = [];
  if (archetype.status === "gated-authorized") {
    notices.push("Gated archetype: use it only within your own authorization, and do not publish its images without one.");
  }
  if (archetype.status === "experimental") notices.push("Experimental archetype: its pack has not been tried with real renders yet.");
  return notices;
}

function fieldNote(entry) {
  if (entry.optional) return " (optional: delete the sentence when it does not apply)";
  if (entry.slot === "action") return " (fill it with --action)";
  if (entry.slot === "labels") return " (fill it with --label, two to six times)";
  return "";
}

/** The repository path of an archetype's identity reference, or null when its pack bundles none. */
function referenceFile(archetype) {
  const relative = referenceImagePath(archetype);
  return relative === null ? null : `${PATHS.packageDir}/${relative}`;
}

function renderText(result, notices) {
  const { archetype } = result;
  const lines = [
    `Archetype: ${archetype.name} (${archetype.id}), ${archetype.category}, ${archetype.status}`,
    `Aspect ratio: ${result.aspectRatio}`,
    `Output folder: ${result.outputFolder}`,
  ];
  if (referenceFile(archetype) !== null) {
    lines.push(`Identity reference: ${referenceFile(archetype)} (attach it to every image of a series, never as a layout; delete the reference sentence when your tool takes no image)`);
  }
  if (result.background !== null) lines.push(`Background: ${result.background.name} ${result.background.hex} (${result.background.kind})`);
  if (archetype.thirdParty) lines.push(`Credit: ${archetype.legalNotice.credit}`);
  for (const notice of notices) lines.push(notice);
  lines.push("", "PROMPT", "------", result.prompt, "", "NEGATIVE PROMPT", "---------------", result.negativePrompt);
  lines.push("", `Tools with separate fields: aspect ratio ${result.aspectRatio}; Midjourney takes the negative prompt after --no.`);
  if (result.unfilled.length === 0) {
    lines.push("", "Every field is filled.");
  } else {
    lines.push("", `STILL TO FILL (${result.unfilled.length})`, "-".repeat(`STILL TO FILL (${result.unfilled.length})`.length));
    result.unfilled.forEach((entry, index) => {
      const section = entry.section === "" ? "" : `${entry.section}: `;
      lines.push(`${String(index + 1).padStart(2)}. ${section}[${clip(entry.field, 90)}]${fieldNote(entry)}`);
    });
  }
  return lines.join("\n");
}

function renderJson(result, notices) {
  const { archetype } = result;
  return JSON.stringify(
    {
      archetype: { id: archetype.id, name: archetype.name, category: archetype.category, status: archetype.status },
      aspectRatio: result.aspectRatio,
      background: result.background === null ? null : { name: result.background.name, hex: result.background.hex, kind: result.background.kind },
      prompt: result.prompt,
      negativePrompt: result.negativePrompt,
      rightsNote: result.rightsNote,
      credit: archetype.thirdParty ? archetype.legalNotice.credit : null,
      outputFolder: result.outputFolder,
      referenceImage: referenceFile(archetype),
      source: result.sourceFile,
      unfilled: result.unfilled.map(({ section, field, slot, optional }) => ({ section, field, slot, optional })),
      notices,
    },
    null,
    2,
  );
}

/** Messages for a name that resolved to nothing, with the closest archetypes. */
function unresolvedMessages(request) {
  const hint = (suggestions) => (suggestions.length > 0 ? ` Did you mean: ${suggestions.join(", ")}?` : "");
  return [
    ...request.unknown.map(({ name, suggestions }) => `Unknown archetype ${JSON.stringify(name)}.${hint(suggestions)}`),
    ...request.excluded.map(
      ({ name, suggestions }) => `${JSON.stringify(name)} is too generic to select an archetype.${hint(suggestions)}`,
    ),
    "Run with --list to see every archetype.",
  ];
}

export function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr } = {}) {
  const usageError = (message) => {
    stderr.write(`${message}\n\n${USAGE}\n`);
    return EXIT.usage;
  };

  let options;
  try {
    ({ values: options } = parseArgs({
      args: argv,
      options: {
        list: { type: "boolean", default: false },
        help: { type: "boolean", short: "h", default: false },
        archetype: { type: "string", short: "a" },
        concept: { type: "string", short: "c" },
        action: { type: "string" },
        label: { type: "string", multiple: true },
        aspect: { type: "string" },
        background: { type: "string" },
        format: { type: "string" },
        root: { type: "string" },
      },
      strict: true,
      allowPositionals: false,
    }));
  } catch (error) {
    return usageError(error.message);
  }

  if (options.help) {
    stdout.write(`${USAGE}\n`);
    return EXIT.ok;
  }

  const format = options.format ?? "text";
  if (!FORMATS.includes(format)) return usageError(`--format must be one of ${FORMATS.join(", ")}, got ${JSON.stringify(format)}`);
  if (options.archetype !== undefined && options.archetype.trim() === "") return usageError("--archetype needs an id or an alias");
  if (options.background !== undefined && options.background.trim() === "") return usageError("--background needs a color name or a #RRGGBB value");

  const promptFlags = ["archetype", "concept", "action", "label", "aspect", "background"].filter((flag) => options[flag] !== undefined);
  if (options.list) {
    if (promptFlags.length > 0) return usageError(`--list cannot be combined with --${promptFlags[0]}`);
    if (format === "prompt") return usageError("--format prompt applies to a prompt, not to --list");
  } else if (options.concept === undefined) {
    return usageError(
      options.archetype === undefined && promptFlags.length === 0
        ? "Nothing to do: give --list, or --concept to assemble a prompt."
        : '--concept is required to assemble a prompt, for example --concept "Two threads wait on each other".',
    );
  }

  const repo = new Repository(path.resolve(options.root ?? path.join(import.meta.dirname, "..")));
  const { registry, schemaIssues } = loadRegistry(repo);
  if (registry === null) {
    stderr.write(`Cannot read the archetype registry:\n${schemaIssues.map((issue) => `  - ${issue.where}: ${issue.message}`).join("\n")}\n`);
    return EXIT.failed;
  }

  if (options.list) {
    const rows = listing(registry);
    stdout.write(`${format === "json" ? JSON.stringify(rows, null, 2) : renderList(rows)}\n`);
    return EXIT.ok;
  }

  const request = resolveArchetypeRequest(registry, options.archetype === undefined ? [] : [options.archetype]);
  if (request.mode === "unresolved") return usageError(unresolvedMessages(request).join("\n"));
  if (request.archetypes.length !== 1) {
    return usageError(`--archetype takes one archetype; ${JSON.stringify(options.archetype)} selects ${request.archetypes.length}. Run with --list to pick one.`);
  }
  const [archetype] = request.archetypes;

  let result;
  try {
    result = assemblePrompt(repo, archetype, {
      concept: options.concept,
      action: options.action,
      labels: options.label,
      aspect: options.aspect,
      background: options.background,
    });
  } catch (error) {
    if (error instanceof PromptInputError) return usageError(error.message);
    if (error instanceof PromptAssemblyError) {
      stderr.write(`Cannot assemble a prompt for ${archetype.id}: ${error.message}\n`);
      return EXIT.failed;
    }
    throw error;
  }

  const notices = noticesFor(archetype);
  if (format === "prompt") stdout.write(`${result.prompt}\n`);
  else stdout.write(`${format === "json" ? renderJson(result, notices) : renderText(result, notices)}\n`);
  return EXIT.ok;
}

if (isMain(import.meta.filename)) {
  process.exitCode = main();
}
