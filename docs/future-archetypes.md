# Characters to add next, and characters to leave out

A maintainer's note from research done on 2026-10-16. It says which characters are worth building next, which are not, and what has to be checked before anyone writes a pack. It is a starting point, not a license check: every right listed here must be re-read at the source when a pack is built, and the checks that could not be done are listed at the end. For how to build one, see [adding an archetype](adding-an-archetype.md).

## Does another character help?

A little, and not evenly. The roster already has the best-known open mascots (Tux, Ferris, the Go Gopher), a logo mascot (OpenClaw), two community characters (Xiaohei, Littlebox), a neutral actor (Sketch), and an original stick figure (Stickman). Most of the remaining mascots fail the rights test below. A new third-party character mostly adds rights upkeep, so the best additions are original characters that fill a real gap, one CC0 human actor, and at most one or two community mascots with written confirmation of their terms.

A repository license grants rights in the files it covers. It does not clear a character the repository merely contains, and it never grants trademark rights: CC0 and CC BY both say so in their own text. That is why a mascot in an MIT or Apache repository is not automatically safe to draw.

## Worth building, in order

1. **An original InkExplain agent or robot actor** (`house-style`, MIT). The roster has animals, objects, a blob, and a stick figure, but nothing machine-like, and agent and automation topics are the likely material. Written by InkExplain contributors, it needs no permission; define it with four to six geometric markers so it works without a reference image. Before shipping: render it in at least two image tools, compare it against known robots (the Android robot belongs to Google), and pass the sample review.
2. **One fixed "Peep" from Open Peeps** (CC0 per the site's statement). It would be the human actor the roster lacks: personas, handoffs, teams. Hand-drawn line work fits the house look, and CC0 lets the pack bundle an official reference image. Before shipping: pick one specific asset and record its file name, hash, and where and when it was downloaded; confirm the package holds only Pablo Stanley's work; say in `identity.md` how a Peep differs from Stickman.
3. **Phippy or Captain Kube from Phippy and Friends** (CC-BY per cncf.io, for the CNCF). It was invented to explain complex systems to non-experts, which is this project's purpose. Before shipping, get written confirmation from the CNCF or the Linux Foundation: which CC BY version applies, and that the files in `cncf/artwork` carry the same grant, since that repository's own `LICENSE.md` speaks only of trademark guidelines. Credit Matt Butcher, Karen Chu, and Bailey Beougher, keep Kubernetes and CNCF logos out, and choose one character, not Goldie.
4. **The Android robot** (CC BY 3.0, Google; trademark retained). A current first-party grant that allows reproduction and modification, with an exact attribution line. Use a neutral name such as "green robot", never the word mark or the custom typeface, imply no endorsement by Google, and ask Google if in doubt.
5. **Zero the Ziguana** (CC BY 4.0, per the `ziglang/logo` README). Lowest priority: a small audience and a weak prior in image models. Before shipping, confirm the artists agreed to the 2021 change from CC BY-SA to CC BY and whether the Foundation claims trademark rights in the name.

Also on the watch list, not shortlisted: Java Duke (needs the actual BSD license text and holder notice) and Open Doodles and Humaaans (CC0, but not recurring characters, or the wrong style). The cheapest improvement to the existing roster is bundling the official CC0 Ferris artwork from rustacean.net as an identity reference; it costs no rights.

## Leave out

| Character or source | Why |
|---|---|
| Protected cartoon characters, such as Tom of Tom and Jerry | They would be `gated-authorized` and need an authorization recorded from the rights holder. |
| Any real person | The skill forbids it, and licenses do not clear personality rights. |
| Docker's Moby, GitHub's Octocat, PostgreSQL's Slonik, BSD's Beastie | Brand guidelines prohibit derivative artwork or reserve all rights. |
| KDE's Konqi and Katie | Copyleft licenses (CC BY-SA, GFDL, LGPL) cannot be honored in a permissive pack. |
| unDraw | Its license bans packs, integrations, scraping, and AI use. |
| xkcd | CC BY-NC 2.5: NonCommercial. |
| Kotlin's Kodee, Gleam's Lucy, the Deno dinosaur, OpenBSD's Puffy, the Python logos | No artwork license found, or all rights reserved. |

## Not verified

- Who produced the bundled Go gopher image, and whether it derives from Renee French's artwork or Takuya Ueda's vector ([provenance record](provenance.md)).
- Whether anyone holds a trademark in the Tux image or the Go gopher; the pages read do not say.
- Open Peeps, Open Doodles, and Humaaans have only website statements, with no repository or license file; the terms of the downloadable packages were not read.
- Phippy: which CC BY version applies, and whether the `cncf/artwork` files carry the cncf.io grant.
- Zig: the artist of Zero, the artists' consent to the 2021 relicense, and any trademark policy.
- Whether OpenClaw has a brand or trademark policy outside its repository.
- Excalidraw's fonts and name, and the GNOME and Mozilla mascots, were not evaluated.
