# Xiaohei Prompts

Archetype `xiaohei` (Xiaohei), status `active`. Output folder: `assets/<article-slug>-xiaohei/`. Every plan, generation prompt, edit prompt, and delivery report for this archetype carries the rights note at the end of this file.

## Planning fields

Use the shared shot list from `references/workflow/concept-extraction.md`. The actor is always Xiaohei. Add:

- **Xiaohei's part**: what Xiaohei does in this picture. It acts on an object ("pulls the judgment lever", "presses a stack into one sheet"), or it guides (stands beside the flow and points at the step to read), observes (watches the hand-off), or accompanies (walks beside the card). A picture of how something works needs no machine: the labeled places carry the idea.
- **Pattern**: one from `motion-and-acting.md`, or the plain scene.
- **Accents**: which of red, orange, and blue the image needs; often only one.
- **Reference image**: whether `xiaohei.png` is attached (the image tool takes images) or not, decided once for the whole series.
- **Series contract**: for two or more images, the Character paragraph below is copied word for word into every prompt, `xiaohei.png` is attached to every call, and the reference sentence is kept in every prompt (or deleted from every prompt when no image can be attached).
- **Rights note**: the note below, attached to the plan.

## Generation prompt

Replace every bracketed field; one prompt per image. The prompt is plain English and tool-agnostic, so it works as written in DALL-E 3, GPT image models, Flux, and Midjourney. When the image tool accepts reference images, attach `references/archetypes/xiaohei/xiaohei.png` as the identity and style reference and keep the reference sentence; otherwise delete that sentence. Say each object, label, and accent once, in the field where it belongs (`references/workflow/prompt-assembly.md`).

```text
Generate one standalone [16:9] horizontal article illustration.

Style: minimalist hand-drawn explainer sketch on a pure white background. Thin black ink lines with a slight hand wobble, not mechanical, not vector, no heavy outlines. Generous whitespace: the main subject fills about 40-60% of the canvas and at least 35% stays empty. Line art with minimal fill; the only large black area is the character. No gradients, shadows, 3D shading, paper texture, or beige or grey background.

Character: Xiaohei, one small figure drawn exactly the same way in every image. [Reference sentence: Image 1 is Xiaohei's identity and style reference: draw this exact character in a new pose and scene, and do not copy the reference's pose, props, or layout.] Body: a single solid black body shaped like a smooth rounded dome or bean, a little taller than wide, filled with perfectly flat, uniform black ink (no hatching, scribbles, texture, or fur inside it) and a slightly irregular hand-drawn outline, with nothing sticking out of the top or the sides except the limbs. Face: two small round plain white dot eyes set side by side in the upper third of the body, each about one eighth as wide as the body, with no pupils, highlights, eyelashes, or eyebrows, and no nose or mouth; a deadpan expression: blank, calm, completely serious. The two eyes are the only white on the body: no white lines, outlines, or marks. Legs: exactly two thin legs, each one single black ink stroke about a third as long as the body is tall, with a tiny foot tick. Arms: only if the action needs them, at most two, each one thin single black ink stroke that leaves the body at its side outline and never crosses the front of the black fill, with no hands, fingers, gloves, or mittens. Xiaohei is not a cat or any other animal: no ears, no horns, no tufts or bumps on the head, no tail, no snout or whiskers, no fur, no clothes, no shoes, no accessories. Never thick, doubled, fused, hollow, or extra limbs. Not cute, not a mascot sticker, not a children's cartoon.

Action: Xiaohei [its part: acts on an object, or guides, observes, or accompanies the flow], caught at its decisive moment. Xiaohei's body and gaze point at what the reader should look at.

Scene: [core idea in one sentence].

Composition: [pattern or plain scene]. [Where Xiaohei and the two to four low-tech objects sit, in the order of the flow, and what Xiaohei does with which.] Spread elements across the canvas horizontally and vertically, with every object beside or behind Xiaohei so that nothing crosses its black body.

Visible handwritten labels, copied exactly in the user's language: ["label 1", "label 2", "label 3"]. Short, separated, thin handwritten black strokes that match the linework. Copy non-Latin scripts exactly; do not translate them.

Color: black for the linework, Xiaohei, structure, and main labels; pure white for the page and Xiaohei's eyes; red only for a key note, problem, or result; orange only for the main flow or path; blue only for a secondary or system-state note. Use accents sparingly.

Constraints: one image, one core idea. No title, top-left heading, or structure-type text. No commercial illustration, PPT infographic, formal flowchart, course slide, UI screenshot, or complex architecture diagram. No clean digital font labels. Draw no text other than the labels; the rights note below is not image text.

Rights note: [append the rights note from this file].
```

### Negative prompt

For tools with a negative-prompt field, or Midjourney's `--no` parameter, pass this list as well. Tools without one, such as DALL-E 3, rely on the Constraints line above and the Character paragraph.

```text
cat, cat ears, animal ears, ears, horns, antennae, tufts, bumps on the head, tail, whiskers, snout, muzzle, nose, mouth, fur, hatching, texture, grey fill, pupils, iris, sparkling eyes, eyelashes, eyebrows, smile, blush, extra limbs, thick limbs, doubled limbs, fused limbs, hollow limbs, white outline on an arm, white line across the body, arm drawn over the front of the body, object or belt across the body, fingers, gloves, mittens, shoes, costume, hat, cute mascot, kawaii, chibi, sticker, emoji, children's book, cartoon poster, glossy, 3D render, shading, gradient, drop shadow, paper texture, beige background, grey background, vector art, thick outlines, logo, title text, infographic, flowchart, slide, UI screenshot, watermark, signature
```

### Tool notes

- Reference image: attach `xiaohei.png` through the tool's image input on every call of a series, as `references/workflow/character-lock.md` says. It fixes who Xiaohei is. Its pose, its prop, and its layout are never copied, and the texture in its body is not either.
- Midjourney: append `--ar 16:9 --style raw`, then `--no` followed by the negative prompt, comma-separated.
- Flux: use the generation prompt as written at a 16:9 size; add the negative prompt only where the front end supports one.
- DALL-E 3 and GPT image models: request the landscape size; the Constraints line replaces the negative prompt.

## Edit prompts

The shared edits in `references/workflow/editing.md` apply. For identity drift in a series, do not edit the failed image: generate it again with `xiaohei.png` attached and the `Correction:` paragraph below. For an image the user supplied, fill "Repair character identity" with the Character paragraph above. End every edit prompt with the rights note. Xiaohei-specific repairs:

### Correction for a series

Add this paragraph directly after the Action paragraph of the same prompt, with one sentence per fault you saw:

```text
Correction: Xiaohei must match Image 1 exactly. [Fix one fault per sentence, for example: The top of the body is one smooth dome with nothing on it, no ears. Xiaohei has exactly two thin legs, each a single stroke. The eyes are two plain white dots with no pupils. The body is flat solid black with no hatching.]
```

### Give Xiaohei a part

```text
Regenerate the image with the same core idea, labels, pure white background, and thin black hand-drawn style, but give Xiaohei a part at the point of the idea: [its part, for example pulling the judgment lever, pointing at the step that matters, or watching the hand-off]. Keep Xiaohei's solid black body, white dot eyes, thin legs, and deadpan expression. The picture must depend on Xiaohei's part, not on arrows or labels beside it.

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
- Xiaohei has a part at the point of the idea: it acts on an object, or guides, observes, or accompanies the flow. It is not parked in a corner, and it need not operate a machine in every picture.
- No object, belt, bar, or surface crosses Xiaohei's body: a solid body that reads as two shapes fails the Body check.
- Accents are sparing: red only for key notes or results, orange only for the main flow, blue only for secondary or system-state notes.
- At most five to eight short handwritten labels in the user's language, and no title.
- The plan, every prompt, and the delivery report carry the rights note.

Any failure mode in `identity.md`, anything under Avoid in `style.md`, or a label problem under Labels in `style.md` fails the image.

### Identity checks

Open the saved image next to `xiaohei.png` and answer each row with what you see (`references/workflow/qa-checklist.md`, "Series gate"). A row you cannot answer from the image fails.

| Check | A pass looks like | Reject when |
|---|---|---|
| Body | one flat black dome or bean, a smooth top, a little taller than wide, with no white on it but the two eyes | corners, points, ears, horns, tufts, bumps, a funnel, hole, box, or shadow shape, hatching, grey, a gradient, fur, a white line, outline, or halo on the black, an object, belt, bar, or surface drawn across it so that it reads as two shapes |
| Top of the head | one smooth curve with nothing on it | anything on top: ears, antennae, a hat, an arm that reads as an ear |
| Eyes | two small round plain white dots, side by side in the upper third, each about one eighth as wide as the body | pupils, irises, highlights, colored or sparkling eyes, one or three eyes, eyebrows, pinpoint eyes far smaller than the reference's |
| Face | no mouth, nose, or whiskers; blank and serious | a smile, a mouth, a nose, a snout, blush, an animal face |
| Legs | exactly two thin single-stroke legs with tiny foot ticks, each about a third as long as the body is tall | one, three, or four legs; thick, tapered, doubled, fused, or hollow legs; shoes; stubby legs far shorter than the reference's |
| Arms | none, or at most two thin single strokes that leave the body at its side outline, never across the front of the black fill | thick, doubled, fused, hollow, or extra arms; an arm drawn across the front of the body with a white outline; fingers, gloves, mittens |
| Line and fill | the thin hand-drawn ink of the reference and a flat black fill | thick outlines, vector polish, shading |
| Size | the same proportions as the other images, between about a sixth and a third of the frame's height | another body shape, or a size about twice that of another image |
| Page and accents | pure white page, black ink, accents as the Style allows | a tint, texture, beige, extra colors |

| Failure | Repair |
|---|---|
| Any row of the identity checks fails | Generate the image again with `xiaohei.png` attached and the "Correction for a series" paragraph, as `references/workflow/character-lock.md` says; never edit or attach the failed image |
| Xiaohei is passive or decorative | "Give Xiaohei a part", at the point of the idea |
| Cute, glossy, or cartoon drift | "Remove cuteness" |
| Too complex or diagram-like | Delete objects until Xiaohei and two to four supports remain; replace arrows with one loose orange path |
| Beige, textured, shaded, or gradient background | Regenerate with the Style block, stressing the pure white background |
| Heavy, vector, or mechanical lines | Regenerate with the Style block, stressing thin wobbly hand-drawn lines |
| Title, structure-type text, or crowded labels | "Remove a title" or "Reduce text" in `references/workflow/editing.md` |
| Missing rights note or credit | Restore the rights note |
| Characters, styles, or objects from other archetypes | Regenerate with this pack only |

## Delivery notes

- Archetype: Xiaohei (`xiaohei`), status `active`. Folder: `assets/<article-slug>-xiaohei/`.
- Credit: Xiaohei comes from Ian Xiaohei Illustrations by Ian (MIT). `xiaohei.png` is a crop of one of Ian's drawings under the same license.
- Say whether `xiaohei.png` was attached to every call, and through which input of the image tool; when it was not, say that the identity rests on the written lock alone. Give each image its status, and name any identity check that needed a repair.
- Repeat the rights note in the delivery report.
- If the user plans to publish, remind them to keep the credit to Ian and not to present the images as endorsed by Ian.

## Rights note

Append this note to every generation and edit prompt, attach it to every plan, and repeat it in the delivery report:

```text
Xiaohei comes from Ian Xiaohei Illustrations by Ian (MIT), https://github.com/helloianneo/ian-xiaohei-illustrations, inspected at commit 4102eb8. Keep the Ian Xiaohei Illustrations name or credit Ian in any documentation derived from it, and make no claim that Ian endorses the images. The credit belongs in plans, reports, and documentation, not in the image: draw no credit text, signature, or logo.
```
