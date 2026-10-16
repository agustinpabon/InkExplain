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
import { IGNORED_DIRECTORIES, PACK_FILES, PATHS, SCAFFOLD_PLACEHOLDER } from "./config.mjs";
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

/** Writing failed, and some of what had been written could not be undone: `leftovers` says what remains. */
export class ScaffoldRollbackError extends Error {
  constructor(cause, leftovers) {
    // A refusal's own message says the changes were undone, which is no longer true here; its problems are the reason.
    const reason = cause instanceof ScaffoldRefusal && cause.problems.length > 0 ? `the repository checks failed after writing: ${cause.problems.join("; ")}` : cause.message;
    super(`Writing failed (${reason}), and ${leftovers.length === 1 ? "one change" : `${leftovers.length} changes`} could not be undone`);
    this.cause = cause;
    this.leftovers = leftovers;
  }
}

export const SCAFFOLD_CATEGORIES = Object.freeze(Object.keys(CATEGORIES));

// Names and the terms that select an archetype: letters of any script (with their combining marks and the
// zero-width joiners some scripts spell with), digits, and a few separators.
const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{M}\p{N}\p{Join_Control} .'&+_-]{0,58}$/u;
const WORD_START = /^[\p{L}\p{N}]/u;
// A line that opens with a number and a dot or bracket is a list item in Markdown, not a sentence.
const LIST_OPENER = /^\d+[.)](?:\s|$)/;
// Windows treats these as devices: most of its tools, and git for Windows, cannot create a folder with one of
// these names, so a pack whose id is one could not be checked out there.
const RESERVED_IDS = Object.freeze(["con", "prn", "aux", "nul", ...Array.from({ length: 10 }, (_, n) => `com${n}`), ...Array.from({ length: 10 }, (_, n) => `lpt${n}`)]);
const SOURCE_PATTERN = /^https?:\/\/[^\s<>"'`[\]|\\]+$/;
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

/** The first character that is invisible or reorders text (a bidirectional control), apart from the zero-width joiners. */
function hiddenCharacter(text) {
  for (const character of text) {
    if (/\p{Default_Ignorable_Code_Point}/u.test(character) && !/\p{Join_Control}/u.test(character)) return character;
  }
  return null;
}

const codePointLabel = (character) => `U+${character.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`;

/** Checks every typed text shares: valid Unicode, nothing invisible, and no control characters. */
function checkCharacters(text, label) {
  if (!text.isWellFormed()) throw new ScaffoldInputError(`${label} is not valid Unicode text: it holds half of a surrogate pair`);
  if (/\p{Cc}/u.test(text)) throw new ScaffoldInputError(`${label} must not contain control characters`);
  const hidden = hiddenCharacter(text);
  if (hidden !== null) throw new ScaffoldInputError(`${label} must not contain invisible or bidirectional control characters (${codePointLabel(hidden)})`);
}

/**
 * One line of free text: no control or invisible characters, and none that would break a generation
 * prompt (brackets), a code span (backticks), a table cell (pipes), or the Markdown (angle brackets, backslashes).
 * `word` also requires it to start with a letter or digit, and not as a numbered list item, for text that
 * opens a line of Markdown. `term` limits it to the characters of a name, a stricter rule that replaces the
 * one about brackets and the like, for the words that select an archetype.
 */
function cleanText(value, label, maxLength, { word = false, term = false } = {}) {
  const text = String(value ?? "").normalize("NFC").replace(/\s+/g, " ").trim();
  if (text === "") throw new ScaffoldInputError(`${label} must not be empty`);
  checkCharacters(text, label);
  if (word && (!WORD_START.test(text) || LIST_OPENER.test(text))) {
    throw new ScaffoldInputError(`${label} must start with a letter or a digit, and not as a numbered list item, not ${JSON.stringify(text.slice(0, 2))}`);
  }
  if (text.length > maxLength) throw new ScaffoldInputError(`${label} is ${text.length} characters; the limit is ${maxLength}`);
  if (term) {
    if (LIST_OPENER.test(text)) throw new ScaffoldInputError(`${label} ${JSON.stringify(text)} must not open like a numbered list item`);
    if (!NAME_PATTERN.test(text)) {
      throw new ScaffoldInputError(`${label} ${JSON.stringify(text)} must be at most 59 characters of letters, digits, spaces, and . ' & + _ -`);
    }
  } else if (/[[\]`<>|\\]/.test(text)) {
    throw new ScaffoldInputError(`${label} must not contain brackets, backticks, angle brackets, pipes, or backslashes: they would break the generation prompt, the tables, and the Markdown`);
  }
  return text;
}

/** Cleaned entries of a repeatable flag, in order, without repeats. `term` limits each to the characters of a name. */
function cleanList(values, label, maxLength, { term = false } = {}) {
  const seen = new Set();
  const list = [];
  for (const value of values ?? []) {
    const text = cleanText(value, label, maxLength, { term });
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
  if (RESERVED_IDS.includes(id)) {
    throw new ScaffoldInputError(`--id ${JSON.stringify(id)} is a reserved device name on Windows, where git and most tools cannot create a folder with that name; choose another id`);
  }
  const name = String(options.name ?? "").normalize("NFC").trim().replace(/\s+/g, " ");
  if (name === "") throw new ScaffoldInputError('--name is required, for example --name "Example Fox"');
  checkCharacters(name, "--name");
  if (LIST_OPENER.test(name)) throw new ScaffoldInputError(`--name ${JSON.stringify(name)} must not open like a numbered list item`);
  if (!NAME_PATTERN.test(name)) {
    throw new ScaffoldInputError(`--name ${JSON.stringify(name)} must be at most 59 characters of letters, digits, spaces, and . ' & + _ -`);
  }
  const category = options.category ?? "mascot";
  if (!Object.hasOwn(CATEGORIES, category)) {
    throw new ScaffoldInputError(`--category must be one of ${SCAFFOLD_CATEGORIES.join(", ")}, got ${JSON.stringify(category)}`);
  }
  const thirdParty = CATEGORIES[category].thirdParty;
  const optional = (key, label, maxLength, flags) => (options[key] === undefined ? null : cleanText(options[key], label, maxLength, flags));
  const input = {
    id,
    name,
    category,
    thirdParty,
    summary: optional("summary", "--summary", 240, { word: true }),
    aliases: cleanList(options.aliases, "--alias", 60, { term: true }),
    poses: cleanList(options.poses, "--pose", 160),
    excludedTerms: cleanList(options.excludedTerms, "--exclude", 60, { term: true }),
    features: cleanList(options.features, "--feature", 120),
    actions: cleanList(options.actions, "--action", 40),
    palette: cleanList(options.palette, "--palette", 60),
    avoid: cleanList(options.avoid, "--avoid", 120),
    medium: optional("medium", "--medium", 120, { word: true }),
    canvas: optional("canvas", "--canvas", 120),
    linework: optional("linework", "--linework", 120, { word: true }),
    rightsHolder: optional("rightsHolder", "--rights-holder", 120),
    license: optional("license", "--license", 120),
    source: optional("source", "--source", 300),
    credit: optional("credit", "--credit", 300),
  };
  if (input.source !== null && !SOURCE_PATTERN.test(input.source)) {
    throw new ScaffoldInputError(`--source ${JSON.stringify(input.source)} must be an http or https URL`);
  }
  if (input.source !== null) {
    let url = null;
    try {
      url = new URL(input.source);
    } catch {
      throw new ScaffoldInputError(`--source ${JSON.stringify(input.source)} must be an http or https URL`);
    }
    // A password in a source link would be published with the credit.
    if (url.username !== "" || url.password !== "") throw new ScaffoldInputError("--source must not carry a user name or password");
  }
  if (input.canvas !== null && !/^[1-9]\d?:[1-9]\d?(?![\p{L}\p{N}])/u.test(input.canvas)) {
    throw new ScaffoldInputError(`--canvas ${JSON.stringify(input.canvas)} must start with the aspect ratio (each side from 1 to 99), such as "16:9 on a clean white background"`);
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
        restrictions: [
          "No logos, and no claims of affiliation, endorsement, sponsorship, or approval by the rights holder.",
          // A tribute character is drawn within boundaries its rights holder sets; the scaffold cannot know them.
          ...(category === "tribute-character" ? [unresolved("record the rights boundaries the rights holder sets for this character")] : []),
        ],
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

// An issue is the same issue in two runs when the check, the file, and the message agree. The line is
// left out on purpose: a table row added to a file moves every issue below it, and none of them is new.
// A crashed check is keyed by the first line of its report: the stack that follows names the lines of
// this file that called it, which differ between the two runs.
const issueKey = (result, issue) => `${result.id}|${issue.path ?? ""}|${issue.message.startsWith("check crashed:") ? issue.message.split("\n", 1)[0] : issue.message}`;

/** Every issue of every failed check, in order, each with the key two runs compare it by. */
function failures(results) {
  const found = [];
  for (const result of results.filter((candidate) => candidate.status === "fail")) {
    for (const issue of result.issues) {
      found.push({ key: issueKey(result, issue), issue: { id: result.id, title: result.title, path: issue.path, line: issue.line, message: issue.message } });
    }
  }
  return found;
}

/**
 * The entries of `found` that `expectedKeys` does not account for. The same key counts once per
 * occurrence, so a problem that already appeared once and now appears twice has one new occurrence.
 */
function unexpected(found, expectedKeys) {
  const remaining = new Map();
  for (const key of expectedKeys) remaining.set(key, (remaining.get(key) ?? 0) + 1);
  return found.filter(({ key }) => {
    const left = remaining.get(key) ?? 0;
    if (left > 0) remaining.set(key, left - 1);
    return left === 0;
  });
}

/** How many distinct checks have at least one issue. */
const failedChecks = (found) => new Set(found.map(({ issue }) => issue.id)).size;

/**
 * Placeholder lines in text that the scaffold generated: [{ path, line, text }]. `firstLine` is the
 * line of the file on which `text` begins, so a slice of a shared file reports its real line numbers.
 */
export function findPlaceholders(files) {
  const found = [];
  for (const { path: file, text, firstLine = 1 } of files) {
    for (const [index, line] of text.split("\n").entries()) {
      const match = SCAFFOLD_PLACEHOLDER.exec(line);
      // Show the part of the line around the marker, so a long line never hides what was found.
      if (match) found.push({ path: file, line: firstLine + index, text: excerptAround(line, match.index, { before: 40 }) });
    }
  }
  return found;
}

/** The 1-based line of `text` on which character offset `offset` falls. */
const lineAtOffset = (text, offset) => text.slice(0, offset).split("\n").length;

function newAliasProblems(existing, entry) {
  const known = new Set(buildAliasIndex(existing).problems.map((problem) => problem.message));
  const candidate = { ...entry, excludedTerms: entry.excludedTerms ?? [] };
  return buildAliasIndex([...existing, candidate]).problems.filter((problem) => !known.has(problem.message));
}

/** Folder names the repository never walks, plus the plain `name/` lines of its .gitignore. */
function ignoredFolderNames(repo) {
  const listed = (repo.readTextIfExists(".gitignore") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[A-Za-z0-9._-]+\/$/.test(line))
    .map((line) => line.slice(0, -1));
  return new Set([...IGNORED_DIRECTORIES, ...listed]);
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
  if (ignoredFolderNames(repo).has(input.id)) {
    throw new ScaffoldInputError(
      `--id ${JSON.stringify(input.id)} is a folder name that git ignores and the repository checks skip, so its pack would never be committed or scanned; choose another id`,
    );
  }
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
  const attributionsAfter = insertAttributions(attributions, attributionsSection);
  const create = PACK_FILES.map((file) => ({ path: `${packDir}/${file}`, content: pack[file] }));
  const modify = [
    { path: PATHS.registryFile, before: registryBefore, after: registryAfter },
    { path: PATHS.attributions, before: attributions, after: attributionsAfter },
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
  const newIssues = unexpected(
    after,
    before.map(({ key }) => key),
  );
  if (newIssues.length > 0) {
    throw new ScaffoldRefusal(
      `${entry.name} (${entry.id}) would break the repository checks, so nothing was written`,
      newIssues.map(({ issue }) => describeIssue(issue)),
    );
  }

  // The new entry is the last thing in the registry file, and the new section sits wherever it was inserted:
  // report the markers at their real lines in the files as they will be written.
  const entryStart = lineAtOffset(registryAfter, registryAfter.lastIndexOf(`"id": ${JSON.stringify(entry.id)}`)) - 1;
  const sectionStart = lineAtOffset(attributionsAfter, attributionsAfter.indexOf(attributionsSection));
  const placeholders = findPlaceholders([
    ...create.map(({ path: file, content }) => ({ path: file, text: content })),
    { path: PATHS.registryFile, text: registryAfter.split("\n").slice(entryStart - 1).join("\n"), firstLine: entryStart },
    { path: PATHS.attributions, text: attributionsSection, firstLine: sectionStart },
  ]);
  return {
    archetype: { id: entry.id, name: entry.name, category: entry.category, status: entry.status, outputFolder: outputDirectory(entry) },
    create,
    modify,
    validation: {
      checks: afterResults.length,
      failedChecksBefore: failedChecks(before),
      failedChecksAfter: failedChecks(after),
      issuesBefore: before.length,
      issuesAfter: after.length,
      // What the repository must still report once the files are written; anything else is a surprise.
      expectedIssues: after.map(({ key }) => key),
    },
    placeholders,
  };
}

/** The line a problem is reported as: the check, the file, and what is wrong. */
export const describeIssue = (issue) => `${issue.id} ${issue.path ? `${issue.path}: ` : ""}${issue.message}`;

/**
 * Write a plan. First it checks that nothing changed since planning: every file the plan edits must
 * still read as it did, and none it creates may exist. New files are created exclusively, so an
 * existing file is never overwritten, and an edit is made only to the text that was planned: if a file
 * changes between being read and being written, everything is undone. `verify` runs once everything
 * is written and returns a list of problems. If it finds any, or any write fails, everything this call
 * did is undone, each step on its own so one that fails cannot stop the rest, and anything that could
 * not be undone is reported in a ScaffoldRollbackError instead of being passed over. `io` is the file
 * API it writes with (Node's `fs`); tests hand it one that fails on demand.
 */
export function applyScaffold(root, plan, { verify, io = fs } = {}) {
  const repo = new Repository(root);
  // A generated document that was missing when the plan was made (before is null) is created like a new file.
  const creates = [...plan.create, ...plan.modify.filter((file) => file.before === null).map(({ path: file, after }) => ({ path: file, content: after }))];
  const edits = plan.modify.filter((file) => file.before !== null);
  const changed = [];
  for (const { path: file } of creates) {
    if (io.existsSync(repo.resolve(file))) changed.push(`${file} now exists`);
  }
  for (const { path: file, before } of edits) {
    const absolute = repo.resolve(file);
    if (!io.existsSync(absolute) || normalizeText(io.readFileSync(absolute, "utf8")) !== before) changed.push(`${file} changed`);
  }
  if (changed.length > 0) throw new ScaffoldRefusal("The repository changed after the plan was made, so nothing was written", changed);

  const createdFiles = [];
  const createdDirectories = [];
  const replaced = [];
  try {
    for (const { path: file, content } of creates) {
      const absolute = repo.resolve(file);
      const directory = path.dirname(absolute);
      // The folders that do not exist yet are the ones this run creates, and so the ones it may remove again.
      // They are found before creating them, because what mkdirSync returns is not comparable (Windows
      // prefixes \\?\). It does say whether this call made anything: undefined means the folder was
      // there by then, as when another run made it in between, and then it is not this run's to remove.
      const missing = [];
      for (let current = directory; !io.existsSync(current) && current !== path.dirname(current); current = path.dirname(current)) missing.push(current);
      if (io.mkdirSync(directory, { recursive: true }) !== undefined) createdDirectories.push(...missing);
      try {
        io.writeFileSync(absolute, content, { encoding: "utf8", flag: "wx" });
      } catch (error) {
        // The exclusive create fails with EEXIST only when the file was already there, and then it is not ours.
        // Any other failure, a full disk for one, may have left the new file empty or half written.
        if (error.code !== "EEXIST") createdFiles.push(absolute);
        throw error;
      }
      createdFiles.push(absolute);
    }
    for (const { path: file, before, after } of edits) {
      const absolute = repo.resolve(file);
      const original = io.readFileSync(absolute);
      // Read again here, not only when planning, so an edit made in between is never written over.
      if (normalizeText(original.toString("utf8")) !== before) {
        throw new ScaffoldRefusal("The repository changed while it was being written, so the changes were undone", [`${file} changed`]);
      }
      replaced.push({ file, absolute, original });
      io.writeFileSync(absolute, after, "utf8");
    }
    const problems = verify?.() ?? [];
    if (problems.length > 0) throw new ScaffoldRefusal("The repository checks failed after writing, so the changes were undone", problems);
  } catch (error) {
    const leftovers = [];
    const undo = (what, action) => {
      try {
        action();
      } catch (failure) {
        leftovers.push(`${what}: ${failure.message}`);
      }
    };
    // A file whose write failed before it changed has nothing to restore, so it is not reported as left behind.
    for (const { file, absolute, original } of replaced.reverse()) {
      undo(`restore ${file}`, () => {
        if (!original.equals(io.readFileSync(absolute))) io.writeFileSync(absolute, original);
      });
    }
    for (const absolute of createdFiles.reverse()) undo(`remove ${path.relative(repo.root, absolute).replaceAll("\\", "/")}`, () => io.rmSync(absolute, { force: true }));
    // Only empty folders are removed, deepest first (a child's path is always longer than its parent's):
    // a file somebody else put there is never deleted.
    for (const directory of [...createdDirectories].sort((first, second) => second.length - first.length)) undo(`remove ${path.relative(repo.root, directory).replaceAll("\\", "/")}`, () => io.rmdirSync(directory));
    if (leftovers.length > 0) throw new ScaffoldRollbackError(error, leftovers);
    throw error;
  }
}

/**
 * Run every repository check on a checkout. `failures` are all the issues found; `unexpected` are the ones
 * `expectedIssues` (the keys planScaffold recorded) does not account for, which is what a run that wrote
 * the plan must not produce.
 */
export function checkRepository(repo, { policy, expectedIssues = [] } = {}) {
  const results = runChecks(ALL_CHECKS, createContext(repo, { policy }));
  const found = failures(results);
  return { checks: results.length, failures: found.map(({ issue }) => issue), unexpected: unexpected(found, expectedIssues).map(({ issue }) => issue) };
}
