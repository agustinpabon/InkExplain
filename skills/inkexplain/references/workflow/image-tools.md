# Image tools

How to find the host's image tool, call it, and save what it makes. InkExplain ships no image model, and it needs no API key of its own: it drives the generator the host already has.

## Find a tool: look, do not guess

Read the whole list of tools you can call right now: built-in tools and every `mcp__<server>__<tool>` name. A raster image tool takes a text prompt and returns a bitmap, and its name or description says so (`image_gen`, `GenerateImage`, `mcp__images__generate_image`). The built-in one being absent does not end the search: a connected tool counts. Known ones:

| Host | Tool | Notes |
|---|---|---|
| Codex | the built-in `image_gen` tool, normally reached through the installed `$imagegen` skill | Needs no `OPENAI_API_KEY`. |
| Cursor (Agent, 2.4 or later) | `GenerateImage` | Ask for the image explicitly. Cursor saves it under the project's `assets/` folder or `~/.cursor/projects/<project>/assets/`. |
| Any host | a tool the user installed (for example an MCP server) whose description says it generates images | It may bill the user. Use it only because it is already connected. |

These do not count as an image tool: a skill file by itself, a missing API key, a display helper (`view_image`, `generatedImage`), and drawing code (SVG, HTML, CSS, canvas, a screenshot, a diagram). An absent key never means an absent tool: Codex's built-in tool needs none. If, after reading every name, none generates images, you do not have one. If one does, call it: do not choose Prompt mode first.

Claude Code and Gemini CLI have no built-in generator. If the user connected one, it is in your tool list; otherwise use Prompt mode.

## Call it

- **One image, one call**, from that image's own assembled prompt (`prompt-assembly.md`), unchanged. Do not merge several images into one call, and do not wrap the prompt in another template.
- **Codex:** load `$imagegen` and follow it: it uses the built-in `image_gen` tool. Never run its `scripts/image_gen.py` CLI, and never fall back to the API on your own: that path needs `OPENAI_API_KEY` and costs the user money. If the built-in tool fails, say so, say the CLI fallback exists and needs a key, and continue only if the user asks for it.
- **Attached references** (for example a pack's reference image) are passed as references, never as a layout.
- Never install a tool, add a key, or sign in to a service for the user.

## Save and verify

1. The tool usually writes outside the workspace (Codex: `$CODEX_HOME/generated_images/...`). Copy the chosen image into the output folder from `delivery.md`, named `NN-topic-slug.png`, and keep the original where it is. Never overwrite.
2. Verify the copy: list the folder; the file exists and is not empty; open it with the host's image viewer and look at it. A path you did not list is not a path you may report.
3. Report the exact saved path, the tool used (the host's built-in tool, or the name of the user's tool), and the final prompt.

## When the tool fails or refuses

- Say what happened in plain words: the tool's own message, and which image.
- A refusal or a transport error: retry that image once, with the same prompt. If the tool names a content problem, remove only that element.
- If it still fails, or no tool is callable: switch the remaining images to Prompt mode, say why, and list which images exist and which do not.
- Never replace a failed image with your own drawing, with code, or with a path you did not create.
