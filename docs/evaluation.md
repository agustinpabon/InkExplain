# Evaluation

What was run against InkExplain before this release, what it showed, and what it cannot show. Everything here was run on 2026-10-16. Nothing in it involved an image model: none was available.

## What was tested

The skill was installed with the real installer (`npx skills add`, from a checkout, into clean project folders), and each request in the matrix below was given to a fresh agent session that was told only to behave as an agent that had loaded the installed skill, with no image tool. The agents read `SKILL.md` and the references it points to, saved what the skill says to save, and answered the way its Output section describes. The files they wrote were then checked by a script that applies the same rules as the repository's own tests:

- every saved prompt is a faithful instance of its archetype's template (same fixed text, in order, every field filled, no bracket left over);
- a third-party archetype's rights note is carried verbatim, and an experimental archetype is flagged;
- Littlebox uses one page color for the whole series, and it is the color asked for (pure white by default);
- Stickman's Character block is identical in every prompt, each image has a different pose, and each has at most one vermilion accent;
- labels are in the language asked for while the prompt stays in English;
- no image file was invented, the reply says nothing was generated, and a name the skill does not know is asked about, not guessed.

Whether a metaphor is good is a judgment, and nothing here scores it.

## Matrix

| # | Request | Selected | Mode | Checks |
|---|---|---|---|---|
| 1 | "Illustrate how a database index speeds up queries." | Sketch (the default) | prompt | 9/9 |
| 2 | "Use InkExplain with Littlebox to illustrate this article." (a 300-word article) | Littlebox | prompt, 3 images | 18/18 |
| 3 | "Use Littlebox. Make two images about code review ... Use a pale lavender background." | Littlebox | prompt, 2 images | 15/15 |
| 4 | "Explain this algorithm using a stickman. Generate three illustrations." (a Python file) | Stickman, experimental | prompt, 3 images | 16/16 |
| 5 | "Con un monigote, haz una imagen de esta idea ... Escribe las etiquetas en español." | Stickman | prompt, Spanish labels | 13/13 |
| 6 | "Explain this deadlock visually using Ferris." (a Rust file) | Ferris | prompt | 9/9 |
| 7 | "Read doc.md, identify where illustrations would help, and create them." | Sketch | prompt, 3 images | 13/13 |
| 8 | "Keep the same character but simplify the scene and fix the labels ..." (a Ferris image) | Ferris, from the image | edit prompt | 7/7 |
| 9 | "Draw it with a penguin: ..." | none: it asked | no prompt | 6/6 |
| 10 | "Plan the same idea with Stickman and Ferris ..." | Stickman and Ferris | plan | 13/13 |
| 11 | "Use Xiaohei. One image: ..." | Xiaohei | prompt | 9/9 |
| 12 | "Use the Go Gopher. One image: ..." | Go Gopher | prompt | 9/9 |
| 13 | "Draw it with Tux. One image: ..." | Tux | prompt | 9/9 |
| 14 | "Use the hoodie seal. One image: ..." | Seal | prompt | 9/9 |
| 15 | "Use OpenClaw. One image: ..." | OpenClaw | prompt | 9/9 |

That is 164 mechanical checks, and every run passed all of them against the pack it ran on. Three notes on how to read it:

- The checker itself needed two corrections, both about the request and not the skill: it first looked for English words when judging whether a Spanish reply admitted that nothing was generated (#5), and it first expected saved prompts from a request that asked only to plan (#10). The agents' replies were right both times.
- The skill was installed twice. #1 to #10 ran on the first install. #11 to #15, and new runs of #1 and #4, ran on a second install made after the first round of fixes below; the fixes that came out of those later runs were not tried again, and neither were the last few edits (Generate mode saving its prompts, the license file's wording). #2, #3, and #5 to #10 were not repeated at all. #7 passed against the Sketch template of its day; the template later gained the words "no structure-type text", and #1, run again, passes on the final template.
- Every agent was a Claude session reading the installed files. Another model, or a host that loads skills differently, may behave differently.

## What the runs found

Each agent was asked to report anything unclear, missing, or contradictory. Most of what came back was reported by several agents independently, and each point was settled in the skill (the commits are `docs(skill): ...`):

- Review and repair (`qa-checklist.md`) was not marked as Generate and Edit only, so agents guessed what it meant in prompt mode. It now says so, and prompt mode checks each prompt against the prompt checklist and reports that nothing was reviewed.
- Nothing said how to name the folder and the placement for a single idea or a piece of code, or when "plan" and "no image tool" disagree: the request now wins, and plan mode saves nothing.
- The shared files and the packs disagreed on object counts, label counts, canvas percentages, and how widely to spread things. A pack's template is now the authority on its own structure, and the percentages are described as rough guides.
- A repair request that named no character was ambiguous: the agent had to infer Ferris from the image. The skill now says to keep the archetype the image shows and never to repair toward the default style.
- An unknown character name now has a rule (ask before planning, and which archetypes to offer), a single idea gets labels chosen from its key nouns, and a code file is read for one behavior and drawn as objects.
- Pack-level contradictions: Littlebox's "Hidden interior" family read like the cutaway it bans (now "Hidden behavior"), a tinted page could turn the body the page color (the guidance now keeps it white), and Stickman's "State change", Sketch's, and the Go Gopher's allowed more figures than their own one-figure rules (now each says when several identical figures may share an image, and a Stickman mini comic is allowed).
- The installed copies pointed at repository-only files (`LICENSE`, the gallery). The license and the third-party notices now ship inside the skill folder (`LICENSE.md`, checked by `LEGAL-006`).

Left as they are, on purpose: the rights note appears in the plan, in each prompt, and in the report, because a prompt can be pasted away from its plan; and the label list's square brackets may stay or go.

## Does the description load the skill for the right requests?

A host decides whether to load a skill from its name and description alone, so the description was tried apart from the runs above. One fresh agent, shown InkExplain's description beside eight invented neighbors (pdf, docx, pptx, frontend-design, canvas-design, diagram, imagegen, data-viz), was asked which single skill it would load first for each of twenty requests. It chose InkExplain for all ten requests below that it should handle, and for none of the ten that it should not. It called a few close: a repair against an image editor, prompts only against an image generator, and a sketchy process explanation against a diagram tool.

| Should load InkExplain | Should not |
|---|---|
| "Illustrate this blog post with a few hand-drawn images." | "Create a bar chart of last quarter's revenue from this CSV." |
| "Where should I put pictures in this article? Give me a shot list." | "Design a logo for my startup." |
| "Explain how our retry logic works visually, using a cartoon character." | "Make a photorealistic image of a mountain lake at sunset." |
| "Draw the idea 'a cache is a promise' for my newsletter." | "Write a Mermaid sequence diagram for this API flow." |
| "Give me prompts for my image model for each section of this doc." | "Mock up the settings screen of a mobile app." |
| "Use Ferris to explain Rust ownership in one picture." | "Summarize this PDF in three bullet points." |
| "Fix the label in this illustration: 'Proof' should say 'Revisión'." | "Draw a portrait of my CEO for the About page." |
| "Turn this explanation of OAuth into sketchy illustrations on a white background." | "Generate an architecture diagram in draw.io format." |
| "I need a hand-drawn picture for each step of this onboarding guide." | "Turn this article into a slide deck." |
| "Visualize this algorithm as a short series of illustrations with a stick figure." | "Fix this bug in my React component." |

One model, one sitting, and neighbors I made up make this weak evidence, and it simulates a host's choice without being one. It is a regression list: run it in your own host, with your own installed skills, whenever the description changes.

## What this does not show

- **No image was rendered.** The skill's prompts are well-formed and faithful to their packs; whether an image model draws Stickman's single figure consistently, keeps Littlebox's body white on a white page, or leaves the rights note's words out of the picture (every third-party prompt carries it, with a line saying not to draw it) is untested. The Littlebox gallery images predate the white default, and no Sketch or Stickman render has been reviewed.
- **No host picked the skill up from a plain request.** The agents in the matrix were pointed at the installed skill, and the description test above is a simulation. Whether Claude Code, Codex, or Cursor loads InkExplain by itself for a request like "illustrate this post" is untested.
- **Only Claude Code was a host.** The installer places the skill correctly for Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, and Windsurf (each installed into an empty folder and compared byte for byte with `skills/inkexplain/`), but the skill was run inside none of the others.
- **The anonymous install is unverified.** `npx skills add agustinpabon/InkExplain --skill inkexplain` works with a GitHub login and fails for anyone else, with "For private repos, ensure you have access", while the repository is private. Run it without a login the day the repository is public.

## Before promoting Stickman

Stickman is `experimental` until real renders keep its identity contract. With an image tool:

1. Render at least three different ideas from the pack's own prompts (the three prompts of request #4 will do), optionally attaching `pose-sheet.png` as an identity reference, never as a layout.
2. In each render, check the pack's review list: the open round head with two dot eyes and no mouth, the 1.6-head spine and bent two-segment limbs, no hands, an asymmetrical posture with the whole body working, labels spelled exactly and clear of the figure, pure white page, and at most one vermilion accent. Across the three, the head size, line weight, and face match, and the poses differ.
3. If they pass, add the images under `examples/gallery/en/stickman/`, record the set in `examples/gallery/provenance.json` as an `inkexplain` set (tool, date, reviewer, review date, and a hash for each image), set the sample gate to `approved` with your name and the real date, change `status` to `active`, and update the wording that still says experimental (`SCHEMA-010` lists what it finds in the registry entry, the pack, the credit, and the example prompt; also search `README.md` and `docs/` for lines that call Stickman experimental, which no check reads). Then `npm run build:docs` and `npm run check`.

A Littlebox render on the default white page, with the same checks, is what its gallery samples should be. Its earlier samples, on the pale blue and lavender options, are withheld ([provenance](provenance.md#samples-withheld-pending-review)).

## Repeating it

The requests in the matrix are the specification: install the skill, give each to a fresh agent session with no image tool, and compare what it saves with the rules above. The script used here ran agents and is not shipped, because it cannot run offline; the repository's own checks (`npm run check`) cover the same template and rights rules on every change.
