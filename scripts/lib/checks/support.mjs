// Small helpers shared by check modules.

import path from "node:path";
import { PATHS } from "../config.mjs";
import { regionLineRanges } from "../markdown.mjs";

/** 1-based line number of a character offset. */
export function lineAt(text, offset) {
  let line = 1;
  for (let index = 0; index < offset && index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) line += 1;
  }
  return line;
}

/** First line (1-based) containing `needle`, or undefined. */
export function lineOf(text, needle) {
  const offset = text.indexOf(needle);
  return offset === -1 ? undefined : lineAt(text, offset);
}

export function includesFolded(text, needle) {
  return text.toLowerCase().includes(needle.toLowerCase());
}

/** README.md plus every localized README present on disk, sorted. */
export function readmeFiles(repo) {
  const localized = repo
    .entries(PATHS.localizedReadmeDir)
    .filter((entry) => entry.type === "file" && /^README\.[A-Za-z-]+\.md$/.test(entry.name))
    .map((entry) => entry.path);
  return [PATHS.readme, ...localized].filter((file) => repo.isFile(file));
}

/** Markdown files outside the skill package (repository documentation). */
export function repositoryMarkdownFiles(repo) {
  return repo
    .walk()
    .filter((file) => file.endsWith(".md") && !file.startsWith(`${PATHS.packageDir}/`));
}

/** Markdown files inside the skill package. */
export function packageMarkdownFiles(repo) {
  return repo.walk(PATHS.packageDir).filter((file) => file.endsWith(".md"));
}

/** Predicate telling whether a 1-based line falls inside any region with the given name. */
export function regionMembership(text, regionName) {
  const ranges = regionLineRanges(text, regionName);
  return (line) => ranges.some(([start, end]) => line >= start && line <= end);
}

/** Resolve a Markdown link target (already split from its anchor) against the linking file. */
export function resolveLinkTarget(fromFile, targetPath) {
  if (targetPath === "") return fromFile;
  const base = targetPath.startsWith("/") ? targetPath.slice(1) : path.posix.join(path.posix.dirname(fromFile), targetPath);
  return path.posix.normalize(base).replace(/\/+$/, "");
}

export function excerpt(line, max = 120) {
  const trimmed = line.trim();
  return trimmed.length > max ? `${trimmed.slice(0, max - 1)}…` : trimmed;
}

/**
 * The words of `line` around `index`, so a message shows what it found without cutting a
 * word in half. A line that fits is returned whole.
 */
export function excerptAround(line, index, { before = 60, after = 80 } = {}) {
  let start = Math.max(0, index - before);
  if (start > 0) {
    const space = line.indexOf(" ", start);
    if (space !== -1 && space <= index) start = space + 1;
  }
  let end = Math.min(line.length, index + after);
  if (end < line.length) {
    const space = line.lastIndexOf(" ", end);
    if (space > index) end = space;
  }
  return `${start > 0 ? "…" : ""}${line.slice(start, end).trim()}${end < line.length ? "…" : ""}`;
}
