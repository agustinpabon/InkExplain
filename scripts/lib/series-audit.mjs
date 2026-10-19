// Audits the image-tool calls of one agent run against the character lock.
//
// A report that says "the reference was attached to every call" is a claim; the calls the agent made are the
// evidence. This reads them out of a Codex session rollout (the JSONL file Codex keeps for each session, where the
// agent's code appears as text), an Antigravity transcript (transcript.jsonl in a conversation's
// .system_generated/logs folder), or out of a plain JSON list of calls for any other host, and checks the rules of
// references/workflow/character-lock.md that a call can show: the first image of every call is the same packaged
// reference, it is never a render, and no call selects "recent images" from the conversation. A render attached
// after the reference is reported as a note: it is how a label or title repair hands over the image to edit, and
// only an identity repair may not do so, which a call cannot tell. It cannot say whether a character looks right:
// that is for a person, or an agent looking at the images.
//
// It reads text and prints nothing; the CLI is scripts/audit-series.mjs. Offline, like every script here.

import { extractCodeBlocks } from "./markdown.mjs";

const CALL_START = /tools\.image_gen__imagegen\s*\(/g;
const DECLARATION = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*/g;
// Codex's code tool keeps values between calls with store("name", value) and load("name"); a run may keep the
// reference path that way and pass load("name") to the image tool.
const STORE_CALL = /\bstore\(\s*(["'`])([^"'`\\]+)\1\s*,\s*/g;
const LOAD_CALL = /^load\(\s*(["'`])([^"'`\\]+)\1\s*\)$/;
const MAX_DEPTH = 5;

/** Index just past the string or template literal that opens at `start`. */
function stringEnd(source, start) {
  const quote = source[start];
  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === "\\") index += 1;
    else if (quote === "`" && source[index] === "$" && source[index + 1] === "{") index = bracketEnd(source, index + 1) - 1;
    else if (source[index] === quote) return index + 1;
  }
  return source.length;
}

/** Index just past the bracket that closes the one at `open`, skipping strings and comments. */
function bracketEnd(source, open) {
  let depth = 0;
  for (let index = open; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' || character === "'" || character === "`") index = stringEnd(source, index) - 1;
    else if (character === "/" && source[index + 1] === "/") index = (source.indexOf("\n", index) === -1 ? source.length : source.indexOf("\n", index)) - 1;
    else if (character === "/" && source[index + 1] === "*") index = (source.indexOf("*/", index) === -1 ? source.length : source.indexOf("*/", index) + 2) - 1;
    else if ("([{".includes(character)) depth += 1;
    else if (")]}".includes(character)) {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return source.length;
}

/** The pieces of `source` between top-level separators (a comma unless told otherwise), trimmed, without empty ones. */
function splitTopLevel(source, separator = ",") {
  const pieces = [];
  let from = 0;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' || character === "'" || character === "`") index = stringEnd(source, index) - 1;
    else if ("([{".includes(character)) index = bracketEnd(source, index) - 1;
    else if (character === separator) {
      pieces.push(source.slice(from, index));
      from = index + 1;
    }
  }
  pieces.push(source.slice(from));
  return pieces.map((piece) => piece.trim()).filter((piece) => piece !== "");
}

/** The text of an initializer: up to a top-level semicolon, or the end of the line once its brackets are closed. */
function expressionAt(source, start) {
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' || character === "'" || character === "`") index = stringEnd(source, index) - 1;
    else if ("([{".includes(character)) index = bracketEnd(source, index) - 1;
    else if (character === ";" || character === "\n") return source.slice(start, index).trim();
  }
  return source.slice(start).trim();
}

function decodeString(expression) {
  const quote = expression[0];
  const body = expression.slice(1, -1);
  if (quote === "`" && body.includes("${")) return null;
  try {
    return quote === '"' ? JSON.parse(expression) : body.replace(/\\(.)/gs, (_, escaped) => ({ n: "\n", t: "\t", r: "\r" })[escaped] ?? escaped);
  } catch {
    return null;
  }
}

const shortened = (text) => (text.length > 80 ? `${text.slice(0, 77)}...` : text);

/**
 * The value of an expression in a call, resolved through the `const` declarations and the `store("name", ...)` calls
 * that came before it: a string, a number, a boolean, null, a list, or `{ unresolved, tail }` when the code computes
 * it. A path built as a computed head plus a literal end (a workspace folder, then "/.agents/skills/.../xiaohei.png")
 * keeps its end as `tail`: the end is what names the file. Anything else computed never passes as evidence.
 */
function valueOf(expression, bindings, depth = 0) {
  const text = expression.trim();
  if (text === "null" || text === "undefined") return null;
  if (/^["'`]/.test(text) && stringEnd(text, 0) === text.length) {
    const value = decodeString(text);
    if (value !== null) return value;
    // A template with a placeholder: what follows its last placeholder is known.
    const body = text.slice(1, -1);
    const tail = body.slice(body.lastIndexOf("}") + 1);
    return { unresolved: shortened(text), tail: tail === "" ? null : tail };
  }
  if (/^-?\d+(?:\.\d+)?$/.test(text)) return Number(text);
  if (text === "true" || text === "false") return text === "true";
  if (text.startsWith("[") && bracketEnd(text, 0) === text.length) return splitTopLevel(text.slice(1, -1)).map((item) => valueOf(item, bindings, depth + 1));
  if (/^[A-Za-z_$][\w$]*$/.test(text) && depth < MAX_DEPTH && bindings.has(text)) return valueOf(bindings.get(text), bindings, depth + 1);
  const loaded = LOAD_CALL.exec(text);
  if (loaded && depth < MAX_DEPTH && bindings.has(`store:${loaded[2]}`)) return valueOf(bindings.get(`store:${loaded[2]}`), bindings, depth + 1);
  const operands = splitTopLevel(text, "+");
  if (operands.length > 1 && depth < MAX_DEPTH) {
    const parts = operands.map((operand) => valueOf(operand, bindings, depth + 1));
    if (parts.every((part) => typeof part === "string")) return parts.join("");
    const last = parts.at(-1);
    if (typeof last === "string") return { unresolved: shortened(text), tail: last };
    if (last !== null && typeof last === "object" && !Array.isArray(last) && last.tail) return { unresolved: shortened(text), tail: last.tail };
  }
  return { unresolved: shortened(text), tail: null };
}

const flatten = (value) => (Array.isArray(value) ? value.flatMap(flatten) : [value]);

/** The properties of an object literal as [[key, expression]]; a spread or a shorthand becomes an unresolved entry. */
function properties(objectText) {
  return splitTopLevel(objectText.trim().slice(1, -1)).map((piece) => {
    const named = /^(?:([A-Za-z_$][\w$]*)|"([^"]*)"|'([^']*)')\s*:\s*([\s\S]*)$/.exec(piece);
    if (named) return [named[1] ?? named[2] ?? named[3], named[4]];
    const shorthand = /^[A-Za-z_$][\w$]*$/.exec(piece);
    return shorthand ? [piece, piece] : ["...", piece];
  });
}

/** The code with every comment blanked out (same length), so a call that is only mentioned in a comment is not found. */
function withoutComments(source) {
  let masked = "";
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' || character === "'" || character === "`") {
      const end = stringEnd(source, index);
      masked += source.slice(index, end);
      index = end - 1;
    } else if (character === "/" && (source[index + 1] === "/" || source[index + 1] === "*")) {
      const line = source[index + 1] === "/";
      const end = line ? (source.indexOf("\n", index) === -1 ? source.length : source.indexOf("\n", index)) : source.indexOf("*/", index) === -1 ? source.length : source.indexOf("*/", index) + 2;
      masked += source.slice(index, end).replace(/[^\n]/g, " ");
      index = end - 1;
    } else {
      masked += character;
    }
  }
  return masked;
}

/** A reference path as the log shows it: the whole path when it is literal, else the end of it that the code spelled out. */
const known = (path) => ({ known: path, complete: true });

/** The image-tool calls written in one piece of agent code, with each call's arguments resolved where they are literal. */
function callsInCode(code, bindings) {
  const calls = [];
  for (const match of withoutComments(code).matchAll(CALL_START)) {
    const open = match.index + match[0].length - 1;
    const argument = code.slice(open + 1, bracketEnd(code, open) - 1).trim();
    const call = { keys: [], prompt: null, references: null, lastImages: null, unresolved: [] };
    if (!argument.startsWith("{")) {
      call.unresolved.push(`the arguments of the call: ${argument.slice(0, 60)}`);
      calls.push(call);
      continue;
    }
    for (const [key, expression] of properties(argument)) {
      if (key === "...") call.unresolved.push(`a spread: ${expression.slice(0, 60)}`);
      else call.keys.push(key);
      const value = key === "..." ? null : valueOf(expression, bindings);
      if (key === "prompt") call.prompt = typeof value === "string" ? value : null;
      else if (key === "referenced_image_paths") {
        call.references = value === null ? null : flatten(value).map((path) => (typeof path === "string" ? known(path) : path?.tail ? { known: path.tail, complete: false } : null));
        if (call.references?.includes(null)) call.unresolved.push("the reference paths");
        call.references = call.references?.filter(Boolean) ?? null;
      } else if (key === "num_last_images_to_include") call.lastImages = value;
    }
    calls.push(call);
  }
  return calls;
}

/** Every record of a Codex rollout that is JSON; lines that are not are skipped. */
function rolloutRecords(text) {
  const records = [];
  for (const line of text.split("\n")) {
    if (line.trim() === "") continue;
    try {
      records.push(JSON.parse(line));
    } catch {
      // A partial last line of a session still being written is not a record.
    }
  }
  return records;
}

// The arguments of a call written out as data. Codex names the reference list referenced_image_paths and the prompt
// prompt; Cursor's GenerateImage is reported to use reference_image_paths and description; Antigravity's generate_image
// takes ImagePaths and Prompt, and its transcript writes each value as JSON text ("\"16:9\"", "[\"/p/xiaohei.png\"]").
const decoded = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};
const argument = (args, ...names) => {
  for (const [key, value] of Object.entries(args ?? {})) {
    if (names.includes(key.toLowerCase())) return decoded(value);
  }
  return undefined;
};
const fromArguments = (args) => {
  const list = argument(args, "referenced_image_paths", "reference_image_paths", "imagepaths", "image_paths");
  const prompt = argument(args, "prompt", "description");
  return {
    keys: Object.keys(args ?? {}),
    prompt: typeof prompt === "string" ? prompt : null,
    references: Array.isArray(list) ? list.map(known) : null,
    lastImages: argument(args, "num_last_images_to_include") ?? null,
    unresolved: [],
  };
};

/**
 * The image-tool calls of a run, in order. `text` is a Codex session rollout (JSONL), or a JSON list of calls
 * (`[{ "prompt": "...", "referenced_image_paths": ["..."] }]`, or `{ "calls": [...] }`) for any other host; a call may name
 * its reference list `reference_image_paths` and its prompt `description`, as Cursor's GenerateImage is reported to.
 */
export function imageToolCalls(text) {
  const trimmed = text.trim();
  let data = null;
  if (/^[[{]/.test(trimmed)) {
    try {
      data = JSON.parse(trimmed);
    } catch {
      // Several JSON lines are a rollout, not one list.
    }
  }
  const list = Array.isArray(data) ? data : data?.calls;
  if (Array.isArray(list)) return list.map(fromArguments);

  const calls = [];
  const bindings = new Map();
  for (const record of rolloutRecords(text)) {
    if (Array.isArray(record.tool_calls)) {
      // A line of an Antigravity transcript: the agent's tool calls, each with a name and its arguments.
      for (const call of record.tool_calls) {
        if (/generate_?image|image_?gen/i.test(call?.name ?? "")) calls.push(fromArguments(call.args ?? call.arguments));
      }
      continue;
    }
    const payload = record.payload ?? {};
    if (record.type !== "response_item") continue;
    if (payload.type === "function_call" && /image_gen/.test(payload.name ?? "")) {
      try {
        calls.push(fromArguments(JSON.parse(payload.arguments ?? "{}")));
      } catch {
        calls.push({ keys: [], prompt: null, references: null, lastImages: null, unresolved: ["the arguments of the call"] });
      }
    } else if (payload.type === "custom_tool_call" && typeof payload.input === "string") {
      // Later code may use what earlier code declared or stored, so both are collected as the run goes on.
      for (const declaration of payload.input.matchAll(DECLARATION)) {
        bindings.set(declaration[1], expressionAt(payload.input, declaration.index + declaration[0].length));
      }
      const uncommented = withoutComments(payload.input);
      for (const stored of uncommented.matchAll(STORE_CALL)) {
        const open = stored.index + stored[0].indexOf("(");
        bindings.set(`store:${stored[2]}`, payload.input.slice(stored.index + stored[0].length, bracketEnd(payload.input, open) - 1).trim());
      }
      calls.push(...callsInCode(payload.input, bindings));
    }
  }
  return calls;
}

const normalize = (path) => String(path).replaceAll("\\", "/");
const basename = (path) => normalize(path).split("/").at(-1);
const isRender = (path) => /\/generated_images\//i.test(normalize(path)) || /^(?:exec-|\d{2}-)/.test(basename(path));
/** What identifies a reference across calls: the whole path, or the end of it that the code spelled out. */
const keyOf = (entry) => (entry.complete ? normalize(entry.known) : `...${normalize(entry.known)}`);

/** The Character paragraph of every complete prompt in a prompts.md (or any text holding "Generate one standalone" prompts). */
export function characterParagraphs(promptsText) {
  const found = [];
  for (const block of extractCodeBlocks(promptsText)) {
    if (block.info !== "text" || !block.content.startsWith("Generate one standalone")) continue;
    const paragraph = block.content.split(/\n{2,}/).find((candidate) => candidate.startsWith("Character:"));
    if (paragraph !== undefined) found.push(paragraph.replace(/\s+/g, " ").trim());
  }
  return found;
}

/**
 * Check the calls of one run. `options.reference` is the packaged file the series must attach (a path suffix such as
 * "references/archetypes/xiaohei/xiaohei.png"); `options.mode` is "attached" (the default: the tool takes images) or
 * "text-only" (it does not); `options.characterParagraphs` are the Character paragraphs the prompts carried.
 * Returns { results, ok }, each result being { id, title, status: "pass" | "fail" | "skip" | "note", detail }; a
 * note never fails the audit.
 */
export function auditSeries(calls, { reference, mode = "attached", characterParagraphs: paragraphs = null } = {}) {
  const results = [];
  const add = (id, title, status, detail = "") => results.push({ id, title, status, detail });
  const attached = mode === "attached";

  add("CALLS", "the run called the image tool", calls.length > 0 ? "pass" : "fail", `${calls.length} call${calls.length === 1 ? "" : "s"} found`);
  const unresolved = calls.flatMap((call, index) => call.unresolved.map((what) => `call ${index + 1}: ${what}`));
  add(
    "VISIBLE",
    "what each call passed can be read from the log",
    unresolved.length === 0 ? "pass" : "fail",
    unresolved.length === 0 ? "every reference path is spelled out, at least at its end" : `cannot tell, so nothing is claimed: ${unresolved.join("; ")}`,
  );

  const lists = calls.map((call) => call.references ?? []);
  const withLast = calls.flatMap((call, index) => (call.lastImages === null || call.lastImages === 0 ? [] : [index + 1]));
  add(
    "NO-LAST-IMAGES",
    "no call selects recent conversation images",
    withLast.length === 0 ? "pass" : "fail",
    withLast.length === 0 ? "none uses num_last_images_to_include" : `call ${withLast.join(", ")} used num_last_images_to_include, which carries earlier renders into the next image`,
  );

  const rendersFirst = lists.flatMap((entries, index) => (entries.length > 0 && isRender(entries[0].known) ? [`call ${index + 1}: ${entries[0].known}`] : []));
  add("NO-RENDER", "no render stands in for the identity reference", rendersFirst.length === 0 ? "pass" : "fail", rendersFirst.length === 0 ? "no call's first image is a generated image" : rendersFirst.join("; "));

  if (attached) {
    const missing = lists.flatMap((entries, index) => (entries.length === 0 ? [index + 1] : []));
    add("ATTACHED", "the reference is attached to every call", calls.length > 0 && missing.length === 0 ? "pass" : "fail", missing.length === 0 ? `all ${calls.length} calls pass a reference image` : `call ${missing.join(", ")} passed no reference`);

    const firsts = lists.map((entries) => (entries.length > 0 ? keyOf(entries[0]) : null));
    const distinct = new Set(firsts);
    add(
      "SAME-FILE",
      "every call's first image is the same file",
      calls.length > 0 && distinct.size === 1 && !distinct.has(null) ? "pass" : "fail",
      distinct.size === 1 ? `one file: ${firsts[0] ?? "(none)"}` : `${distinct.size} different first images: ${[...distinct].map((key) => key ?? "(none)").join(" ; ")}`,
    );

    if (reference) {
      const suffix = normalize(reference).toLowerCase();
      const wrong = lists.flatMap((entries, index) => (entries.length > 0 && !normalize(entries[0].known).toLowerCase().endsWith(suffix) && !/\/identity-reference\.png$/i.test(normalize(entries[0].known)) ? [`call ${index + 1}: ${entries[0].known}`] : []));
      add(
        "PACKAGED",
        `that file is the packaged ${reference}`,
        calls.length > 0 && wrong.length === 0 && missing.length === 0 ? "pass" : "fail",
        wrong.length > 0 ? wrong.join("; ") : missing.length > 0 ? `call ${missing.join(", ")} attached nothing` : "every first image ends with it",
      );
    }

    const extras = lists.flatMap((entries, index) => (entries.length > 1 ? [`call ${index + 1} also attached ${entries.slice(1).map((entry) => entry.known).join(", ")}`] : []));
    if (extras.length > 0) {
      add("EXTRA-IMAGES", "images attached after the reference", "note", `${extras.join("; ")}. That is how a label or title repair hands over the image to edit; an identity repair must regenerate from the reference alone, so check what the call was for.`);
    }
  } else {
    const given = lists.flatMap((entries, index) => (entries.length > 0 ? [index + 1] : []));
    add("TEXT-ONLY", "a text-only series passes no reference", given.length === 0 ? "pass" : "fail", given.length === 0 ? "no call passes a reference, as the report must say" : `call ${given.join(", ")} passed one, so the series was not text-only`);
  }

  if (paragraphs === null) {
    add("SAME-CHARACTER", "every prompt carries the same Character paragraph", "skip", "no prompts were given: pass the run's prompts.md");
  } else {
    const distinct = new Set(paragraphs);
    add("SAME-CHARACTER", "every prompt carries the same Character paragraph", paragraphs.length > 0 && distinct.size === 1 ? "pass" : "fail", paragraphs.length === 0 ? "no prompt with a Character paragraph was found" : `${paragraphs.length} prompts, ${distinct.size} distinct Character paragraph${distinct.size === 1 ? "" : "s"}`);
  }

  return { results, ok: results.every((result) => result.status !== "fail") };
}
