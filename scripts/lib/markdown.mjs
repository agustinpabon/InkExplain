// Markdown helpers shared by checks and generators. All functions accept LF
// text (see normalizeText) and are code-fence aware where it matters: links
// and headings inside fenced code blocks are ignored.

import { normalizeText } from "./repository.mjs";
import { parseYaml } from "./yaml-lite.mjs";

const FENCE_PATTERN = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/**
 * Split text into lines tagged with whether they sit inside a fenced code block.
 * Fence delimiter lines themselves are marked `fence: true`.
 */
function classifyLines(text) {
  const lines = normalizeText(text).split("\n");
  const result = [];
  let open = null;
  for (const [index, line] of lines.entries()) {
    const fence = line.match(FENCE_PATTERN);
    if (open === null && fence) {
      open = { marker: fence[1], info: fence[2].trim() };
      result.push({ line, number: index + 1, inCode: true, fence: true, info: open.info });
    } else if (open !== null && fence && fence[1][0] === open.marker[0] && fence[1].length >= open.marker.length && fence[2].trim() === "") {
      result.push({ line, number: index + 1, inCode: true, fence: true });
      open = null;
    } else {
      result.push({ line, number: index + 1, inCode: open !== null, fence: false });
    }
  }
  return result;
}

/** Fenced code blocks with their info string and 1-based start line. */
export function extractCodeBlocks(text) {
  const blocks = [];
  let current = null;
  for (const entry of classifyLines(text)) {
    if (entry.fence && current === null) {
      current = { info: entry.info ?? "", startLine: entry.number, lines: [] };
    } else if (entry.fence && current !== null) {
      blocks.push({ info: current.info, startLine: current.startLine, content: current.lines.join("\n") });
      current = null;
    } else if (current !== null) {
      current.lines.push(entry.line);
    }
  }
  if (current !== null) {
    blocks.push({ info: current.info, startLine: current.startLine, content: current.lines.join("\n"), unterminated: true });
  }
  return blocks;
}

/**
 * Parse YAML frontmatter delimited by `---` lines at the very start of the file.
 * Returns { found, data, body, errors, bodyStartLine }.
 */
export function parseFrontmatter(text) {
  const normalized = normalizeText(text);
  if (!normalized.startsWith("---\n")) {
    return { found: false, data: {}, body: normalized, errors: [], bodyStartLine: 1 };
  }
  const closing = normalized.indexOf("\n---", 3);
  const closingLineEnd = closing === -1 ? -1 : normalized.indexOf("\n", closing + 4);
  const delimiterIsWholeLine =
    closing !== -1 && normalized.slice(closing + 4, closingLineEnd === -1 ? undefined : closingLineEnd).trim() === "";
  if (closing === -1 || !delimiterIsWholeLine) {
    return {
      found: true,
      data: {},
      body: normalized,
      errors: [{ line: 1, message: "frontmatter opening `---` has no closing `---` line" }],
      bodyStartLine: 1,
    };
  }
  const yamlText = normalized.slice(4, closing + 1);
  const { value, errors } = parseYaml(yamlText);
  const body = closingLineEnd === -1 ? "" : normalized.slice(closingLineEnd + 1);
  const bodyStartLine = normalized.slice(0, closingLineEnd === -1 ? normalized.length : closingLineEnd + 1).split("\n").length;
  return {
    found: true,
    data: value ?? {},
    body,
    errors: errors.map((entry) => ({ line: entry.line + 1, message: entry.message })),
    bodyStartLine,
  };
}

/** ATX headings outside code blocks: [{ level, text, line }]. */
export function extractHeadings(text) {
  const headings = [];
  for (const entry of classifyLines(text)) {
    if (entry.inCode) continue;
    const match = entry.line.match(/^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/);
    if (match) headings.push({ level: match[1].length, text: match[2].trim(), line: entry.number });
  }
  return headings;
}

/**
 * Body of the first section whose heading text equals `headingText` (case-insensitive),
 * up to the next heading of the same or a higher level.
 */
export function sectionBody(text, headingText) {
  const lines = normalizeText(text).split("\n");
  const headings = extractHeadings(text);
  const wanted = headingText.trim().toLowerCase();
  const start = headings.findIndex((heading) => heading.text.toLowerCase() === wanted);
  if (start === -1) return null;
  const { level, line } = headings[start];
  const next = headings.slice(start + 1).find((heading) => heading.level <= level);
  return lines.slice(line, next ? next.line - 1 : lines.length).join("\n").trim();
}

/** Mask inline code spans so link and path scans skip them. Keeps string length stable. */
function maskInlineCode(line) {
  return line.replace(/(`+)([^`]|[^`].*?[^`])\1(?!`)/g, (span) => " ".repeat(span.length));
}

/**
 * Links and images outside code: Markdown `[label](target)`, `![alt](target)`,
 * and HTML `href`/`src` attributes. Returns [{ target, line, kind }].
 */
export function extractLinks(text) {
  const links = [];
  for (const entry of classifyLines(text)) {
    if (entry.inCode) continue;
    const line = maskInlineCode(entry.line);
    for (const match of line.matchAll(/(!?)\[(?:[^\]\\]|\\.)*\]\(\s*(<[^>]*>|[^)\s]+)(?:\s+(?:"[^"]*"|'[^']*'|\([^)]*\)))?\s*\)/g)) {
      links.push({ target: match[2].replace(/^<|>$/g, ""), line: entry.number, kind: match[1] ? "image" : "link" });
    }
    for (const match of line.matchAll(/\b(href|src)\s*=\s*("([^"]*)"|'([^']*)')/gi)) {
      links.push({ target: match[3] ?? match[4], line: entry.number, kind: match[1].toLowerCase() === "src" ? "image" : "link" });
    }
  }
  return links;
}

export function isExternalTarget(target) {
  return /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("//");
}

/** Split `path#anchor?query` into its parts, decoding percent-escapes in the path. */
export function splitTarget(target) {
  const hashIndex = target.indexOf("#");
  const withoutHash = hashIndex === -1 ? target : target.slice(0, hashIndex);
  const anchor = hashIndex === -1 ? "" : target.slice(hashIndex + 1);
  const pathPart = withoutHash.split("?")[0];
  let decoded = pathPart;
  try {
    decoded = decodeURIComponent(pathPart);
  } catch {
    // Keep the raw path; the caller reports it as unresolvable.
  }
  return { path: decoded, anchor };
}

/** GitHub-style heading anchor slug. */
function headingSlug(headingText) {
  return headingText
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[`*~]/g, "")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s/g, "-");
}

/** All anchors a document exposes, including GitHub's -1, -2 suffixes for duplicates. */
export function headingAnchors(text) {
  const counts = new Map();
  const anchors = new Set();
  for (const heading of extractHeadings(text)) {
    const slug = headingSlug(heading.text);
    const seen = counts.get(slug) ?? 0;
    anchors.add(seen === 0 ? slug : `${slug}-${seen}`);
    counts.set(slug, seen + 1);
  }
  return anchors;
}

function regionMarkers(name) {
  return { start: `<!-- inkexplain:${name}:start -->`, end: `<!-- inkexplain:${name}:end -->` };
}

/** Locate a generated region. Returns { found, content, errors }. */
export function readRegion(text, name) {
  const { start, end } = regionMarkers(name);
  const startIndex = text.indexOf(start);
  const endIndex = text.indexOf(end);
  const errors = [];
  if (startIndex === -1 && endIndex === -1) return { found: false, content: "", errors };
  if (startIndex === -1) errors.push(`missing ${start}`);
  if (endIndex === -1) errors.push(`missing ${end}`);
  if (startIndex !== -1 && text.indexOf(start, startIndex + start.length) !== -1) errors.push(`duplicate ${start}`);
  if (startIndex !== -1 && endIndex !== -1 && endIndex < startIndex) errors.push(`${end} appears before ${start}`);
  if (errors.length > 0) return { found: true, content: "", errors };
  return { found: true, content: text.slice(startIndex + start.length, endIndex).replace(/^\n|\n$/g, ""), errors };
}

/** Replace the content of an existing generated region. Throws if the region is malformed. */
export function replaceRegion(text, name, content) {
  const region = readRegion(text, name);
  if (!region.found) throw new Error(`region ${name} not found`);
  if (region.errors.length > 0) throw new Error(region.errors.join("; "));
  const { start, end } = regionMarkers(name);
  const startIndex = text.indexOf(start) + start.length;
  const endIndex = text.indexOf(end);
  return `${text.slice(0, startIndex)}\n${content}\n${text.slice(endIndex)}`;
}

/** Line ranges (1-based, inclusive) covered by a region, for scans that honor regions. */
export function regionLineRanges(text, name) {
  const { start, end } = regionMarkers(name);
  const ranges = [];
  const lines = normalizeText(text).split("\n");
  let open = null;
  for (const [index, line] of lines.entries()) {
    if (line.includes(start)) open = index + 1;
    if (line.includes(end) && open !== null) {
      ranges.push([open, index + 1]);
      open = null;
    }
  }
  return ranges;
}

// [stage] initial markdown parser
