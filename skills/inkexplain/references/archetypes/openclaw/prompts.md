# OpenClaw Prompts

Archetype `openclaw` (OpenClaw), status `active`. Output folder: `assets/<article-slug>-openclaw/`. Every plan, generation prompt, edit prompt, and delivery report for this archetype carries the rights note at the end of this file.

## Planning fields

Use the shared shot list from `references/workflow/concept-extraction.md`, plus:

- **OpenClaw state**: focused, inspecting, gripping, sorting, bridging, tuning, stamping, carrying, mapping, connecting, shielding, comparing, marking, untangling, weighing, guiding, assembling, or repairing.
- **OpenClaw action**: the verb and object from `motion-and-acting.md` that perform the central cognitive action, plus the body pattern that shows it (claw grip, antenna scan, cyan focus, and so on).
- **Rights note**: the note at the end of this file, attached to the plan.

## Generation prompt

Generate each image separately and replace every bracketed field.

```text
Generate one standalone 16:9 horizontal article illustration that explains a single idea.

Style: a sparse hand-drawn article sketch on a clean white or near-white background. Loose black linework with visible hand-drawn looseness, generous whitespace, and a low-density composition. Restrained red tied to OpenClaw's body; restrained cyan tied to the pupils or one small action emphasis. Sparse handwritten labels, no full-sentence annotations.

Character: OpenClaw, the red logo-derived mascot, simplified for an article sketch: red round body, side claw-like arms, two antennae, black eyes, cyan pupils, and short legs. All six markers stay clear. Not a generic red mascot, not a generic robot, not an over-rendered toy or a logo icon.

Action: OpenClaw is [state], [physical action that performs the central cognitive action, for example "gripping a loose thread and tying it to the next stepping stone"], caught at its decisive moment. Its claws, antennae, cyan pupils, and short legs all serve this action. The metaphor must lose its meaning if OpenClaw is removed.

Scene: [core idea in one sentence].

Composition: [structure type]. [Where OpenClaw is, what it does with which object, and which way the flow runs.] The main action fills about half the canvas; at least a third stays empty.

Supporting objects: [three to six small low-tech metaphor objects, such as a map, bridge, knot, lamp, scale, stamp, key, or envelope].

Handwritten labels, copied exactly in the user's language: ["label 1", "label 2", "label 3"]. Keep labels away from OpenClaw's face, antennae, claws, pupils, and legs.

Color use: black for line art, objects, and labels; red on OpenClaw's body and claws; cyan in the pupils and on [one small action emphasis, or nothing else].

Constraints: one core idea; two to six short labels. No title, heading, structure-type text, or sentences, and no clean digital typography. No text besides the quoted labels: no credit line, URL, watermark, or logo. No product poster, launch graphic, or logo showcase; no UI screenshot, IDE or terminal scene, or code screenshot; no formal diagram or PPT-like infographic. An original composition: do not copy earlier images or trace a logo pose.

Rights note: [append the rights note from this file].
```

## Edit prompts

The shared edits in `references/workflow/editing.md` apply. Close every edit prompt, shared or archetype-specific, with the shared preservation clause and the rights note. OpenClaw-specific repairs:

### Repair OpenClaw identity

```text
Edit the provided image. Keep the same composition, action, labels, style, 16:9 aspect ratio, and unaffected objects, but repair the character so it reads as OpenClaw: red round body, side claw-like arms, two antennae, black eyes, cyan pupils, and short legs, simplified in loose black hand-drawn linework. Restore [missing markers]. Remove [observed drift: generic red mascot, generic robot, plush toy, logo blob, over-rendered toy, or poster-mascot framing].

Rights note: [append the rights note from this file].
```

### Strengthen OpenClaw's participation

```text
Regenerate this illustration with the same core idea, labels, 16:9 aspect ratio, sparse hand-drawn style, and unaffected supporting objects, but make OpenClaw perform the central cognitive action: [one verb from inspect, grip, sort, bridge, tune, stamp, carry, map, connect, shield, compare, mark, untangle, weigh, guide, assemble, repair] [object]. The metaphor must depend on OpenClaw's action; OpenClaw must not stand beside the concept while props, arrows, or labels carry the meaning. Keep the red round body, side claw-like arms, two antennae, black eyes, cyan pupils, and short legs.

Rights note: [append the rights note from this file].
```

### Turn a poster or screen into an article sketch

```text
Regenerate this illustration as a sparse hand-drawn article sketch with the same core idea, labels, and 16:9 aspect ratio. Remove [the product poster, launch graphic, logo showcase, UI screenshot, IDE or terminal scene, or code screenshot]. Replace it with one physical article metaphor built from a few small low-tech objects, such as [maps, bridges, knots, lamps, scales, stamps, keys, gates, envelopes, threads, or a small hand-built machine], operated by OpenClaw with its red round body, side claw-like arms, two antennae, black eyes, cyan pupils, and short legs. Keep the clean white background, loose black linework, and restrained red and cyan.

Rights note: [append the rights note from this file].
```

## Review and repair

Check every image against `references/workflow/qa-checklist.md`, then:

- OpenClaw is unmistakable: red round body, side claw-like arms, two antennae, black eyes, cyan pupils, and short legs are all present.
- OpenClaw performs the central cognitive action with a physical verb (inspect, grip, sort, bridge, tune, stamp, carry, map, connect, shield, compare, mark, untangle, weigh, guide, assemble, or repair); removing it would break the metaphor.
- Clean white or near-white background, loose black hand-drawn linework, low density, and generous whitespace.
- Red stays restrained and tied to OpenClaw's body; cyan stays in the pupils or one small action emphasis.
- Supporting objects are small low-tech article metaphors, not product imagery.
- Labels are handwritten and clear of OpenClaw's face, antennae, claws, pupils, and legs.
- The scene is an original article metaphor, not a gallery scene, an earlier composition, or a traced logo pose.
- The restrictions hold: no affiliation or endorsement cue, and no product poster, UI screenshot, terminal scene, or code screenshot.

| Failure | Repair |
|---|---|
| Generic red mascot, robot, plush toy, logo blob, or different mascot; a missing marker; an over-rendered toy or logo icon | "Repair OpenClaw identity" |
| Passive, tiny, or removable OpenClaw | "Strengthen OpenClaw's participation" |
| Product poster, launch graphic, logo showcase, UI promotion, repository banner, UI screenshot, IDE or terminal scene, code screenshot, formal diagram, or PPT-like infographic | "Turn a poster or screen into an article sketch" |
| Weak or copied metaphor: a gallery scene, an earlier composition, or a traced logo pose | Keep the core idea and the working labels; invent a new physical metaphor and change the main object and OpenClaw's action |
| Full sentences, bilingual clutter, clean digital labels, or labels crowding OpenClaw | "Reduce text" in `references/workflow/editing.md`, with two to six labels kept clear of OpenClaw's face, antennae, claws, pupils, and legs; move the explanation into the article text |
| A top-left title or wrong labels | "Remove a title" or "Fix a label" in `references/workflow/editing.md` |
| Characters, objects, or styles from other archetypes | Regenerate with this pack only; style summary: "a sparse sketch in loose black linework on white, with red only on OpenClaw's body and cyan in its pupils" |
| Missing rights note or credit, or an affiliation or endorsement cue | Restore the rights note and remove the cue |

## Delivery notes

- Archetype: OpenClaw (`openclaw`), status `active`. Folder: `assets/<article-slug>-openclaw/`.
- Repeat the rights note in the report, and state each image's identity status: all six markers present, or which marker is weak.
- When the user plans to publish, remind them to keep the credit and to imply no official OpenClaw affiliation or endorsement.

## Rights note

Append this note to every generation and edit prompt, attach it to every plan, and repeat it in the delivery report. It guides use; it is never drawn as text.

```text
The OpenClaw mascot comes from the OpenClaw project (https://github.com/openclaw/openclaw), MIT License, Copyright (c) 2026 OpenClaw Foundation, reviewed at commit c14793d. These are independent article illustrations: no claims of official OpenClaw affiliation or endorsement, and no product posters, UI screenshots, terminal scenes, or code screenshots.
```

<!-- [stage] refactor(archetypes/openclaw): refine pipeline and conveyor belt scene prompts -->
