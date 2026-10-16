<p align="center">
  <img src="assets/brand/inkexplain-hero.svg" alt="InkExplain: ideas made visual. A tangle of scribbles passes through a hand-cranked funnel and comes out as a clear light-bulb sketch." width="100%">
</p>

# InkExplain

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/agustinpabon/InkExplain/actions/workflows/ci.yml/badge.svg)](https://github.com/agustinpabon/InkExplain/actions/workflows/ci.yml)
[![Security: NVIDIA SkillSpector](https://img.shields.io/badge/Security-SkillSpector%20Passed-brightgreen)](SECURITY.md)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D22-brightgreen)](package.json)

*Ideas made visual.*

Turn complex ideas into beautiful, consistent hand-drawn illustrations with AI.

<!-- inkexplain:languages:start -->
**English** | [Español](./readmes/README.es.md) | [Português](./readmes/README.pt.md) | [Deutsch](./readmes/README.de.md) | [Français](./readmes/README.fr.md) | [简体中文](./readmes/README.zh.md) | [繁體中文](./readmes/README.zh-Hant.md) | [한국어](./readmes/README.ko.md) | [日本語](./readmes/README.ja.md) | [العربية](./readmes/README.ar.md) | [Русский](./readmes/README.ru.md) | [Türkçe](./readmes/README.tr.md) | [Українська](./readmes/README.uk.md)
<!-- inkexplain:languages:end -->

InkExplain is a visual-reasoning skill for AI agents. Give it an article, a document, a code snippet, or a single idea: it extracts the ideas worth drawing, turns each one into a physical action a character performs, and writes prompts that keep a whole series consistent. When your agent has an image-generation tool, it also generates, reviews, and saves the images.

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

# Cursor (personal skills; use .cursor/skills/ inside a project to scope it)
mkdir -p ~/.cursor/skills
cp -R skills/inkexplain ~/.cursor/skills/
```

Cursor also loads skills from the Claude Code and Codex folders, so a copy in either one is enough there.

The planned public home of this repository is `agustinpabon/inkexplain`. It is not published yet; once it is, the [skills CLI](https://skills.sh) should be able to install it with:

```bash
npx skills add agustinpabon/inkexplain --skill inkexplain
```

## Use

In Codex, invoke the skill as `$inkexplain`. In Cursor, type `/` in Agent chat and pick `inkexplain`. In Claude Code and other hosts, ask for InkExplain by name or describe the task; the agent loads the skill when the request matches its description.

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

## From Code to Hand-Drawn Metaphor (Walkthroughs)

InkExplain works on code as readily as on prose. Hand `$inkexplain` a snippet or a bug report and name an archetype: it finds the one idea worth drawing, turns it into a physical action that an actor performs, and assembles a prompt for your image model. Each walkthrough shows the input, the metaphor InkExplain extracts, the archetype that draws it, and the finished prompt.

The prompts are what prompt mode returns. Each follows its archetype's own template: the style, character, and rights-note blocks are the template's, unchanged, and only the bracketed fields are filled. Paste a prompt into your image tool and set the aspect ratio. If the tool has a negative-prompt field (Midjourney: `--no`), paste the negative prompt there; Flux front ends usually have none, and the prompt's Constraints paragraph covers the same ground.

### 1. A mutex deadlock in Rust, drawn by Ferris

**Input.** Two threads take the same two locks in opposite order. Each holds one and waits forever for the other.

```rust
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

fn main() {
    let lock_a = Arc::new(Mutex::new(0));
    let lock_b = Arc::new(Mutex::new(0));

    let (a, b) = (Arc::clone(&lock_a), Arc::clone(&lock_b));
    let first = thread::spawn(move || {
        let _a = a.lock().unwrap(); // holds A...
        thread::sleep(Duration::from_millis(50));
        let _b = b.lock().unwrap(); // ...and waits for B
        println!("first thread got both locks");
    });

    let (a, b) = (Arc::clone(&lock_a), Arc::clone(&lock_b));
    let second = thread::spawn(move || {
        let _b = b.lock().unwrap(); // holds B...
        thread::sleep(Duration::from_millis(50));
        let _a = a.lock().unwrap(); // ...and waits for A
        println!("second thread got both locks");
    });

    first.join().unwrap();
    second.join().unwrap();
    println!("done");
}
```

```text
$inkexplain Use Ferris. Prompt mode: one image for the deadlock in this code, labels in English.

<paste the code>
```

| | |
|---|---|
| **Core idea** | Two threads each hold one lock and wait for the other's, so neither can move on. |
| **Structure** | Concept metaphor |
| **Actor and action** | Ferris braces, one claw clamped on key A in lock A, the other straining toward lock B |
| **Metaphor** | A submarine airlock hatch with two key slots. One crab holds key A and waits for key B; the other holds key B and waits for key A. Both are frozen mid-reach under a flashing warning light. |
| **Archetype** | `ferris`: Rust's crab, in sparse hand-drawn black ink with rust-red accents |

Each thread is a crab, each `Mutex` is a key slot, and `lock()` is a claw reaching for a key the other crab will not let go of. Taking the locks in one agreed order (A, then B) is the fix, and a natural second image.

<details>
<summary>Complete prompt, aspect ratio, and negative prompt</summary>

```text
Generate one standalone 16:9 horizontal article illustration.

Style: sparse hand-drawn article illustration on a clean white or near-white background. Rough black linework with visible human looseness, generous whitespace, one enlarged action subject, and a few low-tech supporting objects. No gradients, no shadows, no paper texture, no polished vector style, no dense infographic, no PPT slide, no UI screenshot, no poster composition.

Character: Ferris, the crab mascot, simplified for a sparse article sketch. Keep these cues together: a compact orange/rust-red crab body, a broad crab shell silhouette, two visible claws, small legs, two eyes or eyestalk eyes, and active body language tied to the idea. Recognizable but simple: not a generic crab, beach crab, or seafood icon, and not an over-detailed mascot rendering.

Action: Ferris is bracing and performs the central action: clamping a key marked A in the left lock of a two-lock hatch while its other claw strains toward the right lock, where a second, identical Ferris clamps the key marked B, caught at its decisive moment. Ferris's claws, eyes, shell angle, and body direction point at the action. The metaphor must lose its meaning if Ferris is removed.

Scene: Two threads each hold one lock and wait for the other's, so neither can ever move on.

Composition: Concept metaphor. A round submarine hatch with two key slots sits in the center, slot A on the left and slot B on the right. One Ferris stands on each side facing the hatch, mirrored, each clamping its own key in its own slot with one claw and straining the other claw toward the opposite slot, the two reaching claws stopping short of each other in the middle. A small red warning light flashes above the hatch with two short motion marks. The flow runs inward from both sides and stops at the hatch. Ferris's action takes about 35-55% of the canvas, with generous whitespace around it.

Supporting objects: a two-key release lock set into the round hatch and a red warning light, drawn as plain objects and used as a metaphor for failure mode.

Labels: rough handwritten labels, copied exactly in the user's language and script, never translated: ["lock A", "lock B", "waiting"]. Two to six labels, placed near objects, paths, or gates and away from Ferris's eyes, claws, legs, and shell.

Color use: black for main strokes, objects, Ferris's details, and labels. Orange or rust-red for Ferris and one selected action emphasis. Red only for warning flags, motion marks, stamps, or decisive emphasis.

Constraints: one core idea only. No title, no structure-type text, no sentences, no clean digital font labels, no crowded nodes or arrows. No Rust or Cargo logos, no official marks or badges, no endorsement wording, no official Rust diagram layout. No code screenshots and no IDE, terminal, or UI scenes. Do not trace or recreate existing Ferris artwork, poses, or asset sheets; invent a fresh scene. Draw no text other than the labels; the rights note below is not image text.

Rights note: Ferris the Rustacean was created by Karen Rustad Tolva and dedicated to the public domain (CC0) via rustacean.net; keep this credit with published images. No Rust or Cargo logos, and no claims of official Rust project affiliation or endorsement.
```

```text
Aspect ratio: 16:9
Negative prompt: Rust or Cargo logos and official badges, official Rust diagram layouts, code, and UI scenes, a generic crab or seafood icon in place of Ferris, detailed mascot rendering or polished vector style, title, heading, or caption text, slide, infographic, flowchart, or dashboard look, crowded nodes and arrows, gradients, drop shadows, paper texture, 3D rendering, watermarks
```

</details>

### 2. Blocked senders on an unbuffered Go channel, drawn by the Go Gopher

**Input.** Four workers send results over an unbuffered channel to one slow consumer. Every send waits for a receive, so the workers spend their time blocked behind the consumer, and they would block forever if it stopped reading.

```go
package main

import (
	"fmt"
	"sync"
	"time"
)

func main() {
	results := make(chan int) // unbuffered: every send waits for a receive
	var wg sync.WaitGroup

	for worker := 1; worker <= 4; worker++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for job := 0; job < 3; job++ {
				results <- id*100 + job // blocks until the consumer is ready
			}
		}(worker)
	}

	go func() { wg.Wait(); close(results) }()

	for r := range results {
		time.Sleep(200 * time.Millisecond) // slow consumer: one parcel at a time
		fmt.Println("handled", r)
	}
}
```

```text
$inkexplain Use the Go Gopher. Prompt mode: one image for why the workers in this code keep waiting, labels in English.

<paste the code>
```

| | |
|---|---|
| **Core idea** | A slow receiver at a one-parcel hatch makes every sender wait, so the whole line stalls. |
| **Structure** | Workflow |
| **Actor and action** | The gopher holds a parcel against a hatch that is still occupied while a second gopher on the far side takes out one parcel at a time |
| **Metaphor** | A conveyor belt of parcels ends at a hatch with room for one. The sender gopher cannot hand its parcel over; the sleepy receiver gopher lifts out one at a time. |
| **Archetype** | `gopher`: the Go gopher, credited to Renee French, in sparse hand-drawn black ink with its own blue and beige |

The hatch is the unbuffered channel, which holds nothing and hands a value straight from sender to receiver. Each parcel waiting on the belt is a goroutine blocked on `results <- v`, and the receiver is the consumer loop. A buffered channel would add a small tray in front of the hatch, which is a different picture.

<details>
<summary>Complete prompt, aspect ratio, and negative prompt</summary>

```text
Generate one standalone 16:9 horizontal article illustration.

Style: sparse hand-drawn article illustration on a white or very light background. Rough black hand-drawn outlines with visible human looseness, generous whitespace, one enlarged action subject, and a few low-tech supporting objects. No gradients, no shadows, no paper texture, no polished vector style, no dense infographic, no PPT slide, no UI screenshot, no poster composition.

Character: the Go gopher, simplified for an article sketch and recognizable at a glance. Preserve every marker: blue rounded upright body, rounded head/body silhouette, small rounded ears, large simple eyes, black nose, buck teeth, beige muzzle and paws, compact limbs, friendly standing posture, black outline, and white sticker-like border. Not a realistic animal, not a generic blue mascot.

Action: the gopher performs the central cognitive action: holding a wooden parcel against a one-parcel hatch that is still occupied, while a second, identical gopher on the far side lifts out one parcel at a time, caught at its decisive moment. Its eyes, paws, muzzle, and body direction serve that action. The metaphor must lose its meaning if the gopher is removed.

Scene: A slow receiver at a one-parcel hatch makes every sender wait, so the whole line stalls.

Structure: Workflow. Composition: A conveyor belt runs in from the left edge toward a one-parcel hatch in the middle of the canvas. The sending gopher stands at the end of the belt, leaning toward the hatch with both paws holding a wooden parcel against it, eyes on the hatch, with three more parcels waiting in a line behind it on the belt. On the far side of the hatch the receiving gopher slouches in a slow, droopy posture, one paw lifting a single parcel out and the other propping up its chin. An output tray at the right edge holds one parcel. The flow runs left to right and stalls at the hatch. The gopher's action takes about 35-55% of the canvas, with generous whitespace around it.

Supporting objects: a conveyor belt, four wooden parcels, a one-parcel hatch, and an output tray.

Visible handwritten labels, copied exactly in the user's language: ["workers", "one slot", "consumer"]. Rough handwritten text, sparse and legible; keep non-Latin scripts exactly as given, never translated. Keep labels away from the gopher's ears, eyes, nose, teeth, muzzle, paws, outline, and sticker border.

Color use: black for main strokes, objects, the gopher's outline, and labels. Gopher blue for the body, beige for the muzzle and paws. Restrained red, orange, or blue accents only for motion, stamps, warning marks, source tags, or decisive emphasis.

Constraints: one image explains one core idea. No title, no top-left heading, no structure-type text, no dense text, no clean digital font labels, no crowded nodes, no formal diagrams. No Go logo and no logo-forward composition. No text or cues suggesting official Go project affiliation, approval, sponsorship, or endorsement. No credit line, URL, or license text in the image. No mascot asset-sheet layout, no code screenshots, no IDE or terminal scenes, no UI screenshots. Nothing from other archetypes, and no copied prior composition.

Rights note: The Go gopher was designed by Renee French (https://go.dev/blog/gopher) and is licensed under Creative Commons Attribution 4.0; credit Renee French whenever these images are published. No Go logo, and no claims of official Go project affiliation, approval, sponsorship, or endorsement.
```

```text
Aspect ratio: 16:9
Negative prompt: the Go logo and logo-forward layouts, UI, IDE, terminal, and code screenshots, language posters and mascot asset sheets, fur, 3D, or polished vector rendering, title, heading, or caption text, slide, infographic, flowchart, or dashboard look, crowded nodes and arrows, gradients, drop shadows, paper texture, watermarks
```

</details>

### 3. A blocked event loop in async Python, drawn by Littlebox

**Input.** An `async def` route handler that reads and parses a large file synchronously. It never `await`s, so the single event-loop thread is busy for the whole read and every other request waits. In Node.js the same bug is `fs.readFileSync` or a long synchronous loop inside an `async` handler.

```python
import json
from fastapi import FastAPI

app = FastAPI()


@app.get("/report")
async def report():
    with open("sales.json") as f:  # synchronous file read
        rows = json.load(f)  # CPU-bound parse of a large file
    return {"total": sum(r["amount"] for r in rows)}
```

```text
$inkexplain Use Littlebox. Prompt mode: one image for why every request stalls while this handler runs, labels in English.

<paste the code>
```

| | |
|---|---|
| **Core idea** | One clerk who stops to count a huge heap of coins by hand leaves every waiting request standing in line. |
| **Structure** | Pressure and overflow |
| **Actor and action** | Littlebox braces both twig arms under a heap of loose coins that blocks the service window, lid shut |
| **Metaphor** | A post office with one clerk. The clerk is the event loop, the coin heap is the blocking call, and each waiting ticket slip is a request. |
| **Archetype** | `littlebox`: a closed paper box in thick rough marker on flat pale blue, adapted from okooo5km's Littlebox |

Littlebox draws itself plus two to four supporting elements, so the queue is three plain ticket slips on an amber path rather than a crowd. The fix is to move the work off the loop, for example with `await asyncio.to_thread(...)`, or a process pool for CPU-bound work.

<details>
<summary>Complete prompt, aspect ratio, and negative prompt</summary>

```text
Generate one standalone 16:9 horizontal article illustration.

Style: minimalist hand-drawn illustration on a flat pale sky blue background #E3F2FD. Bold marker illustration, chunky brush-pen style, fat-tipped black marker lines, not thin pen lines, very thick black outlines, dry brush texture with tiny gaps in ink coverage, organic rough edges, natural line weight variation, imperfect boxes and wobbly folds, warm handmade feel. Keep the set consistent: same stroke thickness, ink roughness, handwritten label feel, and Littlebox proportions. Generous whitespace, sparse and strange but clear. No gradients, shadows, paper texture, polished vector style, ruler-straight geometry, auto-traced edges, or thresholded or posterized bitmap look.

Character: Littlebox, a compact, squat closed paper-box character in front-left three-quarter view. White or near-white body as negative space, not tan cardboard, kraft brown, beige, or shaded material. The front panel is the largest visible face; one narrower side panel and the closed top lid are visible. Two calm black dot eyes centered on the upper-middle front panel. Tiny thin legs under the front panel. No mouth, smile, eyebrows, blush, costume, or accessories.
Littlebox state: closed. The top flaps meet cleanly along one central front-to-back seam. Exactly one narrow amber seam tape #F59E0B runs along that seam; its small front tab hangs over the top front lip with an irregular sawtooth / jagged torn cut, usually 2-3 little teeth. Preserve the jagged front tab as the main tape cue.
Arms: at most two side-seam twig arms, one from the left side seam and one from the right: thin black curved branch-like strokes with no hands, gloves, fingers, or sleeves, never emerging from the front face, lower body, lid, eyes, or props. Send extra targets to external trays, slots, tags, falling slips, paths, stacks, or parcels instead of adding limbs.

Action: staying closed, Littlebox performs the core conceptual action: bracing both twig arms under an enormous external heap of loose coins while its lid stays shut, caught at its decisive moment.

Scene: One clerk who stops to count a huge heap of coins by hand leaves every waiting request standing in line.

Composition: Pressure and overflow. A plain service counter with one window slot stands on the right. Littlebox stands in front of it, braced under a huge heap of loose coins that rests on both side-seam twig arms, so the heap blocks the window; the heap is the largest prop. Three plain paper ticket slips wait in a line on one curved amber path that runs in from the left edge and stops at the window slot. One coral stamp mark sits on the first ticket slip. Spread elements across the canvas horizontally and vertically. Littlebox takes about 35%-55% of the canvas and stays compact and squat; separate props handle compression, redirection, bridging, or output packages. Flow paths and arrows are amber, curved, and lighter than Littlebox's black outline.

Supporting objects: a service counter with one window slot, a huge heap of loose coins, and three paper ticket slips waiting in line.

Visible handwritten labels, copied exactly in the user's language: ["requests", "one clerk", "counting coins"]. Short, legible, separated, drawn as rough handwritten black marker strokes that match the linework. Copy non-Latin scripts exactly; do not translate them.

Color: black #000000 for strokes, the Littlebox outline, objects, and labels; amber #F59E0B for the single seam tape and, away from the tape, flow or motion marks; coral #E85D75 only for a warning, stamp, error, result, or final emphasis. Use accents sparingly.

Constraints: one image, one core idea. No title, top-left title, or structure-type text. No formal PPT diagram, dense explainer, UI screenshot, logistics logo, cute mascot poster, realistic cardboard render, or clean vector box icon. No open box, raised flap, half-open lid, cutaway, visible interior, back-hinged lid, laptop/toolbox/chest/pizza-box lid, or tray, bucket, or mailbox opening. No third arm, lower arm, or tail-like helper line. No clean digital font labels. Do not stretch the Littlebox body.

Rights note: Littlebox is adapted from 5km Littlebox Illustrations by okooo5km (MIT), inspected at commit 37cd93e. Credit okooo5km or the 5km Littlebox Illustrations project in any documentation derived from it. The credit belongs in plans, reports, and documentation, not in the image: draw no credit text, signature, or logo.
```

```text
Aspect ratio: 16:9
Negative prompt: an open, half-open, or cutaway box, realistic cardboard or a clean vector box icon, cute mascot, sticker, or delivery-company looks, thin, ruler-straight, or auto-traced lines, title, heading, or caption text, slide, infographic, flowchart, or dashboard look, crowded nodes and arrows, gradients, drop shadows, paper texture, 3D rendering, UI or code screenshots, logos, watermarks
```

</details>

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
| **OpenClaw** | **Go Gopher** | **Xiaohei** |
| ![Idea press: the OpenClaw mascot works a press](examples/gallery/en/openclaw/06-idea-press.png) | ![Trust bridge: the gopher lays planks across a gap](examples/gallery/en/gopher/08-trust-bridge.png) | ![One fish, many uses: Xiaohei saws a source fish into an insight, a quote, and an example](examples/gallery/en/xiaohei/03-one-fish-many-uses.png) |

Littlebox is adapted from okooo5km's 5km Littlebox Illustrations (MIT). Ferris by Karen Rustad Tolva (CC0). The Go gopher was designed by Renee French (CC BY 4.0). The OpenClaw mascot comes from the OpenClaw project (MIT). Xiaohei is Ian's character from Ian Xiaohei Illustrations (MIT). All renders are in [examples/gallery](examples/gallery): English labels for six archetypes, Chinese labels for four.

To browse them, open the [interactive gallery](examples/gallery/index.html) in a browser. It lists all eight archetypes with their motion rules, style, rights, and approved renders; filters them by category and technique; and assembles a prompt for your own idea with one-click copy. It is a single file that works from a checkout with no server and no network, and it lists no samples for an archetype whose renders are still pending review.

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
| Cursor | `~/.cursor/skills/inkexplain` or `.cursor/skills/inkexplain`; Cursor also reads the Claude Code and Codex folders | Generates when the agent has an image-generation tool, otherwise prompt mode. |
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
npm run build:docs     # regenerate routing.md, the README archetype tables, language selectors, and the gallery data
npm run check          # everything CI runs
```

The architecture, progressive-disclosure model, check catalog, and release process are documented in [docs/architecture.md](docs/architecture.md) and [docs/release-checklist.md](docs/release-checklist.md). Contributor and agent guidelines are in [AGENTS.md](AGENTS.md).

## Credits and license

<!-- inkexplain:credits:start -->
Third-party characters and marks remain the property of their respective owners. See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for individual character notices and licenses.
<!-- inkexplain:credits:end -->

InkExplain is released under the [MIT License](LICENSE).
