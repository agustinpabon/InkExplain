# Language policy

English is the default language of InkExplain. Translations and user-language content are welcome where they carry product behavior, and they are kept narrow so the English source stays reviewable.

## English-default surfaces

Write these in English:

- repository docs
- skill instructions
- reference docs
- examples
- release materials
- validation output
- code
- comments
- commit messages

## Approved exceptions

Other languages appear only in these categories:

- **archetype aliases**: names users type to select an archetype, such as the Chinese aliases of the Littlebox, Seal, and Go Gopher archetypes. They live in `skills/inkexplain/registry.json` and may appear anywhere an archetype is named.
- **user-language visible labels**: example labels that show how text is copied exactly in the user's language inside an English prompt.
- **attribution and source names**: names that must stay exact for credit, rights, or trademark records.
- **README language selector labels**: each localized README is named in its own language.

The localized READMEs in `readmes/` are translations and are not English-default surfaces. Their table headings come from `readmes/locales.json`; the table rows reproduce registry data, which stays in English.

## How the policy is enforced

`npm run validate` runs three checks:

- `LANG-001` scans every English-default text file for Han-script text. Archetype aliases from `registry.json` are always allowed; anything else must be listed in the allowlist.
- `LANG-002` keeps the allowlist (`LANGUAGE_ALLOWLIST` in `scripts/lib/config.mjs`) narrow: every entry names an approved category, an exact token, exact file paths that exist, and a rationale. Directory-wide or pattern exemptions are rejected.
- `LANG-003` checks that this document still lists every surface and category above.

To add an exception, add a narrow allowlist entry rather than widening the scan exclusions.

## Translations

The README translations were produced with AI assistance and have not been reviewed by professional translators. Corrections from native speakers are welcome. When translating:

- keep `InkExplain`, `inkexplain`, `$inkexplain`, `skills/inkexplain/`, archetype ids, file paths, and commands unchanged;
- keep archetype names and aliases exactly as they appear in the registry;
- translate the prose naturally rather than word by word;
- keep the credits region; attribution must survive translation;
- do not edit the generated regions by hand; run `npm run build:docs` instead.

<!-- [stage] unicode character handling -->
