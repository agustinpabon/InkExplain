// BRAND: one consistent InkExplain identity. The projects InkExplain originates
// from are credited in the Origins section of ATTRIBUTIONS.md; their names and
// repository identifiers appear only where the allowlist classifies a mention as
// attribution, so the product never presents itself under a former name.

import path from "node:path";
import { defineCheck } from "../check-runner.mjs";
import { LEGAL, ORIGIN_IDENTIFIER_ALLOWLIST, PATHS, PRODUCT } from "../config.mjs";
import { extractHeadings, parseFrontmatter, sectionBody } from "../markdown.mjs";
import { getPath, parseYaml } from "../yaml-lite.mjs";
import { excerpt, readmeFiles, regionMembership } from "./support.mjs";

function namePattern(name) {
  const words = name
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`(?<![\\p{L}\\p{N}])${words.join("[\\s_-]*")}(?![\\p{L}\\p{N}])`, "iu");
}

/**
 * Identifiers of the origin projects, read from the Origins section of
 * ATTRIBUTIONS.md: each list item's bold project name, and the account and
 * repository of each GitHub link. Returns [{ label, value, pattern }].
 */
export function originIdentifiers(attributionsText) {
  const origins = sectionBody(attributionsText ?? "", LEGAL.originsSection) ?? "";
  const found = new Map();
  const add = (value, label) => {
    const key = value.toLowerCase().replace(/[\s_-]+/g, " ").trim();
    if (key !== "" && !found.has(key)) found.set(key, { label, value, pattern: namePattern(value) });
  };
  for (const match of origins.matchAll(/^\s*[-*]\s+\*\*([^*]+)\*\*/gm)) add(match[1], "origin project name");
  for (const match of origins.matchAll(/https?:\/\/github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?=[)>\s/#]|\.git\b|$)/gm)) {
    add(match[1], "origin account");
    add(match[2].replace(/\.+$/, ""), "origin repository");
  }
  return [...found.values()];
}

function isAllowlistedFile(file, allowlist) {
  return allowlist.some(
    (entry) =>
      (entry.scope === "file" && entry.path === file) ||
      (entry.scope === "prefix" && file.startsWith(entry.prefix)) ||
      (entry.scope === "pack-file" && file.startsWith(`${PATHS.archetypesDir}/`) && path.posix.basename(file) === entry.file),
  );
}

/**
 * Origin-identifier findings for one file. Mentions inside allowlisted files or
 * allowlisted regions (such as README credits) are attribution, not findings.
 */
export function originIdentifierFindings(file, text, identifiers, { allowlist = ORIGIN_IDENTIFIER_ALLOWLIST } = {}) {
  if (identifiers.length === 0 || isAllowlistedFile(file, allowlist)) return [];
  const regionTests = allowlist.filter((entry) => entry.scope === "region").map((entry) => regionMembership(text, entry.region));
  const findings = [];
  for (const [index, line] of text.split("\n").entries()) {
    const lineNumber = index + 1;
    for (const identifier of identifiers) {
      if (!identifier.pattern.test(line)) continue;
      if (regionTests.some((inRegion) => inRegion(lineNumber))) continue;
      findings.push({ line: lineNumber, label: identifier.label, value: identifier.value, excerpt: excerpt(line) });
    }
  }
  return findings;
}

export const brandingChecks = [
  defineCheck({
    id: "BRAND-001",
    area: "BRAND",
    title: "origin project names appear only as attribution",
    run({ repo, policy }) {
      const identifiers = originIdentifiers(repo.readTextIfExists(PATHS.attributions));
      const issues = [];
      for (const file of repo.textFiles()) {
        for (const finding of originIdentifierFindings(file, repo.readText(file), identifiers, { allowlist: policy.originAllowlist })) {
          issues.push({ path: file, line: finding.line, message: `${finding.label} ${JSON.stringify(finding.value)}: ${finding.excerpt}` });
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "BRAND-002",
    area: "BRAND",
    title: "every surface agrees on the InkExplain identity",
    run({ repo, registry }) {
      const issues = [];
      const expect = (condition, file, message) => {
        if (!condition) issues.push({ path: file, message });
      };
      const skill = repo.readTextIfExists(PATHS.skillFile);
      if (skill !== null) {
        expect(parseFrontmatter(skill).data.name === PRODUCT.slug, PATHS.skillFile, `frontmatter name must be ${PRODUCT.slug}`);
      }
      if (registry) expect(registry.skill === PRODUCT.slug, PATHS.registryFile, `"skill" must be ${PRODUCT.slug}`);
      const manifest = repo.readTextIfExists(PATHS.packageJson);
      if (manifest === null) {
        issues.push({ path: PATHS.packageJson, message: "package.json is missing" });
      } else {
        let name;
        try {
          name = JSON.parse(manifest).name;
        } catch (error) {
          issues.push({ path: PATHS.packageJson, message: `invalid JSON: ${error.message}` });
        }
        expect(name === undefined || name === PRODUCT.slug, PATHS.packageJson, `name must be ${PRODUCT.slug}`);
      }
      const agent = repo.readTextIfExists(PATHS.agentFile);
      if (agent !== null) {
        const { value } = parseYaml(agent);
        expect(getPath(value, "interface.display_name") === PRODUCT.name, PATHS.agentFile, `display_name must be ${PRODUCT.name}`);
      }
      for (const file of readmeFiles(repo)) {
        const title = extractHeadings(repo.readText(file)).find((heading) => heading.level === 1);
        expect(title?.text === PRODUCT.name, file, `the first title must be "# ${PRODUCT.name}"`);
      }
      for (const file of [PATHS.skillFile, PATHS.readme, PATHS.promptExamples]) {
        const text = repo.readTextIfExists(file);
        if (text !== null) expect(text.includes(PRODUCT.invocation), file, `must use the invocation ${PRODUCT.invocation}`);
      }
      return issues;
    },
  }),
];
