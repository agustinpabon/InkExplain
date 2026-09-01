// Dependency-free parser for the YAML subset used by skill metadata:
// block mappings, block sequences of scalars, plain/quoted scalars, and
// literal (|) or folded (>) block scalars. Anything outside the subset is
// reported as an error with a line number instead of being guessed at,
// mirroring how strict YAML loaders treat the same input.

import { normalizeText } from "./repository.mjs";

const KEY_PATTERN = /^("(?:[^"\\]|\\.)*"|'(?:[^']|'')*'|[A-Za-z0-9_.-]+):(?:[ \t]+(.*))?$/;
const UNSUPPORTED_START = /^[[{&*!%@`|>]/;

/**
 * @param {string} text
 * @returns {{ value: Record<string, unknown> | null, errors: { line: number, message: string }[] }}
 */
export function parseYaml(text) {
  const lines = normalizeText(text).split("\n");
  const errors = [];
  let index = 0;

  const error = (lineIndex, message) => errors.push({ line: lineIndex + 1, message });
  const indentOf = (line) => line.match(/^ */)[0].length;
  const isSkippable = (line) => line.trim() === "" || line.trimStart().startsWith("#");

  for (const [lineIndex, line] of lines.entries()) {
    if (/^ *\t/.test(line)) error(lineIndex, "tabs are not allowed in indentation");
  }

  function nextContentIndex() {
    while (index < lines.length && isSkippable(lines[index])) index += 1;
    return index < lines.length ? index : -1;
  }

  function parseScalar(raw, lineIndex) {
    const value = raw.trim();
    if (value.startsWith('"')) {
      const match = value.match(/^"((?:[^"\\]|\\.)*)"(.*)$/);
      if (!match) return error(lineIndex, "unterminated double-quoted string"), "";
      if (match[2].trim() && !match[2].trim().startsWith("#")) error(lineIndex, "unexpected text after quoted string");
      try {
        return JSON.parse(`"${match[1]}"`);
      } catch {
        return error(lineIndex, "unsupported escape sequence in double-quoted string"), match[1];
      }
    }
    if (value.startsWith("'")) {
      const match = value.match(/^'((?:[^']|'')*)'(.*)$/);
      if (!match) return error(lineIndex, "unterminated single-quoted string"), "";
      if (match[2].trim() && !match[2].trim().startsWith("#")) error(lineIndex, "unexpected text after quoted string");
      return match[1].replaceAll("''", "'");
    }
    if (UNSUPPORTED_START.test(value)) {
      error(lineIndex, `unsupported YAML syntax ${JSON.stringify(value[0])}; quote the value`);
      return value;
    }
    const plain = value.replace(/\s+#.*$/, "");
    if (/:\s/.test(plain) || plain.endsWith(":")) {
      error(lineIndex, "plain values cannot contain ': '; quote the value");
    }
    if (plain === "true") return true;
    if (plain === "false") return false;
    if (plain === "null" || plain === "~" || plain === "") return null;
    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(plain)) return Number(plain);
    return plain;
  }

  function parseBlockScalar(parentIndent, header, lineIndex) {
    const style = header[0];
    const chomp = header[1] ?? "";
    const body = [];
    let contentIndent = -1;
    while (index < lines.length) {
      const line = lines[index];
      if (line.trim() === "") {
        body.push("");
        index += 1;
        continue;
      }
      const indent = indentOf(line);
      if (indent <= parentIndent) break;
      if (contentIndent === -1) contentIndent = indent;
      if (indent < contentIndent) {
        error(index, "block scalar line is less indented than its first line");
      }
      body.push(line.slice(Math.min(indent, contentIndent)));
      index += 1;
    }
    if (contentIndent === -1) error(lineIndex, "block scalar has no content");
    let trailing = 0;
    while (body.length > 0 && body.at(-1) === "") {
      body.pop();
      trailing += 1;
    }
    let text;
    if (style === "|") {
      text = body.join("\n");
    } else {
      text = body
        .reduce((acc, line) => {
          if (line === "") return `${acc}\n`;
          return acc === "" || acc.endsWith("\n") ? acc + line : `${acc} ${line}`;
        }, "");
    }
    if (chomp === "-") return text;
    if (chomp === "+") return text + "\n".repeat(trailing + 1);
    return `${text}\n`;
  }

  function parseSequence(indent) {
    const items = [];
    while (nextContentIndex() !== -1) {
      const line = lines[index];
      const lineIndent = indentOf(line);
      if (lineIndent < indent) break;
      if (lineIndent > indent) {
        error(index, "unexpected indentation inside sequence");
        index += 1;
        continue;
      }
      const trimmed = line.trim();
      if (!(trimmed === "-" || trimmed.startsWith("- "))) break;
      const itemText = trimmed === "-" ? "" : trimmed.slice(2);
      const lineIndex = index;
      index += 1;
      if (KEY_PATTERN.test(itemText.trim())) {
        error(lineIndex, "mappings inside sequences are not supported");
        continue;
      }
      items.push(parseScalar(itemText, lineIndex));
    }
    return items;
  }

  function parseMapping(indent) {
    const result = {};
    while (nextContentIndex() !== -1) {
      const line = lines[index];
      const lineIndent = indentOf(line);
      if (lineIndent < indent) break;
      if (lineIndent > indent) {
        error(index, "unexpected indentation");
        index += 1;
        continue;
      }
      const trimmed = line.trim();
      const match = trimmed.match(KEY_PATTERN);
      if (!match) {
        error(index, trimmed.startsWith("- ") ? "sequence item where a key was expected" : "expected `key: value`");
        index += 1;
        continue;
      }
      const lineIndex = index;
      index += 1;
      const key = match[1].startsWith('"') || match[1].startsWith("'") ? parseScalar(match[1], lineIndex) : match[1];
      if (Object.hasOwn(result, key)) error(lineIndex, `duplicate key ${JSON.stringify(key)}`);
      const rest = (match[2] ?? "").trim();
      if (/^[|>][+-]?$/.test(rest)) {
        result[key] = parseBlockScalar(indent, rest, lineIndex);
      } else if (rest === "" || rest.startsWith("#")) {
        const childIndex = nextContentIndex();
        const childIndent = childIndex === -1 ? -1 : indentOf(lines[childIndex]);
        if (childIndex !== -1 && childIndent > indent) {
          result[key] = lines[childIndex].trim().startsWith("-") ? parseSequence(childIndent) : parseMapping(childIndent);
        } else {
          result[key] = null;
        }
      } else {
        result[key] = parseScalar(rest, lineIndex);
      }
    }
    return result;
  }

  const firstIndex = nextContentIndex();
  if (firstIndex === -1) return { value: {}, errors };
  const rootIndent = indentOf(lines[firstIndex]);
  if (rootIndent !== 0) error(firstIndex, "top-level keys must not be indented");
  const value = parseMapping(rootIndent);
  if (nextContentIndex() !== -1) error(index, "content after the top-level mapping could not be parsed");
  return { value: errors.length > 0 && Object.keys(value).length === 0 ? null : value, errors };
}

/** Read a nested value with a dotted path such as "interface.display_name". */
export function getPath(object, dottedPath) {
  return dottedPath.split(".").reduce((node, key) => (node && typeof node === "object" ? node[key] : undefined), object);
}

// [stage] refactor(registry): validate that outputFolder uses {slug} placeholder
