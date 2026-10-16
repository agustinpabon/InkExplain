<p align="center">
  <img src="../assets/brand/inkexplain-hero.svg" alt="InkExplain: ideas hechas visuales. Una maraña de garabatos pasa por un embudo de manivela y sale convertida en el boceto nítido de una bombilla." width="100%">
</p>

# InkExplain

*Ideas hechas visuales.*

Convierte ideas complejas en ilustraciones dibujadas a mano, bellas y coherentes, con IA.

<!-- inkexplain:languages:start -->
[English](../README.md) | **Español** | [Português](./README.pt.md) | [Deutsch](./README.de.md) | [Français](./README.fr.md) | [简体中文](./README.zh.md) | [繁體中文](./README.zh-Hant.md) | [한국어](./README.ko.md) | [日本語](./README.ja.md) | [العربية](./README.ar.md) | [Русский](./README.ru.md) | [Türkçe](./README.tr.md) | [Українська](./README.uk.md)
<!-- inkexplain:languages:end -->

InkExplain es una skill de razonamiento visual para agentes de IA. Dale un artículo, un documento o una sola idea: extrae las ideas que vale la pena dibujar, convierte cada una en una acción física que realiza un personaje y escribe prompts que mantienen coherente toda una serie. Si tu agente dispone de una herramienta de generación de imágenes, también genera, revisa y guarda las imágenes.

## Qué hace

- **Planifica** la lista de imágenes: dónde va cada una, qué idea transmite y qué metáfora física la representa.
- **Dirige al actor**: en cada imagen, un personaje, una mano o una máquina interpreta la idea, captado en su momento decisivo.
- **Escribe prompts** que dan unidad a toda la serie: un mismo arquetipo, un mismo estilo y una metáfora nueva para cada imagen.
- **Genera y revisa** las imágenes con la herramienta de imágenes de tu agente y luego las guarda con nombres predecibles.
- **Repara** ilustraciones: elimina títulos que sobran, corrige etiquetas, simplifica escenas recargadas y restaura un personaje.

Es ideal para artículos técnicos, explicaciones de producto y de arquitectura, flujos de trabajo, comparaciones, relaciones de causa y efecto, material de cursos y textos extensos que necesitan una voz visual coherente.

## Cómo funciona

1. **Elige un arquetipo**: un personaje, su forma de moverse y su estilo visual. Si no pides ninguno, InkExplain usa su propio estilo, InkExplain Sketch.
2. **Extrae el concepto**: la tesis central y las anclas cognitivas, como puntos de ruptura, traspasos, compensaciones, bucles y cambios de antes y después.
3. **Planifica** una imagen por idea, cada una con un tipo de estructura, un lugar en la cuadrícula de composición y una metáfora cotidiana que interpreta el actor.
4. **Ensambla el prompt** a partir de la plantilla del arquetipo, en un orden fijo, y luego genera una imagen por cada llamada a la herramienta.
5. **Revisa** cada imagen con la lista de control de calidad común y con las comprobaciones propias del arquetipo; repara o vuelve a generar.
6. **Guarda y entrega un informe**: las imágenes van a `assets/<article-slug>-…/`, dentro de tu espacio de trabajo.

La planificación y la generación están separadas a propósito. InkExplain no incluye un modelo de imágenes; usa la herramienta de generación de imágenes que ofrece tu agente. Si no la hay, pasa al **modo de prompts** y te entrega prompts completos, listos para usar. Nunca afirma haber generado una imagen que no generó.

## Instalación

La skill es la carpeta `skills/inkexplain/`. Cópiala donde tu agente busque las skills.

Desde una copia local de este repositorio:

```bash
# Codex
mkdir -p "${CODEX_HOME:-$HOME/.codex}/skills"
cp -R skills/inkexplain "${CODEX_HOME:-$HOME/.codex}/skills/"

# Claude Code (skills personales; para limitarla a un proyecto, usa .claude/skills/ dentro de él)
mkdir -p ~/.claude/skills
cp -R skills/inkexplain ~/.claude/skills/

# Cursor (skills personales; para limitarla a un proyecto, usa .cursor/skills/ dentro de él)
mkdir -p ~/.cursor/skills
cp -R skills/inkexplain ~/.cursor/skills/
```

La ubicación pública prevista de este repositorio es `agustinpabon/inkexplain`. Todavía no está publicado; cuando lo esté, la [CLI de skills](https://skills.sh) debería poder instalar la skill con:

```bash
npx skills add agustinpabon/inkexplain --skill inkexplain
```

## Uso

En Codex, invoca la skill con `$inkexplain`. En Claude Code y otros entornos, pide InkExplain por su nombre o describe la tarea; el agente carga la skill cuando la solicitud coincide con su descripción.

```text
$inkexplain Planifica ilustraciones para este artículo. Todavía no generes nada.

<pega el artículo>
```

```text
$inkexplain Ilustra esta publicación con cuatro imágenes y guárdalas en el proyecto.
```

```text
$inkexplain Usa Ferris. Una imagen para: "ownership significa exactamente un propietario a la vez".
```

```text
$inkexplain Modo de prompts: escribe prompts para tres imágenes que pueda pegar en mi herramienta de imágenes.
```

Hay más ejemplos, con todos los arquetipos y con solicitudes que combinan varios, en [examples/prompts.md](../examples/prompts.md).

## Arquetipos

Un arquetipo fija quién interpreta la idea, cómo se mueve y cómo se dibuja la escena. InkExplain Sketch es el arquetipo predeterminado; cualquier otro se elige por su nombre. Los arquetipos nunca se mezclan dentro de una misma imagen.

<!-- inkexplain:archetypes:start -->
| Arquetipo | Categoría | Resumen del estilo | Estado legal |
|---|---|---|---|
| InkExplain Sketch (`ink`, predeterminado) | `house-style` | InkExplain's own brand-neutral style: black ink line art, one explainer-blue flow accent, a single highlighter-yellow emphasis, and a neutral ink figure or hands that perform the idea. | `active` · MIT · InkExplain contributors |
| Xiaohei (`xiaohei`) | `mascot` | Ian's Xiaohei, a small solid-black creature with white dot eyes and thin legs, doing serious, slightly absurd work inside sparse black-ink sketches on a pure white page. | `active` · MIT · Ian |
| Littlebox (`littlebox`) | `tribute-character` | A closed paper-box character in thick rough marker on pale sky-blue or lavender backgrounds that turns ideas into collecting, packaging, sorting, and delivering. | `active` · MIT · okooo5km |
| Ferris (`ferris`) | `mascot` | Ferris the Rustacean, the Rust community crab, performing the idea in sparse hand-drawn article sketches without Rust logos or endorsement cues. | `active` · CC0 public-domain dedication · Karen Rustad Tolva |
| Seal (`seal`) | `mascot` | A product-neutral white seal in a plain navy cap and deep-blue hoodie, always logo-free, performing the idea in sparse article sketches. | `active` · No separate character license recorded; the pack text is MIT as part of InkExplain · Sealos (original mascot image) |
| OpenClaw (`openclaw`) | `mascot` | The OpenClaw mascot, a red round character with claw-like arms, two antennae, and cyan pupils, performing the idea in sparse hand-drawn article sketches. | `active` · MIT · OpenClaw Foundation |
| Go Gopher (`gopher`) | `mascot` | The Go gopher designed by Renee French performing the idea in sparse hand-drawn article sketches, credited and free of Go logos or endorsement claims. | `active` · CC BY 4.0 · Renee French |
| Tux (`tux`) | `mascot` | Tux, the Linux penguin created by Larry Ewing, performing the idea in sparse article sketches without distro logos, product graphics, or endorsement claims. | `active` · Free to use and modify with credit to Larry Ewing and The GIMP when asked · Larry Ewing |
<!-- inkexplain:archetypes:end -->

- **Categorías**: `house-style` es original de InkExplain; `mascot` es la mascota de un proyecto o de una comunidad, usada con atribución; `tribute-character` es un personaje creado por terceros, dibujado dentro de los límites de sus derechos; `animation-preset` está reservada para preajustes originales de movimiento y puesta en escena.
- **Estados**: los arquetipos `active` están listos para usarse; los `experimental` solo se eligen por su nombre y se señalan en cada entrega; los `gated-authorized` solo se usan cuando se nombran, solo dentro de los límites de tu propia autorización y nunca se publican sin una autorización registrada.

Los alias, el ADN de movimiento, las hojas de estilo, los créditos y las restricciones de cada arquetipo están en [routing.md](../skills/inkexplain/references/routing.md), que se genera a partir del registro de arquetipos [registry.json](../skills/inkexplain/registry.json).

## Galería de ejemplos

Imágenes de muestra, cada una junto a su arquetipo. Las de InkExplain Sketch se añadirán tras su revisión.

| Littlebox | Ferris | Seal |
|---|---|---|
| ![Camino de traspaso: Littlebox pasa una tarjeta sellada desde la entrada hasta el estado listo](../examples/gallery/en/littlebox/04-handoff-path.png) | ![Clasificar por propósito: Ferris clasifica material con sus pinzas](../examples/gallery/en/ferris/02-sort-by-purpose.png) | ![Pozo de información: la foca saca ideas de un pozo](../examples/gallery/en/seal/05-information-well.png) |
| **OpenClaw** | **Go Gopher** | **Xiaohei** |
| ![Prensa de ideas: la mascota de OpenClaw acciona una prensa](../examples/gallery/en/openclaw/06-idea-press.png) | ![Puente de confianza: el gopher coloca tablones sobre un hueco](../examples/gallery/en/gopher/08-trust-bridge.png) | ![Un pez, muchos usos: Xiaohei corta un pez de material en varias piezas](../examples/gallery/en/xiaohei/03-one-fish-many-uses.png) |

Littlebox es una adaptación de 5km Littlebox Illustrations, de okooo5km (MIT). Ferris es obra de Karen Rustad Tolva (CC0). El gopher de Go fue diseñado por Renee French (CC BY 4.0). La mascota de OpenClaw procede del proyecto OpenClaw (MIT). Xiaohei es el personaje de Ian en Ian Xiaohei Illustrations (MIT). Todas las imágenes están en [examples/gallery](../examples/gallery): con etiquetas en inglés para seis arquetipos y en chino para cuatro.

## Añadir nuevos personajes y estilos de animación

Los arquetipos son datos más Markdown. Añadir uno no requiere escribir código en el validador.

1. **Regístralo.** Añade una entrada a `archetypes` en [`skills/inkexplain/registry.json`](../skills/inkexplain/registry.json): id, nombre, categoría, estado, resumen, alias, sufijo de salida, `motionDna`, `styleSheet`, `legalNotice`, `sampleGates` y los marcadores de identidad y de aislamiento en `contract`. Los personajes de terceros necesitan su titular de derechos, su licencia y sus condiciones de atribución; los protegidos empiezan como `gated-authorized`.
2. **Escribe el paquete.** Crea `skills/inkexplain/references/archetypes/<id>/` con los cinco archivos del paquete: `rights.md`, `identity.md`, `style.md`, `motion-and-acting.md` y `prompts.md`. Copia la estructura de un paquete existente; el método común de `references/workflow/` ya cubre todo lo demás.
3. **Genera y valida.** Añade el crédito a [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) y un ejemplo a [examples/prompts.md](../examples/prompts.md); luego ejecuta `npm run build:docs` y `npm run check`. La tabla de arquetipos de arriba, `routing.md` y todas las traducciones se actualizan solas.

La guía completa, con una entrada de registro completa y las preguntas sobre derechos que hay que responder primero, está en [docs/adding-an-archetype.md](../docs/adding-an-archetype.md).

## Convenciones de salida

- Cada arquetipo guarda sus archivos en su propia carpeta dentro de tu espacio de trabajo: `assets/<article-slug>-illustrations/` para el predeterminado y `assets/<article-slug>-<id>/` para los demás.
- Los nombres de archivo son slugs en inglés numerados: `01-two-breakpoints.png`, `02-handoff-path.png`.
- Los archivos existentes nunca se sobrescriben; las versiones nuevas reciben el número siguiente o el sufijo `-v2`.
- En modo de prompts, dentro de un proyecto, los prompts se guardan como `prompts.md` en la misma carpeta.
- Cada entrega termina con un informe breve: el arquetipo, las imágenes y su propósito, las ubicaciones de los archivos, las imágenes más sólidas y las opcionales, los problemas pendientes y, en los arquetipos de terceros, la nota sobre derechos.

## Entornos compatibles

| Entorno | Dónde va la skill | Imágenes |
|---|---|---|
| Codex | `${CODEX_HOME:-$HOME/.codex}/skills/inkexplain` | Usa la herramienta de generación de imágenes del entorno cuando hay una disponible; el paquete también incluye metadatos para Codex en `agents/openai.yaml`. |
| Claude Code | `~/.claude/skills/inkexplain` o `.claude/skills/inkexplain` | Claude Code no tiene un generador de imágenes integrado. InkExplain funciona en modo de prompts, a menos que conectes una herramienta de generación de imágenes, por ejemplo mediante un servidor MCP. |
| Otros agentes que cargan paquetes `SKILL.md` | la carpeta de skills del entorno | La misma regla: genera imágenes si hay una herramienta de imágenes; si no, usa el modo de prompts. |

## Personalización

- **En cada solicitud**: indica con tus propias palabras el arquetipo, el número de imágenes, la relación de aspecto, el idioma de las etiquetas o el slug del artículo.
- **Estilo propio**: InkExplain Sketch se encuentra en `skills/inkexplain/references/archetypes/ink/`. Modifica `style.md` y `prompts.md` a la vez y mantén la paleta de `registry.json` en sintonía con ellos.
- **Arquetipos nuevos**: consulta [Añadir nuevos personajes y estilos de animación](../docs/adding-an-archetype.md).

## Requisitos

- Un agente compatible con paquetes de skills `SKILL.md`.
- Para generar imágenes: una herramienta de generación de imágenes disponible para ese agente.
- Para desarrollo: Node.js 22 o posterior. No hay dependencias que instalar.

## Limitaciones

- InkExplain no incluye ningún modelo de imágenes; la calidad de las imágenes depende de la herramienta que use tu agente.
- Los modelos de imágenes escriben mal las etiquetas, sobre todo en sistemas de escritura no latinos. Usa etiquetas breves y revísalas.
- InkExplain Sketch todavía no tiene imágenes de muestra revisadas.
- Los arquetipos de terceros están sujetos a las restricciones de sus titulares. Los arquetipos restringidos solo deben usarse dentro de los límites de tu propia autorización; InkExplain no publica muestras de ellos.
- Las traducciones del README se hicieron con ayuda de IA y no han sido revisadas por traductores profesionales. Las tablas generadas mantienen en inglés los datos del registro.

## Desarrollo

```bash
npm test               # pruebas unitarias, de comprobaciones, de la CLI y del repositorio (ejecutor integrado de Node)
npm run validate       # valida el repositorio y el paquete de la skill
npm run build:docs     # regenera routing.md y las tablas de arquetipos y selectores de idioma de los README
npm run check          # todo lo que ejecuta la CI
```

La arquitectura, el modelo de divulgación progresiva, el catálogo de comprobaciones y el proceso de publicación están documentados en [docs/architecture.md](../docs/architecture.md) y [docs/release-checklist.md](../docs/release-checklist.md). Las pautas para colaboradores y agentes están en [AGENTS.md](../AGENTS.md).

## Créditos y licencia

<!-- inkexplain:credits:start -->
Los personajes y marcas de terceros pertenecen a sus respectivos titulares. Consulta [ATTRIBUTIONS.md](../ATTRIBUTIONS.md) para conocer las licencias y avisos de cada personaje.
<!-- inkexplain:credits:end -->

InkExplain se publica bajo la [licencia MIT](../LICENSE).
