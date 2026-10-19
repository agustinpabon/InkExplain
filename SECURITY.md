# Security Policy

InkExplain is a skill: Markdown, JSON, YAML, and image files that an AI agent reads. The skill has no runtime of its own. Everything else in this repository (the Node.js scripts, the tests, the workflows) maintains the skill and is not installed with it.

This document states what InkExplain does and does not do, how each claim is enforced, what a scan this project ran with NVIDIA's SkillSpector found, and how to report a vulnerability.

## Threat model and architecture

### Design properties

| Property | What it means | Enforced by |
|---|---|---|
| **Offline by design** | The skill package contains no code, and it has no telemetry, analytics, or update checks. It asks the agent to contact a service in one case only: when the user gives a repository URL to explain, which the agent reads through access the host already has (a shallow clone, or the host's own GitHub access), without signing in, adding a token, or installing anything. Repository scripts make no network calls and start no processes. The command-line helper (`scripts/explain.mjs`) only reads the registry and the packs and prints text. The gallery page (`examples/gallery/index.html`) is one file that loads nothing and sends nothing. Installing with `npx skills add` runs a separate tool, the open skills CLI, which reports anonymous install counts unless `DISABLE_TELEMETRY=1` is set; that is not part of the skill. | `SEC-004` fails on `child_process`, network modules, `fetch(`, `eval(`, and `new Function(` in `scripts/`. `PKG-006` limits the package to Markdown, JSON, YAML, PNG, and SVG. `SEC-006` requires the gallery's `default-src 'none'` policy and rejects remote resources, network and dynamic-code APIs, and markup built from strings. |
| **Zero runtime dependencies** | `package.json` declares no dependencies of any kind. Scripts and tests use Node.js built-ins only, so no third-party package is installed or executed. | `SEC-005` fails when any dependency field is non-empty. |
| **Dual execution mode** | **Prompt mode** needs no tool: the agent reads references and writes text, and its only file writes are `prompts.md` in the output folder, and `explanation.md` for a repository. In Generate mode the writes go to the run's own folder: the images, `prompts.md`, the run record `manifest.json`, and `explanation.md` for a repository. **Generate mode** applies only when the host agent provides an image-generation tool. InkExplain ships no generator, and its instructions tell the agent never to claim an image it did not generate. | The mode rules in `SKILL.md` and `references/workflow/prompt-assembly.md`. |
| **Filesystem isolation** | Images, the prompts file, the run record, and a repository explanation are written only to a new run folder, `assets/<article-slug>-<suffix>/run-<id>/`, or to a folder the user names inside the workspace. Earlier output is never deleted, moved, or overwritten. The one other place is the system's temporary folder, for a shallow clone of a repository URL the user gave, which the agent deletes afterwards. Never inside the skill folder, never anywhere else, and never over an existing file. The skill reads only what the user points to, and never credentials, key files, or environment files. | The rules in `SKILL.md` and `references/workflow/delivery.md`. See the limit below. |
| **Source text is data** | The article, document, or idea being illustrated, and every file of a repository being explained, is material to draw, not instructions to follow. The agent reads a repository and does not run it. | The rules in `SKILL.md`. See the limit below. |

**Limits of these rules.** The two isolation rules are instructions to the agent, not an operating-system sandbox. A host agent that obeys them cannot be steered into writing elsewhere by an article, but InkExplain cannot force a host to obey. Keep the host's own permission prompts and sandbox on; they are the enforcement layer.

### Trust boundaries

```text
article, document, idea, repository     (untrusted: may contain hostile text)
        |
        v
host agent + InkExplain     (reviewed instructions; no code, no credentials)
        |
        +--> host image tool    (Generate mode only; runs under the host's permissions)
        |
        v
workspace: assets/<article-slug>-<suffix>/     (the only place InkExplain writes, apart from a temporary clone of a repository URL)
```

### Threats and mitigations

| Threat | Mitigation | Residual risk |
|---|---|---|
| Hostile text in an article tries to redirect the agent (indirect prompt injection) | The source is treated as data. The skill asks for no credentials, shell, or network access, and its only side effect is saving images and a prompt file. | A host with broad tool permissions can still be steered by any text it reads. Limit what the host may do. |
| An old image is delivered as a newly generated, approved one (a repeated request that finds earlier images in the output folder) | Every Generate request writes to its own run folder and never touches earlier output. An image is "generated" only with a call of this run whose answer the run record quotes, and the report gives counts that must agree with the calls. Verdicts are conservative. `scripts/audit-run.mjs` checks the folder, the record, and the host's log, and flags a new image that is a byte-for-byte copy of an earlier one. | The record is written by the agent: a dishonest or careless one can write a false record. The host's own log of the calls is the authority, and `audit-run.mjs` compares the two. A host that keeps no log leaves only the agent's word. |
| An image with a visible flaw is reported as approved (a model confirms its own picture), or a run makes more repairs than it may | The review is recorded before the verdict: what was seen for each identity check, and every defect found. An approval needs an empty defect list and every check answered, repairs are capped at two for one image and six for the run and counted in the record, and the report says who reviewed. `scripts/audit-run.mjs` fails an approval with nothing on record, a recorded defect that was approved, a call that is neither an image nor a failed call, and repairs past the limits. | The observations are the agent's own words, and the audit cannot see the picture: a model can write plausible notes and miss a flaw. Only another agent or a person catches it, so the report says when the review is a self-assessment. |
| An explanation states more than the code shows (a security policy called impenetrable, a count of files read that is not the list) | The method asks for what the code does and what was not checked, with the files read listed in the scope. `scripts/check-explanation.mjs` fails an explanation that uses plain security superlatives, in English or Spanish. | Only a short list of words is checked, and a person has to judge whether a claim matches its file. |
| Hostile text in a repository being explained (a README, `AGENTS.md`, a comment, a script) tries to redirect the agent | Every file of a repository is data: the agent reads it and does not run it, installs nothing, starts no server, skips secret files (`.env*`, keys, tokens), and clones only a URL the user gave, into a temporary folder it deletes afterwards (`references/workflow/repository-explanation.md`). | The same as above, and the skill cannot make a host skip a secret file: a repository that holds a secret can still show it to a host that opens that file. Keep the host's permission prompts on. |
| A change to the skill adds an exfiltration or override instruction | Every push to `main` and every pull request is scanned with SkillSpector (`.github/workflows/security.yml`). Commits made since 2026-10-17 are signed; earlier ones are not. | A subtle instruction can evade a static scanner. Review changes to `skills/inkexplain/` by hand. |
| A dependency or build tool is compromised | No dependencies. Both workflows pin every action to a commit SHA, and the security workflow pins SkillSpector to a commit. | A pin only freezes what was reviewed: it must be updated on purpose, and it does not protect against a malicious release that was reviewed and pinned. |
| Secrets or machine paths committed by accident | `SEC-001` and `SEC-002` scan every tracked text file. | Only the credential shapes listed in `scripts/lib/checks/security.mjs` are detected. |
| A path escapes the checkout | Scripts resolve every path inside the repository root, and `SEC-003` forbids symbolic links. | None known. |
| A bundled reference image is swapped or altered | `SCHEMA-011` allows an image in a pack only as its declared reference, and `ASSET-005` fails unless the file matches the SHA-256 in the pack's `rights.md`, which also names the source and, for a crop, how it was cut. | A record and a file changed together would still agree: the hashes are for review, not authority, and PNG pixels are not inspected for what they show. |
| A bundled image carries active content | `ASSET-001` validates PNG structure and rejects SVG scripts, event handlers, and external references. | PNG pixels are not inspected for embedded text. |
| A change adds a tracker, remote script, or exfiltration path to the gallery page | The browser enforces its Content-Security-Policy (`default-src 'none'`, no `connect-src`), and `SEC-006` fails on a weaker policy or on remote resources. The page builds its markup with `textContent`, never from strings, and its data is embedded JSON with no raw `<`. | The policy is only as strong as the browser that applies it, and `'unsafe-inline'` is needed because the page keeps its script and styles inline. |

### Automated enforcement

| Where | What it runs |
|---|---|
| `.github/workflows/ci.yml` | Generated documents are current, all validators (including `SEC-001` to `SEC-006`), and the test suite, on Linux and Windows with Node.js 22 and 24. |
| `.github/workflows/security.yml` | The SkillSpector scan of `skills/inkexplain/`, on every push to `main` and every pull request. |

## SkillSpector scan, run by this project

[SkillSpector](https://github.com/NVIDIA/skillspector) is NVIDIA's open-source security scanner for agent skills.

**Result of this project's own static scan: 0 findings (0 Critical, 0 High, 0 Medium, 0 Low). Risk score 0/100, severity LOW, recommendation SAFE, inspection complete (coverage 100% of the files the scanner can read; the three PNG images are listed below as scope exclusions).**

| | |
|---|---|
| Scanner | SkillSpector at commit `240421219409dc0bafef9f618a10d80c2d7e83a3`, which reports itself as v2.12.0. It is a later commit than the one the `v2.12.0` tag points to, not the tagged release. |
| Mode | Static analysis only (`--no-llm`). No file contents left the machine. |
| Command | `skillspector scan skills/inkexplain/ --no-llm --fail-on-findings --fail-on-incomplete` |
| Scanned | 2026-10-19, 57 files, 54 fully inspected, 3 binary images excluded |
| Content | Git tree `b621325c5fd1914dd7190b97220554acb1fc8780`: the output of `git rev-parse HEAD:skills/inkexplain` for the commit that last updated this statement |

This is the output of a scan InkExplain ran on itself. It is **not** an NVIDIA certification, endorsement, or "verified" status; NVIDIA's own verification is a separate publication process that this skill has not gone through. The pass applies to the tree above. The workflow re-runs the scan on every change and is the current source of truth.

### Findings by vulnerability vector

| Vector | Analyzers that ran (all completed, 0 findings) | Repository-side evidence |
|---|---|---|
| Prompt injection | `static_patterns_prompt_injection`, `anti_refusal`, `system_prompt_leakage`, `memory_poisoning`, `harmful_content` | A search of the package for override phrases ("ignore previous", "system prompt", "you are now", and similar) found none. "Hidden" appears only as a metaphor word ("hidden dependency"). |
| Data exfiltration | `static_patterns_data_exfiltration`, `agent_snooping`, `ssrf` | The package has no instruction to read credentials (`.ssh`, cloud credentials, `.env`, tokens), to send data anywhere, or to fetch a URL. The only URLs are rights-provenance citations in rights notes and credits. |
| Dynamic code execution, `eval()` | `static_patterns_deserialization`, `tool_misuse`, `output_handling`. The behavioral AST, taint-tracking, and bundled-execution analyzers found no applicable files. | The package ships no executable file (57 components, "Executable Scripts: No"). `PKG-006` keeps it that way, and `SEC-004` bars `eval(` and `new Function(` in `scripts/`. |
| Privilege escalation | `static_patterns_privilege_escalation`, `excessive_agency`, `rogue_agent` | The skill requests no tools of its own and no elevated rights. The one command it names is a file hash (`sha256sum`, `shasum -a 256`, or PowerShell `Get-FileHash`), which the agent skips when the host has no shell. Its writes are limited to the run folder. |
| Supply-chain risk | `static_patterns_supply_chain`, `artifact_integrity`, `static_yara` | No dependencies (`SEC-005`), no install step, no downloaded code. |

### What the scan does not cover

- The three LLM-based semantic analyzers were disabled (`--no-llm`). They can be run with `skillspector scan skills/inkexplain/` and a configured provider; doing so sends file contents to that provider.
- `references/archetypes/gopher/gopher.png`, `references/archetypes/stickman/pose-sheet.png`, and `references/archetypes/xiaohei/xiaohei.png` are binary and SkillSpector does not inspect them (it lists all three as scope exclusions). `ASSET-001` checks their structure, `ASSET-005` checks that each declared reference still matches the SHA-256 its rights record names, and `tests/bundled-references.test.mjs` checks that the gopher drawing is still the unmodified copy and the Xiaohei image still the crop (source, commit, size) its rights record describes.
- A static scan cannot prove that no instruction is harmful. It lowers the chance of an obvious one slipping in.

### Reproduce the scan

```bash
uv tool install --python 3.12 "git+https://github.com/NVIDIA/skillspector.git@240421219409dc0bafef9f618a10d80c2d7e83a3"
skillspector scan skills/inkexplain/ --no-llm --format markdown --fail-on-findings --fail-on-incomplete
```

On Windows without C++ build tools, use Python 3.12: `yara-python` publishes no wheel for 3.13, and building it needs Visual Studio. Install into a short path, because some dependencies exceed the 260-character path limit.

## Reporting a vulnerability

Report privately; please do not open a public issue for a vulnerability.

1. **GitHub private vulnerability reporting**: on the repository's **Security** tab, choose **Report a vulnerability**. Only the maintainer can read the report.
2. **If that form is not available**, open a public issue titled "Security report" with the **Bug Report** form (it asks for one thing, "What happened?"), and say there only that you have one: no details, no proof of concept, and no file names. The maintainer will answer there and arrange a private way to receive it.

There is no security mailbox; please do not send reports by email.

Include what you found, the file or workflow involved, steps to reproduce, and the impact you expect. A proof of concept helps but is not required.

**What to expect.** The maintainer aims to acknowledge a report within 7 days, to assess it and reply with a plan within 14 days, and to agree a disclosure date with the reporter, normally within 90 days. Reporters are credited in the advisory unless they ask not to be.

**In scope**

- Instructions in `skills/inkexplain/` that could cause prompt injection, data exfiltration, privilege escalation, or writes outside the output folder.
- Scripts, validators, and workflows in this repository: path traversal, command execution, network access, or secret handling.
- A dependency or pinned action that has become unsafe.

**Out of scope**

- The behavior of image models or of the host agent.
- Findings that need the host to ignore its own permission prompts.
- Rights and attribution concerns. Raise those in a public issue; the current credits are in [ATTRIBUTIONS.md](ATTRIBUTIONS.md).

**Safe harbor.** Good-faith research that stays within this policy is welcome. Do not access data that is not yours, do not disrupt other users, and give the maintainer reasonable time to fix a problem before you publish it.
