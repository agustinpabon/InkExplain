# Stickman Style

A skilled editorial illustrator drew one simple figure to explain a sophisticated idea: bold black marker on white paper, a few well-chosen objects, almost no color.

## Canvas

- 16:9 horizontal by default; follow the user's aspect ratio when they ask for another.
- A pure white background `#FFFFFF`: flat and borderless, with no paper texture, grain, gradient, vignette, or shadow.
- One focal action, roughly in the middle third, with at least 35% of the canvas left empty.
- At most one short, loose ground stroke under the feet when it helps the stance read. No scenery.

## Linework

- One confident black brush-pen marker line (`#111111`), medium-bold: about a ninth of the head's diameter, with slight pressure variation, tapered stroke ends, and small handmade wobbles. Never hairline, never poster-heavy.
- The figure and every prop share the same marker. Props are drawn about a quarter lighter, so the figure stays the heaviest element.
- Never uniform-width vector lines, perfect circles, ruler-straight geometry, or clip-art outlines.
- Line only: no fills, hatching, or shading.
- A strong silhouette: the figure and its action must still read when the image is shrunk to a thumbnail.

## Color

The palette is fixed: black ink on a pure white page, and at most one accent.

| Role | Color | Use |
|---|---|---|
| Ink | black ink `#111111` | the figure, the props, and the labels |
| Page | pure white `#FFFFFF` | the background |
| Accent | vermilion accent `#E4572E` | the single object, mark, or label that carries the idea; one or two small marks at most, or none |

- The accent covers a few small marks, never a large area, and never decorates. Many strong images use none.
- No second accent, no color fill, and no colored figure.

## Labels

- Two to six short labels in neat handwritten print, drawn with the same marker, one to three words each.
- Copy labels exactly in the user's language. The shared language rules in `references/workflow/prompt-assembly.md` apply.
- Label the objects, never the figure, and keep labels clear of its head and limbs.
- No title, caption, legend, paragraph, or speech bubble.
- When a label comes out wrong, regenerate with fewer and shorter labels before editing.

## Avoid

On top of the shared failure signals in `references/workflow/qa-checklist.md`:

- Pictogram, restroom-sign, emoji, or children's activity-book figures.
- Hands, mouths, hair, clothes, shoes, and accessories on the figure.
- Stiff T-poses, mirrored stances, and a figure that stands beside the action.
- Uniform vector lines, perfect circles, gradients, shadows, and 3D.
- Slides, infographics, flowcharts, dashboards, and UI.
- A second accent color, colored fills, or a tinted page.
