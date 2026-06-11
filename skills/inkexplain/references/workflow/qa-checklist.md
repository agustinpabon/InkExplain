# QA checklist

Review every generated image before saving it, using this shared checklist together with the "Review and repair" section of the archetype's `prompts.md`, which adds identity checks and archetype-specific failures.

Review only what you can see. If the host returns the image to you, inspect it. If you cannot view the result, say that the visual review is pending and list what the user should check.

## Pass checks

- The aspect ratio matches the plan (16:9 unless the user asked for another).
- The image explains one core idea, readable within a few seconds.
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
- too many nodes, arrows, or labels;
- a title in a corner or across the top;
- misspelled, garbled, or translated labels;
- a passive actor, or an actor drawn as decoration in a corner;
- anatomy errors: extra or missing limbs, fused hands, a melted face, or an identity marker in the wrong place;
- realistic rendering, 3D, glossy vector polish, or a stock-illustration look;
- texture, gradients, heavy shadows, or a tinted background the archetype does not allow;
- UI screenshots, code, terminals, logos, or watermarks;
- a composition copied from an earlier image.

## Iteration moves

| Problem | Move |
|---|---|
| Too ordinary | Give the actor a stranger but still logical action, or switch to a more physical metaphor. |
| Too complex | Cut to one action, three to five elements, and three or four labels. |
| Diagram look | Remove boxes, grids, and extra arrows; turn the diagram into a scene. |
| Wrong text | Use "Fix a label"; regenerate with fewer labels if errors repeat. |
| Off-model character | Use "Repair character identity" with the archetype's identity markers. |
| Copied composition | Keep the idea; change the main object and the action. |
| Title appeared | Use "Remove a title". |

The edit prompts are in `references/workflow/editing.md`. After three attempts on the same image, stop and report the remaining problem instead of looping.

## Delivery judgment

A strong illustration makes the reader pause for a moment, a little surprised and slightly amused, and then understand the idea at once. Deliver the strongest images and mark weaker ones as optional rather than hiding them.
