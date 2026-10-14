// Read-only, root-anchored view of a repository checkout.
//
// Every path that enters this module is repository-relative and POSIX-style.
// Paths that are absolute or escape the root are rejected, so data from
// registry.json or Markdown links can never make a check read outside the
// checkout. Directory walks never follow symbolic links.

import fs from "node:fs";
import path from "node:path";
import { IGNORED_DIRECTORIES, TEXT_EXTENSIONS, TEXT_FILENAMES } from "./config.mjs";

export class PathError extends Error {}

/** Normalize line endings and drop a UTF-8 byte-order mark. */
export function normalizeText(text) {
  return text.replace(/^﻿/, "").replace(/\r\n?/g, "\n");
}

/**
 * Validate and normalize a repository-relative POSIX path.
 * Rejects absolute paths, drive letters, backslashes, NUL bytes, and `..` escapes.
 */
export function normalizeRelativePath(relativePath) {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    throw new PathError("expected a non-empty relative path");
  }
  if (relativePath.includes("\0")) throw new PathError(`${JSON.stringify(relativePath)} contains a NUL byte`);
  if (relativePath.includes("\\")) throw new PathError(`${relativePath} must use forward slashes`);
  if (relativePath.startsWith("/") || /^[A-Za-z]:/.test(relativePath)) {
    throw new PathError(`${relativePath} must be relative to the repository root`);
  }
  const normalized = path.posix.normalize(relativePath).replace(/\/+$/, "");
  if (normalized === ".." || normalized.startsWith("../")) {
    throw new PathError(`${relativePath} escapes the repository root`);
  }
  return normalized === "." ? "" : normalized;
}

/** True when `child` (relative) stays inside `parent` (relative). */
export function isWithin(parent, child) {
  const relative = path.posix.relative(parent || ".", child || ".");
  return relative === "" || (!relative.startsWith("../") && relative !== ".." && !path.posix.isAbsolute(relative));
}

function isTextPath(relativePath) {
  const base = path.posix.basename(relativePath);
  return TEXT_FILENAMES.includes(base) || TEXT_EXTENSIONS.includes(path.posix.extname(base).toLowerCase());
}

export class Repository {
  #textCache = new Map();
  #statCache = new Map();

  constructor(root) {
    this.root = path.resolve(root);
  }

  /** Absolute OS path for a repository-relative path, guaranteed inside the root. */
  resolve(relativePath) {
    const normalized = normalizeRelativePath(relativePath);
    const absolute = path.resolve(this.root, normalized);
    const back = path.relative(this.root, absolute);
    if (back.startsWith("..") || path.isAbsolute(back)) {
      throw new PathError(`${relativePath} escapes the repository root`);
    }
    return absolute;
  }

  #lstat(relativePath) {
    const key = normalizeRelativePath(relativePath);
    if (!this.#statCache.has(key)) {
      let stat = null;
      try {
        stat = fs.lstatSync(this.resolve(key));
      } catch (error) {
        if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
      }
      this.#statCache.set(key, stat);
    }
    return this.#statCache.get(key);
  }

  exists(relativePath) {
    return this.#lstat(relativePath) !== null;
  }

  isFile(relativePath) {
    return this.#lstat(relativePath)?.isFile() ?? false;
  }

  isDirectory(relativePath) {
    return this.#lstat(relativePath)?.isDirectory() ?? false;
  }

  isSymlink(relativePath) {
    return this.#lstat(relativePath)?.isSymbolicLink() ?? false;
  }

  size(relativePath) {
    return this.#lstat(relativePath)?.size ?? 0;
  }

  /** UTF-8 text with LF line endings. Throws a descriptive error for missing files. */
  readText(relativePath) {
    const key = normalizeRelativePath(relativePath);
    if (!this.#textCache.has(key)) {
      if (!this.isFile(key)) throw new PathError(`${key} is missing`);
      this.#textCache.set(key, normalizeText(fs.readFileSync(this.resolve(key), "utf8")));
    }
    return this.#textCache.get(key);
  }

  /** Like readText, but returns null instead of throwing when the file is absent. */
  readTextIfExists(relativePath) {
    return this.isFile(relativePath) ? this.readText(relativePath) : null;
  }

  readBuffer(relativePath) {
    const key = normalizeRelativePath(relativePath);
    if (!this.isFile(key)) throw new PathError(`${key} is missing`);
    return fs.readFileSync(this.resolve(key));
  }

  /**
   * Sorted entries of a directory. Each entry is { name, path, type } where type is
   * "file", "directory", or "symlink". Missing directories yield an empty list.
   */
  entries(relativeDir = "") {
    const key = relativeDir === "" ? "" : normalizeRelativePath(relativeDir);
    if (key !== "" && !this.isDirectory(key)) return [];
    return fs
      .readdirSync(key === "" ? this.root : this.resolve(key), { withFileTypes: true })
      .map((dirent) => ({
        name: dirent.name,
        path: key === "" ? dirent.name : `${key}/${dirent.name}`,
        type: dirent.isSymbolicLink() ? "symlink" : dirent.isDirectory() ? "directory" : dirent.isFile() ? "file" : "other",
      }))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  }

  /**
   * Deterministic recursive walk. Returns relative paths of files (and symlinks,
   * flagged separately) without following links or entering ignored directories.
   */
  walk(relativeDir = "", { includeSymlinks = false } = {}) {
    const files = [];
    const visit = (dir) => {
      for (const entry of this.entries(dir)) {
        if (entry.type === "directory") {
          if (IGNORED_DIRECTORIES.includes(entry.name)) continue;
          visit(entry.path);
        } else if (entry.type === "file" || (includeSymlinks && entry.type === "symlink")) {
          files.push(entry.path);
        }
      }
    };
    visit(relativeDir === "" ? "" : normalizeRelativePath(relativeDir));
    return files;
  }

  /** All text files in the repository, sorted. */
  textFiles(relativeDir = "") {
    return this.walk(relativeDir).filter(isTextPath);
  }
}
