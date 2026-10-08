# Architecture

InkExplain has two parts: the **skill package** that agents load, and the **tooling** that keeps the package correct. Neither needs a build step or a dependency.

## Skill package

```text
skills/inkexplain/
├── SKILL.md                     entry point: modes, workflow, rules, output (under 80 lines)
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

`skills/inkexplain/registry.json` holds, for each archetype: id, display name, category, status, summary, aliases, excluded terms, output suffix, `motionDna` (actor, signature actions, poses, timing), `styleSheet` (medium, canvas, linework, palette, things to avoid), `legalNotice` (credit, rights holder, license, attribution terms, restrictions), `sampleGates` (the public-sample decision), and the contract markers used by validation. Three consumers read it:

- `scripts/build-docs.mjs` renders `references/routing.md`, and the archetype gallery table and language selector in every README;
- `scripts/validate.mjs` checks the registry and everything derived from it;
- `resolveArchetypeRequest()` in `scripts/lib/registry.mjs` implements the selection rules as executable, tested code. `routing.md` describes the same rules in prose for agents.

Selection is deterministic: names are compared after Unicode normalization, case folding, and separator collapsing; an unknown or excluded name never falls back to an archetype; "all archetypes" includes only `active` ones.

The registry is a contract with the packs, not a copy of them. Identity markers must appear in `identity.md` and `prompts.md`, palette entries in `style.md` and `prompts.md`, signature actions in `motion-and-acting.md`, and attribution terms in `rights.md` and `ATTRIBUTIONS.md`. A summary that drifts from its pack fails validation.

## Tooling

```text
scripts/
├── validate.mjs             CLI: run checks, text or JSON output, exit codes 0/1/2
├── build-docs.mjs           CLI: regenerate derived documents, or --check them
└── lib/
    ├── config.mjs           product identity, paths, pack layout, policy data
    ├── repository.mjs       root-anchored, traversal-safe, CRLF-normalizing file access
    ├── markdown.mjs         frontmatter, headings, sections, links, code blocks, regions
    ├── yaml-lite.mjs        strict parser for the YAML subset skill metadata uses
    ├── registry.mjs         registry schema, alias index, archetype resolution
    ├── docs-render.mjs      routing.md, archetype tables, language selectors
    ├── images.mjs           PNG structure and SVG safety
    ├── check-runner.mjs     check model, execution, skipping, formatting
    └── checks/              one module per area
```

### Checks

| Area | Module | Checks |
|---|---|---|
| `PKG` | `package.mjs` | required files, SKILL.md frontmatter, length, and links, references that resolve inside the installed package, `openai.yaml`, package hygiene |
| `SCHEMA` | `schema.mjs` | registry schema, alias integrity, the five pack files and their sections, registry-to-pack contracts, prompts and rights notes, isolation between packs, generated `routing.md` |
| `DOC` | `docs.mjs` | README identity, links and anchors, generated README regions, translations, example prompt coverage |
| `LEGAL` | `legal.mjs` | MIT terms and original copyright, ATTRIBUTIONS origins and credits, every `rights.md`, gated-archetype boundaries |
| `ASSET` | `assets.mjs` | PNG and SVG integrity, the public-sample gate |
| `LANG` | `language.mjs` | English-default scan, allowlist narrowness, policy completeness |
| `BRAND` | `branding.mjs` | origin project names only as attribution, one identity across surfaces |
| `SEC` | `security.mjs` | credential patterns, machine paths, symlinks, offline and shell-free scripts |

Each check returns structured issues (`path`, `line`, `message`); a check that crashes fails alone instead of aborting the run, and checks whose prerequisites failed are reported as skipped. `node scripts/validate.mjs --list` prints the catalog; `--only SCHEMA,DOC-002` selects areas or ids; `--json` produces machine-readable results.

`BRAND-001` reads the names it guards from the Origins section of `ATTRIBUTIONS.md` instead of hardcoding them: the project names and GitHub accounts listed there may appear only in attribution (ATTRIBUTIONS, LICENSE, `rights.md` files, and the README credits regions). Crediting an origin and keeping the product's own identity are enforced by the same data.

Per-archetype rules are data. Adding an archetype never requires new validator code: the registry entry carries the markers, palette, actions, credits, and sample decision that the generic checks enforce.

### Tests

`tests/` uses Node's built-in test runner:

- `tests/lib/`: unit tests for every library module;
- `tests/checks/`: each check against a small, fully valid fixture repository that a test mutates in one place, including an end-to-end test that adds a new archetype;
- `tests/cli.test.mjs`: exit codes, JSON output, filtering, and document generation;
- `tests/repository.test.mjs`: acceptance tests that run every check on the real repository.

Fixtures are built in temporary directories by `tests/helpers/fixture.mjs`, including real PNG files, so the suite runs in a couple of seconds and needs no copies of the gallery images.

## Design constraints

- **No runtime**: the skill is Markdown, JSON, YAML, and images. Tooling uses only Node.js built-ins.
- **No network, no shell**: scripts never spawn processes or fetch anything (`SEC-004`).
- **Safe paths**: every path from data or links is resolved inside the repository; symlinks are never followed.
- **Stable line endings**: `.gitattributes` keeps text files LF; readers also normalize CRLF.
- **Honest capabilities**: the skill states when it cannot generate images and falls back to prompt mode.
