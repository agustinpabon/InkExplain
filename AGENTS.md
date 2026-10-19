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
- `scripts/`: `validate.mjs`, `build-docs.mjs`, `explain.mjs` (the prompt helper), `add-archetype.mjs` (the archetype scaffold), `verify-image.mjs` (is a reported file a real image), `audit-series.mjs` (what a real run's image calls attached), `audit-run.mjs` (a run folder against its run record, with what was seen, what each picture says, the repairs, and the host's log of calls), `check-explanation.mjs` (whether an explanation's file references resolve, and whether it promises more than a file can show), and `lib/` (no dependencies).
- `examples/`: example prompts, and the offline gallery `gallery/index.html` with its sample images. The gallery page carries a generated data block; never edit it by hand.
- `tests/`: Node's built-in test runner; fixtures are generated in temporary directories.
- `docs/`: architecture, language policy, release checklist, archetype authoring guide, and the code walkthroughs (`walkthroughs.md`).
- `readmes/`: README translations plus `locales.json`.

See [docs/architecture.md](docs/architecture.md) for details.

## Commands

```bash
npm test             # all tests
npm run validate     # all repository checks
npm run build:docs   # regenerate routing.md, the README archetype tables, and the gallery data
npm run check        # everything CI runs
npm run explain -- --list   # list archetypes; assemble a prompt with --archetype and --concept
npm run archetype:add -- --id <id> --name "<Name>" --dry-run   # preview a new archetype; drop --dry-run to write it
node scripts/audit-series.mjs --reference references/archetypes/xiaohei/xiaohei.png <session.jsonl>   # check a real Codex run's image calls against the character lock
node scripts/check-explanation.mjs --root <repository> <explanation.md>   # check that the files a repository explanation cites exist, and that it promises nothing a file cannot show
node scripts/audit-run.mjs --calls <log> --exact <run folder>   # check that a run's new images match its record and the host's calls, and that every approval has its observations and its review of meaning on record
```

Run `npm run build:docs` after editing `registry.json`, `readmes/locales.json`, an archetype's `prompts.md`, or the approved sample images, and `npm run check` before committing.

## Rules

- **Registry first.** Archetype ids, categories, aliases, statuses, output folders, motion and style summaries, legal notices, and sample gates change in `registry.json`, never in generated files.
- **One archetype, one pack.** A pack never names another archetype. Shared rules go in `references/workflow/`, not into every pack. Start a new one with `npm run archetype:add`, which marks every field it cannot know as `TODO` or `UNRESOLVED`; never fill a rights field with a guess. See [docs/adding-an-archetype.md](docs/adding-an-archetype.md).
- **Rights are part of the product.** Keep `LICENSE` (including "Copyright (c) 2026 Agustin Pabon"), `ATTRIBUTIONS.md`, and every archetype's `rights.md` accurate. Credit rights holders directly. Never publish samples for an archetype whose `sampleGates.status` is not `approved`, and never approve gated-archetype samples without a recorded authorization.
- **No new runtime dependencies.** Tooling uses Node.js built-ins only and stays offline: no network calls, no child processes in `scripts/`.
- **English-default.** Follow [docs/language-policy.md](docs/language-policy.md). Non-English text belongs in archetype aliases, user-language label examples, attribution names, and `readmes/`.
- **Honest capabilities.** The skill must never claim to generate or review images without an image tool; prompt mode is the fallback. It must never say a reference image was attached, or an identity consistent, unless the tool received the file and the agent compared the image with it (`references/workflow/character-lock.md`).
- **References travel with their rights.** A bundled identity reference is declared as `referenceImage` in `registry.json`, is the only image in its pack (`SCHEMA-011`), and has its source, license, and SHA-256 in the pack's `rights.md` (`ASSET-005`). A crop or an adaptation says so; never present it as a new render.
- **Validator changes need tests.** Every check has fixture tests in `tests/checks/`; add a failing case before changing a rule.
- **Atomic commits.** Commits carry their real author and clear Conventional Commit messages.

## Commit style

Conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`) with an imperative summary under 72 characters and a body that explains why.
