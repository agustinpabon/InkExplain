# ADR 0004: The License Travels With the Installed Skill

## Status
Accepted

## Context
Installers such as `npx skills add` copy only `skills/inkexplain/`. The repository's `LICENSE` and `ATTRIBUTIONS.md` never reach the user, although the pack text adapts work released under the MIT License by other people, and that license requires its notice to stay with copies and substantial portions.

## Decision
`skills/inkexplain/LICENSE.md` carries the MIT terms, every copyright holder named in the repository's `LICENSE` and in the MIT notice in `ATTRIBUTIONS.md`, a note on whose notice covers what, and a pointer to each character's `rights.md`. `SKILL.md` names it in its `license` frontmatter. `LEGAL-006` fails if the file is missing, if an MIT clause is altered, or if a holder named in `LICENSE` or `ATTRIBUTIONS.md` is missing from it. It reads a notice in its usual spellings, and fails on a line that opens like a notice with a year but cannot be read, so a holder is not dropped by an unusual dash, list marker, or table cell. It cannot tell a notice with no year, or with the holder before the year, from prose, so those lines are written as marker, year, holder.

## Consequences
- **Positive:** an installed copy is compliant on its own, and the two license files cannot drift apart unnoticed.
- **Negative:** adding a third-party MIT source means adding its copyright line in two places, and the check reminds you if you forget the second.
