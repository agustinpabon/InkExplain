# Attributions

Third-party notices for InkExplain. InkExplain is distributed under the MIT License (see [LICENSE](LICENSE)); the characters, names, and marks below belong to their owners and are not covered by that license. Keep this file with every redistribution.

Each archetype's rights record, `skills/inkexplain/references/archetypes/<id>/rights.md`, is the operative authority for that archetype. `skills/inkexplain/registry.json` records each archetype's legal notice and its public-sample decision.

## Origins

InkExplain builds on three earlier projects, all released under the MIT License. Its own code, tests, shared workflow, default style, Stickman, and documentation were written for InkExplain. Its project layout and release process follow the first project below, the wording of five of its character packs (Ferris, Go Gopher, Littlebox, OpenClaw, and Tux) adapts text from it, and the images in its example gallery are unmodified copies of files from the first two projects.

- **Visual IP Illustrations** by yangchuansheng (Carson Yang), a fork of Ian Xiaohei Illustrations: <https://github.com/yangchuansheng/visual-ip-illustrations>. MIT License; the fork keeps `Copyright (c) 2026 Ian`. Inspected commit: `30a9d4e05124fda05356acb679fa2989ed5cb51c`.
- **Ian Xiaohei Illustrations** by Ian (helloianneo): <https://github.com/helloianneo/ian-xiaohei-illustrations>. MIT License; `Copyright (c) 2026 Ian`. Inspected commit: `4102eb807f03bcb6e538a16e8b31b41db8b5b954`. The original skill that Visual IP Illustrations forks, and the source of Xiaohei and of the Chinese-labeled Xiaohei images.
- **5km Littlebox Illustrations** by okooo5km: <https://github.com/okooo5km/5km-littlebox-illustrations>. MIT License; `Copyright (c) 2026 okooo5km`. Inspected commits: `37cd93ee516da0324577b7bbc8ca3146e5c8d8d7` and `d760004243e8a8613f7d140dbe1c6ee0e0df352a`. The source of Littlebox (see below). Its own notice credits Ian Xiaohei Illustrations as the inspiration for its skill structure and workflow.

The commit history of this repository was consolidated under the maintainer's name, so it does not show who wrote this earlier material. The upstream repositories are the record of authorship, and [docs/provenance.md](docs/provenance.md) records what InkExplain took from each, how that was checked, and what is still open.

### MIT notice for the material above

The following notice applies to the material taken from the projects above and from the OpenClaw project credited below.

```text
Copyright (c) 2026 Ian
Copyright (c) 2026 okooo5km
Copyright (c) 2026 OpenClaw Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Example gallery images

Every image in `examples/gallery/` is an unmodified copy of a file published by one of the projects above; none was generated for InkExplain. [examples/gallery/provenance.json](examples/gallery/provenance.json) records, for each set of images, the repository, the commit, the path, and the git blob hash of every file, so a copy can be checked against its source, and `npm run validate` fails if an image changes.

| Images | Copied from |
|---|---|
| `en/` Xiaohei | Visual IP Illustrations, `examples/images-en/` |
| `zh/` Xiaohei | Ian Xiaohei Illustrations, `examples/images/` |

Only Xiaohei's images are published. The samples of the other characters that earlier versions of the gallery showed are withheld until the maintainer reviews them ([docs/provenance.md](docs/provenance.md#samples-withheld-pending-review)). Each character's own notice below says what the character itself is licensed under; the license of a project's code or images does not extend to a character it merely depicts.

## Character archetypes

### Xiaohei

- Xiaohei is the recurring character of Ian Xiaohei Illustrations by Ian: <https://github.com/helloianneo/ian-xiaohei-illustrations>
- License: MIT; source copyright `Copyright (c) 2026 Ian`, which `LICENSE` keeps. Inspected commit: `4102eb807f03bcb6e538a16e8b31b41db8b5b954`.
- When redistributing or adapting Xiaohei-derived documentation, keep the Ian Xiaohei Illustrations name or credit Ian. The archetype makes no claim that Ian endorses InkExplain or its images.
- Gallery samples, MIT under `Copyright (c) 2026 Ian`: `examples/gallery/zh/xiaohei/` holds Ian's own Chinese-labeled example images (`examples/images/` at the inspected commit). `examples/gallery/en/xiaohei/` holds English-labeled renders of the same eight concepts from `yangchuansheng/visual-ip-illustrations`, a fork of Ian's repository under the same license (`examples/images-en/` at commit `3dd2b773d519bab57715fc015c9725a8e25c7d94`).

### Tux

- Tux was created by Larry Ewing using The GIMP. His page, isc.tamu.edu/~lewing/linux/, is no longer online (it returned HTTP 404 on 2026-10-16), but an archived copy is at <https://web.archive.org/web/20260409031334/https://isc.tamu.edu/~lewing/linux/>. It permits use and modification provided Larry Ewing is acknowledged, and The GIMP if someone asks. The Linux kernel repeats the terms in `Documentation/images/COPYING-logo` (<https://github.com/torvalds/linux/blob/master/Documentation/images/COPYING-logo>): Tux "is freely usable as long as you acknowledge Larry as the original artist". This archetype always credits Larry Ewing and The GIMP.
- Linux is the registered trademark of Linus Torvalds in the U.S. and other countries. See the Linux Foundation's trademark guidance: <https://www.linuxfoundation.org/legal/trademark-usage>.
- The archetype uses no distro or Linux Foundation logos and makes no endorsement, certification, or compatibility claims. Public samples are pending review.

### Ferris

- Ferris the Rustacean was created by Karen Rustad Tölva and dedicated to the public domain (CC0) via rustacean.net.
- Rust and Cargo names and logos are governed by the Rust Foundation's trademark policy. The archetype uses no Rust or Cargo logos and makes no claim of official Rust project affiliation or endorsement.

### Go Gopher

- The Go gopher was designed by Renee French and is licensed under the Creative Commons Attribution 4.0 license (<https://creativecommons.org/licenses/by/4.0/>), as stated at <https://go.dev/blog/gopher>.
- `skills/inkexplain/references/archetypes/gopher/gopher.png` is the archetype's identity reference: a vector drawing of the gopher by Takuya Ueda, an unmodified copy of `gopher.png` in <https://github.com/golang-samples/gopher-vector> at commit `9fe99fbf17b019125bf649f8a921882b54e151a6`. That repository states that the Go gopher was designed by Renee French and that the drawing was created by Takuya Ueda and is licensed under the Creative Commons Attribution 3.0 license (<https://creativecommons.org/licenses/by/3.0/>). Credit Takuya Ueda as well as Renee French for images made with the drawing attached.
- The archetype uses no Go logo and makes no claim of official Go project affiliation, approval, sponsorship, or endorsement.

### Littlebox

- Adapted from 5km Littlebox Illustrations by okooo5km: <https://github.com/okooo5km/5km-littlebox-illustrations>
- License: MIT; source copyright `Copyright (c) 2026 okooo5km`. Inspected commits: `37cd93ee516da0324577b7bbc8ca3146e5c8d8d7`, from which the pack was adapted, and `d760004243e8a8613f7d140dbe1c6ee0e0df352a`, whose pure white default background the pack follows.
- The source's `NOTICE.md` asks that redistributions keep the `5km Littlebox Illustrations` name or credit okooo5km in derived documentation. Do so when redistributing or adapting Littlebox-derived documentation.
- Gallery samples: the Littlebox images in `examples/gallery/` are historical examples on the pale sky-blue and lavender options, predating the white default.

### OpenClaw

- The OpenClaw mascot comes from the OpenClaw project: <https://github.com/openclaw/openclaw>
- License: MIT; `Copyright (c) 2026 OpenClaw Foundation`; reviewed at commit `c14793d35a10936ddea833e7808083fe57930616`.
- The archetype makes no claim of official OpenClaw affiliation or endorsement.

## Trademarks

Names, characters, and marks of third parties belong to their owners. Their use in archetype names and reference material identifies the subject of an archetype; it does not imply that InkExplain is affiliated with, sponsored by, or endorsed by any of them. InkExplain's own name and its house styles, InkExplain Sketch and Stickman, use no third-party characters.
