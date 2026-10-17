# Evaluation

What was run against InkExplain before this release, what it showed, and what it cannot show. The request matrix below was run on 2026-10-16 with Claude agents, and the real-host runs after it ([Real hosts, 2026-10-17](#real-hosts-2026-10-17)) with Codex CLI. Nothing in either involved an image model: none was reachable.

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
| 14 | "Use the hoodie seal. One image: ..." | Seal (since withdrawn) | prompt | 9/9 |
| 15 | "Use OpenClaw. One image: ..." | OpenClaw | prompt | 9/9 |

That is 164 mechanical checks, and every run passed all of them against the pack it ran on. Scenario 14 ran against the Seal pack, which has since been withdrawn because permission to redistribute the character could not be established ([provenance](provenance.md#withdrawn-characters)); no other scenario depends on it. Three notes on how to read it:

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

## Real hosts, 2026-10-17

The first matrix used Claude agents that were pointed at the installed skill. This section is a real host choosing for itself.

**Setup.** Codex CLI 0.160.0, logged in with a ChatGPT account, run headless (`codex exec`) once per request, each time in a fresh project folder, with the Windows sandbox on and the skill installed by the real skills CLI (the folder was compared byte for byte with `skills/inkexplain/`). The host's own skills were present: about fifty of the maintainer's, and Codex's `imagegen` system skill. No image generator was reachable ([reviewing real renders](visual-review.md#where-it-stands)), so every run is a prompt-mode run. The prompt files the agents wrote were checked with the repository's own `matchesTemplate`, every path a reply named was looked up, and every reply was read.

About eighty sessions were run over several drafts of the skill text, and the earlier drafts showed what to fix. The table is the last draft, skill tree `e1fd59f`, run once per request: plain requests that do not name the skill, requests that do, and three that InkExplain must not take.

| Request | Loaded InkExplain | What the agent did |
|---|---|---|
| "Illustrate the article in article.md with hand-drawn images." | yes, from a plain request | saved three Sketch prompts (the default); one matches its template, two rewrote the end of the Actor sentence; said nothing was generated |
| "Use Littlebox to explain this concept: a message queue lets a fast producer hand work to a slow consumer." | yes | saved one prompt on `#FFFFFF` with the rights note, matching its template; said nothing was generated |
| "Use Stickman to explain the algorithm in algo.py." | yes | saved three prompts, each matching its template; flagged Stickman as experimental in the reply and the file |
| "Create four consistent illustrations for the document in doc.md." | yes, from a plain request | saved four prompts, all matching their template |
| "Generate an illustration of how a hash map finds a value by key." | **no**: Codex's own image skill | wrote a hand-coded SVG file; not InkExplain's behavior |
| "Use InkExplain with Mr. Whiskers the cat to illustrate how DNS resolves a name." | yes | asked whether to use the default Sketch style, and saved nothing |
| "Fix this generated image while keeping the same character: the label Breakpoint 1 should read Stage 1." | **no**: Codex's own image skill | repainted the label with code; not InkExplain's behavior |
| "Use InkExplain with Littlebox. Illustrate how database indexing makes queries faster. Generate 3 consistent illustrations." (the README's example) | yes | saved three prompts on `#FFFFFF`, all matching their template; said nothing was generated |
| `$inkexplain` and the four-document request | yes | saved four prompts, all matching their template |
| `$inkexplain` and the hash-map request | yes | saved one prompt, matching its template |
| `$inkexplain` and the label fix | yes | said that no image editing tool was available and saved the repair prompt, not an edited image |
| "Design a logo for my startup." | no | the host wrote an SVG logo |
| "Make a photorealistic image of a mountain lake at sunset." | no | the host's image skill said its generator was unavailable |
| "Create a bar chart of last quarter revenue from sales.csv." | no | the host answered from the file |

Across the seven runs that saved prompts, 17 of the 19 prompts are faithful instances of their template. Every path a reply named exists. Every prompt-mode reply said that nothing was generated. The two requests InkExplain did not get (the one-off picture and the plain label fix) went to the host's own image skill, which is why the README and the usage guide say to name InkExplain.

**What the runs found, and what changed.**

- **A reply said a file was saved when the write had failed.** Twice, an agent wrote `prompts.md` through a shell here-string that failed (exit code 1, no output) and reported the path anyway, with the prompt described in one sentence. `SKILL.md` now says to list the folder before giving a path, and `delivery.md` says to use the host's file-editing tool, to put the prompts in the reply, and to say so when a write fails. In the last run no reply named a path that did not exist. One earlier run still saved `explainer''s` for `explainer's`: a shell escape that leaked into the text.
- **An agent drew in place of an image tool.** With InkExplain loaded, one agent wrote ASCII diagrams in its reply instead of prompts, and another repainted a label with code, in a typeface that does not match the hand-drawn lettering. Without it, the host's own skill hand-coded SVG files instead of making images. `SKILL.md` now says that the host is not the image tool, and that an edit comes from an image tool or is a repair prompt.
- **Fixed words were paraphrased.** For every archetype tried, an agent rewrote a fixed phrase around the action field or the sentence after a field. In the runs that were measured, the Character, Color, Constraints, Labels, and rights-note paragraphs matched their template every time, and Style did apart from the escaped apostrophe above; only the Structure, Composition, Action, and Actor sentences moved. `prompt-assembly.md` now carries a concrete example of the mistake. The match rate of one and the same text swung from 4 of 16 prompts in one set of runs to 17 of 19 in the next, so the rule helps and does not guarantee.
- **Routing.** "Create four consistent illustrations for the document" never loaded InkExplain with the first description (two runs) and loaded it in all five runs with the new one. A variant of the description that told the host to prefer InkExplain over generic image skills made the agent skip the question for an unknown character in the one run tried, so it was not adopted.

**What these runs cannot show.** One host, one model, fourteen requests, and runs that vary a great deal: the same request sometimes loads the skill and sometimes does not. They say nothing about how the images look, because none was made.

**Other hosts.** `gemini skills list` shows `inkexplain` with its description among 52 skills, for a project that has the skill in `.agents/skills/`. Gemini CLI then could not run a model turn: its sign-in was refused with "This client is no longer supported for Gemini Code Assist for individuals", so nothing was asked of it. The installer placed the skill byte for byte in the folder documented for each of Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, and Windsurf. Nobody has run the skill inside Cursor, GitHub Copilot, OpenCode, or Windsurf.

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

The description changed on 2026-10-17, after real Codex runs showed the old one losing a request about a document to the host's own image skill (see below). The list was run again on the new description, with 24 requests: the first 20 above, and four that matter most to the change. The chooser was one fresh Claude agent, shown the new description beside eight neighbors, one of them Codex's real `imagegen` description. It chose InkExplain for all 12 requests it should handle and for "generate an illustration of how a hash map finds a value by key", which is arguable, and for none of the 11 it should not handle: the revenue chart, the logo, the photorealistic lake, the Mermaid diagram, the UI mockup, the PDF summary, the CEO portrait, the draw.io diagram, the slide deck, the React bug, and a pixel-art sprite sheet. It named eight close calls: the logo, the mockup, and the portrait (which skill among the design ones), and the cache idea, the label repair, the hash-map picture, the cartoon retry logic, and the stick-figure algorithm (InkExplain against `imagegen` or a diagram tool). It is one model in one sitting, and this is the weak evidence it was before.

## What this does not show

- **No image was rendered.** The skill's prompts are well-formed and faithful to their packs; whether an image model draws Stickman's single figure consistently, keeps Littlebox's body white on a white page, or leaves the rights note's words out of the picture (every third-party prompt carries it, with a line saying not to draw it) is untested. No render of Sketch, of Littlebox on its white default, or of Stickman exists, and the earlier Littlebox gallery images, which predate the white default, are withheld.
- **One real host, one model, few runs per request.** Codex CLI picked the skill up by itself for requests about an article, a document, or a named character, and not always for a one-off "generate an illustration of X" or for an image repair. The same request sometimes loaded the skill and sometimes did not, so the table below reports what happened, not a rate. Whether Claude Code or Cursor loads InkExplain by itself for a request like "illustrate this post" is untested: the Claude agents of the first matrix were pointed at the installed skill.
- **The other hosts.** The installer places the skill correctly for Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, and Windsurf (each installed into an empty folder and compared byte for byte with `skills/inkexplain/`, again on 2026-10-17). Gemini CLI lists the skill, but could not run a model turn. Nobody has run the skill inside Cursor, GitHub Copilot, OpenCode, or Windsurf.
- **The anonymous install is unverified.** `npx skills add agustinpabon/InkExplain --skill inkexplain` works with a GitHub login and fails for anyone else, with "For private repos, ensure you have access", while the repository is private. Run it without a login the day the repository is public.

## Before promoting Stickman

Stickman is `experimental` until real renders keep its identity contract. With an image tool:

1. Render at least three different ideas from the pack's own prompts (the three prompts of request #4 will do), optionally attaching `pose-sheet.png` as an identity reference, never as a layout. [Reviewing real renders](visual-review.md) has the three ideas, the checks, the continuity test, and the form for recording the result.
2. In each render, check the pack's review list: the open round head with two dot eyes and no mouth, the 1.6-head spine and bent two-segment limbs, no hands, an asymmetrical posture with the whole body working, labels spelled exactly and clear of the figure, pure white page, and at most one vermilion accent. Across the three, the head size, line weight, and face match, and the poses differ.
3. If they pass, add the images under `examples/gallery/en/stickman/`, record the set in `examples/gallery/provenance.json` as an `inkexplain` set (tool, date, reviewer, review date, and a hash for each image), set the sample gate to `approved` with your name and the real date, change `status` to `active`, and update the wording that still says experimental (`SCHEMA-010` lists what it finds in the registry entry, the pack, the credit, and the example prompt; also search `README.md` and `docs/` for lines that call Stickman experimental, which no check reads). Then `npm run build:docs` and `npm run check`.

A Littlebox render on the default white page, with the same checks, is what its gallery samples should be. Its earlier samples, on the pale blue and lavender options, are withheld ([provenance](provenance.md#samples-withheld-pending-review)).

## Repeating it

The requests in the matrix are the specification: install the skill, give each to a fresh agent session with no image tool, and compare what it saves with the rules above. The script used here ran agents and is not shipped, because it cannot run offline; the repository's own checks (`npm run check`) cover the same template and rights rules on every change.
