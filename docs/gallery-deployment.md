# Gallery Deployment & Online Showcase

InkExplain provides an interactive offline gallery viewer in `examples/gallery/index.html`.

## Deployment Modes

### 1. Local Offline Mode
The gallery viewer is completely self-contained in a single file with zero external dependencies:
```bash
open examples/gallery/index.html
```
Works directly over the `file://` protocol without any local web server or internet connection.

### 2. GitHub Pages Live Hosting
The gallery is also deployed live via GitHub Pages at:
- **Production URL:** `https://agustinpabon.github.io/InkExplain/examples/gallery/`

## Security Enforcement
The page strictly adheres to rule `SEC-006` in the repository test suite:
- `Content-Security-Policy: default-src 'none'`
- No external CDN scripts, stylesheets, or remote images.
- All SVG icons and CSS styles are embedded directly inline.
