// The data behind examples/gallery/index.html: every archetype's registry entry,
// its approved sample images, and a prompt template ready for the page to fill.
// `npm run build:docs` embeds it in the page between the gallery-data markers, so
// the gallery can never drift from registry.json or from a pack's prompts.md.
//
// The page is a single offline file with no way to read the repository, which is
// why the data is embedded. It lists sample images only for archetypes whose
// sample gate is approved; every other archetype shows a "pending" tile.

import path from "node:path";
import { GALLERY_FILE_PATTERN, PATHS } from "./config.mjs";
import {
  buildNegativePrompt,
  defaultAspect,
  fillTemplate,
  parsePromptPack,
  requireSlots,
  slotDefaults,
  withRightsNote,
} from "./prompt-assembly.mjs";
import { CATEGORIES, STATUSES, backgroundPhrase, outputDirectory, packFilePath } from "./registry.mjs";

/** Placeholders the page replaces with what the visitor types or picks. */
export const TOKENS = Object.freeze({ concept: "@@concept@@", action: "@@action@@", labels: "@@labels@@", background: "@@background@@" });

export const CATEGORY_LABELS = Object.freeze({
  "house-style": "House style",
  mascot: "Mascot",
  "tribute-character": "Tribute character",
  "animation-preset": "Animation preset",
});

export const STATUS_LABELS = Object.freeze({
  active: "Active",
  experimental: "Experimental",
  "gated-authorized": "Gated: needs your authorization",
});

export const SAMPLE_LABELS = Object.freeze({
  approved: "Samples approved",
  pending: "Samples pending review",
  withheld: "Samples withheld",
});

/**
 * The drawing technique an archetype's style sheet describes: "Marker" when its
 * medium or linework names marker or brush-pen work, "Ink sketch" otherwise.
 */
export function techniqueOf(archetype) {
  const text = `${archetype.styleSheet.medium} ${archetype.styleSheet.linework}`.toLowerCase();
  return /\bmarker\b|brush-pen|dry-brush/.test(text) ? "Marker" : "Ink sketch";
}

/** "01-two-breakpoints.png" becomes "Two breakpoints". */
export function captionOf(fileName) {
  const words = fileName.replace(/\.png$/i, "").replace(/^\d+-/, "").replaceAll("-", " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** The approved sample images of an archetype, as paths relative to the gallery page. */
export function sampleImages(repo, archetype) {
  if (archetype.sampleGates.status !== "approved") return [];
  const pageDirectory = path.posix.dirname(PATHS.galleryPage);
  const images = [];
  for (const directory of archetype.sampleGates.directories) {
    const language = path.posix.relative(pageDirectory, directory).split("/")[0];
    for (const entry of repo.entries(directory)) {
      if (entry.type !== "file" || !GALLERY_FILE_PATTERN.test(entry.name)) continue;
      images.push({
        src: path.posix.relative(pageDirectory, entry.path),
        caption: captionOf(entry.name),
        language: /^[a-z]{2}$/.test(language) ? language : "en",
      });
    }
  }
  return images;
}

function promptData(repo, archetype) {
  const file = packFilePath(archetype, "prompts.md");
  const text = repo.readTextIfExists(file);
  if (text === null) throw new Error(`${file} is missing`);
  const pack = parsePromptPack(text);
  // The page's three inputs fill these fields, so every pack must keep them.
  requireSlots(pack.template, ["scene", "action", "labels"], file);
  const aspectRatio = defaultAspect(archetype);
  const policy = archetype.styleSheet.background;
  const filled = fillTemplate(pack.template, {
    aspect: aspectRatio,
    scene: TOKENS.concept,
    action: TOKENS.action,
    labels: TOKENS.labels,
    background: policy === undefined ? undefined : TOKENS.background,
    rightsNote: pack.rightsNote ?? undefined,
  });
  const defaults = slotDefaults(pack.template);
  return {
    aspectRatio,
    template: withRightsNote(filled.text, archetype, pack.rightsNote),
    defaults: {
      concept: defaults.scene ?? null,
      action: defaults.action ?? null,
      labels: defaults.labels ?? null,
      background: policy === undefined ? null : backgroundPhrase(policy.default),
    },
    // The page colors a visitor may pick; the first is the default, which needs no field.
    backgrounds:
      policy === undefined
        ? []
        : [policy.default, ...policy.presets].map((swatch) => ({ name: swatch.name, hex: swatch.hex, phrase: backgroundPhrase(swatch) })),
    negative: buildNegativePrompt(archetype, pack.negativePrompt),
  };
}

/** The page colors an archetype offers, for display. Null when its background is fixed. */
function backgroundData(archetype) {
  const policy = archetype.styleSheet.background;
  if (policy === undefined) return null;
  const plain = ({ name, hex }) => ({ name, hex });
  return { default: plain(policy.default), presets: policy.presets.map(plain) };
}

/** The complete, JSON-ready gallery data for a registry. Throws when a pack has no usable template. */
export function buildGalleryData(repo, registry) {
  const archetypes = registry.archetypes.map((archetype) => {
    const { motionDna: motion, styleSheet: style, legalNotice: legal, sampleGates: samples } = archetype;
    return {
      id: archetype.id,
      name: archetype.name,
      isDefault: archetype === registry.defaultArchetype,
      category: archetype.category,
      status: archetype.status,
      technique: techniqueOf(archetype),
      summary: archetype.summary,
      outputFolder: outputDirectory(archetype),
      motion: { actor: motion.actor, signatureActions: motion.signatureActions, poses: motion.poses, timing: motion.timing },
      style: {
        medium: style.medium,
        canvas: style.canvas,
        linework: style.linework,
        palette: style.palette,
        avoid: style.avoid,
        background: backgroundData(archetype),
      },
      legal: {
        credit: legal.credit,
        rightsHolder: legal.rightsHolder,
        license: legal.license,
        restrictions: legal.restrictions,
        thirdParty: archetype.thirdParty,
      },
      samples: { status: samples.status, decision: samples.decision, images: sampleImages(repo, archetype) },
      prompt: promptData(repo, archetype),
    };
  });
  const used = (values) => [...new Set(values)];
  return {
    defaultArchetype: registry.defaultArchetype.id,
    categories: Object.keys(CATEGORIES)
      .filter((id) => archetypes.some((archetype) => archetype.category === id))
      .map((id) => ({ id, label: CATEGORY_LABELS[id] ?? id })),
    techniques: used(archetypes.map((archetype) => archetype.technique)),
    statuses: Object.keys(STATUSES).map((id) => ({ id, label: STATUS_LABELS[id] ?? id })),
    sampleStatuses: SAMPLE_LABELS,
    archetypes,
  };
}

// Built from char codes so no raw separator ever appears in this source file.
const LINE_SEPARATOR = String.fromCharCode(0x2028);
const PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);

/**
 * The generated region: one JSON data block. `<` is escaped so no value can end
 * the script element, and the line separators JSON allows but older engines reject.
 */
export function renderGalleryData(data) {
  const json = JSON.stringify(data, null, 2)
    .replaceAll("<", "\\u003c")
    .replaceAll(LINE_SEPARATOR, "\\u2028")
    .replaceAll(PARAGRAPH_SEPARATOR, "\\u2029");
  return `<script type="application/json" id="inkexplain-data">\n${json}\n</script>`;
}
