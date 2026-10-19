# Evaluation

What was run against InkExplain before this release, what it showed, and what it cannot show. The request matrix below was run on 2026-10-16 with Claude agents, and the real-host runs after it ([Real hosts, 2026-10-17](#real-hosts-2026-10-17)) with Codex CLI. Nothing in either involved an image model: none was reachable. The first runs that did are the Xiaohei series of 2026-10-18 ([Character lock and repository explanations](#character-lock-and-repository-explanations-2026-10-18)), made with Codex CLI's built-in image tool.

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

About eighty sessions were run over several drafts of the skill text, and the earlier drafts showed what to fix. The table is the last draft, skill tree `e1fd59f`, run once per request: plain requests that do not name the skill, requests that do, and three that InkExplain must not take. The released skill differs from that tree in the Go Gopher's rights-holder line, and in the image-tool rules described in [Native image generation](#native-image-generation-2026-10-17); the table was not run again on the new text.

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
- **An agent drew in place of an image tool.** With InkExplain loaded, one agent wrote ASCII diagrams in its reply instead of prompts, and in at least four sessions an agent asked to fix a label repainted it with code, in a typeface that does not match the hand-drawn lettering. Without it, the host's own skill hand-coded SVG files instead of making images. `SKILL.md` now says that the host is not the image tool, and that an edit comes from an image tool or is a repair prompt.
- **Fixed words were paraphrased.** For every archetype tried, an agent rewrote a fixed phrase around the action field or the sentence after a field. In the runs that were measured, the Character, Color, Constraints, Labels, and rights-note paragraphs matched their template every time, and Style did apart from the escaped apostrophe above; only the Structure, Composition, Action, and Actor sentences moved. `prompt-assembly.md` now carries a concrete example of the mistake. The match rate of one and the same text swung from 4 of 16 prompts in one set of runs to 17 of 19 in the next, so the rule helps and does not guarantee.
- **Routing.** "Create four consistent illustrations for the document" never loaded InkExplain with the first description (two runs) and loaded it in all five runs with the new one. A variant of the description that told the host to prefer InkExplain over generic image skills made the agent skip the question for an unknown character in the one run tried, so it was not adopted.

**What these runs cannot show.** One host, one model, fourteen requests, and runs that vary a great deal: the same request sometimes loads the skill and sometimes does not. They say nothing about how the images look, because none was made.

**Other hosts.** `gemini skills list` shows `inkexplain` with its description among 52 skills, for a project that has the skill in `.agents/skills/`. Gemini CLI then could not run a model turn: its sign-in was refused with "This client is no longer supported for Gemini Code Assist for individuals", so nothing was asked of it. The installer placed the skill byte for byte in the folder documented for each of Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode, and Windsurf. Nobody has run the skill inside Cursor, GitHub Copilot, OpenCode, or Windsurf.

## Native image generation, 2026-10-17

**Why a sibling skill generated images and this one did not.** The Xiaohei skill that this one grew from (credited in [ATTRIBUTIONS.md](../ATTRIBUTIONS.md)) says, in the step for an explicit request: generate each image separately "with the built-in `image_gen`", and it says nothing else about tools: no mode to choose, no tool to look for. InkExplain described image tools in the abstract ("whatever image-generation tool the host agent provides; if there is none, switch to Prompt mode"), never named `image_gen`, `$imagegen`, or `GenerateImage`, and offered Prompt mode as an exit an agent could take without looking. OpenAI's own `imagegen` skill makes the built-in tool the default (no `OPENAI_API_KEY`), makes the API CLI an explicit-only fallback, calls the tool once per asset, and copies the chosen file from `$CODEX_HOME/generated_images/` into the workspace; Hatch Pet delegates every generation to `$imagegen` and forbids any other path. The skill text now follows the same pattern (`references/workflow/image-tools.md`).

Two failures were reproduced in fresh Codex CLI 0.160.0 sessions (the skill copied into a new project, as the skills CLI would):

- **An available tool was not found.** With a stand-in image tool connected over MCP, the old text went to Prompt mode and reported "no callable image generator" without one call (2 of 2 runs). The tool was in the agent's list; it had looked only for the built-in `image_gen`. The text now says to read every tool name, MCP names included, and that a missing key is not a missing tool. With it, the agent called the tool.
- **Plain requests did not reach the skill.** "Generate 2 illustrations explaining how a message queue ..." went to `$imagegen`, and "Make an illustration of how a hash map finds a value by key" went straight to the tool; InkExplain was loaded in 0 of 2. The description now leads with what distinguishes the request (explanatory illustrations of a concept, process, article, document, or code, named character or not). With it, 2 of 2 loaded InkExplain, saved the images under `assets/<slug>-illustrations/`, and a logo request still did not load it.

**What could not be tested.** `codex exec` on this machine does not expose the built-in `image_gen` tool: asked to list its tools, the agent listed `exec`, `view_image`, the MCP tools, and no generator, and said so. So no real native generation was run on 2026-10-17, and no InkExplain image was produced. (On 2026-10-18 the same Codex CLI version, 0.160.0, did list `image_gen__imagegen` in `exec` mode, and the series in [the next section](#character-lock-and-repository-explanations-2026-10-18) used it.) The runs below use a stand-in image tool that is a test harness, not a model: it returns a fixed test pattern as a valid PNG and logs the prompt it receives. It checks the plumbing (finding the tool, one call per image, copying, verifying, reporting), not how anything looks.

| Run | Setup | Result |
|---|---|---|
| A | no image tool; request names Littlebox | loaded; said that no raster generator was available; saved prompts; drew nothing |
| B, B2 | stand-in tool; old text | never called it; Prompt mode (above) |
| B3, B4 | stand-in tool; new text; the tool returned flat or near-empty pictures | called it (6 calls for 3 images), looked at the results, called them blank, saved no image, delivered the prompts, and said why |
| B5 | stand-in tool; told it is a stub and any valid PNG will do | 3 calls, one per image; 3 PNGs copied into `assets/database-indexing-littlebox/` with numbered names; `scripts/verify-image.mjs` accepts all three (1280x720); the prompt it sent was word for word the one it saved, on `#FFFFFF`, with the rights note; the Action line had lost its paragraph break |
| B6 | the same, after the paragraph-break sentence was added to `prompt-assembly.md` | the breaks were kept and the Character block was identical in all three prompts; the sentence that closes the Composition paragraph was rewritten in all three, so `matchesTemplate` still fails them |
| C | stand-in tool refuses every call | two attempts on the first image, then stopped; two prompts saved; said that neither image was generated; invented no file |
| D1, D2 | plain requests, old description | InkExplain not loaded (0 of 2) |
| E1, E2, E3 | plain requests, new description | E1 and E2 loaded InkExplain and saved their images in the workspace; E3 (a logo) did not load it |

One run per row, one host, one model. The stand-in tool made the images it made, so the table says nothing about whether Codex's real `image_gen` output would be saved, named, and checked the same way; Cursor and every other host were not run. The 14-request table above was run before these changes, on tree `e1fd59f`.

## Character lock and repository explanations, 2026-10-18

**What prompted it.** A user asked Google Antigravity, in Spanish, to use InkExplain with Xiaohei to explain a whole repository. Four images came back and the character was not the same in them: the eyes and face were wrong from the first image, cat-like ears appeared later, and the outline, the proportions, and the limbs kept changing (thick or doubled). The agent still reported that all four had kept Xiaohei's identity. The explanation was four architecture principles, not a reading of the code. Antigravity was not available for this work, so nothing below was run there. What could be run was Codex CLI, whose image tool was reachable in `exec` mode on this date, and a stand-in image tool for hosts that take no reference image or take one under another name.

**Compared with the skill this one grew from.** Ian's Xiaohei skill (credited in [ATTRIBUTIONS.md](../ATTRIBUTIONS.md), read at commit `4102eb8`) is made for one picture per passage of an article. Its `xiaohei-ip.md` describes the character in words and lets the body take several forms ("a cylinder, a black bean, a black box, a funnel, a shadow, a hole, a dark lump inside a machine"). Its example images are, translated from its Chinese, "only for low-frequency visual calibration" and outside the default generation path, so the image tool is not given them, and the agent is told not to copy their composition, objects, or labels. Its checklist fails a figure that looks like a cute mascot, and checks no feature of the character: not the eyes, the limbs, the ears, or the shape of the body. That suits independent pictures. It does not hold one character steady across a series, and InkExplain had carried the same wording over ("The silhouette may adapt to the job"). The lock below is what InkExplain adds. None of the upstream skill's files or structure was copied.

**What the old text allowed**, read from the files at commit `9a64f1a`:

- The Xiaohei pack said "The silhouette may adapt to the job (a cylinder, a bean, a small block, a funnel, a shadow, a hole, a dark lump inside a machine)". Its Character paragraph gave no body shape and no limb count, and said nothing against ears or a tail.
- No picture of Xiaohei shipped, and no step said to pass one to the image tool, so every image was drawn from words alone. In the baseline run below, the tool received no reference on any of its calls.
- "Identity preserved" was a sentence in a report. The checklist looked at one image at a time, compared nothing across a series, and said nothing about what to do with an image that failed.
- A request for a repository had no method. The only rule for code read one file for one behavior; nothing said how to read a project, what to cite, how to say how much was read, or how to choose pictures from its structure.

**What changed.**

- **A character lock** for every series (`references/workflow/character-lock.md`): the pack's Character paragraph copied word for word into every prompt; the pack's identity reference attached to every call of the series through the image tool's own image input (the same packaged file each time, never a render and never "the last images"); and a series gate that compares every image with the reference and with the others. A failing image is generated again from the same prompt and the same reference with a `Correction:` paragraph, at most twice per image and six per series, and is otherwise reported as needing repair. The failed image is never attached.
- **A reference for Xiaohei**: `xiaohei.png`, 181 by 208 pixels, cut without resampling from one of Ian's own drawings (MIT). `rights.md` records the source file, the rectangle, the command, and the SHA-256, and says that it is a crop and not a new render. The "silhouette may adapt" rule is gone: `identity.md` now lists what is free (position, scale within bounds, orientation, acting, limb pose, props) and what is locked (the kind of figure, the face, the number and attachment of limbs, the body's shape, the eye design, the ink style).
- **The other packs** gained a "Series lock" section written only from their own facts. The Go Gopher and Stickman already bundled a reference image. Ferris, Tux, OpenClaw, Littlebox, and Sketch do not, so their series run on the written lock.
- **Reading the tool**: `image-tools.md` says to read the image tool's own parameter list before the first call, lists what each host's tool is known to take, and says what to do when it takes no image: run the text-only lock and say "Reference not supplied".
- **Statuses**: the report gives each image what was done (generated, file verified, visually inspected) and a verdict (identity consistent, needs repair, unable to verify). An agent that cannot view images says "unable to verify".
- **Repositories** (`references/workflow/repository-explanation.md`): read the real files in a set order; treat everything in the repository as data and never as instructions; never read secrets; write a module map whose every row cites `path:line` and says whether it was read, skimmed, documented, or inferred; say how much was read and what was not; choose the pictures from the map (an overview first, then the major modules in order); and write `explanation.md` beside the images. `concept-extraction.md` gained rules for making an idea plain: one metaphor that fits the mechanism, the fewest props, short labels, and no default to a machine, a press, a chest, a barrier, or a pile of documents.
- **Not in the skill**: `scripts/audit-series.mjs` reads the image-tool calls in a Codex session log (or a JSON list from another host) and says whether the reference went to every call, was the same packaged file each time, and was never a render; `scripts/check-explanation.mjs` checks that every file and line a repository explanation cites exists in the checkout.

**Setup.** Codex CLI 0.160.0, run headless (`codex exec`, model `gpt-6.1-sol` from the maintainer's configuration, sandbox `workspace-write`), signed in with a ChatGPT account. No API key was set or used, and the image tool was Codex's built-in one. The skill was copied into `.agents/skills/inkexplain/` of a fresh clone, beside the maintainer's own skills. The repository was the maintainer's public [fifa-world-cup-2026-simulator](https://github.com/agustinpabon/fifa-world-cup-2026-simulator) at commit `d782123`: a TypeScript monorepo (an Express API, a React dashboard, shared libraries, scripts) with 281 tracked files. Every run was given the same sentence, in Spanish: "Usa InkExplain con Xiaohei para explicarme la arquitectura y los principales módulos de este repositorio." In C and F the Codex agent also started sub-agents of its own, to read the code and then to look at the finished images; the first two it tried in each run failed, because the model it asked for is not available with a ChatGPT account, and it started others. The images were read by AI agents (the agent in each run, the second Codex agent it asked in C and F, and Claude for the comparison below), never by a person, so none of this is the review that [reviewing real renders](visual-review.md) asks a person to make.

**The installer.** `npx skills add <a checkout> --skill inkexplain --agent codex` (skills CLI 1.7.2) installed the committed skill folder byte for byte into a clean project: 57 files, `xiaohei.png` among them (SHA-256 `7aeaa29a2a697cbe266e4a47481a7734df6696fb70287d49b4a0535004f885a1`). So the reference travels with the skill that an agent loads, and the path that `routing.md` gives for it resolves in an installed copy.

**One call, with and without the reference.** The same prompt was sent twice through Codex's `image_gen__imagegen`, once with `referenced_image_paths` set to `xiaohei.png` and once without it, for two scenes (the prompt was an early draft of the Character paragraph, before the tightening described below):

| Scene | Without the reference | With it |
|---|---|---|
| A figure pulls a long lever that sorts requests onto two belts | an egg-shaped body with small eyes, and arms drawn as white-outlined tubes | a dome like the reference's, with round dot eyes; one white line crosses the front of the body where an arm starts, and the fill shows faint scribbles |
| A figure lifts a stack of cards over a low wall | a rounded body and thin arms: acceptable | a dome and thin arms: acceptable |

One call per cell: a look at what the input does, not a rate. The first scene is why the reference is attached. Its white line and scribbles are why the Character paragraph forbids white marks on the body, arms that cross it, and texture in the fill. In every call of the runs below that passed `referenced_image_paths` (a list of local file paths), the tool accepted it and returned an image. Its other option, `num_last_images_to_include`, selects recent conversation images, earlier renders among them, and the skill never uses it.

**The series.** Same request, same repository, the skill text at four stages:

| | A: the skill as published | B: first lock | C: Character paragraph tightened | F: the committed text |
|---|---|---|---|---|
| Image-tool calls | 3 | 7 | 9 | 6 |
| Calls with the packaged reference first | 0 of 3 | 7 of 7, one file | 9 of 9, one file | 6 of 6, one file |
| Images kept, and failed attempts kept apart | 3, none | 4, 3 | 5, 4 | 4, 2 |
| The body | an egg, tilted, in all three; pinpoint eyes | a dome, round eyes | a dome, round eyes | a dome, round eyes (the smallest in image 1), upright in two and leaning in two |
| The arms | white-outlined tubes in two of the three | a white line across the front of the body in three of the four | single thin strokes, none crossing the body | single thin strokes, none crossing the body |
| Elapsed | 5 minutes | 11 minutes | 11.5 minutes | 11.6 minutes |

Each run used the text of its day. B differs from the committed text in eight files (among them the Character paragraph), and C in four, by wording only: a path in `SKILL.md`, the host table in `image-tools.md`, a sentence of the series gate, and a sentence about citing only lines that were opened. F ran on the committed text, the skill folder whose git tree is `e0b1cb89ef45a3e9856364b67c1f58714a9336da` (`git rev-parse HEAD:skills/inkexplain` on the commit that adds this section).

`scripts/audit-series.mjs`, run on the Codex session logs, fails the baseline on three checks (the reference attached to every call, the same file every time, the packaged file) and passes B, C, and F on all of them. It notes one call in each of B and C that attached a render after the reference: the label-and-arrow edit of image 2, which hands the render over as the edit target and is not an identity repair. In F, all six calls passed the reference and nothing else, but the agent had kept the path in Codex's own store and passed `load("...")`, which the first version of the script could not read, so it claimed nothing. The six calls were read by hand, the reference path was found to be the packaged file's, and the script was then taught to follow `store` and `load` (a test covers it and its limits: a name that was never stored, or a store in a comment, still reads as unknown). The audit cannot see a prompt that the agent built from stored data, so what it checks of the prompts is the Character paragraph in each run's saved `prompts.md`: one paragraph across 3, 6, 8, and 6 prompts in A, B, C, and F.

A second agent, not told which set came from which version of the skill, was shown the reference and two unlabeled sets (A's three images and B's four) and asked, image by image, whether the character matched. It judged B's set closer to the reference than A's, and it also failed individual B images for specific faults: a white mark or line across the body, arms drawn as outlined tubes instead of single strokes, and legs that were too short. Those faults are what the Character paragraph's sentences about white marks, single-stroke arms, and leg length were then written against, and C and F were made with them. The reviewer's report was not saved as a file.

**What the gate caught.** In C, the agent rejected four of its five first attempts, each for a fault the pack names, and generated them again with the same reference and a correction: a pale arm line across the front of the body (image 1); invented percentages and a return arrow on the result sheet (image 2, fixed by an edit that kept the reference first and attached the render as the edit target); a white line across the body and a thick grip (image 3); and legs hidden behind a table with fingers on the stamp (image 5). The first attempts stayed in the folder under their own names and were reported as not approved. In F, the first attempts at images 1 and 4 had a white line across the front of the body where an arm starts. The agent rejected both, generated them again with the same reference and a correction, and kept the rejected files as `-attempt1`; the second Codex agent then looked at the four finals and the reference and found no material fault. Claude read the four finals too, and agrees.

**The explanations.** `scripts/check-explanation.mjs` reads each cited `path:line` against the checkout:

| | A | B | C | F |
|---|---|---|---|---|
| References, and the distinct files they name | 38, 36 | 55, 33 | 59, 39 | 112, 49 |
| References that do not resolve | 0 | 1: a range of 41 lines in a file of 39 | 0 (and one warning: a bare `index.ts` that names several files) | 0 (and one warning: a bare `backtest.ts`) |
| Said how much was read, and what was not | no | yes: 39 of 122 files | yes: at least 53 of 144, 22 in full | yes: 42 source files, some in ranges, of 281 tracked; "not every file" |
| Labeled what was read, skimmed, documented, or inferred | no | yes | yes | yes |
| A continuation path | a table of where to look | yes | yes: two requests to ask next | yes: four topics and a sample request |

The baseline's explanation was grounded too: its 38 links all point at files that exist. What it lacked is a stated coverage, labels for what was only documented, and a way to continue; what the method adds is that every claim can be traced to a line and every gap is named. The checker proves only that a cited file and range exist, not that the claim is true. Ten claims from C's explanation were therefore checked by hand against the code (the iteration count, the cache lifetime, the worker call, the use of Worker threads, the generated-client drift test, both Orval targets, the switch between a GET and a POST for scenarios, the development proxy and its ports, and the query client): all ten were true. Eleven from F's (the active model variant, the single-score sampler, `init` and the versioned recalculation in `OracleRuntime`, the shared fetch, the drift script in `package.json`, the backtest and optimizer entry points, the twelve groups, the GET and POST choice, and the two constants above) were checked the same way, and all eleven were true.

**Hosts that take no reference, or take it under another name.** A stand-in MCP image tool (a test harness, not a model: it returns a fixed test pattern as a PNG and logs each call) was connected to Codex with its own image generation turned off, in two shapes, on the committed text. The agents were told that the tool was a stand-in and not to regenerate because of how the pictures looked.

| Setup | What the agent did |
|---|---|
| The tool takes `prompt` only | Three calls, one per image, each with the same 1,365-character Character paragraph and the reference sentence left out of all three. The report said that no reference was attached and that the tool received text prompts only, called the three test patterns "needs repair", and kept them as told. The audit script, in its text-only mode, passes. |
| The tool takes `description`, `filename`, `reference_image_paths`, and `aspect_ratio` (the shape Cursor users report) | Three calls, one per image, each passing `xiaohei.png` first in `reference_image_paths` and `16:9` in `aspect_ratio`; the audit passes. The agent then reached the account's usage limit, before it looked at the pictures or wrote a report. An earlier run of the same setup, on the text before three small edits (the host table in `image-tools.md`, a path in `SKILL.md`, a sentence of the series gate), went through to its report: the same three calls with the reference, the pictures called test patterns that "need repair" and kept as told. |
| No image tool at all | Not run in Codex: an attempt failed because the service reported that the model was at capacity, and the next because the account's usage limit had been reached. A Claude agent stood in, the way the first matrix did: it was given the committed skill installed in a project folder, told that it had no image tool, and asked for two Xiaohei images. Its first sentence said that it was using Prompt mode, and it named the shortest way out (an agent with an image tool, or one you connect). It saved a `prompts.md` with the shot list and two prompts, and `matchesTemplate` finds both faithful to the pack's template, with one Character paragraph and the reference sentence left out of both. It reported each image as "not generated: prompt mode" and the reference as not supplied, said which file to attach and which sentence to add if the user's tool takes images, and said that nothing had been reviewed. |

**What this does not show.**

- Antigravity, Cursor, Gemini CLI, and Claude Code were not run. The Codex logs show what Codex's tool accepts. They say nothing about the others.
- One repository, one request, one model, and one run per row: the same text can draw the character well one time and badly the next. The runs show that the lock attaches the reference every time and that the gate rejected and repaired the faults it was written for. They do not give a rate.
- The images were read by agents. The reading of an image is a judgment, and a person reading the same images may fail one that was passed (the proportions of image 2 in C are taller and narrower than the others', for example) or pass one that was failed. The comparison with a second agent that was not told the order was made for A and B only.
- Whether an explanation is good is not scored, apart from the existence of its citations and the twenty-one claims checked by hand. The plain-idea rules did not remove every machine from the pictures: F's third picture is a drum and its fourth a press. Whether each metaphor's "because" holds was not scored.
- F's `explanation.md` names its source folder by an absolute path on the maintainer's machine. The method says "the URL or folder", and a run may write a name instead, as C did.
- The stand-in tool says nothing about how any real tool uses a reference.
- The Codex account's usage limit ended the testing. It stopped the Cursor-shaped stand-in run before the agent reviewed its pictures or reported, and it stopped the Codex run without an image tool, which one Claude agent stood in for. That agent is not Codex, and it was told the situation.

## Stale image reuse and false generation reports, 2026-10-19

**What happened.** After the character lock was published, the same kind of request was repeated in Google Antigravity, in the workspace of the repository it asked about: "Usa InkExplain con Xiaohei para explicarme todo el codigo de este repo" followed by the URL of a private repository (not named here). Antigravity keeps a transcript of each conversation (`transcript.jsonl`, in the conversation's `.system_generated/logs` folder), and this one was read for the shape of its image calls and for what the agent did and said. Two things were true at once.

- **The reference reached the generator.** The conversation holds one image call, `generate_image`, with the arguments `Prompt`, `ImageName`, `AspectRatio`, and `ImagePaths`, and `ImagePaths` held exactly one path: the packaged `xiaohei.png` in the project's `.agents/skills/inkexplain/` folder. The tool answered with the path of a JPEG in Antigravity's own folder, outside the project, and the agent copied it into the output folder.
- **The series was not new.** The output folder already held four JPEGs from an earlier run. The agent opened all four. Its own notes, written before it made that one call, name "ear-like points/tufts" in three of them as the drift the pack warns about, and conclude that the existing images "sufficiently cover the architecture". It then saved the new image beside them as the fifth, and its reply and saved review gave all five images "Generated: yes, file verified: yes, visually inspected: yes". Three of the four old images were called "identity consistent (slight silhouette variation)".

So the lock was not tested on a fresh series: one image in five was new. The failure is one of provenance and approval, not a result for or against the reference.

**What the text allowed**, read from the files that conversation loaded (the published `delivery.md` and `qa-checklist.md`):

- "If a name is taken, continue the numbering" and "Keep earlier results" turned a folder left by an earlier run into the series of a new request.
- Nothing said that an image counts as generated only if a call of this run made it, so an old file in the output folder could be listed as generated.
- A verdict could carry a qualifier, and the checklist said that "a slightly longer leg or a different lean" is not material, which left room for "slight silhouette variation" next to a note that named ear-like tufts.
- Nothing said that a note which names a locked feature as present ends the approval of that image.

**What changed** (the details are in `references/workflow/delivery.md`, `qa-checklist.md`, `character-lock.md`, and `image-tools.md`):

- **A fresh run for every request.** A Generate or Edit request writes into its own folder, `assets/<slug>-<suffix>/run-<date>-<time>-<digits>/`. Earlier output is never deleted, moved, overwritten, opened, rated, or delivered, and a repeated request makes all of its images again. Reuse needs the user's words, is listed as reused, and is never counted as generated.
- **A run record.** `manifest.json` in the run folder has a row for each image: the call that made it, the tool's own answer, the path the tool reported, the file's hash, whether the packaged reference went through the tool's image input on that call, whether the image was inspected, and the verdict. The report starts with the run's counts (calls, new, reused, failed, held, accepted), which must agree with the calls the agent made. A file in a folder, however recent, and a hash are not evidence of a call.
- **Conservative verdicts.** Four phrases and no qualifier: identity consistent, needs repair, needs human review, unable to verify. An observation that names a locked feature fails the image whatever follows it, a hedged observation holds it, and a series with a failed or unverified image is never reported as a passed consistency check.
- **Honest coverage for "all the code".** A request for all of it gets what was read, how much, and how to continue.
- **JPEG is JPEG.** Antigravity writes JPEG, so the file keeps its real extension.
- **Tools, not in the skill.** `scripts/audit-run.mjs` reads a run folder against its record: every image is a row, no new image is a byte-for-byte copy of an earlier one, reused images are labeled, hashes match, the counts add up, and no image is approved without an inspection. Given a snapshot taken before the run, it also fails if earlier output was deleted, moved, or changed, or if anything was written outside the run folder, and given the host's log of calls it fails if the record claims more calls than the log shows. `scripts/audit-series.mjs` now reads Antigravity transcripts too.

**Checked against the real transcript.** `audit-series` reads the conversation above as one image call whose first and only reference is the packaged `xiaohei.png`, with no render and no "last images" option. The conversation predates the run record, so `audit-run` has no record to read in it. Had it been present, a record listing five generated images against one call would fail on the calls, and a copy of the four old files into the run would fail on the bytes.

**A repeated request in Codex, with earlier output in the folders (S1).** The case was rebuilt in Codex CLI 0.160.0, whose session log can be read. A checkout of the public simulator repository held sixteen earlier files in three folders that an agent could pick for it: twelve images from earlier runs of the experiments above (among them the egg-shaped and white-lined Xiaohei images) and four text files. The request was the Antigravity one in kind, with the repository's URL: "Usa InkExplain con Xiaohei para explicarme todo el codigo de este repo https://github.com/agustinpabon/fifa-world-cup-2026-simulator". The skill was this change's text as it stood then (tree `f23530d5c2b87f8744c6600749217acfcf3fa051`), before five small edits: the checklist is read first, a series never stops after one call, an agent does not update a skill on its own, each row says where its file was saved, and `delivery.md` carries the rules for judging conservatively. `scripts/audit-run.mjs` read the new folder with a snapshot taken before the run and the session log, and the images were looked at:

| | Result |
|---|---|
| Where it wrote | a new folder, `run-20261019-004840-4b8a`, inside `assets/fifa-world-cup-2026-simulator-xiaohei/`, the folder that held four earlier images: its images, `prompts.md`, `explanation.md`, and `manifest.json` |
| Earlier output | 16 files, all as they were; nothing written outside the run folder; none of the agent's 31 pieces of code named an earlier image |
| Calls | 7 image calls in the session log and 7 in the record (`--exact`) |
| New images | 7, none byte-identical to any of the 12 earlier images; 6 accepted, 1 rejected, 0 reused, 0 held |
| Reference | `xiaohei.png` was the first image of all 7 calls, in the log |
| The rejected image | the first attempt at the third scene: a tray hid the figure's feet and the figure was too large, so the legs check could not be answered, and the agent rejected the image and made it again |
| The reply | "siete llamadas, siete imágenes nuevas, seis finales aceptadas y un intento rechazado conservado; ninguna reutilizada ni pendiente", and "las salidas anteriores quedaron intactas" |
| Coverage | "140 of the 281 tracked files", 103 of them in full, and no line-by-line reading claimed, for a request for "all the code" |
| The explanation | 63 citations to 41 files; two do not resolve, and both name runtime files (a remote CSV, and a config file that the text says does not exist in the checkout) |
| The images | read by Claude: one character in all six final images, a solid black dome, two plain white dot eyes, two thin legs, thin single-stroke arms, and no ears, tail, or white marks; the body ranges from a narrow bean to a rounded block |

**The same request again, in the same workspace (S2).** Run right after S1, in the same checkout, with the same request, on the skill tree that is committed (`67e937be90b1ef1d0f2a18ce561a44d2bca73867`). `assets/fifa-world-cup-2026-simulator-xiaohei/` now held the four earlier images, S1's run folder, and an `explanation.md` from an earlier run. It was audited the same way, with a snapshot taken before the run and the session log, and the images were looked at:

| | Result |
|---|---|
| Where it wrote | a second run folder, `run-20261019-010734-b7bf`, beside S1's `run-20261019-004840-4b8a`: its images, `prompts.md`, `explanation.md`, and `manifest.json` |
| Earlier output | 26 files, S1's run folder among them, all as they were; nothing written outside the run folder; none of the 163 tool calls of the agent and its five helper agents named one of the 19 earlier images or an earlier folder |
| Calls | 18 image calls in the session log and 18 in the record (`--exact`); two were refused by the tool (`moderation_blocked`, no image returned) and were made again |
| New images | 16, none byte-identical to any of the 19 earlier images, seven of which are S1's; 8 accepted, 7 rejected, 1 held, 0 reused |
| Reference | `xiaohei.png` was the first image of all 18 calls, in the log |
| The reply | "18 llamadas, 16 imágenes nuevas, 8 aceptadas, 7 intentos rechazados y 1 pendiente de revisión, sin reutilizaciones", and "La referencia de Xiaohei acompañó todas las llamadas". It gave the verdict to each of the eight finals and did not call the series consistent: the record's own review says the run did not pass as a whole, since it keeps seven rejected attempts and one held |
| Coverage | "139 archivos: 119 con lectura amplia y 20 selectivamente", of 281 tracked files, with an appendix of the scope and the files left |
| The explanation | 75 citations to 58 files; every one resolves |
| The images | all sixteen read by Claude. The eight finals show one character: a solid black dome, two plain white dot eyes, thin legs, thin single-stroke arms, and no ears, tail, or white marks; the body ranges from a narrow bean to a wide rounded block. Of the eight others, five rejections show what the agent wrote (a table hiding the legs, a sack that makes the body read as a crescent, and a white line across the body, three times), and the held image has an arm tip that I cannot resolve either. The other two rejections (the lower edge of the body behind a workbench, and a small loop at the end of an arm) are stricter than I would have been |

**What went past the text.** The lock allows two repairs per image and six per series. The agent made eight, and kept to two per image. Its reply does not say that the series limit was passed; its counts show it (18 calls for eight scenes). Nothing checks the limit: a row does not say which image it repairs, so the audit cannot count repairs, and the limit is a rule of the text and nothing more.

**What this does not show.**

- Antigravity was not run for this change, here or in the smoke test below. What is known of it is one user's transcript.
- A record is written by the agent. The audit makes a false one detectable when the host's log exists, and it does not make it impossible. Antigravity's transcript is such a log. A host that keeps none leaves only the agent's word.
- The review of an image is still a model looking at a picture. The new rules make it harder to approve a flaw it has already noted, and they cannot make it see what it does not.
- Two fresh series in Codex are two samples, not a rate. The first ran on an earlier tree than the one committed, and the second on the committed one.

### Smoke test for Google Antigravity

Not run: InkExplain has not run in Antigravity, so nothing here says that it passes. This is the test to run there, and it is a repeated request, the case that failed. In a project that has the skill (`npx skills add agustinpabon/InkExplain --skill inkexplain`, or copy `skills/inkexplain/` into the project's `.agents/skills/` folder), give the agent this request once, and then again in the same project, with no attachment and no word about references or folders:

> Usa InkExplain con Xiaohei para explicarme todo el codigo de este repo https://github.com/agustinpabon/fifa-world-cup-2026-simulator

Any repository the agent can read will do. A public one keeps private code away from the image tool. The commands below run from a checkout of InkExplain and take paths into the project. Before the second request, `node scripts/audit-run.mjs --snapshot <project>/assets/<slug>-xiaohei > before.json` lists what the first run left. A pass looks like this:

1. The second request made a new folder, `assets/<slug>-xiaohei/run-<date>-<time>-<digits>/`, and all of its images are in it. Nothing from the first run was deleted, moved, overwritten, or listed as new.
2. The number of `generate_image` calls in the conversation's transcript equals the number the report gives, and the images in the run folder account for them (a repair is a call too). `node scripts/audit-run.mjs --before before.json --calls <transcript.jsonl> --exact --reference references/archetypes/xiaohei/xiaohei.png <project>/assets/<slug>-xiaohei/run-<id>` checks it, and also that every call passed `xiaohei.png` in `ImagePaths` and that no new image is a copy of an old one. The transcript is `transcript.jsonl` in the conversation's `.system_generated/logs` folder, under `brain/<conversation id>/` in Antigravity's folder (`~/.gemini/antigravity/`, on the machine where this was analyzed).
3. Open each new image next to `xiaohei.png`: a solid black dome, two plain white dot eyes, no pupils, no ears, no tail, no snout, exactly two thin legs, at most two thin single-stroke arms, one flat black fill, and the same ink weight in every image.
4. Each image's verdict is one of four phrases, with no qualifier. An image with ear-like points, a changed face, or thick limbs is "needs repair" or "needs human review", never "identity consistent", and the report does not call the series consistent while one of its images failed.
5. The explanation names the commit, how much was read, and what was not covered, and says so plainly when the request asked for "all the code". `node scripts/check-explanation.mjs --root <the explained repository> <explanation.md>` checks its citations.

If a point fails, note which one and keep the transcript: it is the evidence.

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

The description changed on 2026-10-17, after real Codex runs showed the old one losing a request about a document to the host's own image skill ([Real hosts](#real-hosts-2026-10-17)). The list was run again on the new description, with 24 requests: the first 20 above, and four that matter most to the change. The chooser was one fresh Claude agent, shown the new description beside eight neighbors, one of them Codex's real `imagegen` description. It chose InkExplain for all 12 requests it should handle and for "generate an illustration of how a hash map finds a value by key", which is arguable, and for none of the 11 it should not handle: the revenue chart, the logo, the photorealistic lake, the Mermaid diagram, the UI mockup, the PDF summary, the CEO portrait, the draw.io diagram, the slide deck, the React bug, and a pixel-art sprite sheet. It named eight close calls: the logo, the mockup, and the portrait (which skill among the design ones), and the cache idea, the label repair, the hash-map picture, the cartoon retry logic, and the stick-figure algorithm (InkExplain against `imagegen` or a diagram tool). It is one model in one sitting, and this is the weak evidence it was before.

## What this does not show

- **Few images were rendered, and none was scored with the review protocol.** The maintainer made one image per character in Codex Desktop on 2026-10-17 (README gallery), and the Xiaohei series of 2026-10-18 above were made in Codex CLI and read by agents, not by a person. The other runs described here made none. The skill's prompts are well-formed and faithful to their packs; whether an image model draws Stickman's single figure consistently, keeps Littlebox's body white on a white page, or leaves the rights note's words out of the picture (every third-party prompt carries it, with a line saying not to draw it) is untested. No render of Sketch, of Littlebox on its white default, or of Stickman exists, and the earlier Littlebox gallery images, which predate the white default, are withheld.
- **One real host, one model, few runs per request.** Codex CLI picked the skill up by itself for requests about an article, a document, or a named character, and not always for a one-off "generate an illustration of X" or for an image repair. The same request sometimes loaded the skill and sometimes did not, so the table above reports what happened, not a rate. Whether Claude Code or Cursor loads InkExplain by itself for a request like "illustrate this post" is untested: the Claude agents of the first matrix were pointed at the installed skill.
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

The Xiaohei series is repeated the same way: copy `skills/inkexplain/` into the `.agents/skills/` folder of a fresh checkout of the repository to explain, give Codex CLI (`codex exec`) the one sentence above, and read what it saved. Give it the same sentence again in the same checkout to see a repeated request. `scripts/audit-run.mjs` checks a run folder against its record, a listing taken before the run, and the session log that Codex keeps under `~/.codex/sessions/`; `scripts/audit-series.mjs` checks the attachments from the same log; and `scripts/check-explanation.mjs` checks the citations. None of them judges the pictures: open them next to `xiaohei.png`.
