# Prompt assembly

How to turn a planned image into a prompt deterministically, and how to deliver prompts when no image tool is available.

## Language

- Write image prompts in English, which image models follow most consistently.
- Quote visible labels exactly in the user's language and script. Never translate, transliterate, or reword them.
- Keep labels short. Image models misspell long strings, and non-Latin scripts degrade first.

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

Keep prompts specific and compact. Describe the picture; do not explain the article to the model. Never edit the style, character, or rights-note blocks; change only the bracketed fields.

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

When working inside a project, also save the prompts as `prompts.md` in the archetype's output folder (see `references/workflow/delivery.md`), so they can be rerun later.

## Prompt checklist

Before generating or delivering, confirm that:

- the core idea is one sentence and the scene shows it;
- the actor performs the action;
- labels are short, quoted, and in the user's language;
- there is no title, structure-type text, or paragraph text;
- the archetype's style and character blocks are intact;
- the rights note is present when the archetype requires one.

<!-- negative tokens -->
