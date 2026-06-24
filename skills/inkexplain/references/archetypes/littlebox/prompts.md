# Littlebox Prompts

Archetype `littlebox` (Littlebox), status `active`. Output folder: `assets/<article-slug>-littlebox/`. Every plan, generation prompt, edit prompt, and delivery report for this archetype carries the rights note at the end of this file.

## Planning fields

Use the shared shot list from `references/workflow/concept-extraction.md`, plus:

- **Littlebox state**: always `closed`.
- **Background**: pale sky blue or lavender (`#E3F2FD` or `#E6E6FA`), assigned for the whole set before any prompt is written and kept balanced (see `style.md`).
- **Composition family**: one from `motion-and-acting.md`.
- **Visual metaphor**: the physical box action, such as "folds a large sheet into a small parcel".
- **Rights note**: the note below, attached to the plan.

## Generation prompt

Replace every bracketed field; one prompt per image.

```text
Generate one standalone [16:9] horizontal article illustration.

Style: minimalist hand-drawn illustration on a flat [pale sky blue background #E3F2FD / pale lavender background #E6E6FA]. Bold marker illustration, chunky brush-pen style, fat-tipped black marker lines, not thin pen lines, very thick black outlines, dry brush texture with tiny gaps in ink coverage, organic rough edges, natural line weight variation, imperfect boxes and wobbly folds, warm handmade feel. Keep the set consistent: same stroke thickness, ink roughness, handwritten label feel, and Littlebox proportions. Generous whitespace, sparse and strange but clear. No gradients, shadows, paper texture, polished vector style, ruler-straight geometry, auto-traced edges, or thresholded or posterized bitmap look.

Character: Littlebox, a compact, squat closed paper-box character in front-left three-quarter view. White or near-white body as negative space, not tan cardboard, kraft brown, beige, or shaded material. The front panel is the largest visible face; one narrower side panel and the closed top lid are visible. Two calm black dot eyes centered on the upper-middle front panel. Tiny thin legs under the front panel. No mouth, smile, eyebrows, blush, costume, or accessories.
Littlebox state: closed. The top flaps meet cleanly along one central front-to-back seam. Exactly one narrow amber seam tape #F59E0B runs along that seam; its small front tab hangs over the top front lip with an irregular sawtooth / jagged torn cut, usually 2-3 little teeth. Preserve the jagged front tab as the main tape cue.
Arms: at most two side-seam twig arms, one from the left side seam and one from the right: thin black curved branch-like strokes with no hands, gloves, fingers, or sleeves, never emerging from the front face, lower body, lid, eyes, or props. Send extra targets to external trays, slots, tags, falling slips, paths, stacks, or parcels instead of adding limbs.

Action: staying closed, Littlebox performs the core conceptual action: [physical box action], caught at its decisive moment.

Scene: [core idea in one sentence].

Composition: [composition family]. [Positions of Littlebox and two to four supporting elements, and what Littlebox does with which.] Spread elements across the canvas horizontally and vertically. Littlebox takes about 35%-55% of the canvas and stays compact and squat; separate props handle compression, redirection, bridging, or output packages. Flow paths and arrows are amber, curved, and lighter than Littlebox's black outline.

Supporting objects: [two to four low-tech objects].

Visible handwritten labels, copied exactly in the user's language: ["label 1", "label 2", "label 3"]. Short, legible, separated, drawn as rough handwritten black marker strokes that match the linework. Copy non-Latin scripts exactly; do not translate them.

Color: black #000000 for strokes, the Littlebox outline, objects, and labels; amber #F59E0B for the single seam tape and, away from the tape, flow or motion marks; coral #E85D75 only for a warning, stamp, error, result, or final emphasis. Use accents sparingly.

Constraints: one image, one core idea. No title, top-left title, or structure-type text. No formal PPT diagram, dense explainer, UI screenshot, logistics logo, cute mascot poster, realistic cardboard render, or clean vector box icon. No open box, raised flap, half-open lid, cutaway, visible interior, back-hinged lid, laptop/toolbox/chest/pizza-box lid, or tray, bucket, or mailbox opening. No third arm, lower arm, or tail-like helper line. No clean digital font labels. Do not stretch the Littlebox body.

Rights note: [append the rights note from this file].
```

## Edit prompts

The shared edits in `references/workflow/editing.md` apply; for identity drift, fill "Repair character identity" with the Character block above. End every edit prompt with the rights note. Littlebox-specific repairs:

### Make Littlebox active

```text
Regenerate the image with the same core idea, background, palette, and sparse marker style, but make Littlebox perform the central conceptual action: physically collect, seal, sort, carry, spill, bridge, redirect, or transform the idea through side-seam twig arms and external props. Preserve the canonical closed paper-box model: front-left three-quarter view, dot eyes on the front panel, tiny legs under the front panel, at most two side-seam twig arms, and exactly one amber seam tape with a jagged torn front tab.

Rights note: [append the rights note from this file].
```

### Reduce diagram feeling

```text
Regenerate as a loose hand-drawn article illustration instead of a formal diagram. Remove grid-like alignment, excessive arrows, boxes-within-boxes, and title text. Keep one enlarged closed Littlebox action, only 2-4 supporting elements, and one loose amber motion path instead of black arrows.

Rights note: [append the rights note from this file].
```

## Review and repair

Check every image against `references/workflow/qa-checklist.md`, then:

- One clean, flat `#E3F2FD` or `#E6E6FA` background; a set keeps sky blue and lavender balanced.
- The closed paper-box character is recognizable, with at least five markers from `identity.md`, including the single amber seam tape and its jagged torn front tab.
- Littlebox is the active operator, using at most two side-seam twig arms and external props.
- Outlines and labels share the same thick, rough, dry-brush marker; three to six handwritten labels in the user's language.
- Littlebox covers about 35%-55% of the canvas; elements spread across both axes.
- Amber only on the tape and on separate flow marks lighter than the black outline; coral only on a warning, stamp, result, or decisive emphasis.
- The plan, every prompt, and the delivery report carry the rights note.

Any failure mode in `identity.md`, anything under Avoid in `style.md`, or a label veto under Labels in `style.md` fails the image.

| Failure | Repair |
|---|---|
| Passive or too ordinary Littlebox | "Make Littlebox active", with a more physical box action |
| Too complex | Delete objects until Littlebox and two to four supports remain |
| Too cute: a smile, costume, or mascot look | Stress the dot eyes and deadpan face; no smile, no costume |
| Too diagrammatic, large black arrows carry the flow, or accents dominate the black marker drawing | "Reduce diagram feeling"; enlarge one action, loosen the alignment, and replace black arrows with one loose amber motion path |
| Open box, wrong tape (missing, too wide, smooth tab, amber patches), or wrong arms | The shared "Repair character identity", filled with the Character block above, with explicit closed-only, jagged front-tab seam-tape, and side-seam twig-arm wording |
| Arm count wrong | Move extra categories into external props |
| Body stretched, or the composition depends on opening the box | Move the action into a separate prop; keep Littlebox compact and closed |
| Style drift: thin, smooth, or vector lines | Regenerate with the prompt's Style block, stressing rough hand-drawn marker labels and dry-brush linework |
| Textured, shaded, or scenic background, or one color overused across a set without a thematic reason | Regenerate on the flat background assigned in the plan, and rebalance the set |
| Wrong, crowded, or typeset labels | "When text fails" under Labels in `style.md` |
| Missing rights note or credit | Restore the rights note |

## Delivery notes

- Archetype: Littlebox (`littlebox`), status `active`. Folder: `assets/<article-slug>-littlebox/`.
- Repeat the rights note in the report: credit okooo5km or the 5km Littlebox Illustrations project in derived documentation (see this archetype's `rights.md`).
- List each image's background, so the set's balance shows and re-renders keep it.
- A strong image makes the reader think "That box is doing the idea."

## Rights note

Append this note to every generation and edit prompt, attach it to every plan, and repeat it in the delivery report:

```text
Littlebox is adapted from 5km Littlebox Illustrations by okooo5km (MIT), inspected at commit 37cd93e. Credit okooo5km or the 5km Littlebox Illustrations project in any documentation derived from it. The credit belongs in plans, reports, and documentation, not in the image: draw no credit text, signature, or logo.
```

<!-- [stage] initial prompts -->
