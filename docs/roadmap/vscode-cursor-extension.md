# RFC: Official VS Code and Cursor Extension Architecture

## Overview
This document outlines the design for the upcoming official IDE extension for InkExplain across VS Code and Cursor.

## Architecture
- **Host Process**: Lightweight Node.js sidecar using native communication.
- **Trigger**: Context menu action `InkExplain: Illustrate this logic` on selected code blocks, functions, or files.
- **Workflow**:
  1. Selected code buffer is analyzed against `concept-extraction.md`.
  2. The active archetype is selected (default: `ink`, or inferred from file language, e.g. `ferris` for `.rs`, `gopher` for `.go`).
  3. Calibrated prompt is generated via `scripts/explain.mjs`.
  4. Preview is rendered in an offline Webview panel using `examples/gallery/index.html` components.
