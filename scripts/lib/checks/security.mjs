// SEC: secrets, machine-specific paths, symlinks, and offline, shell-free tooling.

import { defineCheck } from "../check-runner.mjs";
import { DOC_REGIONS, PATHS } from "../config.mjs";
import { readRegion, regionMarkers } from "../markdown.mjs";
import { excerpt, lineAt } from "./support.mjs";

// Credential shapes from widely used providers. Each match is reported with
// its location only; the matched value is never echoed.
const SECRET_PATTERNS = Object.freeze([
  { label: "GitHub token", pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{22,})\b/ },
  { label: "AWS access key id", pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  { label: "private key block", pattern: /-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/ },
  { label: "OpenAI or Anthropic API key", pattern: /\bsk-(?:ant-|proj-)?[A-Za-z0-9_-]{24,}\b/ },
  { label: "Slack token", pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/ },
  { label: "Google API key", pattern: /\bAIza[0-9A-Za-z_-]{35}\b/ },
]);

// Absolute paths from someone's machine leak usernames and never resolve elsewhere.
const LOCAL_PATH_PATTERN = /(?<![\w.~$-])\/(?:Users|home)\/[A-Za-z0-9._-]+\/|\b[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/]/;

// Validation and generation scripts must not reach the network or run shells.
const FORBIDDEN_TOOLING_APIS = Object.freeze([
  { label: "child process execution", pattern: /\bchild_process\b/ },
  { label: "network access", pattern: /\bnode:(?:https?|http2|net|tls|dgram)\b|\bfetch\s*\(/ },
  { label: "dynamic code evaluation", pattern: /\beval\s*\(|\bnew\s+Function\s*\(/ },
]);

// package.json fields through which a package registry could put third-party code
// into this repository. Tooling and tests use Node.js built-ins only.
const DEPENDENCY_FIELDS = Object.freeze([
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
  "bundleDependencies",
  "bundledDependencies",
]);

// The offline gallery is one self-contained page: it may load nothing, send nothing,
// and build no code or markup from strings. The browser enforces the first two through
// its Content-Security-Policy; these patterns keep the page source honest about all three.
const GALLERY_SOURCES = new Set(["'none'", "'self'", "'unsafe-inline'", "file:", "data:"]);
const GALLERY_MARKUP = Object.freeze([
  { label: "an external script", pattern: /<script\b[^>]*\bsrc\s*=/gi },
  { label: "a frame, object, or embed", pattern: /<(?:iframe|frame|object|embed|applet)\b/gi },
  { label: "a form", pattern: /<form\b/gi },
  { label: "a base element", pattern: /<base\b/gi },
  { label: "a refresh redirect", pattern: /<meta\b[^>]*http-equiv\s*=\s*["']?refresh/gi },
  { label: "a CSS @import", pattern: /@import\b/gi },
  { label: "a CSS url() that points at the network", pattern: /url\(\s*["']?\s*(?:(?:https?|wss?|ftp):)?\/\//gi },
]);
const GALLERY_CODE = Object.freeze([
  { label: "network access", pattern: /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bEventSource\b|\bsendBeacon\b|\bimportScripts\b/g },
  { label: "a worker or service worker", pattern: /\bnew\s+(?:Shared)?Worker\b|\bserviceWorker\b/g },
  { label: "dynamic code evaluation", pattern: /\beval\s*\(|\bnew\s+Function\s*\(|\bimport\s*\(/g },
  { label: "HTML built from strings", pattern: /\binnerHTML\b|\bouterHTML\b|\binsertAdjacentHTML\b|\bdocument\.write\b/g },
]);
const URL_ATTRIBUTE = /\b(?:src|href|action|formaction|poster|srcset|ping|data)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>"']+))/gi;
const NETWORK_URL = /^\s*(?:(?:https?|wss?|ftp):|\/\/)/i;
const DATA_BLOCK = /^<script type="application\/json" id="inkexplain-data">[^<]*<\/script>$/;

/** Problems with the page's Content-Security-Policy meta tag. */
function policyProblems(html) {
  const meta = /<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i.exec(html);
  if (meta === null) return ["has no Content-Security-Policy meta tag"];
  const content = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(meta[0]);
  const problems = [];
  let defaultSources = null;
  for (const directive of (content?.[1] ?? content?.[2] ?? "").split(";")) {
    const [name, ...sources] = directive.trim().split(/\s+/);
    if (!name) continue;
    if (name.toLowerCase() === "default-src") defaultSources = sources;
    if (name.toLowerCase() === "connect-src" && !(sources.length === 1 && sources[0] === "'none'")) {
      problems.push("connect-src must be 'none' or absent");
    }
    for (const source of sources) {
      if (!GALLERY_SOURCES.has(source.toLowerCase())) problems.push(`allows ${JSON.stringify(source)} in ${name}`);
    }
  }
  if (defaultSources === null || defaultSources.length !== 1 || defaultSources[0] !== "'none'") {
    problems.unshift("default-src must be 'none'");
  }
  return problems;
}

/** The page with its generated data block blanked out, keeping every offset and line number. */
function maskDataBlock(html) {
  const { start, end } = regionMarkers(DOC_REGIONS.galleryData);
  const from = html.indexOf(start);
  const to = html.indexOf(end);
  if (from === -1 || to === -1 || to < from) return html;
  const inner = html.slice(from + start.length, to).replace(/[^\n]/g, " ");
  return html.slice(0, from + start.length) + inner + html.slice(to);
}

function hasEntries(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (value !== null && typeof value === "object") return Object.keys(value).length > 0;
  return value === true;
}

export const securityChecks = [
  defineCheck({
    id: "SEC-001",
    area: "SEC",
    title: "no credentials in text files",
    run({ repo }) {
      const issues = [];
      for (const file of repo.textFiles()) {
        const lines = repo.readText(file).split("\n");
        for (const [index, line] of lines.entries()) {
          for (const { label, pattern } of SECRET_PATTERNS) {
            if (pattern.test(line)) issues.push({ path: file, line: index + 1, message: `possible ${label}; remove it and rotate it` });
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "SEC-002",
    area: "SEC",
    title: "no absolute paths from a local machine",
    run({ repo }) {
      const issues = [];
      for (const file of repo.textFiles()) {
        for (const [index, line] of repo.readText(file).split("\n").entries()) {
          if (LOCAL_PATH_PATTERN.test(line)) issues.push({ path: file, line: index + 1, message: `machine-specific path: ${excerpt(line, 80)}` });
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "SEC-003",
    area: "SEC",
    title: "no symbolic links in the repository",
    run({ repo }) {
      return repo
        .walk("", { includeSymlinks: true })
        .filter((file) => repo.isSymlink(file))
        .map((file) => ({ path: file, message: "symbolic links can point outside the checkout and break skill installs" }));
    },
  }),

  defineCheck({
    id: "SEC-004",
    area: "SEC",
    title: "repository scripts stay offline and shell-free",
    run({ repo }) {
      const issues = [];
      // This file defines the forbidden patterns, so it is the one script that names them.
      const scripts = repo.walk("scripts").filter((file) => file.endsWith(".mjs") && file !== "scripts/lib/checks/security.mjs");
      for (const file of scripts) {
        for (const [index, line] of repo.readText(file).split("\n").entries()) {
          if (/^\s*(?:\/\/|\*)/.test(line)) continue;
          for (const { label, pattern } of FORBIDDEN_TOOLING_APIS) {
            if (pattern.test(line)) {
              issues.push({ path: file, line: index + 1, message: `${label} is not allowed in repository scripts` });
            }
          }
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "SEC-005",
    area: "SEC",
    title: "package.json declares no dependencies",
    run({ repo }) {
      // A missing or malformed manifest is reported by BRAND-002; this check only reads a valid one.
      const text = repo.readTextIfExists(PATHS.packageJson);
      if (text === null) return [];
      let manifest;
      try {
        manifest = JSON.parse(text);
      } catch {
        return [];
      }
      return DEPENDENCY_FIELDS.filter((field) => hasEntries(manifest?.[field])).map((field) => ({
        path: PATHS.packageJson,
        message: `${field} must stay empty: InkExplain tooling uses Node.js built-ins only`,
      }));
    },
  }),

  defineCheck({
    id: "SEC-006",
    area: "SEC",
    title: "the offline gallery loads nothing and sends nothing",
    run({ repo }) {
      // A missing page is reported by DOC-003, which regenerates it.
      const html = repo.readTextIfExists(PATHS.galleryPage);
      if (html === null) return [];
      const file = PATHS.galleryPage;
      const issues = policyProblems(html).map((message) => ({ path: file, message }));

      const region = readRegion(html, DOC_REGIONS.galleryData);
      if (region.found && region.errors.length === 0 && !DATA_BLOCK.test(region.content.trim())) {
        issues.push({ path: file, message: 'the generated data block must be one JSON script with no raw "<"' });
      }

      const page = maskDataBlock(html);
      for (const { label, pattern } of [...GALLERY_MARKUP, ...GALLERY_CODE]) {
        for (const match of page.matchAll(pattern)) {
          issues.push({ path: file, line: lineAt(page, match.index), message: `${label} is not allowed in the gallery` });
        }
      }
      for (const match of page.matchAll(URL_ATTRIBUTE)) {
        const value = match[1] ?? match[2] ?? match[3] ?? "";
        if (NETWORK_URL.test(value)) {
          issues.push({ path: file, line: lineAt(page, match.index), message: `${match[0].split("=")[0].trim()} points at the network: ${value}` });
        }
      }
      return issues;
    },
  }),
];
