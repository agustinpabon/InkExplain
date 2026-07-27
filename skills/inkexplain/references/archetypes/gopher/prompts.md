# Go Gopher Prompts

Archetype `gopher` (Go Gopher), status `active`; only its aliases select it. Output folder: `assets/<article-slug>-gopher/`. Every plan, generation prompt, edit prompt, and delivery report for this archetype carries the rights note at the end of this file.

## Planning fields

Use the shared shot list from `references/workflow/concept-extraction.md`. The actor is always the Go gopher, and the action is one physical action from `motion-and-acting.md`. Add:

- **Gopher state**: the posture that carries the action: focused, inspecting, pointing, carrying, sorting, bridging, repairing, guiding, stamping, marking, tuning, shielding, weighing, connecting, untangling, mapping, comparing, lifting, assembling, or steering. State change and Mini comic images list one per state or panel.
- **Reference image**: whether `gopher.png` will be attached as the identity reference.
- **Rights note**: the note at the end of this file, once per plan.

## Generation prompt

Replace every bracketed field and write one prompt per image. When the image tool accepts reference images, attach `references/archetypes/gopher/gopher.png` as an identity reference, never as a layout to copy, and keep the reference sentence; otherwise delete it.

```text
Generate one standalone [16:9] horizontal article illustration.

Style: sparse hand-drawn article illustration on a white or very light background. Rough black hand-drawn outlines with visible human looseness, generous whitespace, one enlarged action subject, and a few low-tech supporting objects. No gradients, no shadows, no paper texture, no polished vector style, no dense infographic, no PPT slide, no UI screenshot, no poster composition.

Character: the Go gopher, simplified for an article sketch and recognizable at a glance. Preserve every marker: blue rounded upright body, rounded head/body silhouette, small rounded ears, large simple eyes, black nose, buck teeth, beige muzzle and paws, compact limbs, friendly standing posture, black outline, and white sticker-like border. Not a realistic animal, not a generic blue mascot. [Reference sentence: Match the character in the attached reference image, but not its pose or layout.]

Action: the gopher performs the central cognitive action: [specific physical action and its object], caught at its decisive moment. Its eyes, paws, muzzle, and body direction serve that action. The metaphor must lose its meaning if the gopher is removed.

Scene: [core idea in one sentence].

Structure: [Workflow / System close-up / Before and after / State change / Concept metaphor / Layers / Route map / Mini comic]. Composition: [exact positions; the gopher's body direction, paw action, and eye direction; the supporting objects; the information flow]. The gopher's action takes about 35-55% of the canvas, with generous whitespace around it.

Supporting objects: [three to six low-tech article-metaphor objects, such as maps, bridges, knots, scales, lamps, stamps, keys, envelopes, threads, signposts, levers, or a small hand-built machine].

Visible handwritten labels, copied exactly in the user's language: ["label 1", "label 2", "label 3"]. Rough handwritten text, sparse and legible; keep non-Latin scripts exactly as given, never translated. Keep labels away from the gopher's ears, eyes, nose, teeth, muzzle, paws, outline, and sticker border.

Color use: black for main strokes, objects, the gopher's outline, and labels. Gopher blue for the body, beige for the muzzle and paws. Restrained red, orange, or blue accents only for motion, stamps, warning marks, source tags, or decisive emphasis.

Constraints: one image explains one core idea. No title, no top-left heading, no structure-type text, no dense text, no clean digital font labels, no crowded nodes, no formal diagrams. No Go logo and no logo-forward composition. No text or cues suggesting official Go project affiliation, approval, sponsorship, or endorsement. No credit line, URL, or license text in the image. No mascot asset-sheet layout, no code screenshots, no IDE or terminal scenes, no UI screenshots. Nothing from other archetypes, and no copied prior composition.

Rights note: [append the rights note from this file].
```

## Edit prompts

The shared edits in `references/workflow/editing.md` apply, including title removal, text reduction, label fixes, and the preservation clause. End every edit prompt with the rights note. Gopher-specific repairs:

### gopher.png identity repair

For generic blue mascot drift, realistic animal drift, or any missing marker. Attach `references/archetypes/gopher/gopher.png` when the tool accepts reference images, and keep the reference sentence only then.

```text
Edit the image to keep the same composition, action, labels, style, aspect ratio, and unaffected objects, but repair the character so it reads as the Go gopher. [Reference sentence: Match the character in the attached reference image, but not its pose or layout.] Restore every marker: blue rounded upright body, rounded head/body silhouette, small rounded ears, large simple eyes, black nose, buck teeth, beige muzzle and paws, compact limbs, friendly standing posture, black outline, and white sticker-like border. Remove [observed drift, such as a generic blue mascot, realistic animal features, fur rendering, or polished mascot-poster rendering]. Keep the gopher's current pose and action.

Rights note: [append the rights note from this file].
```

### Strengthen the gopher's participation

```text
Regenerate this illustration with the same core idea, style, visible labels, aspect ratio, and unaffected supporting objects, but make the Go gopher perform the central cognitive action: [action]. The gopher must do the physical work that explains the idea, so the metaphor depends on it rather than on props, arrows, or labels. Keep the gopher's markers, colors, and proportions unchanged: blue rounded upright body, buck teeth, beige muzzle and paws, black outline, and white sticker-like border.

Rights note: [append the rights note from this file].
```

### Logo and endorsement repair

```text
Edit the image to remove [the Go logo / a logo-forward layout / a badge or text suggesting official Go project affiliation, approval, sponsorship, or endorsement]. Fill the area with the same white or very light background, or with a plain low-tech object that serves the metaphor. Keep the Go gopher, its action, the composition, the correct labels, the line style, the colors, and the aspect ratio unchanged. Add no logos, badges, or brand marks.

Rights note: [append the rights note from this file].
```

## Review and repair

Check every image against `references/workflow/qa-checklist.md`, then:

- The Go gopher is recognizable at a glance: blue rounded upright body, rounded head/body silhouette, small rounded ears, large simple eyes, black nose, buck teeth, beige muzzle and paws, compact limbs, friendly standing posture, black outline, and white sticker-like border.
- The gopher performs the central cognitive action; removing it breaks the metaphor.
- Sparse hand-drawn black linework on a white or very light background; gopher blue and beige only on the gopher; red, orange, or blue accents only for motion, stamps, warnings, source tags, or emphasis.
- Three to six low-tech supporting objects carry an original article metaphor.
- Two to six short handwritten labels, copied exactly, clear of the gopher's face, paws, outline, and sticker border.
- No Go logo, and nothing suggests official Go project affiliation, approval, sponsorship, or endorsement.
- The pose and layout are new, not taken from `gopher.png` or an earlier image.
- The plan, every prompt, and the delivery report carry the rights note.

| Failure | Repair |
|---|---|
| Generic blue mascot drift, realistic animal drift, an over-rendered toy, or a missing marker | "gopher.png identity repair", with `references/archetypes/gopher/gopher.png` attached when the tool accepts reference images |
| Passive or decorative gopher | "Strengthen the gopher's participation" |
| Go logo, badge, language poster, brand ad, or endorsement wording | "Logo and endorsement repair" |
| The front-facing pose of `gopher.png`, an earlier image's composition, or a reused metaphor | Keep the core idea and the working labels; invent a new physical metaphor with a different main object and gopher action |
| UI screenshots, IDE or terminal scenes, code screenshots, formal diagrams, dense PPT-like infographics, or poster layouts | Regenerate as a low-tech article metaphor with the constraints restated |
| Full-sentence annotations, bilingual clutter, clean digital typography, labels crowding the gopher, or a credit line, URL, or license text drawn into the image | "Reduce text" in `references/workflow/editing.md`, keeping labels away from the ears, eyes, nose, teeth, muzzle, paws, outline, and border |
| Titles or label typos | "Remove a title" or "Fix a label" in `references/workflow/editing.md` |
| Missing rights note | Restore the rights note |
| Characters, styles, or objects from other archetypes | Regenerate with this pack only |

## Delivery notes

- Archetype: Go Gopher (`gopher`), status `active`. Folder: `assets/<article-slug>-gopher/`.
- Credit line: "The Go gopher was designed by Renee French (https://go.dev/blog/gopher) and is licensed under Creative Commons Attribution 4.0." Repeat the rights note in the report, and remind the user to credit Renee French next to any published image.
- Say whether `gopher.png` was attached as the identity reference, and name any marker that needed repair.
- Never call the images official Go artwork or imply that the Go project approved them.

## Rights note

Append this note to every generation and edit prompt, attach it to every plan, and repeat it in the delivery report:

```text
The Go gopher was designed by Renee French (https://go.dev/blog/gopher) and is licensed under Creative Commons Attribution 4.0; credit Renee French whenever these images are published. No Go logo, and no claims of official Go project affiliation, approval, sponsorship, or endorsement.
```

<!-- [stage] docs(archetypes/gopher): balance prompt weights between character and network diagrams -->
