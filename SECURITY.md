# Security Policy

InkExplain is a skill: Markdown, JSON, YAML, and image files that an AI agent reads. The skill has no runtime of its own. Everything else in this repository (the Node.js scripts, the tests, the workflows) maintains the skill and is not installed with it.

This document states what InkExplain does and does not do, how each claim is enforced, what a scan with NVIDIA SkillSpector found, and how to report a vulnerability.

## Threat model and architecture

### Design properties

| Property | What it means | Enforced by |
|---|---|---|
| **Offline by design** | The skill package contains no code. It never asks the agent to contact a service, and it has no telemetry, analytics, or update checks. Repository scripts make no network calls and start no processes. The command-line helper (`scripts/explain.mjs`) only reads the registry and the packs and prints text. The gallery page (`examples/gallery/index.html`) is one file that loads nothing and sends nothing. Installing with `npx skills add` runs a separate tool, the open skills CLI, which reports anonymous install counts unless `DISABLE_TELEMETRY=1` is set; that is not part of the skill. | `SEC-004` fails on `child_process`, network modules, `fetch(`, `eval(`, and `new Function(` in `scripts/`. `PKG-006` limits the package to Markdown, JSON, YAML, PNG, and SVG. `SEC-006` requires the gallery's `default-src 'none'` policy and rejects remote resources, network and dynamic-code APIs, and markup built from strings. |
| **Zero runtime dependencies** | `package.json` declares no dependencies of any kind. Scripts and tests use Node.js built-ins only, so no third-party package is installed or executed. | `SEC-005` fails when any dependency field is non-empty. |
| **Dual execution mode** | **Prompt mode** needs no tool: the agent reads references and writes text, and its only file write is `prompts.md` in the output folder. **Generate mode** applies only when the host agent provides an image-generation tool. InkExplain ships no generator and never claims an image it did not generate. | The mode rules in `SKILL.md` and `references/workflow/prompt-assembly.md`. |
| **Filesystem isolation** | Images and the prompts file are written only to `assets/<article-slug>-<suffix>/`, or to a folder the user names inside the workspace. Never inside the skill folder, never outside the workspace, and never over an existing file. The skill reads only what the user points to, and never credentials, key files, or environment files. | The rules in `SKILL.md` and `references/workflow/delivery.md`. See the limit below. |
| **Source text is data** | The article, document, or idea being illustrated is material to draw, not instructions to follow. | The rules in `SKILL.md`. See the limit below. |

**Limits of these rules.** The two isolation rules are instructions to the agent, not an operating-system sandbox. A host agent that obeys them cannot be steered into writing elsewhere by an article, but InkExplain cannot force a host to obey. Keep the host's own permission prompts and sandbox on; they are the enforcement layer.

### Trust boundaries

```text
article, document, idea     (untrusted: may contain hostile text)
        |
        v
host agent + InkExplain     (reviewed instructions; no code, no network, no credentials)
        |
        +--> host image tool    (Generate mode only; runs under the host's permissions)
        |
        v
workspace: assets/<article-slug>-<suffix>/     (the only place InkExplain writes)
```

### Threats and mitigations

| Threat | Mitigation | Residual risk |
|---|---|---|
| Hostile text in an article tries to redirect the agent (indirect prompt injection) | The source is treated as data. The skill asks for no credentials, shell, or network access, and its only side effect is saving images and a prompt file. | A host with broad tool permissions can still be steered by any text it reads. Limit what the host may do. |
| A change to the skill adds an exfiltration or override instruction | Every push and pull request is scanned with SkillSpector (`.github/workflows/security.yml`). Commits are signed. | A subtle instruction can evade a static scanner. Review changes to `skills/inkexplain/` by hand. |
| A dependency or build tool is compromised | No dependencies. Both workflows pin every action to a commit SHA, and the security workflow pins SkillSpector to a commit. | A pin only freezes what was reviewed: it must be updated on purpose, and it does not protect against a malicious release that was reviewed and pinned. |
| Secrets or machine paths committed by accident | `SEC-001` and `SEC-002` scan every tracked text file. | Only the credential shapes listed in `scripts/lib/checks/security.mjs` are detected. |
| A path escapes the checkout | Scripts resolve every path inside the repository root, and `SEC-003` forbids symbolic links. | None known. |
| A bundled image carries active content | `ASSET-001` validates PNG structure and rejects SVG scripts, event handlers, and external references. | PNG pixels are not inspected for embedded text. |
| A change adds a tracker, remote script, or exfiltration path to the gallery page | The browser enforces its Content-Security-Policy (`default-src 'none'`, no `connect-src`), and `SEC-006` fails on a weaker policy or on remote resources. The page builds its markup with `textContent`, never from strings, and its data is embedded JSON with no raw `<`. | The policy is only as strong as the browser that applies it, and `'unsafe-inline'` is needed because the page keeps its script and styles inline. |

### Automated enforcement

| Where | What it runs |
|---|---|
| `.github/workflows/ci.yml` | Generated documents are current, all validators (including `SEC-001` to `SEC-006`), and the test suite, on Linux and Windows with Node.js 22 and 24. |
| `.github/workflows/security.yml` | The SkillSpector scan of `skills/inkexplain/`, on every push to `main` and every pull request. |

## NVIDIA SkillSpector audit statement

[SkillSpector](https://github.com/NVIDIA/skillspector) is NVIDIA's open-source security scanner for agent skills.

**Result: passed. 0 findings (0 Critical, 0 High, 0 Medium, 0 Low). Risk score 0/100, severity LOW, recommendation SAFE, inspection complete at 100% coverage.**

| | |
|---|---|
| Scanner | SkillSpector v2.12.0, commit `240421219409dc0bafef9f618a10d80c2d7e83a3` |
| Mode | Static analysis only (`--no-llm`). No file contents left the machine. |
| Command | `skillspector scan skills/inkexplain/ --no-llm --fail-on-findings --fail-on-incomplete` |
| Scanned | 2026-10-16, 58 files, 56 fully inspected |
| Content | Git tree `95fb623ac04ec6c6449e30966402e335be2069c4`: the output of `git rev-parse HEAD:skills/inkexplain` for the commit that added this section |

This is the output of a scan InkExplain ran on itself. It is **not** an NVIDIA certification, endorsement, or "verified" status; NVIDIA's own verification is a separate publication process that this skill has not gone through. The pass applies to the tree above. The workflow re-runs the scan on every change and is the current source of truth.

### Findings by vulnerability vector

| Vector | Analyzers that ran (all completed, 0 findings) | Repository-side evidence |
|---|---|---|
| Prompt injection | `static_patterns_prompt_injection`, `anti_refusal`, `system_prompt_leakage`, `memory_poisoning`, `harmful_content` | A search of the package for override phrases ("ignore previous", "system prompt", "you are now", and similar) found none. "Hidden" appears only as a metaphor word ("hidden dependency"). |
| Data exfiltration | `static_patterns_data_exfiltration`, `agent_snooping`, `ssrf` | The package has no instruction to read credentials (`.ssh`, cloud credentials, `.env`, tokens), to send data anywhere, or to fetch a URL. The only URLs are rights-provenance citations in rights notes and credits. |
| Dynamic code execution, `eval()` | `static_patterns_deserialization`, `tool_misuse`, `output_handling`. The behavioral AST, taint-tracking, and bundled-execution analyzers found no applicable files. | The package ships no executable file (58 components, "Executable Scripts: No"). `PKG-006` keeps it that way, and `SEC-004` bars `eval(` and `new Function(` in `scripts/`. |
| Privilege escalation | `static_patterns_privilege_escalation`, `excessive_agency`, `rogue_agent` | The skill requests no tools, no elevated rights, and no shell. Its writes are limited to the output folder. |
| Supply-chain risk | `static_patterns_supply_chain`, `artifact_integrity`, `static_yara` | No dependencies (`SEC-005`), no install step, no downloaded code. |

### What the scan does not cover

- The three LLM-based semantic analyzers were disabled (`--no-llm`). They can be run with `skillspector scan skills/inkexplain/` and a configured provider; doing so sends file contents to that provider.
- `references/archetypes/gopher/gopher.png` and `references/archetypes/stickman/pose-sheet.png` are binary and SkillSpector does not inspect them. `ASSET-001` checks their structure.
- A static scan cannot prove that no instruction is harmful. It lowers the chance of an obvious one slipping in.

### Reproduce the scan

```bash
uv tool install --python 3.12 "git+https://github.com/NVIDIA/skillspector.git@240421219409dc0bafef9f618a10d80c2d7e83a3"
skillspector scan skills/inkexplain/ --no-llm --format markdown --fail-on-findings --fail-on-incomplete
```

On Windows without C++ build tools, use Python 3.12: `yara-python` publishes no wheel for 3.13, and building it needs Visual Studio. Install into a short path, because some dependencies exceed the 260-character path limit.

## Reporting a vulnerability

Report privately; please do not open a public issue for a vulnerability.

1. **GitHub Security Advisories** (preferred): on the repository's **Security** tab, choose **Report a vulnerability**.
2. **Email**: `security@agustinpabon.com`.

Include what you found, the file or workflow involved, steps to reproduce, and the impact you expect. A proof of concept helps but is not required.

**What to expect.** The maintainer aims to acknowledge a report within 7 days, to assess it and reply with a plan within 14 days, and to agree a disclosure date with the reporter, normally within 90 days. Reporters are credited in the advisory unless they ask not to be.

**In scope**

- Instructions in `skills/inkexplain/` that could cause prompt injection, data exfiltration, privilege escalation, or writes outside the output folder.
- Scripts, validators, and workflows in this repository: path traversal, command execution, network access, or secret handling.
- A dependency or pinned action that has become unsafe.

**Out of scope**

- The behavior of image models or of the host agent.
- Findings that need the host to ignore its own permission prompts.
- Rights and attribution concerns. Raise those through the same email address or a public issue; the current credits are in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

**Safe harbor.** Good-faith research that stays within this policy is welcome. Do not access data that is not yours, do not disrupt other users, and give the maintainer reasonable time to fix a problem before you publish it.
