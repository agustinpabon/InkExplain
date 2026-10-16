// Assembles an image prompt from an archetype's own generation template.
//
// Every pack's prompts.md carries one fenced `text` template under "Generation
// prompt". The shared method (references/workflow/prompt-assembly.md) says to
// start from that template, change only the bracketed fields, and keep the
// style, character, and rights-note blocks as written. This module does the
// deterministic part of that method: it fills the fields every template shares
// (aspect ratio, scene, action, labels, rights note), reports every other field
// as still to be filled, and can check that a finished prompt is a faithful
// instance of its template. It reads files only through Repository.

import { extractCodeBlocks, sectionBody } from "./markdown.mjs";
import { outputDirectory, packFilePath } from "./registry.mjs";

/** A template, pack, or repository problem: the person who ran the tool cannot fix it by retyping. */
export class PromptAssemblyError extends Error {}

/** Something the person typed is not usable: an aspect ratio, a concept, an action, or a label. */
export class PromptInputError extends PromptAssemblyError {}

export const SCENE_FIELD = "core idea in one sentence";
export const RIGHTS_NOTE_FIELD = "append the rights note from this file";
export const MAX_LABELS = 6;
export const MAX_CONCEPT_LENGTH = 400;
export const MAX_ACTION_LENGTH = 300;
export const MAX_LABEL_LENGTH = 40;

const LABELS_FIELD_START = '"label 1"';
const OPTIONAL_FIELD_START = "Reference sentence:";
const ACTION_TAIL = ", caught at its decisive moment";
const PARAGRAPH_BREAK = /\n{2,}/;
const DEFAULT_ASPECT = "16:9";

// A bracketed field never spans lines and never nests.
const bracketFields = () => /\[([^[\]\n]*)\]/g;

// A pack marks a sentence as deletable ("keep the reference sentence; otherwise delete it").
const optionalFields = () => /\s?\[Reference sentence:[^[\]\n]*\]/g;

// Things no archetype wants, taken from the shared artifact-rejection list in
// references/workflow/qa-checklist.md. An item is skipped when the archetype's
// own avoid list already covers it, so the negative prompt does not repeat itself.
const SHARED_NEGATIVES = Object.freeze([
  { text: "title, heading, or caption text", covered: /\b(?:title|heading|caption)/ },
  { text: "slide, infographic, flowchart, or dashboard look", covered: /\b(?:slide|infographic|flowchart|dashboard)/ },
  { text: "crowded nodes and arrows", covered: /\bnodes\b/ },
  { text: "gradients", covered: /gradient/ },
  { text: "drop shadows", covered: /shadow/ },
  { text: "paper texture", covered: /texture/ },
  { text: "3D rendering", covered: /\b3d\b/ },
  { text: "glossy vector polish", covered: /vector/ },
  { text: "UI or code screenshots", covered: /\b(?:ui|code|screenshot)/ },
  { text: "logos", covered: /logo/ },
  { text: "watermarks", covered: /watermark/ },
]);

/** The first fenced `text` block of a section body, trimmed, or null. */
function firstTextBlock(body) {
  if (body === null) return null;
  const block = extractCodeBlocks(body).find((candidate) => candidate.info === "text");
  return block === undefined ? null : block.content.trim();
}

/**
 * Read a pack's prompts.md: the generation template, the rights note, and the
 * pack's own negative prompt when it ships one (the latter two are null when absent).
 */
export function parsePromptPack(promptsText) {
  const template = firstTextBlock(sectionBody(promptsText, "Generation prompt"));
  if (template === null || template === "") {
    throw new PromptAssemblyError('prompts.md has no ```text block under "Generation prompt"');
  }
  return {
    template,
    rightsNote: firstTextBlock(sectionBody(promptsText, "Rights note")),
    negativePrompt: firstTextBlock(sectionBody(promptsText, "Negative prompt")),
  };
}

/** A canonical `W:H` aspect ratio such as `16:9`. */
export function normalizeAspect(value) {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(String(value).trim());
  if (match === null || Number(match[1]) < 1 || Number(match[2]) < 1) {
    throw new PromptInputError(`aspect ratio must look like 16:9, got ${JSON.stringify(String(value))}`);
  }
  return `${Number(match[1])}:${Number(match[2])}`;
}

/** The ratio an archetype's canvas rule starts with, falling back to 16:9. */
export function defaultAspect(archetype) {
  const match = /^(\d{1,2}:\d{1,2})\b/.exec(archetype.styleSheet.canvas);
  return match === null ? DEFAULT_ASPECT : normalizeAspect(match[1]);
}

/** Collapse whitespace and reject empty, oversized, or control-character text. */
function cleanLine(value, label, maxLength) {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  if (text === "") throw new PromptInputError(`${label} must not be empty`);
  if (text.length > maxLength) throw new PromptInputError(`${label} is ${text.length} characters; the limit is ${maxLength}`);
  if (/\p{Cc}/u.test(text)) throw new PromptInputError(`${label} must not contain control characters`);
  return text;
}

/** Labels as a quoted list, the way every template writes them: ["a", "b"]. */
export function formatLabels(labels) {
  if (labels.length === 0) throw new PromptInputError("give at least one label, or none");
  if (labels.length > MAX_LABELS) {
    throw new PromptInputError(`a prompt carries two to six labels; got ${labels.length}`);
  }
  const cleaned = labels.map((label) => cleanLine(label, "a label", MAX_LABEL_LENGTH));
  for (const label of cleaned) {
    if (/["[\]]/.test(label)) throw new PromptInputError(`label ${JSON.stringify(label)} must not contain quotes or brackets`);
  }
  return `[${cleaned.map((label) => `"${label}"`).join(", ")}]`;
}

/** What a paragraph is about: its leading "Label:" or, for the first one, the canvas. */
function paragraphSection(paragraph, index) {
  // A label never contains a bracket, so the colon inside "[16:9]" is not one.
  const match = /^([A-Z][^:\n[\]]{0,80}):/.exec(paragraph);
  if (match !== null) return match[1];
  return index === 0 ? "Canvas" : "";
}

/** Which shared slot a bracketed field fills, or null when it is pack-specific. */
function slotOf(field, after, paragraphIndex) {
  if (paragraphIndex === 0 && /^16:9\b/.test(field)) return "aspect";
  if (field === SCENE_FIELD) return "scene";
  if (field === RIGHTS_NOTE_FIELD) return "rightsNote";
  if (field.startsWith(LABELS_FIELD_START)) return "labels";
  if (after.startsWith(ACTION_TAIL)) return "action";
  return null;
}

/**
 * Every bracketed field of a template, in order:
 * [{ paragraph, section, field, slot, optional }], where slot is "aspect", "scene",
 * "action", "labels", "rightsNote", or null for fields only the planner can fill,
 * and optional marks a sentence the planner may delete.
 */
export function scanTemplate(template) {
  const fields = [];
  template.split(PARAGRAPH_BREAK).forEach((text, paragraph) => {
    const section = paragraphSection(text, paragraph);
    for (const match of text.matchAll(bracketFields())) {
      const after = text.slice(match.index + match[0].length);
      fields.push({
        paragraph,
        section,
        field: match[1],
        slot: slotOf(match[1], after, paragraph),
        optional: match[1].startsWith(OPTIONAL_FIELD_START),
      });
    }
  });
  return fields;
}

const SLOT_DESCRIPTIONS = Object.freeze({
  scene: `the [${SCENE_FIELD}] field`,
  action: `the action field before "${ACTION_TAIL.slice(2)}"`,
  labels: 'the ["label 1", "label 2", "label 3"] field',
});

/**
 * Fail loudly when a template cannot take something a caller wants to fill, so a
 * pack that dropped a shared field is reported instead of silently ignoring input.
 */
export function requireSlots(template, needed, where) {
  const present = new Set(scanTemplate(template).map((field) => field.slot));
  const missing = needed.filter((slot) => !present.has(slot));
  if (missing.length > 0) {
    throw new PromptAssemblyError(`${where}: the generation prompt lacks ${missing.map((slot) => SLOT_DESCRIPTIONS[slot]).join(" and ")}`);
  }
}

/** The bracketed text a slot shows while it is unfilled, such as `[specific physical action]`. */
export function slotDefaults(template) {
  const defaults = {};
  for (const { field, slot } of scanTemplate(template)) {
    if (slot !== null && slot !== "aspect" && defaults[slot] === undefined) defaults[slot] = `[${field}]`;
  }
  return defaults;
}

function replaceAspect(paragraph, aspect) {
  const [width, height] = aspect.split(":").map(Number);
  // The templates write "[16:9] horizontal", "[16:9 horizontal]", or a bare "16:9 horizontal".
  return paragraph.replace(/\[?16:9(?: horizontal)?\]?(?: horizontal)?/, (match) =>
    width > height && match.includes("horizontal") ? `${aspect} horizontal` : aspect,
  );
}

/** Drop the final period of a value when the template already punctuates after it. */
function joinValue(value, after) {
  return /[.!?]$/.test(value) && /^[.!?,;]/.test(after) ? value.replace(/[.!?]+$/, "") : value;
}

/**
 * Fill the shared slots of a template. `values` may hold aspect, scene, action,
 * labels (an array, or text used verbatim), and rightsNote; slots without a value stay
 * bracketed. Returns { text, unfilled } where unfilled lists every bracketed field
 * left in the text as { section, field, slot, optional }.
 */
export function fillTemplate(template, values = {}) {
  const unfilled = [];
  const paragraphs = template.split(PARAGRAPH_BREAK).map((paragraph, index) => {
    const section = paragraphSection(paragraph, index);
    const text = index === 0 && values.aspect !== undefined ? replaceAspect(paragraph, values.aspect) : paragraph;
    return text.replace(bracketFields(), (match, field, offset) => {
      const after = text.slice(offset + match.length);
      const slot = slotOf(field, after, index);
      let value;
      if (slot === "scene") value = values.scene;
      else if (slot === "action") value = values.action;
      else if (slot === "rightsNote") value = values.rightsNote;
      else if (slot === "labels") value = typeof values.labels === "string" || values.labels === undefined ? values.labels : formatLabels(values.labels);
      if (value === undefined || value === null) {
        if (slot !== "aspect") unfilled.push({ section, field, slot, optional: field.startsWith(OPTIONAL_FIELD_START) });
        return match;
      }
      return slot === "labels" ? value : joinValue(value, after);
    });
  });
  return { text: paragraphs.join("\n\n"), unfilled };
}

/** Short quotation of template text for error messages. */
function quote(text) {
  const flat = text.replace(/\s+/g, " ").trim();
  return JSON.stringify(flat.length > 48 ? `${flat.slice(0, 47)}…` : flat);
}

/** Why `paragraph` is not an instance of `templateParagraph`, or null when it is. */
function paragraphMismatch(templateParagraph, paragraph) {
  const reason = pieceMismatch(templateParagraph, paragraph);
  if (reason === null) return null;
  // The planner may have deleted a sentence the pack marks as optional.
  const withoutOptional = templateParagraph.replace(optionalFields(), "");
  return withoutOptional !== templateParagraph && pieceMismatch(withoutOptional, paragraph) === null ? null : reason;
}

function pieceMismatch(templateParagraph, paragraph) {
  const pieces = [];
  let last = 0;
  for (const match of templateParagraph.matchAll(bracketFields())) {
    pieces.push(templateParagraph.slice(last, match.index));
    last = match.index + match[0].length;
  }
  pieces.push(templateParagraph.slice(last));
  if (pieces.length === 1) return paragraph === pieces[0] ? null : "differs from the template, which has no fields here";

  // Fixed text must appear in order; each field in between must hold something.
  if (!paragraph.startsWith(pieces[0])) return `does not start with ${quote(pieces[0])}`;
  let position = pieces[0].length;
  for (const literal of pieces.slice(1, -1)) {
    const found = literal === "" ? position + 1 : paragraph.indexOf(literal, position + 1);
    if (found === -1 || found > paragraph.length) return `is missing ${quote(literal)}`;
    position = found + literal.length;
  }
  const tail = pieces.at(-1);
  if (!paragraph.endsWith(tail) || paragraph.length - tail.length < position + 1) return `does not end with ${quote(tail)}`;
  return null;
}

/**
 * Check that `text` is a faithful instance of `template`: the same paragraphs in
 * the same order, with every piece of fixed text intact and every field filled.
 * Returns { ok, problems }.
 */
export function matchesTemplate(template, text) {
  const expected = template.split(PARAGRAPH_BREAK);
  const actual = text.trim().split(PARAGRAPH_BREAK);
  const problems = [];
  if (expected.length !== actual.length) problems.push(`expected ${expected.length} paragraphs, found ${actual.length}`);
  for (let index = 0; index < Math.min(expected.length, actual.length); index += 1) {
    const reason = paragraphMismatch(expected[index], actual[index]);
    if (reason !== null) {
      const section = paragraphSection(expected[index], index);
      problems.push(`paragraph ${index + 1}${section === "" ? "" : ` (${section})`} ${reason}`);
    }
  }
  return { ok: problems.length === 0, problems };
}

/**
 * The negative prompt for tools that have a field for one (or Midjourney's --no).
 * A pack that ships its own list wins; otherwise the archetype's avoid list comes
 * first, followed by the shared rejection items it does not already cover.
 */
export function buildNegativePrompt(archetype, packNegativePrompt = null) {
  if (packNegativePrompt !== null && packNegativePrompt !== "") return packNegativePrompt;
  const own = archetype.styleSheet.avoid.map((entry) => entry.trim().replace(/[.]+$/, ""));
  const covered = own.join(" ").toLowerCase();
  const shared = SHARED_NEGATIVES.filter((item) => !item.covered.test(covered)).map((item) => item.text);
  return [...own, ...shared].join(", ");
}

/** A third-party archetype never ships a prompt without its rights note. */
export function withRightsNote(prompt, archetype, rightsNote) {
  const note = rightsNote?.replace(/[.]+$/, "");
  return archetype.thirdParty && note && !prompt.includes(note) ? `${prompt}\n\nRights note: ${rightsNote}` : prompt;
}

/**
 * Assemble the prompt for one archetype. `options` may hold concept, action,
 * labels (array), and aspect. Everything else in the template stays bracketed
 * and is listed in `unfilled`.
 */
export function assemblePrompt(repo, archetype, options = {}) {
  const file = packFilePath(archetype, "prompts.md");
  const text = repo.readTextIfExists(file);
  if (text === null) throw new PromptAssemblyError(`${file} is missing`);
  const { template, rightsNote, negativePrompt } = parsePromptPack(text);
  requireSlots(
    template,
    [
      options.concept === undefined ? null : "scene",
      options.action === undefined ? null : "action",
      options.labels === undefined || options.labels.length === 0 ? null : "labels",
    ].filter(Boolean),
    file,
  );

  const aspectRatio = options.aspect === undefined ? defaultAspect(archetype) : normalizeAspect(options.aspect);
  const filled = fillTemplate(template, {
    aspect: aspectRatio,
    scene: options.concept === undefined ? undefined : cleanLine(options.concept, "the concept", MAX_CONCEPT_LENGTH),
    action: options.action === undefined ? undefined : cleanLine(options.action, "the action", MAX_ACTION_LENGTH),
    labels: options.labels === undefined || options.labels.length === 0 ? undefined : options.labels,
    rightsNote: rightsNote ?? undefined,
  });

  return {
    archetype,
    aspectRatio,
    prompt: withRightsNote(filled.text, archetype, rightsNote),
    negativePrompt: buildNegativePrompt(archetype, negativePrompt),
    rightsNote: rightsNote ?? null,
    unfilled: filled.unfilled,
    sourceFile: file,
    outputFolder: outputDirectory(archetype),
  };
}
