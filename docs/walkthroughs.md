# Walkthroughs: from code to hand-drawn metaphor

InkExplain works on code as readily as on prose. Hand `$inkexplain` a snippet or a bug report and name an archetype: it finds the one idea worth drawing, turns it into a physical action that an actor performs, and assembles a prompt for your image model. Each walkthrough shows the input, the metaphor InkExplain extracts, the archetype that draws it, and the finished prompt.

The prompts are what prompt mode returns. Each follows its archetype's own template: the style, character, and rights-note blocks are the template's, unchanged, and only the bracketed fields are filled. Paste a prompt into your image tool and set the aspect ratio. If the tool has a negative-prompt field (Midjourney: `--no`), paste the negative prompt there; Flux front ends usually have none, and the prompt's Constraints paragraph covers the same ground.

These pages show prompts, not pictures. InkExplain ships no image model, so what your tool draws from them is up to the tool; a test keeps every prompt here a faithful instance of its archetype's template.

## 1. A mutex deadlock in Rust, drawn by Ferris

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

Rights note: Ferris the Rustacean was created by Karen Rustad Tölva and dedicated to the public domain (CC0) via rustacean.net; keep this credit with published images. No Rust or Cargo logos, and no claims of official Rust project affiliation or endorsement.
```

```text
Aspect ratio: 16:9
Negative prompt: Rust or Cargo logos and official badges, official Rust diagram layouts, code, and UI scenes, a generic crab or seafood icon in place of Ferris, detailed mascot rendering or polished vector style, title, heading, or caption text, slide, infographic, flowchart, or dashboard look, crowded nodes and arrows, gradients, drop shadows, paper texture, 3D rendering, watermarks
```

</details>

## 2. Blocked senders on an unbuffered Go channel, drawn by the Go Gopher

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

Character: the Go gopher, simplified for an article sketch and recognizable at a glance. Preserve every marker: blue rounded upright body, rounded head/body silhouette, small rounded ears, large simple eyes, black nose, buck teeth, beige muzzle and paws, compact limbs, friendly standing posture, and black outline. Not a realistic animal, not a generic blue mascot.

Action: the gopher performs the central cognitive action: holding a wooden parcel against a one-parcel hatch that is still occupied, while a second, identical gopher on the far side lifts out one parcel at a time, caught at its decisive moment. Its eyes, paws, muzzle, and body direction serve that action. The metaphor must lose its meaning if the gopher is removed.

Scene: A slow receiver at a one-parcel hatch makes every sender wait, so the whole line stalls.

Structure: Workflow. Composition: A conveyor belt runs in from the left edge toward a one-parcel hatch in the middle of the canvas. The sending gopher stands at the end of the belt, leaning toward the hatch with both paws holding a wooden parcel against it, eyes on the hatch, with three more parcels waiting in a line behind it on the belt. On the far side of the hatch the receiving gopher slouches in a slow, droopy posture, one paw lifting a single parcel out and the other propping up its chin. An output tray at the right edge holds one parcel. The flow runs left to right and stalls at the hatch. The gopher's action takes about 35-55% of the canvas, with generous whitespace around it.

Supporting objects: a conveyor belt, four wooden parcels, a one-parcel hatch, and an output tray.

Visible handwritten labels, copied exactly in the user's language: ["workers", "one slot", "consumer"]. Rough handwritten text, sparse and legible; keep non-Latin scripts exactly as given, never translated. Keep labels away from the gopher's ears, eyes, nose, teeth, muzzle, paws, and outline.

Color use: black for main strokes, objects, the gopher's outline, and labels. Gopher blue for the body, beige for the muzzle and paws. Restrained red, orange, or blue accents only for motion, stamps, warning marks, source tags, or decisive emphasis.

Constraints: one image explains one core idea. No title, no top-left heading, no structure-type text, no dense text, no clean digital font labels, no crowded nodes, no formal diagrams. No Go logo and no logo-forward composition. No text or cues suggesting official Go project affiliation, approval, sponsorship, or endorsement. No credit line, URL, or license text in the image. No mascot asset-sheet layout, no code screenshots, no IDE or terminal scenes, no UI screenshots. Nothing from other archetypes, and no copied prior composition.

Rights note: The Go gopher was designed by Renee French (https://go.dev/blog/gopher) and is licensed under Creative Commons Attribution 4.0 (https://creativecommons.org/licenses/by/4.0/); credit Renee French whenever these images are published. If the reference drawing gopher.png was attached, it is by Takuya Ueda (https://github.com/golang-samples/gopher-vector) under Creative Commons Attribution 3.0 (https://creativecommons.org/licenses/by/3.0/), so credit Takuya Ueda as well. No Go logo, and no claims of official Go project affiliation, approval, sponsorship, or endorsement.
```

```text
Aspect ratio: 16:9
Negative prompt: the Go logo and logo-forward layouts, UI, IDE, terminal, and code screenshots, language posters and mascot asset sheets, fur, 3D, or polished vector rendering, title, heading, or caption text, slide, infographic, flowchart, or dashboard look, crowded nodes and arrows, gradients, drop shadows, paper texture, watermarks
```

</details>

## 3. A blocked event loop in async Python, drawn by Littlebox

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
| **Archetype** | `littlebox`: a closed paper box in thick rough marker on a flat pure white page, adapted from okooo5km's Littlebox |

Littlebox draws itself plus two to four supporting elements, so the queue is three plain ticket slips on an amber path rather than a crowd. Its page is pure white unless you ask for another: add "on a pale lavender background" to the request, or `--background lavender` on the command line. The fix is to move the work off the loop, for example with `await asyncio.to_thread(...)`, or a process pool for CPU-bound work.

<details>
<summary>Complete prompt, aspect ratio, and negative prompt</summary>

```text
Generate one standalone 16:9 horizontal article illustration.

Style: minimalist hand-drawn illustration on a perfectly flat pure white background #FFFFFF. Bold marker illustration, chunky brush-pen style, fat-tipped black marker lines, not thin pen lines, very thick black outlines, dry brush texture with tiny gaps in ink coverage, organic rough edges, natural line weight variation, imperfect boxes and wobbly folds, warm handmade feel. Keep the set consistent: same background, stroke thickness, ink roughness, handwritten label feel, and Littlebox proportions. Generous whitespace, sparse and strange but clear. No gradients, shadows, paper texture, borders, frames, polished vector style, ruler-straight geometry, auto-traced edges, or thresholded or posterized bitmap look.

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

Rights note: Littlebox is adapted from 5km Littlebox Illustrations by okooo5km (MIT), inspected at commits 37cd93e and d760004. Credit okooo5km or the 5km Littlebox Illustrations project in any documentation derived from it. The credit belongs in plans, reports, and documentation, not in the image: draw no credit text, signature, or logo.
```

```text
Aspect ratio: 16:9
Negative prompt: an open, half-open, or cutaway box, realistic cardboard or a clean vector box icon, cute mascot, sticker, or delivery-company looks, thin, ruler-straight, or auto-traced lines, tinted, alternating, or mood-picked backgrounds the user did not ask for, title, heading, or caption text, slide, infographic, flowchart, or dashboard look, crowded nodes and arrows, gradients, drop shadows, paper texture, 3D rendering, UI or code screenshots, logos, watermarks
```

</details>

## 4. A binary search, drawn by Stickman

**Input.** A binary search over a sorted list. Each pass compares the middle item with the target and throws away the half that cannot hold it, so the work shrinks by half every time.

```python
def binary_search(items, target):
    low, high = 0, len(items) - 1
    while low <= high:
        mid = (low + high) // 2
        if items[mid] == target:
            return mid
        if items[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1
```

```text
$inkexplain Use a stickman. Prompt mode: one image for how this search throws away half of the list on every step, labels in English.

<paste the code>
```

| | |
|---|---|
| **Core idea** | Each comparison throws away half of what is left, so a sorted list of a million items takes about twenty steps. |
| **Structure** | Concept metaphor |
| **Actor and action** | Stickman leans back under the upper half of a sorted stack of cards and carries it away, leaving the half that can still hold the target |
| **Metaphor** | A stack of numbered index cards. The middle card is the comparison; whichever half cannot hold the target is lifted off and dropped, until one card is left. |
| **Archetype** | `stickman`: InkExplain's own stick figure, in bold black marker on pure white with one vermilion accent (`experimental` until its renders are reviewed) |

Each lifted half is one pass of the `while` loop: `mid` picks the card to compare, and `low = mid + 1` or `high = mid - 1` discards one side. The stack is never re-sorted, which is why the input must already be sorted. The vermilion accent marks the one card that is compared; a second image could show a stack of a million cards needing only about twenty lifts.

<details>
<summary>Complete prompt, aspect ratio, and negative prompt</summary>

```text
Generate one standalone 16:9 horizontal article illustration.

Style: a skilled editorial illustrator's hand-drawn explainer sketch on a perfectly flat pure white background #FFFFFF. One confident black ink brush-pen marker line, medium-bold, with slight pressure variation, tapered stroke ends, and small handmade wobbles; props drawn in the same marker, a little lighter. Sparse composition with generous whitespace: one idea, one figure, a few low-tech objects, at least 35% of the canvas empty. Line art only. No gradients, shadows, paper texture, borders, frames, polished vector style, uniform-width lines, perfect circles, or clip-art look.

Character: Stickman, the same hand-drawn stick figure in every image. Head: an open round head, one outlined circle, never filled, one head wide, drawn in a single loop whose ends overlap slightly. Face: two dot eyes, small and solid, set just below the head's midline and turned toward the action, plus at most two short brow strokes for focus, doubt, surprise, or pleasure; no mouth, nose, ears, or hair. Body: one curved spine line from the base of the head to the hips, 1.6 heads long, leaning into the action. Limbs: two-segment limbs, two arms and two legs, each a line with one soft visible bend at the elbow or knee; each arm is two heads long, attached a quarter head below the head, and reaches about mid-thigh when hanging; each leg is 2.4 heads long, so the legs are longer than the spine. Hands: none; each arm ends in a plain rounded stroke end that touches or overlaps the object it works on. Feet: foot ticks, one short stroke at the end of each leg pointing the way the figure faces. Posture: asymmetrical, weight on one leg, spine and limbs showing effort; never a stiff T-pose, a mirrored stance, or standing beside the action. Size: standing height is five heads, and the standing figure is about one third of the canvas high, larger when it bends or reaches.

Action: Stickman performs the central action: carrying the upper half of a sorted stack of numbered cards away, leaning back under its weight, caught at its decisive moment. The whole body does the work, and the metaphor must lose its meaning if Stickman is removed.

Scene: Each comparison throws away half of what is left, so a sorted list of a million items takes about twenty steps.

Composition: Concept metaphor. Pose: Carry. Expression: focused. A tall stack of numbered index cards stands left of center with its middle card sticking out a little. Stickman stands at its right side, leaning back under the upper half of the stack, which both bent arms carry away toward the right edge, where a loose pile of discarded cards waits. The lower half, with the middle card on top, stays standing. Spread elements across the canvas; the action sits in the middle third, and the figure's arms end on the object it works on.

Supporting objects: a tall stack of numbered index cards, the upper half of it being carried away, and a loose pile of discarded cards.

Visible handwritten labels, copied exactly in the user's language: ["sorted", "middle", "half gone"]. Neat handwritten print drawn with the same marker, one to three words each, placed beside the objects they name and clear of the figure. Copy non-Latin scripts exactly; do not translate them.

Color use: black ink for the figure, props, and labels; pure white for the page; one vermilion accent #E4572E only on the middle card of the standing stack, a few small marks at most. No other color.

Constraints: one image, one core idea, one figure unless the idea compares two states or is a mini comic, and then every figure is the same Stickman drawn the same way. No title, top-left heading, or structure-type text. No pictogram, restroom-sign, emoji, mascot, or children's activity-book look. No hands, fingers, shoes, clothes, hat, hair, mouth, ears, or accessories on the figure, and no name tag or logo. No slide, infographic, flowchart, dashboard, UI screenshot, or code screenshot. No clean digital font labels. Draw no text other than the labels.
```

```text
Aspect ratio: 16:9
Negative prompt: pictogram, restroom sign, emoji, mascot, cute chibi, children's activity book, clip art, vector art, uniform line width, perfect circle, hands, fingers, mittens, shoes, clothes, hat, hair, mouth, smile, nose, ears, blush, T-pose, symmetrical pose, filled head, gradient, drop shadow, 3D render, paper texture, colored background, multiple accent colors, title text, infographic, flowchart, slide, UI screenshot, logo, watermark, signature
```

</details>
