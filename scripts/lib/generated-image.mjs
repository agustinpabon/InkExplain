// Checks that a path an agent reports for a generated image is a real raster image in the right place.
//
// An agent may only report a saved path after listing the folder (SKILL.md). This is the same test as code:
// the file must sit inside the workspace under assets/<slug>-<suffix>/ (an image of a Generate request sits one
// level down, in its run folder, run-<id>), be named NN-topic-slug, be a regular file (not a symbolic link), and
// decode as a PNG, JPEG, or WebP of plausible size. Vector files, empty files,
// and placeholders fail. It reads files and prints nothing; the CLI is scripts/verify-image.mjs.

import fs from "node:fs";
import path from "node:path";
import { RUN_FOLDER_PATTERN } from "./config.mjs";
import { readPngInfo } from "./images.mjs";

const MIN_SIDE = 64;
const MAX_SIDE = 10000;
const NAME = /^\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*(?:-v\d+)?\.(png|jpe?g|webp)$/;

/** Width and height of a JPEG, or throws. */
export function readJpegInfo(buffer) {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) throw new Error("not a JPEG file (bad signature)");
  let at = 2;
  while (at + 9 < buffer.length) {
    if (buffer[at] !== 0xff) throw new Error("JPEG marker expected");
    const marker = buffer[at + 1];
    if (marker === 0xff) { at += 1; continue; }
    if ((marker >= 0xc0 && marker <= 0xcf) && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(at + 5), width: buffer.readUInt16BE(at + 7) };
    }
    at += 2 + buffer.readUInt16BE(at + 2);
  }
  throw new Error("JPEG has no frame header");
}

/** Width and height of a WebP (lossy, lossless, or extended), or throws. */
export function readWebpInfo(buffer) {
  if (buffer.length < 30 || buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("not a WebP file (bad signature)");
  }
  const kind = buffer.toString("ascii", 12, 16);
  if (kind === "VP8 ") return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  if (kind === "VP8L") {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (kind === "VP8X") return { width: buffer.readUIntLE(24, 3) + 1, height: buffer.readUIntLE(27, 3) + 1 };
  throw new Error("unknown WebP chunk");
}

/**
 * Validate one reported image path.
 * @param {string} workspace absolute path of the user's project folder
 * @param {string} reported path as the agent reported it (relative to the workspace, POSIX style)
 * @returns {{ok: boolean, problems: string[], format?: string, width?: number, height?: number, bytes?: number}}
 */
export function validateGeneratedImage(workspace, reported) {
  const problems = [];
  const fail = (message) => { problems.push(message); return { ok: false, problems }; };
  if (typeof reported !== "string" || reported === "") return fail("no path was reported");
  if (reported.includes("\0") || reported.includes("\\")) return fail("the path must use forward slashes and no NUL");
  if (path.posix.isAbsolute(reported) || /^[A-Za-z]:/.test(reported)) return fail("the path must be relative to the workspace");
  const parts = reported.split("/");
  if (parts.includes("..") || parts.includes(".")) return fail("the path must not use . or .. segments");
  if (parts[0] !== "assets" || (parts.length !== 3 && parts.length !== 4)) return fail("an image belongs in assets/<slug>-<suffix>/run-<id>/<file>");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parts[1])) return fail("the output folder must be a lowercase kebab-case name");
  if (parts.length === 4 && !RUN_FOLDER_PATTERN.test(parts[2])) return fail("the folder inside the output folder must be a run folder, run-YYYYMMDD-HHMMSS-xxxx");
  const fileName = parts.at(-1);
  if (!NAME.test(fileName)) return fail("the file name must look like 01-topic-slug.png");

  const absolute = path.join(workspace, ...parts);
  let stat;
  try { stat = fs.lstatSync(absolute); } catch { return fail("the file does not exist"); }
  if (stat.isSymbolicLink()) return fail("the path is a symbolic link");
  if (!stat.isFile()) return fail("the path is not a regular file");
  if (stat.size === 0) return fail("the file is empty");

  const buffer = fs.readFileSync(absolute);
  const extension = path.extname(fileName).slice(1).toLowerCase();
  let info;
  try {
    if (buffer.subarray(0, 4).toString("latin1") === "\u0089PNG") info = { format: "png", ...readPngInfo(buffer) };
    else if (buffer[0] === 0xff && buffer[1] === 0xd8) info = { format: "jpeg", ...readJpegInfo(buffer) };
    else if (buffer.toString("ascii", 0, 4) === "RIFF") info = { format: "webp", ...readWebpInfo(buffer) };
    else return fail("the file is not a PNG, JPEG, or WebP image (an SVG, HTML file, or text is not a raster image)");
  } catch (error) {
    return fail(`the file does not decode: ${error.message}`);
  }
  const expected = info.format === "jpeg" ? ["jpg", "jpeg"] : [info.format];
  if (!expected.includes(extension)) problems.push(`the extension .${extension} does not match the ${info.format} content`);
  if (info.width < MIN_SIDE || info.height < MIN_SIDE || info.width > MAX_SIDE || info.height > MAX_SIDE) {
    problems.push(`implausible size ${info.width}x${info.height}`);
  }
  return { ok: problems.length === 0, problems, format: info.format, width: info.width, height: info.height, bytes: stat.size };
}
