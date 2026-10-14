# Littlebox Style

A closed paper box performs one abstract operation in rough black marker on a flat pale background. Taste target: a clever product thinker drew a strange box on a page to explain the one thing that matters.

## Canvas

- 16:9 horizontal by default, with generous whitespace; Littlebox, the main subject, covers about 35%-55% of the canvas.
- One flat background per image, pale sky blue or lavender: pale sky blue `#E3F2FD` for technical, structural, systems, clarity, tool, interface, and method ideas; pale lavender `#E6E6FA` for reflective, creative, emotional, abstract, exploratory, uncertain, or narrative ones.
- In a series, assign backgrounds during planning, before writing prompts. Even counts split equally; odd counts differ by at most one unless the article order gives a stronger reason. Avoid long runs of one color unless the sequence needs that rhythm.
- No shadows, gradients, paper texture, grain, or vignette.

## Linework

- Thick, rough black marker with chunky brush-pen weight; never thin pen lines.
- Dry-brush texture with tiny ink gaps, organic rough edges, natural line weight variation, imperfect boxes, and wobbly folds: a warm, handmade feel.
- Never ruler-straight, clean vector, auto-traced, thresholded, or posterized.

## Color

- Black `#000000` dominates: outlines, objects, the character, labels, and most structure.
- The Littlebox body stays white or near-white negative space.
- Amber `#F59E0B`: the seam tape and its jagged front tab first; flow paths, motion curves, or useful arrows only when separated from the tape.
- Coral `#E85D75`: warning, stamp, error, result, or decisive emphasis.
- Use accents sparingly; a strong image can use black plus one accent.

## Labels

Labels are part of the drawing: usually three to six short labels, drawn in the same rough black marker as the illustration. The shared language rules in `references/workflow/prompt-assembly.md` apply; this section adds the Littlebox label style.

### Language

- Plan, describe images, and report in the user's language; write every image prompt in English.
- Quote visible labels exactly in the user's language. For a Chinese-language article:

```text
Visible handwritten labels, copied exactly in the user's language: "原始材料", "判断", "输出".
```

- For non-Latin scripts, add: `copy the label text exactly, preserve the script, do not translate it`.

### Lettering

- Three to six labels for most images, one to four words each: nouns or short verb phrases. Cut labels before shrinking text.
- Rough handwritten black marker text, with stroke weight close to the Littlebox linework; CJK labels look handmade, uneven, and integrated with the drawing.
- One label style across an image set.

### Vetoes

Regenerate or repair labels that become full sentences, unrequested bilingual text, clean sans-serif, bold poster type, calligraphy, vector text, or pasted-on digital typography, or that look heavier, cleaner, or more polished than the drawing.

### When text fails

1. Regenerate with fewer labels.
2. Use shorter words.
3. Move labels farther apart.
4. Generate blank label spaces and add the text with deterministic tooling, only if the result still looks like rough handwritten marker text.

## Avoid

On top of the shared failure signals in `references/workflow/qa-checklist.md`:

- Glossy mascot art, a package mascot, cute sticker packs, logistics logos, or delivery-company icons.
- Realistic cardboard, polished vector infographics, thin-line icon art, or a clean geometric box icon.
- Children's-book scenes.
- Any open or cutaway box (see `identity.md`).
