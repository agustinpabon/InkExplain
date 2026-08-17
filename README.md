<p align="center">
  <img src="assets/brand/inkexplain-hero.svg" alt="InkExplain: ideas made visual. A tangle of scribbles passes through a hand-cranked funnel and comes out as a clear light-bulb sketch." width="100%">
</p>

# InkExplain

*Ideas made visual.*

Turn complex ideas into beautiful, consistent hand-drawn illustrations with AI.

<!-- inkexplain:languages:start -->
**English** | [Español](./readmes/README.es.md) | [Português](./readmes/README.pt.md) | [Deutsch](./readmes/README.de.md) | [Français](./readmes/README.fr.md) | [简体中文](./readmes/README.zh.md) | [繁體中文](./readmes/README.zh-Hant.md) | [한국어](./readmes/README.ko.md) | [日本語](./readmes/README.ja.md) | [العربية](./readmes/README.ar.md) | [Русский](./readmes/README.ru.md) | [Türkçe](./readmes/README.tr.md) | [Українська](./readmes/README.uk.md)
<!-- inkexplain:languages:end -->

InkExplain is a visual-reasoning skill for AI agents. Give it an article, a document, or a single idea: it extracts the ideas worth drawing, turns each one into a physical action a character performs, and writes prompts that keep a whole series consistent. When your agent has an image-generation tool, it also generates, reviews, and saves the images.

## What it does

- **Plans** a shot list: where each image goes, the idea it carries, and the physical metaphor that shows it.
- **Directs the actor**: every image has one character, hand, or machine performing the idea, posed at its decisive moment.
- **Writes prompts** that hold a series together: one archetype, one style, a fresh metaphor per image.
- **Generates and reviews** images with your agent's image tool, then saves them under predictable names.
- **Repairs** illustrations: removes stray titles, fixes labels, simplifies crowded scenes, restores a character.

It suits technical articles, product and architecture explanations, workflows, comparisons, cause-and-effect, course material, and long-form writing that needs a consistent visual voice.

## How it works

1. **Choose an archetype**: a character, its motion, and its visual style. With no request, InkExplain uses its own house style, InkExplain Sketch.
2. **Extract the concept**: the core thesis and the cognitive anchors, such as breakpoints, handoffs, trade-offs, loops, and before-and-after changes.
3. **Plan** one image per idea, each with a structure type, a place on the composition grid, and an everyday metaphor that the actor performs.
4. **Assemble the prompt** from the archetype's template, in a fixed order, then generate one image per tool call.
5. **Review** every image against the shared QA checklist and the archetype's own checks; repair or regenerate.
6. **Save and report** to `assets/<article-slug>-…/` in your workspace.

Planning and generation are separate on purpose. InkExplain does not include an image model; it uses the image-generation tool your agent provides. Without one, it switches to **prompt mode** and hands you complete, ready-to-run prompts. It never claims to have generated an image it did not.

## Install

The skill is the folder `skills/inkexplain/`. Copy it to wherever your agent looks for skills.

From a checkout of this repository:

```bash
# Codex
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R skills/inkexplain "${CODEX_HOME:-$HOME/.codex}/skills/"

# Claude Code (personal skills; use .claude/skills/ inside a project to scope it)
mkdir -p ~/.claude/skills
cp -R skills/inkexplain ~/.claude/skills/
```

The planned public home of this repository is `agustinpabon/inkexplain`. It is not published yet; once it is, the [skills CLI](https://skills.sh) should be able to install it with:

```bash
npx skills add agustinpabon/inkexplain --skill inkexplain
```

## Use

In Codex, invoke the skill as `$inkexplain`. In Claude Code and other hosts, ask for InkExplain by name or describe the task; the agent loads the skill when the request matches its description.

```text
$inkexplain Plan illustrations for this article. Don't generate yet.

<paste the article>
```

```text
$inkexplain Illustrate this post with four images and save them in the project.
```

```text
$inkexplain Use Ferris. One image for: "ownership means exactly one owner at a time."
```

```text
$inkexplain Prompt mode: write prompts for three images that I can paste into my image tool.
```

More examples, including every archetype and mixed requests, are in [examples/prompts.md](examples/prompts.md).

## Archetypes

An archetype fixes who performs the idea, how they move, and how the scene is drawn. InkExplain Sketch is the default; every other archetype is chosen by name. Archetypes never mix inside one image.

<!-- inkexplain:archetypes:start -->
| Archetype | Category | Style summary | Legal status |
|---|---|---|---|
| InkExplain Sketch (`ink`, default) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on pale sky-blue or lavender backgrounds that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tolva |
| Seal (`seal`) | `mascot` | A product-neutral white seal in a plain navy cap and deep-blue hoodie, always logo-free, performing the idea in sparse article sketches. | `active` · No separate character license recorded; the pack text is MIT as part of InkExplain · Sealos (original mascot image) |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 · Renee French |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP when asked · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **Categories**: `house-style` is original to InkExplain; `mascot` is a project or community mascot used with credit; `tribute-character` is a character created by a third party, drawn within its rights boundary; `animation-preset` is reserved for original motion and staging presets.
- **Statuses**: `active` archetypes are ready to use; `experimental` ones are selected only by name and flagged in every delivery; `gated-authorized` ones are used only when named, only within your own authorization, and never published without a recorded authorization.

Aliases, motion DNA, style sheets, credits, and restrictions for every archetype are in [routing.md](skills/inkexplain/references/routing.md), generated from the archetype registry [registry.json](skills/inkexplain/registry.json).

## Example gallery

Renders shown with their archetype. InkExplain Sketch renders will be added after review.

| Littlebox | Ferris | Seal |
|---|---|---|
| ![Handoff path: Littlebox passes a sealed card from input to ready](examples/gallery/en/littlebox/04-handoff-path.png) | ![Sort by purpose: Ferris sorts material with its claws](examples/gallery/en/ferris/02-sort-by-purpose.png) | ![Information well: the seal draws ideas up from a well](examples/gallery/en/seal/05-information-well.png) |
| **OpenClaw** | **Go Gopher** | |
| ![Idea press: the OpenClaw mascot works a press](examples/gallery/en/openclaw/06-idea-press.png) | ![Trust bridge: the gopher lays planks across a gap](examples/gallery/en/gopher/08-trust-bridge.png) | |

Littlebox is adapted from okooo5km's 5km Littlebox Illustrations (MIT). Ferris by Karen Rustad Tolva (CC0). The Go gopher was designed by Renee French (CC BY 4.0). The OpenClaw mascot comes from the OpenClaw project (MIT). All renders are in [examples/gallery](examples/gallery): English labels for five archetypes, Chinese labels for three.

## Adding New Characters and Animation Styles

Archetypes are data plus Markdown. Adding one needs no validator code.

1. **Register it.** Add an entry to `archetypes` in [`skills/inkexplain/registry.json`](skills/inkexplain/registry.json): id, name, category, status, summary, aliases, output suffix, `motionDna`, `styleSheet`, `legalNotice`, `sampleGates`, and the identity and isolation markers in `contract`. Third-party characters need their rights holder, license, and attribution terms; protected ones start as `gated-authorized`.
2. **Write the pack.** Create `skills/inkexplain/references/archetypes/<id>/` with the five pack files: `rights.md`, `identity.md`, `style.md`, `motion-and-acting.md`, and `prompts.md`. Copy the structure of an existing pack; the shared method in `references/workflow/` already covers everything else.
3. **Generate and validate.** Add the credit to [ATTRIBUTIONS.md](ATTRIBUTIONS.md) and an example to [examples/prompts.md](examples/prompts.md), then run `npm run build:docs` and `npm run check`. The archetype table above, `routing.md`, and every translation update themselves.

The full walkthrough, with a complete registry entry and the rights questions to answer first, is in [docs/adding-an-archetype.md](docs/adding-an-archetype.md).

## Output conventions

- Each archetype writes to its own folder in your workspace: `assets/<article-slug>-illustrations/` for the default, `assets/<article-slug>-<id>/` for the others.
- Files are numbered English slugs: `01-two-breakpoints.png`, `02-handoff-path.png`.
- Existing files are never overwritten; new versions get the next number or a `-v2` suffix.
- In prompt mode inside a project, the prompts are saved as `prompts.md` in the same folder.
- Every delivery ends with a short report: archetype, images and their purpose, paths, the strongest and optional images, open issues, and the rights note for third-party archetypes.

## Supported environments

| Host | Where the skill goes | Images |
|---|---|---|
| Codex | `${CODEX_HOME:-$HOME/.codex}/skills/inkexplain` | Uses the host's image-generation tool when one is available; the package also ships Codex metadata in `agents/openai.yaml`. |
| Claude Code | `~/.claude/skills/inkexplain` or `.claude/skills/inkexplain` | Claude Code has no built-in image generator. InkExplain works in prompt mode unless you connect an image-generation tool, for example through an MCP server. |
| Other agents that load `SKILL.md` packages | the host's skills folder | Same rule: generate when an image tool exists, otherwise prompt mode. |

## Customize

- **Per request**: choose an archetype, the number of images, the aspect ratio, the label language, or the article slug in plain words.
- **House style**: InkExplain Sketch lives in `skills/inkexplain/references/archetypes/ink/`. Change `style.md` and `prompts.md` together, and keep the palette in `registry.json` in step.
- **New archetypes**: see [Adding New Characters and Animation Styles](#adding-new-characters-and-animation-styles).

## Requirements

- An agent that supports `SKILL.md` skill packages.
- For generated images: an image-generation tool available to that agent.
- For development: Node.js 22 or newer. There are no dependencies to install.

## Limitations

- InkExplain ships no image model; image quality depends on the tool your agent uses.
- Image models misspell labels, non-Latin scripts most of all. Keep labels short and review them.
- InkExplain Sketch has no reviewed sample renders yet.
- Third-party archetypes carry their owners' restrictions. Gated archetypes are for use within your own authorization, and InkExplain does not publish samples for them.
- The README translations were produced with AI assistance and have not been reviewed by professional translators. Generated tables keep registry data in English.

## Development

```bash
npm test               # unit, check, CLI, and repository tests (Node's built-in runner)
npm run validate       # validate the repository and skill package
npm run build:docs     # regenerate routing.md, the README archetype tables, and language selectors
npm run check          # everything CI runs
```

The architecture, progressive-disclosure model, check catalog, and release process are documented in [docs/architecture.md](docs/architecture.md) and [docs/release-checklist.md](docs/release-checklist.md). Contributor and agent guidelines are in [AGENTS.md](AGENTS.md).

## Credits and license

<!-- inkexplain:credits:start -->
Third-party characters and marks remain the property of their respective owners. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for individual character notices and licenses.
<!-- inkexplain:credits:end -->

InkExplain is released under the [MIT License](LICENSE).

<!-- [stage] test(gallery): verify sRGB chunk headers across all 64 PNG gallery images -->
