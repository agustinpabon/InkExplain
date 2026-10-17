// Renders every document region derived from registry.json and readmes/locales.json:
// the agent-facing routing.md, the language selector and archetype table in each
// README, and the data block of the offline gallery page. `npm run build:docs`
// writes them; the validator checks they are current.

import path from "node:path";
import { DOC_REGIONS, LOCALE_STRING_KEYS, PATHS } from "./config.mjs";
import { buildGalleryData, renderGalleryData } from "./gallery-data.mjs";
import { readRegion, replaceRegion } from "./markdown.mjs";
import { CATEGORIES, STATUSES, backgroundPhrase, outputDirectory, referencePaths } from "./registry.mjs";

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
const escapeInline = (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;");
const escapeAttr = (value) => escapeInline(value).replaceAll('"', "&quot;");

function sentence(text) {
  return /[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`;
}

/** Short legal status for tables: status, license, and rights holder. */
export function legalStatus(archetype) {
  return `${code(archetype.status)} · ${archetype.legalNotice.license} · ${archetype.legalNotice.rightsHolder}`;
}

/** Where the README thumbnail of an archetype lives, and the full-size render it was scaled from. */
export const previewPath = (archetype) => `assets/examples/thumbs/${archetype.id}.png`;
export const renderPath = (archetype) => `assets/examples/${archetype.id}.png`;

/**
 * The character gallery of the README for one locale: cards two across (one column on a phone's narrow table),
 * each with the real render when one exists (`previews` holds the ids that have both a thumbnail and the
 * full-size file), the name, what is not yet settled (default, or a status other than active), the idea the
 * render explains, a link to the full-size file, and the license and credit in small type. Complete rights
 * records stay in ATTRIBUTIONS.md and docs/provenance.md.
 */
export function renderArchetypeList(registry, locale, previews = new Set()) {
  const s = locale.strings;
  const fromDir = path.posix.dirname(locale.file);
  const relative = (target) => path.posix.relative(fromDir, target);
  const cells = registry.archetypes.map((archetype) => {
    const marks = [];
    if (archetype === registry.defaultArchetype) marks.push(s.default);
    if (archetype.status !== "active") marks.push(`<code>${archetype.status}</code>`);
    const legal = archetype.legalNotice;
    const shown = previews.has(archetype.id);
    const image = shown
      ? `<a href="${relative(renderPath(archetype))}"><img src="${relative(previewPath(archetype))}" alt="${escapeAttr(archetype.name)}${archetype.concept ? ` explaining ${escapeAttr(archetype.concept.toLowerCase())}` : ""}, a real render" width="100%"></a><br>`
      : "";
    const idea = archetype.concept ?? archetype.tagline ?? archetype.summary;
    const label = marks.length === 0 ? "" : ` · ${marks.join(" · ")}`;
    const full = shown ? ` · <a href="${relative(renderPath(archetype))}">full size</a>` : "";
    return `<td width="50%" valign="top">${image}<b>${escapeInline(archetype.name)}</b>${label}<br>${escapeInline(idea)}${full}<br><sub>${escapeInline(legal.license)} · ${escapeInline(legal.rightsHolder)}</sub></td>`;
  });
  const rows = [];
  for (let i = 0; i < cells.length; i += 2) rows.push(`<tr>\n${cells.slice(i, i + 2).join("\n")}\n</tr>`);
  return `<table>\n${rows.join("\n")}\n</table>`;
}

/** Language selector for the README at `locale.file`: a collapsed list, so thirteen names do not open the page. */
export function renderLanguageSelector(locales, currentLocale) {
  const fromDir = path.posix.dirname(currentLocale.file);
  const links = locales
    .map((locale) => {
      if (locale.code === currentLocale.code) return `**${locale.label}**`;
      let relative = path.posix.relative(fromDir, locale.file);
      if (!relative.startsWith(".")) relative = `./${relative}`;
      return `[${locale.label}](${relative})`;
    })
    .join(" · ");
  return `<details>\n<summary>Languages</summary>\n\n${links}\n\n</details>`;
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

/** The page-color rule of an archetype that offers a choice, in one agent-facing line. */
function renderBackgroundRule(background) {
  const offered = background.presets.map((preset) => {
    const aliases = preset.aliases?.length > 0 ? ` (also ${preset.aliases.map((alias) => `"${alias}"`).join(", ")})` : "";
    return `${preset.name} ${preset.hex}${aliases}`;
  });
  const alternatives = offered.length === 0 ? "" : ` Offered only when the user asks: ${offered.join("; ")}.`;
  return `- Background: ${backgroundPhrase(background.default)} by default, and the same in every image of a set.${alternatives} A light color the user names is used exactly as given. Never alternate backgrounds, rotate them for rhythm, or choose one from the idea's mood or topic.`;
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
    ...(style.background === undefined ? [] : [renderBackgroundRule(style.background)]),
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
    "8. Unknown name: do not guess or substitute. Say which name was not recognized, offer the archetypes whose names or \"Never selects\" terms resemble it (the default archetype when none does), and ask which one to use before planning.",
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
 * The gallery page's plan: its generated data region, rebuilt from the registry,
 * the packs, and the approved sample directories.
 */
function planGalleryPage(repo, registry) {
  const file = PATHS.galleryPage;
  const current = repo.readTextIfExists(file);
  if (current === null) return { kind: "gallery", path: file, current: null, expected: null, problems: [`${file} is missing`] };
  const found = readRegion(current, DOC_REGIONS.galleryData);
  if (!found.found) {
    return { kind: "gallery", path: file, current, expected: current, problems: [`${file} has no generated ${DOC_REGIONS.galleryData} region`] };
  }
  if (found.errors.length > 0) {
    return { kind: "gallery", path: file, current, expected: current, problems: [`${file}: ${found.errors.join("; ")}`] };
  }
  try {
    const expected = replaceRegion(current, DOC_REGIONS.galleryData, renderGalleryData(buildGalleryData(repo, registry)));
    return { kind: "gallery", path: file, current, expected, problems: [] };
  } catch (error) {
    return { kind: "gallery", path: file, current, expected: current, problems: [`${file}: ${error.message}`] };
  }
}

/**
 * Every generated document with its current and expected content, in this order:
 * routing.md, each README, then the gallery page.
 * Returns [{ kind, path, current, expected, problems }]; kind is "routing",
 * "readme", or "gallery", and problems are structural errors (missing files or
 * regions) that generation cannot fix by itself.
 */
export function planGeneratedDocuments(repo, registry, locales) {
  const plans = [];
  plans.push({
    kind: "routing",
    path: PATHS.routingFile,
    current: repo.readTextIfExists(PATHS.routingFile),
    expected: renderRoutingDoc(registry),
    problems: [],
  });
  const previewIds = new Set(registry.archetypes.filter((archetype) => repo.isFile(previewPath(archetype)) && repo.isFile(renderPath(archetype))).map((archetype) => archetype.id));
  for (const locale of locales) {
    const current = repo.readTextIfExists(locale.file);
    if (current === null) {
      plans.push({ kind: "readme", path: locale.file, current: null, expected: null, problems: [`${locale.file} is missing`] });
      continue;
    }
    const problems = [];
    let expected = current;
    for (const [region, content] of [
      [DOC_REGIONS.languages, renderLanguageSelector(locales, locale)],
      [DOC_REGIONS.archetypes, renderArchetypeList(registry, locale, previewIds)],
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
    plans.push({ kind: "readme", path: locale.file, current, expected, problems });
  }
  plans.push(planGalleryPage(repo, registry));
  return plans;
}
