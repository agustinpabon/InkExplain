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

Keep prompts specific and compact. Describe the picture; do not explain the article to the model. Never edit the style, character, or rights-note blocks; change only the bracketed fields. Every word of the template outside a bracket stays as written: the words before and after each field, and every fixed sentence that follows one, such as the sentence about how much of the canvas the action fills and the sentence after the label list, even when it seems redundant for this image; delete only a sentence the pack marks as optional. For example, with the template line `Action: the actor performs the central action: [action], caught at its decisive moment.`, write `Action: the actor performs the central action: pours coins into the tray, caught at its decisive moment.` and neither `Action: the actor pours coins into the tray, caught at its decisive moment.` (the lead-in is gone) nor `Action: the actor performs the central action: pours coins into the tray, caught mid-pour.` (the tail is rewritten). A bracketed field can hold several sentences; the composition field usually does. Keep the template's paragraph breaks too: a line that starts a paragraph in the template (`Action:`, `Scene:`) starts one in the prompt, with a blank line before it, and the same text is sent to the image tool that is saved in `prompts.md`.

What you write into the fields says each thing once. Name an object where it is placed (the composition), a label in the labels field, and an accent where it is used; the action, the scene, and the color point at them and do not list them again. All that you write into the fields is about a hundred words. The fixed blocks are never shortened: the repeats to cut are yours.

The pack's template is the authority on structure. It may state a part inside another paragraph (a Style paragraph that already carries the color use and the constraints, for example); then add no separate paragraph for that part. Where the shared workflow files and a pack's own rules differ on a detail, such as how many objects to draw or how widely to spread them, the pack is the more specific and wins.

## Generating

- One prompt, one image, one tool call. Never ask for several illustrations on one canvas.
- Request the planned aspect ratio when the tool supports it.
- If the tool accepts reference images and the archetype bundles one (`references/routing.md` lists it), attach that file to every call of a series as the identity and style reference, never as a layout to copy and never a render, and keep the template's reference sentence. Otherwise delete that sentence from every prompt of the series. The whole procedure is in `references/workflow/character-lock.md`.
- In a series, the Character paragraph is identical in every prompt. A repair adds one `Correction:` paragraph directly after the Action paragraph and changes nothing else.

## Prompt mode

Use prompt mode when the user asks for prompts only, or when this environment has no image-generation tool. Say which of the two applies. Never claim an image was generated when it was not.

For each image, deliver:

- the file name and placement;
- the core idea;
- the complete prompt in a fenced `text` block, ready to paste into any image model;
- the rights note, when the archetype has one.

If a pack marks a reference-image sentence as optional, leave it out in prompt mode (the user's tool is unknown) and tell the user which file to attach and which sentence to add.

When working inside a project, also save the prompts as `prompts.md`, so they can be rerun later: in the run folder when images are generated, otherwise in the archetype's folder (see `references/workflow/delivery.md`).

## Prompt checklist

Before generating or delivering, confirm that:

- the core idea is one sentence and the scene shows it;
- the character acts, guides, observes, or accompanies, at the point where the idea is;
- each object, label, and accent is named once;
- labels are short, quoted, and in the user's language;
- there is no title, structure-type text, or paragraph text;
- the archetype's style and character blocks are intact;
- the rights note is present when the archetype requires one.
