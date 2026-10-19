// Checks that a repository explanation stays tied to the files it explains.
//
// references/workflow/repository-explanation.md asks an agent to ground every claim in a file it opened, cited as
// `path:line` or `path:start-end`, and never to invent a path. This reads the file references of an explanation.md
// and looks each one up in the repository: a path that does not exist, or a range that runs past the end of its
// file, is a reference the agent made up or got wrong. It cannot say whether a file shows what the explanation says
// it shows: a person reads that. It reads files only; the CLI is scripts/check-explanation.mjs.

import fs from "node:fs";
import path from "node:path";

// The extensions of files that explain a project. A code span such as `OracleRuntime.recalculate` ends in a word, not
// in a file type, so it is not a file reference and cannot be reported as a missing file.
const EXTENSIONS = "ts|tsx|mts|cts|js|jsx|mjs|cjs|json|jsonc|yaml|yml|toml|ini|cfg|conf|md|mdx|txt|py|pyi|rs|go|java|kt|kts|scala|rb|php|c|h|cc|cpp|hpp|cs|swift|m|mm|sql|sh|bash|zsh|ps1|bat|css|scss|sass|less|html|htm|vue|svelte|astro|xml|gradle|proto|graphql|gql|tf|dart|ex|exs|erl|hs|lua|pl|r|jl|zig|nim|lock|csv|tsv";
// A file reference: a path, perhaps starting with ./ or ../, whose last part has one of those extensions, with
// optional line ranges, as in `src/app.ts:3-19,40-60`.
const REFERENCE = new RegExp(String.raw`^(?<file>(?:\.{1,2}/)*[\w@~-][\w@.~-]*(?:/[\w@.~-]+)*\.(?:${EXTENSIONS}))(?::(?<lines>\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*))?$`, "i");
const LINK_FILE = new RegExp(String.raw`\.(?:${EXTENSIONS})$`, "i");
const SKIPPED_DIRECTORIES = new Set([".git", "node_modules"]);
// A module is the first path-like code span of a table row, a directory the row's other paths may be relative to.
const DIRECTORY = /^[\w@~-][\w@.~-]*(?:\/[\w@.~-]+)*\/?$/;

// Wording that promises more than a source file can show. A policy, a constraint, or a test in a repository is a
// definition of what should happen, not proof of what a deployed system enforces, so an explanation says what the code
// does and what was not checked (references/workflow/repository-explanation.md). These are the plain security
// superlatives, in English and Spanish. "Always" and "never" can be true of one line of code, so they are not listed.
const ABSOLUTE_CLAIM = /\b(?:impenetrables?|unbreakable|unhackable|bullet-?proof|fool-?proof|infranqueables?|inexpugnables?|inviolables?|invulnerables?|infalibles?|a prueba de balas)\b|\b100\s?%\s*(?:secure|safe|seguro|segura|segur[oa]s)\b|\b(?:completely|totally|fully|absolutely|totalmente|completamente|absolutamente)\s+(?:secure|safe|seguro|segura)\b/gi;

/** The absolute claims of a Markdown text: [{ line, text }], in order. */
export function absoluteClaims(markdown) {
  const found = [];
  for (const [index, line] of markdown.split("\n").entries()) {
    for (const match of line.matchAll(ABSOLUTE_CLAIM)) found.push({ line: index + 1, text: match[0] });
  }
  return found;
}

/** Every tracked-looking file of a checkout, as POSIX paths from its root. */
export function listFiles(root) {
  const files = [];
  const walk = (directory) => {
    for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      const relative = directory === "" ? entry.name : `${directory}/${entry.name}`;
      if (entry.isDirectory()) walk(relative);
      else if (entry.isFile()) files.push(relative);
    }
  };
  walk("");
  return files;
}

const IMAGE_EXTENSION = /\.(?:png|jpe?g|gif|webp|svg|avif)$/i;

/**
 * The file references of a Markdown text: [{ line, text, file, ranges, module, link }], in order. They are the code
 * spans that look like a file (with line ranges, as the method asks) and the links to a file, that is a relative
 * link to something with an extension, not an image, and not a sibling of the explanation itself.
 */
export function fileReferences(markdown) {
  const references = [];
  for (const [index, line] of markdown.split("\n").entries()) {
    for (const match of line.matchAll(/\]\(([^)\s]+)\)/g)) {
      const target = match[1].replace(/[#?].*$/, "");
      if (/^[a-z][a-z0-9+.-]*:/i.test(match[1]) || target === "" || IMAGE_EXTENSION.test(target) || !LINK_FILE.test(target) || !target.includes("/")) continue;
      references.push({ line: index + 1, text: target, file: target, ranges: [], module: undefined, link: true });
    }
    const spans = [...line.matchAll(/`([^`\n]+)`/g)].map((match) => match[1].trim());
    const isRow = line.trimStart().startsWith("|");
    const module = isRow ? spans.find((span) => DIRECTORY.test(span) && !REFERENCE.test(span)) : undefined;
    for (const span of spans) {
      const match = REFERENCE.exec(span);
      if (match === null) continue;
      const ranges = (match.groups.lines ?? "")
        .split(",")
        .filter(Boolean)
        .map((range) => range.split("-").map(Number))
        .map(([start, end = start]) => [start, end]);
      references.push({ line: index + 1, text: span, file: match.groups.file, ranges, module: module?.replace(/\/$/, "") });
    }
  }
  return references;
}

/**
 * Look every reference up. A path is read from the repository root; if there is no such file, from the module of
 * its table row; a link is also read from the folder of the explanation (`documentDirectory`, from the root), and
 * with its leading "../" removed; if all of that fails, by its end, when exactly one file ends that way. Returns
 * { results: [{ ...reference, status, resolved, lines }], files, problems, claims }, a status being "found",
 * "ambiguous" (several files end that way, so the reference does not say which), "missing", or "beyond" (a range
 * past the end), and the claims being the absolute wording found in the text (absoluteClaims).
 */
export function checkExplanation(markdown, root, { files = listFiles(root), documentDirectory } = {}) {
  const known = new Set(files);
  const lineCounts = new Map();
  const countLines = (file) => {
    if (!lineCounts.has(file)) {
      const text = fs.readFileSync(path.join(root, file), "utf8");
      // A file that ends with a newline has one line fewer than the pieces split on it.
      lineCounts.set(file, text === "" ? 0 : text.split("\n").length - (text.endsWith("\n") ? 1 : 0));
    }
    return lineCounts.get(file);
  };

  const results = fileReferences(markdown).map((reference) => {
    const bare = reference.file.replace(/^(?:\.\.\/)+/, "");
    const candidates = [reference.file, bare];
    if (reference.module !== undefined) candidates.push(path.posix.normalize(path.posix.join(reference.module, reference.file)));
    if (reference.link && documentDirectory !== undefined) candidates.unshift(path.posix.normalize(path.posix.join(documentDirectory, reference.file)));
    let resolved = candidates.find((candidate) => known.has(candidate));
    let status = "found";
    if (resolved === undefined) {
      const ending = files.filter((file) => file === bare || file.endsWith(`/${path.posix.normalize(bare)}`));
      if (ending.length === 1) resolved = ending[0];
      else status = ending.length === 0 ? "missing" : "ambiguous";
    }
    let lines = null;
    if (resolved !== undefined && reference.ranges.length > 0) {
      lines = countLines(resolved);
      if (reference.ranges.some(([start, end]) => start < 1 || end < start || end > lines)) status = "beyond";
    }
    return { ...reference, status, resolved: resolved ?? null, lines };
  });

  const problems = results.filter((result) => result.status === "missing" || result.status === "beyond");
  return { results, files: files.length, problems, claims: absoluteClaims(markdown) };
}
