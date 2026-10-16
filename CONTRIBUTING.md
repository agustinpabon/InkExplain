# Contributing to InkExplain

Thank you for your interest in contributing to InkExplain! InkExplain is an AI-agent skill that transforms complex code, architecture, and logic into hand-drawn editorial illustrations with personality.

## Code of Conduct

This project and everyone participating in it is governed by the [InkExplain Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Development Workflow

### Prerequisites
- Node.js >= 22 (uses built-in test runner `node:test` and `parseArgs`)
- Git

### Initial Setup
```bash
git clone https://github.com/agustinpabon/InkExplain.git
cd InkExplain
npm test
```

InkExplain enforces a **zero-dependency policy** for runtime and tooling. You do not need to run `npm install`.

### Available Scripts
```bash
npm test             # Run all automated tests
npm run validate     # Run all repository compliance checks
npm run build:docs   # Recompile routing.md, README tables, and gallery data
npm run check        # Full CI simulation (build:docs --check + validate + test)
npm run explain -- --list   # Run the prompt generator CLI
npm run archetype:add -- --id <id> --name "<Name>"   # Scaffold a new character (see below)
```

## Adding a New Archetype

Archetypes are declarative data packs. Adding one never requires changing skill engine code or tests:
1. Settle the rights first and review [docs/adding-an-archetype.md](docs/adding-an-archetype.md).
2. Run `npm run archetype:add -- --id <id> --name "<Name>"`. It writes the registry entry, the five pack files, the credit, an example prompt, and the regenerated documents, checks the result before writing anything, and only adds (it never replaces an existing archetype or pack). The archetype starts `experimental`; what you leave out is marked `TODO` or `UNRESOLVED`, never guessed. Add `--dry-run` to preview.
3. Replace every marker: the five files in `skills/inkexplain/references/archetypes/<id>/` are
   - `rights.md`: licensing and copyright attributions,
   - `identity.md`: character silhouette and visual cues,
   - `style.md`: medium, linework texture, palette, and avoid list,
   - `motion-and-acting.md`: signature actions and decisive moments,
   - `prompts.md`: the generation prompt, its repairs, and the rights note.
4. Run `npm run build:docs`, then verify that `npm run check` exits with code 0.
5. Try it with real renders before it is promoted from `experimental`; `SCHEMA-010` refuses an active archetype that still has a marker.

## Legal and Licensing Integrity
- Every third-party character must carry a verified permissive license (MIT, CC0, CC BY, or explicit public authorization).
- Proprietary or trademark-infringing characters without recorded clearance cannot be accepted.

## Commit Guidelines
Follow the Conventional Commits specification:
- `feat:` new capabilities or archetypes
- `fix:` bug fixes in prompts or tooling
- `docs:` documentation improvements
- `refactor:` code restructuring without feature change
- `test:` test suite updates
- `security:` security policy or scanner updates
