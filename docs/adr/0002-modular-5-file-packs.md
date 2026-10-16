# ADR 0002: Modular 5-File Archetype Pack Contract

## Status
Accepted

## Context
Early prototypes coupled all archetype descriptions and prompt formulas into a single monolithic document. This caused token bloat when loading skills into agent contexts and made adding third-party characters error-prone.

## Decision
Every archetype must strictly adhere to an autonomous 5-file pack contract in `skills/inkexplain/references/archetypes/<id>/`:
1. `rights.md`: Licensing, copyright attributions, and usage boundaries.
2. `identity.md`: Character visual cues, physical silhouette, and body markers.
3. `style.md`: Medium, linework texture, color palette, and avoid lists.
4. `motion-and-acting.md`: Signature actions, decisive moments, and timing.
5. `prompts.md`: Generation prompt template, negative keywords, and edit repairs.

Central metadata is governed solely by `skills/inkexplain/registry.json`.

## Consequences
- **Positive:** Progressive disclosure (agents load only the active archetype pack); community contributions are isolated to one directory; structural integrity is validated by automated schema checks `SCHEMA-001` through `SCHEMA-005`.
