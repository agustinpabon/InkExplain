// Renders every document region derived from registry.json and readmes/locales.json:
// the agent-facing routing.md, and the language selector and archetype gallery
// table in each README. `npm run build:docs` writes them; the validator checks they are current.

import path from "node:path";
import { DOC_REGIONS, LOCALE_STRING_KEYS, PATHS } from "./config.mjs";
import { readRegion, replaceRegion } from "./markdown.mjs";
import { CATEGORIES, STATUSES, outputDirectory, referencePaths } from "./registry.mjs";

export const GENERATED_NOTICE =
  "<!-- Generated from skills/inkexplain/registry.json by `npm run build:docs`. Do not edit by hand. -->";

const LOCALE_KEYS = new Set(["code", "label", "file", "strings"]);

/** Parse and validate readmes/locales.json text. Returns { locales, issues }. */
export function parseLocales(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return { locales: [], issues: [`invalid JSON: ${error.message}`] };
  }
  const issues = [];
  const locales = Array.isArray(data?.locales) ? data.locales : [];
  if (locales.length === 0) issues.push("locales must be a non-empty array");
  if (locales[0] && (locales[0].code !== "en" || locales[0].file !== PATHS.readme)) {
    issues.push(`the first locale must be "en" with file ${PATHS.readme}`);
  }
  const codes = new Set();
  for (const [index, locale] of locales.entries()) {
    const where = `locales[${index}]`;
    for (const key of Object.keys(locale ?? {})) {
      if (!LOCALE_KEYS.has(key)) issues.push(`${where} has unknown field ${JSON.stringify(key)}`);
    }
    if (typeof locale?.code !== "string" || !/^[a-z]{2}(?:-[A-Z][a-z]{3})?$/.test(locale.code)) {
      issues.push(`${where}.code must look like "es" or "zh-Hant"`);
    } else if (codes.has(locale.code)) {
      issues.push(`${where}.code duplicates ${locale.code}`);
    } else {
      codes.add(locale.code);
    }
    if (typeof locale?.label !== "string" || locale.label.trim() === "") issues.push(`${where}.label must be non-empty`);
    const expectedFile = locale?.code === "en" ? PATHS.readme : `${PATHS.localizedReadmeDir}/README.${locale?.code}.md`;
    if (locale?.file !== expectedFile) issues.push(`${where}.file must be ${expectedFile}`);
    for (const key of LOCALE_STRING_KEYS) {
      if (typeof locale?.strings?.[key] !== "string" || locale.strings[key].trim() === "") {
        issues.push(`${where}.strings.${key} must be non-empty`);
      }
    }
  }
  return { locales: issues.length === 0 ? locales : [], issues };
}

export function loadLocales(repo) {
  if (!repo.isFile(PATHS.locales)) return { locales: [], issues: [`${PATHS.locales} is missing`] };
  return parseLocales(repo.readText(PATHS.locales));
}

const code = (value) => `\`${value}\``;
const escapeCell = (value) => String(value).replaceAll("|", "\\|");

function sentence(text) {
  return /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
}

/** Short legal status for tables: status, license, and rights holder. */
export function legalStatus(archetype) {
  return `${code(archetype.status)} · ${archetype.legalNotice.license} · ${archetype.legalNotice.rightsHolder}`;
}

/** Markdown archetype gallery table for one locale. */
export function renderArchetypeTable(registry, locale) {
  const s = locale.strings;
  const rows = [`| ${s.archetype} | ${s.category} | ${s.summary} | ${s.legalStatus} |`, "|---|---|---|---|"];
  for (const archetype of registry.archetypes) {
    const label =
      archetype === registry.defaultArchetype
        ? `${archetype.name} (${code(archetype.id)}, ${s.default})`
        : `${archetype.name} (${code(archetype.id)})`;
    rows.push(
      `| ${escapeCell(label)} | ${code(archetype.category)} | ${escapeCell(archetype.summary)} | ${escapeCell(legalStatus(archetype))} |`,
    );
  }
  return rows.join("\n");
}

/** Language selector line for the README at `locale.file`. */
export function renderLanguageSelector(locales, currentLocale) {
  const fromDir = path.posix.dirname(currentLocale.file);
  return locales
    .map((locale) => {
      if (locale.code === currentLocale.code) return `**${locale.label}**`;
      let relative = path.posix.relative(fromDir, locale.file);
      if (!relative.startsWith(".")) relative = `./${relative}`;
      return `[${locale.label}](${relative})`;
    })
    .join(" | ");
}

function renderSelectionTable(registry) {
  const rows = ["| Archetype | id | Category | Status | Select with | Output folder |", "|---|---|---|---|---|---|"];
  for (const archetype of registry.archetypes) {
    const name = archetype === registry.defaultArchetype ? `${archetype.name} (default)` : archetype.name;
    rows.push(
      `| ${escapeCell(name)} | ${code(archetype.id)} | ${code(archetype.category)} | ${code(archetype.status)} | ${archetype.aliases
        .map((alias) => code(escapeCell(alias)))
        .join(", ")} | ${code(outputDirectory(archetype))} |`,
    );
  }
  return rows.join("\n");
}

function renderArchetypeCard(registry, archetype) {
  const { motionDna: motion, styleSheet: style, legalNotice: legal, sampleGates: samples } = archetype;
  const lines = [
    "",
    `### ${archetype.name} (${code(archetype.id)}${archetype === registry.defaultArchetype ? ", default" : ""})`,
    "",
    sentence(archetype.summary),
    "",
    `- Category: ${code(archetype.category)}. Status: ${code(archetype.status)}.`,
    `- Load, in order: ${referencePaths(archetype).map(code).join(", ")}`,
    `- Output folder: ${code(outputDirectory(archetype))}`,
    `- Motion DNA: ${sentence(motion.actor)} Signature actions: ${motion.signatureActions.join(", ")}. Poses: ${motion.poses.join("; ")}. Timing: ${sentence(motion.timing)}`,
    `- Style sheet: ${sentence(style.medium)} Canvas: ${sentence(style.canvas)} Linework: ${sentence(style.linework)} Palette: ${style.palette.join(", ")}. Avoid: ${style.avoid.join("; ")}.`,
    `- Credit: ${sentence(legal.credit)} Rights holder: ${sentence(legal.rightsHolder)} License: ${sentence(legal.license)}`,
  ];
  if (legal.restrictions.length > 0) {
    lines.push("- Restrictions:");
    for (const restriction of legal.restrictions) lines.push(`  - ${sentence(restriction)}`);
  }
  if (archetype.excludedTerms.length > 0) lines.push(`- Never selects: ${archetype.excludedTerms.map(code).join(", ")}`);
  lines.push(`- Public samples: ${samples.status}. ${sentence(samples.decision)}`);
  return lines;
}

/** The complete, agent-facing references/routing.md. */
export function renderRoutingDoc(registry) {
  const fallback = registry.defaultArchetype;
  const lines = [
    GENERATED_NOTICE,
    "",
    "# Archetypes",
    "",
    "An archetype fixes who performs the idea, how they move, and how the scene is drawn. Each archetype has a five-file pack under `references/archetypes/<id>/`: `rights.md`, `identity.md`, `style.md`, `motion-and-acting.md`, and `prompts.md`. Load only the packs of the archetypes you select.",
    "",
    "## Selecting an archetype",
    "",
    "1. Use only what the user asks for as the look of the illustrations: a style, character, or mascot (\"use Ferris\", \"in the Littlebox style\", \"draw it with Tux\"). Names that only appear in the article or its topic never select an archetype; an article about Linux does not select Tux.",
    "2. Compare each requested name with the ids and aliases in the table. Ignore case, spacing, hyphens, and underscores, but match whole names only.",
    `3. Nothing requested: use the default archetype, ${code(fallback.id)} (${fallback.name}).`,
    "4. One archetype requested: use it for every image.",
    "5. Several archetypes requested: this is a mixed request. Plan one shared core idea, then one group per archetype. Each group loads only its own pack, uses its own prompts and review, and writes to its own output folder.",
    "6. \"All archetypes\", \"every character\", or \"all styles\" means every `active` archetype. Gated and experimental archetypes join only when the user names them.",
    "7. A term listed under \"Never selects\" does not select any archetype. Treat it like an unknown name.",
    "8. Unknown name: do not guess or substitute. Say which name was not recognized, offer the closest archetypes, and ask which one to use.",
    "9. Third-party archetypes (`mascot` and `tribute-character`) carry the rights note from their `prompts.md` in every plan, prompt, and delivery report. Gated archetypes are never chosen implicitly.",
    "",
    "## Archetype table",
    "",
    renderSelectionTable(registry),
    "",
    "## Categories",
    "",
    ...Object.entries(CATEGORIES).map(([category, { meaning }]) => `- ${code(category)}: ${meaning}`),
    "",
    "## Statuses",
    "",
    ...Object.entries(STATUSES).map(([status, { meaning }]) => `- ${code(status)}: ${meaning}`),
    "",
    "## Archetype packs",
  ];
  for (const archetype of registry.archetypes) lines.push(...renderArchetypeCard(registry, archetype));
  lines.push("");
  return lines.join("\n");
}

/**
 * Every generated document with its current and expected content.
 * Returns [{ path, current, expected, problems }]; problems are structural
 * errors (missing files or regions) that generation cannot fix by itself.
 */
export function planGeneratedDocuments(repo, registry, locales) {
  const plans = [];
  plans.push({
    path: PATHS.routingFile,
    current: repo.readTextIfExists(PATHS.routingFile),
    expected: renderRoutingDoc(registry),
    problems: [],
  });
  for (const locale of locales) {
    const current = repo.readTextIfExists(locale.file);
    if (current === null) {
      plans.push({ path: locale.file, current: null, expected: null, problems: [`${locale.file} is missing`] });
      continue;
    }
    const problems = [];
    let expected = current;
    for (const [region, content] of [
      [DOC_REGIONS.languages, renderLanguageSelector(locales, locale)],
      [DOC_REGIONS.archetypes, renderArchetypeTable(registry, locale)],
    ]) {
      const found = readRegion(expected, region);
      if (!found.found) {
        problems.push(`${locale.file} has no generated ${region} region`);
      } else if (found.errors.length > 0) {
        problems.push(`${locale.file}: ${found.errors.join("; ")}`);
      } else {
        expected = replaceRegion(expected, region, content);
      }
    }
    plans.push({ path: locale.file, current, expected, problems });
  }
  return plans;
}

// [stage] refactor(docs-render): preserve surrounding markdown outside managed table blocks
