# Release checklist

Run through this list before tagging a release or publishing the repository. Automated gates come first; the manual review covers what a validator cannot judge.

## Automated gates

```bash
npm run check   # build-docs --check, validate, and the full test suite
git diff --check
```

All must pass on a clean checkout. CI runs the same commands on Linux and Windows with Node.js 22 and 24.

## Identity

- [ ] The skill folder is `skills/inkexplain/`, its `SKILL.md` name is `inkexplain`, and every document advertises `$inkexplain`.
- [ ] `SKILL.md` stays under 80 lines; detail lives in `references/`.
- [ ] `README.md` opens with "InkExplain", "Ideas made visual.", and the product description.
- [ ] Installation instructions only describe commands and locations that have been verified for this release.

## Archetypes

- [ ] `skills/inkexplain/registry.json` lists every archetype with the right category, status, aliases, excluded terms, output suffix, motion DNA, style sheet, legal notice, and sample gate.
- [ ] Generated documents are current (`npm run build:docs` leaves no diff).
- [ ] Each archetype behaves as its pack describes: run one planning prompt and one generation or prompt-mode request per changed archetype (see [examples/prompts.md](../examples/prompts.md)).
- [ ] Gated archetypes still require explicit selection, and their rights notes appear in plans, prompts, and delivery reports.
- [ ] Experimental archetypes that passed real use are promoted to `active`.

## Rights and attribution

- [ ] `LICENSE` keeps "Copyright (c) 2026 Agustin Pabon" and the MIT terms unchanged.
- [ ] `ATTRIBUTIONS.md` credits every archetype's rights holder directly; the validator's `LEGAL` checks pass.
- [ ] Every rights record (`references/archetypes/<id>/rights.md`) reflects the current source, license, and restrictions. Re-check license pages for archetypes whose sources may have changed.
- [ ] No archetype claims endorsement by, or affiliation with, a third party.

## Public samples

Sample images are published only where `registry.json` records an approved sample gate.

- [ ] Every image in `examples/gallery/` and `skills/inkexplain/assets/` belongs to an archetype whose `sampleGates.status` is `approved` and sits in one of its listed directories (`ASSET-002`).
- [ ] New approvals record a named reviewer, a real review date, and the reasoning in `sampleGates.decision`.
- [ ] Gated archetypes publish samples only with a recorded `sampleGates.authorization` from the rights holder.
- [ ] Credits for published samples appear next to the gallery in `README.md`.

## Documentation

- [ ] The README, its translations, and `docs/` describe the current behavior; links resolve (`DOC-002`).
- [ ] Translations keep the credits region and the canonical identifiers (`DOC-004`).
- [ ] Limitations in the README are still accurate, including the state of reviewed InkExplain Sketch renders.

## Publishing

- [ ] Release commits are authored with the maintainer's own identity and the date they were made.
- [ ] Remotes point where you intend to publish; nothing is pushed anywhere by accident.

<!-- [stage] openclaw dimension checks -->
