#!/usr/bin/env node
// Scaffold a new archetype for contributors: a registry entry, the five-file pack, a credit in
// ATTRIBUTIONS.md, an example prompt, and the regenerated documents.
//
//   npm run archetype:add -- --id example-fox --name "Example Fox"
//   node scripts/add-archetype.mjs --id example-fox --name "Example Fox" --dry-run
//
// The new archetype is always experimental. What the contributor does not give (who holds the
// rights, what the character looks like, what it does) is written as an explicit TODO or
// UNRESOLVED marker, never guessed, and SCHEMA-010 stops an archetype from being promoted
// while one remains. Nothing is written until the result passes every repository check in
// memory, and nothing that exists is overwritten. Offline and shell-free (SEC-004).
//
// Exit codes: 0 done (or a dry run that would succeed), 1 the archetype cannot be added, 2 usage error.

import path from "node:path";
import process from "node:process";
import { parseArgs } from "node:util";
import { EXIT } from "./lib/check-runner.mjs";
import { PATHS } from "./lib/config.mjs";
import { isMain } from "./lib/entrypoint.mjs";
import { Repository } from "./lib/repository.mjs";
import {
  SCAFFOLD_CATEGORIES,
  ScaffoldInputError,
  ScaffoldRefusal,
  ScaffoldRollbackError,
  applyScaffold,
  checkRepository,
  describeIssue,
  planScaffold,
} from "./lib/scaffold.mjs";

export const USAGE = [
  "Usage:",
  '  npm run archetype:add -- --id <id> --name "<Display Name>" [options]',
  "  node scripts/add-archetype.mjs --help",
  "",
  "Scaffold a new archetype: a registry entry, the five-file pack, a credit in ATTRIBUTIONS.md,",
  "an example prompt, and the regenerated documents. It starts experimental. Whatever you do not",
  "give is written as a TODO or UNRESOLVED marker, never guessed, and an archetype that is promoted",
  "may not keep one (SCHEMA-010). Nothing is written until the result passes every repository",
  "check, and nothing that exists is overwritten.",
  "",
  "Required:",
  "  --id <id>                 lowercase kebab-case id; also the output folder suffix",
  "  --name <name>             display name",
  "",
  "Options:",
  `  --category <category>     ${SCAFFOLD_CATEGORIES.join(", ")} (default: mascot)`,
  "  --summary <text>          one sentence, at most 240 characters",
  "  --alias <name>            another name that selects it; repeatable (the name and the id always do)",
  "  --exclude <word>          a related word that must never select it; repeatable",
  "  --feature <text>          a visible identity marker; repeatable",
  "  --action <verb>           a signature action; give at least three, repeatable",
  "  --pose <text>             how the character's body works; repeatable",
  "  --palette <color>         a palette color; repeatable",
  "  --avoid <text>            something the style never draws; repeatable",
  "  --medium <text>           style sheet medium",
  '  --canvas <text>           style sheet canvas; starts with the aspect ratio, such as "16:9 on white"',
  "  --linework <text>         style sheet linework",
  "",
  "Rights of a third-party character (mascot or tribute-character); what you leave out stays UNRESOLVED:",
  "  --rights-holder <name>    who holds the rights today",
  "  --license <text>          the license, such as CC BY 4.0",
  "  --source <url>            the official source",
  "  --credit <text>           the credit line the license requires",
  "",
  "  --dry-run                 print what would change and write nothing",
  "  --json                    print the result as JSON",
  "  --root <dir>              repository root (default: this checkout)",
  "  --help, -h                show this help",
  "",
  "Exit codes: 0 done (or a dry run that would succeed), 1 the archetype cannot be added, 2 usage error.",
].join("\n");

const NEXT_STEPS = Object.freeze([
  "Settle the rights first (third-party characters): who holds them, the license, the source, and the credit line, in the registry entry, rights.md, and ATTRIBUTIONS.md. See docs/adding-an-archetype.md.",
  "Replace every TODO and UNRESOLVED marker. The registry entry is the source of truth for the identity markers, palette, and actions; edit it, then run npm run build:docs.",
  "Run npm run check.",
  'Run node scripts/explain.mjs --archetype <id> --concept "<an idea>" to see the prompt the pack assembles.',
  "Try it with real renders, then promote it from experimental (docs/adding-an-archetype.md#5-validate). SCHEMA-010 refuses an active archetype that still has a marker.",
]);

const GENERATED_NOTE = "regenerated from the registry";

// Flags that take one value: giving one twice is a mistake to report, not a choice to guess at.
const SINGLE_VALUED = Object.freeze(["id", "name", "category", "summary", "medium", "canvas", "linework", "rights-holder", "license", "source", "credit", "root"]);

function countBy(items, key) {
  const counts = new Map();
  for (const item of items) counts.set(item[key], (counts.get(item[key]) ?? 0) + 1);
  return counts;
}

/** What changed, grouped the way a contributor reads it. */
function summarize(plan) {
  const authored = [PATHS.registryFile, PATHS.attributions, PATHS.promptExamples];
  return {
    created: plan.create.map((file) => file.path),
    updated: plan.modify.filter((file) => authored.includes(file.path)).map((file) => file.path),
    regenerated: plan.modify.filter((file) => !authored.includes(file.path)).map((file) => file.path),
  };
}

function renderText({ plan, dryRun }) {
  const { archetype, validation, placeholders } = plan;
  const { created, updated, regenerated } = summarize(plan);
  const verb = dryRun ? "would be added" : "added";
  const lines = [
    `${archetype.name} (${archetype.id}) ${verb}: ${archetype.category}, ${archetype.status}. Output folder: ${archetype.outputFolder}`,
    dryRun ? "Dry run: nothing was written." : "",
    "",
    `${dryRun ? "Would create" : "Created"} (${created.length}):`,
    ...created.map((file) => `  ${file}`),
    `${dryRun ? "Would update" : "Updated"} (${updated.length}):`,
    ...updated.map((file) => `  ${file}`),
    `${dryRun ? "Would regenerate" : "Regenerated"} (${regenerated.length}, ${GENERATED_NOTE}):`,
    ...regenerated.map((file) => `  ${file}`),
    "",
    validation.issuesAfter === 0
      ? `Checks: all ${validation.checks} repository checks pass with the new archetype.`
      : `Checks: ${validation.failedChecksAfter} of ${validation.checks} fail (${validation.issuesAfter} ${validation.issuesAfter === 1 ? "issue" : "issues"}), as they already did before this change.`,
    "",
  ];
  const perFile = countBy(placeholders, "path");
  lines.push(`Still yours to settle: ${placeholders.length} TODO or UNRESOLVED markers in ${perFile.size} files.`);
  for (const [file, count] of perFile) lines.push(`  ${file}: ${count}`);
  lines.push("", "Next steps:", ...NEXT_STEPS.map((step, index) => `  ${index + 1}. ${step.replace("<id>", archetype.id)}`));
  return lines.filter((line, index, all) => line !== "" || all[index - 1] !== "").join("\n").replace(/^\n+/, "");
}

function renderJson({ plan, dryRun }) {
  const { archetype, validation, placeholders } = plan;
  const { expectedIssues, ...checks } = validation;
  return JSON.stringify(
    { dryRun, archetype, ...summarize(plan), checks, placeholders, nextSteps: NEXT_STEPS.map((step) => step.replace("<id>", archetype.id)) },
    null,
    2,
  );
}

// `io` is the file API the scaffold writes with (Node's fs); tests pass one that fails on demand.
export function main(argv = process.argv.slice(2), { stdout = process.stdout, stderr = process.stderr, policy, io } = {}) {
  const usageError = (message) => {
    stderr.write(`${message}\n\n${USAGE}\n`);
    return EXIT.usage;
  };

  let options;
  let tokens;
  try {
    ({ values: options, tokens } = parseArgs({
      args: argv,
      options: {
        id: { type: "string" },
        name: { type: "string" },
        category: { type: "string" },
        summary: { type: "string" },
        alias: { type: "string", multiple: true },
        exclude: { type: "string", multiple: true },
        feature: { type: "string", multiple: true },
        action: { type: "string", multiple: true },
        pose: { type: "string", multiple: true },
        palette: { type: "string", multiple: true },
        avoid: { type: "string", multiple: true },
        medium: { type: "string" },
        canvas: { type: "string" },
        linework: { type: "string" },
        "rights-holder": { type: "string" },
        license: { type: "string" },
        source: { type: "string" },
        credit: { type: "string" },
        "dry-run": { type: "boolean", default: false },
        json: { type: "boolean", default: false },
        root: { type: "string" },
        help: { type: "boolean", short: "h", default: false },
      },
      strict: true,
      allowPositionals: false,
      tokens: true,
    }));
  } catch (error) {
    return usageError(error.message);
  }
  if (options.help) {
    stdout.write(`${USAGE}\n`);
    return EXIT.ok;
  }

  const repeated = SINGLE_VALUED.find((name) => tokens.filter((token) => token.kind === "option" && token.name === name).length > 1);
  if (repeated !== undefined) return usageError(`--${repeated} was given more than once; it takes one value`);
  if (options.root !== undefined && options.root.trim() === "") return usageError("--root needs a directory");
  const root = path.resolve(options.root ?? path.join(import.meta.dirname, ".."));
  const repo = new Repository(root);
  const dryRun = options["dry-run"];
  const refuse = (error) => {
    const problems = error.problems.length > 0 ? `\n${error.problems.map((problem) => `  - ${problem}`).join("\n")}` : "";
    stderr.write(`${error.message}.${problems}\nNothing was changed.\n`);
    return EXIT.failed;
  };

  let plan;
  try {
    plan = planScaffold(
      repo,
      {
        id: options.id,
        name: options.name,
        category: options.category,
        summary: options.summary,
        aliases: options.alias,
        excludedTerms: options.exclude,
        features: options.feature,
        actions: options.action,
        poses: options.pose,
        palette: options.palette,
        avoid: options.avoid,
        medium: options.medium,
        canvas: options.canvas,
        linework: options.linework,
        rightsHolder: options["rights-holder"],
        license: options.license,
        source: options.source,
        credit: options.credit,
      },
      { policy },
    );
  } catch (error) {
    if (error instanceof ScaffoldInputError) return usageError(error.message);
    if (error instanceof ScaffoldRefusal) return refuse(error);
    throw error;
  }

  if (!dryRun) {
    try {
      // The checks must report on disk exactly what they reported in memory; anything else undoes every change.
      applyScaffold(root, plan, {
        io,
        verify: () => checkRepository(new Repository(root), { policy, expectedIssues: plan.validation.expectedIssues }).unexpected.map(describeIssue),
      });
    } catch (error) {
      if (error instanceof ScaffoldRefusal) return refuse(error);
      if (error instanceof ScaffoldRollbackError) {
        stderr.write(`${error.message}:\n${error.leftovers.map((item) => `  - ${item}`).join("\n")}\nThe repository is not as it was. Review \`git status\` and undo these by hand.\n`);
        return EXIT.failed;
      }
      stderr.write(`Could not write the archetype: ${error.message}.\nEvery change was undone.\n`);
      return EXIT.failed;
    }
  }

  stdout.write(`${options.json ? renderJson({ plan, dryRun }) : renderText({ plan, dryRun })}\n`);
  return EXIT.ok;
}

if (isMain(import.meta.filename)) {
  process.exitCode = main();
}
