# Prompt assembly

How to turn a planned image into a prompt deterministically, and how to deliver prompts when no image tool is available.

## Language

- Write image prompts in English, which image models follow most consistently.
- Quote visible labels exactly in the user's language and script. Never translate, transliterate, or reword them. Write them as a quoted, comma-separated list; the square brackets around the list in a template may stay or go.
- Keep labels short. Image models misspell long strings, and non-Latin scripts degrade first. Shorten a long phrase from the user to its key words, and say so.

## Assembly order

Start from the archetype's generation prompt in its `prompts.md` and fill every bracketed field. A complete prompt always has these parts, in this order, so two agents planning the same image produce the same prompt:

1. **Canvas**: one standalone illustration and its aspect ratio (16:9 unless the user asked for another).
2. **Style**: the archetype's style block, unchanged.
3. **Actor**: the archetype's character block, unchanged, plus the actor's action in this scene, caught at its decisive moment.
4. **Scene**: the core idea in one sentence.
5. **Composition**: where things sit on the grid, which way the flow runs, and what the actor does with which object (see `references/workflow/composition-grid.md`).
6. **Supporting objects**.
7. **Visible labels**, quoted.
8. **Color use**: which accent goes where.
9. **Constraints**: what must not appear, such as titles, extra text, logos, UI, and the archetype's own exclusions.
10. **Rights note**: for third-party archetypes, the rights note from the archetype's `prompts.md`, unchanged.

Keep prompts specific and compact. Describe the picture; do not explain the article to the model. Never edit the style, character, or rights-note blocks; change only the bracketed fields. Every word of the template outside a bracket stays as written, including the words around the action field and any sentence after the label list, even one that seems unnecessary for this image; delete only a sentence the pack marks as optional. A bracketed field can hold several sentences; the composition field usually does.

The pack's template is the authority on structure. It may state a part inside another paragraph (a Style paragraph that already carries the color use and the constraints, for example); then add no separate paragraph for that part. Where the shared workflow files and a pack's own rules differ on a detail, such as how many objects to draw or how widely to spread them, the pack is the more specific and wins.

## Generating

- One prompt, one image, one tool call. Never ask for several illustrations on one canvas.
- Request the planned aspect ratio when the tool supports it.
- If the tool accepts reference images and the archetype pack bundles one, attach it as an identity and style reference, never as a layout to copy.

## Prompt mode

Use prompt mode when the user asks for prompts only, or when this environment has no image-generation tool. Say which of the two applies. Never claim an image was generated when it was not.

For each image, deliver:

- the file name and placement;
- the core idea;
- the complete prompt in a fenced `text` block, ready to paste into any image model;
- the rights note, when the archetype has one.

If a pack marks a reference-image sentence as optional, leave it out in prompt mode (the user's tool is unknown) and tell the user which file to attach and which sentence to add.

When working inside a project, also save the prompts as `prompts.md` in the archetype's output folder (see `references/workflow/delivery.md`), so they can be rerun later.

## Prompt checklist

Before generating or delivering, confirm that:

- the core idea is one sentence and the scene shows it;
- the actor performs the action;
- labels are short, quoted, and in the user's language;
- there is no title, structure-type text, or paragraph text;
- the archetype's style and character blocks are intact;
- the rights note is present when the archetype requires one.
