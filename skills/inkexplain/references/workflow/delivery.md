# Delivery

Where finished work goes and what the final report contains.

## A fresh run for every request

- Every Generate or Edit request is a new run with its own folder, `assets/<article-slug>-<suffix>/run-<id>/`. `<suffix>` is the archetype's output suffix listed in `references/routing.md` (the default archetype uses `illustrations`), and `<id>` is the date, the time, and four random hex digits, as in `run-20261019-143502-7f3a`. List the archetype's folder first, so that the id is new, and create the run folder before the first image call.
- Everything this request makes goes in the run folder: its images, `prompts.md`, `explanation.md` for a repository, and `manifest.json`, the run record (below).
- The archetype's folder may already hold images and earlier runs. They are not part of this request. Never delete, overwrite, move, or rename them, and do not open, review, rate, or deliver them. They may tell you what was explained before. They never count as images generated now.
- Fresh generation is the default for "generate", "illustrate", and "explain visually", also when the folder already exists and when the request repeats an earlier one. Plan the images this request needs and generate each of them now: do not stop after one call because earlier images already cover the topic.
- Reuse earlier images only when the user asks for it in words: reuse, continue, add to, or edit them. A reused image stays where it is. The run record lists it as reused with its path, and every place that shows it says "reused, not generated in this run". An edit is a new generation: its result is a new file in this run, with the earlier image as its source.

## Where files go

- Save accepted images in the user's workspace (the project folder the session is working in), never inside the skill package.
- `<article-slug>` is the slug the user gave; otherwise use a short lowercase kebab-case English slug of the article title, dropping filler words, with ASCII letters, digits, and hyphens only, at most 60 characters. When the source is a single idea or a piece of code rather than an article, make the slug from its subject (for example `cache-renewal` or `quicksort`) and give each image's placement as the file and lines it explains, or "standalone". For a repository, use its name.
- If the user names a different folder inside the workspace, put the archetype's folder there and the run folder inside it. Never write outside the workspace or inside the skill package, and never use `..` or an absolute path to leave it. The one exception is the shallow clone of a repository the user gave as a URL (`references/workflow/repository-explanation.md`), which lives in the system's temporary folder and is deleted when you finish.

## File names

- Use `NN-topic-slug.<ext>`: a two-digit order number that starts at 01 in each run folder, a short English kebab-case topic, and the extension of the format the tool actually made (`.png`, `.jpg`, or `.webp`), for example `01-two-breakpoints.png`. A tool that writes a JPEG gives a `.jpg` file: never rename it to `.png`.
- Never overwrite. List the run folder before saving; if a name is taken, append `-v2`, `-v3`.
- Keep this run's earlier attempts. A repaired image keeps its earlier attempts under their own names (`-v2`, `-v3`), and the report says which files are final. The user decides what to delete.

## Saved prompts

Inside a project, save `prompts.md` in the run folder with each planned file name, its placement, its core idea, the facts that must hold in it (`references/workflow/concept-extraction.md`), and its full prompt. In prompt mode there is no run folder: save it in the archetype's folder and never over an earlier one. In prompt mode the reply carries the shot list and every complete prompt as well, because a link to a file is not the deliverable; the file is the copy that can be rerun later. In Generate mode the file records the final prompt of each image, so the image can be re-rendered or repaired later, and the series review: the reference mode and each image's status (below). An edit prompt for an image the tool cannot edit goes in the same file, with the name of the image it repairs.

The run folder holds the images, `prompts.md`, `manifest.json`, and, for a repository, `explanation.md`. Do not scatter other files there: the plan, the review, and the repairs are recorded in `prompts.md`.

Confirm that a file exists before you report its path: list the folder after writing it. Write with the host's file-editing tool when it has one, because a shell here-string or redirect can fail on the quotes and backticks in a prompt. If a write fails, say so and give the prompts in the reply.

## The run record

`manifest.json` in the run folder says what this run did, so that anyone can tell a new image from an old one. Create it before the first image call, add each call's row as soon as the call returns, complete it after the review, and keep each entry short:

```json
{
  "run": "run-20261019-143502-7f3a",
  "archetype": "xiaohei",
  "mode": "generate",
  "tool": "<the image tool's name>",
  "host_call_records": "none visible to the agent",
  "reference": { "file": "<path of the packaged identity reference>", "input": "<name of the tool's image input>", "attached_to_every_call": true },
  "planned_images": 1,
  "repairs": { "used": 0, "per_image_limit": 2, "series_limit": 6 },
  "reviewed_by": "self",
  "images": [
    {
      "file": "01-system-overview.png",
      "origin": "generated",
      "call": 1,
      "tool_result": "<what the tool returned for this call>",
      "source": "<the path the tool reported, before you copied the file>",
      "destination": "assets/<article-slug>-<suffix>/run-<id>/01-system-overview.png",
      "sha256": "<64 hex digits, or null>",
      "reference": "attached",
      "inspected": true,
      "checks": { "Body": "<what you see inside the outline besides the flat fill>", "Top of the head": "<what you see>", "Eyes": "<what you see>", "Face": "<what you see>", "Legs": "<what you see>", "Arms": "<where each leaves the body, and whether it crosses the body>", "Line and fill": "<what you see>", "Size": "<what you see>", "Page and accents": "<what you see>" },
      "defects": [],
      "verdict": "identity consistent",
      "meaning": { "facts": { "<a fact from the plan>": "<what the picture shows about it>" }, "numbers": "<every number and comparison drawn, with the totals you worked out, or none>", "labels": "<every word drawn, the object it names, and whether it reads upright>", "alone": "<what is being done, by whom, and what a reader takes from the picture without its caption>", "defects": [], "verdict": "accurate" },
      "accepted": true
    }
  ],
  "failed_calls": [],
  "series_review": { "reference_opened": true, "images_opened": ["01-system-overview.png"], "pairs_compared": [], "observations": "<what you saw across the images>", "passed": true },
  "counts": { "generator_calls": 1, "new_images": 1, "reused_images": 0, "failed_images": 0, "held_images": 0, "accepted_images": 1 }
}
```

- `origin` is `generated`, `edited`, or `reused`. `call` is the number of the image-tool call in this run (1, 2, 3, and so on), and `null` for a reused image. An edited row also has `from`, the path of the image it was edited from. A repair row also has `repair_of`, the file of the attempt it replaces (`03-flow-v2.png` repairs `03-flow.png`). A reused image has no copy in the run folder, so its `file` is the earlier image's path from the workspace.
- `tool_result` and `source` are copied from the tool's own answer to that call, and `destination` is where you saved the file, from the workspace, inside the run folder. A file that is merely in a folder, however recent its date or whatever its hash, is not evidence of a call. If you cannot quote what the tool returned for an image, the image is not "generated".
- `sha256` is the hash of the saved file, from the host's shell (`sha256sum`, `shasum -a 256`, or PowerShell `Get-FileHash`), or `null` when the host cannot compute one. It identifies a file. It never shows that a tool made it.
- `reference` is `attached` only when that call passed the packaged identity reference through the tool's image input (`references/workflow/character-lock.md`), and `not supplied` otherwise. The run's `reference` block says the same for the whole run.
- `checks` is what you saw, written before the verdict: one entry for each row of the pack's "Identity checks" (or each marker in its `identity.md`), named as the pack names it, in your own words and with a count or a position ("two white dots in the upper third, nothing else white on the body"), never "ok" and never the pack's own sentence. `defects` lists each rule the picture breaks, including what the plan never asked for: a mark, stroke, texture, shape, or word that the reference and the plan do not have. A matter of degree (a leg a little shorter, a figure a little larger than planned) is written in its check and is not a defect, until the character stops reading as the reference's. An empty list says that you looked for defects and found none.
- `verdict` is one of the four phrases under "Status of each image", and it follows from `defects`: any listed defect makes it "needs repair", a doubt the picture does not settle makes it "needs human review" (name the doubt in `defects`), and "identity consistent" needs `defects` empty and every check answered. `accepted` is true only for "identity consistent" after an inspection, and only when the meaning review below is `accurate` too. A final image whose record lists a defect is not accepted. An image that is on-model and misleading is not accepted either.
- `meaning` is the second review, kept apart from the identity review (`references/workflow/qa-checklist.md`, "Review the meaning"). `facts` copies the facts that the plan set for this picture, each with what the picture shows about it. `numbers` and `labels` are read off the saved picture: the totals you worked out, and what each word names and whether it reads upright. `alone` says what is being done, by whom, and what a reader takes from the picture without its caption. `defects` lists what is false or misleading. Its `verdict` is `accurate` with none, `misleading` with any, `needs human review` for a doubt the picture does not settle, and `unable to verify` when you cannot see it.
- `reviewed_by` is `self` when only the agent that made the images looked at them, `independent` when another agent or model that was not told your verdict looked at every final image and the reference, and `human` when the user or another person says they checked. Write `self` unless the others really happened.
- `planned_images` is the number of pictures the shot list asks for, fixed before the first call. `repairs.used` is the number of rows that have `repair_of`, and the limits are two repairs for one image and six for the run: write the new number before a repair call, and make the call only if both limits hold (`references/workflow/character-lock.md`). The most image-tool calls a run may make is `planned_images` plus six repairs plus one retry for each call that returns no image.
- `failed_calls` lists each call that returned no image (refused, blocked, timed out) as `{ "call": 5, "error": "<the tool's own words>" }`. It is retried once, and a retry is a new call, not a repair.
- `series_review` records the series gate for two or more images (`references/workflow/qa-checklist.md`): whether you opened the reference, the files you opened, the pairs you compared (each pair is two file names, `["01-a.png", "02-b.png"]`; what you saw goes in `observations`), what you saw across the images, and whether the final image of every scene passed. A scene's final image is the last attempt of its chain of `repair_of`; earlier attempts stay in the run folder and in the counts.
- `host_call_records` says whether the host keeps a record of the image calls that the user can open (name it: a transcript or a log) or that none is visible to you. With none, the counts are your own, and the report says so.

The counts, which the report repeats:

| Count | What it counts |
|---|---|
| `generator_calls` | the image-tool calls you made in this run, repairs and failed calls included |
| `new_images` | the images those calls produced and you saved in the run folder, rejected attempts included |
| `reused_images` | earlier images the user asked you to reuse |
| `failed_images` | new images rejected by either review: "needs repair" for identity, or `misleading` in meaning |
| `held_images` | images that are "needs human review" or "unable to verify" in either review, and are not rejected |
| `accepted_images` | images that pass both reviews: "identity consistent" and `accurate` |

`new_images` plus `reused_images` always equals `accepted_images` plus `failed_images` plus `held_images`, and `new_images` never exceeds `generator_calls`. `generator_calls` is `new_images` plus the calls listed in `failed_calls`: the calls are numbered 1 to `generator_calls`, each is an image row or a failed call, and none is missing or repeated. Count your calls as you make them. If the host lets you read its own record of the calls (a transcript or a log), compare it with your count and report any difference. Never fill the counts in from the files you find in a folder.

## Repository explanations

A repository explanation also saves `explanation.md` in the run folder, written as `references/workflow/repository-explanation.md` says: the source and commit, the scope (the files you read, listed), what the project is, what a person can do with it, the main flows with their pictures, the module map, the principles, and where to go next. The reply opens with a shortened version of what the project is and what a person can do with it, then the pictures, then the delivery report, and gives the path.

## Plan mode

Plan mode saves nothing and has no separate report: the shot list is the deliverable. Each archetype's block names its folder, its status when it is not `active`, and its rights note, so the plan carries everything needed to write the prompts later.

## Status of each image

In Generate mode, every image in the report states these facts, each yes or no, and then one verdict.

| Fact | It is yes only when |
|---|---|
| Generated | a call you made in this run returned this image, and the run record quotes the tool's answer |
| File verified | you listed the run folder, and the saved file exists, is not empty, and is a PNG, JPEG, or WebP of plausible size |
| Visually inspected | you opened the saved image, and the reference when one was attached, with the host's image viewer and recorded what you saw in `checks` and `defects` |
| Meaning checked | you read the numbers and the words off the saved picture, set it against the facts of the plan and the source, and recorded it in `meaning` |

| Verdict | It means |
|---|---|
| Identity consistent | the image was visually inspected and every identity check passed against the reference and the rest of the series, each with a positive observation |
| Needs repair | the image was visually inspected and a violation is visible: it is clearly wrong, or it is still wrong after the allowed repairs |
| Needs human review | the image was visually inspected and a material doubt remains that the picture does not settle |
| Unable to verify | you could not view the image, so no visual claim is made about it |

Judge conservatively (the series gate in `references/workflow/qa-checklist.md` has the detail). A defect you can see (a white line, stripe, or scribble on a solid body, a mouth, ears, a tail, an extra or fused limb) makes the image "needs repair" however good the rest is. If any note of yours names a locked feature as present or changed (ear-like points or tufts, a mouth, a third arm, a different body), the image is "needs repair" and cannot be consistent, whatever follows the note. A hedged check ("seems", "probably", "slightly") makes it "needs human review". Say the verdict as one of these four phrases, with no qualifier: "identity consistent (slight variation)" is not a verdict, and an image that needs a qualifier is not consistent. A file check never makes an image consistent. An image you did not inspect is "unable to verify", whatever the file check says. An image you did not generate in this run is "reused", never "generated". When a series has a reference, say how it ran: "identity reference attached to every call (`<file>`, through `<input>`)" or "reference not supplied: <why>".

A second verdict, for meaning, goes beside the identity verdict: accurate, misleading, needs human review, or unable to verify (`references/workflow/qa-checklist.md`, "Review the meaning"). Say both. An image is accepted only when it is "identity consistent" and accurate: one that is on-model and misleading is not a correct explanation, whatever its identity verdict says.

## Delivery report

The report goes in your reply. A file may repeat it and never replaces it: the run, its counts, the reference mode, and every image's facts and verdict are what the user reads first. Keep it short:

- the run folder and its counts in one line, for example "run-20261019-143502-7f3a: 6 image-tool calls, 6 new images, 0 reused, 2 failed, 0 held, 4 accepted", and whether the host keeps a record of the calls that can be opened, or the counts are your own;
- the repairs used (`repairs.used` of six) and, for every image that still fails, the defect you saw and whether the repair limit was reached;
- who reviewed the images (`reviewed_by`) and what that means: a review by the agent that made them is a self-assessment that can miss a defect, so say so, and when the archetype has a reference, tell the user to compare the images with it;
- the archetype, plus its status when it is not `active`;
- for each image: file name, placement, the idea it carries, and its facts and both verdicts (above), identity and meaning, grouped as accepted, failed, held, and reused, with the defect of each image that is not accepted;
- the reference mode of a series, as above;
- what was saved (in prompt mode, `prompts.md` and the folder the images will go in) and, for images that do not exist, "not generated: prompt mode" with the reason;
- stability notes: the strongest images and the optional ones;
- open issues: anything review could not fix or could not verify. In prompt mode nothing was reviewed, so say that, and list what the user should check in the renders (for example the identity markers, the label spelling, and any rule the pack asks you to confirm);
- for a repository: where the source came from, how much of it you read ("an overview from N of about M files", never "all the code" unless you read all of it), and what to ask for next;
- when the archetype's folder held earlier output: one line saying that it was left untouched and is not part of this delivery.

Call a series consistent only when the final image of every scene is accepted. Otherwise say how many scenes passed and how many did not, name the defect of each that did not, list the rejected attempts, and never describe the run as a successful consistency check. The counts you give must agree with the calls you made.

For a third-party archetype, add the rights note from its `prompts.md`: credit and restrictions. For gated archetypes, also state that the images are for use within the user's own authorization and must not be published without it. For experimental archetypes, say that the pack is experimental.

## Mixed-archetype delivery

Report one block per archetype: the shared core idea, that archetype's images, its run folder, and its rights note. Each archetype has its own run folder (the same id may be used in each), its own run record, and its own numbering.

## Publishing reminder

Generated images belong to the user's project. When the user intends to publish images made with a third-party archetype, remind them of that archetype's credit and restrictions from `references/routing.md`.
