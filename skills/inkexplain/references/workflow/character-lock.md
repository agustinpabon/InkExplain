# Character lock

How a series keeps one recognizable character. Use it whenever a request produces two or more images of the same archetype, and when you repair one image of a series. It runs by default: the user never has to ask for a reference, an image input, or a check.

The failure it prevents: every image is generated from a description alone, the character is re-interpreted each time, and by the fourth image it has ears, thick limbs, or another body, while the agent reports that its identity was preserved. A written description does not hold a design, and a report does not prove it did. So the identity travels with every call as a picture and as fixed words, and every result is checked against the picture. A second failure reads the same in a report: images that an earlier run left in the folder are delivered as if they had been generated now, and approved without a new look. A series is the images this run generated, and nothing else (`references/workflow/delivery.md`).

## What is locked and what is free

Each pack's `identity.md` lists what never changes in a series and what may.

- **Free**: position in the frame, scale within the pack's bounds, orientation, acting, limb pose, and how the character handles props.
- **Locked**: what kind of figure it is, its face, how many limbs it has and where they attach, the shape of its body, its eye design, its drawing style, line weight, and palette.

The character may lean, reach, crouch, or carry. It never becomes the prop, gains a part, loses a part, or changes style to suit a scene. If a scene seems to need that, change the scene.

## The three parts

1. **Identity block.** The Character paragraph of the pack's generation prompt, copied word for word into every prompt of the series. Keep its reference sentence in every prompt or delete it from every prompt. Never paraphrase it, shorten it, or reword it for a scene: only the Action, Scene, Composition, objects, and labels change.
2. **Identity reference.** When `references/routing.md` lists an identity reference for the archetype, that exact file is attached to every call of the series.
3. **Series gate.** Every image is checked against the reference and against the rest of the series before it is called consistent (`references/workflow/qa-checklist.md`).

## Attach the reference

Before the first image, read the parameters of the image tool you are about to call, not only its name. Look for an input that takes image files: a list of image paths, a reference-image field, or an attachment slot.

- **The tool takes images.** On every call, pass the packaged reference through that input, by its absolute path inside this skill's folder (the folder that holds this `SKILL.md`). Name its role with the pack's reference sentence, which says that the image is the identity and style reference and not a pose or a layout. If the tool takes several images, the identity reference goes first, and a second image is added only for a stated purpose.
- **Always the same file.** The packaged file, every time. Never a render: not image 1 for image 2, not "the previous image", and never an option that selects recent images from the conversation (in Codex, `num_last_images_to_include`), because that carries earlier mistakes into the next image. Do not count on the tool remembering earlier images either: every call carries the identity itself.
- **Only when it was attached.** A path written in the prompt text, a file you opened in a viewer, and a description of the reference are not an attachment. Say "attached" only when the call passed the file through the tool's own image input. The words "Image 1" in the prompt, an image you opened earlier in the conversation, and an old render in the output folder are not an attachment either: only the file passed through the input on that call makes it reference-guided, and the run record names the input and the file for every call. If a call fails with the image attached, say so; do not quietly retry without it and go on as if it were attached.
- **A tool that only reads images already in the conversation** (it has a "last N images" option and no path input) may be used only if you open the reference with the viewer immediately before the call and ask for exactly that one image, so that it is the most recent. If you cannot guarantee that, treat the tool as taking no images.
- **A tool that only edits** an image you give it is not used to draw new scenes from the reference. Use it for repairs that are not identity repairs.
- **If the tool cannot read the skill folder**, copy the reference into the run folder as `identity-reference.png` (it is not one of the run's images), attach the copy, and say so in the report.

### When the tool takes no images

Run the text-only lock: the Character paragraph exactly as the template has it, with the reference sentence deleted from every prompt, and nothing else varied between images. Say so in the report: "Reference not supplied: the image tool has no image input, so the identity rests on the written lock alone." Never describe such a series as reference-guided. Review it more strictly, because nothing but words holds the design.

In Prompt mode, deliver the prompts without the reference sentence and tell the user which file to attach and which sentence to add (`references/workflow/prompt-assembly.md`).

## Run the series

1. Fix the plan before image one: the run folder, the archetype, the reference mode (attached or text-only), the Character paragraph, and the Style paragraph. They do not change afterwards.
2. One image per call, one at a time. Save it in the run folder and add its row to the run record, then review it before the next call: open the saved image and the reference with the host's image viewer and answer the pack's identity checks.
3. Repair a failed image at once (below), before the next call.
4. After the last image, run the series gate in `references/workflow/qa-checklist.md`.

Every image of the request is generated in this run. Do not stop after one call because earlier images already show the topic, and do not fill the series with them.

## Repair

An identity failure is repaired by generating the image again, not by editing it: the same prompt, the same reference attached, and one `Correction:` paragraph added directly after the Action paragraph. The correction states the fault and the fix in plain words ("the top of the body is one smooth dome with nothing on it", "exactly two thin legs, each a single stroke"). Do not touch the Character paragraph, and do not attach or edit the failed image: it would carry its mistakes into the new one. Labels, titles, and other problems that are not identity are repaired as `references/workflow/editing.md` says.

Keep it bounded: at most two repair attempts per image and six per series. Each repair is another call, so it counts in the run record as a generator call and a new image. An image that still fails is not approved. Report it as needing repair, with what you saw, and keep it apart from the approved images.

## Report it

The report says which mode ran, with the parameter used when a reference was attached, gives every image a status, and gives the run's counts (`references/workflow/delivery.md`). Never call a series consistent in prose when its statuses say otherwise.
