# Adding an archetype

An archetype is a character (or a neutral actor), how it moves, and how it is drawn. Adding one takes a registry entry, a five-file pack, a credit line, and two commands. No validator code changes are needed: every per-archetype rule is data in `registry.json`.

This guide is for anyone contributing a character pack: an original house style, a project mascot, or a tribute to a third-party character.

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
- Third-party archetypes (`mascot`, `tribute-character`) end `prompts.md` with a `## Rights note` section holding one `text` block: the credit and restrictions that travel with every prompt, plan, and report.
- A pack may bundle a reference image, such as a licensed identity sheet, if a pack file names it.

Reuse the shared modules in `references/workflow/` instead of repeating them. The InkExplain Sketch pack (`ink`) is the model for a house style; the Xiaohei pack (`xiaohei`) is the model for a third-party character with a rights note.

## 4. Credit and generate

- Add the credit and boundaries to `ATTRIBUTIONS.md` under "Character archetypes". It must contain every `attributionTerms` entry.
- Add at least one example prompt for the archetype to `examples/prompts.md`.
- Run `npm run build:docs` to regenerate `references/routing.md` and the archetype table in every README.

## 5. Validate

```bash
npm run check
```

Then try the archetype for real: one planning request and one generation or prompt-mode request. When it behaves as the pack describes, change `status` from `experimental` to `active`.

## Publishing samples

Keep `sampleGates.status` at `pending` until someone reviews real renders. To publish, set it to `approved`, add the reviewer, the review date, the reasoning, and the gallery directories, then add the images under `examples/gallery/<en|zh>/<id>/` with names like `01-topic-slug.png`. Gated archetypes also need `sampleGates.authorization`, recorded from the rights holder.

<!-- [stage] sample gate status transitions -->
