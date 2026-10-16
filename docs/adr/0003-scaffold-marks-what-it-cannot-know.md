# ADR 0003: The Archetype Scaffold Marks What It Cannot Know

## Status
Accepted

## Context
Adding a character means writing a registry entry, five pack files, a credit, and an example prompt, and every contract between them has to hold. A tool can do that reliably. It cannot know who holds the rights to a character, under which license, or what the character looks like, and a guess in a rights field is worse than a gap: it reads as a fact in a public repository.

## Decision
`npm run archetype:add` writes everything it can derive and writes an explicit marker for the rest: `UNRESOLVED:` for rights (holder, license, source, credit, and for a tribute character the boundaries its holder sets) and `TODO:` for the character (identity markers, actions, palette, poses). The archetype is always `experimental`. `SCHEMA-010` fails when an archetype that is not experimental still carries a marker, or still says it is experimental in the registry entry, the pack, its credit, or its example prompt, so a pack cannot be promoted by changing one word of the registry. The check reads one line at a time and knows the usual wordings, so it catches what the scaffold writes and the common ways of saying the same thing, not every possible sentence.

The whole result is validated in memory against every repository check before any file is written, through an overlay of the checkout. New files are created exclusively, so no file is overwritten. Each file it edits is read again just before it is written, so an edit made in between is never written over. If a write or the check after writing fails, every change is undone, each step on its own so that one failure cannot stop the rest. A step that cannot be undone, such as a locked file or a file somebody edited after the run wrote it, is reported instead of passed over, so the contributor knows what to fix by hand. The scaffold needs no new dependency and makes no network call.

## Consequences
- **Positive:** a contributor starts from a repository that passes every check, a duplicate id, an alias collision, or a name that leaks into another pack is refused before anything changes, and an unsettled right written as a marker cannot reach an active archetype unnoticed.
- **Negative:** the first generated pack is deliberately incomplete, and the markers show in the registry, the README tables, and the gallery until they are replaced. Adding a character still takes judgment and real renders; the tool removes the bookkeeping, not the decisions.
