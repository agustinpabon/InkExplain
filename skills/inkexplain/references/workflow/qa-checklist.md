# QA checklist

Review every generated image before saving it, using this shared checklist together with the "Review and repair" section of the archetype's `prompts.md`, which adds identity checks and archetype-specific failures. Every image gets two reviews, kept apart: one of the character (identity) and one of what the picture says (meaning). A series of two or more images also passes the series gate below.

Review only what you can see. If the host returns the image to you, inspect it. If you cannot view the result, say that the visual review is pending, mark the image "unable to verify" (`references/workflow/delivery.md`), and list what the user should check.

## Review one image

This is the identity review. Do it for every image, before the next call, and write the result into the run record (`checks`, `defects`, `verdict`, in `references/workflow/delivery.md`). A verdict with nothing recorded behind it is not a review.

1. **Open the file, not the answer.** Open the saved image with the host's image viewer, and the reference beside it when the pack has one. The tool's text (its echo of your prompt, the path it saved) is not the image, and what you asked for is not what was drawn. Describe the picture before you read your prompt again.
2. **Look at the body first.** Everything inside the character's outline that is not the flat fill (a line, a stroke, a mark, a texture, a second color); then each limb where it meets the body, and whether it crosses the body; then the face; then anything sticking out of the outline; then every word drawn, spelled as drawn.
3. **Answer each identity check** with what you see, in your own words and with a count or a position: "two white dots in the upper third, nothing else white on the body". Never "ok", and never the pack's own sentence: a check that repeats the specification describes the specification, not the picture.
4. **List the defects.** A defect is a rule the picture breaks: a locked feature, or a rule of the pack's style or labels, including what the plan never asked for: a stroke across the body, scribbles in the fill, a mouth, a bump, an extra or fused limb, a word that is not one of the labels, a label drawn twice, a color or a shadow the style does not allow. Look for each of them, one by one. The picture is not approved until you have looked and found none, and an empty list says that you did. A matter of degree is not a defect, and goes in the check's answer instead: a leg a little shorter or longer than the reference's, eyes a little smaller, a figure a little larger or smaller than planned, a different lean, a wobble in the outline. Degree becomes a defect when the character stops reading as the reference's: stubby legs far shorter than the reference's, pinpoint eyes, a figure twice the size of another image, another body shape. A way to make the picture better is not a defect either; a rule it breaks is.
5. **The verdict follows from the list.** Any defect: "needs repair". A doubt that the picture does not settle at the size you see: "needs human review", with the doubt in `defects`. No defect, and every check answered: "identity consistent".

Your review is a self-assessment: the agent that made the images is checking its own work, and a model tends to see what it expects. Record `reviewed_by` as `self`, and say so in the report. It becomes `independent` only when another agent or model, not told your verdict, looked at every final image and the reference and listed the defects it saw (any defect it lists fails the image, by the same line between a defect and a matter of degree), and `human` only when the user or another person says they checked. If the host can start a separate reviewer without extra permissions, use one for the final images; if it cannot, leave `self`.

## Review the meaning

A picture can be on-model and still explain the wrong thing, so what it says gets its own review, apart from the identity review above. An image that passes one and fails the other is not accepted. Do it for every image, also one that failed on identity, so that a single repair can fix both, and write it into `meaning` in the run record (`references/workflow/delivery.md`).

1. **Start from the facts.** The plan set the facts that this picture must keep true before its prompt was written (`references/workflow/concept-extraction.md`). Copy them into `meaning.facts`, and beside each write what the picture shows about it.
2. **Read the numbers.** Every number, total, and comparison drawn: read it off the picture and work it out yourself ("left pan 10 + 20 = 30, right pan 20 + 20 = 40, beam level"). A balance, an "=", or "the same as" must be true. A number you did not ask for is a defect.
3. **Check the order and the actors.** The stages are drawn in the order the source has them (a draft is submitted before it is reviewed, a request is approved before it is carried out), and no actor seems able to do more than the source lets it (the author does not approve their own request, a boundary does not stop more than the code stops).
4. **Read the labels.** Every word drawn, the object it sits on or points at, and whether it reads upright. A label on the wrong object, upside down, repeated, or unreadable is wrong.
5. **Compare it with the source.** For a repository, the explanation and the lines it cites say what is true. The picture must not contradict them or imply more than they say.
6. **Read the picture alone.** Say what is being done, by whom, and what a reader takes from it without the caption, and compare that with the core idea. A picture that says something else, or is right only with its caption, fails.

A defect of meaning is something false or misleading that a reader would take away. Check what the picture touches, and no more: a fact it leaves out is not a defect when it implies nothing against it, because the caption and the explanation carry what a picture cannot. A way to draw it better, or a matter of style, is not a defect of meaning: that belongs to the identity review. List each defect in `meaning.defects`. The verdict is "accurate" with none, "misleading" with any, "needs human review" for a doubt that the picture does not settle, and "unable to verify" when you cannot see it.

Repair a fault of meaning with the least that fixes it. A fault in one element (a number, a label's direction or the object it names) takes an edit that hands the saved image to the tool (`references/workflow/editing.md`), when the tool can edit. A wrong scene takes one regeneration with a `Correction:` that states the fact it got wrong, and when identity failed too, the same regeneration fixes both. An edit and a regeneration count the same against the repair limits, and a fact that fails twice is drawn another way: the plain scene instead of the metaphor, no number instead of a wrong one.

## Pass checks

- The aspect ratio matches the plan (16:9 unless the user asked for another).
- The image explains one core idea, readable within a few seconds, and what it says is true of the source: a stranger could state the idea in one sentence from the picture and its labels.
- The actor performs the central action. Imagine the actor removed: if the idea still works, the actor is decoration.
- The structure matches the planned type, and the type's name is not written on the image.
- The focal point sits inside the frame, not against an edge, and at least a third of the canvas is quiet space.
- Two to six short labels, spelled correctly, in the user's language, and no word on the picture that is not one of them.
- No title, heading, caption bar, or paragraph.
- The palette follows the archetype's style rules.
- The composition is new, not a copy of a calibration or gallery image.
- The archetype's rules hold: identity markers present, restrictions respected, nothing from other archetypes.
- For a repository: the picture answers the plain question in its shot list with the application's own things and words, and says nothing that the explanation does not support (no guarantee, and no feature the code does not have).

## Artifact rejection

Regenerate or edit when you see:

- a slide, infographic, flowchart, or dashboard look;
- too many nodes, arrows, or labels, or props piled on that the viewer has to decode;
- a machine, press, chest, barrier, or stack of documents used because it is the usual metaphor and not because it fits the source;
- a title in a corner or across the top;
- misspelled, garbled, duplicated, or translated labels, or words nobody planned;
- a passive actor, or an actor drawn as decoration in a corner;
- anatomy errors: extra or missing limbs, fused hands, a melted face, or an identity marker in the wrong place;
- realistic rendering, 3D, glossy vector polish, or a stock-illustration look;
- texture, gradients, heavy shadows, or a tinted background the archetype does not allow;
- UI screenshots, code, terminals, logos, or watermarks;
- a composition copied from an earlier image.

## Series gate

Run it after the last image of a series of two or more images of the same archetype, and again for any image that was repaired. The series is the images this run generated and nothing else: earlier output in the archetype's folder is not part of it, and you do not open it, rate it, or let it carry the result. A series can drift while every image looks acceptable alone, and "identity preserved" is easy to write and hard to see, so the gate asks for observations, not conclusions.

1. Open every final image of this run with the host's image viewer, and list them in `series_review`. Open the identity reference too when the pack has one and it was attached. With no reference, the first image that passed its own checks is the yardstick, and you say so.
2. For each image, answer the pack's identity checks (the "Identity checks" in its `prompts.md`, or the markers in its `identity.md`) with what you see, one line per check: "ears: none, the top is one smooth dome", never "ok". A check you cannot answer from the image has failed.
3. Compare the images with each other, two at a time: the body's silhouette and proportions, the eyes, the number and weight of the limbs, the ink weight, the page color, the roles of the palette (an image may use a different accent when its idea needs one, as long as the roles stay the same), and how large the character is in the frame. Record the pairs in `series_review`.
4. Confirm that the character does the planned action.

An image is approved only when every line says what you see and none of them shows a material violation. One material identity violation fails it, however good the picture is. Material means the character is no longer the same one: a different kind of figure, a changed face (pupils, extra or missing eyes, a mouth, brows), ears, horns, a tail, or a snout, a limb count that differs, or limbs that are thick, doubled, fused, or hollow, a body that is not the locked shape, any line, stroke, mark, or texture on a solid body that the reference does not have (a white band where an arm crosses it, scribbles in the fill), a different fill or drawing style, or a size jump of more than about two times between images. A wobble in the outline, a slightly longer leg, a smaller eye, a figure a little larger than planned, or a different lean is not: write it in the check, and let it pass.

Approve conservatively. You are a model looking at a picture, and a model tends to see what it expects.

- **Clearly wrong: reject it.** If any observation, anywhere in your notes or your reasoning, names a locked feature as present or changed (points or tufts that read as ears, a mouth, a third arm, a different body), the image fails. You cannot approve it afterwards with a caveat.
- **Material doubt: hold it.** A hedged observation ("seems", "probably", "slightly different"), or a feature you cannot make out at the size you see, is a check that did not pass. The verdict is "needs human review", with what the picture left unsettled.
- **Cannot view it: "unable to verify".**
- The verdict is one of the four phrases in `references/workflow/delivery.md`, with no qualifier after it. A series whose final image for any scene was rejected, held, or unverified is never reported as a passed consistency check: the report says how many scenes passed and how many did not, and lists every rejected attempt with its defect.

When you cannot view the images, no check can pass: every image is "unable to verify". Never infer a result from the prompt, and never offer file checks or pixel statistics as evidence about anatomy. The review is yours: do not call it independent, external, or a second opinion unless another agent or a person looked at the images.

A failing image goes through the repair in `references/workflow/character-lock.md`, and so may an image you are holding while repairs remain. When the repairs are spent, the report lists the image as needing repair or needing human review, with what you saw, and never as approved.

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

The edit prompts are in `references/workflow/editing.md`. After three attempts on the same image (the first and two repairs), stop and report the remaining problem instead of looping.

## Delivery judgment

A strong illustration makes the reader pause for a moment, a little surprised and slightly amused, and then understand the idea at once. Deliver the strongest images and mark weaker ones as optional rather than hiding them.
