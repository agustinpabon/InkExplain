# AGENTS.md

Guidance for AI agents and contributors working on the InkExplain repository. (To *use* the skill, install `skills/inkexplain/` and invoke `$inkexplain`; see the README.)

## What this repository is

InkExplain is an AI-agent skill that turns ideas into consistent hand-drawn illustrations. The installable package is `skills/inkexplain/`. Everything else supports it: documentation, the example gallery, and Node.js tooling that validates the package.

## Layout

- `skills/inkexplain/SKILL.md`: the entry point agents load. Keep it concise; detail belongs in `references/`.
- `skills/inkexplain/registry.json`: the archetype registry and single source of truth for archetypes.
- `skills/inkexplain/references/routing.md`: generated. Never edit it by hand.
- `skills/inkexplain/references/workflow/`: shared method used by every archetype.
- `skills/inkexplain/references/archetypes/<id>/`: one five-file pack per archetype (`rights.md`, `identity.md`, `style.md`, `motion-and-acting.md`, `prompts.md`).
- `scripts/`: `validate.mjs`, `build-docs.mjs`, and `lib/` (no dependencies).
- `tests/`: Node's built-in test runner; fixtures are generated in temporary directories.
- `docs/`: architecture, language policy, release checklist, archetype authoring guide.
- `readmes/`: README translations plus `locales.json`.

See [docs/architecture.md](docs/architecture.md) for details.

## Commands

```bash
npm test             # all tests
npm run validate     # all repository checks
npm run build:docs   # regenerate routing.md and the README archetype tables
npm run check        # everything CI runs
```

Run `npm run build:docs` after editing `registry.json` or `readmes/locales.json`, and `npm run check` before committing.

## Rules

- **Registry first.** Archetype ids, categories, aliases, statuses, output folders, motion and style summaries, legal notices, and sample gates change in `registry.json`, never in generated files.
- **One archetype, one pack.** A pack never names another archetype. Shared rules go in `references/workflow/`, not into every pack. See [docs/adding-an-archetype.md](docs/adding-an-archetype.md).
- **Rights are part of the product.** Keep `LICENSE` (including "Copyright (c) 2026 Agustin Pabon"), `ATTRIBUTIONS.md`, and every archetype's `rights.md` accurate. Credit rights holders directly. Never publish samples for an archetype whose `sampleGates.status` is not `approved`, and never approve gated-archetype samples without a recorded authorization.
- **No new runtime dependencies.** Tooling uses Node.js built-ins only and stays offline: no network calls, no child processes in `scripts/`.
- **English-default.** Follow [docs/language-policy.md](docs/language-policy.md). Non-English text belongs in archetype aliases, user-language label examples, attribution names, and `readmes/`.
- **Honest capabilities.** The skill must never claim to generate or review images without an image tool; prompt mode is the fallback.
- **Validator changes need tests.** Every check has fixture tests in `tests/checks/`; add a failing case before changing a rule.
- **Atomic commits.** Commits carry their real author and clear Conventional Commit messages.

## Commit style

Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`) with an imperative summary under 72 characters and a body that explains why.

<!-- [stage] testing conventions -->
