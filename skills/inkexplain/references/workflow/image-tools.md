# Image tools

How to find the host's image tool, read what it can take, call it, and save what it makes. InkExplain ships no image model, and it needs no API key of its own: it drives the generator the host already has.

## Find a tool: look, do not guess

Read the whole list of tools you can call right now: built-in tools and every `mcp__<server>__<tool>` name. A raster image tool takes a text prompt and returns a bitmap, and its name or description says so (`image_gen`, `GenerateImage`, `mcp__images__generate_image`). The built-in one being absent does not end the search: a connected tool counts. Known ones:

| Host | Tool | Notes |
|---|---|---|
| Codex | the built-in `image_gen` tool, normally reached through the installed `$imagegen` skill | Needs no `OPENAI_API_KEY`. Codex 0.160.0 lists it as `image_gen__imagegen`. It has no size parameter: ask for the ratio in the prompt. |
| Cursor (Agent, 2.4 or later) | `GenerateImage` | Ask for the image explicitly. Cursor saves it under the project's `assets/` folder or `~/.cursor/projects/<project>/assets/`. |
| Google Antigravity | the image tool its agent lists | A user's run produced images with it. Its parameters were not recorded. |
| Any host | a tool the user installed (for example an MCP server) whose description says it generates images | It may bill the user. Use it only because it is already connected. |

What each takes as an image input:

- **Codex**: `referenced_image_paths`, a list of local file paths. Checked by InkExplain's own runs.
- **Codex, a trap**: its `num_last_images_to_include` selects recent conversation images, earlier renders among them: never use it for an identity reference.
- **Cursor**: users report a `reference_image_paths` parameter next to `description`, `filename`, and `aspect_ratio`. Not checked here: read the tool's own definition.
- **Google Antigravity**: read its parameter list. Not checked here.
- **Any other tool**: whatever its parameters say. An image-path or reference-image input counts, and a prompt-only tool takes none.

These do not count as an image tool: a skill file by itself, a missing API key, a display helper (`view_image`, `generatedImage`), and drawing code (SVG, HTML, CSS, canvas, a screenshot, a diagram). An absent key never means an absent tool: Codex's built-in tool needs none. If, after reading every name, none generates images, you do not have one. If one does, call it: do not choose Prompt mode first.

Claude Code and Gemini CLI have no built-in generator. If the user connected one, it is in your tool list; otherwise use Prompt mode. When you fall back to Prompt mode for lack of a tool, say it in one plain sentence and name the shortest way out: use an agent that has an image tool (Codex, Cursor Agent), or connect an image tool you already use. Do not explain providers, keys, or MCP unless asked, and do not set anything up yourself.

## Read what it can take

Before the first call, read the tool's own parameter list, not its name and not this table. Do not assume that a host takes image references, edits images, or keeps an image session because another host does, and do not claim a capability you did not see in the tool's definition.

1. **Does it take image files?** A list of image paths, a reference-image field, or an attachment slot means yes: the pack's identity reference goes in it on every call (`references/workflow/character-lock.md`). A prompt-only tool takes none, so the series runs on the written lock alone and the report says so.
2. **Are those images references or edit targets?** An input described as "for editing" still takes the reference: name its role in the prompt (the pack's reference sentence says the image is an identity and style reference, not something to edit or copy). A tool that can only edit does not draw new scenes from a reference.
3. **Can it set the aspect ratio?** Use the parameter when it has one. Otherwise ask for the ratio in the prompt, as the template does.

Write down what you found (the tool's name, the input you used or the lack of one): the delivery report states it.

## Call it

- **One image, one call**, from that image's own assembled prompt (`prompt-assembly.md`), unchanged. Do not merge several images into one call, and do not wrap the prompt in another template.
- **Codex:** load `$imagegen` and follow it: it uses the built-in `image_gen` tool. Never run its `scripts/image_gen.py` CLI, and never fall back to the API on your own: that path needs `OPENAI_API_KEY` and costs the user money. If the built-in tool fails, say so, say the CLI fallback exists and needs a key, and continue only if the user asks for it.
- **The identity reference** goes through the tool's image input on every call of a series, as `references/workflow/character-lock.md` says: the same packaged file each time, never a render and never a layout to copy.
- Never install a tool, add a key, or sign in to a service for the user.

## Save and verify

1. The tool usually writes outside the workspace (Codex: `$CODEX_HOME/generated_images/...`). Copy the chosen image into the output folder from `delivery.md`, named `NN-topic-slug.png`, and keep the original where it is. Never overwrite.
2. Verify the copy: list the folder; the file exists and is not empty; open it with the host's image viewer and look at it. A path you did not list is not a path you may report.
3. Report the exact saved path, the tool used (the host's built-in tool, or the name of the user's tool), whether the identity reference was attached and through which input, and the final prompt.

## When the tool fails or refuses

- Say what happened in plain words: the tool's own message, and which image.
- A refusal or a transport error: retry that image once, with the same prompt. If the tool names a content problem, remove only that element.
- If a call fails only because the reference was attached, say so. Do not drop the reference and carry on as if it were attached: either continue the series on the written lock alone, saying so for every image, or stop and report.
- If it still fails, or no tool is callable: switch the remaining images to Prompt mode, say why, and list which images exist and which do not.
- Never replace a failed image with your own drawing, with code, or with a path you did not create.
