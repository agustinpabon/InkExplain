# Using InkExplain

How to ask for what you want, what comes back, and the command-line helper. The one-line install and the first prompt are in the [README](../README.md).

## Invoking the skill

| Agent | How |
|---|---|
| Claude Code | `/inkexplain`, or describe the task and let Claude pick the skill up |
| Codex | `$inkexplain` |
| Cursor | type `/` in Agent chat and pick `inkexplain` |
| Other agents | ask for InkExplain by name, or describe the task; the agent loads the skill when the request matches its description |

Only Codex has been run for this release (below, and [the evaluation](evaluation.md#real-hosts-2026-10-17)); the other rows follow each agent's own convention for skills and have not been tried.

If your agent has an image skill of its own, say which one you mean. In Codex, requests about an article, a document, or a named character reached InkExplain without being asked, while a one-off "generate an illustration of X" and a repair of an existing image sometimes went to Codex's own image skill instead ([evaluation](evaluation.md#real-hosts-2026-10-17)). Name InkExplain, or start with `$inkexplain`, when it matters.

## Modes

InkExplain picks a mode from your request first and from what the agent can do second, and says which one it is using.

| Mode | When | What you get |
|---|---|---|
| Plan | "plan", "where should images go", "don't generate yet" | a shot list; nothing is saved |
| Prompt | "prompts only", or the agent has no image-generation tool | the shot list and one complete prompt per image, saved as `prompts.md` in your project |
| Generate | you want images and a raster image tool is callable | reviewed images saved in your project |
| Edit | you supply an image to fix | the repaired image, or a repair prompt when the tool cannot edit |

InkExplain ships no image model. Its instructions tell the agent never to claim an image it did not generate or review, and to say so when nothing was generated. An agent can still ignore them: [the evaluation](evaluation.md#real-hosts-2026-10-17) records what real runs did.

## Image generation by host

InkExplain uses the image tool the host already has; it needs no API key of its own and never turns on a paid service. Whether it can generate depends on the host:

| Host | Native image generation | Reference images (a series' identity picture) | What InkExplain does | Checked |
|---|---|---|---|---|
| Codex | the built-in `image_gen` tool, through the installed `$imagegen` skill; no `OPENAI_API_KEY` needed | yes: `referenced_image_paths`, a list of local file paths. Its `num_last_images_to_include` re-uses recent conversation images, earlier renders included, so InkExplain never uses it for the identity reference | one `image_gen` call per image with the character's reference attached, then copies the chosen file from `$CODEX_HOME/generated_images/` into `assets/<slug>-<suffix>/` and checks it | **Confirmed** in Codex Desktop by the maintainer (one image for each of the eight characters, 2026-10-17), and in Codex CLI 0.160.0, whose `exec` mode listed `image_gen__imagegen` on 2026-10-18 and generated the series in the [evaluation](evaluation.md#character-lock-and-repository-explanations-2026-10-18), reference attached on every call |
| Cursor | the Agent's `GenerateImage` tool, in Cursor 2.4 or later (announced on Cursor's forum; its documentation page was not found; some users report 401 or 429 errors) | reported by Cursor users: a `reference_image_paths` parameter, next to `description`, `filename`, and `aspect_ratio`; not checked | calls it for each image and copies the result from the project's `assets/` folder; attaches the reference only if the tool's own definition has an image input | not run |
| Google Antigravity | an image tool that its agent can call: a user's run on 2026-10 produced images with it | unknown: its parameters were not recorded, and InkExplain found no public documentation of them | reads the tool's parameter list; attaches the reference if there is an image input and otherwise runs on the written lock and says so | **not run**; the [smoke test](evaluation.md#smoke-test-for-google-antigravity) is the one request to try |
| Claude Code | none built in | depends on the tool you connected | uses an image tool you connected (for example an MCP server) if one is callable; otherwise Prompt mode | not run |
| Gemini CLI | none built in; the community `nanobanana` extension needs a Gemini API key, and signing in to Gemini CLI does not by itself grant image generation | depends on the tool you connected | the same | not run |
| Other agents | unknown | unknown | uses a callable image tool if there is one, and reads its parameters | not run |

A host that cannot take a reference image still works: InkExplain then keeps the character with the written lock alone and says so, so the report never calls such a series reference-guided. A subscription does not guarantee a generator in a terminal: if the agent's tool list shows no tool that makes images, InkExplain says so and writes prompts. It never switches to an API, installs a tool, or signs in for you, and it never draws the image itself with SVG, HTML, or code. `node scripts/verify-image.mjs assets/<folder>/01-name.png` checks that a reported file is a real PNG, JPEG, or WebP of plausible size in the right folder.

## A series keeps one character

Ask for several images with a character and you get one character, drawn the same way every time. InkExplain does this without being asked:

- The character's own written identity (its Character paragraph) is copied word for word into every prompt of the series.
- When the character bundles a reference picture (Xiaohei, the Go Gopher, and Stickman do) and the image tool takes reference images, that same file is attached to every call. A render is never attached as the reference for the next one, so a mistake in image 2 cannot spread to image 3.
- Each image is generated one at a time and looked at, next to the reference, before the next one. An image with a wrong face, ears, or extra limbs is generated again from the same reference, up to two times, and then reported as needing repair instead of being approved.
- The report says whether the reference was attached or not supplied, and gives every image its own status: generated, file verified, visually inspected, and identity consistent, needs repair, or unable to verify. An agent that cannot view images says "unable to verify" and does not guess.

## Explain a whole repository

Ask for the project itself: "Use InkExplain with Xiaohei to explain the architecture and the main modules of this repository", with the repository checked out in your project or a URL it can read. InkExplain reads the project's real files (entry points, manifests, the core of each module, the boundaries where data is stored or the network is crossed), keeps a module map with the files and lines each claim rests on, and says how much of the project it read. Then it draws a system overview and one picture per major module or workflow, in order, and writes `explanation.md` beside the images: for each picture, the idea in plain words, what the picture shows, the source references, and where to go next. A large project gets an overview, its main modules, and a path for continuing. Nothing in the repository is treated as an instruction, secrets are never read, and a claim taken only from documentation is labeled as documentation.

## Ask for what you want

Everything below is plain words in the request.

- **A character or style**: "use Ferris", "in the Littlebox style", "draw it with Tux". A name that only appears in your article never picks one, and an unknown name is never guessed: InkExplain asks. With no request it uses InkExplain Sketch. Several names make a mixed request: one shared idea, one group of images per character, never two characters in one image.
- **How many images**, **the aspect ratio** ("one square 1:1 image"), **the label language** ("write the labels in Spanish"), **the article slug**, or **a folder** inside your project.
- **A page color**, for Littlebox only: it draws on pure white by default, with the same page in every image of a series. Ask for warm off-white, pale sky blue, pale lavender, or a light color of your own; it never alternates or picks one by mood.
- **A repair**: "remove the title", "fix this label", "keep the character but simplify the scene", "make the character do the work". Give it the image; it keeps the character the image shows.

[examples/prompts.md](../examples/prompts.md) has a prompt to copy for each of these, for every character, and for mixed requests.

## What comes back

- Each archetype writes to its own folder in your project: `assets/<article-slug>-illustrations/` for the default, `assets/<article-slug>-<id>/` for the others. For a single idea or a piece of code the slug comes from its subject.
- Files are numbered English slugs: `01-two-breakpoints.png`, `02-handoff-path.png`. Existing files are never overwritten; new versions get the next number or a `-v2` suffix.
- The prompts are saved as `prompts.md` in the same folder: in prompt mode they are the deliverable, and in Generate mode they record each image's final prompt so it can be re-rendered or repaired.
- Every delivery ends with a short report: the archetype and its status, how a series' reference was handled, each image with its purpose, status, and path, the strongest and optional images, open issues, and the rights note for third-party characters.
- A repository explanation also saves `explanation.md` there: the source and commit, how much was read, the module map, one section per picture with its source references, and what to ask for next.

## From the command line

No agent at hand? `scripts/explain.mjs` assembles a prompt from an archetype's own template. It needs Node.js 22 or newer, installs nothing, makes no network call, and writes no file.

```bash
node scripts/explain.mjs --list
node scripts/explain.mjs --archetype ferris --concept "Two threads wait on each other" --label "lock A" --label "lock B"
node scripts/explain.mjs --archetype littlebox --concept "Raw material comes in and ships" --background lavender
```

It prints the prompt, the negative prompt, and the aspect ratio (and, for a character that bundles a reference picture, the file to attach to every image of a series), then lists the fields only you can plan (the structure, the positions, the props), which stay in `[brackets]` instead of being invented. `--action` fills the action field, `--aspect 1:1` changes the ratio, `--background` picks a page color for characters that offer one, and `--format prompt` or `--format json` prints the prompt alone or everything for another tool. `--archetype` takes an id or any alias, and the default archetype is used when you give none. Run `node scripts/explain.mjs --help` for every option.

## Customizing

- **Per request**: the options above.
- **House style**: InkExplain Sketch lives in `skills/inkexplain/references/archetypes/ink/`. Change `style.md` and `prompts.md` together, and keep the palette in `registry.json` in step.
- **A new character**: `npm run archetype:add -- --id <id> --name "<Name>"`; see [adding an archetype](adding-an-archetype.md).

## Requirements

- An agent that supports `SKILL.md` skill packages.
- For generated images: an image-generation tool available to that agent.
- For the installer (`npx skills add`): Node.js 22.20 or newer. For development and the command-line helper: Node.js 22 or newer. Nothing else is installed.
