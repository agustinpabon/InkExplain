<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain: Ideen, sichtbar gemacht. Ein Knäuel aus Kritzeleien wandert durch einen Trichter mit Handkurbel und kommt als klare Glühbirnen-Skizze heraus." width="100%">
</p>

# InkExplain

*Ideen, sichtbar gemacht.*

Verwandle komplexe Ideen mit KI in schöne, einheitliche handgezeichnete Illustrationen.

<!-- inkexplain:languages:start -->
[English](../README.md) | [Español](./README.es.md) | [Português](./README.pt.md) | **Deutsch** | [Français](./README.fr.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-Hant.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [العربية](./README.ar.md) | [Русский](./README.ru.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)
<!-- inkexplain:languages:end -->

InkExplain ist ein Skill für KI-Agenten, der Ideen visuell durchdenkt. Gib ihm einen Artikel, ein Dokument oder eine einzelne Idee: Er arbeitet die Ideen heraus, die ein eigenes Bild verdienen, macht aus jeder eine körperliche Handlung, die eine Figur ausführt, und schreibt Prompts, die eine ganze Serie einheitlich halten. Hat dein Agent ein Tool zur Bildgenerierung, erzeugt, prüft und speichert InkExplain auch die Bilder.

## Was InkExplain kann

- **Plant** eine Shotlist: wo jedes Bild hingehört, welche Idee es trägt und welche greifbare Metapher sie zeigt.
- **Führt Regie**: In jedem Bild führt genau eine Figur, eine Hand oder eine Maschine die Idee vor, festgehalten in ihrem entscheidenden Moment.
- **Schreibt Prompts**, die eine Serie zusammenhalten: ein Archetyp, ein Stil, für jedes Bild eine neue Metapher.
- **Erzeugt und prüft** Bilder mit dem Bild-Tool deines Agenten und speichert sie anschließend unter vorhersehbaren Namen.
- **Überarbeitet** Illustrationen: entfernt ungewollte Titel, korrigiert Beschriftungen, vereinfacht überladene Szenen und stellt eine Figur wieder her.

InkExplain eignet sich für technische Artikel, Erklärungen zu Produkten und Architekturen, Arbeitsabläufe, Vergleiche, Ursache-Wirkungs-Zusammenhänge, Kursmaterial und lange Texte, die eine einheitliche visuelle Handschrift brauchen.

## So funktioniert es

1. **Archetyp wählen**: eine Figur, ihre Bewegungsart und ihren visuellen Stil. Ohne ausdrücklichen Wunsch verwendet InkExplain seinen eigenen Hausstil, InkExplain Sketch.
2. **Konzept herausarbeiten**: die Kernthese und die kognitiven Anker, etwa Bruchstellen, Übergaben, Abwägungen, Schleifen und Vorher-nachher-Veränderungen.
3. **Planen**: ein Bild pro Idee, jeweils mit einem Strukturtyp, einem Platz im Kompositionsraster und einer Alltagsmetapher, die der Akteur vorführt.
4. **Prompt zusammensetzen**: aus der Vorlage des Archetyps in fester Reihenfolge; anschließend pro Tool-Aufruf ein Bild generieren.
5. **Prüfen**: jedes Bild anhand der gemeinsamen QA-Checkliste und der eigenen Prüfpunkte des Archetyps kontrollieren; überarbeiten oder neu generieren.
6. **Speichern und berichten**: die Ergebnisse in `assets/<article-slug>-…/` in deinem Arbeitsbereich ablegen und darüber berichten.

Planung und Generierung sind bewusst getrennt. InkExplain enthält kein Bildmodell, sondern nutzt das Tool zur Bildgenerierung, das dein Agent bereitstellt. Fehlt ein solches Tool, wechselt InkExplain in den **Prompt-Modus** und übergibt dir vollständige, sofort einsatzbereite Prompts. InkExplain behauptet nie, ein Bild erzeugt zu haben, wenn das nicht der Fall ist.

## Installation

```bash
npx skills add agustinpabon/InkExplain --skill inkexplain
```

Das nutzt die offene [skills-CLI](https://skills.sh) (Node.js 22.20 oder neuer). Sie erkennt deinen Agenten, etwa Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode oder Windsurf, und kopiert die Skill in den Ordner, den dieser Agent liest. Mit `-g` installierst du sie für alle deine Projekte, mit `-a <Agent>` wählst du den Agenten. Standardmäßig sendet die CLI anonyme Nutzungstelemetrie; mit `DISABLE_TELEMETRY=1` schaltest du sie ab. InkExplain selbst erhebt nichts.

Ohne Node.js kopierst du den Ordner `skills/inkexplain/` selbst in den Skills-Ordner deines Agenten; „Unterstützte Umgebungen“ nennt die Ordner.

## Verwendung

In Codex rufst du den Skill mit `$inkexplain` auf. In Claude Code und anderen Hosts nennst du InkExplain beim Namen oder beschreibst die Aufgabe; der Agent lädt den Skill, sobald die Anfrage zur Beschreibung des Skills passt.

```text
$inkexplain Plane Illustrationen für diesen Artikel. Generiere noch nichts.

<Artikel hier einfügen>
```

```text
$inkexplain Illustriere diesen Beitrag mit vier Bildern und speichere sie im Projekt.
```

```text
$inkexplain Verwende Ferris. Ein Bild zu: „Eigentümerschaft bedeutet: zu jedem Zeitpunkt genau ein Eigentümer.“
```

```text
$inkexplain Prompt-Modus: Schreibe Prompts für drei Bilder, die ich in mein Bild-Tool einfügen kann.
```

Weitere Beispiele, auch zu allen Archetypen und zu gemischten Anfragen, findest du in [examples/prompts.md](../examples/prompts.md).

## Archetypen

Ein Archetyp legt fest, wer die Idee vorführt, wie er sich bewegt und wie die Szene gezeichnet wird. InkExplain Sketch ist der Standard; jeder andere Archetyp wird über seinen Namen gewählt. Archetypen werden innerhalb eines Bildes nie gemischt.

<!-- inkexplain:archetypes:start -->
| Archetyp | Kategorie | Stilbeschreibung | Rechtsstatus |
|---|---|---|---|
| InkExplain Sketch (`ink`, Standard) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on a pure white page that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Stickman (`stickman`) | `house-style` | InkExplain's own recurring stick figure: a bold black marker line, a round head with two dot eyes, and bendy limbs that act out the idea on a pure white page, with at most one vermilion accent. | `experimental` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tölva |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 (the design); CC BY 3.0 (the bundled reference drawing) · Renee French (design); Takuya Ueda (bundled drawing) |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **Kategorien**: `house-style` ist ein eigener Stil von InkExplain; `mascot` ist ein Maskottchen eines Projekts oder einer Community, das mit Quellenangabe verwendet wird; `tribute-character` ist eine von Dritten geschaffene Figur, die innerhalb der Grenzen ihrer Rechte gezeichnet wird; `animation-preset` ist für eigene Vorlagen für Bewegung und Inszenierung reserviert.
- **Status**: Archetypen mit `active` sind einsatzbereit; Archetypen mit `experimental` werden nur über ihren Namen gewählt und in jeder Lieferung gekennzeichnet; Archetypen mit `gated-authorized` werden nur verwendet, wenn sie ausdrücklich genannt werden, nur im Rahmen deiner eigenen Berechtigung und nie ohne dokumentierte Genehmigung veröffentlicht.

Aliasnamen, Bewegungs-DNA, Stilvorgaben, Quellenangaben und Einschränkungen aller Archetypen stehen in [routing.md](../skills/inkexplain/references/routing.md), das aus der Archetyp-Registry [registry.json](../skills/inkexplain/registry.json) generiert wird.

## Beispielgalerie

Beispielbilder von Xiaohei, unverändert. Bilder der anderen Figuren folgen erst nach ihrer Prüfung.

| Ein Fisch, viele Verwendungen | Nach Zweck sortieren | Ideenpresse |
|---|---|---|
| ![Ein Fisch, viele Verwendungen: Xiaohei zerlegt einen Materialfisch in mehrere Stücke](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) | ![Nach Zweck sortieren: Xiaohei stempelt rohe Ideenkarten und legt sie in drei Ablagen](../examples/gallery/en/xiaohei/02-sort-by-purpose.png) | ![Ideenpresse: Xiaohei dreht an einer Kurbel und presst lose Ideen zu einer klaren Idee](../examples/gallery/en/xiaohei/06-idea-press.png) |

<!-- inkexplain:gallery-credits:start -->
Xiaohei ist Ians Figur aus Ian Xiaohei Illustrations (MIT). Die Bilder mit englischer Beschriftung sind Kopien der von Visual IP Illustrations (MIT) veröffentlichten Bilder, die mit chinesischer Beschriftung Kopien von Ians eigenen Bildern; alle liegen unverändert in [examples/gallery](../examples/gallery) ([woher jedes stammt](../docs/provenance.md)). Bilder der anderen Figuren bleiben zurückgehalten, bis sie geprüft sind.
<!-- inkexplain:gallery-credits:end -->

## Neue Figuren und Animationsstile hinzufügen

Archetypen bestehen aus Daten und Markdown. Für einen neuen Archetyp ist kein Validator-Code nötig.

1. **Registrieren.** Füge in [`skills/inkexplain/registry.json`](../skills/inkexplain/registry.json) unter `archetypes` einen Eintrag hinzu: ID, Name, Kategorie, Status, Zusammenfassung, Aliasnamen, Ausgabesuffix, `motionDna`, `styleSheet`, `legalNotice`, `sampleGates` sowie die Identitäts- und Isolationsmarker in `contract`. Figuren Dritter brauchen Rechteinhaber, Lizenz und Bedingungen für die Quellenangabe; geschützte Figuren starten als `gated-authorized`.
2. **Paket schreiben.** Lege `skills/inkexplain/references/archetypes/<id>/` mit den fünf Paketdateien an: `rights.md`, `identity.md`, `style.md`, `motion-and-acting.md` und `prompts.md`. Übernimm die Struktur eines vorhandenen Pakets; die gemeinsame Methode in `references/workflow/` deckt alles Übrige bereits ab.
3. **Generieren und validieren.** Ergänze die Quellenangabe in [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) und ein Beispiel in [examples/prompts.md](../examples/prompts.md) und führe dann `npm run build:docs` und `npm run check` aus. Die Archetyp-Tabelle oben, `routing.md` und alle Übersetzungen aktualisieren sich dabei von selbst.

Die vollständige Anleitung mit einem kompletten Registry-Eintrag und den Rechtefragen, die du vorab klären solltest, steht in [docs/adding-an-archetype.md](../docs/adding-an-archetype.md).

## Ausgabekonventionen

- Jeder Archetyp schreibt in einen eigenen Ordner in deinem Arbeitsbereich: `assets/<article-slug>-illustrations/` für den Standard, `assets/<article-slug>-<id>/` für alle anderen.
- Dateinamen sind nummerierte englische Slugs: `01-two-breakpoints.png`, `02-handoff-path.png`.
- Vorhandene Dateien werden nie überschrieben; neue Versionen erhalten die nächste Nummer oder das Suffix `-v2`.
- Im Prompt-Modus innerhalb eines Projekts werden die Prompts als `prompts.md` im selben Ordner gespeichert.
- Jede Lieferung endet mit einem kurzen Bericht: Archetyp, Bilder und ihr Zweck, Pfade, die stärksten und die optionalen Bilder, offene Punkte und bei Archetypen Dritter der Rechtehinweis.

## Unterstützte Umgebungen

| Agent | Skill-Ordner in einem Projekt |
|---|---|
| Claude Code | `.claude/skills/inkexplain` |
| Codex | `.agents/skills/inkexplain` |
| Cursor | `.agents/skills/inkexplain`; Cursor liest auch `.claude/skills/` und `.codex/skills/` |
| Gemini CLI, GitHub Copilot, OpenCode | `.agents/skills/inkexplain` |
| Windsurf | `.windsurf/skills/inkexplain` |
| Andere Agenten, die `SKILL.md`-Pakete lesen | ihr Skills-Ordner |

Mit `-g` installiert die CLI stattdessen in den persönlichen Ordner des Agenten (zum Beispiel `~/.claude/skills/` für Claude Code und `~/.agents/skills/` für Codex).

Was getestet wurde: Die skills-CLI legt die Skill für jeden oben genannten Agenten korrekt ab, und Claude Code listet sie. Frische Claude-Code-Agentensitzungen, denen die installierte Skill genannt wurde, sind ihr bei 15 Anfragen korrekt gefolgt, ohne Bildwerkzeug im Prompt-Modus ([Auswertung](../docs/evaluation.md)). Nicht getestet: ob ein Host die Skill aus einer schlichten Anfrage selbst lädt, die Skill in Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode oder Windsurf auszuführen sowie Bilder mit einem Bildwerkzeug zu erzeugen.

## Anpassen

- **Pro Anfrage**: Wähle in eigenen Worten einen Archetyp, die Anzahl der Bilder, das Seitenverhältnis, die Sprache der Beschriftungen oder den Artikel-Slug.
- **Hausstil**: InkExplain Sketch liegt in `skills/inkexplain/references/archetypes/ink/`. Ändere `style.md` und `prompts.md` stets gemeinsam und halte die Farbpalette in `registry.json` auf demselben Stand.
- **Neue Archetypen**: siehe [Neue Figuren und Animationsstile hinzufügen](../docs/adding-an-archetype.md).

## Voraussetzungen

- Ein Agent, der Skill-Pakete mit `SKILL.md` unterstützt.
- Für generierte Bilder: ein Tool zur Bildgenerierung, auf das dieser Agent zugreifen kann.
- Für die Entwicklung: Node.js 22 oder neuer. Es müssen keine Abhängigkeiten installiert werden.

## Einschränkungen

- InkExplain bringt kein Bildmodell mit; die Bildqualität hängt vom Tool ab, das dein Agent verwendet.
- Bildmodelle verschreiben sich bei Beschriftungen, am häufigsten bei nicht-lateinischen Schriften. Halte Beschriftungen kurz und prüfe sie.
- Für InkExplain Sketch gibt es noch keine geprüften Beispielbilder.
- Archetypen Dritter unterliegen den Einschränkungen ihrer Rechteinhaber. Freigabepflichtige Archetypen (gated) darfst du nur im Rahmen deiner eigenen Berechtigung nutzen, und InkExplain veröffentlicht für sie keine Beispiele.
- Die README-Übersetzungen wurden mit KI-Unterstützung erstellt und nicht von professionellen Übersetzern geprüft. Generierte Tabellen geben die Registry-Daten auf Englisch wieder.

## Entwicklung

```bash
npm test               # Unit-, Check-, CLI- und Repository-Tests (integrierter Test-Runner von Node)
npm run validate       # Repository und Skill-Paket validieren
npm run build:docs     # routing.md sowie Archetyp-Tabellen und Sprachauswahl der READMEs neu generieren
npm run check          # alles, was die CI ausführt
```

Architektur, das Modell der schrittweisen Offenlegung (Progressive Disclosure), Check-Katalog und Release-Prozess sind in [docs/architecture.md](../docs/architecture.md) und [docs/release-checklist.md](../docs/release-checklist.md) dokumentiert. Richtlinien für Mitwirkende und Agenten stehen in [AGENTS.md](../AGENTS.md).

## Credits und Lizenz

<!-- inkexplain:credits:start -->
InkExplain baut auf drei früheren Projekten unter MIT-Lizenz auf: [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations) von yangchuansheng, [Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) von Ian und [5km Littlebox Illustrations](https://github.com/okooo5km/5km-littlebox-illustrations) von okooo5km. Die Galeriebilder sind unveränderte Kopien aus den ersten beiden. Figuren und Marken Dritter bleiben Eigentum ihrer jeweiligen Inhaber. Siehe [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) für die Ursprünge, die Hinweise zu den einzelnen Figuren und die Lizenzen.
<!-- inkexplain:credits:end -->

InkExplain steht unter der [MIT-Lizenz](../LICENSE).
