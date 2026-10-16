# Stickman Prompts

Archetype `stickman` (Stickman), status `experimental`: the pack has not been tried with real renders yet, and every plan and delivery report says so. Output folder: `assets/<article-slug>-stickman/`.

## Planning fields

Use the shared shot list from `references/workflow/concept-extraction.md`. The actor is always Stickman. Add:

- **Pose**: one from the pose vocabulary in `motion-and-acting.md`, different from the previous image of the set.
- **Expression**: calm, focused, puzzled, startled, or pleased.
- **Accent**: the one object, mark, or label that gets the vermilion accent, or "none".
- **Series contract**: the Character block below, copied unchanged into every prompt of the set.

## Generation prompt

Replace every bracketed field; one prompt per image. The prompt is plain English and tool-agnostic. Keep the Character block word for word in every image of a series: it is the identity contract.

```text
Generate one standalone [16:9] horizontal article illustration.

Style: a skilled editorial illustrator's hand-drawn explainer sketch on a perfectly flat pure white background #FFFFFF. One confident black ink brush-pen marker line, medium-bold, with slight pressure variation, tapered stroke ends, and small handmade wobbles; props drawn in the same marker, a little lighter. Sparse composition with generous whitespace: one idea, one figure, a few low-tech objects, at least 35% of the canvas empty. Line art only. No gradients, shadows, paper texture, borders, frames, polished vector style, uniform-width lines, perfect circles, or clip-art look.

Character: Stickman, the same hand-drawn stick figure in every image. Head: an open round head, one outlined circle, never filled, one head wide, drawn in a single loop whose ends overlap slightly. Face: two dot eyes, small and solid, set just below the head's midline and turned toward the action, plus at most two short brow strokes for focus, doubt, surprise, or pleasure; no mouth, nose, ears, or hair. Body: one curved spine line from the base of the head to the hips, 1.6 heads long, leaning into the action. Limbs: two-segment limbs, two arms and two legs, each a line with one soft visible bend at the elbow or knee; each arm is two heads long, attached a quarter head below the head, and reaches about mid-thigh when hanging; each leg is 2.4 heads long, so the legs are longer than the spine. Hands: none; each arm ends in a plain rounded stroke end that touches or overlaps the object it works on. Feet: foot ticks, one short stroke at the end of each leg pointing the way the figure faces. Posture: asymmetrical, weight on one leg, spine and limbs showing effort; never a stiff T-pose, a mirrored stance, or standing beside the action. Size: standing height is five heads, and the standing figure is about one third of the canvas high, larger when it bends or reaches.

Action: Stickman performs the central action: [specific physical action], caught at its decisive moment. The whole body does the work, and the metaphor must lose its meaning if Stickman is removed.

Scene: [core idea in one sentence].

Composition: [structure type]. Pose: [pose from the pose vocabulary, different from the previous image]. Expression: [calm, focused, puzzled, startled, or pleased]. [Positions of Stickman and one to three supporting objects, and what Stickman does with which.] Spread elements across the canvas; the action sits in the middle third, and the figure's arms end on the object it works on.

Supporting objects: [one to three low-tech objects drawn in the same marker, a little lighter].

Visible handwritten labels, copied exactly in the user's language: ["label 1", "label 2", "label 3"]. Neat handwritten print drawn with the same marker, one to three words each, placed beside the objects they name and clear of the figure. Copy non-Latin scripts exactly; do not translate them.

Color use: black ink for the figure, props, and labels; pure white for the page; one vermilion accent #E4572E only on [the one object, mark, or label that carries the idea, or "none"], a few small marks at most. No other color.

Constraints: one image, one core idea, one figure unless the idea compares two states or is a mini comic, and then every figure is the same Stickman drawn the same way. No title, top-left heading, or structure-type text. No pictogram, restroom-sign, emoji, mascot, or children's activity-book look. No hands, fingers, shoes, clothes, hat, hair, mouth, ears, or accessories on the figure, and no name tag or logo. No slide, infographic, flowchart, dashboard, UI screenshot, or code screenshot. No clean digital font labels. Draw no text other than the labels.
```

### Negative prompt

For tools with a negative-prompt field, or Midjourney's `--no` parameter, pass this list as well. Tools without one, such as DALL-E 3, rely on the Constraints line above.

```text
pictogram, restroom sign, emoji, mascot, cute chibi, children's activity book, clip art, vector art, uniform line width, perfect circle, hands, fingers, mittens, shoes, clothes, hat, hair, mouth, smile, nose, ears, blush, T-pose, symmetrical pose, filled head, gradient, drop shadow, 3D render, paper texture, colored background, multiple accent colors, title text, infographic, flowchart, slide, UI screenshot, logo, watermark, signature
```

### Tool notes

- Reference image: if the tool accepts one, attach `pose-sheet.png` through its reference-image input as an identity and proportion reference only. The prompt's Character block still goes in every prompt.
- Midjourney: append `--ar 16:9 --style raw`, then `--no` followed by the negative prompt, comma-separated.
- Flux: use the generation prompt as written at a 16:9 size; add the negative prompt only where the front end supports one.
- DALL-E 3 and GPT image models: request the landscape size; the Constraints line replaces the negative prompt.

## Edit prompts

The shared edits in `references/workflow/editing.md` apply; for identity drift, "Restore the figure" below is the Stickman form of "Repair character identity". Stickman-specific repairs:

### Make Stickman act

```text
Regenerate the image with the same core idea, labels, pure white background, and black marker style, but make Stickman perform the central action with its whole body: [physical action, for example leaning back on a rope, setting the last block on a tower, or holding back a funnel with both arms]. Use the pose [pose from the vocabulary]. The metaphor must depend on Stickman's action, not on arrows or labels beside it.
```

### Restore the figure

```text
Regenerate this illustration with the same composition, action, labels, and style, but redraw Stickman exactly like this: an open round head drawn as one unfilled loop; two small solid dot eyes and at most two short brow strokes, with no mouth, nose, ears, or hair; one curved spine line; two arms and two legs as two-segment limbs with one soft bend each, five heads tall in total; no hands, each arm ending on the object it works on; one short foot tick at the end of each leg. Remove [observed drift: hands, a mouth, hair, clothes, shoes, a filled head, a stiff or mirrored pose, a second figure]. Preserve everything else.
```

### Restore the line and the page

```text
Edit the image to restore the Stickman style: one confident black marker line with slight pressure variation and tapered ends, on a perfectly flat pure white background, with no fills, gradients, shadows, or texture, and at most one small vermilion accent #E4572E on [the one object or label that carries the idea]. Remove every other color. Preserve the composition, the figure, and the labels.
```

### Vary the pose

```text
Regenerate with the same core idea and the same Stickman, but change the pose to [pose from the vocabulary] and the main prop to [new low-tech object], so this image no longer repeats the previous one. Keep the proportions, the face, the line weight, and the labels unchanged.
```

## Review and repair

Check every image against `references/workflow/qa-checklist.md`, then:

- A pure white page and a black marker line, with at least 35% of the canvas empty; at most one vermilion accent, only on the object or label that carries the idea.
- Stickman is recognizable: open round head, two dot eyes, curved spine line, two-segment limbs, and foot ticks, all present, with no hands and no mouth.
- The figure is about five heads tall, with the same head size, line weight, and face as every other image in the set.
- The pose is asymmetrical and the whole body works; removing the figure breaks the metaphor.
- The pose and the main object differ from the other images in the set.
- Two to six short handwritten labels in the user's language, none on the figure, and no title.
- The delivery report says the pack is experimental.

Any failure mode in `identity.md`, anything under Avoid in `style.md`, or a label problem under Labels in `style.md` fails the image.

| Failure | Repair |
|---|---|
| Passive, standing beside the action, T-pose, or mirrored stance | "Make Stickman act", with a more physical action |
| Hands, a mouth, hair, clothes, shoes, a filled head, or proportion drift | "Restore the figure" |
| Extra colors, fills, shadows, gradients, a tinted page, or smooth uniform lines | "Restore the line and the page" |
| The same pose or main object as the previous image | "Vary the pose" |
| An emoji, mascot, pictogram, or activity-book look | "Restore the figure", stressing the dot eyes, no mouth, and bent, uneven limbs |
| Several figures, or figures that differ | Regenerate with one figure; for a comparison, repeat the same Character block for both |
| A title, structure-type text, or crowded labels | "Remove a title" or "Reduce text" in `references/workflow/editing.md` |
| Characters, styles, or objects from other archetypes | Regenerate with this pack only |

## Delivery notes

- Archetype: Stickman (`stickman`), status `experimental`. Folder: `assets/<article-slug>-stickman/`.
- Say in the report that the pack is experimental and has not been checked against real renders.
- List each image's pose and accent, so a re-render can keep the figure and change only what is wrong.
- Copy the Character block unchanged into each prompt of a series.
