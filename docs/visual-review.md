# Reviewing real renders

The checks in this repository read prompts and packs. They cannot tell whether an image model draws a character consistently, keeps a page white, or spells a label right. Only looking at real images can. This page is the protocol for doing that, and for recording the result honestly.

## Where it stands

Eight real renders exist, one per character, made in Codex Desktop on 2026-10-17 on eight different ideas (shown in the README gallery; `assets/examples/README.md` records each source). None has been scored with this protocol, and no character has the three-image series the protocol asks for. The maintainer's machine for CLI work had no way to render: on 2026-10-17 these routes were tried there, and none can turn a prompt into an image:

- Claude Code has no image tool.
- Codex CLI 0.160.0 shows an image-display helper in `exec` mode, but no generator: the default model and three others reported none, and when it was asked to draw it wrote SVG code instead. SVG code is not an InkExplain render and was never offered as one.
- Gemini CLI could not authenticate (it was refused with "This client is no longer supported for Gemini Code Assist for individuals"), and no image-provider credential is configured on the machine.

Two routes were not tried: connectors that need the maintainer's own sign-in, and local image generation.

The prompts these archetypes assemble are well-formed and match their packs (the tests check that). That is all that has been verified. Stickman stays `experimental` until this review passes, and the repository publishes samples only for an archetype whose `sampleGates` is `approved` with a named reviewer and a date ([provenance](provenance.md#samples-withheld-pending-review)).

| Archetype | Page | Status of the review |
|---|---|---|
| InkExplain Sketch (`ink`) | clean white | not run: no image tool |
| Littlebox (`littlebox`) | pure white `#FFFFFF`, its default | not run: no image tool |
| Stickman (`stickman`) | pure white | not run: no image tool |

## What you need

- An image tool that takes a text prompt, and for Stickman a reference image. A coding agent with an image tool connected, or any image generator you run by hand, will do.
- The same tool and model for every image of one archetype, in one session. A series that changes tool halfway tests nothing.
- A person to look at the images. An agent may generate and may take notes, but the review that goes into `sampleGates` is a person's. An agent's notes are recorded as notes, never in `reviewedBy`, and an image stays pending until a named person has looked at it and dated that day.

## The three ideas

Every archetype draws the same three ideas, so the three archetypes can be compared and each archetype's three images show whether the character holds up across different scenes.

| Idea | Action | Labels |
|---|---|---|
| A queue of requests waits while one worker handles them one at a time. | holds up one request at a narrow gate while the rest wait | requests, one worker, waiting |
| Two teams hand a draft over, and the context gets lost on the way. | carries a draft across a gap while its context tag falls off | draft, context, handoff |
| A cache keeps copies close, so the slow source is asked less often. | stacks copies of cards into a small tray close by, away from a far archive | slow source, cache, fast reads |

## Run it with an agent

This tests the whole path: routing, planning, prompt, generation, and the skill's own review. Install the skill, make sure the agent can call its image tool, and give it one request per archetype:

```text
Make three images for these ideas, one image each, labels in English, saved in assets/visual-review-illustrations/: (1) A queue of requests waits while one worker handles them one at a time. (2) Two teams hand a draft over, and the context gets lost on the way. (3) A cache keeps copies close, so the slow source is asked less often.
```

```text
Use Littlebox. Make three images for these ideas, one image each, labels in English, saved in assets/visual-review-littlebox/: (1) ... (2) ... (3) ...
```

```text
Use Stickman. Make three images for these ideas, one image each, labels in English, saved in assets/visual-review-stickman/: (1) ... (2) ... (3) ...
```

Replace the dots with the three ideas above. Do not name a page color for Littlebox: the default is what is being tested. Ask for nothing else, and keep the agent's reply, which says which prompts it used and what it checked.

## Run it by hand

Assemble each prompt from the archetype's own template, and plan the few fields the tool leaves in brackets:

```bash
node scripts/explain.mjs --archetype stickman \
  --concept "A queue of requests waits while one worker handles them one at a time." \
  --action "holds up one request at a narrow gate while the rest wait" \
  --label requests --label "one worker" --label waiting
```

Use `ink`, `littlebox`, and `stickman` for `--archetype`, and the three ideas above. The tool lists every field that is still in brackets; fill each with a short plan, the way [the walkthroughs](walkthroughs.md) do. Attach `skills/inkexplain/references/archetypes/stickman/pose-sheet.png` as the identity reference for every Stickman image, never as a layout. Paste each prompt, and the negative prompt if your tool has a field for one, into the image tool.

## What passes

Each archetype's own review list, in the "Review and repair" section of its `prompts.md`, is the full test. In short, an image fails if any of these is wrong.

**InkExplain Sketch**
- Black ink on a clean white page is nearly all of the image. Blue only on arrows, paths, or motion lines. Exactly one highlighter-yellow swipe, behind the key label. Red only on a problem.
- The actor is the ink figure (round head, single-stroke body, thin limbs), a pair of hands, or the working object, and it does the action.
- The ink figure looks the same in every image.

**Littlebox**
- One flat page, `#FFFFFF`, identical in every image. No tint, texture, frame, or scenery.
- The closed paper box with at least five of its markers, including the single amber seam tape and its jagged torn front tab. At most two side-seam twig arms. No open box.
- Thick, rough marker linework and handwritten labels in the same marker. Littlebox takes about 35% to 55% of the canvas.
- Amber only on the tape and on flow marks; coral only on a warning or result. The plan and the report carry the rights note.

**Stickman**
- A pure white page with at least 35% of it empty, a black marker line, and at most one vermilion accent.
- Open round head, two dot eyes, curved spine, two-segment limbs, and foot ticks, with no hands and no mouth. About five heads tall.
- An asymmetrical pose that uses the whole body, different from the other two images, with the figure doing the work.
- Labels beside the objects, never on the figure. No title. The delivery says the pack is experimental.

**All three**
- Every label is spelled exactly as given. No title, no caption, no sentences, no credit line or logo in the image.

## Score each image

Pass or fail each line for every image, and write a note for every fail. The lists above are each archetype's own; the scorecard asks the same questions in the same words for every image, so two reviewers compare like with like.

| Question | A pass looks like |
|---|---|
| Concept clarity | a stranger says the idea in one sentence after a few seconds |
| Character recognition | the identity markers from `identity.md` are all there |
| Character consistency | the same head, body, line weight, and face as the other two images of the set |
| Background | the page is the one the archetype names, flat, and the same in the three images |
| Composition | one focal point where the actor touches the object that carries the idea, and a quiet corner |
| Linework | the medium and weight the style sheet names, with no vector polish and no auto-traced edges |
| Whitespace | at least a third of the canvas is empty |
| Label accuracy | every label is spelled exactly as given, with no extra text |
| Visual metaphor | an everyday physical action that is the idea, not a diagram with a character beside it |
| Style consistency | palette and accents used as the style sheet allows, the same way in all three |
| Artifacts | no stray marks, melted hands, extra limbs, watermarks, or text the prompt did not ask for |
| Decoration | every object in the frame explains something; nothing is there to fill space |
| Editorial quality | a stranger would take it for the work of one illustrator, and would publish it |

An image that fails any of the first eleven is repaired or rerun. The last two are judgments, and a reviewer who answers "no" to either one says why.

## The continuity test

A character that is right once can still drift. Put the three images of one archetype side by side at the same scale and compare:

- the character's proportions, head size, outline weight, and face;
- the palette, and the page color;
- the line quality and the handwriting of the labels.

The set passes only if a stranger would take the three for one series and none of the three fails its own list above. One image with a different white, a different head, or a different line fails the set, not just that image. For Littlebox and Stickman, check the page with a color picker at the four corners and in the middle of an empty area: every reading must be `#FFFFFF` (255, 255, 255), give or take a compression artifact of one step.

Then make one edit to the second image of each set with a shared edit from `references/workflow/editing.md` (for example, fix one label) and check that everything else stayed as it was.

## Record what you saw

Write the result where the maintainer will read it, and write "not run" for anything that was not. Never record a pass that was not seen.

| Archetype | Date | Tool and model | Reviewer | Images | Identity | Page | Labels | Continuity | Edit | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| InkExplain Sketch | | | | 3 | | | | | | |
| Littlebox | | | | 3 | | | | | | |
| Stickman | | | | 3 | | | | | | |

A failed check is a result too. Name the failure, repair the pack or the prompt with the repair prompts in `prompts.md`, and run the set again with new images; never retouch an image to make it pass.

### Record every image

Keep one record per image, next to the image, whatever the verdict. A published sample is only as good as this record.

| Field | What goes in it |
|---|---|
| Archetype and file | the archetype id and the file name, `NN-topic-slug.png` |
| Concept | the idea sentence the image explains |
| Prompt | the complete prompt as it was sent, and the negative prompt if one was used |
| Tool and model | the exact names the tool shows, with the version; "unknown" when it does not say |
| Operation | `generated`, `edited` (say what was changed and with which tool), or `made by hand` |
| Date | the day the image was made |
| Rights and terms | who owns the output under the tool's terms, with a link to them, and the archetype's own rights note |
| Review status | `pending`, `approved by <name> on <date>`, or `rejected: <reason>` |
| Notes | an agent's observations, labelled as an agent's, never as the review |

When a set is approved, the record goes into `examples/gallery/provenance.json`: the tool, its model, the date, and the terms once for the set, the reviewer and the day they reviewed, and for each image its hash, concept, prompt, and operation. `ASSET-003` fails when any of it is missing or still a placeholder. The agent's notes and the scorecard stay with the pull request or release note that publishes the set.

## After the review

- If a set passes, publish it as an `inkexplain` set and approve it with your own name and the day you reviewed it: [publishing samples](adding-an-archetype.md#publishing-samples).
- If Stickman passes, promote it by following [before promoting Stickman](evaluation.md#before-promoting-stickman).
- If anything fails, the archetype keeps its status, and the failure goes into the pack's failure modes so the next prompt guards against it.
