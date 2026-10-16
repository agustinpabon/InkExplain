# ADR 0003: The Archetype Scaffold Marks What It Cannot Know

## Status
Accepted

## Context
Adding a character means writing a registry entry, five pack files, a credit, and an example prompt, and every contract between them has to hold. A tool can do that reliably. It cannot know who holds the rights to a character, under which license, or what the character looks like, and a guess in a rights field is worse than a gap: it reads as a fact in a public repository.

## Decision
`npm run archetype:add` writes everything it can derive and writes an explicit marker for the rest: `UNRESOLVED:` for rights (holder, license, source, credit) and `TODO:` for the character (identity markers, actions, palette, poses). The archetype is always `experimental`. `SCHEMA-010` fails when an archetype that is not experimental still carries a marker, or still says it is experimental, so a pack cannot be promoted by changing one word of the registry.

The whole result is validated in memory against every repository check before any file is written, through an overlay of the checkout. New files are created exclusively, so nothing is overwritten, and if a write or the check after writing fails, every change is undone. The scaffold needs no new dependency and makes no network call.

## Consequences
- **Positive:** a contributor starts from a repository that passes every check, a duplicate id, an alias collision, or a name that leaks into another pack is refused before anything changes, and an unsettled right can never reach an active archetype unnoticed.
- **Negative:** the first generated pack is deliberately incomplete, and the markers show in the registry, the README tables, and the gallery until they are replaced. Adding a character still takes judgment and real renders; the tool removes the bookkeeping, not the decisions.
