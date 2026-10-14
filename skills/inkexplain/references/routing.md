<!-- Generated from skills/inkexplain/registry.json by `npm run build:docs`. Do not edit by hand. -->

# Archetypes

An archetype fixes who performs the idea, how they move, and how the scene is drawn. Each archetype has a five-file pack under `references/archetypes/<id>/`: `rights.md`, `identity.md`, `style.md`, `motion-and-acting.md`, and `prompts.md`. Load only the packs of the archetypes you select.

## Selecting an archetype

1. Use only what the user asks for as the look of the illustrations: a style, character, or mascot ("use Ferris", "in the Littlebox style", "draw it with Tux"). Names that only appear in the article or its topic never select an archetype; an article about Linux does not select Tux.
2. Compare each requested name with the ids and aliases in the table. Ignore case, spacing, hyphens, and underscores, but match whole names only.
3. Nothing requested: use the default archetype, `ink` (InkExplain Sketch).
4. One archetype requested: use it for every image.
5. Several archetypes requested: this is a mixed request. Plan one shared core idea, then one group per archetype. Each group loads only its own pack, uses its own prompts and review, and writes to its own output folder.
6. "All archetypes", "every character", or "all styles" means every `active` archetype. Gated and experimental archetypes join only when the user names them.
7. A term listed under "Never selects" does not select any archetype. Treat it like an unknown name.
8. Unknown name: do not guess or substitute. Say which name was not recognized, offer the closest archetypes, and ask which one to use.
9. Third-party archetypes (`mascot` and `tribute-character`) carry the rights note from their `prompts.md` in every plan, prompt, and delivery report. Gated archetypes are never chosen implicitly.

## Archetype table

| Archetype | id | Category | Status | Select with | Output folder |
|---|---|---|---|---|---|
| InkExplain Sketch (default) | `ink` | `house-style` | `active` | `InkExplain Sketch`, `ink sketch`, `ink and highlighter`, `house style`, `no mascot`, `no character` | `assets/<article-slug>-illustrations/` |
| Xiaohei | `xiaohei` | `mascot` | `active` | `Xiaohei`, `小黑`, `Ian Xiaohei` | `assets/<article-slug>-xiaohei/` |
| Littlebox | `littlebox` | `tribute-character` | `active` | `Littlebox`, `小盒`, `纸盒`, `paper-box`, `carton` | `assets/<article-slug>-littlebox/` |
| Ferris | `ferris` | `mascot` | `active` | `Ferris`, `Rust mascot`, `Rust crab`, `Rustacean`, `Rust 吉祥物`, `Rust 螃蟹` | `assets/<article-slug>-ferris/` |
| Seal | `seal` | `mascot` | `active` | `Seal`, `hoodie seal`, `white seal`, `blue hoodie seal`, `海豹`, `连帽衫海豹`, `白色海豹`, `蓝色连帽衫海豹` | `assets/<article-slug>-seal/` |
| OpenClaw | `openclaw` | `mascot` | `active` | `OpenClaw`, `OpenClaw logo`, `OpenClaw mascot`, `OpenClaw 助手`, `OpenClaw 吉祥物` | `assets/<article-slug>-openclaw/` |
| Go Gopher | `gopher` | `mascot` | `active` | `Go Gopher`, `Gopher`, `golang gopher`, `Go mascot`, `Go 吉祥物`, `Gopher 吉祥物` | `assets/<article-slug>-gopher/` |
| Tux | `tux` | `mascot` | `active` | `Tux`, `Linux Mascot`, `Linux`, `Linux penguin`, `Tux penguin` | `assets/<article-slug>-tux/` |

## Categories

- `house-style`: Original to InkExplain. No third-party character; the default archetype is always a house style.
- `mascot`: A project or community mascot used with credit to its creator. No logos and no claims of affiliation or endorsement.
- `tribute-character`: A character created by a third party, drawn with credit and within the boundaries its rights record sets.
- `animation-preset`: An original motion and staging preset, such as storyboard beats, performed by a neutral actor.

## Statuses

- `active`: Ready to use. Selected by name, or by default for the default archetype.
- `experimental`: A new or unreviewed pack. Selected only by name, and every delivery says it is experimental.
- `gated-authorized`: A protected character. Used only when named and only within the user's own authorization; samples need a recorded authorization.

## Archetype packs

### InkExplain Sketch (`ink`, default)

InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea.

- Category: `house-style`. Status: `active`.
- Load, in order: `references/archetypes/ink/rights.md`, `references/archetypes/ink/identity.md`, `references/archetypes/ink/style.md`, `references/archetypes/ink/motion-and-acting.md`, `references/archetypes/ink/prompts.md`
- Output folder: `assets/<article-slug>-illustrations/`
- Motion DNA: The ink figure, a pair of hands entering the frame, or the working object itself. Signature actions: carry, sort, weigh, pull a lever, bridge a gap, untangle. Poses: the whole body leans into the load; an arc of the body reaches across the gap the idea crosses; hands enter from the frame edge to place, hold, or adjust. Timing: One decisive moment per image; mini comics use two to four beats: setup, action, result.
- Style sheet: An explainer's hand-drawn ink sketch. Canvas: 16:9 by default on a clean white background, at least 35% empty. Linework: Medium-thin black ink with a slight wobble, rounded ends, and sparse hatching. Palette: black ink, explainer blue, highlighter yellow, signal red. Avoid: mascots, logos, and franchise characters; slides, infographics, and UI; textures, gradients, and shadows; 3D or glossy vector art.
- Credit: Original to InkExplain. Rights holder: InkExplain contributors. License: MIT.
- Public samples: pending. No rendered samples yet. InkExplain Sketch is original to InkExplain; publish renders after a quality review.

### Xiaohei (`xiaohei`)

Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page.

- Category: `mascot`. Status: `active`.
- Load, in order: `references/archetypes/xiaohei/rights.md`, `references/archetypes/xiaohei/identity.md`, `references/archetypes/xiaohei/style.md`, `references/archetypes/xiaohei/motion-and-acting.md`, `references/archetypes/xiaohei/prompts.md`
- Output folder: `assets/<article-slug>-xiaohei/`
- Motion DNA: Xiaohei, the solid-black creature, as the serious operator inside the idea. Signature actions: sort, weigh, press, connect, carry, stamp. Poses: the whole black body leaning into a lever, a rope, or a press; thin legs braced under a load or mid-step along a path; white dot eyes fixed on the work, deadpan whatever happens. Timing: One decisive moment per image; mini comics use two or three beats with Xiaohei drawn the same way in every panel.
- Style sheet: A sparse hand-drawn explainer sketch in black ink. Canvas: 16:9 on a pure white page, at least 35% empty; the main subject fills about 40-60%. Linework: Thin black hand-drawn lines with a slight wobble; never vector, mechanical, or heavy outlines. Palette: black, pure white, red, orange, blue. Avoid: cute mascot, sticker, or children's-cartoon looks; commercial illustration, PPT infographics, and formal flowcharts; beige, textured, gradient, or shaded backgrounds; 3D shading, glossy eyes, and costumes.
- Credit: Xiaohei is the recurring character of Ian Xiaohei Illustrations by Ian (https://github.com/helloianneo/ian-xiaohei-illustrations), MIT License, Copyright (c) 2026 Ian, inspected at commit 4102eb8. Rights holder: Ian. License: MIT.
- Restrictions:
  - Keep the Ian Xiaohei Illustrations name or credit Ian in any documentation derived from this archetype.
  - No claims that Ian created, endorses, or is affiliated with InkExplain or the generated images.
- Public samples: pending. No InkExplain renders have been reviewed yet, and Ian's own example images are not bundled.

### Littlebox (`littlebox`)

A closed paper-box character in thick rough marker on pale sky-blue or lavender backgrounds that turns ideas into collecting, packaging, sorting, and delivering.

- Category: `tribute-character`. Status: `active`.
- Load, in order: `references/archetypes/littlebox/rights.md`, `references/archetypes/littlebox/identity.md`, `references/archetypes/littlebox/style.md`, `references/archetypes/littlebox/motion-and-acting.md`, `references/archetypes/littlebox/prompts.md`
- Output folder: `assets/<article-slug>-littlebox/`
- Motion DNA: Littlebox, a closed paper box that acts through two side-seam twig arms. Signature actions: collect, seal, sort, fold, carry, stamp. Poses: twig arms and tiny legs carry the effort while the box stays closed; both arms bracing an external pile; deadpan dot eyes whatever happens. Timing: One decisive moment per image, such as the tape pressed down or the stamp landing; mini comics use two or three beats with Littlebox closed throughout.
- Style sheet: Bold rough marker illustration with a handmade dry-brush feel. Canvas: 16:9 on one flat pale sky-blue or lavender background; Littlebox fills 35-55%. Linework: Thick, rough black marker with dry-brush gaps and wobbly folds. Palette: black, amber, coral, pale sky blue or lavender. Avoid: an open, half-open, or cutaway box; realistic cardboard or a clean vector box icon; cute mascot, sticker, or delivery-company looks; thin, ruler-straight, or auto-traced lines.
- Credit: Adapted from 5km Littlebox Illustrations by okooo5km (MIT), inspected at commit 37cd93e. Rights holder: okooo5km. License: MIT.
- Restrictions:
  - Credit okooo5km or the 5km Littlebox Illustrations project in derived documentation.
- Public samples: approved. Approved when these renders were first published; the character source is MIT-licensed by okooo5km and credited in ATTRIBUTIONS.md.

### Ferris (`ferris`)

Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues.

- Category: `mascot`. Status: `active`.
- Load, in order: `references/archetypes/ferris/rights.md`, `references/archetypes/ferris/identity.md`, `references/archetypes/ferris/style.md`, `references/archetypes/ferris/motion-and-acting.md`, `references/archetypes/ferris/prompts.md`
- Output folder: `assets/<article-slug>-ferris/`
- Motion DNA: Ferris, who performs the central action with its claws. Signature actions: clamp, sort, borrow, stamp, untangle, release. Poses: claws, eyes, and shell angle aimed at the action; one claw clamped on a compiler gate; legs braced wide while balancing a load. Timing: One decisive moment per image; mini comics use two or three beats with Ferris drawn the same way in every panel.
- Style sheet: A sparse hand-drawn article sketch. Canvas: 16:9 on a clean white or near-white page; Ferris's action fills 35-55%. Linework: Rough black linework with visible human looseness. Palette: black, orange or rust-red, red. Avoid: Rust or Cargo logos and official badges; official Rust diagram layouts, code, and UI scenes; a generic crab or seafood icon in place of Ferris; detailed mascot rendering or polished vector style.
- Credit: Ferris the Rustacean was created by Karen Rustad Tolva and dedicated to the public domain (CC0) via rustacean.net. Rights holder: Karen Rustad Tolva. License: CC0 public-domain dedication.
- Restrictions:
  - No Rust or Cargo logos.
  - No claims of official Rust project affiliation or endorsement.
- Public samples: approved. Approved with trademark-safe wording when these renders were first published; Ferris is CC0, credited to Karen Rustad Tolva.

### Seal (`seal`)

A product-neutral white seal in a plain navy cap and deep-blue hoodie, always logo-free, performing the idea in sparse article sketches.

- Category: `mascot`. Status: `active`.
- Load, in order: `references/archetypes/seal/rights.md`, `references/archetypes/seal/identity.md`, `references/archetypes/seal/style.md`, `references/archetypes/seal/motion-and-acting.md`, `references/archetypes/seal/prompts.md`
- Output folder: `assets/<article-slug>-seal/`
- Motion DNA: Seal, the product-neutral hoodie seal, as the central operator. Signature actions: inspect, repair, shield, bridge, weigh, untangle. Poses: flippers, eyes, body, cap, hoodie, and tail turned toward the action; compact legs planted under a lift or a carry; calm, careful focus while inspecting or weighing. Timing: One decisive moment per image; mini comics use two or three beats with Seal consistent and active.
- Style sheet: A sparse hand-drawn article sketch. Canvas: 16:9 on a clean white or near-white page; Seal's action fills 35-55%. Linework: Loose black hand-drawn lines with visible human looseness. Palette: black, white, navy and deep blue, red/orange. Avoid: logos, emblems, wave or cloud marks, and badges; brand or product names and endorsement cues; plush-toy or over-detailed mascot rendering; formal diagrams, UI, and code screenshots.
- Credit: A product-neutral hoodie seal derived from a historical Sealos mascot image, which is not bundled. Rights holder: Sealos (original mascot image). License: No separate character license recorded; the pack text is MIT as part of InkExplain.
- Restrictions:
  - Keep the seal logo-free: no cap, chest, or body logos, emblems, wave marks, or text badges.
  - Do not present the seal as an official Sealos mascot or as a product endorsement.
- Public samples: approved. Approved for preserved hoodie identity and logo-free output when these renders were first published.

### OpenClaw (`openclaw`)

The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches.

- Category: `mascot`. Status: `active`.
- Load, in order: `references/archetypes/openclaw/rights.md`, `references/archetypes/openclaw/identity.md`, `references/archetypes/openclaw/style.md`, `references/archetypes/openclaw/motion-and-acting.md`, `references/archetypes/openclaw/prompts.md`
- Output folder: `assets/<article-slug>-openclaw/`
- Motion DNA: OpenClaw, the red logo mascot, as the active operator of the concept. Signature actions: grip, sort, bridge, stamp, untangle, repair. Poses: one claw grips the loose idea, thread, or key; both claw-like arms hold two parts together; the antennae lean and the cyan pupils point at the decisive object. Timing: One decisive moment per image; mini comics use two or three beats with all six markers in every panel.
- Style sheet: A sparse hand-drawn article sketch. Canvas: 16:9 on a clean white or near-white background with generous whitespace. Linework: Loose black linework with visible hand-drawn looseness. Palette: black, red, cyan. Avoid: product posters, launch graphics, and logo showcases; UI screenshots, IDE or terminal scenes, and code screenshots; formal diagrams and PPT-like infographics; over-rendered toys or logo icons.
- Credit: The OpenClaw mascot comes from the OpenClaw project (https://github.com/openclaw/openclaw), MIT License, Copyright (c) 2026 OpenClaw Foundation, reviewed at commit c14793d. Rights holder: OpenClaw Foundation. License: MIT.
- Restrictions:
  - No claims of official OpenClaw affiliation or endorsement.
  - No product posters, UI screenshots, terminal scenes, or code screenshots.
- Public samples: approved. Approved for logo identity, source and license review, and archetype isolation when these renders were first published; the OpenClaw project is MIT-licensed.

### Go Gopher (`gopher`)

The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims.

- Category: `mascot`. Status: `active`.
- Load, in order: `references/archetypes/gopher/rights.md`, `references/archetypes/gopher/identity.md`, `references/archetypes/gopher/style.md`, `references/archetypes/gopher/motion-and-acting.md`, `references/archetypes/gopher/prompts.md`
- Output folder: `assets/<article-slug>-gopher/`
- Motion DNA: The Go gopher, who performs the central action. Signature actions: inspect, point, sort, bridge, shield, weigh. Poses: the friendly standing posture turned toward the action; a pointing paw stretched toward the useful turn; a shield stance planted in front of a fragile idea. Timing: One decisive moment per image; mini comics use two or three beats with the gopher identical across panels.
- Style sheet: A sparse hand-drawn article sketch. Canvas: 16:9 on a white or very light background; the gopher's action fills 35-55%. Linework: Rough black outlines with visible human looseness; the gopher keeps its black outline and white sticker-like border. Palette: black, gopher blue, beige, red, orange, or blue accents. Avoid: the Go logo and logo-forward layouts; UI, IDE, terminal, and code screenshots; language posters and mascot asset sheets; fur, 3D, or polished vector rendering.
- Credit: The Go gopher was designed by Renee French (https://go.dev/blog/gopher) and is licensed under Creative Commons Attribution 4.0. Rights holder: Renee French. License: CC BY 4.0.
- Restrictions:
  - Credit Renee French whenever generated images are published.
  - No Go logo, and no claims of official Go project affiliation, approval, sponsorship, or endorsement.
- Never selects: `go`, `blue mascot`, `animal`, `logo`
- Public samples: approved. Approved with the Renee French attribution and the CC BY 4.0 terms when these renders were first published; the credit is kept in ATTRIBUTIONS.md and next to the gallery.

### Tux (`tux`)

Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims.

- Category: `mascot`. Status: `active`.
- Load, in order: `references/archetypes/tux/rights.md`, `references/archetypes/tux/identity.md`, `references/archetypes/tux/style.md`, `references/archetypes/tux/motion-and-acting.md`, `references/archetypes/tux/prompts.md`
- Output folder: `assets/<article-slug>-tux/`
- Motion DNA: Tux, the only mascot in the frame, who performs the central action. Signature actions: point, carry, sort, bridge, repair, stamp. Poses: the seated, rounded body turned toward the work; a long black flipper pointing, pressing, or stamping on the object; eyes and beak aimed at the decisive point. Timing: One decisive moment per image; mini comics use two or three beats with Tux identical across panels.
- Style sheet: A sparse hand-drawn article sketch. Canvas: 16:9 on a white or very light background; Tux's action fills 35-55%. Linework: Rough black hand-drawn linework with visible human looseness. Palette: black, white, yellow-orange, red, orange, or blue. Avoid: distro logos, badges, and Linux Foundation logos; CLI screenshots, kernel dashboards, and product posters; generic penguin or tech-mascot rendering; gradients, shadows, and polished vector finish.
- Credit: Tux was created by Larry Ewing using The GIMP (https://isc.tamu.edu/~lewing/linux/); Linux is the registered trademark of Linus Torvalds in the U.S. and other countries. Rights holder: Larry Ewing. License: Free to use and modify with credit to Larry Ewing and The GIMP when asked.
- Restrictions:
  - No distro logos and no Linux Foundation logos.
  - No claims of endorsement, certification, compatibility, affiliation, sponsorship, or approval.
  - No product posters, CLI screenshots, web hero graphics, kernel dashboards, or operating-system marketing graphics.
- Never selects: `penguin`, `server`, `kernel`, `distro`, `distro logo`, `Linux Foundation`, `operating system`, `CLI`, `terminal`, `brand campaign`, `mascot`
- Public samples: pending. No public samples have been reviewed yet.
