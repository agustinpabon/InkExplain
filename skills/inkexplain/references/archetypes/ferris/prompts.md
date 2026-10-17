# Ferris Prompts

Archetype `ferris` (Ferris), status `active`. Output folder: `assets/<article-slug>-ferris/`. Every plan, generation prompt, edit prompt, and delivery report for this archetype carries the rights note at the end of this file.

## Planning fields

Use the shared shot list from `references/workflow/concept-extraction.md`. The actor is always Ferris. Add:

- **Ferris state**: focused, guarding, sorting, type-checking, borrowing, compiling, inspecting, untangling, bracing, stamping, or releasing.
- **Ferris action**: the physical action Ferris performs with its claws, such as clamping a compiler gate or untangling a dependency knot.
- **Supporting objects**: one or two from the pool in this archetype's `motion-and-acting.md`, drawn logo-free.
- **Rights note**: the note below, stated once at the top of the plan.

## Generation prompt

Replace every bracketed field. Keep one prompt per image.

```text
Generate one standalone [16:9 horizontal] article illustration.

Style: sparse hand-drawn article illustration on a clean white or near-white background. Rough black linework with visible human looseness, generous whitespace, one enlarged action subject, and a few low-tech supporting objects. No gradients, no shadows, no paper texture, no polished vector style, no dense infographic, no PPT slide, no UI screenshot, no poster composition.

Character: Ferris, the crab mascot, simplified for a sparse article sketch. Keep these cues together: a compact orange/rust-red crab body, a broad crab shell silhouette, two visible claws, small legs, two eyes or eyestalk eyes, and active body language tied to the idea. Recognizable but simple: not a generic crab, beach crab, or seafood icon, and not an over-detailed mascot rendering.

Action: Ferris is [focused / guarding / sorting / type-checking / borrowing / compiling / inspecting / untangling / bracing / stamping / releasing] and performs the central action: [specific physical action], caught at its decisive moment. Ferris's claws, eyes, shell angle, and body direction point at the action. The metaphor must lose its meaning if Ferris is removed.

Scene: [core idea in one sentence].

Composition: [structure type]. [Exact positions, Ferris's body direction, what Ferris's claws do with which object, and which way the flow runs.] Ferris's action takes about 35-55% of the canvas, with generous whitespace around it.

Supporting objects: [one or two low-tech, Rust-themed props, such as ownership tags, a borrow rope, a lifetime clock, a compiler gate, a type-check stamp, a safety net, an unsafe warning flag, a trait stamp, a dependency knot, a crate stack, a release lock, or a review gate], drawn as plain objects and used as a metaphor for [trust / proof / safety / review / dependency / handoff / hidden cost / failure mode / decision gate / resilience].

Labels: rough handwritten labels, copied exactly in the user's language and script, never translated: ["label 1", "label 2", "label 3"]. Two to six labels, placed near objects, paths, or gates and away from Ferris's eyes, claws, legs, and shell.

Color use: black for main strokes, objects, Ferris's details, and labels. Orange or rust-red for Ferris and one selected action emphasis. Red only for warning flags, motion marks, stamps, or decisive emphasis.

Constraints: one core idea only. No title, no structure-type text, no sentences, no clean digital font labels, no crowded nodes or arrows. No Rust or Cargo logos, no official marks or badges, no endorsement wording, no official Rust diagram layout. No code screenshots and no IDE, terminal, or UI scenes. Do not trace or recreate existing Ferris artwork, poses, or asset sheets; invent a fresh scene. Draw no text other than the labels; the rights note below is not image text.

Rights note: [append the rights note from this file].
```

## Edit prompts

The shared edits in `references/workflow/editing.md` apply, including title removal, text reduction, label fixes, and the preservation clause. End every edit prompt with the rights note. Ferris-specific repairs:

### Strengthen Ferris's participation

```text
Regenerate this illustration with the same core idea, article-sketch style, labels, 16:9 aspect ratio, and unaffected supporting objects, but make Ferris perform the central action with its claws: [action, for example clamping a compiler gate, sorting ownership tags, or untangling a dependency knot]. The metaphor must depend on Ferris's action, not on props, arrows, or labels beside Ferris. Keep Ferris recognizable: a compact orange/rust-red crab body, a broad crab shell silhouette, two visible claws, small legs, two eyes or eyestalk eyes, and active body language.

Rights note: [append the rights note from this file].
```

### Repair Ferris's identity

```text
Edit this image to keep the same composition, action, labels, style, 16:9 aspect ratio, and unaffected objects, but repair the character so it reads as Ferris. Keep the simplified article-sketch style and restore Ferris's cues: a compact orange/rust-red crab body, a broad crab shell silhouette, two visible claws, small legs, two eyes or eyestalk eyes, and active body language. Remove [observed drift: generic crab, beach crab, seafood icon, random red animal, or over-detailed mascot rendering].

Rights note: [append the rights note from this file].
```

### Repair the trademark boundary

```text
Edit this image to keep the same core idea, Ferris's identity and action, composition, labels, 16:9 aspect ratio, and article metaphor, but repair the trademark boundary. Remove or redraw [observed problem: Rust or Cargo logos, a logo-forward layout, bundled Rust marks, official badges, endorsement or "official" wording, official logo arrangements, or a traced asset-sheet pose]. Keep the Rust-themed objects as plain, logo-free article metaphors, such as ownership tags, borrow ropes, compiler gates, crate stacks, or release locks.

Rights note: [append the rights note from this file].
```

## Review and repair

Check every image against `references/workflow/qa-checklist.md`, then:

- Ferris is recognizable: a compact orange or rust-red crab body, a broad crab shell silhouette, two visible claws, small legs, two eyes or eyestalk eyes, and active body language.
- Ferris performs the central action; removing Ferris breaks the metaphor.
- Ferris is simplified to match the sparse sketch, not rendered as a detailed mascot.
- Clean white or near-white background and rough black linework; orange or rust-red only on Ferris and one action emphasis; red only on warnings, motion, stamps, or decisive emphasis.
- One or two Rust-themed supporting objects, drawn plain and logo-free.
- No Rust or Cargo logos, official marks or badges, or endorsement wording anywhere in the image.
- The scene is an original article metaphor, not traced or pose-matched from existing Ferris artwork.
- Two to six short handwritten labels, clear of Ferris's eyes, claws, legs, and shell silhouette.
- The plan, every prompt, and the delivery report carry the rights note.

| Failure | Repair |
|---|---|
| Passive Ferris placement | "Strengthen Ferris's participation" |
| Generic-crab drift or over-detailed mascot rendering | "Repair Ferris's identity" |
| Rust-logo misuse or official-affiliation cues | "Repair the trademark boundary" |
| Source-asset tracing | Regenerate with the same core idea but a new low-tech metaphor and a new Ferris pose and action; keep the working labels, aspect ratio, and sparse line style |
| An official Rust diagram layout, code screenshot, or IDE, terminal, or UI scene | Regenerate as a low-tech article metaphor with the constraints restated |
| Full-sentence annotations, bilingual clutter, clean digital typography, or labels crowding Ferris | "Reduce text" in `references/workflow/editing.md`; keep two to six labels away from Ferris and move the explanation into the article text |
| Titles or label typos | "Remove a title" or "Fix a label" in `references/workflow/editing.md` |
| Missing rights note | Restore the rights note |
| Characters, styles, or objects from other archetypes | Regenerate with this pack only |

## Delivery notes

- Archetype: Ferris (`ferris`), status `active`. Folder: `assets/<article-slug>-ferris/`.
- Credit: Ferris the Rustacean was created by Karen Rustad Tölva and dedicated to the public domain (CC0) via rustacean.net.
- Repeat the rights note in the delivery report.
- If the user plans to publish, remind them to keep the credit and to present the images without Rust or Cargo logos or any claim of official Rust project affiliation or endorsement.

## Rights note

Append this note to every generation and edit prompt, attach it to every plan, and repeat it in the delivery report:

```text
Ferris the Rustacean was created by Karen Rustad Tölva and dedicated to the public domain (CC0) via rustacean.net; keep this credit with published images. No Rust or Cargo logos, and no claims of official Rust project affiliation or endorsement.
```
