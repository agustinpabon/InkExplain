// The archetype registry (skills/inkexplain/registry.json) is the single source
// of truth for archetype ids, categories, aliases, statuses, output folders,
// motion and style summaries, legal notices, and public-sample gates. This
// module validates the file, derives lookup tables, and implements
// deterministic archetype selection.

import { PACK_FILES, PATHS } from "./config.mjs";
import { normalizeRelativePath } from "./repository.mjs";

export const CATEGORIES = Object.freeze({
  "house-style": Object.freeze({
    thirdParty: false,
    meaning: "Original to InkExplain. No third-party character; the default archetype is always a house style.",
  }),
  mascot: Object.freeze({
    thirdParty: true,
    meaning: "A project or community mascot used with credit to its creator. No logos and no claims of affiliation or endorsement.",
  }),
  "tribute-character": Object.freeze({
    thirdParty: true,
    meaning: "A character created by a third party, drawn with credit and within the boundaries its rights record sets.",
  }),
  "animation-preset": Object.freeze({
    thirdParty: false,
    meaning: "An original motion and staging preset, such as storyboard beats, performed by a neutral actor.",
  }),
});

export const STATUSES = Object.freeze({
  active: Object.freeze({
    gated: false,
    inAll: true,
    meaning: "Ready to use. Selected by name, or by default for the default archetype.",
  }),
  experimental: Object.freeze({
    gated: false,
    inAll: false,
    meaning: "A new or unreviewed pack. Selected only by name, and every delivery says it is experimental.",
  }),
  "gated-authorized": Object.freeze({
    gated: true,
    inAll: false,
    meaning:
      "A protected character. Used only when named and only within the user's own authorization; samples need a recorded authorization.",
  }),
});

const SAMPLE_STATUSES = Object.freeze(["approved", "pending", "withheld"]);
const ALL_REQUESTS = Object.freeze([
  "all archetypes",
  "every archetype",
  "all characters",
  "every character",
  "all styles",
  "every style",
]);

const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const PLACEHOLDERS = new Set(["", "reviewer", "date", "pending", "tbd", "todo", "n/a", "na", "unknown", "-", "approval status"]);

const ROOT_KEYS = new Set(["$comment", "schemaVersion", "skill", "defaultArchetype", "archetypes"]);
const ARCHETYPE_KEYS = new Set([
  "id",
  "name",
  "category",
  "status",
  "summary",
  "aliases",
  "excludedTerms",
  "outputSuffix",
  "motionDna",
  "styleSheet",
  "legalNotice",
  "sampleGates",
  "contract",
]);
const MOTION_KEYS = new Set(["actor", "signatureActions", "poses", "timing"]);
const STYLE_KEYS = new Set(["medium", "canvas", "linework", "palette", "avoid"]);
const LEGAL_KEYS = new Set(["credit", "rightsHolder", "license", "attributionTerms", "restrictions"]);
const SAMPLE_KEYS = new Set(["status", "decision", "reviewer", "date", "directories", "authorization"]);
const CONTRACT_KEYS = new Set(["identityMarkers", "isolationMarkers"]);

/** Canonical comparison form for names: NFKC, case-folded, separators collapsed. */
export function normalizeName(value) {
  return String(value).normalize("NFKC").toLowerCase().replace(/[\s_-]+/g, " ").trim();
}

export function isValidIsoDate(value) {
  const match = typeof value === "string" && value.match(DATE_PATTERN);
  if (!match) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) &&
    date.getUTCFullYear() === Number(match[1]) &&
    date.getUTCMonth() + 1 === Number(match[2]) &&
    date.getUTCDate() === Number(match[3])
  );
}

function isPlaceholder(value) {
  return typeof value !== "string" || PLACEHOLDERS.has(value.trim().toLowerCase());
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim() !== "";
}

function isStringArray(value, { minLength = 0 } = {}) {
  return Array.isArray(value) && value.length >= minLength && value.every(isNonEmptyString);
}

function isPlainObject(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function checkKeys(object, allowed, where, issues) {
  for (const key of Object.keys(object)) {
    if (!allowed.has(key)) issues.push({ where, message: `unknown field ${JSON.stringify(key)}` });
  }
}

/** Validate an object block: known keys, required strings, and string arrays with minimum lengths. */
function validateBlock(block, where, issues, { keys, strings = [], arrays = {} }) {
  if (!isPlainObject(block)) {
    issues.push({ where, message: "must be an object" });
    return false;
  }
  checkKeys(block, keys, where, issues);
  for (const field of strings) {
    if (!isNonEmptyString(block[field])) issues.push({ where: `${where}.${field}`, message: "must be a non-empty string" });
  }
  for (const [field, minLength] of Object.entries(arrays)) {
    if (!isStringArray(block[field], { minLength })) {
      issues.push({
        where: `${where}.${field}`,
        message: minLength > 0 ? `must list at least ${minLength} non-empty ${minLength === 1 ? "entry" : "entries"}` : "must be an array of non-empty strings",
      });
    }
  }
  return true;
}

function validateLegalNotice(notice, category, where, issues) {
  if (!validateBlock(notice, where, issues, { keys: LEGAL_KEYS, strings: ["credit", "rightsHolder", "license"], arrays: { attributionTerms: 0, restrictions: 0 } })) {
    return;
  }
  const thirdParty = CATEGORIES[category]?.thirdParty;
  if (thirdParty && Array.isArray(notice.attributionTerms) && notice.attributionTerms.length === 0) {
    issues.push({ where: `${where}.attributionTerms`, message: "third-party archetypes must list at least one attribution term" });
  }
  if (category === "tribute-character" && Array.isArray(notice.restrictions) && notice.restrictions.length === 0) {
    issues.push({ where: `${where}.restrictions`, message: "tribute characters must state their rights boundaries" });
  }
}

function validateSampleGates(samples, where, issues) {
  if (!validateBlock(samples, where, issues, { keys: SAMPLE_KEYS })) return;
  if (!SAMPLE_STATUSES.includes(samples.status)) {
    issues.push({ where: `${where}.status`, message: `must be one of ${SAMPLE_STATUSES.join(", ")}` });
  }
  if (typeof samples.decision !== "string" || samples.decision.trim().length < 10) {
    issues.push({ where: `${where}.decision`, message: "must explain the decision in at least 10 characters" });
  }
  if (samples.authorization !== undefined && !isNonEmptyString(samples.authorization)) {
    issues.push({ where: `${where}.authorization`, message: "must be a non-empty string when present" });
  }
  if (!Array.isArray(samples.directories) || !samples.directories.every((dir) => typeof dir === "string")) {
    issues.push({ where: `${where}.directories`, message: "must be an array of repository-relative directories" });
  } else {
    for (const [index, dir] of samples.directories.entries()) {
      try {
        if (normalizeRelativePath(dir) !== dir) {
          issues.push({ where: `${where}.directories[${index}]`, message: "must be a normalized path without trailing slash" });
        }
      } catch (error) {
        issues.push({ where: `${where}.directories[${index}]`, message: error.message });
      }
    }
  }
  if (samples.status === "approved") {
    if (isPlaceholder(samples.reviewer)) {
      issues.push({ where: `${where}.reviewer`, message: "approved samples need a named reviewer, not a placeholder" });
    }
    if (!isValidIsoDate(samples.date)) {
      issues.push({ where: `${where}.date`, message: "approved samples need a real YYYY-MM-DD review date" });
    }
  } else if (Array.isArray(samples.directories) && samples.directories.length > 0) {
    issues.push({ where: `${where}.directories`, message: `must be empty while samples are ${samples.status}` });
  }
}

function validateArchetype(archetype, index, issues) {
  const where = `archetypes[${index}]`;
  if (!isPlainObject(archetype)) {
    issues.push({ where, message: "archetype must be an object" });
    return;
  }
  checkKeys(archetype, ARCHETYPE_KEYS, where, issues);
  if (typeof archetype.id !== "string" || !ID_PATTERN.test(archetype.id)) {
    issues.push({ where: `${where}.id`, message: "must be lowercase kebab-case" });
  }
  if (!isNonEmptyString(archetype.name)) issues.push({ where: `${where}.name`, message: "must be a non-empty display name" });
  if (!Object.hasOwn(CATEGORIES, archetype.category)) {
    issues.push({ where: `${where}.category`, message: `must be one of ${Object.keys(CATEGORIES).join(", ")}` });
  }
  if (!Object.hasOwn(STATUSES, archetype.status)) {
    issues.push({ where: `${where}.status`, message: `must be one of ${Object.keys(STATUSES).join(", ")}` });
  }
  if (!isNonEmptyString(archetype.summary) || archetype.summary.length > 240) {
    issues.push({ where: `${where}.summary`, message: "must be a one-sentence summary of at most 240 characters" });
  }
  if (!isStringArray(archetype.aliases, { minLength: 1 })) {
    issues.push({ where: `${where}.aliases`, message: "must list at least one alias" });
  }
  if (archetype.excludedTerms !== undefined && !isStringArray(archetype.excludedTerms)) {
    issues.push({ where: `${where}.excludedTerms`, message: "must be an array of non-empty strings" });
  }
  if (typeof archetype.outputSuffix !== "string" || !ID_PATTERN.test(archetype.outputSuffix)) {
    issues.push({ where: `${where}.outputSuffix`, message: "must be lowercase kebab-case" });
  }
  validateBlock(archetype.motionDna, `${where}.motionDna`, issues, {
    keys: MOTION_KEYS,
    strings: ["actor", "timing"],
    arrays: { signatureActions: 3, poses: 1 },
  });
  validateBlock(archetype.styleSheet, `${where}.styleSheet`, issues, {
    keys: STYLE_KEYS,
    strings: ["medium", "canvas", "linework"],
    arrays: { palette: 1, avoid: 1 },
  });
  validateLegalNotice(archetype.legalNotice, archetype.category, `${where}.legalNotice`, issues);
  validateSampleGates(archetype.sampleGates, `${where}.sampleGates`, issues);
  validateBlock(archetype.contract, `${where}.contract`, issues, {
    keys: CONTRACT_KEYS,
    arrays: { identityMarkers: 1, isolationMarkers: 1 },
  });
}

/** Structural validation of parsed registry.json data. Returns a list of issues. */
export function validateRegistryData(data) {
  const issues = [];
  if (!isPlainObject(data)) return [{ where: "$", message: "registry must be a JSON object" }];
  checkKeys(data, ROOT_KEYS, "$", issues);
  if (data.schemaVersion !== 2) issues.push({ where: "schemaVersion", message: "must be 2" });
  if (!isNonEmptyString(data.skill)) issues.push({ where: "skill", message: "must name the skill" });
  if (!Array.isArray(data.archetypes) || data.archetypes.length === 0) {
    issues.push({ where: "archetypes", message: "must be a non-empty array" });
    return issues;
  }
  data.archetypes.forEach((archetype, index) => validateArchetype(archetype, index, issues));
  for (const field of ["id", "outputSuffix"]) {
    const values = data.archetypes.map((archetype) => archetype?.[field]);
    for (const [index, value] of values.entries()) {
      if (values.indexOf(value) !== index) {
        const label = field === "id" ? "archetype id" : "output suffix";
        issues.push({ where: `archetypes[${index}].${field}`, message: `duplicate ${label} ${JSON.stringify(value)}` });
      }
    }
  }
  const fallback = data.archetypes.find((archetype) => archetype?.id === data.defaultArchetype);
  if (!fallback) {
    issues.push({ where: "defaultArchetype", message: `must name an existing archetype id, got ${JSON.stringify(data.defaultArchetype)}` });
  } else if (fallback.status !== "active" || fallback.category !== "house-style") {
    issues.push({ where: "defaultArchetype", message: "the default archetype must be an active house-style" });
  }
  return issues;
}

/**
 * Build the alias index used for selection, reporting duplicate aliases,
 * cross-archetype collisions, and excluded terms that shadow a selectable name.
 */
export function buildAliasIndex(archetypes) {
  const index = new Map();
  const excluded = new Map();
  const problems = [];
  for (const archetype of archetypes) {
    // The id is always selectable. An alias may restate it with display casing
    // ("Ferris" for "ferris"), but two aliases that normalize alike are redundant.
    const aliasKeys = new Set();
    const names = [{ name: archetype.id, isId: true }, ...archetype.aliases.map((name) => ({ name, isId: false }))];
    for (const { name, isId } of names) {
      const key = normalizeName(name);
      if (!isId) {
        if (aliasKeys.has(key)) {
          problems.push({ archetype: archetype.id, message: `alias ${JSON.stringify(name)} duplicates another alias of the same archetype` });
          continue;
        }
        aliasKeys.add(key);
      }
      const owner = index.get(key);
      if (owner) {
        if (owner.archetypeId !== archetype.id) {
          problems.push({ archetype: archetype.id, message: `alias ${JSON.stringify(name)} collides with archetype ${owner.archetypeId}` });
        }
        continue;
      }
      index.set(key, { archetypeId: archetype.id, name });
    }
  }
  for (const archetype of archetypes) {
    for (const term of archetype.excludedTerms ?? []) {
      const key = normalizeName(term);
      const owner = index.get(key);
      if (owner) {
        problems.push({
          archetype: archetype.id,
          message: `excluded term ${JSON.stringify(term)} is a selectable name of archetype ${owner.archetypeId}`,
        });
      }
      if (!excluded.has(key)) excluded.set(key, { archetypeId: archetype.id, term });
    }
  }
  for (const request of ALL_REQUESTS) {
    if (index.has(request)) {
      problems.push({ archetype: index.get(request).archetypeId, message: `alias ${JSON.stringify(request)} is reserved` });
    }
  }
  return { index, excluded, problems };
}

/**
 * Parse, validate, and index registry text.
 * Returns { registry, schemaIssues, aliasIssues }; registry is null when the schema is invalid.
 * Alias problems do not block loading, so the remaining checks can still run.
 */
export function parseRegistry(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return { registry: null, schemaIssues: [{ where: "$", message: `invalid JSON: ${error.message}` }], aliasIssues: [] };
  }
  const schemaIssues = validateRegistryData(data);
  if (schemaIssues.length > 0) return { registry: null, schemaIssues, aliasIssues: [] };
  const archetypes = data.archetypes.map((archetype) =>
    Object.freeze({
      ...archetype,
      excludedTerms: archetype.excludedTerms ?? [],
      gated: STATUSES[archetype.status].gated,
      inAll: STATUSES[archetype.status].inAll,
      thirdParty: CATEGORIES[archetype.category].thirdParty,
    }),
  );
  const { index, excluded, problems } = buildAliasIndex(archetypes);
  const registry = Object.freeze({
    skill: data.skill,
    archetypes: Object.freeze(archetypes),
    byId: new Map(archetypes.map((archetype) => [archetype.id, archetype])),
    defaultArchetype: archetypes.find((archetype) => archetype.id === data.defaultArchetype),
    aliasIndex: index,
    excludedIndex: excluded,
  });
  return {
    registry,
    schemaIssues: [],
    aliasIssues: problems.map((problem) => ({ where: `archetype ${problem.archetype}`, message: problem.message })),
  };
}

export function loadRegistry(repo) {
  if (!repo.isFile(PATHS.registryFile)) {
    return { registry: null, schemaIssues: [{ where: PATHS.registryFile, message: "file is missing" }], aliasIssues: [] };
  }
  return parseRegistry(repo.readText(PATHS.registryFile));
}

/** Workspace output directory for an archetype. */
export function outputDirectory(archetype, slug = "<article-slug>") {
  return `assets/${slug}-${archetype.outputSuffix}/`;
}

/** Package-relative directory of an archetype's pack. */
export function packDirectory(archetype) {
  return `references/archetypes/${archetype.id}`;
}

/** Package-relative paths of an archetype's pack files, in load order. */
export function referencePaths(archetype) {
  return PACK_FILES.map((file) => `${packDirectory(archetype)}/${file}`);
}

/** Repository-relative path of a file inside an archetype pack. */
export function packFilePath(archetype, file) {
  return `${PATHS.packageDir}/${packDirectory(archetype)}/${file}`;
}

function editDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
}

/** Up to `limit` archetype ids whose names are closest to an unrecognized request. */
function suggestArchetypes(registry, requestedName, limit = 3) {
  const wanted = normalizeName(requestedName);
  const excludedOwner = registry.excludedIndex.get(wanted);
  // Substring hits only count for inputs long enough to be meaningful ("go" is not).
  const scored = [];
  for (const [key, { archetypeId }] of registry.aliasIndex) {
    const contains = wanted.length >= 4 && (key.includes(wanted) || wanted.includes(key));
    scored.push({ archetypeId, distance: contains ? 0 : editDistance(wanted, key) });
  }
  scored.sort((a, b) => a.distance - b.distance || a.archetypeId.localeCompare(b.archetypeId));
  const maxDistance = Math.max(1, Math.floor(wanted.length / 3));
  const ids = excludedOwner ? [excludedOwner.archetypeId] : [];
  for (const { archetypeId, distance } of scored) {
    if (distance > maxDistance) break;
    if (!ids.includes(archetypeId)) ids.push(archetypeId);
    if (ids.length >= limit) break;
  }
  return ids;
}

/**
 * Resolve the archetype names a user explicitly asked for (not article content).
 *
 * - no names              -> mode "default", the default archetype
 * - one matched archetype -> mode "single"
 * - several archetypes    -> mode "mixed" (archetype groups stay isolated)
 * - "all archetypes"      -> every active archetype; gated and experimental ones join only by name
 * - unknown or excluded   -> mode "unresolved"; the agent must ask instead of guessing
 */
export function resolveArchetypeRequest(registry, requestedNames = []) {
  const names = (Array.isArray(requestedNames) ? requestedNames : [requestedNames])
    .map((name) => String(name).trim())
    .filter(Boolean);
  const selected = [];
  const add = (archetype) => {
    if (!selected.includes(archetype)) selected.push(archetype);
  };
  const unknown = [];
  const excluded = [];
  let expandedAll = false;

  for (const name of names) {
    const key = normalizeName(name);
    if (ALL_REQUESTS.includes(key)) {
      expandedAll = true;
      registry.archetypes.filter((archetype) => archetype.inAll).forEach(add);
    } else if (registry.aliasIndex.has(key)) {
      add(registry.byId.get(registry.aliasIndex.get(key).archetypeId));
    } else if (registry.excludedIndex.has(key)) {
      excluded.push({ name, suggestions: suggestArchetypes(registry, name) });
    } else {
      unknown.push({ name, suggestions: suggestArchetypes(registry, name) });
    }
  }

  if (unknown.length > 0 || excluded.length > 0) {
    return { mode: "unresolved", archetypes: selected, unknown, excluded, expandedAll };
  }
  if (selected.length === 0) {
    return { mode: "default", archetypes: [registry.defaultArchetype], unknown, excluded, expandedAll };
  }
  return { mode: selected.length === 1 ? "single" : "mixed", archetypes: selected, unknown, excluded, expandedAll };
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find alias mentions in free text (used to audit example prompts). Latin
 * aliases need word boundaries; aliases containing Han script match as-is.
 */
export function findAliasMentions(registry, text) {
  const normalizedText = text.normalize("NFKC");
  const mentions = [];
  for (const archetype of registry.archetypes) {
    for (const alias of [archetype.name, ...archetype.aliases]) {
      const body = escapeRegExp(alias.normalize("NFKC")).replace(/(?:\\ |[\s_-])+/g, "[\\s_-]+");
      const bounded = /\p{Script=Han}/u.test(alias) ? body : `(?<![\\p{L}\\p{N}])${body}(?![\\p{L}\\p{N}])`;
      const pattern = new RegExp(bounded, "giu");
      for (const match of normalizedText.matchAll(pattern)) {
        mentions.push({ archetypeId: archetype.id, alias, index: match.index });
      }
    }
  }
  return mentions.sort((a, b) => a.index - b.index || a.archetypeId.localeCompare(b.archetypeId));
}

// [stage] pack validation logic
