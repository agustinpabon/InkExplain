# Xiaohei Rights

## Source

- Archetype: Xiaohei (`xiaohei`), category `mascot`, status `active`.
- Character: Xiaohei, the recurring solid-black creature of `Ian Xiaohei Illustrations`, an illustration skill created by Ian.
- Source repository: <https://github.com/helloianneo/ian-xiaohei-illustrations>
- Inspected commit: `4102eb807f03bcb6e538a16e8b31b41db8b5b954` (short `4102eb8`).
- License: MIT. Source copyright: `Copyright (c) 2026 Ian`.
- Bundled reference: `references/archetypes/xiaohei/xiaohei.png`, the identity reference. It is a crop of one of Ian's own drawings: not a new render, and not an unmodified copy. It is the rectangle from x 108 to 288 and y 385 to 592 (181 x 208 pixels) of `ian-xiaohei-illustrations/assets/examples/09-common-pits-no-title.png` in the source repository at the commit above. That source file is git blob SHA-1 `6b2fcb8c5710ea90826ffe73f5729e85b5df57ad`, SHA-256 `b14ca58c823e54fa08b4db310cdac19f133d86ae006708527f4b19417391e7f1`, 1160863 bytes, 1672 x 940 pixels.
- How it was made: `ffmpeg -i 09-common-pits-no-title.png -vf crop=181:208:108:385 xiaohei.png`, with no scaling and no edit. All 112944 color samples of the crop were compared with the source rectangle and none differs. ffmpeg re-encoded the PNG, so its bytes are not the source's bytes. The bundled file is git blob SHA-1 `c6aae5ae6db67121c74f409c44f59c5239d46aa8`, SHA-256 `7aeaa29a2a697cbe266e4a47481a7734df6696fb70287d49b4a0535004f885a1`, 34803 bytes, 181 x 208 pixels; `ASSET-005` and `tests/bundled-references.test.mjs` fail if the file stops matching these.
- Why this crop: it shows what `identity.md` locks (an upright black dome, two plain white dot eyes, two thin legs with foot ticks, a thin single-stroke arm), and in most of the source's other drawings the white eyes carry a small dark pupil. It also shows a faint ink texture in the body, a pole, and the corner of a sign at its right edge, and the short stroke at its lower left is the second arm hanging at rest. None of that belongs to the identity, and the generation prompt says so.
- The crop is a portion of the source drawing, so the source's MIT notice travels with it: `LICENSE.md` in this skill folder keeps Ian's copyright line.

## Rights and restrictions

- Rights holder: Ian, under the MIT license of the source repository. The source's notice asks that redistributions and adaptations keep the `Ian Xiaohei Illustrations` name or credit Ian in derived documentation.
- Credit `Ian` or the `Ian Xiaohei Illustrations` project in any redistribution or adaptation of Xiaohei-derived documentation. The credit is also recorded in `ATTRIBUTIONS.md` at the repository root, and Ian's copyright line stays in `LICENSE.md` in this skill folder and in `LICENSE` at the repository root.
- No claims that Ian created, endorses, or is affiliated with InkExplain or the generated images.
- Every plan, prompt, and delivery report for this archetype carries the rights note in `prompts.md`.
- Never present `xiaohei.png` as a new illustration or as an InkExplain render: it is Ian's drawing, cropped. Attaching it to an image request is the default for a series, and the credit to Ian belongs in the documentation as for every Xiaohei image.

## Public samples

- Decision: approved, as recorded in `registry.json`: reviewed by Agustin Pabon on 2026-10-15 for the public gallery.
- Directories: `examples/gallery/zh/xiaohei/` holds Ian's own Chinese-labeled example images from the source repository; `examples/gallery/en/xiaohei/` holds English-labeled renders of the same eight concepts. Both are MIT under `Copyright (c) 2026 Ian`; their sources are listed in `ATTRIBUTIONS.md`.
- Keep the credit to Ian next to the gallery.
- New public samples must keep the identity in `identity.md` (solid black body, white dot eyes, thin legs, deadpan expression) on a pure white page.
