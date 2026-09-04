// PKG: the installable skill package under skills/inkexplain/.

import path from "node:path";
import { defineCheck } from "../check-runner.mjs";
import {
  AGENT_SHORT_DESCRIPTION_MAX,
  PACKAGE_ALLOWED_EXTENSIONS,
  PACKAGE_MAX_FILE_BYTES,
  PATHS,
  PRODUCT,
  SKILL_DESCRIPTION_MAX,
  SKILL_MAX_LINES,
  SKILL_NAME_PATTERN,
  SKILL_SECTIONS,
  WORKFLOW_MODULES,
} from "../config.mjs";
import { extractHeadings, extractLinks, isExternalTarget, parseFrontmatter, splitTarget } from "../markdown.mjs";
import { isWithin } from "../repository.mjs";
import { getPath, parseYaml } from "../yaml-lite.mjs";
import { lineAt, packageMarkdownFiles, resolveLinkTarget } from "./support.mjs";

const HAN = /\p{Script=Han}/u;
const FRONTMATTER_KEYS = new Set(["name", "description", "license", "compatibility", "metadata", "allowed-tools"]);
const AGENT_TOP_LEVEL_KEYS = new Set(["interface", "policy", "dependencies"]);

const packagePath = (relative) => `${PATHS.packageDir}/${relative}`;

export const packageChecks = [
  defineCheck({
    id: "PKG-001",
    area: "PKG",
    title: "skill package contains its required files",
    run({ repo }) {
      const required = [
        PATHS.skillFile,
        PATHS.agentFile,
        PATHS.registryFile,
        PATHS.routingFile,
        ...WORKFLOW_MODULES.map((module) => `${PATHS.workflowDir}/${module}`),
      ];
      return required.filter((file) => !repo.isFile(file)).map((file) => ({ path: file, message: "required package file is missing" }));
    },
  }),

  defineCheck({
    id: "PKG-002",
    area: "PKG",
    title: "SKILL.md frontmatter follows the Agent Skills format",
    run({ repo }) {
      if (!repo.isFile(PATHS.skillFile)) return [{ path: PATHS.skillFile, message: "SKILL.md is missing" }];
      const { found, data, errors } = parseFrontmatter(repo.readText(PATHS.skillFile));
      const issues = errors.map((error) => ({ path: PATHS.skillFile, line: error.line, message: `frontmatter: ${error.message}` }));
      if (!found) return [{ path: PATHS.skillFile, line: 1, message: "expected YAML frontmatter delimited by ---" }];
      const { name, description } = data;
      if (name !== PRODUCT.slug) {
        issues.push({ path: PATHS.skillFile, message: `name must be ${JSON.stringify(PRODUCT.slug)}, found ${JSON.stringify(name)}` });
      }
      if (typeof name === "string" && (!SKILL_NAME_PATTERN.test(name) || name.length > 64)) {
        issues.push({ path: PATHS.skillFile, message: "name must be lowercase kebab-case and at most 64 characters" });
      }
      if (name !== path.posix.basename(PATHS.packageDir)) {
        issues.push({ path: PATHS.skillFile, message: "name must match the package directory name" });
      }
      if (typeof description !== "string" || description.trim().length < 40) {
        issues.push({ path: PATHS.skillFile, message: "description must explain what the skill does and when to use it" });
      } else {
        if (description.length > SKILL_DESCRIPTION_MAX) {
          issues.push({ path: PATHS.skillFile, message: `description is ${description.length} characters; the limit is ${SKILL_DESCRIPTION_MAX}` });
        }
        if (HAN.test(description)) {
          issues.push({ path: PATHS.skillFile, message: "description must stay English-default; archetype aliases belong in references/routing.md" });
        }
      }
      for (const key of Object.keys(data)) {
        if (!FRONTMATTER_KEYS.has(key)) issues.push({ path: PATHS.skillFile, message: `unsupported frontmatter key ${JSON.stringify(key)}` });
      }
      return issues;
    },
  }),

  defineCheck({
    id: "PKG-003",
    area: "PKG",
    title: "SKILL.md stays concise and routes to every reference module",
    run({ repo }) {
      if (!repo.isFile(PATHS.skillFile)) return [{ path: PATHS.skillFile, message: "SKILL.md is missing" }];
      const text = repo.readText(PATHS.skillFile);
      const issues = [];
      const lineCount = text.split("\n").length;
      if (lineCount > SKILL_MAX_LINES) {
        issues.push({ path: PATHS.skillFile, message: `${lineCount} lines; keep SKILL.md under ${SKILL_MAX_LINES} and move detail into references` });
      }
      const headings = extractHeadings(text);
      if (!headings.some((heading) => heading.level === 1)) issues.push({ path: PATHS.skillFile, message: "missing a level-1 title" });
      const sections = new Set(headings.filter((heading) => heading.level === 2).map((heading) => heading.text.toLowerCase()));
      for (const section of SKILL_SECTIONS) {
        if (!sections.has(section.toLowerCase())) issues.push({ path: PATHS.skillFile, message: `missing section "## ${section}"` });
      }
      const mentions = ["references/routing.md", ...WORKFLOW_MODULES.map((module) => `references/workflow/${module}`)];
      for (const mention of mentions) {
        if (!text.includes(mention)) issues.push({ path: PATHS.skillFile, message: `does not route to ${mention}` });
      }
      if (!text.includes(PRODUCT.invocation)) {
        issues.push({ path: PATHS.skillFile, message: `does not state the invocation ${PRODUCT.invocation}` });
      }
      return issues;
    },
  }),

  defineCheck({
    id: "PKG-004",
    area: "PKG",
    title: "package references resolve inside the installed package",
    run({ repo }) {
      const issues = [];
      for (const file of packageMarkdownFiles(repo)) {
        const text = repo.readText(file);
        for (const link of extractLinks(text)) {
          if (isExternalTarget(link.target) || link.target.startsWith("#")) continue;
          const resolved = resolveLinkTarget(file, splitTarget(link.target).path);
          if (!isWithin(PATHS.packageDir, resolved)) {
            issues.push({ path: file, line: link.line, message: `link ${link.target} leaves the skill package` });
          } else if (!repo.exists(resolved)) {
            issues.push({ path: file, line: link.line, message: `link ${link.target} does not resolve` });
          }
        }
        for (const match of text.matchAll(/`((?:references|assets|agents)\/[^`\s]+|registry\.json)`/g)) {
          const target = match[1];
          if (/[<>{}*[\]]/.test(target)) continue;
          if (!repo.exists(packagePath(target.replace(/\/$/, "")))) {
            issues.push({ path: file, line: lineAt(text, match.index), message: `package path ${target} does not exist` });
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "PKG-005",
    area: "PKG",
    title: "agents/openai.yaml metadata is valid and on-brand",
    run({ repo }) {
      if (!repo.isFile(PATHS.agentFile)) return [{ path: PATHS.agentFile, message: "openai.yaml is missing" }];
      const { value, errors } = parseYaml(repo.readText(PATHS.agentFile));
      const issues = errors.map((error) => ({ path: PATHS.agentFile, line: error.line, message: error.message }));
      if (!value) return issues;
      for (const key of Object.keys(value)) {
        if (!AGENT_TOP_LEVEL_KEYS.has(key)) issues.push({ path: PATHS.agentFile, message: `unknown top-level key ${JSON.stringify(key)}` });
      }
      const displayName = getPath(value, "interface.display_name");
      const shortDescription = getPath(value, "interface.short_description");
      const defaultPrompt = getPath(value, "interface.default_prompt");
      const implicit = getPath(value, "policy.allow_implicit_invocation");
      if (displayName !== PRODUCT.name) {
        issues.push({ path: PATHS.agentFile, message: `interface.display_name must be ${JSON.stringify(PRODUCT.name)}` });
      }
      if (typeof shortDescription !== "string" || shortDescription.trim() === "") {
        issues.push({ path: PATHS.agentFile, message: "interface.short_description is required" });
      } else if (shortDescription.length > AGENT_SHORT_DESCRIPTION_MAX) {
        issues.push({
          path: PATHS.agentFile,
          message: `interface.short_description is ${shortDescription.length} characters; keep it under ${AGENT_SHORT_DESCRIPTION_MAX}`,
        });
      }
      if (typeof defaultPrompt !== "string" || !defaultPrompt.includes(PRODUCT.invocation)) {
        issues.push({ path: PATHS.agentFile, message: `interface.default_prompt must use ${PRODUCT.invocation}` });
      }
      if (typeof implicit !== "boolean") {
        issues.push({ path: PATHS.agentFile, message: "policy.allow_implicit_invocation must be true or false" });
      }
      for (const [field, text] of [["short_description", shortDescription], ["default_prompt", defaultPrompt]]) {
        if (typeof text === "string" && HAN.test(text)) {
          issues.push({ path: PATHS.agentFile, message: `interface.${field} must stay English-default` });
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "PKG-006",
    area: "PKG",
    title: "package ships only installable files and no generated output",
    run({ repo, registry }) {
      const issues = [];
      const suffixes = registry ? registry.archetypes.map((archetype) => archetype.outputSuffix) : ["illustrations"];
      const outputDir = new RegExp(`(^|/)[^/]+-(?:${suffixes.map((suffix) => suffix.replace(/-/g, "\\-")).join("|")})(/|$)`);
      for (const file of repo.walk(PATHS.packageDir, { includeSymlinks: true })) {
        if (repo.isSymlink(file)) {
          issues.push({ path: file, message: "symbolic links are not allowed in the skill package" });
          continue;
        }
        const relative = file.slice(PATHS.packageDir.length + 1);
        const extension = path.posix.extname(file).toLowerCase();
        if (!PACKAGE_ALLOWED_EXTENSIONS.includes(extension)) {
          issues.push({ path: file, message: `file type ${extension || "(none)"} is not part of the skill package` });
        }
        if (repo.size(file) > PACKAGE_MAX_FILE_BYTES) {
          issues.push({ path: file, message: `file is larger than ${PACKAGE_MAX_FILE_BYTES} bytes` });
        }
        if (relative.startsWith("assets/") && outputDir.test(path.posix.dirname(relative))) {
          issues.push({ path: file, message: "generated illustrations belong in the user's workspace, not in the skill package" });
        }
      }
      return issues;
    },
  }),
];

// [stage] initial package check
