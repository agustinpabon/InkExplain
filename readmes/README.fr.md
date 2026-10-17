<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain : des idées mises en images. Un enchevêtrement de gribouillis passe dans un entonnoir à manivelle et en ressort sous la forme d'un croquis d'ampoule clair et net." width="100%">
</p>

# InkExplain

*Des idées mises en images.*

Transformez des idées complexes en illustrations dessinées à la main, belles et cohérentes, grâce à l'IA.

<!-- inkexplain:languages:start -->
[English](../README.md) | [Español](./README.es.md) | [Português](./README.pt.md) | [Deutsch](./README.de.md) | **Français** | [简体中文](./README.zh.md) | [繁體中文](./README.zh-Hant.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [العربية](./README.ar.md) | [Русский](./README.ru.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)
<!-- inkexplain:languages:end -->

InkExplain est un skill de raisonnement visuel pour agents d'IA. Donnez-lui un article, un document ou une simple idée : il en extrait les idées qui méritent une image, transforme chacune en une action physique accomplie par un personnage et rédige des prompts qui assurent la cohérence de toute une série. Si votre agent dispose d'un outil de génération d'images, InkExplain génère aussi les images, les vérifie et les enregistre.

## Ce que fait InkExplain

- **Planifie** la liste des images : où placer chacune, l'idée qu'elle porte et la métaphore concrète qui l'illustre.
- **Dirige l'acteur** : dans chaque image, un personnage, une main ou une machine joue l'idée, saisi à son moment décisif.
- **Rédige des prompts** qui assurent l'unité d'une série : un seul archétype, un seul style, une métaphore nouvelle pour chaque image.
- **Génère et vérifie** les images avec l'outil d'image de votre agent, puis les enregistre sous des noms prévisibles.
- **Retouche** les illustrations : supprime les titres parasites, corrige les étiquettes, simplifie les scènes surchargées, restaure un personnage.

InkExplain convient aux articles techniques, aux explications de produits et d'architectures, aux flux de travail, aux comparaisons, aux relations de cause à effet, aux supports de cours et aux textes longs qui demandent une signature visuelle cohérente.

## Fonctionnement

1. **Choisir un archétype** : un personnage, sa façon de bouger et son style visuel. Sans demande particulière, InkExplain utilise son propre style, InkExplain Sketch.
2. **Extraire le concept** : la thèse centrale et les ancres cognitives, comme les points de rupture, passages de relais, compromis, boucles et changements avant/après.
3. **Planifier** une image par idée, chacune avec un type de structure, une place sur la grille de composition et une métaphore du quotidien jouée par l'acteur.
4. **Assembler le prompt** à partir du modèle de l'archétype, dans un ordre fixe, puis générer une image par appel d'outil.
5. **Vérifier** chaque image selon la checklist qualité commune et les contrôles propres à l'archétype ; retoucher ou régénérer.
6. **Enregistrer et rendre compte** : enregistrer les images dans `assets/<article-slug>-…/`, dans votre espace de travail, puis en faire un compte rendu.

La planification et la génération sont volontairement séparées. InkExplain n'inclut aucun modèle d'image : il utilise l'outil de génération d'images fourni par votre agent. À défaut d'un tel outil, il passe en **mode prompt** et vous remet des prompts complets, prêts à l'emploi. Il ne prétend jamais avoir généré une image qu'il n'a pas générée.

## Installation

```bash
npx skills add agustinpabon/InkExplain --skill inkexplain
```

Cela utilise la [CLI skills](https://skills.sh) ouverte (Node.js 22.20 ou plus récent). Elle détecte votre agent, par exemple Claude Code, Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode ou Windsurf, et copie la skill dans le dossier que cet agent lit. Ajoutez `-g` pour l'installer pour tous vos projets, ou `-a <agent>` pour choisir l'agent. Par défaut, la CLI envoie une télémétrie d'usage anonyme ; définissez `DISABLE_TELEMETRY=1` pour la désactiver. InkExplain lui-même ne collecte rien.

Sans Node.js, copiez vous-même le dossier `skills/inkexplain/` dans le dossier de skills de votre agent ; la section « Environnements pris en charge » les liste.

## Utilisation

Dans Codex, invoquez le skill avec `$inkexplain`. Dans Claude Code et les autres hôtes, demandez InkExplain par son nom ou décrivez la tâche : l'agent charge le skill dès que la demande correspond à sa description.

```text
$inkexplain Planifie les illustrations de cet article. Ne génère rien pour l'instant.

<colle l'article ici>
```

```text
$inkexplain Illustre ce billet avec quatre images et enregistre-les dans le projet.
```

```text
$inkexplain Utilise Ferris. Une image pour : « la possession, c'est un seul propriétaire à la fois. »
```

```text
$inkexplain Mode prompt : écris les prompts de trois images que je pourrai coller dans mon outil d'image.
```

D'autres exemples, couvrant tous les archétypes ainsi que des demandes qui en combinent plusieurs, se trouvent dans [examples/prompts.md](../examples/prompts.md).

## Archétypes

Un archétype fixe qui joue l'idée, comment il bouge et comment la scène est dessinée. InkExplain Sketch est l'archétype par défaut ; tout autre archétype se choisit par son nom. Les archétypes ne se mélangent jamais au sein d'une même image.

<!-- inkexplain:archetypes:start -->
| Archétype | Catégorie | Résumé du style | Statut juridique |
|---|---|---|---|
| InkExplain Sketch (`ink`, par défaut) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on a pure white page that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Stickman (`stickman`) | `house-style` | InkExplain's own recurring stick figure: a bold black marker line, a round head with two dot eyes, and bendy limbs that act out the idea on a pure white page, with at most one vermilion accent. | `experimental` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tölva |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 (the design); CC BY 3.0 (the bundled reference drawing) · Renee French |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **Catégories** : `house-style` est propre à InkExplain ; `mascot` désigne la mascotte d'un projet ou d'une communauté, utilisée avec crédit ; `tribute-character` désigne un personnage créé par un tiers, dessiné dans les limites de ses droits ; `animation-preset` est réservé aux préréglages originaux de mouvement et de mise en scène.
- **Statuts** : les archétypes `active` sont prêts à l'emploi ; les `experimental` ne se sélectionnent que par leur nom et sont signalés dans chaque livraison ; les `gated-authorized` ne s'utilisent que lorsqu'on les nomme, uniquement dans le cadre de vos propres autorisations, et ne sont jamais publiés sans une autorisation enregistrée.

Les alias, l'ADN de mouvement, les feuilles de style, les crédits et les restrictions de chaque archétype figurent dans [routing.md](../skills/inkexplain/references/routing.md), généré à partir du registre des archétypes [registry.json](../skills/inkexplain/registry.json).

## Galerie d'exemples

Rendus de Xiaohei, non modifiés. Ceux des autres personnages ne seront publiés qu'après vérification.

| Un poisson, mille usages | Trier par usage | Presse à idées |
|---|---|---|
| ![Un poisson, plusieurs usages : Xiaohei découpe un poisson de matière en plusieurs morceaux](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) | ![Trier par usage : Xiaohei tamponne des cartes d'idées brutes et les range dans trois bacs](../examples/gallery/en/xiaohei/02-sort-by-purpose.png) | ![Presse à idées : Xiaohei tourne une manivelle pour presser des idées éparses en une idée claire](../examples/gallery/en/xiaohei/06-idea-press.png) |

<!-- inkexplain:gallery-credits:start -->
Xiaohei est le personnage d'Ian dans Ian Xiaohei Illustrations (MIT). Les rendus aux étiquettes anglaises sont des copies d'images publiées par Visual IP Illustrations (MIT) et ceux aux étiquettes chinoises des copies des images d'Ian ; tous sont non modifiés dans [examples/gallery](../examples/gallery) ([d'où vient chacun](../docs/provenance.md)). Les rendus des autres personnages sont retenus jusqu'à leur vérification.
<!-- inkexplain:gallery-credits:end -->

## Ajouter de nouveaux personnages et styles d'animation

Un archétype, ce sont des données et du Markdown. En ajouter un ne demande aucune modification du code de validation.

1. **Enregistrez-le.** Ajoutez une entrée à `archetypes` dans [`skills/inkexplain/registry.json`](../skills/inkexplain/registry.json) : id, nom, catégorie, statut, résumé, alias, suffixe de sortie, `motionDna`, `styleSheet`, `legalNotice`, `sampleGates`, ainsi que les marqueurs d'identité et d'isolation dans `contract`. Les personnages tiers doivent préciser leur ayant droit, leur licence et leurs conditions d'attribution ; les personnages protégés démarrent en `gated-authorized`.
2. **Rédigez le pack.** Créez `skills/inkexplain/references/archetypes/<id>/` avec les cinq fichiers du pack : `rights.md`, `identity.md`, `style.md`, `motion-and-acting.md` et `prompts.md`. Reprenez la structure d'un pack existant ; la méthode commune de `references/workflow/` couvre déjà tout le reste.
3. **Générez et validez.** Ajoutez le crédit dans [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) et un exemple dans [examples/prompts.md](../examples/prompts.md), puis lancez `npm run build:docs` et `npm run check`. Le tableau des archétypes ci-dessus, `routing.md` et toutes les traductions se mettent à jour automatiquement.

Le guide complet, avec une entrée de registre complète et les questions de droits à régler en premier, se trouve dans [docs/adding-an-archetype.md](../docs/adding-an-archetype.md).

## Conventions de sortie

- Chaque archétype écrit dans son propre dossier de votre espace de travail : `assets/<article-slug>-illustrations/` pour l'archétype par défaut, `assets/<article-slug>-<id>/` pour les autres.
- Les fichiers portent des slugs anglais numérotés : `01-two-breakpoints.png`, `02-handoff-path.png`.
- Les fichiers existants ne sont jamais écrasés ; les nouvelles versions prennent le numéro suivant ou le suffixe `-v2`.
- En mode prompt, au sein d'un projet, les prompts sont enregistrés dans un fichier `prompts.md` du même dossier.
- Chaque livraison se termine par un bref compte rendu : archétype, images et leur rôle, chemins, images les plus fortes et images facultatives, points en suspens et, pour les archétypes tiers, la note sur les droits.

## Environnements pris en charge

| Agent | Dossier de la skill dans un projet |
|---|---|
| Claude Code | `.claude/skills/inkexplain` |
| Codex | `.agents/skills/inkexplain` |
| Cursor | `.agents/skills/inkexplain`; Cursor lit aussi `.claude/skills/` et `.codex/skills/` |
| Gemini CLI, GitHub Copilot, OpenCode | `.agents/skills/inkexplain` |
| Windsurf | `.windsurf/skills/inkexplain` |
| Autres agents qui lisent des paquets `SKILL.md` | leur dossier de skills |

Avec `-g`, la CLI installe plutôt dans le dossier personnel de l'agent (par exemple `~/.claude/skills/` pour Claude Code et `~/.agents/skills/` pour Codex).

Ce qui a été testé : la CLI skills place correctement la skill pour chaque agent ci-dessus, et Claude Code la liste. De nouvelles sessions d'agents Claude Code, à qui la skill installée a été indiquée, l'ont suivie correctement sur 15 demandes, sans outil d'image et en mode prompt ([évaluation](../docs/evaluation.md)). Non testé : qu'un hôte charge la skill à partir d'une demande simple, l'exécuter dans Codex, Cursor, Gemini CLI, GitHub Copilot, OpenCode ou Windsurf, et générer des images avec un outil d'image.

## Personnalisation

- **Par demande** : choisissez, avec vos propres mots, un archétype, le nombre d'images, le rapport largeur/hauteur, la langue des étiquettes ou le slug de l'article.
- **Style maison** : InkExplain Sketch se trouve dans `skills/inkexplain/references/archetypes/ink/`. Modifiez `style.md` et `prompts.md` ensemble, et gardez la palette de `registry.json` en accord avec eux.
- **Nouveaux archétypes** : voir [Ajouter de nouveaux personnages et styles d'animation](../docs/adding-an-archetype.md).

## Prérequis

- Un agent compatible avec les paquets de skills `SKILL.md`.
- Pour générer des images : un outil de génération d'images accessible à cet agent.
- Pour le développement : Node.js 22 ou une version plus récente. Aucune dépendance à installer.

## Limites

- InkExplain n'embarque aucun modèle d'image ; la qualité des images dépend de l'outil qu'utilise votre agent.
- Les modèles d'image font des fautes dans les étiquettes, surtout avec les écritures non latines. Gardez des étiquettes courtes et relisez-les.
- InkExplain Sketch n'a pas encore de rendus d'exemple validés.
- Les archétypes tiers sont soumis aux restrictions de leurs propriétaires. Les archétypes à accès restreint (gated) s'utilisent uniquement dans le cadre de vos propres autorisations, et InkExplain ne publie pas d'exemples pour eux.
- Les traductions du README ont été réalisées avec l'aide de l'IA et n'ont pas été relues par des traducteurs professionnels. Les tableaux générés conservent en anglais les données du registre.

## Développement

```bash
npm test               # tests unitaires, des vérifications, de la CLI et du dépôt (exécuteur intégré de Node)
npm run validate       # valide le dépôt et le paquet du skill
npm run build:docs     # régénère routing.md ainsi que les tableaux d'archétypes et sélecteurs de langue des README
npm run check          # tout ce qu'exécute la CI
```

L'architecture, le modèle de divulgation progressive, le catalogue des vérifications et le processus de publication sont documentés dans [docs/architecture.md](../docs/architecture.md) et [docs/release-checklist.md](../docs/release-checklist.md). Les consignes destinées aux contributeurs et aux agents se trouvent dans [AGENTS.md](../AGENTS.md).

## Crédits et licence

<!-- inkexplain:credits:start -->
InkExplain s'appuie sur trois projets antérieurs sous licence MIT : [Visual IP Illustrations](https://github.com/yangchuansheng/visual-ip-illustrations) de yangchuansheng, [Ian Xiaohei Illustrations](https://github.com/helloianneo/ian-xiaohei-illustrations) d'Ian et [5km Littlebox Illustrations](https://github.com/okooo5km/5km-littlebox-illustrations) d'okooo5km. Les images de la galerie sont des copies non modifiées des deux premiers. Les personnages et marques de tiers restent la propriété de leurs détenteurs respectifs. Voir [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) pour les origines, les mentions et les licences de chaque personnage.
<!-- inkexplain:credits:end -->

InkExplain est distribué sous [licence MIT](../LICENSE).
