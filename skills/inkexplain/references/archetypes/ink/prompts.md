# InkExplain Sketch Prompts

Archetype `ink` (InkExplain Sketch), the default archetype. Output folder: `assets/<article-slug>-illustrations/`.

## Planning fields

Use the shared shot list from `references/workflow/concept-extraction.md`, plus:

- **Actor**: the ink figure, hands, or the working object.
- **Highlight**: the one label or object that gets the highlighter yellow swipe.
- **Flow**: what explainer blue marks (an arrow, a path, motion lines), or "none".

## Generation prompt

Replace every bracketed field. Keep one prompt per image.

```text
Generate one standalone [16:9] illustration that explains a single idea.

Style: an explainer's hand-drawn sketch on a clean white background. Black ink line art with a slight natural wobble, medium-thin consistent strokes, rounded line ends, sparse hatching, and lots of empty white space. Restrained color: almost everything is black ink; explainer blue (#2F6FED) only for arrows, paths, and motion lines; one loose, translucent highlighter yellow (#FFD84D) swipe behind the single most important label or object; signal red (#E5484D) only for a problem or warning, if there is one. No paper texture, no gradients, no shadows, no glossy vector style, no 3D, no infographic or slide look, no UI, no logos, no mascot.

Actor: [choose one: the ink figure, a minimal anonymous person with a round head, a single-stroke body, and thin limbs, with no facial features except optional dot eyes and no clothing details | one or two hand-drawn hands entering from the edge of the frame | the working object itself]. The actor performs the central action: [action], caught at its decisive moment. The idea must not work without this action.

Scene: [core idea in one sentence].

Structure: [structure type]. Composition: [where each element sits, which way the flow runs, and what the actor does with which object]. The main action fills about half the canvas; at least a third stays empty.

Supporting objects: [one to four low-tech objects].

Handwritten labels in neat print, copied exactly: ["label 1", "label 2", "label 3"]. The label ["key label"] sits on the highlighter yellow swipe. No other text: no title, no caption, no structure-type text, no sentences.
```

## Edit prompts

The shared edits in `references/workflow/editing.md` apply. Archetype-specific repairs:

### Restore the palette

```text
Edit the image to restore the InkExplain Sketch palette: black ink line art on a clean white background, explainer blue only on arrows and paths, one translucent highlighter yellow swipe behind "[key label]", and no other color. Remove fills, gradients, and tinted backgrounds. Preserve the composition, the actor, and the labels.
```

### Simplify the ink figure

```text
Regenerate with the same scene, but draw the ink figure as a minimal anonymous person: a round head, a single-stroke body, and thin limbs, with no hair, no clothes, and no facial details beyond two small dot eyes. Keep the action, objects, labels, and style unchanged.
```

## Review and repair

Check every image against `references/workflow/qa-checklist.md`, then:

- Black ink on a clean white background makes up nearly all of the image.
- Explainer blue appears only on arrows, paths, or motion lines.
- Exactly one highlighter yellow swipe (two at most in a comparison), behind the key label or object.
- Signal red appears only on a problem or warning, if at all.
- The actor is the ink figure (round head, single-stroke body, thin limbs), a pair of hands, or the working object, and it performs the action.
- The ink figure looks the same in every image of the series.

| Failure | Repair |
|---|---|
| Extra colors, color fills, or a tinted background | "Restore the palette" |
| Highlighter yellow scattered over several labels, or missing | "Restore the palette" |
| The ink figure gains features, hair, clothes, or a logo, or turns into a mascot | "Simplify the ink figure" |
| A recognizable franchise character or brand appears | Regenerate with the constraints restated |
| Typeset labels, titles, or a passive actor | The shared edits in `references/workflow/editing.md` |

## Delivery notes

- Archetype: InkExplain Sketch (`ink`), the default archetype.
- Folder: `assets/<article-slug>-illustrations/`.
- Note which label carries the highlighter swipe in each image, so a re-render can keep it.
