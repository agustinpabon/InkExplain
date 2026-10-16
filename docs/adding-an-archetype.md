# Adding an archetype

An archetype is a character (or a neutral actor), how it moves, and how it is drawn. Adding one takes a registry entry, a five-file pack, a credit line, and two commands. No validator code changes are needed: every per-archetype rule is data in `registry.json`.

This guide is for anyone contributing a character pack: an original house style, a project mascot, or a tribute to a third-party character. Not sure which character to add? [Characters to add next, and characters to leave out](future-archetypes.md) lists the candidates that look safe and the ones that are not.

## Quick start

```bash
npm run archetype:add -- --id example-fox --name "Example Fox"
```

One command adds everything steps 2 to 4 below describe: the registry entry, the five pack files, a credit in `ATTRIBUTIONS.md`, an example prompt, and the regenerated routing table, README tables, and gallery data. Before it writes a file it checks the whole result against every repository check, so a duplicate id, an alias that another archetype already owns, an existing pack folder, or a name that leaks into another pack is refused and the repository is left exactly as it was. It only adds: it never replaces an existing archetype, pack, or credit. The files it does edit are `registry.json`, `ATTRIBUTIONS.md`, `examples/prompts.md`, and the generated documents, and it edits them only if they still read as they did when it planned the change. If a write fails or the checks fail after writing, it undoes its own changes. If a step cannot be undone (a locked file, or a file someone edited after the command wrote it, for example), it does not skip it silently: it lists what is left, and you review `git status` and fix those by hand.

The new archetype is always `experimental`, and the command never decides what only you can. Whatever you do not pass in becomes an explicit marker: `UNRESOLVED` for the rights (who holds them, the license, the source, the credit line, and for a tribute character the boundaries its holder sets) and `TODO` for the character itself (identity markers, actions, palette, poses). The checks accept markers while the archetype is experimental and refuse them in any other status (`SCHEMA-010`), so the pack cannot be promoted by accident. Pass what you already know, and the rest stays marked:

```bash
npm run archetype:add -- --id example-fox --name "Example Fox" --category mascot \
  --summary "Example Fox, a sparse orange fox that digs and sorts ideas into tidy piles." \
  --feature "orange fox body" --feature "white-tipped tail" --action dig --action carry --action sort \
  --palette "black ink" --palette "fox orange" \
  --rights-holder "Jane Artist" --license "CC BY 4.0" --source https://example.org/fox \
  --credit "Example Fox by Jane Artist (https://example.org/fox), CC BY 4.0"
```

`--dry-run` prints what would change and writes nothing, `--json` prints the result for a script, and `--help` lists every option. The command lists the markers it left, in which files, and the next steps. Rights come first: for a third-party character, settle them (step 1) before anything else, and do not publish an image of it until you have.

The command does not render images, review them, or promote the archetype. After it runs:

1. Settle the rights, then replace every `TODO` and `UNRESOLVED` in the registry entry, the five pack files, and the archetype's section of `ATTRIBUTIONS.md`. Edit the registry entry first; it is the source of truth for the identity markers, palette, and actions, and `npm run build:docs` regenerates the tables from it.
2. Run `node scripts/explain.mjs --archetype example-fox --concept "..."` to see the prompt the pack assembles, and `npm run check` until it passes.
3. Try the archetype with real renders and review them against the pack's own checklist ([step 5](#5-validate)).
4. To promote it, change `status` to `active` in the registry, and change the wording that still says the pack is experimental (`rights.md` must state the new status. `SCHEMA-010` lists the lines in the registry entry, the pack, the archetype's credit in `ATTRIBUTIONS.md`, and its example prompt that still say it is experimental in the usual wordings, one line at a time; it does not read the rest of the documentation, so also search `README.md` and `docs/` for the name beside "experimental"). Publish samples only after review ([publishing samples](#publishing-samples)).

The numbered steps below describe the same files in detail, for writing a pack by hand or finishing the one the command started.

## 1. Settle the rights first

Before writing anything, establish what you may do with the character or style:

- Who created it, and under which license? Record the source URL and, for repositories, the commit you reviewed.
- Who holds the rights today? That is the `rightsHolder`, credited directly, never through an intermediary.
- Are there trademarks (names, logos) that need a boundary?
- Is it a real person? InkExplain does not accept archetypes that depict real people.
- Is it a protected character you hold no license for? Then it is `gated-authorized`, and samples stay unpublished until you record an authorization from the rights holder.

Then pick the category and the status:

| Category | Use it for |
|---|---|
| `house-style` | your own original style and actor, released under the project's MIT license |
| `mascot` | a project or community mascot whose license allows reuse with credit |
| `tribute-character` | a character created by a third party, drawn within its rights boundary |
| `animation-preset` | an original motion or staging preset performed by a neutral actor |

| Status | Use it for |
|---|---|
| `active` | a reviewed pack that is ready to use |
| `experimental` | a new pack that has not yet been tried with real renders |
| `gated-authorized` | a protected character, usable only within each user's own authorization |

## 2. Add the registry entry

Add an object to `archetypes` in `skills/inkexplain/registry.json`:

```json
{
  "id": "example-fox",
  "name": "Example Fox",
  "category": "mascot",
  "status": "experimental",
  "summary": "One sentence describing the character and the style.",
  "aliases": ["Example Fox", "example mascot"],
  "excludedTerms": ["fox"],
  "outputSuffix": "example-fox",
  "motionDna": {
    "actor": "Example Fox, who works with its front paws",
    "signatureActions": ["dig", "carry", "sort", "guard"],
    "poses": ["nose and tail aligned with the action", "front paws planted on the object"],
    "timing": "One decisive moment per image; mini comics use two or three beats"
  },
  "styleSheet": {
    "medium": "Sparse hand-drawn article sketch",
    "canvas": "16:9 on a clean white background",
    "linework": "Loose black ink",
    "palette": ["black", "fox orange"],
    "avoid": ["Example Corp logos", "realistic fur", "3D rendering"]
  },
  "legalNotice": {
    "credit": "Example Fox by Jane Artist (https://example.org/fox), CC BY 4.0",
    "rightsHolder": "Jane Artist",
    "license": "CC BY 4.0",
    "attributionTerms": ["Jane Artist", "https://example.org/fox"],
    "restrictions": ["Credit Jane Artist when publishing images.", "No Example Corp logos."]
  },
  "sampleGates": { "status": "pending", "decision": "No samples reviewed yet.", "directories": [] },
  "contract": {
    "identityMarkers": ["orange fox body", "white-tipped tail"],
    "isolationMarkers": ["Example Fox"]
  }
}
```

- `aliases` select the archetype; they must not collide with any other archetype's names. Matching ignores case, spaces, hyphens, and underscores.
- `excludedTerms` are related words that must never select the archetype.
- `motionDna.signatureActions` must each appear in `motion-and-acting.md`.
- `styleSheet.palette` entries must each appear in `style.md` and in `prompts.md`.
- `contract.identityMarkers` must appear in `identity.md` and `prompts.md`, so the identity reaches the image model and the review.
- `contract.isolationMarkers` must not appear in any other archetype's pack.
- `legalNotice.attributionTerms` must appear in `rights.md` and `ATTRIBUTIONS.md`. Third-party archetypes need at least one; tribute characters also need at least one restriction.
- `styleSheet.background` is optional. Add it only when the character should work on a page color the user can change, as Littlebox does. It holds a `default` color and optional `presets`, each with a lowercase `name`, an uppercase `#RRGGBB` `hex` light enough for black linework (relative luminance of at least 0.6), and optional `aliases`. The generation prompt then needs exactly one field naming the default, such as `[pure white background #FFFFFF]`, and `style.md` must state every color's hex. The command-line helper's `--background` and the gallery's picker read the same data; an archetype without it keeps a fixed page and refuses `--background`. Whatever the policy, every image of a set uses one page color unless the user asks for variety, and no pack may pick or rotate a color by mood or topic.

## 3. Write the pack

Create `skills/inkexplain/references/archetypes/<id>/` with exactly these five files. Each needs a level-1 title and these level-2 sections:

| File | Sections |
|---|---|
| `rights.md` | Source, Rights and restrictions, Public samples |
| `identity.md` | Identity, Recognition, Failure modes |
| `style.md` | Canvas, Linework, Color, Labels, Avoid |
| `motion-and-acting.md` | Actions, Patterns, Supporting objects, Originality |
| `prompts.md` | Planning fields, Generation prompt (a fenced `text` block), Edit prompts, Review and repair, Delivery notes |

- `rights.md` states the category, the status, the rights holder, and every attribution term.
- `prompts.md` states the output folder, `assets/<article-slug>-<outputSuffix>/`. For a status other than `active`, it also states the status.
- The generation prompt keeps the shared bracketed fields, because the gallery fills them: `[core idea in one sentence]` after `Scene:`, an action field right before `, caught at its decisive moment`, and a `["label 1", "label 2", "label 3"]` list. Third-party archetypes also keep `[append the rights note from this file]`. `npm run build:docs` fails when a field is missing.
- Third-party archetypes (`mascot`, `tribute-character`) end `prompts.md` with a `## Rights note` section holding one `text` block: the credit and restrictions that travel with every prompt, plan, and report.
- A pack may bundle a reference image, such as a licensed identity sheet, if a pack file names it.

Reuse the shared modules in `references/workflow/` instead of repeating them. The InkExplain Sketch pack (`ink`) is the model for a house style; the Xiaohei pack (`xiaohei`) is the model for a third-party character with a rights note.

## 4. Credit and generate

- Add the credit and boundaries to `ATTRIBUTIONS.md` under "Character archetypes". It must contain every `attributionTerms` entry.
- Add at least one example prompt for the archetype to `examples/prompts.md`.
- Run `npm run build:docs` to regenerate `references/routing.md`, the archetype table in every README, and the gallery data.

## 5. Validate

```bash
npm run check
```

Then try the archetype for real: one planning request and one generation or prompt-mode request ([evaluation.md](evaluation.md) lists the kinds of request worth trying and the checks to apply). When it behaves as the pack describes, change `status` from `experimental` to `active`.

## Publishing samples

Keep `sampleGates.status` at `pending` until someone reviews real renders. To publish, set it to `approved`, add the reviewer, the review date, the reasoning, and the gallery directories, then add the images under `examples/gallery/<en|zh>/<id>/` with names like `01-topic-slug.png`. Record each set in `examples/gallery/provenance.json`: for renders made for InkExplain, `origin: "inkexplain"` with the image tool, the generation date, the reviewer, the review date, and the git blob hash of every image (`git hash-object <file>`); for unmodified copies of another project's files, `origin: "historical"` with the repository, commit, path, license, and copyright of the source. An edited copy is not a copy: describe it as an `inkexplain` set. `ASSET-003` fails for an image without a recorded source or whose hash no longer matches, and `ASSET-004` fails when the review of another project's copies is dated on or before the day they were first published: the date is the day you reviewed them. Then run `npm run build:docs` so the gallery page lists the images and their source. Gated archetypes also need `sampleGates.authorization`, recorded from the rights holder.
