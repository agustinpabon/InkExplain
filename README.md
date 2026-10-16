<p align="center">
  <img src="assets/brand/inkexplain-hero.svg" alt="InkExplain: ideas made visual. A tangle of scribbles passes through a hand-cranked funnel and comes out as a clear light-bulb sketch." width="100%">
</p>

# InkExplain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/agustinpabon/InkExplain/actions/workflows/ci.yml/badge.svg)](https://github.com/agustinpabon/InkExplain/actions/workflows/ci.yml)
[![Security scan: SkillSpector, 0 findings](https://img.shields.io/badge/Security%20scan-SkillSpector%2C%200%20findings-brightgreen)](SECURITY.md)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-brightgreen)](package.json)

*Ideas made visual.*

Turn complex ideas into beautiful, consistent hand-drawn illustrations with AI.

<!-- inkexplain:languages:start -->
**English** | [Español](./readmes/README.es.md) | [Português](./readmes/README.pt.md) | [Deutsch](./readmes/README.de.md) | [Français](./readmes/README.fr.md) | [简体中文](./readmes/README.zh.md) | [繁體中文](./readmes/README.zh-Hant.md) | [한국어](./readmes/README.ko.md) | [日本語](./readmes/README.ja.md) | [العربية](./readmes/README.ar.md) | [Русский](./readmes/README.ru.md) | [Türkçe](./readmes/README.tr.md) | [Українська](./readmes/README.uk.md)
<!-- inkexplain:languages:end -->

InkExplain is a skill for AI agents. Give it an article, a document, a piece of code, or a single idea. It finds the ideas worth drawing, turns each one into a physical action that a character performs, and writes a prompt for every image so that the whole series stays consistent. If your agent has an image tool, it also generates, reviews, and saves the images.

| ![Ferris, the Rust crab, sorts a heap of loose pages into three labeled stacks.](examples/gallery/en/ferris/02-sort-by-purpose.png) | ![The Go gopher lays planks across a gap to build a bridge.](examples/gallery/en/gopher/08-trust-bridge.png) | ![Xiaohei saws a source fish into an insight, a quote, and an example.](examples/gallery/en/xiaohei/03-one-fish-many-uses.png) |
|---|---|---|
| **Ferris** (CC0) | **Go Gopher** (CC BY 4.0) | **Xiaohei** (MIT) |

*Sample renders from the projects InkExplain builds on, shown unmodified with their credits ([where each came from](docs/provenance.md)). InkExplain's own styles, Sketch and Stickman, have no reviewed renders yet.*

## Install

```bash
npx skills add agustinpabon/InkExplain --skill inkexplain
```

This uses the open [skills CLI](https://skills.sh) (Node.js 22.20 or newer). It detects your agent, such as Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, or Windsurf, and copies the skill into the folder that agent reads. Add `-g` to install it for all your projects, or `-a <agent>` to choose the agent. By default the CLI sends anonymous usage telemetry; set `DISABLE_TELEMETRY=1` to turn it off. InkExplain itself collects nothing.

Without Node.js, copy the folder `skills/inkexplain/` into your agent's skills folder yourself; [Supported environments](#supported-environments) lists them.

## Use

Ask for InkExplain by name, or describe the task and let your agent pick the skill up. In Claude Code run `/inkexplain`; in Codex use `$inkexplain`.

```text
/inkexplain Illustrate this article with four images in the Littlebox style and save them in the project.

<paste the article>
```

More prompts, for every character, mixed requests, prompt-only runs, and repairs, are in [examples/prompts.md](examples/prompts.md).

Without an image tool (Claude Code has none built in), InkExplain switches to **prompt mode**: a shot list and one ready-to-paste prompt per image, saved as `prompts.md` in your project. It never claims to have generated an image it did not.

## Supported environments

| Agent | Skill folder in a project |
|---|---|
| Claude Code | `.claude/skills/inkexplain` |
| Codex | `.agents/skills/inkexplain` |
| Cursor | `.agents/skills/inkexplain`; Cursor also reads `.claude/skills/` and `.codex/skills/` |
| Gemini CLI, GitHub Copilot, OpenCode | `.agents/skills/inkexplain` |
| Windsurf | `.windsurf/skills/inkexplain` |
| Other agents that read `SKILL.md` packages | their skills folder |

With `-g`, the CLI installs into the agent's personal folder instead (for example `~/.claude/skills/` for Claude Code and `~/.agents/skills/` for Codex).

What has been tested: the skills CLI places the skill correctly for each agent above, and Claude Code lists it and follows it (this release was exercised in Claude Code sessions with no image tool, in prompt mode). Not tested: running the skill inside Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, or Windsurf, and image generation with any image tool.

## What it does

1. **Choose a character.** An archetype fixes who performs the idea, how they move, and how the scene is drawn. With no request, InkExplain uses its own brand-neutral style, InkExplain Sketch.
2. **Extract the concept.** The core thesis and the cognitive anchors: breakpoints, handoffs, trade-offs, loops, before-and-after changes.
3. **Plan.** One image per idea, each with a structure type, a place on the composition grid, and an everyday metaphor that the character performs.
4. **Write the prompts** from the archetype's own template, in a fixed order, and generate one image per tool call when your agent can.
5. **Review and repair** every image against a shared checklist and the archetype's own: stray titles, misspelled labels, crowded scenes, off-model characters.
6. **Save and report** to `assets/<article-slug>-…/` in your workspace, with a short delivery report.

It suits technical articles, product and architecture explanations, workflows, comparisons, course material, and code. [docs/walkthroughs.md](docs/walkthroughs.md) follows four examples from a snippet to the finished prompt: a Rust deadlock drawn by Ferris, a Go channel by the Go Gopher, an async Python loop by Littlebox, and a binary search by Stickman. Modes, output conventions, and the command-line prompt helper are in [docs/usage.md](docs/usage.md).

## Characters

An archetype fixes who performs the idea, how they move, and how the scene is drawn. InkExplain Sketch is the default; every other archetype is chosen by name. Archetypes never mix inside one image.

<!-- inkexplain:archetypes:start -->
| Archetype | Category | Style summary | Legal status |
|---|---|---|---|
| InkExplain Sketch (`ink`, default) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Stickman (`stickman`) | `house-style` | InkExplain's own recurring stick figure: a bold black marker line, a round head with two dot eyes, and bendy limbs that act out the idea on a pure white page, with at most one vermilion accent. | `experimental` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on a pure white page that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tolva |
| Seal (`seal`) | `mascot` | A product-neutral white seal in a plain navy cap and deep-blue hoodie, always logo-free, performing the idea in sparse article sketches. | `active` · No separate character license recorded; the pack text is MIT as part of InkExplain · Sealos (original mascot image) |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 · Renee French |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP · Larry Ewing |
<!-- inkexplain:archetypes:end -->

`active` archetypes are ready to use. `experimental` ones are selected only by name and flagged in every delivery. Aliases, motion rules, style sheets, credits, and restrictions for each are in [routing.md](skills/inkexplain/references/routing.md), generated from the registry [registry.json](skills/inkexplain/registry.json). Littlebox draws on a pure white page unless you ask for warm off-white, pale sky blue, pale lavender, or a light color of your own.

## Example gallery

Renders shown with their archetype.

| Littlebox | Ferris | Seal |
|---|---|---|
| ![Handoff path: Littlebox passes a sealed card from input to ready](examples/gallery/en/littlebox/04-handoff-path.png) | ![Sort by purpose: Ferris sorts material with its claws](examples/gallery/en/ferris/02-sort-by-purpose.png) | ![Information well: the seal draws ideas up from a well](examples/gallery/en/seal/05-information-well.png) |
| **OpenClaw** | **Go Gopher** | **Xiaohei** |
| ![Idea press: the OpenClaw mascot works a press](examples/gallery/en/openclaw/06-idea-press.png) | ![Trust bridge: the gopher lays planks across a gap](examples/gallery/en/gopher/08-trust-bridge.png) | ![One fish, many uses: Xiaohei saws a source fish into an insight, a quote, and an example](examples/gallery/en/xiaohei/03-one-fish-many-uses.png) |

<!-- inkexplain:gallery-credits:start -->
Littlebox is adapted from okooo5km's 5km Littlebox Illustrations (MIT). Ferris by Karen Rustad Tolva (CC0). The Go gopher was designed by Renee French (CC BY 4.0). The OpenClaw mascot comes from the OpenClaw project (MIT). Xiaohei is Ian's character from Ian Xiaohei Illustrations (MIT). All renders are in [examples/gallery](examples/gallery): English labels for six archetypes, Chinese labels for four. The Littlebox renders are historical examples on the pale sky-blue and lavender options; Littlebox's own default is a pure white page.
<!-- inkexplain:gallery-credits:end -->

Open the [interactive gallery](examples/gallery/index.html) in a browser to see every archetype with its motion rules, style, rights, and approved renders, to filter by category and technique, and to assemble a prompt for your own idea with one-click copy. It is a single file that works from a checkout with no server and no network.

Stickman is InkExplain's own character. Its reference sheet below is hand-built vector art, not an AI render; no render of Stickman has been reviewed yet.

<p align="center">
  <img src="skills/inkexplain/references/archetypes/stickman/pose-sheet.png" alt="Stickman reference sheet: the same stick figure in eight poses (carry, pull, push, point, weigh, bridge, stack, shrug) and five brow expressions." width="70%">
</p>

## Adding New Characters and Animation Styles

```bash
npm run archetype:add -- --id example-fox --name "Example Fox"
```

One command writes the registry entry, the five-file pack, a credit, an example prompt, and the regenerated documents. It checks the whole result before it writes anything and never overwrites a file. The new archetype starts `experimental`, and whatever it cannot know, such as who holds the rights, is marked `UNRESOLVED` or `TODO` instead of being guessed; the checks refuse to promote a pack while a marker remains. The full walkthrough, with the rights questions to answer first, is in [docs/adding-an-archetype.md](docs/adding-an-archetype.md).

## Limitations

- InkExplain ships no image model; image quality depends on the tool your agent uses, and no image tool was available while this release was prepared.
- Image models misspell labels, non-Latin scripts most of all. Keep labels short and review them.
- InkExplain Sketch has no reviewed sample renders, and Stickman is `experimental`: its pack and reference sheet are complete, but no render has been reviewed, so each delivery says so. The gallery images are copies from the projects InkExplain builds on; none was generated for this project.
- Third-party archetypes carry their owners' terms, and not every right is settled: [docs/provenance.md](docs/provenance.md) lists what is still open, including the Seal's source mascot.
- The README translations were produced with AI assistance, have not been reviewed by professional translators, and follow an earlier layout of this page, so they may lag behind it. Generated tables keep registry data in English.

## Documentation

| | |
|---|---|
| [Using InkExplain](docs/usage.md) | modes, output conventions, command-line prompt helper, customizing |
| [Code walkthroughs](docs/walkthroughs.md) | four snippets taken to a finished prompt |
| [Adding a character](docs/adding-an-archetype.md) | rights first, the scaffold, promotion, publishing samples |
| [Visual system](docs/visual-system.md) | what makes each style recognizable |
| [Architecture](docs/architecture.md) | progressive disclosure, the registry, the checks |
| [Provenance and rights record](docs/provenance.md) | where everything came from and what is still open |
| [Security](SECURITY.md) | what the skill does and does not do, and how to report a problem |
| [Contributing](CONTRIBUTING.md), [AGENTS.md](AGENTS.md) | development workflow; `npm run check` runs everything CI runs |

## Credits and license

<!-- inkexplain:credits:start -->
InkExplain builds on three earlier MIT-licensed projects: [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations) by yangchuansheng, [Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) by Ian, and [5km Littlebox Illustrations](https://github.com/okooo5km/5km-littlebox-illustrations) by okooo5km. Its gallery images are unmodified copies from the first two. Third-party characters and marks remain the property of their respective owners. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for the origins, individual character notices, and licenses.
<!-- inkexplain:credits:end -->

InkExplain is released under the [MIT License](LICENSE).
