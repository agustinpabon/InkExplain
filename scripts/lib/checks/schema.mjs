// SCHEMA: the archetype registry (registry.json), the five-file pack of every
// archetype, and the generated routing.md. Per-archetype rules are data in
// registry.json, so adding an archetype never requires new validator code.

import path from "node:path";
import { defineCheck } from "../check-runner.mjs";
import { PACK_FILES, PACK_FILE_SECTIONS, PATHS, RIGHTS_NOTE_SECTION } from "../config.mjs";
import { planGeneratedDocuments } from "../docs-render.mjs";
import { extractCodeBlocks, extractHeadings, sectionBody } from "../markdown.mjs";
import { outputDirectory, packFilePath } from "../registry.mjs";
import { includesFolded, lineOf } from "./support.mjs";

// Each registry list must reach the pack files that put it to work: identity
// markers reach the identity sheet and the prompts (generation and review),
// the palette reaches the style sheet and the prompts, and the signature
// actions reach the motion guide.
const MARKER_CONTRACTS = Object.freeze([
  { label: "identity marker", values: (archetype) => archetype.contract.identityMarkers, files: ["identity.md", "prompts.md"] },
  { label: "palette entry", values: (archetype) => archetype.styleSheet.palette, files: ["style.md", "prompts.md"] },
  { label: "signature action", values: (archetype) => archetype.motionDna.signatureActions, files: ["motion-and-acting.md"] },
]);

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
];

// [stage] test(checks/package): verify that private true check triggers correctly
