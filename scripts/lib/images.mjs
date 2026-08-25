// Structural validation for the image formats the repository ships.

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_IMAGE_DIMENSION = 10000;

/**
 * Read width and height from a PNG buffer.
 * Returns { width, height } or throws with a description of the defect.
 */
export function readPngInfo(buffer) {
  if (buffer.length < 33 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error("not a PNG file (bad signature)");
  }
  if (buffer.readUInt32BE(8) !== 13 || buffer.toString("ascii", 12, 16) !== "IHDR") {
    throw new Error("PNG does not start with an IHDR chunk");
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width === 0 || height === 0 || width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    throw new Error(`implausible PNG dimensions ${width}x${height}`);
  }
  if (!buffer.includes(Buffer.from("IEND"))) throw new Error("PNG is truncated (no IEND chunk)");
  return { width, height };
}

const SVG_HAZARDS = [
  { pattern: /<script\b/i, message: "contains a <script> element" },
  { pattern: /\son[a-z]+\s*=/i, message: "contains an inline event handler" },
  { pattern: /<foreignObject\b/i, message: "contains <foreignObject>" },
  { pattern: /(?:xlink:)?href\s*=\s*["']\s*(?:https?:|\/\/|javascript:|data:text\/html)/i, message: "references external or executable content" },
  { pattern: /@import\b|url\(\s*["']?\s*(?:https?:|\/\/)/i, message: "loads external styles or resources" },
  { pattern: /<!ENTITY\b/i, message: "declares XML entities" },
];

/** Problems that make an SVG unsafe or unrenderable in a README. Empty when fine. */
export function svgProblems(text) {
  const problems = [];
  const body = text.replace(/^﻿?\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*/, "");
  if (!/^<svg\b/i.test(body)) problems.push("does not start with an <svg> element");
  if (!/<svg\b[^>]*\bviewBox\s*=/i.test(text)) problems.push("root <svg> needs a viewBox");
  if (!/<\/svg>\s*$/i.test(text)) problems.push("is not closed by </svg>");
  for (const { pattern, message } of SVG_HAZARDS) {
    if (pattern.test(text)) problems.push(message);
  }
  return problems;
}
