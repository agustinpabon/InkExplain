// The archetype scaffold behind `npm run archetype:add`, as functions the tests can drive.
//
// From a name and whatever the contributor already knows, it plans a new experimental
// archetype: a registry entry, the five-file pack, a credit in ATTRIBUTIONS.md, an example
// prompt, and the regenerated documents. It never decides what only the contributor can:
// who holds the rights, what the character looks like, what it does. Those fields are
// written as explicit TODO and UNRESOLVED markers, which SCHEMA-010 refuses to let a
// promoted archetype keep.
//
// The whole result is validated in memory against every repository check before anything
// is written, and nothing that exists is ever overwritten. Offline and shell-free like
// every script here (SEC-004): it reads and writes files only.

import fs from "node:fs";
import path from "node:path";
import { createContext, runChecks } from "./check-runner.mjs";
import { ALL_CHECKS } from "./checks/index.mjs";
import { excerptAround } from "./checks/support.mjs";
import { PACK_FILES, PATHS, SCAFFOLD_PLACEHOLDER } from "./config.mjs";
import { loadLocales, planGeneratedDocuments } from "./docs-render.mjs";
import { extractHeadings, sectionBody } from "./markdown.mjs";
import { CATEGORIES, ID_PATTERN, buildAliasIndex, loadRegistry, normalizeName, outputDirectory, packDirectory, parseRegistry } from "./registry.mjs";
import { Repository, normalizeRelativePath, normalizeText } from "./repository.mjs";

/** Something the contributor typed is not usable: a usage error. */
export class ScaffoldInputError extends Error {}

/** The input is fine, but the repository cannot take it: a conflict, or a check that would fail. */
export class ScaffoldRefusal extends Error {
  constructor(message, problems = []) {
    super(message);
    this.problems = problems;
  }
}

export const SCAFFOLD_CATEGORIES = Object.freeze(Object.keys(CATEGORIES));

const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .'&+-]{0,58}$/u;
const SOURCE_PATTERN = /^https?:\/\/[^\s<>"'`[\]]+$/;
const MAX_ID_LENGTH = 40;
const ORDINALS = Object.freeze(["first", "second", "third"]);
const RIGHTS_FLAGS = Object.freeze([
  ["rightsHolder", "--rights-holder"],
  ["license", "--license"],
  ["source", "--source"],
  ["credit", "--credit"],
]);

const sentence = (text) => (/[.!?]$/.test(text.trim()) ? text.trim() : `${text.trim()}.`);
const todo = (what) => `TODO: ${what}`;
const unresolved = (what) => `UNRESOLVED: ${what}`;

/** One line of free text: no control characters, no brackets (a prompt field) or backticks (a code span). */
function cleanText(value, label, maxLength) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text === "") throw new ScaffoldInputError(`${label} must not be empty`);
  if (text.length > maxLength) throw new ScaffoldInputError(`${label} is ${text.length} characters; the limit is ${maxLength}`);
  if (/\p{Cc}/u.test(text)) throw new ScaffoldInputError(`${label} must not contain control characters`);
  if (/[[\]`]/.test(text)) {
    throw new ScaffoldInputError(`${label} must not contain brackets or backticks: they would break the generation prompt and the Markdown`);
  }
  return text;
}

/** Cleaned entries of a repeatable flag, in order, without repeats. */
function cleanList(values, label, maxLength) {
  const seen = new Set();
  const list = [];
  for (const value of values ?? []) {
    const text = cleanText(value, label, maxLength);
    const key = normalizeName(text);
    if (!seen.has(key)) list.push(text);
    seen.add(key);
  }
  return list;
}

/**
 * Validate what the contributor typed and return it in one shape. Throws ScaffoldInputError for
 * anything unusable. Optional fields that were not given stay null or empty; the registry entry
 * decides what a missing field becomes.
 */
export function normalizeInput(options = {}) {
  const id = String(options.id ?? "").trim();
  if (id === "") throw new ScaffoldInputError("--id is required, for example --id example-fox");
  if (!ID_PATTERN.test(id) || id.length > MAX_ID_LENGTH) {
    throw new ScaffoldInputError(
      `--id ${JSON.stringify(id)} must be lowercase kebab-case (letters, digits, and single hyphens, starting with a letter) and at most ${MAX_ID_LENGTH} characters`,
    );
  }
  const name = String(options.name ?? "").trim().replace(/\s+/g, " ");
  if (name === "") throw new ScaffoldInputError('--name is required, for example --name "Example Fox"');
  if (!NAME_PATTERN.test(name)) {
    throw new ScaffoldInputError(`--name ${JSON.stringify(name)} must be at most 59 characters of letters, digits, spaces, and . ' & + -`);
  }
  const category = options.category ?? "mascot";
  if (!Object.hasOwn(CATEGORIES, category)) {
    throw new ScaffoldInputError(`--category must be one of ${SCAFFOLD_CATEGORIES.join(", ")}, got ${JSON.stringify(category)}`);
  }
  const thirdParty = CATEGORIES[category].thirdParty;
  const optional = (key, label, maxLength) => (options[key] === undefined ? null : cleanText(options[key], label, maxLength));
  const input = {
    id,
    name,
    category,
    thirdParty,
    summary: optional("summary", "--summary", 240),
    aliases: cleanList(options.aliases, "--alias", 60),
    poses: cleanList(options.poses, "--pose", 160),
    excludedTerms: cleanList(options.excludedTerms, "--exclude", 60),
    features: cleanList(options.features, "--feature", 120),
    actions: cleanList(options.actions, "--action", 40),
    palette: cleanList(options.palette, "--palette", 60),
    avoid: cleanList(options.avoid, "--avoid", 120),
    medium: optional("medium", "--medium", 120),
    canvas: optional("canvas", "--canvas", 120),
    linework: optional("linework", "--linework", 120),
    rightsHolder: optional("rightsHolder", "--rights-holder", 120),
    license: optional("license", "--license", 120),
    source: optional("source", "--source", 300),
    credit: optional("credit", "--credit", 300),
  };
  if (input.source !== null && !SOURCE_PATTERN.test(input.source)) {
    throw new ScaffoldInputError(`--source ${JSON.stringify(input.source)} must be an http or https URL`);
  }
  if (input.canvas !== null && !/^\d{1,2}:\d{1,2}\b/.test(input.canvas)) {
    throw new ScaffoldInputError(`--canvas ${JSON.stringify(input.canvas)} must start with the aspect ratio, such as "16:9 on a clean white background"`);
  }
  if (!thirdParty) {
    const given = RIGHTS_FLAGS.find(([key]) => input[key] !== null);
    if (given) {
      throw new ScaffoldInputError(`${given[1]} records a third party's rights, but ${category} is original to InkExplain; use --category mascot or tribute-character`);
    }
  }
  return input;
}

/** The registry entry for an input: what the contributor gave, and explicit markers for what they did not. */
export function buildEntry(input) {
  const { name, category } = input;
  const actions = [...input.actions];
  while (actions.length < 3) actions.push(todo(`${ORDINALS[actions.length]} signature action`));
  const aliases = cleanList([name, ...input.aliases], "an alias", 60);
  const features = input.features.length > 0 ? input.features : [todo("first visible identity marker")];

  const legalNotice = input.thirdParty
    ? {
        credit: input.credit ?? unresolved("write the credit line the license requires"),
        rightsHolder: input.rightsHolder ?? unresolved("record the rights holder"),
        license: input.license ?? unresolved("record the license"),
        attributionTerms: [input.rightsHolder ?? unresolved("record the rights holder"), ...(input.source ? [input.source] : [])],
        restrictions: ["No logos, and no claims of affiliation, endorsement, sponsorship, or approval by the rights holder."],
      }
    : { credit: "Original to InkExplain", rightsHolder: "InkExplain contributors", license: "MIT", attributionTerms: [], restrictions: [] };

  const entry = {
    id: input.id,
    name,
    category,
    status: "experimental",
    summary: input.summary ?? todo(`one sentence about ${name} and how it is drawn`),
    aliases,
  };
  if (input.excludedTerms.length > 0) entry.excludedTerms = input.excludedTerms;
  return {
    ...entry,
    outputSuffix: input.id,
    motionDna: {
      actor: `${name}, the only character in the frame, who performs the central action`,
      signatureActions: actions,
      poses: input.poses.length > 0 ? input.poses : [todo(`how ${name}'s whole body leans into the work`)],
      timing: `One decisive moment per image; mini comics use two or three beats with ${name} identical across panels`,
    },
    styleSheet: {
      medium: input.medium ?? "Sparse hand-drawn article sketch",
      canvas: input.canvas ?? "16:9 on a clean white background",
      linework: input.linework ?? "Loose black ink line",
      palette: input.palette.length > 0 ? input.palette : ["black ink", todo("accent color")],
      avoid: input.avoid.length > 0 ? input.avoid : ["logos and brand marks", "gradients, shadows, and 3D rendering", "text other than the labels"],
    },
    legalNotice,
    sampleGates: { status: "pending", decision: "No samples reviewed yet.", directories: [] },
    contract: { identityMarkers: features, isolationMarkers: [name] },
  };
}

/** JSON in the registry's hand-written layout: objects expanded, short string lists on one line. */
function formatJson(value, depth) {
  const pad = "  ".repeat(depth);
  const inner = "  ".repeat(depth + 1);
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    if (value.every((item) => typeof item === "string")) {
      const inline = `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
      if (pad.length + inline.length <= 140) return inline;
      return `[\n${value.map((item) => `${inner}${JSON.stringify(item)}`).join(",\n")}\n${pad}]`;
    }
    return `[\n${value.map((item) => `${inner}${formatJson(item, depth + 1)}`).join(",\n")}\n${pad}]`;
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value);
    if (keys.length === 0) return "{}";
    return `{\n${keys.map((key) => `${inner}${JSON.stringify(key)}: ${formatJson(value[key], depth + 1)}`).join(",\n")}\n${pad}}`;
  }
  return JSON.stringify(value);
}

const REGISTRY_TAIL = "\n  ]\n}";

/** The registry text with `entry` appended to its archetypes, leaving every other byte as it was. */
export function insertRegistryEntry(registryText, entry) {
  const text = normalizeText(registryText);
  const at = text.lastIndexOf(REGISTRY_TAIL);
  if (at === -1 || text.slice(at + REGISTRY_TAIL.length).trim() !== "") {
    throw new ScaffoldRefusal("registry.json does not end the way the scaffold expects (the archetypes list closing the file); add the entry by hand instead");
  }
  return `${text.slice(0, at)},\n    ${formatJson(entry, 2)}${text.slice(at)}`;
}

const list = (items) => items.map((item) => `- ${item}`).join("\n");

/** The five pack files, written from the registry entry so that every contract holds by construction. */
export function buildPackFiles(entry, input) {
  const { name, id } = entry;
  const legal = entry.legalNotice;
  const thirdParty = CATEGORIES[entry.category].thirdParty;
  const markers = entry.contract.identityMarkers;
  const palette = entry.styleSheet.palette;
  const style = entry.styleSheet;
  const folder = outputDirectory(entry);
  const source = input.source ?? unresolved("record the official source URL, and the commit reviewed when it is a repository");
  const openRights = RIGHTS_FLAGS.some(([key]) => input[key] === null);
  const creditSentence = input.credit === null ? sentence(unresolved("write the credit line the license requires, then replace this note")) : `Credit: ${sentence(legal.credit)}`;
  const rightsNote = `${name} is an experimental archetype and its rights are not yet confirmed. ${creditSentence} No logos, and no claims of affiliation, endorsement, sponsorship, or approval by the rights holder.`;
  const rightsLine = thirdParty ? "\n\nRights note: [append the rights note from this file]." : "";
  // The canvas rule starts with an aspect ratio; the prompt names the ratio in its first field instead.
  const canvasTail = style.canvas.replace(/^\d{1,2}:\d{1,2}\b[\s,;:-]*/, "").replace(/[.!?]+$/, "").trim();

  const rights = [
    `# ${name} Rights`,
    "",
    "## Source",
    "",
    `- Archetype: ${name} (\`${id}\`), category \`${entry.category}\`, status \`${entry.status}\`. Not the default archetype: only the names listed for it in \`registry.json\` (and in \`references/routing.md\`) select it.`,
    `- Character: ${name}. ${sentence(entry.summary)}`,
    ...(thirdParty
      ? [`- Rights holder: ${legal.rightsHolder}.`, `- Source: ${source}`, `- License: ${sentence(legal.license)}`, `- Credit line: "${legal.credit}"`]
      : [`- Rights holder: ${legal.rightsHolder}. Original to InkExplain: declared by the contributor who added it, and released under the project's MIT License (see \`LICENSE.md\` in this skill folder). A maintainer confirms the declaration in review.`]),
    "",
    "## Rights and restrictions",
    "",
    ...(thirdParty
      ? [
          "- Credit the rights holder named above whenever generated images are published.",
          "- No logos, and no claims of affiliation, endorsement, sponsorship, or approval by the rights holder, in images, labels, prompts, or delivery reports.",
          openRights
            ? "- Until every UNRESOLVED item above is settled, the pack stays experimental and its images are for the contributor's own review: do not publish them."
            : "- Do not publish images of this archetype until real renders have been reviewed.",
        ]
      : [
          "- Generated images belong to the user's project. No credit line is required to publish them.",
          "- Keep the archetype free of third-party characters, logos, and brand marks.",
        ]),
    "- Status changes are a maintainer decision recorded in `registry.json`.",
    "",
    "## Public samples",
    "",
    "- Decision: pending, as recorded in `registry.json`. No renders have been reviewed yet.",
    `- Publish renders only after a quality review of real images: add them under the repository's \`examples/gallery/<en|zh>/${id}/\` (not part of the installed skill), record each set in \`examples/gallery/provenance.json\`, and set the reviewer and the review date in \`sampleGates\`. The contributor guide, \`docs/adding-an-archetype.md\` in the repository, says how.`,
    "",
  ].join("\n");

  const identity = [
    `# ${name} Identity`,
    "",
    "## Identity",
    "",
    sentence(entry.summary),
    "",
    todo(`describe in two or three sentences what ${name} is made of, how it is built, and how it carries an idea.`),
    "",
    "Keep every one of these markers together in every image:",
    "",
    list(markers),
    "",
    "## Recognition",
    "",
    `An image shows ${name} only when all the markers above are visible together. Cover ${name} with your thumb: if the image still explains the idea, the character is decoration, so give it the decisive action.`,
    "",
    "## Failure modes",
    "",
    `- A generic character instead of ${name}, or any identity marker missing.`,
    "- A different character, a mascot, a logo, or another archetype's look.",
    `- ${name} standing beside the action while the objects do the work.`,
    `- ${todo("add the failure modes that real renders show.")}`,
    "",
  ].join("\n");

  const styleSheet = [
    `# ${name} Style`,
    "",
    "## Canvas",
    "",
    `${sentence(style.canvas)} One idea per image; the main action fills about half the canvas and at least a third stays empty.`,
    "",
    "## Linework",
    "",
    `${sentence(style.linework)} ${sentence(style.medium)}`,
    "",
    "## Color",
    "",
    "Sparingly; every color earns its place:",
    "",
    list(palette),
    "",
    "## Labels",
    "",
    `Two to six short labels in the user's language, quoted exactly and written as neat hand-lettering, never on ${name} and never as a title. Image models misspell long strings, so keep each label to one to three words.`,
    "",
    "## Avoid",
    "",
    list(style.avoid),
    "",
  ].join("\n");

  const motion = [
    `# ${name} Motion and Acting`,
    "",
    `How ${name} moves, and how the structure types in \`references/workflow/composition-grid.md\` look with it. Each image takes one structure type, one idea, and one physical action.`,
    "",
    "## Actions",
    "",
    `Signature actions: ${entry.motionDna.signatureActions.join(", ")}.`,
    "",
    `Choose the verb that is the idea. ${todo(`add the other verbs ${name} can perform, and one example, such as "too many requests" becoming ${name} holding back an overflowing funnel.`)}`,
    "",
    "Poses:",
    "",
    list(entry.motionDna.poses),
    "",
    "## Patterns",
    "",
    `Use the structure types in \`references/workflow/composition-grid.md\`. ${todo(`describe how each pattern you use looks with ${name}, such as where ${name} stands in a before and after.`)}`,
    "",
    "## Supporting objects",
    "",
    `Everyday, low-tech things with obvious physical behavior, one to three per image. ${todo(`list the objects that suit ${name}.`)}`,
    "",
    "## Originality",
    "",
    "- Invent a new metaphor for each source; do not reuse a scene from an earlier image.",
    "- Two images in one series never share both the pose and the main object.",
    "- Never trace a pose from a reference image; draw a new pose for each scene.",
    "",
  ].join("\n");

  const template = [
    "Generate one standalone [16:9] horizontal article illustration.",
    `Style: ${style.medium.replace(/[.!?]+$/, "")}${canvasTail === "" ? "" : `, ${canvasTail}`}. ${sentence(style.linework)} Palette: ${palette.join(", ")}. One idea, one actor, a few low-tech objects, and generous whitespace.`,
    `Character: ${name}. Preserve all of these together: ${markers.join(", ")}. ${todo(`add one or two sentences on ${name}'s build and attitude.`)}`,
    `Action: ${name} performs the central action: [specific physical action], caught at its decisive moment. The metaphor must lose its meaning if ${name} is removed.`,
    "Scene: [core idea in one sentence].",
    `Composition: [structure type]. [Positions of ${name} and one to three supporting objects, and what ${name} does with which.] The main action fills about half the canvas; at least a third stays empty.`,
    "Supporting objects: [one to three low-tech objects].",
    `Visible handwritten labels, copied exactly in the user's language: ["label 1", "label 2", "label 3"]. Short, legible, rough handwriting, placed away from ${name}. Copy non-Latin scripts exactly; do not translate.`,
    `Constraints: one image, one core idea. No title, top-left heading, or structure-type text. Avoid ${style.avoid.join("; ")}. No other characters.${rightsLine}`,
  ].join("\n\n");

  const prompts = [
    `# ${name} Prompts`,
    "",
    `Archetype \`${id}\` (${name}), status \`${entry.status}\`. Output folder: \`${folder}\`. ${thirdParty ? "Every plan, generation prompt, edit prompt, and delivery report for this archetype carries the rights note at the end of this file. " : ""}Every delivery says the pack is experimental.`,
    "",
    "## Planning fields",
    "",
    "Use the shared shot list from `references/workflow/concept-extraction.md`, plus:",
    "",
    `- **Actor and action**: always ${name}, performing a verb from \`motion-and-acting.md\`; state exactly what ${name} physically does, so the idea fails without it.`,
    "- **Supporting objects**: one to three low-tech objects.",
    ...(thirdParty ? ["- **Rights note**: the note at the end of this file, attached to the plan."] : []),
    "",
    "## Generation prompt",
    "",
    "Replace every bracketed field. One prompt per image.",
    "",
    "```text",
    template,
    "```",
    "",
    "## Edit prompts",
    "",
    `The shared edits in \`references/workflow/editing.md\` apply, with ${name} as the actor${thirdParty ? " and the rights note appended to each" : ""}. Archetype-specific repair:`,
    "",
    "### Identity repair",
    "",
    "```text",
    `Edit the image to keep the same composition, action, labels, style, aspect ratio, and unaffected objects, but repair ${name}. Restore all identity markers together: ${markers.join(", ")}. Remove [observed drift: a generic character, a missing marker, or another archetype's look]. Keep ${name} performing [action].${rightsLine}`,
    "```",
    "",
    "## Review and repair",
    "",
    "Check every image against `references/workflow/qa-checklist.md`, then:",
    "",
    `- ${name} shows every identity marker together: ${markers.join(", ")}.`,
    `- ${name} performs the central action; covering ${name} breaks the idea.`,
    `- The palette stays within: ${palette.join(", ")}.`,
    `- Labels are short, quoted, in the user's language, and clear of ${name}.`,
    ...(thirdParty ? ["- The plan, every prompt, and the delivery report carry the rights note."] : []),
    "",
    "| Failure | Repair |",
    "|---|---|",
    '| A generic character, or a missing identity marker | "Identity repair" |',
    `| Passive, tiny, decorative, or removable ${name} | "Strengthen participation" in \`references/workflow/editing.md\`, with a verb from \`motion-and-acting.md\` |`,
    `| Labels crowding ${name}, or too much text | "Fix a label" or "Reduce text" in \`references/workflow/editing.md\` |`,
    '| Characters or styles from other archetypes | "Repair archetype leakage" in `references/workflow/editing.md` |',
    `| ${todo("add the failures that real renders show")} | ${todo("add the matching repair")} |`,
    ...(thirdParty ? ["| Missing rights note | Restore the rights note |"] : []),
    "",
    "## Delivery notes",
    "",
    `- Archetype: ${name} (\`${id}\`), status \`${entry.status}\`: say in the report that the pack is experimental. Folder: \`${folder}\`.`,
    "- Report whether every identity marker held in each image.",
    ...(thirdParty ? [`- Repeat the rights note in the report. Credit: ${sentence(legal.credit)}`] : []),
    "",
    ...(thirdParty
      ? [
          "## Rights note",
          "",
          "Append this note to every generation and edit prompt, attach it to every plan, and repeat it in the delivery report:",
          "",
          "```text",
          rightsNote,
          "```",
          "",
        ]
      : []),
  ].join("\n");

  return { "rights.md": rights, "identity.md": identity, "style.md": styleSheet, "motion-and-acting.md": motion, "prompts.md": prompts };
}

/** The archetype's own section of ATTRIBUTIONS.md. */
export function buildAttributionsSection(entry, input) {
  const legal = entry.legalNotice;
  if (!CATEGORIES[entry.category].thirdParty) {
    return [
      `### ${entry.name}`,
      "",
      "- Original to InkExplain: declared by the contributor who added it, and released under the project's MIT License. It uses no third-party character, logo, or artwork.",
    ].join("\n");
  }
  return [
    `### ${entry.name}`,
    "",
    RIGHTS_FLAGS.some(([key]) => input[key] === null)
      ? `- ${entry.name} is a \`${entry.category}\` archetype that is still being added (status \`${entry.status}\`). Its rights are recorded as the contributor knew them; every UNRESOLVED item must be settled before the archetype is promoted or any image of it is published.`
      : `- ${entry.name} is a \`${entry.category}\` archetype that is still being added (status \`${entry.status}\`). Its rights are recorded as the contributor gave them; a maintainer checks them against the source in review.`,
    `- Rights holder: ${legal.rightsHolder}.`,
    `- License: ${sentence(legal.license)}`,
    `- Source: ${input.source ?? unresolved("record the official source URL, and the commit reviewed when it is a repository")}`,
    `- Credit: ${sentence(legal.credit)}`,
    "- The archetype makes no claim of official affiliation or endorsement.",
  ].join("\n");
}

/** A starter prompt for examples/prompts.md, which DOC-005 requires for every archetype. */
export function buildExamplePrompt(entry) {
  return [
    `### ${entry.name}`,
    "",
    "```text",
    `$inkexplain Use ${entry.name}. One image: "a good plan makes the next step obvious."`,
    "```",
    "",
    `${entry.name} is a new archetype and stays \`experimental\` until its renders have been reviewed, so each delivery says so.`,
  ].join("\n");
}

/** Insert `block` as its own paragraph before line `at` (0-based) of `text`, keeping one blank line around it. */
function insertBlock(text, at, block) {
  const lines = normalizeText(text).split("\n");
  const head = lines.slice(0, at);
  while (head.length > 0 && head.at(-1).trim() === "") head.pop();
  const tail = lines.slice(at);
  while (tail.length > 0 && tail[0].trim() === "") tail.shift();
  const output = [...head, "", ...block.split("\n"), ...(tail.length > 0 ? ["", ...tail] : [])];
  return `${output.join("\n").replace(/\n+$/, "")}\n`;
}

/** The line (0-based) before which a new subsection goes: the end of the level-2 section `heading`. */
function endOfSection(text, heading) {
  const headings = extractHeadings(text);
  const start = headings.findIndex((candidate) => candidate.level === 2 && candidate.text.toLowerCase() === heading.toLowerCase());
  if (start === -1) return null;
  const next = headings.slice(start + 1).find((candidate) => candidate.level <= 2);
  return next ? next.line - 1 : normalizeText(text).split("\n").length;
}

function insertAttributions(text, section) {
  const at = endOfSection(text, "Character archetypes");
  if (at !== null) return insertBlock(text, at, section);
  // No section yet: open one before the trademarks, or at the end of the file.
  const trademarks = extractHeadings(text).find((candidate) => candidate.level === 2 && candidate.text.toLowerCase() === "trademarks");
  const position = trademarks ? trademarks.line - 1 : normalizeText(text).split("\n").length;
  return insertBlock(text, position, `## Character archetypes\n\n${section}`);
}

function insertExamplePrompt(text, example) {
  const headings = extractHeadings(text);
  const mixed = headings.find((candidate) => candidate.level === 2 && /^mixed archetypes$/i.test(candidate.text));
  return insertBlock(text, mixed ? mixed.line - 1 : normalizeText(text).split("\n").length, example);
}

/**
 * A checkout plus pending changes, readable like a Repository. The scaffold validates the result
 * of its changes with every repository check before it writes a single file.
 */
export class OverlayRepository extends Repository {
  #files = new Map();
  #directories = null;

  constructor(root, files = {}) {
    super(root);
    for (const [file, content] of Object.entries(files)) this.set(file, content);
  }

  set(relativePath, content) {
    this.#files.set(normalizeRelativePath(relativePath), content);
    this.#directories = null;
  }

  #directorySet() {
    if (this.#directories === null) {
      this.#directories = new Set();
      for (const file of this.#files.keys()) {
        for (let dir = path.posix.dirname(file); dir !== "." && dir !== "/"; dir = path.posix.dirname(dir)) this.#directories.add(dir);
      }
    }
    return this.#directories;
  }

  exists(relativePath) {
    const key = normalizeRelativePath(relativePath);
    return this.#files.has(key) || this.#directorySet().has(key) || super.exists(key);
  }

  isFile(relativePath) {
    const key = normalizeRelativePath(relativePath);
    return this.#files.has(key) || (!this.#directorySet().has(key) && super.isFile(key));
  }

  isDirectory(relativePath) {
    const key = normalizeRelativePath(relativePath);
    return this.#directorySet().has(key) || (!this.#files.has(key) && super.isDirectory(key));
  }

  isSymlink(relativePath) {
    const key = normalizeRelativePath(relativePath);
    return !this.#files.has(key) && super.isSymlink(key);
  }

  size(relativePath) {
    const key = normalizeRelativePath(relativePath);
    return this.#files.has(key) ? Buffer.byteLength(this.#files.get(key)) : super.size(key);
  }

  readText(relativePath) {
    const key = normalizeRelativePath(relativePath);
    return this.#files.has(key) ? normalizeText(String(this.#files.get(key))) : super.readText(key);
  }

  readBuffer(relativePath) {
    const key = normalizeRelativePath(relativePath);
    return this.#files.has(key) ? Buffer.from(this.#files.get(key)) : super.readBuffer(key);
  }

  entries(relativeDir = "") {
    const key = relativeDir === "" ? "" : normalizeRelativePath(relativeDir);
    const found = new Map();
    if (key === "" || super.isDirectory(key)) {
      for (const entry of super.entries(key)) found.set(entry.path, entry);
    }
    const prefix = key === "" ? "" : `${key}/`;
    for (const file of this.#files.keys()) {
      if (!file.startsWith(prefix)) continue;
      const rest = file.slice(prefix.length);
      const name = rest.split("/")[0];
      const entryPath = `${prefix}${name}`;
      if (!found.has(entryPath)) found.set(entryPath, { name, path: entryPath, type: rest.includes("/") ? "directory" : "file" });
    }
    return [...found.values()].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  }
}

const issueKey = (result, issue) => `${result.id}|${issue.path ?? ""}|${issue.line ?? ""}|${issue.message}`;

/** Every issue of every failed check, keyed so two runs can be compared. */
function failures(results) {
  const found = new Map();
  for (const result of results.filter((candidate) => candidate.status === "fail")) {
    for (const issue of result.issues) found.set(issueKey(result, issue), { id: result.id, title: result.title, path: issue.path, line: issue.line, message: issue.message });
  }
  return found;
}

/** Placeholder lines in text that the scaffold generated: [{ path, line, text }]. */
export function findPlaceholders(files) {
  const found = [];
  for (const { path: file, text } of files) {
    for (const [index, line] of text.split("\n").entries()) {
      const match = SCAFFOLD_PLACEHOLDER.exec(line);
      // Show the part of the line around the marker, so a long line never hides what was found.
      if (match) found.push({ path: file, line: index + 1, text: excerptAround(line, match.index, { before: 40 }) });
    }
  }
  return found;
}

function newAliasProblems(existing, entry) {
  const known = new Set(buildAliasIndex(existing).problems.map((problem) => problem.message));
  const candidate = { ...entry, excludedTerms: entry.excludedTerms ?? [] };
  return buildAliasIndex([...existing, candidate]).problems.filter((problem) => !known.has(problem.message));
}

/** Hyphen-delimited folder names such as "-fox" must not make one archetype's folder look like another's. */
function suffixClash(existing, suffix) {
  return existing.find((archetype) => {
    const other = archetype.outputSuffix;
    return other === suffix || suffix.endsWith(`-${other}`) || other.endsWith(`-${suffix}`);
  });
}

/**
 * Plan a new archetype without touching the disk. Returns
 * { archetype, create: [{ path, content }], modify: [{ path, before, after }], validation, placeholders }
 * or throws ScaffoldInputError (unusable input) or ScaffoldRefusal (a conflict, or a check that would fail).
 */
export function planScaffold(repo, options, { policy } = {}) {
  const input = normalizeInput(options);
  const loaded = loadRegistry(repo);
  if (loaded.registry === null) {
    throw new ScaffoldRefusal("Cannot read the archetype registry", loaded.schemaIssues.map((issue) => `${issue.where}: ${issue.message}`));
  }
  const { registry } = loaded;
  const { locales, issues: localeIssues } = loadLocales(repo);
  if (locales.length === 0) throw new ScaffoldRefusal("Cannot read the README locales", localeIssues);

  const entry = buildEntry(input);
  const packDir = `${PATHS.packageDir}/${packDirectory(entry)}`;
  if (registry.byId.has(entry.id)) {
    throw new ScaffoldRefusal(`${entry.name} (${entry.id}) cannot be added`, [
      `archetype id ${JSON.stringify(entry.id)} is already in the registry; the scaffold adds archetypes and never changes one`,
    ]);
  }
  const conflicts = [];
  const clash = suffixClash(registry.archetypes, entry.outputSuffix);
  if (clash) conflicts.push(`output folder suffix ${JSON.stringify(entry.outputSuffix)} clashes with ${clash.id}'s ${JSON.stringify(clash.outputSuffix)}: their folders would be hard to tell apart`);
  for (const problem of newAliasProblems(registry.archetypes, entry)) conflicts.push(problem.message);
  if (repo.exists(packDir)) conflicts.push(`${packDir} already exists; the scaffold never overwrites a pack`);
  const attributions = repo.readTextIfExists(PATHS.attributions);
  if (attributions === null) conflicts.push(`${PATHS.attributions} is missing`);
  else if (sectionBody(attributions, entry.name) !== null) conflicts.push(`${PATHS.attributions} already has a section named ${JSON.stringify(entry.name)}`);
  const examples = repo.readTextIfExists(PATHS.promptExamples);
  if (examples === null) conflicts.push(`${PATHS.promptExamples} is missing`);
  else if (sectionBody(examples, entry.name) !== null) conflicts.push(`${PATHS.promptExamples} already has a section named ${JSON.stringify(entry.name)}`);
  if (conflicts.length > 0) throw new ScaffoldRefusal(`${entry.name} (${entry.id}) cannot be added`, conflicts);

  const registryBefore = repo.readText(PATHS.registryFile);
  const registryAfter = insertRegistryEntry(registryBefore, entry);
  const parsed = parseRegistry(registryAfter);
  if (parsed.registry === null) {
    throw new ScaffoldRefusal("The new registry entry is not valid", parsed.schemaIssues.map((issue) => `${issue.where}: ${issue.message}`));
  }

  const pack = buildPackFiles(entry, input);
  const attributionsSection = buildAttributionsSection(entry, input);
  const create = PACK_FILES.map((file) => ({ path: `${packDir}/${file}`, content: pack[file] }));
  const modify = [
    { path: PATHS.registryFile, before: registryBefore, after: registryAfter },
    { path: PATHS.attributions, before: attributions, after: insertAttributions(attributions, attributionsSection) },
    { path: PATHS.promptExamples, before: examples, after: insertExamplePrompt(examples, buildExamplePrompt(entry)) },
  ];

  // Regenerate every document derived from the registry, from the repository as it will be.
  const overlay = new OverlayRepository(repo.root);
  for (const { path: file, content } of create) overlay.set(file, content);
  for (const { path: file, after } of modify) overlay.set(file, after);
  for (const plan of planGeneratedDocuments(overlay, parsed.registry, locales)) {
    if (plan.problems.length > 0) throw new ScaffoldRefusal("Cannot regenerate the documents", plan.problems);
    if (plan.current !== plan.expected) {
      modify.push({ path: plan.path, before: plan.current, after: plan.expected });
      overlay.set(plan.path, plan.expected);
    }
  }

  const before = failures(runChecks(ALL_CHECKS, createContext(repo, { policy })));
  const afterResults = runChecks(ALL_CHECKS, createContext(overlay, { policy }));
  const after = failures(afterResults);
  const newIssues = [...after].filter(([key]) => !before.has(key)).map(([, issue]) => issue);
  if (newIssues.length > 0) {
    throw new ScaffoldRefusal(
      `${entry.name} (${entry.id}) would break the repository checks, so nothing was written`,
      newIssues.map((issue) => `${issue.id} ${issue.path ? `${issue.path}: ` : ""}${issue.message}`),
    );
  }

  const placeholders = findPlaceholders([
    ...create.map(({ path: file, content }) => ({ path: file, text: content })),
    { path: PATHS.registryFile, text: formatJson(entry, 2) },
    { path: PATHS.attributions, text: attributionsSection },
  ]);
  return {
    archetype: { id: entry.id, name: entry.name, category: entry.category, status: entry.status, outputFolder: outputDirectory(entry) },
    create,
    modify,
    validation: { checks: afterResults.length, failedBefore: before.size, failedAfter: after.size },
    placeholders,
  };
}

/**
 * Write a plan. New files are created exclusively, so an existing file is never overwritten.
 * `verify` runs once everything is written and returns a list of problems; if it finds any, or if
 * any write fails, everything this call did is undone.
 */
export function applyScaffold(root, plan, { verify } = {}) {
  const repo = new Repository(root);
  const createdFiles = [];
  const createdDirectories = [];
  const replaced = [];
  try {
    for (const { path: file, content } of plan.create) {
      const absolute = repo.resolve(file);
      const firstCreated = fs.mkdirSync(path.dirname(absolute), { recursive: true });
      if (firstCreated !== undefined) createdDirectories.push(firstCreated);
      fs.writeFileSync(absolute, content, { encoding: "utf8", flag: "wx" });
      createdFiles.push(absolute);
    }
    for (const { path: file, after } of plan.modify) {
      const absolute = repo.resolve(file);
      replaced.push({ absolute, original: fs.readFileSync(absolute) });
      fs.writeFileSync(absolute, after, "utf8");
    }
    const problems = verify?.() ?? [];
    if (problems.length > 0) throw new ScaffoldRefusal("The repository checks failed after writing, so the changes were undone", problems);
  } catch (error) {
    for (const { absolute, original } of replaced.reverse()) fs.writeFileSync(absolute, original);
    for (const absolute of createdFiles.reverse()) fs.rmSync(absolute, { force: true });
    for (const directory of createdDirectories.reverse()) fs.rmSync(directory, { recursive: true, force: true });
    throw error;
  }
}

/** Run every repository check on a checkout. Returns the issues keyed like planScaffold compares them. */
export function checkRepository(repo, { policy } = {}) {
  const results = runChecks(ALL_CHECKS, createContext(repo, { policy }));
  return { checks: results.length, failures: [...failures(results).values()] };
}
