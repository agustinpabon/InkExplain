# Delivery

Where finished work goes and what the final report contains.

## Output folder

- Save accepted images in the user's workspace (the project folder the session is working in), never inside the skill package.
- Each archetype writes to its own folder, `assets/<article-slug>-<suffix>/`, where `<suffix>` is the archetype's output suffix listed in `references/routing.md`. The default archetype writes to `assets/<article-slug>-illustrations/`.
- `<article-slug>` is the slug the user gave; otherwise use a short lowercase kebab-case English slug of the article title, dropping filler words, with ASCII letters, digits, and hyphens only, at most 60 characters. When the source is a single idea or a piece of code rather than an article, make the slug from its subject (for example `cache-renewal` or `quicksort`) and give each image's placement as the file and lines it explains, or "standalone". For a repository, use its name.
- If the user names a different folder inside the workspace, use it. Never write outside the workspace or inside the skill package, and never use `..` or an absolute path to leave it. The one exception is the shallow clone of a repository the user gave as a URL (`references/workflow/repository-explanation.md`), which lives in the system's temporary folder and is deleted when you finish.

## File names

- Use `NN-topic-slug.png`: a two-digit order number, then a short English kebab-case topic, for example `01-two-breakpoints.png`.
- Never overwrite. List the folder before saving; if a name is taken, continue the numbering or append `-v2`, `-v3`.
- Keep earlier results. The user decides what to delete. A repaired image keeps its earlier attempts under their own names (`-v2`, `-v3`), and the report says which files are final.

## Saved prompts

Inside a project, save `prompts.md` in the archetype's output folder with each planned file name, its placement, its core idea, and its full prompt. In prompt mode the reply carries the shot list and every complete prompt as well, because a link to a file is not the deliverable; the file is the copy that can be rerun later. In Generate mode the file records the final prompt of each image, so the image can be re-rendered or repaired later, and the series review: the reference mode and each image's status (below). An edit prompt for an image the tool cannot edit goes in the same file, with the name of the image it repairs.

The output folder holds the images, `prompts.md`, and, for a repository, `explanation.md`. Do not scatter other files there: the plan, the review, and the repairs are recorded in `prompts.md`.

Confirm that a file exists before you report its path: list the folder after writing it. Write with the host's file-editing tool when it has one, because a shell here-string or redirect can fail on the quotes and backticks in a prompt. If a write fails, say so and give the prompts in the reply.

## Repository explanations

A repository explanation also saves `explanation.md` in the output folder, written as `references/workflow/repository-explanation.md` says: the source and commit, the coverage, the module map, one section per picture with its source references, and where to go next. The reply carries a shortened version and the path.

## Plan mode

Plan mode saves nothing and has no separate report: the shot list is the deliverable. Each archetype's block names its folder, its status when it is not `active`, and its rights note, so the plan carries everything needed to write the prompts later.

## Status of each image

In Generate mode, every image in the report states these facts, each yes or no, and then one verdict.

| Fact | It is yes only when |
|---|---|
| Generated | the image tool returned an image for this prompt |
| File verified | you listed the output folder, and the saved file exists, is not empty, and is a PNG, JPEG, or WebP of plausible size |
| Visually inspected | you opened the saved image, and the reference when one was attached, with the host's image viewer and wrote down what you saw |

| Verdict | It means |
|---|---|
| Identity consistent | the image was visually inspected and every identity check passed against the reference and the rest of the series |
| Needs repair | the image was visually inspected and a material violation remains after the allowed repairs |
| Unable to verify | you could not view the image, so no visual claim is made about it |

A file check never makes an image consistent. An image you did not inspect is "unable to verify", whatever the file check says. When a series has a reference, say how it ran: "identity reference attached to every call (`<file>`, through `<input>`)" or "reference not supplied: <why>".

## Delivery report

The report goes in your reply. A file may repeat it and never replaces it: the reference mode and every image's facts and verdict are what the user reads first. Keep it short:

- the archetype, plus its status when it is not `active`;
- the number of images;
- for each image: file name, placement, the idea it carries, and its facts and verdict (above);
- the reference mode of a series, as above;
- what was saved (in prompt mode, `prompts.md` and the folder the images will go in) and, for images that do not exist, "not generated: prompt mode" with the reason;
- stability notes: the strongest images and the optional ones;
- open issues: anything review could not fix or could not verify. In prompt mode nothing was reviewed, so say that, and list what the user should check in the renders (for example the identity markers, the label spelling, and any rule the pack asks you to confirm);
- for a repository: where the source came from, how much of it you read, and what to ask for next.

For a third-party archetype, add the rights note from its `prompts.md`: credit and restrictions. For gated archetypes, also state that the images are for use within the user's own authorization and must not be published without it. For experimental archetypes, say that the pack is experimental.

## Mixed-archetype delivery

Report one block per archetype: the shared core idea, that archetype's images, its folder, and its rights note. Each archetype keeps its own numbering.

## Publishing reminder

Generated images belong to the user's project. When the user intends to publish images made with a third-party archetype, remind them of that archetype's credit and restrictions from `references/routing.md`.
