# QA checklist

Review every generated image before saving it, using this shared checklist together with the "Review and repair" section of the archetype's `prompts.md`, which adds identity checks and archetype-specific failures. A series of two or more images also passes the series gate below.

Review only what you can see. If the host returns the image to you, inspect it. If you cannot view the result, say that the visual review is pending, mark the image "unable to verify" (`references/workflow/delivery.md`), and list what the user should check.

## Pass checks

- The aspect ratio matches the plan (16:9 unless the user asked for another).
- The image explains one core idea, readable within a few seconds, and what it says is true of the source: a stranger could state the idea in one sentence from the picture and its labels.
- The actor performs the central action. Imagine the actor removed: if the idea still works, the actor is decoration.
- The structure matches the planned type, and the type's name is not written on the image.
- The focal point sits inside the frame, not against an edge, and at least a third of the canvas is quiet space.
- Two to six short labels, spelled correctly, in the user's language.
- No title, heading, caption bar, or paragraph.
- The palette follows the archetype's style rules.
- The composition is new, not a copy of a calibration or gallery image.
- The archetype's rules hold: identity markers present, restrictions respected, nothing from other archetypes.

## Artifact rejection

Regenerate or edit when you see:

- a slide, infographic, flowchart, or dashboard look;
- too many nodes, arrows, or labels, or props piled on that the viewer has to decode;
- a machine, press, chest, barrier, or stack of documents used because it is the usual metaphor and not because it fits the source;
- a title in a corner or across the top;
- misspelled, garbled, or translated labels;
- a passive actor, or an actor drawn as decoration in a corner;
- anatomy errors: extra or missing limbs, fused hands, a melted face, or an identity marker in the wrong place;
- realistic rendering, 3D, glossy vector polish, or a stock-illustration look;
- texture, gradients, heavy shadows, or a tinted background the archetype does not allow;
- UI screenshots, code, terminals, logos, or watermarks;
- a composition copied from an earlier image.

## Series gate

Run it after the last image of a series of two or more images of the same archetype, and again for any image that was repaired. A series can drift while every image looks acceptable alone, and "identity preserved" is easy to write and hard to see, so the gate asks for observations, not conclusions.

1. Open every saved image with the host's image viewer. Open the identity reference too when the pack has one and it was attached. With no reference, the first image that passed its own checks is the yardstick, and you say so.
2. For each image, answer the pack's identity checks (the "Identity checks" in its `prompts.md`, or the markers in its `identity.md`) with what you see, one line per check: "ears: none, the top is one smooth dome", never "ok". A check you cannot answer from the image has failed.
3. Compare the images with each other, two at a time: the body's silhouette and proportions, the eyes, the number and weight of the limbs, the ink weight, the page color, the roles of the palette (an image may use a different accent when its idea needs one, as long as the roles stay the same), and how large the character is in the frame.
4. Confirm that the character does the planned action.

An image is approved only when every line is a positive observation. One material identity violation fails it, however good the picture is. Material means the character is no longer the same one: a different kind of figure, a changed face (pupils, extra or missing eyes, a mouth, brows), ears, horns, a tail, or a snout, a limb count that differs, or limbs that are thick, doubled, fused, or hollow, a body that is not the locked shape, a different fill or drawing style, or a size jump of more than about two times between images. A wobble in the outline, a slightly longer leg, or a different lean is not.

When you cannot view the images, no check can pass: every image is "unable to verify". Never infer a result from the prompt, and never offer file checks or pixel statistics as evidence about anatomy. The review is yours: do not call it independent, external, or a second opinion unless another agent or a person looked at the images.

A failing image goes through the repair in `references/workflow/character-lock.md`. When the repairs are spent, the report lists it as needing repair, with what you saw.

## Iteration moves

| Problem | Move |
|---|---|
| Too ordinary | Give the actor a stranger but still logical action, or switch to a more physical metaphor. |
| Too complex | Cut to one action, three to five elements, and three or four labels. |
| Diagram look | Remove boxes, grids, and extra arrows; turn the diagram into a scene. |
| Wrong text | Use "Fix a label"; regenerate with fewer labels if errors repeat. |
| Off-model character | Regenerate with the same reference and a `Correction:` paragraph, as `references/workflow/character-lock.md` says. |
| Copied composition | Keep the idea; change the main object and the action. |
| Title appeared | Use "Remove a title". |

The edit prompts are in `references/workflow/editing.md`. After three attempts on the same image, stop and report the remaining problem instead of looping.

## Delivery judgment

A strong illustration makes the reader pause for a moment, a little surprised and slightly amused, and then understand the idea at once. Deliver the strongest images and mark weaker ones as optional rather than hiding them.
