# Provenance and rights record

Where InkExplain's material came from, what was checked, and what is still open. This is a maintainer's record, not legal advice and not a legal conclusion. The credits that travel with the product are in [ATTRIBUTIONS.md](../ATTRIBUTIONS.md), and each character's rights record is its pack's `rights.md`.

Last checked: 2026-10-17. Licenses were read from each repository's `LICENSE` file at the commit named, through the GitHub API. On 2026-10-17 the same files were read again at each repository's default branch (the four MIT repositories below, and the gopher-vector README), and the Ferris, Go gopher, and Tux sources were read again: nothing had changed, except that the spelling of Ferris's creator is now the one rustacean.net serves, Karen Rustad Tölva.

## Lineage

| Project | Maintainer | License as read | Commit inspected | What InkExplain took from it |
|---|---|---|---|---|
| [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations) | yangchuansheng (Carson Yang) | MIT, `Copyright (c) 2026 Ian`. A fork of the project below, created 2026-06-12. | `30a9d4e05124fda05356acb679fa2989ed5cb51c` | the project layout and release process, the wording of five character packs, the English Xiaohei images (it also supplied the withheld sets below) |
| [gopher-vector](https://github.com/golang-samples/gopher-vector) | Takuya Ueda (the drawing), after Renee French's design | Creative Commons Attribution 3.0 ([deed](https://creativecommons.org/licenses/by/3.0/)), as its README states, with a link to the unported deed in Japanese and no jurisdiction; the repository has no license file | `9fe99fbf17b019125bf649f8a921882b54e151a6` | the Go gopher identity reference, `gopher.png` |
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
| Ferris, Go Gopher, OpenClaw, and Tux packs (measured with the withdrawn Seal pack in the group) | 13-16% | 22-24% |
| Littlebox pack | 13%: 12% in Visual IP Illustrations, 6% in the Littlebox source | 23%: 22% in Visual IP Illustrations, 13% in the Littlebox source |

So the code, tests, shared method, default style, Stickman, and documentation were written for InkExplain, while about a quarter of the wording of the character packs it supplied (six when measured; Seal's has since been withdrawn), mostly in their motion guides, adapts text from Visual IP Illustrations. The project layout (an agents guide, a language policy, a release checklist, README translations in the same twelve languages, a package validator) follows that project too, with different text.

## Gallery images

All 16 images in `examples/gallery/` are unmodified copies: each has the same git blob hash as the file at the commit and path recorded in [provenance.json](../examples/gallery/provenance.json). None was generated for InkExplain. `npm run validate` fails if an image changes or has no recorded source (`ASSET-003`), and if an image sits in the gallery of an archetype whose public samples are not approved (`ASSET-002`).

| Set | Copied from | First published there |
|---|---|---|
| `en/xiaohei` | Visual IP Illustrations, `examples/images-en/` | 2026-06-15 |
| `zh/xiaohei` | Ian Xiaohei Illustrations, `examples/images/` | 2026-05-27 |

`skills/inkexplain/references/archetypes/gopher/gopher.png` is an unmodified copy of a file in gopher-vector (git blob `26b98931ab6f42d5892f22cba85f93b90ad9fc4c`), recorded in the Go Gopher rights record and checked by a test; it replaced an earlier, unrecorded adaptation of the same drawing (open item 3). The only images original to this repository are the two brand SVGs and the Stickman pose sheet, which is hand-built vector art, not a render.

### Samples withheld pending review

Earlier versions of the gallery showed 64 more images, for five other characters. They were unmodified copies of Visual IP Illustrations files, and the registry recorded them as approved by Agustin Pabon on the days that project first published them, 2026-06-15 to 2026-06-17. Those were not reviews made for InkExplain, so each record was corrected to `pending`, and `ASSET-002` requires the images to be out of the gallery. They can be fetched again from the upstream commit recorded here.

| Set | Images | Upstream path (Visual IP Illustrations, commit `30a9d4e05124fda05356acb679fa2989ed5cb51c`) | First published there | Note |
|---|---|---|---|---|
| `en/ferris` | 8 | `examples/images-en/ferris/` | 2026-06-15 | |
| `zh/ferris` | 8 | `examples/images/ferris/` | 2026-06-16 | |
| `en/littlebox` | 8 | `examples/images-en/littlebox/` | 2026-06-15 | pale sky-blue and lavender backgrounds, not the pure white default |
| `zh/littlebox` | 8 | `examples/images/littlebox/` | 2026-06-16 | same backgrounds |
| `en/openclaw` | 8 | `examples/images-en/openclaw/` | 2026-06-17 | |
| `en/gopher` | 8 | `examples/images-en/gopher/` | 2026-06-17 | made with the earlier reference image (open item 3) |
| `en/seal`, `zh/seal` | 16 | `examples/images-en/seal/`, `examples/images/seal/` | 2026-06-15, 2026-06-16 | the character was withdrawn (see Withdrawn characters); do not restore these without permission |

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
| Ferris | Karen Rustad Tölva | CC0, as recorded from rustacean.net | pending, the earlier samples are withheld |
| Go Gopher | Renee French | CC BY 4.0 for the design, as stated on go.dev, so attribution travels with every published image; the bundled reference drawing is by Takuya Ueda, CC BY 3.0 (open item 3) | pending, the earlier samples are withheld |
| Tux | Larry Ewing | free to use and modify with credit to Larry Ewing and The GIMP; his page is offline, so the pack cites an archived copy and the Linux kernel's `COPYING-logo` | pending |

## Withdrawn characters

### Seal

Seal was withdrawn on 2026-10-16. Its registry entry, its five-file pack, its example prompt, its credits, and its 16 gallery images are no longer in the repository, because permission to redistribute the character could not be established. A request that names Seal, the hoodie seal, or Sealos now stops and asks, like any unknown name, and a test keeps it that way.

What was checked, and what it showed:

- **What the character is.** A white seal in a plain navy cap and a plain deep-blue hoodie. Visual IP Illustrations, which InkExplain took the pack and the images from, records its source as "the previous Sealos Seal uploaded hoodie seal image". Earlier in that project the route was called `brand-owned` and described as the Sealos brand mascot; the project removed the logos from the mascot on 2026-06-14, then on 2026-06-15 renamed the route and dropped the Sealos name (its "Seal Route Debranding" milestone), and kept the character's shape locked to the same image. A new name and the removal of logos do not move the rights in a character.
- **No permission was found.** Visual IP Illustrations is MIT-licensed, which covers what its maintainer owns. A fork's license cannot grant rights in someone else's mascot, and the project records no permission from the rights holder. The Sealos project's own license (Sealos Sustainable Use License v1.0, `LICENSE.md` at commit `8d630cf28c39ce836b118c446bc8c5206fe377b2`, read 2026-10-16) covers the software. It allows use only for internal business or personal non-commercial purposes, permits distribution only when free and non-commercial, grants no other rights, and leaves the licensor's trademarks to applicable law. Its file tree was searched for mascot, brand, trademark, and notice files, and none states terms for the mascot. The upstream maintainer's public GitHub profile lists Labring, the company behind Sealos; that is not a record of permission.
- **What was shipped.** The pack, five files that describe the character and how to draw it, in the installable skill; 16 gallery images that were unmodified copies of Visual IP Illustrations files; and credits that named the Sealos origin.
- **Git history.** Removing files from a tree does not remove them from history, so the history of this repository was filtered before it was published: no commit contains the Seal pack or any of its 16 images. This was checked on 2026-10-17 by comparing the git blob hash of every Seal file that ever existed in the maintainer's private development archive (the 16 images and 15 versions of pack files, 31 in all) with every object in this repository: none is present, and no path containing "seal" appears anywhere in its history. The character's name still appears in the history as text: in alias lists, a credit line, an example request, a line of the gallery's generated data that summarized how it moves, commit messages, the names of two local development branches, and the message of the `v0.6.0` tag. That is writing about the character, with no artwork and no pack in it. The private archive still holds everything, and is not published. Push only `main` and the release tag, by explicit refspec, so those branches and old tags stay local: see [Git history](release-checklist.md#git-history).

To bring Seal back, get written permission from the rights holder that covers the character, a public pack, and public renders. Record it in a new `rights.md` and in `sampleGates.authorization`, restore the files from the private repository's history, review the renders, and approve them with your own name and the day you did. The test "withdrawn characters stay withdrawn" refuses the original pack names and image files until it is changed on purpose.

## Open items for the maintainer

1. **Seal is withdrawn, and the published history carries no artwork or pack of it.** The character was removed because its rights could not be confirmed (see [Withdrawn characters](#withdrawn-characters)). Its name remains in the history as text, as described there. If you want no mention of it at all, publish a new repository made from the current tree instead of this history; that is a maintainer's decision, and nothing in this repository does it. [Git history](release-checklist.md#git-history) says how to check what will be published.
2. **Five sample sets are withheld until you review them.** `sampleGates` recorded Agustin Pabon as reviewer for Ferris, Seal, Littlebox, OpenClaw, and Go Gopher on 2026-06-15 to 2026-06-17. Those are the days the upstream project first published the images, not the dates of a review for InkExplain, so the records are now `pending` and the images are out of the gallery (see [Samples withheld pending review](#samples-withheld-pending-review)). Review the images, and for every set you approve, restore it and record your name and the day you did. Do not backdate a review, and do not restore the Seal sets before its rights are settled.
3. **The Go Gopher reference image was traced to its source, and replaced by the original.** The `gopher.png` that shipped was a copy of a file in Visual IP Illustrations, added there at the repository root on 2026-06-17 with the regenerated Go Gopher samples and later moved into the pack, with no author or license recorded (500 x 500, an EXIF block with no author or license in it). Measured against `gopher.png` by Takuya Ueda in gopher-vector, it is the same drawing, not another one like it. Their outline boxes have the same aspect ratio (0.7349 and 0.7347) and the shipped file is the original scaled uniformly, by 0.2087; at that scale every outline pixel of the original (8,725 of them) has an outline pixel of the shipped file within one pixel, where shifting the original by five pixels drops that to 72%. The shipped file also had a thicker outline, a shifted body color (`#73cedd` where the original has `#6ad7e5`), and a white border, so it was an adaptation by someone who was never recorded, not a copy. A copy that can be checked against its source is better than an adaptation that cannot, so the pack now bundles the original: git blob `26b98931ab6f42d5892f22cba85f93b90ad9fc4c` at gopher-vector commit `9fe99fbf17b019125bf649f8a921882b54e151a6`, whose README states that Takuya Ueda created it and that it is licensed under Creative Commons Attribution 3.0, after Renee French's design (CC BY 4.0 on go.dev). Images made with it attached credit both. The `white sticker-like border` marker belonged to the adaptation and was dropped, leaving ten markers. The measurement was made once, with a throwaway script that is not kept; resizing the original to 341 x 464 and overlaying it repeats it. `tests/bundled-references.test.mjs` fails if the bundled file stops matching the recorded blob.
4. **OpenClaw's mascot rests on a repository-wide MIT license.** The OpenClaw project states no separate license or trademark policy for its mascot, so the record is only as strong as that license; the pack forbids any claim of affiliation or endorsement. If you want more than that, ask the OpenClaw Foundation to confirm.
5. **Stickman, and a white Littlebox, have not been rendered.** No image-generation tool was available during this audit. Stickman ships `experimental`, and the Littlebox samples that were shown (now withheld) had the old backgrounds. Promoting Stickman and publishing new Littlebox samples is a short real-render check: [reviewing real renders](visual-review.md) is the protocol, and see [before promoting Stickman](evaluation.md#before-promoting-stickman), [adding an archetype](adding-an-archetype.md#5-validate), and [publishing samples](adding-an-archetype.md#publishing-samples).
6. **How the history reads.** The commit history was consolidated under the maintainer's identity, so GitHub will show the maintainer as the author of every commit, including those that hold text adapted from the projects above. The Origins section of `ATTRIBUTIONS.md` and the credits in the README are what attribute that material; consider repeating them in the release notes. The English-labeled Xiaohei images were committed to the fork by its author, yet the fork's license names only Ian as copyright holder, so they are credited the way the fork credits them.
7. **Gallery credits must stay visible.** The gallery shows only Xiaohei, which asks for a credit to Ian, and the README keeps that next to the images. A withheld set brings its credit back with it: the Go Gopher is CC BY (credit Renee French wherever its images are published), Littlebox asks for a credit to okooo5km, and Ferris is CC0.
