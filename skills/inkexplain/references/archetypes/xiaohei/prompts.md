# Xiaohei Prompts

Archetype `xiaohei` (Xiaohei), status `active`. Output folder: `assets/<article-slug>-xiaohei/`. Every plan, generation prompt, edit prompt, and delivery report for this archetype carries the rights note at the end of this file.

## Planning fields

Use the shared shot list from `references/workflow/concept-extraction.md`. The actor is always Xiaohei. Add:

- **Xiaohei action**: the physical job Xiaohei performs, such as "pulls the judgment lever" or "presses a stack into one sheet".
- **Pattern**: one from `motion-and-acting.md`.
- **Accents**: which of red, orange, and blue the image needs; often only one.
- **Rights note**: the note below, attached to the plan.

## Generation prompt

Replace every bracketed field; one prompt per image. The prompt is plain English and tool-agnostic, so it works as written in DALL-E 3, GPT image models, Flux, and Midjourney.

```text
Generate one standalone [16:9] horizontal article illustration.

Style: minimalist hand-drawn explainer sketch on a pure white background. Thin black ink lines with a slight hand wobble, not mechanical, not vector, no heavy outlines. Generous whitespace: the main subject fills about 40-60% of the canvas and at least 35% stays empty. Line art with minimal fill; the only large black area is the character. No gradients, shadows, 3D shading, paper texture, or beige or grey background.

Character: Xiaohei, a small creature with a solid black body filled flat with black ink and a slightly irregular hand-drawn outline, two small white dot eyes, thin legs drawn as single black strokes, and a deadpan expression: blank, calm, completely serious. Thin single-stroke arms only if the action needs them. No mouth, smile, blush, pupils, highlights, costume, or accessories. Not cute, not a mascot sticker, not a children's cartoon.

Action: Xiaohei performs the core conceptual action: [physical job], caught at its decisive moment. Xiaohei's body and gaze point at the object it is changing. The metaphor must lose its meaning if Xiaohei is removed.

Scene: [core idea in one sentence].

Composition: [pattern]. [Positions of Xiaohei and two to four supporting objects, and what Xiaohei does with which.] Spread elements across the canvas horizontally and vertically.

Supporting objects: [two to four low-tech objects in thin line art].

Visible handwritten labels, copied exactly in the user's language: ["label 1", "label 2", "label 3"]. Short, separated, thin handwritten black strokes that match the linework. Copy non-Latin scripts exactly; do not translate them.

Color: black for the linework, Xiaohei, structure, and main labels; pure white for the page and Xiaohei's eyes; red only for a key note, problem, or result; orange only for the main flow or path; blue only for a secondary or system-state note. Use accents sparingly.

Constraints: one image, one core idea. No title, top-left heading, or structure-type text. No commercial illustration, PPT infographic, formal flowchart, course slide, UI screenshot, or complex architecture diagram. No clean digital font labels. Draw no text other than the labels; the rights note below is not image text.

Rights note: [append the rights note from this file].
```

### Negative prompt

For tools with a negative-prompt field, or Midjourney's `--no` parameter, pass this list as well. Tools without one, such as DALL-E 3, rely on the Constraints line above.

```text
cute mascot, kawaii, chibi, sticker, emoji, children's book, cartoon poster, glossy, 3D render, shading, gradient, drop shadow, paper texture, beige background, grey background, vector art, thick outlines, pupils, sparkling eyes, smile, blush, costume, hat, logo, title text, infographic, flowchart, slide, UI screenshot, watermark, signature
```

### Tool notes

- Midjourney: append `--ar 16:9 --style raw`, then `--no` followed by the negative prompt, comma-separated.
- Flux: use the generation prompt as written at a 16:9 size; add the negative prompt only where the front end supports one.
- DALL-E 3 and GPT image models: request the landscape size; the Constraints line replaces the negative prompt.

## Edit prompts

The shared edits in `references/workflow/editing.md` apply; for identity drift, fill "Repair character identity" with the Character block above. End every edit prompt with the rights note. Xiaohei-specific repairs:

### Make Xiaohei the actor

```text
Regenerate the image with the same core idea, labels, pure white background, and thin black hand-drawn style, but make Xiaohei perform the central action: [physical job, for example pulling the judgment lever, weighing two options on a scale, or pressing a stack into one sheet]. Keep Xiaohei's solid black body, white dot eyes, thin legs, and deadpan expression. The metaphor must depend on Xiaohei's action, not on arrows or labels beside it.

Rights note: [append the rights note from this file].
```

### Remove cuteness

```text
Edit this image to keep the same composition, action, labels, and 16:9 aspect ratio, but redraw Xiaohei as a flat solid black body with a slightly irregular hand-drawn outline, two small white dot eyes with no pupils or highlights, thin single-stroke legs, and a deadpan expression. Remove [observed drift: smile, blush, big glossy eyes, costume, rounded mascot polish, or shading].

Rights note: [append the rights note from this file].
```

## Review and repair

Check every image against `references/workflow/qa-checklist.md`, then:

- Pure white background with thin black hand-drawn linework; at least 35% empty.
- Xiaohei is recognizable: solid black body, white dot eyes, thin legs, and deadpan expression, all present.
- Xiaohei performs the central action; removing it breaks the metaphor.
- Accents are sparing: red only for key notes or results, orange only for the main flow, blue only for secondary or system-state notes.
- At most five to eight short handwritten labels in the user's language, and no title.
- The plan, every prompt, and the delivery report carry the rights note.

Any failure mode in `identity.md`, anything under Avoid in `style.md`, or a label problem under Labels in `style.md` fails the image.

| Failure | Repair |
|---|---|
| Xiaohei is passive or decorative | "Make Xiaohei the actor", with a more physical job |
| Cute, glossy, or cartoon drift | "Remove cuteness" |
| Too complex or diagram-like | Delete objects until Xiaohei and two to four supports remain; replace arrows with one loose orange path |
| Beige, textured, shaded, or gradient background | Regenerate with the Style block, stressing the pure white background |
| Heavy, vector, or mechanical lines | Regenerate with the Style block, stressing thin wobbly hand-drawn lines |
| Title, structure-type text, or crowded labels | "Remove a title" or "Reduce text" in `references/workflow/editing.md` |
| Missing rights note or credit | Restore the rights note |
| Characters, styles, or objects from other archetypes | Regenerate with this pack only |

## Delivery notes

- Archetype: Xiaohei (`xiaohei`), status `active`. Folder: `assets/<article-slug>-xiaohei/`.
- Credit: Xiaohei comes from Ian Xiaohei Illustrations by Ian (MIT).
- Repeat the rights note in the delivery report.
- If the user plans to publish, remind them to keep the credit to Ian and not to present the images as endorsed by Ian.

## Rights note

Append this note to every generation and edit prompt, attach it to every plan, and repeat it in the delivery report:

```text
Xiaohei comes from Ian Xiaohei Illustrations by Ian (MIT), https://github.com/helloianneo/ian-xiaohei-illustrations, inspected at commit 4102eb8. Keep the Ian Xiaohei Illustrations name or credit Ian in any documentation derived from it, and make no claim that Ian endorses the images. The credit belongs in plans, reports, and documentation, not in the image: draw no credit text, signature, or logo.
```
