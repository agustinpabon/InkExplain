# Provenance and rights record

Where InkExplain's material came from, what was checked, and what is still open. This is a maintainer's record, not legal advice and not a legal conclusion. The credits that travel with the product are in [ATTRIBUTIONS.md](../ATTRIBUTIONS.md), and each character's rights record is its pack's `rights.md`.

Last checked: 2026-10-16. Licenses were read from each repository's `LICENSE` file at the commit named, through the GitHub API.

## Lineage

| Project | Maintainer | License as read | Commit inspected | What InkExplain took from it |
|---|---|---|---|---|
| [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations) | yangchuansheng (Carson Yang) | MIT, `Copyright (c) 2026 Ian`. A fork of the project below, created 2026-06-12. | `30a9d4e05124fda05356acb679fa2989ed5cb51c` | the project layout and release process, the wording of six character packs, the English Xiaohei images (it also supplied the withheld sets below), `gopher.png` |
| [Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) | Ian (helloianneo) | MIT, `Copyright (c) 2026 Ian`. Created 2026-05-27. | `4102eb807f03bcb6e538a16e8b31b41db8b5b954` | Xiaohei, the Chinese-labeled Xiaohei images, the original skill concept |
| [5km Littlebox Illustrations](https://github.com/okooo5km/5km-littlebox-illustrations) | okooo5km | MIT, `Copyright (c) 2026 okooo5km`. Its `NOTICE.md` asks for the project name or a credit to okooo5km in derived documentation. | `37cd93ee516da0324577b7bbc8ca3146e5c8d8d7` and `d760004243e8a8613f7d140dbe1c6ee0e0df352a` | the Littlebox rules, and the pure white default background |
| [OpenClaw](https://github.com/openclaw/openclaw) | OpenClaw Foundation | MIT, `Copyright (c) 2026 OpenClaw Foundation`. The repository states no separate license or trademark policy for its mascot. | `c14793d35a10936ddea833e7808083fe57930616` | a description of the OpenClaw mascot |

The Littlebox source's own notice says its skill structure and workflow were inspired by Ian Xiaohei Illustrations. Visual IP Illustrations is a GitHub fork of it.

## What is original and what is adapted

Wording shared with the upstream projects was measured by comparing runs of consecutive words (8-word and 5-word windows) between each part of this repository and the upstream text at the commits above. A high share means shared wording; it says nothing about legal derivation.

| Part of the repository | Shared 8-word runs | Shared 5-word runs |
|---|---|---|
| `scripts/`, `tests/`, `docs/`, `.github/` | 0% | 0% |
| shared workflow modules, `SKILL.md`, registry | 0-2% | 2-5% |
| InkExplain Sketch and Stickman packs | 0% | 1% |
| Xiaohei pack | 1% | 4% |
| README, contributor guides, and example prompts | 4% | 6% |
| Ferris, Go Gopher, OpenClaw, Seal, and Tux packs | 13-16% | 22-24% |
| Littlebox pack | 13%: 12% in Visual IP Illustrations, 6% in the Littlebox source | 23%: 22% in Visual IP Illustrations, 13% in the Littlebox source |

So the code, tests, shared method, default style, Stickman, and documentation were written for InkExplain, while about a quarter of the wording of the six character packs, mostly in their motion guides, adapts text from Visual IP Illustrations. The project layout (an agents guide, a language policy, a release checklist, README translations in the same twelve languages, a package validator) follows that project too, with different text.

## Gallery images

All 16 images in `examples/gallery/` are unmodified copies: each has the same git blob hash as the file at the commit and path recorded in [provenance.json](../examples/gallery/provenance.json). None was generated for InkExplain. `npm run validate` fails if an image changes or has no recorded source (`ASSET-003`), and if an image sits in the gallery of an archetype whose public samples are not approved (`ASSET-002`).

| Set | Copied from | First published there |
|---|---|---|
| `en/xiaohei` | Visual IP Illustrations, `examples/images-en/` | 2026-06-15 |
| `zh/xiaohei` | Ian Xiaohei Illustrations, `examples/images/` | 2026-05-27 |

`skills/inkexplain/references/archetypes/gopher/gopher.png` is likewise a byte-identical copy of the identity reference in Visual IP Illustrations (SHA-256 `78a32c60f5567c9e0fe8fa1bf4dfc2a9506381561a9c1c34e6a1bc3ada260851`); where that file came from is open item 3. The only images original to this repository are the two brand SVGs and the Stickman pose sheet, which is hand-built vector art, not a render.

### Samples withheld pending review

Earlier versions of the gallery showed 64 more images, for five other characters. They were unmodified copies of Visual IP Illustrations files, and the registry recorded them as approved by Agustin Pabon on the days that project first published them, 2026-06-15 to 2026-06-17. Those were not reviews made for InkExplain, so each record was corrected to `pending`, and `ASSET-002` requires the images to be out of the gallery. They can be fetched again from the upstream commit recorded here.

| Set | Images | Upstream path (Visual IP Illustrations, commit `30a9d4e05124fda05356acb679fa2989ed5cb51c`) | First published there | Note |
|---|---|---|---|---|
| `en/ferris` | 8 | `examples/images-en/ferris/` | 2026-06-15 | |
| `zh/ferris` | 8 | `examples/images/ferris/` | 2026-06-16 | |
| `en/littlebox` | 8 | `examples/images-en/littlebox/` | 2026-06-15 | pale sky-blue and lavender backgrounds, not the pure white default |
| `zh/littlebox` | 8 | `examples/images/littlebox/` | 2026-06-16 | same backgrounds |
| `en/openclaw` | 8 | `examples/images-en/openclaw/` | 2026-06-17 | |
| `en/gopher` | 8 | `examples/images-en/gopher/` | 2026-06-17 | made with the old reference image (open item 3) |
| `en/seal`, `zh/seal` | 16 | `examples/images-en/seal/`, `examples/images/seal/` | 2026-06-15, 2026-06-16 | the character's rights are unresolved (open item 1); do not restore these without permission |

To publish a withheld set once you have reviewed it:

1. Copy its images from the upstream path and commit above into `examples/gallery/<en|zh>/<id>/`, and look at every one against the archetype's `identity.md` and `style.md`.
2. Add a set for the directory to `examples/gallery/provenance.json`, shaped like the Xiaohei sets: the same repository, commit, path, license, copyright, and first-published date, and for every file its git blob hash from `git hash-object`.
3. In `registry.json`, set the archetype's `sampleGates` to `approved` with your name, the day you reviewed, a decision, and the directories.
4. Run `npm run build:docs` and `npm run check`.

### What the withheld Littlebox images showed

All sixteen sat on the pale sky-blue or lavender option, alternating by position: odd images blue, even images lavender. That was the rule before pure white became Littlebox's default, so they showed the optional backgrounds, not the default. All sixteen were viewed once during this audit (a visual review by an AI assistant, not an approval). Against the pack's own identity rules, a twig arm crosses the front panel and reads as a mouth in `en` images 04, 05, 07, and 08 and in `zh` image 06, `zh` image 04 shows a second box with eyes and legs, and `en` image 08 puts amber tape on props. They are good candidates to regenerate on a white page once an image tool is available.

## Characters and their rights

| Archetype | Rights holder | License recorded | Public samples |
|---|---|---|---|
| InkExplain Sketch, Stickman | InkExplain contributors | MIT, original to this project | pending |
| Xiaohei | Ian | MIT; the project's MIT license covers its text and images, and it states no separate character or trademark terms | approved, copies of Ian's and the fork's images |
| Littlebox | okooo5km | MIT, with the credit request above | pending, the earlier samples are withheld |
| OpenClaw | OpenClaw Foundation | MIT repository license; no separate mascot or trademark terms stated, so the pack forbids any affiliation or endorsement claim | pending, the earlier samples are withheld |
| Ferris | Karen Rustad Tolva | CC0, as recorded from rustacean.net | pending, the earlier samples are withheld |
| Go Gopher | Renee French | CC BY 4.0, as stated on go.dev, so attribution travels with every published image; the bundled reference image is not one of go.dev's files (open item 3) | pending, the earlier samples are withheld |
| Tux | Larry Ewing | free to use and modify with credit to Larry Ewing and The GIMP; his page is offline, so the pack cites an archived copy and the Linux kernel's `COPYING-logo` | pending |
| Seal | Sealos (original mascot image) | none recorded for the character; see open item 1 | pending, the earlier samples are withheld |

## Open items for the maintainer

1. **Seal has no recorded rights for its source mascot.** The archetype depicts a hoodie seal derived from a Sealos mascot image that is not bundled. The Sealos project's own license (Sealos Sustainable Use License v1.0, read 2026-10-16) allows use only for internal business or personal non-commercial purposes, permits distribution only free and non-commercial, grants no other rights, and leaves its trademarks to applicable law. The 16 Seal images come from Visual IP Illustrations, whose maintainer's public GitHub profile lists Labring, the company behind Sealos, as his company; that does not by itself record permission from the rights holder, and an MIT license on a fork cannot grant rights in someone else's mascot. Until permission is recorded, either mark Seal `gated-authorized` and withhold its images, remove the archetype, or obtain written permission from the rights holder and record it in its `rights.md` and in `sampleGates.authorization`.
2. **Five sample sets are withheld until you review them.** `sampleGates` recorded Agustin Pabon as reviewer for Ferris, Seal, Littlebox, OpenClaw, and Go Gopher on 2026-06-15 to 2026-06-17. Those are the days the upstream project first published the images, not the dates of a review for InkExplain, so the records are now `pending` and the images are out of the gallery (see [Samples withheld pending review](#samples-withheld-pending-review)). Review the images, and for every set you approve, restore it and record your name and the day you did. Do not backdate a review, and do not restore the Seal sets before its rights are settled.
3. **The Go Gopher reference image has no recorded origin.** `gopher.png` is a clean, front-facing, cyan vector, 500 x 500, identical to the file in Visual IP Illustrations, which lists go.dev as its source without saying who drew this image. It is not one of the images on go.dev, whose own files are tan and hand-inked. It closely resembles the vector gopher by Takuya Ueda in `golang-samples/gopher-vector` (Creative Commons Attribution 3.0), itself drawn after Renee French's design, but that match was judged by eye and is unproven. Renee French's credit applies either way, and the pack's marker list was transcribed from this file, so it is kept in place and its rights record says plainly that its origin is unconfirmed. Confirm where it came from, or replace it with an official go.dev image and re-derive the markers.
4. **OpenClaw's mascot rests on a repository-wide MIT license.** The OpenClaw project states no separate license or trademark policy for its mascot, so the record is only as strong as that license; the pack forbids any claim of affiliation or endorsement. If you want more than that, ask the OpenClaw Foundation to confirm.
5. **Stickman, and a white Littlebox, have not been rendered.** No image-generation tool was available during this audit. Stickman ships `experimental`, and the Littlebox samples that were shown (now withheld) had the old backgrounds. Promoting Stickman and publishing new Littlebox samples is a short real-render check: see [before promoting Stickman](evaluation.md#before-promoting-stickman), [adding an archetype](adding-an-archetype.md#5-validate), and [publishing samples](adding-an-archetype.md#publishing-samples).
6. **How the history reads.** The commit history was consolidated under the maintainer's identity, so GitHub will show the maintainer as the author of every commit, including those that hold text adapted from the projects above. The Origins section of `ATTRIBUTIONS.md` and the credits in the README are what attribute that material; consider repeating them in the release notes. The English-labeled Xiaohei images were committed to the fork by its author, yet the fork's license names only Ian as copyright holder, so they are credited the way the fork credits them.
7. **Gallery credits must stay visible.** The gallery shows only Xiaohei, which asks for a credit to Ian, and the README keeps that next to the images. A withheld set brings its credit back with it: the Go Gopher is CC BY (credit Renee French wherever its images are published), Littlebox asks for a credit to okooo5km, and Ferris is CC0.
