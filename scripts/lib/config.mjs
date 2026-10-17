// Canonical InkExplain identity, repository layout, and validation policy.
// Checks, generators, and tests read these values instead of hardcoding paths.

export const PRODUCT = Object.freeze({
  name: "InkExplain",
  slug: "inkexplain",
  invocation: "$inkexplain",
  tagline: "Ideas made visual.",
  description: "Turn code, docs, and ideas into hand-drawn illustrations with AI agents.",
  shortTagline: "Turn ideas into illustrations.",
});

export const PATHS = Object.freeze({
  packageDir: "skills/inkexplain",
  skillFile: "skills/inkexplain/SKILL.md",
  agentFile: "skills/inkexplain/agents/openai.yaml",
  registryFile: "skills/inkexplain/registry.json",
  routingFile: "skills/inkexplain/references/routing.md",
  workflowDir: "skills/inkexplain/references/workflow",
  archetypesDir: "skills/inkexplain/references/archetypes",
  readme: "README.md",
  attributions: "ATTRIBUTIONS.md",
  license: "LICENSE",
  packageLicense: "skills/inkexplain/LICENSE.md",
  promptExamples: "examples/prompts.md",
  galleryDir: "examples/gallery",
  galleryPage: "examples/gallery/index.html",
  galleryProvenance: "examples/gallery/provenance.json",
  provenanceDoc: "docs/provenance.md",
  brandDir: "assets/brand",
  showcaseDir: "assets/examples",
  languagePolicy: "docs/language-policy.md",
  locales: "readmes/locales.json",
  localizedReadmeDir: "readmes",
  packageJson: "package.json",
});

// Shared, character-independent method modules. SKILL.md must route to every one.
export const WORKFLOW_MODULES = Object.freeze([
  "concept-extraction.md",
  "composition-grid.md",
  "prompt-assembly.md",
  "editing.md",
  "qa-checklist.md",
  "delivery.md",
]);

// Every archetype pack contains exactly these five Markdown files, listed in the
// order agents load them: rights first, so boundaries are known before drawing.
export const PACK_FILES = Object.freeze(["rights.md", "identity.md", "style.md", "motion-and-acting.md", "prompts.md"]);

// Level-2 headings each pack file must expose so agents can navigate packs uniformly.
export const PACK_FILE_SECTIONS = Object.freeze({
  "rights.md": ["Source", "Rights and restrictions", "Public samples"],
  "identity.md": ["Identity", "Recognition", "Failure modes"],
  "style.md": ["Canvas", "Linework", "Color", "Labels", "Avoid"],
  "motion-and-acting.md": ["Actions", "Patterns", "Supporting objects", "Originality"],
  "prompts.md": ["Planning fields", "Generation prompt", "Edit prompts", "Review and repair", "Delivery notes"],
});

// Archetypes that depict a third-party character carry this section in prompts.md.
export const RIGHTS_NOTE_SECTION = "Rights note";

// Level-2 headings SKILL.md must keep. SKILL.md is the always-loaded entry point,
// so it stays short; detail is loaded progressively from references/.
export const SKILL_SECTIONS = Object.freeze(["When to use", "Modes", "Workflow", "Rules", "Output"]);
export const SKILL_MAX_LINES = 80;
// The Agent Skills format caps names at 64 characters and descriptions at 1024.
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const SKILL_DESCRIPTION_MAX = 1024;

export const AGENT_SHORT_DESCRIPTION_MAX = 120;

// Files an installed skill package may contain.
export const PACKAGE_ALLOWED_EXTENSIONS = Object.freeze([".md", ".json", ".yaml", ".png", ".svg"]);
export const PACKAGE_MAX_FILE_BYTES = 3 * 1024 * 1024;

// Legal notices that must survive every edit. The MIT license requires the
// original copyright notice to stay with every copy, and ATTRIBUTIONS.md must
// keep an Origins section that credits each holder.
export const LEGAL = Object.freeze({
  requiredCopyrightLines: Object.freeze(["Copyright (c) 2026 Ian", "Copyright (c) 2026 Agustin Pabon"]),
  // The maintainer's own line. Every other holder in LICENSE is an origin that ATTRIBUTIONS.md must credit.
  maintainerCopyrightLine: "Copyright (c) 2026 Agustin Pabon",
  originsSection: "Origins",
  mitPermission:
    'Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:',
  mitCondition:
    "The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.",
  mitDisclaimer:
    'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.',
});

// Draft markers that `npm run archetype:add` writes wherever only the contributor can decide:
// what the character looks like, what it does, and who holds its rights. Every marker is the word
// followed by a colon ("TODO: ...", "UNRESOLVED: ..."), so prose that merely contains the word is
// not one. They are allowed while an archetype is experimental and must be gone before it is
// promoted (SCHEMA-010).
export const SCAFFOLD_PLACEHOLDER = /\b(?:TODO|UNRESOLVED):/;

// Locale codes, selector labels, README paths, and translated table headings
// live in readmes/locales.json next to the translations they describe.
export const LOCALE_STRING_KEYS = Object.freeze(["archetype", "category", "summary", "legalStatus", "default"]);

export const GALLERY_LANGUAGES = Object.freeze(["en", "zh"]);
export const GALLERY_FILE_PATTERN = /^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.png$/;

// Regions delimited by `<!-- inkexplain:<name>:start -->` and `<!-- inkexplain:<name>:end -->`.
export const DOC_REGIONS = Object.freeze({
  languages: "languages",
  archetypes: "archetypes",
  credits: "credits",
  galleryCredits: "gallery-credits",
  galleryData: "gallery-data",
});

// Projects InkExplain originates from are listed once, in the Origins section of
// ATTRIBUTIONS.md. Their names and repository identifiers may appear only in the
// places classified here as attribution: the credits themselves, the data and rights
// notes they are written from, the views generated from that data, and tests that quote them.
export const ORIGIN_IDENTIFIER_ALLOWLIST = Object.freeze([
  { scope: "file", path: "ATTRIBUTIONS.md", classification: "origins and third-party notices" },
  { scope: "file", path: "LICENSE", classification: "license notice" },
  { scope: "file", path: "skills/inkexplain/LICENSE.md", classification: "license and notices that travel with the installed skill" },
  { scope: "file", path: "docs/provenance.md", classification: "provenance record" },
  { scope: "file", path: "docs/walkthroughs.md", classification: "walkthrough prompts that quote archetype rights notes" },
  { scope: "file", path: "examples/gallery/provenance.json", classification: "gallery sample provenance record" },
  { scope: "file", path: "skills/inkexplain/registry.json", classification: "archetype legal notices" },
  { scope: "file", path: "skills/inkexplain/references/routing.md", classification: "archetype credits generated from the registry" },
  { scope: "file", path: "examples/gallery/index.html", classification: "gallery data generated from the registry and the provenance record" },
  { scope: "pack-file", file: "rights.md", classification: "archetype rights record" },
  { scope: "pack-file", file: "prompts.md", classification: "archetype rights note carried by every prompt" },
  { scope: "prefix", prefix: "tests/", classification: "tests that quote credits and rights notes" },
  { scope: "region", region: "credits", classification: "credits in README files" },
  { scope: "region", region: "gallery-credits", classification: "credits next to the gallery images in README files" },
  { scope: "region", region: "archetypes", classification: "archetype table generated from the registry, which names each rights holder" },
]);

// English is the default for every surface listed here (see docs/language-policy.md).
export const LANGUAGE_DEFAULT_SURFACES = Object.freeze([
  "repository docs",
  "skill instructions",
  "reference docs",
  "examples",
  "release materials",
  "validation output",
  "code",
  "comments",
  "commit messages",
]);

export const LANGUAGE_EXCEPTION_CATEGORIES = Object.freeze([
  "archetype aliases",
  "user-language visible labels",
  "attribution and source names",
  "README language selector labels",
]);

// Han-script tokens allowed outside archetype aliases. Aliases come from the registry.
export const LANGUAGE_ALLOWLIST = Object.freeze([
  ...["简体中文", "繁體中文", "日本語"].map((token) => ({
    category: "README language selector labels",
    token,
    paths: ["README.md", "scripts/lib/config.mjs"],
    rationale: "The generated language selector names each localized README in its own language.",
  })),
  ...["原始材料", "判断", "输出"].map((token) => ({
    category: "user-language visible labels",
    token,
    paths: ["skills/inkexplain/references/archetypes/littlebox/style.md", "examples/prompts.md", "scripts/lib/config.mjs"],
    rationale: "Shows labels copied exactly in the user's language inside an English prompt.",
  })),
]);

// Localized READMEs are translations; every other tracked text file is English-default.
export const LANGUAGE_SCAN_EXCLUDED_PREFIXES = Object.freeze(["readmes/"]);

export const TEXT_EXTENSIONS = Object.freeze([
  ".md",
  ".mjs",
  ".js",
  ".json",
  ".yaml",
  ".yml",
  ".svg",
  ".html",
  ".txt",
]);
export const TEXT_FILENAMES = Object.freeze(["LICENSE", ".gitignore", ".gitattributes", ".editorconfig"]);

// Directory names never walked by repository scans: VCS data, dependencies,
// local generation output, and per-developer agent installs (all gitignored).
export const IGNORED_DIRECTORIES = Object.freeze([
  ".git",
  "node_modules",
  "generated",
  "outputs",
  "dist",
  ".agents",
  ".claude",
  ".codex",
]);
