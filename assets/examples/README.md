# Showcase renders

The eight images in the README character gallery. Each was made by an agent with Codex Desktop's built-in image tool, through InkExplain, from a request to illustrate one idea with one character, one image per call. The files here are the raw output, byte for byte; they were not edited, cropped, or recolored. Where a character has more than one take, this is the newest raw one. Re-exported or repaired versions of the same pictures (resized, margin-padded, or touched up by an agent) were not used.

They are not gallery samples and carry no review: no one has scored them with `docs/visual-review.md`, and nothing here says that the maintainer approved them. Notes an agent wrote about its own output are not a review. Stickman is experimental, and its render is a first try. The eight ideas are different on purpose; this is not one prompt drawn eight ways.

| File | Character | Idea shown | Source (raw file) | Review status | SHA-256 (first 16) |
|---|---|---|---|---|---|
| `ink.png` | InkExplain Sketch (default style) | Bottlenecks: packages piling up at a narrow passage | Codex Desktop built-in image tool: `$CODEX_HOME/generated_images/01a14b90-e2e1-7e32-8320-0592afe141ac/exec-7fba41cd-8d03-433d-8100-a3e52d417da5.png`, written 2026-10-17 16:34 local time; byte-identical copy | unreviewed first try | A0F4F83A1111EACF |
| `littlebox.png` | Littlebox, default pure white page | Caching: taking a nearby stored item instead of visiting distant storage | Codex Desktop built-in image tool: `$CODEX_HOME/generated_images/01a14b91-53ee-7181-9aa1-9bf3d25f6052/exec-4648bc96-fe68-4362-8299-f79ca414694b.png`, written 2026-10-17 16:38 local time; byte-identical copy | unreviewed first try | 87AE9BFE1DAE4F98 |
| `stickman.png` | Stickman (experimental) | Iteration: trying, improving, and relaunching a paper airplane | Codex Desktop built-in image tool: `$CODEX_HOME/generated_images/01a14b91-7848-7b31-a6ca-f5e18888759b/exec-b19f6d8b-955a-4034-8904-1abe8541a815.png`, written 2026-10-17 16:36 local time; byte-identical copy | unreviewed first try | 46C2D994D55E96FA |
| `xiaohei.png` | Xiaohei | Information overload: many messy notes sorted into three clear ideas | Codex Desktop built-in image tool: `$CODEX_HOME/generated_images/01a14b91-a279-7a92-a88e-e1d3198febfc/exec-67177956-5bd9-462f-8f9f-fd73979cad53.png`, written 2026-10-17 16:35 local time; byte-identical copy | unreviewed first try | 0796D1DDC7164A0D |
| `ferris.png` | Ferris | Bug prevention: catching a bug before a release | Codex Desktop built-in image tool: `$CODEX_HOME/generated_images/01a14b9a-1a50-7482-bd6f-2cf77f5a38bf/exec-1dafafcf-d65b-4df0-9d2e-e90160a3cf00.png`, written 2026-10-17 16:44 local time; byte-identical copy | unreviewed first try | 946525B08A0ED3CE |
| `gopher.png` | Go Gopher | Connecting services: completing a bridge between two platforms | Codex Desktop built-in image tool: `$CODEX_HOME/generated_images/01a14b9a-5ebc-7c23-bc9c-4a112b18d3fa/exec-70b3c0da-587c-4139-b5e5-19e65788492f.png`, written 2026-10-17 16:45 local time; byte-identical copy | unreviewed first try | EF3B674B16D324B6 |
| `tux.png` | Tux | Collaboration: completing a puzzle-piece rocket | Codex Desktop built-in image tool: `$CODEX_HOME/generated_images/01a14b9a-8cb1-7293-9e7b-7228612be4f6/exec-f5581f00-aa76-478f-8555-9cfda86d3c21.png`, written 2026-10-17 16:44 local time; byte-identical copy | unreviewed first try | 18834747B54AE3AC |
| `openclaw.png` | OpenClaw | Automation: stamping repetitive envelopes | Codex Desktop built-in image tool: `$CODEX_HOME/generated_images/01a14b9a-bcab-77f0-a9ca-97629f15ba8a/exec-6280735d-dfa0-4908-987a-92a182f2010c.png`, written 2026-10-17 16:45 local time; byte-identical copy | unreviewed first try | F6B172D401A211F2 |

The gallery shows downscaled copies, not new images:

| File | What it is | SHA-256 (first 16) |
|---|---|---|
| `thumbs/ink.png` | downscale of `ink.png` to 960 x 540 | B26A4E2061CAB00B |
| `thumbs/littlebox.png` | downscale of `littlebox.png` to 960 x 540 | 95A88C9C5A6BDF8B |
| `thumbs/stickman.png` | downscale of `stickman.png` to 960 x 540 | 72E86B529C547FC8 |
| `thumbs/xiaohei.png` | downscale of `xiaohei.png` to 960 x 540 | 9D2A2CD5F3A30FB1 |
| `thumbs/ferris.png` | downscale of `ferris.png` to 960 x 540 | 8DFBB516F6831F49 |
| `thumbs/gopher.png` | downscale of `gopher.png` to 960 x 540 | 8E895941AA7BE4C5 |
| `thumbs/tux.png` | downscale of `tux.png` to 960 x 540 | F3146AC087748F21 |
| `thumbs/openclaw.png` | downscale of `openclaw.png` to 960 x 540 | A6BA79A9656EEF9D |

Source for the thumbnails: `assets/brand/hero-source/thumb.html?<id>`, opened at 960 x 540. Each image links to its full-size file from the README.

Rights: Sketch and Stickman are original to InkExplain. The other six characters are by others and are credited, with their licenses and boundaries, in `ATTRIBUTIONS.md` and `docs/provenance.md`; the images carry no credit text, by design of the prompts. Earlier showcase images (a Littlebox, a Xiaohei, a Sketch, and a Stickman, all explaining database indexing) were replaced by these and remain in the git history.