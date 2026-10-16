# Architecture

InkExplain has two parts: the **skill package** that agents load, and the **tooling** that keeps the package correct. Neither needs a build step or a dependency.

## Skill package

```text
skills/inkexplain/
├── SKILL.md                     entry point: modes, workflow, rules, output (under 80 lines)
├── LICENSE.md                   MIT terms and third-party copyright notices that travel with the install
├── agents/openai.yaml           Codex display metadata
├── registry.json                archetype registry (single source of truth)
├── assets/<id>/                 calibration images for an archetype (approved samples only)
└── references/
    ├── routing.md               generated from registry.json: selection rules and archetype cards
    ├── workflow/                shared, character-independent method
    │   ├── concept-extraction.md    reading the source, the core thesis, cognitive anchors, shot list
    │   ├── composition-grid.md      framing, focal points, balance, structure types, metaphors
    │   ├── prompt-assembly.md       deterministic prompt order, prompt mode, honesty about tools
    │   ├── editing.md               shared repair prompts
    │   ├── qa-checklist.md          shared review checklist, artifact rejection, iteration moves
    │   └── delivery.md              output folders, file names, delivery report
    └── archetypes/<id>/         one five-file pack per archetype
        ├── rights.md            source, license, rights holder, restrictions, sample decision
        ├── identity.md          anatomy, proportions, signature gear, recognition, failure modes
        ├── style.md             canvas, linework, color, labels, what to avoid
        ├── motion-and-acting.md actions, poses, timing, how structure types look, objects
        └── prompts.md           planning fields, generation and edit prompts, review, rights note
```

## Progressive disclosure

An agent's context is the scarcest resource a skill competes for. Every line that loads but is not needed pushes out source material, plans, and reviews. InkExplain therefore loads in three tiers:

| Tier | Loaded | Contents | Size |
|---|---|---|---|
| 1 | Always, when the skill triggers | `SKILL.md` frontmatter and body: when to use it, the four modes, the seven workflow steps, the rules | under 80 lines |
| 2 | Once per request | `references/routing.md` and the workflow module for the current step | one table plus one module |
| 3 | Only for selected archetypes | the five files of each selected pack | five files per archetype |

`SKILL.md` stays minimal because it is the only file paid for on every request, including the ones that end in a plan or a single prompt. It names every workflow module and the routing document, but holds none of their detail: it says *what* to do at each step and *where* the rules live. The `PKG-003` check enforces the 80-line ceiling and the links.

Archetype detail is the largest body of text, and a request uses only one archetype, or a few in a mixed request. Keeping each archetype in its own pack means a request for Ferris never loads Xiaohei's rights record or Littlebox's label rules. The shared method lives once in `references/workflow/`, so packs carry only what differs between characters, and adding the ninth archetype does not grow what the first eight requests load.

Inside a pack, files are loaded in a fixed order, `rights.md` first, so an agent knows an archetype's boundaries before it plans a single image.

## Archetype packs

A pack separates five concerns, mirroring how an illustrator works:

- **Rights**: what the character's owner allows, and whether samples may be published.
- **Identity**: who acts: anatomy, proportions, signature gear, and how the character goes wrong.
- **Style**: how anything is drawn: canvas, linework, palette, labels.
- **Motion and acting**: how the actor moves: signature actions, poses, timing, and how each structure type looks with this actor.
- **Prompts**: what the image model receives, how results are reviewed and repaired, and the rights note that travels with third-party archetypes.

### Categories and statuses

Each archetype has a category, which says whose character it is, and a status, which says how it may be selected.

| Category | Meaning |
|---|---|
| `house-style` | original to InkExplain; the default is always a house style |
| `mascot` | a project or community mascot, used with credit and without logos or endorsement claims |
| `tribute-character` | a character created by a third party, drawn within its rights boundary |
| `animation-preset` | an original motion and staging preset performed by a neutral actor (none ship yet) |

| Status | Selection |
|---|---|
| `active` | by name, or by default for the default archetype; included in "all archetypes" |
| `experimental` | by name only; every delivery flags it |
| `gated-authorized` | by name only, within the user's own authorization; samples need a recorded authorization |

### The default archetype

InkExplain Sketch (`ink`) is original to InkExplain and brand-neutral. Its actor is an anonymous ink figure, a pair of hands, or the working object, so users never need a third-party character. Its palette (black ink, explainer blue for movement, one highlighter-yellow emphasis, signal red for problems) gives every InkExplain series a recognizable look.

## Archetype registry

`skills/inkexplain/registry.json` holds, for each archetype: id, display name, category, status, summary, aliases, excluded terms, output suffix, `motionDna` (actor, signature actions, poses, timing), `styleSheet` (medium, canvas, linework, palette, things to avoid, and optionally a `background` policy: a default page color plus presets the user may ask for), `legalNotice` (credit, rights holder, license, attribution terms, restrictions), `sampleGates` (the public-sample decision), and the contract markers used by validation. Three consumers read it:

- `scripts/build-docs.mjs` renders `references/routing.md`, the archetype table and language selector in every README, and the data block of the offline gallery page;
- `scripts/validate.mjs` checks the registry and everything derived from it;
- `resolveArchetypeRequest()` in `scripts/lib/registry.mjs` implements the selection rules as executable, tested code. `routing.md` describes the same rules in prose for agents.

Selection is deterministic: names are compared after Unicode normalization, case folding, and separator collapsing; an unknown or excluded name never falls back to an archetype; "all archetypes" includes only `active` ones.

The registry is a contract with the packs, not a copy of them. Identity markers must appear in `identity.md` and `prompts.md`, palette entries in `style.md` and `prompts.md`, signature actions in `motion-and-acting.md`, and attribution terms in `rights.md` and `ATTRIBUTIONS.md`. A summary that drifts from its pack fails validation.

## Gallery

`examples/gallery/index.html` is one offline file: HTML, CSS, and JavaScript with no dependencies, opened from a checkout or served as static files. It lists every archetype with its style, motion rules, rights, and approved sample images, and it assembles a prompt for the concept a visitor types.

- **Data**: the page cannot read the repository, so `npm run build:docs` embeds the registry data, each pack's generation template, the approved sample paths, and a one-line source for each sample set (from `examples/gallery/provenance.json`) in a generated `gallery-data` region. An archetype whose `sampleGates.status` is not `approved` lists no images. A pack that drops a field the page fills (the scene, the action, or the labels) fails the build.
- **Prompts**: the page fills a template with the same rules as `scripts/lib/prompt-assembly.mjs`. A test runs the page's helper functions against that library, so both assemble identical prompts.
- **Policy**: a strict `Content-Security-Policy` (`default-src 'none'`) blocks every network request, and `SEC-006` rejects remote resources, network and dynamic-code APIs, and markup built from strings.

## Tooling

```text
scripts/
├── validate.mjs             CLI: run checks, text or JSON output, exit codes 0/1/2
├── build-docs.mjs           CLI: regenerate derived documents, or --check them
├── explain.mjs              CLI: list archetypes, or assemble a prompt from an archetype's template
├── add-archetype.mjs        CLI: scaffold a new experimental archetype, validated in memory before anything is written
└── lib/
    ├── config.mjs           product identity, paths, pack layout, policy data
    ├── entrypoint.mjs       whether a script was started directly, by real path, so a link to the checkout still runs it
    ├── repository.mjs       root-anchored, traversal-safe, CRLF-normalizing file access
    ├── markdown.mjs         frontmatter, headings, sections, links, code blocks, regions
    ├── yaml-lite.mjs        strict parser for the YAML subset skill metadata uses
    ├── registry.mjs         registry schema, alias index, archetype resolution
    ├── docs-render.mjs      routing.md, archetype tables, language selectors, the gallery data block
    ├── prompt-assembly.mjs  fills a pack's generation template, checks a prompt against it, derives negative prompts
    ├── provenance.mjs       the gallery's provenance manifest: where each sample set came from, and git blob hashes
    ├── gallery-data.mjs     the data embedded in the gallery page
    ├── scaffold.mjs         the archetype scaffold: input rules, registry entry, pack files, overlay checkout, safe writes
    ├── images.mjs           PNG structure and SVG safety
    ├── check-runner.mjs     check model, execution, skipping, formatting
    └── checks/              one module per area
```

### Checks

| Area | Module | Checks |
|---|---|---|
| `PKG` | `package.mjs` | required files, SKILL.md frontmatter, length, and links, references that resolve inside the installed package, `openai.yaml`, package hygiene |
| `SCHEMA` | `schema.mjs` | registry schema, alias integrity, the five pack files and their sections, registry-to-pack contracts, prompts and rights notes, isolation between packs, generated `routing.md`, the page-color policy reaching the style sheet and the generation prompt, and scaffold placeholders surviving only in experimental archetypes |
| `DOC` | `docs.mjs` | README identity, links and anchors, generated README and gallery regions, translations, example prompt coverage |
| `LEGAL` | `legal.mjs` | MIT terms and original copyright, ATTRIBUTIONS credits for every archetype, the Origins section crediting every copyright holder LICENSE keeps, every `rights.md`, gated-archetype boundaries, the license and copyright notices inside the installable skill |
| `ASSET` | `assets.mjs` | PNG and SVG integrity, the public-sample gate, and the provenance manifest: every published image has a recorded source and still matches its recorded hash, and a review of another project's images is dated after they were published |
| `LANG` | `language.mjs` | English-default scan, allowlist narrowness, policy completeness |
| `BRAND` | `branding.mjs` | origin project names only as attribution, one identity across surfaces |
| `SEC` | `security.mjs` | credential patterns, machine paths, symlinks, offline and shell-free scripts, no dependencies, an offline gallery page |

Each check returns structured issues (`path`, `line`, `message`); a check that crashes fails alone instead of aborting the run, and checks whose prerequisites failed are reported as skipped. `node scripts/validate.mjs --list` prints the catalog; `--only SCHEMA,DOC-002` selects areas or ids; `--json` produces machine-readable results.

`BRAND-001` reads the names it guards from the Origins section of `ATTRIBUTIONS.md` instead of hardcoding them: the project names and GitHub accounts listed there may appear only in attribution. The allowlist in `scripts/lib/config.mjs` classifies each attribution surface: the credits themselves (ATTRIBUTIONS, LICENSE, the provenance record, the README credits and gallery-credits regions), the data and rights notes they are written from (`registry.json`, each pack's `rights.md` and `prompts.md`), the views generated from them (`routing.md`, the gallery page, the README archetype table), the walkthroughs that quote rights notes, and tests. Crediting an origin and keeping the product's own identity are enforced by the same data.

`LEGAL-005` keeps that data from disappearing: ATTRIBUTIONS must keep an Origins section that names every copyright holder in LICENSE other than the maintainer, with a repository link and a license for each origin. [provenance.md](provenance.md) records what was taken from each origin and how that was measured.

`LEGAL-006` keeps the license with the installed skill. Installers such as `npx skills add` copy only `skills/inkexplain/`, so the repository's `LICENSE` and `ATTRIBUTIONS.md` never reach the user; `skills/inkexplain/LICENSE.md` carries the MIT terms and every copyright notice that `LICENSE` or the MIT notice in `ATTRIBUTIONS.md` names, and the check fails if one goes missing. It reads a notice in its usual spellings (`Copyright (C)`, `©`, a year range with any dash, `2019/2020`, `2019-21`, or `-present`, a comma after the year as in `Copyright (c) 2015, Holder`, a list marker or bold in front), and a line that opens like a notice with a year but cannot be read, such as one in a table cell, fails too instead of being skipped. A notice with no year, or with the holder before the year, cannot be told from prose and is not read, so write the lines in `LICENSE` and `ATTRIBUTIONS.md` as marker, year, holder.

Per-archetype rules are data. Adding an archetype never requires new validator code: the registry entry carries the markers, palette, actions, credits, and sample decision that the generic checks enforce.

### Tests

`tests/` uses Node's built-in test runner:

- `tests/lib/`: unit tests for every library module;
- `tests/checks/`: each check against a small, fully valid fixture repository that a test mutates in one place, including an end-to-end test that adds a new archetype;
- `tests/cli.test.mjs`: exit codes, JSON output, filtering, and document generation;
- `tests/scripts/`: the command-line prompt helper, in process and as a real process;
- `tests/gallery-page.test.mjs`: the gallery page's prompt helpers against `prompt-assembly.mjs`;
- `tests/walkthroughs.test.mjs`: the example prompts in `docs/walkthroughs.md` against their archetypes' templates;
- `tests/repository.test.mjs`: acceptance tests that run every check on the real repository.

Fixtures are built in temporary directories by `tests/helpers/fixture.mjs`, including real PNG files, so the suite runs in a couple of seconds and needs no copies of the gallery images.

### Continuous integration

Two workflows run on every push to `main` and every pull request:

- `.github/workflows/ci.yml` runs `build-docs --check`, the validator, and the tests on Linux and Windows with Node.js 22 and 24.
- `.github/workflows/security.yml` scans `skills/inkexplain/` with NVIDIA SkillSpector (static analysis, pinned to a commit) and fails on any finding or incomplete inspection.

[SECURITY.md](../SECURITY.md) holds the threat model, the audit statement, and the disclosure policy.

## Design constraints

- **No runtime**: the skill is Markdown, JSON, YAML, and images. Tooling uses only Node.js built-ins.
- **No dependencies**: `package.json` declares none, so no third-party package is installed or executed (`SEC-005`).
- **No network, no shell**: scripts never spawn processes or fetch anything (`SEC-004`).
- **Safe paths**: every path from data or links is resolved inside the repository; symlinks are never followed.
- **Stable line endings**: `.gitattributes` keeps text files LF; readers also normalize CRLF.
- **Honest capabilities**: the skill states when it cannot generate images and falls back to prompt mode.

## Decision records

Why the design is the way it is, one decision per file:

- [0001: zero runtime dependencies](adr/0001-zero-runtime-dependencies.md)
- [0002: the five-file archetype pack](adr/0002-modular-5-file-packs.md)
- [0003: the scaffold marks what it cannot know](adr/0003-scaffold-marks-what-it-cannot-know.md)
- [0004: the license travels with the installed skill](adr/0004-license-travels-with-the-skill.md)
- [0005: Stickman is its own house style](adr/0005-stickman-is-its-own-archetype.md)
