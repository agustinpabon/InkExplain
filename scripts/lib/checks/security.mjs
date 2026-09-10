// SEC: secrets, machine-specific paths, symlinks, and offline, shell-free tooling.

import { defineCheck } from "../check-runner.mjs";
import { excerpt } from "./support.mjs";

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
];
