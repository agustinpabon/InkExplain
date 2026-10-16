// SCHEMA: the archetype registry (registry.json), the five-file pack of every
// archetype, and the generated routing.md. Per-archetype rules are data in
// registry.json, so adding an archetype never requires new validator code.

import path from "node:path";
import { defineCheck } from "../check-runner.mjs";
import { PACK_FILES, PACK_FILE_SECTIONS, PATHS, RIGHTS_NOTE_SECTION, SCAFFOLD_PLACEHOLDER } from "../config.mjs";
import { planGeneratedDocuments } from "../docs-render.mjs";
import { extractCodeBlocks, extractHeadings, sectionBody } from "../markdown.mjs";
import { parsePromptPack, scanTemplate } from "../prompt-assembly.mjs";
import { backgroundPhrase, outputDirectory, packFilePath } from "../registry.mjs";
import { excerptAround, includesFolded, lineOf } from "./support.mjs";

// Each registry list must reach the pack files that put it to work: identity
// markers reach the identity sheet and the prompts (generation and review),
// the palette reaches the style sheet and the prompts, and the signature
// actions reach the motion guide.
const MARKER_CONTRACTS = Object.freeze([
  { label: "identity marker", values: (archetype) => archetype.contract.identityMarkers, files: ["identity.md", "prompts.md"] },
  { label: "palette entry", values: (archetype) => archetype.styleSheet.palette, files: ["style.md", "prompts.md"] },
  { label: "signature action", values: (archetype) => archetype.motionDna.signatureActions, files: ["motion-and-acting.md"] },
]);

// A promoted archetype must stop saying it is experimental. This matches the ways a status is written
// (the status value in backticks or bold, "status: experimental", "is experimental", "stays experimental",
// "still experimental", "marked as experimental", "considered experimental", "an experimental pack"),
// not the word in other prose such as "loose, experimental hatching". It reads one line at a time, so a
// claim wrapped across two lines is not seen.
const STALE_STATUS = /`experimental`|\*\*experimental\*\*|\bexperimental (?:archetype|pack|status)\b|\b(?:is|are|stays?|remains?|still|status|marked as|considered)\W{0,3}(?:still\W{1,3})?experimental\b/i;

function packDir(archetype) {
  return `${PATHS.packageDir}/references/archetypes/${archetype.id}`;
}

function readPackFile(repo, archetype, file) {
  const filePath = packFilePath(archetype, file);
  return { filePath, text: repo.readTextIfExists(filePath) };
}

export const schemaChecks = [
  defineCheck({
    id: "SCHEMA-001",
    area: "SCHEMA",
    title: "registry.json matches the archetype schema",
    run({ registrySchemaIssues }) {
      return registrySchemaIssues.map((issue) => ({ path: PATHS.registryFile, message: `${issue.where}: ${issue.message}` }));
    },
  }),

  defineCheck({
    id: "SCHEMA-002",
    area: "SCHEMA",
    title: "every alias selects exactly one archetype",
    requires: ["registry"],
    run({ registryAliasIssues }) {
      return registryAliasIssues.map((issue) => ({ path: PATHS.registryFile, message: `${issue.where}: ${issue.message}` }));
    },
  }),

  defineCheck({
    id: "SCHEMA-003",
    area: "SCHEMA",
    title: "archetype packs contain exactly the five pack files",
    requires: ["registry"],
    run({ repo, registry }) {
      const issues = [];
      const declared = new Set(registry.archetypes.map(packDir));
      for (const entry of repo.entries(PATHS.archetypesDir)) {
        if (entry.type === "directory" && !declared.has(entry.path)) {
          issues.push({ path: entry.path, message: "pack directory has no archetype in registry.json" });
        } else if (entry.type === "file") {
          issues.push({ path: entry.path, message: "files belong inside an archetype pack directory" });
        }
      }
      for (const archetype of registry.archetypes) {
        const dir = packDir(archetype);
        if (!repo.isDirectory(dir)) {
          issues.push({ path: dir, message: `archetype ${archetype.id} has no pack directory` });
          continue;
        }
        for (const file of PACK_FILES) {
          if (!repo.isFile(packFilePath(archetype, file))) {
            issues.push({ path: packFilePath(archetype, file), message: `archetype ${archetype.id} is missing a pack file` });
          }
        }
        const packFiles = repo.walk(dir);
        const markdown = packFiles.filter((file) => file.endsWith(".md"));
        for (const file of markdown) {
          if (!PACK_FILES.includes(file.slice(dir.length + 1))) {
            issues.push({ path: file, message: `not one of the five pack files; agents would never load it (${PACK_FILES.join(", ")})` });
          }
        }
        const packText = markdown.map((file) => repo.readText(file)).join("\n");
        for (const file of packFiles.filter((candidate) => !candidate.endsWith(".md"))) {
          if (!packText.includes(path.posix.basename(file))) {
            issues.push({ path: file, message: `archetype ${archetype.id} pack asset is not referenced by any pack file` });
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "SCHEMA-004",
    area: "SCHEMA",
    title: "pack files expose the standard sections",
    requires: ["registry"],
    run({ repo, registry }) {
      const issues = [];
      for (const archetype of registry.archetypes) {
        for (const file of PACK_FILES) {
          const { filePath, text } = readPackFile(repo, archetype, file);
          if (text === null) continue;
          const headings = extractHeadings(text);
          if (!headings.some((heading) => heading.level === 1)) issues.push({ path: filePath, message: "missing a level-1 title" });
          const present = new Set(headings.filter((heading) => heading.level === 2).map((heading) => heading.text.toLowerCase()));
          const required = [...PACK_FILE_SECTIONS[file]];
          if (file === "prompts.md" && archetype.thirdParty) required.push(RIGHTS_NOTE_SECTION);
          for (const section of required) {
            if (!present.has(section.toLowerCase())) issues.push({ path: filePath, message: `missing section "## ${section}"` });
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "SCHEMA-005",
    area: "SCHEMA",
    title: "registry identity, palette, and signature actions reach the pack files",
    requires: ["registry"],
    run({ repo, registry }) {
      const issues = [];
      for (const archetype of registry.archetypes) {
        for (const { label, values, files } of MARKER_CONTRACTS) {
          for (const file of files) {
            const { filePath, text } = readPackFile(repo, archetype, file);
            if (text === null) continue;
            for (const value of values(archetype)) {
              if (!includesFolded(text, value)) {
                issues.push({ path: filePath, message: `archetype ${archetype.id} ${label} ${JSON.stringify(value)} is missing` });
              }
            }
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "SCHEMA-006",
    area: "SCHEMA",
    title: "prompts carry the output folder, a generation block, and the rights note",
    requires: ["registry"],
    run({ repo, registry }) {
      const issues = [];
      for (const archetype of registry.archetypes) {
        const { filePath, text } = readPackFile(repo, archetype, "prompts.md");
        if (text === null) continue;
        if (!extractCodeBlocks(text).some((block) => block.info === "text")) {
          issues.push({ path: filePath, message: "needs at least one ```text generation prompt block" });
        }
        if (!text.includes(outputDirectory(archetype))) {
          issues.push({ path: filePath, message: `does not state the output folder ${outputDirectory(archetype)}` });
        }
        if (archetype.status !== "active" && !text.includes(archetype.status)) {
          issues.push({ path: filePath, message: `does not carry the status ${archetype.status} into planning and generation` });
        }
        if (archetype.thirdParty) {
          const note = sectionBody(text, RIGHTS_NOTE_SECTION);
          if (note !== null && !extractCodeBlocks(note).some((block) => block.info === "text")) {
            issues.push({ path: filePath, message: `"## ${RIGHTS_NOTE_SECTION}" needs a \`\`\`text block to append to prompts` });
          }
          if (note !== null && archetype.status !== "active" && !note.includes(archetype.status)) {
            issues.push({ path: filePath, message: `the rights note does not state the status ${archetype.status}` });
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "SCHEMA-007",
    area: "SCHEMA",
    title: "archetype-specific markers stay inside their own pack",
    requires: ["registry"],
    run({ repo, registry }) {
      const issues = [];
      for (const owner of registry.archetypes) {
        for (const other of registry.archetypes) {
          if (other === owner) continue;
          for (const file of PACK_FILES) {
            const { filePath, text } = readPackFile(repo, other, file);
            if (text === null) continue;
            for (const marker of owner.contract.isolationMarkers) {
              if (includesFolded(text, marker)) {
                issues.push({
                  path: filePath,
                  line: lineOf(text.toLowerCase(), marker.toLowerCase()),
                  message: `archetype ${other.id} mentions ${JSON.stringify(marker)}, which belongs to archetype ${owner.id}`,
                });
              }
            }
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "SCHEMA-008",
    area: "SCHEMA",
    title: "references/routing.md is generated from registry.json",
    requires: ["registry"],
    run({ repo, registry }) {
      const [plan] = planGeneratedDocuments(repo, registry, []);
      if (plan.current === null) return [{ path: plan.path, message: "missing; run `npm run build:docs`" }];
      if (plan.current !== plan.expected) return [{ path: plan.path, message: "out of date with registry.json; run `npm run build:docs`" }];
      return [];
    },
  }),

  defineCheck({
    id: "SCHEMA-009",
    area: "SCHEMA",
    title: "page-color policy reaches the style sheet and the generation prompt",
    requires: ["registry"],
    run({ repo, registry }) {
      const issues = [];
      for (const archetype of registry.archetypes) {
        const policy = archetype.styleSheet.background;
        const prompts = readPackFile(repo, archetype, "prompts.md");
        const style = readPackFile(repo, archetype, "style.md");
        let template = null;
        try {
          template = prompts.text === null ? null : parsePromptPack(prompts.text).template;
        } catch {
          // SCHEMA-006 reports a prompts.md without a generation block.
        }
        const fields = template === null ? [] : scanTemplate(template).filter((field) => field.slot === "background");
        if (policy === undefined) {
          if (fields.length > 0) {
            issues.push({ path: prompts.filePath, message: `has a [${fields[0].field}] field, but archetype ${archetype.id} declares no styleSheet.background` });
          }
          continue;
        }
        // The registry is the truth: the template's field must say the registry's default, so an agent
        // that keeps the field as written draws on the default page.
        const expected = backgroundPhrase(policy.default);
        if (template !== null && (fields.length !== 1 || fields[0].field !== expected)) {
          issues.push({ path: prompts.filePath, message: `the generation prompt needs exactly one [${expected}] field` });
        }
        if (style.text !== null) {
          for (const swatch of [policy.default, ...policy.presets]) {
            if (!includesFolded(style.text, swatch.hex)) {
              issues.push({ path: style.filePath, message: `archetype ${archetype.id} background ${JSON.stringify(swatch.name)} ${swatch.hex} is missing` });
            }
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "SCHEMA-010",
    area: "SCHEMA",
    title: "only experimental archetypes may carry scaffold placeholders or call themselves experimental",
    requires: ["registry"],
    run({ repo, registry }) {
      const issues = [];
      const attributions = repo.readTextIfExists(PATHS.attributions);
      const examples = repo.readTextIfExists(PATHS.promptExamples);
      for (const archetype of registry.archetypes.filter((candidate) => candidate.status !== "experimental")) {
        // The registry entry, the five pack files, and the archetype's own section in ATTRIBUTIONS.md and in the example prompts.
        const sources = [
          { path: PATHS.registryFile, text: JSON.stringify(archetype, null, 1), says: [STALE_STATUS] },
          ...PACK_FILES.map((file) => ({ path: packFilePath(archetype, file), text: repo.readTextIfExists(packFilePath(archetype, file)), says: [STALE_STATUS] })),
          { path: PATHS.attributions, text: attributions === null ? null : sectionBody(attributions, archetype.name), says: [STALE_STATUS] },
          { path: PATHS.promptExamples, text: examples === null ? null : sectionBody(examples, archetype.name), says: [STALE_STATUS] },
        ];
        for (const { path: filePath, text, says } of sources) {
          if (text === null) continue;
          for (const [index, line] of text.split("\n").entries()) {
            for (const pattern of [SCAFFOLD_PLACEHOLDER, ...says]) {
              const match = pattern.exec(line);
              if (!match) continue;
              const shown = excerptAround(line, match.index);
              issues.push({
                path: filePath,
                // A slice of a shared file (the entry, a section) has no line numbers of its own.
                line: PACK_FILES.some((name) => filePath === packFilePath(archetype, name)) ? index + 1 : undefined,
                message:
                  pattern === SCAFFOLD_PLACEHOLDER
                    ? `archetype ${archetype.id} is ${archetype.status} but still has a scaffold placeholder: ${shown}`
                    : `archetype ${archetype.id} is ${archetype.status} but still says it is experimental: ${shown}`,
              });
              break;
            }
          }
        }
      }
      return issues;
    },
  }),
];
