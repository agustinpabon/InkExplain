# Limits and known issues

What InkExplain does not do, and what is still unsettled. The README links here instead of listing it.

- InkExplain ships no image model. Image quality depends on the tool your agent uses, and real renders exist only for Littlebox and Xiaohei (one image each, from Codex Desktop, not yet scored with the review protocol). None exists for InkExplain Sketch or Stickman.
- Image models misspell labels, non-Latin scripts most of all. Keep labels short and review them.
- Stickman is `experimental`: its pack and reference sheet are complete, but no render has been reviewed, so each delivery says so. The gallery images in `examples/gallery/` are copies from the projects InkExplain builds on; none was generated for this project.
- Some agents send a generic image request ("create four illustrations") to an image skill of their own. Name InkExplain in the request, or start with `$inkexplain` in Codex, to be sure.
- Claude Code and Gemini CLI have no built-in image generator, and Cursor's was not tested: see [image generation by host](usage.md#image-generation-by-host).
- Third-party archetypes carry their owners' terms, and not every right is settled: [provenance.md](provenance.md) lists what is still open.
- The README translations were produced with AI assistance, have not been reviewed by professional translators, and follow an earlier layout of the English page, so they may lag behind it. Generated lists keep registry data in English.
- The offline gallery (`examples/gallery/index.html`) is one file you open from a checkout; it is not hosted.