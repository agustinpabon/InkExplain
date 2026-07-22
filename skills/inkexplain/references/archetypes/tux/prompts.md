# Tux Prompts

Archetype `tux` (Tux), status `active`. Output folder: `assets/<article-slug>-tux/`. Every plan, generation prompt, edit prompt, and delivery report for this archetype carries the rights note at the end of this file.

## Planning fields

Use the shared shot list from `references/workflow/concept-extraction.md`, plus:

- **Actor and action**: always Tux, acting with a verb from `motion-and-acting.md`; state exactly what Tux physically does, so the metaphor fails without it.
- **Tux state**: focused, inspecting, pointing, carrying, sorting, bridging, repairing, guiding, stamping, marking, tuning, shielding, weighing, connecting, untangling, mapping, comparing, lifting, assembling, or redirecting.
- **Rights note**: the note at the end of this file, attached to the plan.

## Generation prompt

Replace every bracketed field. One prompt per image.

```text
Generate one standalone 16:9 horizontal article illustration.

Style: sparse hand-drawn article illustration on a white or very light background. Rough black hand-drawn linework with visible human looseness, generous whitespace, one enlarged action subject, and a few low-tech supporting objects. No gradients, no shadows, no paper texture, no polished vector style, no dense infographic, no PPT slide, no UI screenshot, no poster composition.

Character: Tux, the Linux penguin, simplified for an article sketch and clearly recognizable. Preserve all of these together: glossy black rounded penguin head and body, white face eye patches, large oval eyes with dark pupils and small highlights, yellow-orange beak with two nostril dots, white oval belly, long black flippers, seated rounded posture, and oversized yellow-orange webbed feet. Tux, [state], performs the central cognitive action: [specific physical action], caught at its decisive moment. The metaphor must lose its meaning if Tux is removed.

Scene: [core idea in one sentence].

Structure: [structure type]. Composition: [exact positions, Tux's seated body direction, flipper action, eye and beak direction, the supporting objects, and the information flow]. Tux's main action fills about 35-55% of the canvas, with generous whitespace around it.

Supporting objects: [objects from the shot list, such as maps, bridges, knots, compasses, shelves, lamps, shields, stamps, keys, trails, gates, scales, buckets, envelopes, threads, lenses, hooks, stepping stones, signposts, levers, source cards, review marks, or small hand-built machines] as physical metaphors for [the article concept, such as trust, proof, review, dependency, handoff, hidden cost, failure mode, decision gate, resilience, judgment, sequencing, source context, or conceptual repair].

Visible handwritten labels, copied exactly in the user's language: ["label 1", "label 2", "label 3"]. Short, sparse, legible rough handwriting, placed away from Tux's eyes, beak, belly, flippers, and feet. Copy non-Latin scripts exactly; do not translate.

Color use: black for main strokes, objects, Tux's body, and labels; white for Tux's face patches and belly; yellow-orange only for the beak and webbed feet; restrained red, orange, or blue accents only for motion, stamps, warning marks, source tags, or decisive emphasis.

Constraints: one core idea. No title, no top-left heading, no structure-type text, no dense text, no clean digital font labels, no crowded nodes, no formal diagram, no mascot asset-sheet layout. No generic penguin, plush toy, or generic server mascot, and no static frontal logo pose. No distro logos, distro mascots, distro badges, or Linux Foundation logos. No official endorsement, approval, sponsorship, certification, or compatibility claims. No product poster, CLI screenshot, kernel dashboard, web hero graphic, or operating-system marketing graphic. No other mascots, and no copied prior composition.

Rights note: [append the rights note from this file].
```

## Edit prompts

The shared edits in `references/workflow/editing.md` apply, with Tux as the actor and the rights note appended to each. Archetype-specific repairs:

### Identity repair

```text
Edit the image to keep the same composition, action, labels, style, 16:9 aspect ratio, and unaffected objects, but repair Tux. Restore all identity markers together: glossy black rounded penguin head and body, white face eye patches, large oval eyes with dark pupils and small highlights, yellow-orange beak with two nostril dots, white oval belly, long black flippers, seated rounded posture, and oversized yellow-orange webbed feet. Remove [observed drift: generic penguin, plush toy, generic server mascot, distro mascot, or copied logo pose]. Keep Tux performing [action].

Rights note: [append the rights note from this file].
```

### Trademark-boundary repair

```text
Edit or regenerate the image with the same article idea, the same successful Tux identity and action, the same sparse 16:9 article-illustration style, the same visible labels copied exactly in the user's language, and the same unaffected supporting objects, but remove trademark-boundary failures: official endorsement, affiliation, sponsorship, approval, certification, or compatibility claims; Linux Foundation campaign framing; Linux Foundation logos; distro logos, distro mascots, distro badges, distro branding, or package-manager marks; and product posters, CLI screenshots, kernel dashboards, web hero graphics, or operating-system marketing graphics. Keep any visible use of the word "Linux" factual and descriptive. Replace each removed element with a plain hand-drawn metaphor object or whitespace, and keep Tux as the action subject.

Rights note: [append the rights note from this file].
```

## Review and repair

Check every image against `references/workflow/qa-checklist.md`, then:

- Tux shows all eight markers together: glossy black rounded penguin head and body, white face eye patches, large oval eyes with dark pupils and small highlights, yellow-orange beak with two nostril dots, white oval belly, long black flippers, seated rounded posture, and oversized yellow-orange webbed feet.
- Tux performs the central cognitive action; covering Tux breaks the metaphor.
- White or very light background, rough black linework, and generous whitespace.
- Color stays black and white for Tux, yellow-orange only on the beak and feet, and sparse red, orange, or blue accents that clarify the action.
- Supporting objects are physical article metaphors; any Linux-flavored prop stays abstract.
- No logos; no endorsement, certification, or compatibility wording; no product-output look.
- Tux's pose is fresh and built around the action, and the scene does not repeat an earlier composition.
- Labels stay clear of Tux's eyes, beak, belly, flippers, and feet.
- The plan, every prompt, and the delivery report carry the rights note.

| Failure | Repair |
|---|---|
| Generic or naturalistic penguin, plush toy, server or tech mascot, different mascot, or a missing identity marker | "Identity repair" |
| Distro logos, distro mascots, distro badges, package-manager marks, or Linux Foundation logos | "Trademark-boundary repair" |
| Endorsement, affiliation, sponsorship, approval, certification, or compatibility wording, or Linux Foundation campaign framing | "Trademark-boundary repair"; remove the wording from captions and reports too |
| Product poster, CLI screenshot, kernel dashboard, web hero graphic, or operating-system marketing graphic | "Trademark-boundary repair" |
| Passive, tiny, decorative, or removable Tux | "Strengthen participation" in `references/workflow/editing.md`, with a verb from `motion-and-acting.md` |
| Static logo pose, or a weak or reused metaphor | Keep the core idea and working labels; invent a new physical metaphor with new supporting objects and a new Tux action |
| Labels crowding Tux's eyes, beak, belly, flippers, or feet, or too much text | "Fix a label" or "Reduce text" in `references/workflow/editing.md`; move the explanation into the article text |
| Characters, styles, or objects from other archetypes | "Repair archetype leakage" in `references/workflow/editing.md` |
| A caption or report presents the image as an approved public sample or official artwork | Remove the claim; the sample decision stays pending in `registry.json` |
| Missing rights note | Restore the rights note |

## Delivery notes

- Archetype: Tux (`tux`), status `active`. Folder: `assets/<article-slug>-tux/`.
- Credit line: "Tux by Larry Ewing, created with The GIMP. Linux is the registered trademark of Linus Torvalds in the U.S. and other countries."
- Include the rights note, and report whether all eight identity markers held in each image.
- Never describe the images as official, endorsed, certified, or Linux-compatible artwork; public samples are pending (see this archetype's `rights.md`).

## Rights note

Append this note to every generation and edit prompt, attach it to every plan, and repeat it in the delivery report:

```text
Tux was created by Larry Ewing using The GIMP; credit Larry Ewing and The GIMP when asked. Linux is the registered trademark of Linus Torvalds in the U.S. and other countries. No distro logos and no Linux Foundation logos; no claims of endorsement, certification, compatibility, affiliation, sponsorship, or approval; no product posters, CLI screenshots, web hero graphics, kernel dashboards, or operating-system marketing graphics.
```

<!-- [stage] initial prompts -->
