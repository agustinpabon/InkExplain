// DOC: repository documentation, localized READMEs, and example prompts.

import { defineCheck } from "../check-runner.mjs";
import { DOC_REGIONS, PATHS, PRODUCT } from "../config.mjs";
import { planGeneratedDocuments } from "../docs-render.mjs";
import {
  extractCodeBlocks,
  extractHeadings,
  extractLinks,
  headingAnchors,
  isExternalTarget,
  readRegion,
  splitTarget,
} from "../markdown.mjs";
import { findAliasMentions } from "../registry.mjs";
import { isWithin } from "../repository.mjs";
import { readmeFiles, repositoryMarkdownFiles, resolveLinkTarget } from "./support.mjs";

const IDENTITY_TOKENS = [PRODUCT.name, PRODUCT.invocation, PATHS.packageDir];

export const docChecks = [
  defineCheck({
    id: "DOC-001",
    area: "DOC",
    title: "README introduces InkExplain with its canonical identity",
    run({ repo }) {
      const text = repo.readTextIfExists(PATHS.readme);
      if (text === null) return [{ path: PATHS.readme, message: "README.md is missing" }];
      const issues = [];
      const title = extractHeadings(text).find((heading) => heading.level === 1);
      if (title?.text !== PRODUCT.name) {
        issues.push({ path: PATHS.readme, line: title?.line, message: `the first title must be "# ${PRODUCT.name}"` });
      }
      for (const token of [PRODUCT.tagline, PRODUCT.description, ...IDENTITY_TOKENS]) {
        if (!text.includes(token)) issues.push({ path: PATHS.readme, message: `does not state ${JSON.stringify(token)}` });
      }
      const credits = readRegion(text, DOC_REGIONS.credits);
      if (!credits.found || credits.content.trim() === "") {
        issues.push({ path: PATHS.readme, message: "needs a non-empty credits region" });
      }
      return issues;
    },
  }),

  defineCheck({
    id: "DOC-002",
    area: "DOC",
    title: "documentation links and anchors resolve",
    run({ repo }) {
      const issues = [];
      const anchorCache = new Map();
      const anchorsOf = (file) => {
        if (!anchorCache.has(file)) anchorCache.set(file, headingAnchors(repo.readText(file)));
        return anchorCache.get(file);
      };
      for (const file of repositoryMarkdownFiles(repo)) {
        for (const link of extractLinks(repo.readText(file))) {
          if (isExternalTarget(link.target)) continue;
          const { path: targetPath, anchor } = splitTarget(link.target);
          const resolved = resolveLinkTarget(file, targetPath);
          if (!isWithin("", resolved) || resolved.startsWith("../")) {
            issues.push({ path: file, line: link.line, message: `link ${link.target} leaves the repository` });
            continue;
          }
          if (!repo.exists(resolved)) {
            issues.push({ path: file, line: link.line, message: `link ${link.target} does not resolve` });
            continue;
          }
          if (anchor && resolved.endsWith(".md") && repo.isFile(resolved) && !anchorsOf(resolved).has(anchor.toLowerCase())) {
            issues.push({ path: file, line: link.line, message: `anchor #${anchor} does not exist in ${resolved}` });
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "DOC-003",
    area: "DOC",
    title: "generated README and gallery regions match registry.json and locales.json",
    requires: ["registry", "locales"],
    run({ repo, registry, locales }) {
      const issues = [];
      for (const plan of planGeneratedDocuments(repo, registry, locales).filter((candidate) => candidate.kind !== "routing")) {
        for (const problem of plan.problems) issues.push({ path: plan.path, message: problem });
        if (plan.problems.length === 0 && plan.current !== plan.expected) {
          issues.push({ path: plan.path, message: "generated regions are out of date; run `npm run build:docs`" });
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "DOC-004",
    area: "DOC",
    title: "every README translation keeps the identity, archetypes, and credits",
    run({ repo, locales, localeIssues }) {
      const issues = localeIssues.map((message) => ({ path: PATHS.locales, message }));
      const listed = new Set(locales.map((locale) => locale.file));
      for (const file of readmeFiles(repo)) {
        if (locales.length > 0 && !listed.has(file)) issues.push({ path: file, message: `not listed in ${PATHS.locales}` });
      }
      for (const locale of locales) {
        const text = repo.readTextIfExists(locale.file);
        if (text === null) {
          issues.push({ path: locale.file, message: "localized README is missing" });
          continue;
        }
        for (const token of IDENTITY_TOKENS) {
          if (!text.includes(token)) issues.push({ path: locale.file, message: `does not keep ${JSON.stringify(token)} unchanged` });
        }
        const credits = readRegion(text, DOC_REGIONS.credits);
        if (!credits.found || credits.content.trim() === "") {
          issues.push({ path: locale.file, message: "needs a non-empty credits region; attribution must survive translation" });
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "DOC-005",
    area: "DOC",
    title: "example prompts cover the default, every archetype, mixed requests, and prompt mode",
    requires: ["registry"],
    run({ repo, registry }) {
      const text = repo.readTextIfExists(PATHS.promptExamples);
      if (text === null) return [{ path: PATHS.promptExamples, message: "examples/prompts.md is missing" }];
      const issues = [];
      const prompts = extractCodeBlocks(text).filter((block) => block.info === "text" && block.content.includes(PRODUCT.invocation));
      if (prompts.length === 0) return [{ path: PATHS.promptExamples, message: `no \`\`\`text prompts use ${PRODUCT.invocation}` }];
      // The invocation names the skill, not an archetype, so it is removed before alias matching.
      const archetypeSets = prompts.map(
        (block) =>
          new Set(findAliasMentions(registry, block.content.replaceAll(PRODUCT.invocation, "")).map((mention) => mention.archetypeId)),
      );
      if (!archetypeSets.some((ids) => ids.size === 0)) {
        issues.push({ path: PATHS.promptExamples, message: "no prompt exercises the default archetype (a prompt that names no archetype)" });
      }
      if (!archetypeSets.some((ids) => ids.size >= 2)) {
        issues.push({ path: PATHS.promptExamples, message: "no prompt exercises a mixed-archetype request" });
      }
      for (const archetype of registry.archetypes) {
        if (archetype === registry.defaultArchetype) continue;
        if (!archetypeSets.some((ids) => ids.has(archetype.id))) {
          issues.push({ path: PATHS.promptExamples, message: `no prompt selects archetype ${archetype.id}` });
        }
      }
      if (!prompts.some((block) => /\bprompt mode\b|\bprompts only\b|do not generate/i.test(block.content))) {
        issues.push({ path: PATHS.promptExamples, message: "no prompt exercises prompt mode (plan and prompts without generation)" });
      }
      return issues;
    },
  }),
];
