# ADR 0005: Stickman Is Its Own House Style, Not a Mode of Sketch

## Status
Accepted

## Context
InkExplain Sketch is the brand-neutral default: black ink, explainer blue for movement, a highlighter-yellow swipe, signal red for problems, and an actor that may be an ink figure, hands, or the working object. Its identity rules forbid a recognizable face and a fixed character. A request for "a stickman" wants the opposite: the same recognizable figure in every image of a series.

## Decision
Stickman is a separate `house-style` archetype with its own five-file pack, not a mode of Sketch. Its identity is a contract in head units (an open round head, two dot eyes, a 1.6-head spine, two-segment limbs, foot ticks), it draws in black marker on pure white with at most one vermilion accent, and its whole body is the actor. It ships `experimental`, with a hand-built vector pose sheet as its reference, because no image tool was available to render it. Nothing may describe the sheet as a render.

## Consequences
- **Positive:** Sketch keeps its promise of needing no character, Stickman can state a contract that Sketch's rules would forbid, and the two can be reviewed and promoted separately.
- **Negative:** two similar-looking styles need a clear comparison (in `docs/visual-system.md`) and separate samples. Stickman's identity has not been shown to hold across image models until real renders are reviewed (`docs/evaluation.md`).
