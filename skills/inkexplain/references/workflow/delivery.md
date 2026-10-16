# Delivery

Where finished work goes and what the final report contains.

## Output folder

- Save accepted images in the user's workspace, never inside the skill package.
- Each archetype writes to its own folder, `assets/<article-slug>-<suffix>/`, where `<suffix>` is the archetype's output suffix listed in `references/routing.md`. The default archetype writes to `assets/<article-slug>-illustrations/`.
- `<article-slug>` is the slug the user gave; otherwise use a short lowercase kebab-case English slug of the article title, with ASCII letters, digits, and hyphens only, at most 60 characters. When the source is a single idea or a piece of code rather than an article, make the slug from its subject (for example `cache-renewal` or `quicksort`) and give each image's placement as the file and lines it explains, or "standalone".
- If the user names a different folder inside the workspace, use it. Never write outside the workspace or inside the skill package, and never use `..` or an absolute path to leave it.

## File names

- Use `NN-topic-slug.png`: a two-digit order number, then a short English kebab-case topic, for example `01-two-breakpoints.png`.
- Never overwrite. List the folder before saving; if a name is taken, continue the numbering or append `-v2`, `-v3`.
- Keep earlier results. The user decides what to delete.

## Prompt-mode files

In prompt mode inside a project, save `prompts.md` in the archetype's output folder with each planned file name, its placement, its core idea, and its full prompt.

## Delivery report

Keep it short:

- the archetype, plus its status when it is not `active`;
- the number of images;
- for each image: file name, placement, and the idea it carries;
- the saved paths, or "not generated: prompt mode" with the reason;
- stability notes: the strongest images and the optional ones;
- open issues: anything review could not fix or could not verify.

For a third-party archetype, add the rights note from its `prompts.md`: credit and restrictions. For gated archetypes, also state that the images are for use within the user's own authorization and must not be published without it. For experimental archetypes, say that the pack is experimental.

## Mixed-archetype delivery

Report one block per archetype: the shared core idea, that archetype's images, its folder, and its rights note. Each archetype keeps its own numbering.

## Publishing reminder

Generated images belong to the user's project. When the user intends to publish images made with a third-party archetype, remind them of that archetype's credit and restrictions from `references/routing.md`.
