# Concept extraction

How to read source material, extract the core thesis and the actions worth drawing, and turn them into a shot list. Archetype packs add their own planning fields; this file covers what every archetype shares.

## Inputs

InkExplain accepts:

- an article, post, or document: pasted text, a file in the workspace, or a link the host can read;
- notes, an outline, or a transcript;
- a single idea, claim, or comparison;
- an existing illustration to edit.

The user may also set: the archetype, the number of images, the aspect ratio (default 16:9), the label language (default: the language of the source), the article slug, and the output folder.

If a link or file cannot be read, ask for the text instead of guessing what it says.

## Find the thesis

Read the whole source before planning, and note:

- the core thesis: what the reader should believe or do afterwards, in one sentence;
- the turning points, where the argument changes direction;
- passages that are hard to grasp from text alone;
- passages that need no picture.

## Find the cognitive anchors

An image earns its place when it carries a cognitive anchor, a structure the reader can hold in one glance:

| Anchor | What the image shows |
|---|---|
| Core judgment | one decisive choice or principle |
| Breakpoints | where a process stalls, leaks, or fails |
| Input and output | material entering, being transformed, and leaving |
| Split path | one start, diverging outcomes |
| Before and after | a change of state and what caused it |
| One source, many uses | a single input reused in several forms |
| Handoff | work passing between people, tools, or stages |
| Cause and effect | a chain where one push moves the next |
| Trade-off | two goods that pull against each other |
| Comparison | two or three alternatives side by side |
| Layers | a stack where each level rests on the one below |
| Feedback loop | output returning to change the input |
| Bottleneck | many things squeezed through one narrow point |
| Pitfall | a trap on an otherwise reasonable path |

## Turn the anchor into an action

Every planned image needs one physical verb that *is* the idea: weigh, filter, bridge, unpack, patch, sort, hold back, hand over. Write the core idea as "[actor] [verb] [object] so that [result]". If no verb fits, the passage is a candidate for no image at all.

## How many images

- A single idea: one image.
- A short post: one to three images.
- A long article: usually four to eight; rarely more than nine.
- Never illustrate a passage just to fill space. Fewer, stronger images beat even coverage.

## Shot list

Plan before generating. For each image, give:

1. **Placement**: the paragraph or heading the image follows.
2. **Core idea**: one sentence the image must make obvious.
3. **Structure type**: one type from `references/workflow/composition-grid.md`.
4. **Actor and action**: who or what performs the central action, and the physical action itself.
5. **Supporting objects**: one to four low-tech objects that carry the metaphor.
6. **Visible labels**: two to six short labels in the user's language.
7. **File name**: `NN-topic-slug.png`.

Add the archetype's own planning fields from its `prompts.md`, such as a page color or a rights note.

Write planning notes in the user's language. Image prompts stay in English; see `references/workflow/prompt-assembly.md`.

## Planning a series

- Keep the style constant: same archetype, palette, page color, stroke weight, actor design, and label handwriting. Change the page color within a set only when the user asks for that.
- Vary the metaphor: no two images in a set share both the structure type and the main object.
- Give each image its own entry point, so the set reads as a sequence rather than a grid of look-alikes.

## Mixed-archetype requests

When the user asks for several archetypes, state one shared core idea first, then plan one group per archetype. Each group uses only its own pack: actor, metaphor objects, labels, prompts, review, and output folder. Never put characters or styles from two archetypes in the same image.

## When to stop and ask

Ask one short question instead of guessing when:

- the source cannot be read;
- a requested archetype name is not recognized (see `references/routing.md`);
- a gated archetype is requested for a use its restrictions clearly rule out;
- the request needs a realistic depiction of a real person.
