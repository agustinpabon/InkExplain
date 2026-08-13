# Prompt examples

Copy a prompt, replace the bracketed parts, and paste your text where indicated. In Codex, start with `$inkexplain`; in other hosts you can also name InkExplain in plain words.

## Default style: InkExplain Sketch

These prompts name no archetype, so they use InkExplain Sketch.

### Plan only

```text
$inkexplain Plan illustrations for the article below. Do not generate images yet.
For each image, give the placement, core idea, structure type, actor and action, supporting objects, and visible labels.

[paste the article]
```

### Illustrate an article

```text
$inkexplain Illustrate the article below with four to six images and save them in this project.

[paste the article]
```

### One idea

```text
$inkexplain One image: "A cache is a promise you have to keep renewing."
```

### Prompt mode

```text
$inkexplain Prompt mode: plan three images for the post below and give me complete prompts I can paste into my image tool. Do not generate images.

[paste the post]
```

### Labels in another language

```text
$inkexplain One image showing how a feedback loop amplifies a small error. Write the visible labels in Spanish.
```

### A different aspect ratio

```text
$inkexplain One square (1:1) image for a social post: "Deadlines move work; priorities move people."
```

## Character archetypes

### Xiaohei

```text
$inkexplain Use Xiaohei. One image: "an agent breaks a vague request into three clear steps."
```

### Littlebox

```text
$inkexplain Use Littlebox. One image: raw material comes in, gets judged, and ships. Copy these labels exactly: "原始材料", "判断", "输出".
```

### Ferris

```text
$inkexplain Use Ferris. Two images for a post about ownership in Rust: one owner at a time, and borrowing without taking.
```

### Seal

```text
$inkexplain Use the hoodie seal. One image: "rollbacks are a safety net you test before you need it."
```

### OpenClaw

```text
$inkexplain Use OpenClaw. Plan three images for the release notes below.

[paste the release notes]
```

### Go Gopher

```text
$inkexplain Use the Go Gopher. One image: "channels pass work between goroutines like a relay baton."
```

### Tux

```text
$inkexplain Draw it with Tux. One image: "small tools that do one thing well compose into big systems."
```

## Mixed archetypes

### Same idea, several archetypes

```text
$inkexplain Plan the same idea with InkExplain Sketch, Ferris, and Littlebox: "a bottleneck sets the speed of the whole pipeline." Keep each archetype's images and folders separate.
```

### Every archetype

```text
$inkexplain Plan one image per archetype for this idea: "documentation is a map, not the territory." Use all archetypes.
```

"All archetypes" leaves out gated and experimental archetypes unless you name them.

## Editing

### Remove a title

```text
$inkexplain Remove the title "Workflow" from the top-left corner of this image and keep everything else unchanged.
```

### Fix a label

```text
$inkexplain In this image, change the label "Ouput" to "Output". Change nothing else.
```

### Make the actor do the work

```text
$inkexplain This illustration feels like a diagram with a character standing beside it. Regenerate it so the character performs the central action.
```

## How archetypes are chosen

### The topic does not pick the archetype

```text
$inkexplain Illustrate my article about Linux namespaces with three images.
```

The article is about Linux, but nobody asked for a mascot, so InkExplain uses its default style. Ask for Tux to get that archetype.

### Unknown names are not guessed

```text
$inkexplain Draw it with a penguin.
```

"Penguin" is not an archetype name. InkExplain says so and asks whether you mean Tux instead of picking one silently.

<!-- [stage] docs(release): verify gallery gates in release checklist -->
