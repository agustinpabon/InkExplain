# Using InkExplain

How to ask for what you want, what comes back, and the command-line helper. The one-line install and the first prompt are in the [README](../README.md).

## Invoking the skill

| Agent | How |
|---|---|
| Claude Code | `/inkexplain`, or describe the task and let Claude pick the skill up |
| Codex | `$inkexplain` |
| Cursor | type `/` in Agent chat and pick `inkexplain` |
| Other agents | ask for InkExplain by name, or describe the task; the agent loads the skill when the request matches its description |

If your agent has an image skill of its own, say which one you mean. In Codex, requests about an article, a document, or a named character reached InkExplain without being asked, while a one-off "generate an illustration of X" and a repair of an existing image sometimes went to Codex's own image skill instead ([evaluation](evaluation.md#real-hosts-2026-10-17)). Name InkExplain, or start with `$inkexplain`, when it matters.

## Modes

InkExplain picks a mode from your request first and from what the agent can do second, and says which one it is using.

| Mode | When | What you get |
|---|---|---|
| Plan | "plan", "where should images go", "don't generate yet" | a shot list; nothing is saved |
| Prompt | "prompts only", or the agent has no image-generation tool | the shot list and one complete prompt per image, saved as `prompts.md` in your project |
| Generate | you want images and the agent has an image-generation tool | reviewed images saved in your project |
| Edit | you supply an image to fix | the repaired image, or a repair prompt when the tool cannot edit |

InkExplain ships no image model. It never claims to have generated or reviewed an image it did not.

## Ask for what you want

Everything below is plain words in the request.

- **A character or style**: "use Ferris", "in the Littlebox style", "draw it with Tux". A name that only appears in your article never picks one, and an unknown name is never guessed: InkExplain asks. With no request it uses InkExplain Sketch. Several names make a mixed request: one shared idea, one group of images per character, never two characters in one image.
- **How many images**, **the aspect ratio** ("one square 1:1 image"), **the label language** ("write the labels in Spanish"), **the article slug**, or **a folder** inside your project.
- **A page color**, for Littlebox only: it draws on pure white by default, with the same page in every image of a series. Ask for warm off-white, pale sky blue, pale lavender, or a light color of your own; it never alternates or picks one by mood.
- **A repair**: "remove the title", "fix this label", "keep the character but simplify the scene", "make the character do the work". Give it the image; it keeps the character the image shows.

[examples/prompts.md](../examples/prompts.md) has a prompt to copy for each of these, for every character, and for mixed requests.

## What comes back

- Each archetype writes to its own folder in your project: `assets/<article-slug>-illustrations/` for the default, `assets/<article-slug>-<id>/` for the others. For a single idea or a piece of code the slug comes from its subject.
- Files are numbered English slugs: `01-two-breakpoints.png`, `02-handoff-path.png`. Existing files are never overwritten; new versions get the next number or a `-v2` suffix.
- The prompts are saved as `prompts.md` in the same folder: in prompt mode they are the deliverable, and in Generate mode they record each image's final prompt so it can be re-rendered or repaired.
- Every delivery ends with a short report: the archetype and its status, each image and its purpose, what was saved, the strongest and optional images, open issues, and the rights note for third-party characters.

## From the command line

No agent at hand? `scripts/explain.mjs` assembles a prompt from an archetype's own template. It needs Node.js 22 or newer, installs nothing, makes no network call, and writes no file.

```bash
node scripts/explain.mjs --list
node scripts/explain.mjs --archetype ferris --concept "Two threads wait on each other" --label "lock A" --label "lock B"
node scripts/explain.mjs --archetype littlebox --concept "Raw material comes in and ships" --background lavender
```

It prints the prompt, the negative prompt, and the aspect ratio, then lists the fields only you can plan (the structure, the positions, the props), which stay in `[brackets]` instead of being invented. `--action` fills the action field, `--aspect 1:1` changes the ratio, `--background` picks a page color for characters that offer one, and `--format prompt` or `--format json` prints the prompt alone or everything for another tool. `--archetype` takes an id or any alias, and the default archetype is used when you give none. Run `node scripts/explain.mjs --help` for every option.

## Customizing

- **Per request**: the options above.
- **House style**: InkExplain Sketch lives in `skills/inkexplain/references/archetypes/ink/`. Change `style.md` and `prompts.md` together, and keep the palette in `registry.json` in step.
- **A new character**: `npm run archetype:add -- --id <id> --name "<Name>"`; see [adding an archetype](adding-an-archetype.md).

## Requirements

- An agent that supports `SKILL.md` skill packages.
- For generated images: an image-generation tool available to that agent.
- For the installer (`npx skills add`): Node.js 22.20 or newer. For development and the command-line helper: Node.js 22 or newer. Nothing else is installed.
