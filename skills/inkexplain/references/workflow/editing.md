# Editing

Repair an illustration with the smallest change that fixes the problem. Prefer a local edit when the host's image tool supports editing; regenerate when the problem is structural, such as the wrong idea, a passive actor, or a copied composition.

Fill the bracketed fields. For third-party archetypes, append the rights note from the archetype's `prompts.md` to every edit prompt, after the preservation clause; it is documentation, never text to draw. Archetype packs may add archetype-specific repairs to these shared ones.

## Start from the image

Edit mode skips planning: read the image, diagnose it with `references/workflow/qa-checklist.md`, pick the repair below, and deliver the edited image, or the edit prompt when the host's image tool cannot edit (inside a project, save it as `prompts.md` in the archetype's output folder, as `references/workflow/delivery.md` describes).

When the user names no archetype, the image shows which one it is: compare it with the identity markers in each candidate's `identity.md`. Keep that character; never repair toward the default style when that would change it. If you cannot tell which archetype the image is, ask one short question.

## Remove a title

```text
Edit the provided image. Remove only the title text "[text to remove]" and any underline or box around it. Fill the area with the same clean background so it matches the surrounding paper. Preserve everything else exactly: the character, labels, objects, paths, line style, colors, composition, aspect ratio, and image quality. Add no new text or objects.
```

## Reduce text

```text
Edit or regenerate the image with the same core idea, actor, action, style, and aspect ratio, but with less visible text. Keep only these labels, copied exactly: [quoted labels]. Remove full sentences, dense annotations, duplicate labels, and any title. Keep labels away from the character's face and hands. Preserve the composition and every unaffected object.
```

## Simplify the scene

```text
Edit or regenerate the image with the same core idea, actor, action, style, and aspect ratio, but a simpler scene. Keep the actor, [the one to three objects that carry the idea], and these labels, copied exactly: [quoted labels]. Remove [the extra objects, marks, and repeats]. Redraw any heap, row, or crowd you keep with fewer items, in the same place and line style. Preserve everything else.
```

## Fix a label

```text
Edit the provided image. Replace the label "[wrong text]" with "[correct text]" in the same handwriting, size, color, and position. Change nothing else.
```

Change only the labels the user named; leave the others as they are, even when they are in another language. If the new text is longer, keep it inside its shape by tightening the letter spacing slightly; do not resize or move the shape.

## Strengthen participation

```text
Regenerate this illustration with the same core idea and simple layout, but make [actor] perform the central action: [action]. [Actor] must do the work that explains the idea instead of standing beside it. Keep the same sparse hand-drawn style and these labels, copied exactly: [quoted labels].
```

## Repair character identity

```text
Regenerate this illustration with the same composition, action, labels, and style, but correct [actor]'s appearance. It must show: [identity markers from the archetype's identity.md]. Remove: [observed drift]. Preserve everything else.
```

## Repair archetype leakage

```text
Regenerate this illustration for the [archetype name] archetype only. Remove [elements that belong to another archetype or style]. Keep [actor], the core idea, the labels, and this archetype's style: [one-line style summary from the archetype's style.md].
```

## Preservation clause

Close every edit prompt with:

```text
Preserve unaffected content exactly: characters, correct labels, objects, paths, line style, colors, composition, aspect ratio, and image quality. Do not add text, logos, frames, or new objects.
```
