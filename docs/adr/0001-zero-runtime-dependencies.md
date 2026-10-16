# ADR 0001: Zero Runtime Dependencies Architecture

## Status
Accepted

## Context
AI Agent skills operate within untrusted or highly privileged host agent environments (Claude Code, Cursor, Codex). Introducing external npm dependencies expands the supply-chain attack surface, complicates offline installation, and introduces risks of transitive dependency vulnerabilities.

## Decision
InkExplain mandates a strict **zero-dependency policy** for all runtime tools, CLI helpers, and test runners:
- Rely strictly on Node.js built-in modules (`node:fs`, `node:path`, `node:util`, `node:test`, `node:assert`).
- All scripts stay 100% offline (no `fetch()`, no HTTP requests, no child process shells).
- Enforced automatically in CI via validator check `SEC-005`.

## Consequences
- **Positive:** Zero supply-chain vulnerability risk; 100% offline reproducibility; instant execution without `npm install`.
- **Negative:** Utility routines (like YAML parsing and image header inspection) must be implemented with lean, custom Node built-ins.
