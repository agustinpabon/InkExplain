# ADR 0006: Vector SVG Path Export Pipeline for Layered Design Assets

## Status

Proposed (Draft)

## Context

InkExplain outputs bitmap illustrations (PNG) optimized for technical markdown articles, documentation headers, and presentation slides. Many engineering teams also request stroke-level editable vector paths for integration into Figma design systems, Adobe Illustrator, or web UI animation workflows.

Standard vectorizer libraries introduce heavy C++ or canvas dependencies (e.g. potrace, canvas, vtracer bindings), violating InkExplain's core architecture rule (`SEC-001`: zero runtime dependencies, pure Node.js built-ins).

## Decision

We propose exploring a zero-runtime-dependency vectorization pipeline:
1. Pure JavaScript edge detection using luminance thresholding over raw uncompressed PNG scanline buffers.
2. Moore-Neighbor contour tracing algorithm implemented with standard Node.js typed arrays (`Uint8Array`, `Int32Array`).
3. Bézier curve fitting (Ramer-Douglas-Peucker simplification followed by Schneider curve fitting).
4. Output structured SVG paths with layer separation:
   - Base outline layer (black ink strokes)
   - Accent fill layers (spot color highlights: blue, amber, vermilion)
   - Handwritten label text layer

## Consequences

- Retains 100% offline-by-design, zero external dependency standard.
- Enables designers to tweak linework, scale illustrations without loss, and recolor accents in Figma.
- Keeps core skill footprint minimal and self-contained.
