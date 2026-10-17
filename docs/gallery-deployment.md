# Gallery deployment

InkExplain's interactive gallery is one file, `examples/gallery/index.html`, with its sample images beside it. It needs no build step, no server, and no network.

## Open it from a checkout

```bash
open examples/gallery/index.html
```

The page works over the `file://` protocol. It reads the skill's own reference image for Stickman from `skills/inkexplain/references/archetypes/stickman/` and the approved samples from `examples/gallery/`, so open it from a full checkout, not from a copy of the single file.

## Serve it with GitHub Pages (optional)

GitHub Pages can serve the repository as it is: **Settings**, **Pages**, **Deploy from a branch**, branch `main`, folder `/ (root)`. The gallery is then at `https://agustinpabon.github.io/InkExplain/examples/gallery/`.

That address is live only after the maintainer has switched Pages on and it answers with the page. Check it in a browser before linking to it from the README, and do not announce it before then. The repository has no Pages workflow, and the page needs none.

## What the page may do

Rule `SEC-006` in the validators keeps the page offline:

- Its Content-Security-Policy starts from `default-src 'none'` and allows only images from the page's own origin (`img-src 'self' file: data:`), inline styles, and inline script. It sets no `connect-src`, so the page cannot call out, and it forbids forms and a base URL.
- No external script, stylesheet, font, image, or frame; no network or dynamic-code API in the page script.
- The page builds its markup from text nodes, never from strings, and its data block is inert JSON.
- Icons and styles are inline. The page stores one value in the browser, the theme choice, and nothing leaves the machine.
