# Xiaohei Style

Pure white, minimal, hand-drawn, restrained, a little strange: a sketch that someone who builds AI tools and products drew on a blank page to explain one thing. Clear structure, but never a manual.

## Canvas

- 16:9 horizontal by default.
- A pure white background: no beige, warm grey, paper texture, gradient, shadow, noise, or vintage-paper look.
- Generous whitespace: the main subject fills about 40%-60% of the canvas, at least 35% stays empty, and ideally one whole region is quiet.
- One core action, structure, state, or metaphor per image. Let the structure show itself; never write its type name on the image.

## Linework

- Thin black hand-drawn lines with a slight wobble: never mechanical, vector, or heavy outlines.
- Xiaohei is the only large area of black fill; everything else stays line art with minimal fill.
- No 3D shading, gradients, drop shadows, or glossy highlights.

## Color

- Black: the linework, Xiaohei, frames, structure, main labels, and main objects.
- Pure white: the page and Xiaohei's dot eyes.
- Red: key annotations, problems, warnings, emotional beats, and results.
- Orange: the main flow, paths, arrows, automation, and movement from A to B.
- Blue: secondary notes, internal or system state, and assistant or automation hints. Optional; many images need none.
- Be sparing: an image can be black plus one accent. Fewer colors beat more.

## Labels

Labels are part of the drawing: a few short handwritten notes in the same thin black line. The shared language rules in `references/workflow/prompt-assembly.md` apply; this section adds the Xiaohei label style.

- At most five to eight labels, each two to eight characters or one to four words: nouns or short verb phrases.
- Write labels in the user's language and copy them exactly; for non-Latin scripts add `copy the label text exactly, preserve the script, do not translate it`.
- Handwritten, slightly uneven, and integrated with the linework; red or blue only for the one or two notes that carry emphasis or system state.
- No title, top-left heading, or structure-type label such as "Workflow" or "Architecture".

### When text fails

1. Regenerate with fewer labels.
2. Use shorter words.
3. Move labels farther apart.
4. Generate blank label spaces and add the text with deterministic tooling, only if the result still looks hand-lettered.

## Avoid

On top of the shared failure signals in `references/workflow/qa-checklist.md`:

- Commercial illustration, PPT infographics, formal flowcharts, course slides, or complex architecture diagrams.
- Cute cartoon posters, children's-book illustration, or polished flat illustration.
- Tech UI, real app screenshots, or explaining every node.
- Complex backgrounds, gradients, shadows, or textures.
- Anything cute, childish, crowded, or rigid; aim for strange, inventive, and clean.
