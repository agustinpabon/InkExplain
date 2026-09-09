// ASSET: image integrity, SVG safety, and the public-sample gate.

import path from "node:path";
import { defineCheck } from "../check-runner.mjs";
import { GALLERY_FILE_PATTERN, GALLERY_LANGUAGES, PATHS } from "../config.mjs";
import { readPngInfo, svgProblems } from "../images.mjs";

const IMAGE_EXTENSIONS = new Set([".png", ".svg", ".gif", ".jpg", ".jpeg", ".webp"]);

function imageFiles(repo) {
  return repo.walk().filter((file) => IMAGE_EXTENSIONS.has(path.posix.extname(file).toLowerCase()));
}

/** Where an image sits: gallery sample, package calibration asset, archetype reference, brand asset, or elsewhere. */
export function classifyImage(file) {
  const gallery = file.match(new RegExp(`^${PATHS.galleryDir}/([^/]+)/([^/]+)/([^/]+)$`));
  if (gallery) return { kind: "gallery", language: gallery[1], archetypeId: gallery[2], name: gallery[3], directory: path.posix.dirname(file) };
  const calibration = file.match(new RegExp(`^${PATHS.packageDir}/assets/([^/]+)/[^/]+$`));
  if (calibration) return { kind: "calibration", archetypeId: calibration[1], directory: path.posix.dirname(file) };
  if (file.startsWith(`${PATHS.archetypesDir}/`)) return { kind: "archetype-reference" };
  if (file.startsWith(`${PATHS.brandDir}/`)) return { kind: "brand" };
  return { kind: "other" };
}

export const assetChecks = [
  defineCheck({
    id: "ASSET-001",
    area: "ASSET",
    title: "images are valid PNG or safe, self-contained SVG",
    run({ repo }) {
      const issues = [];
      for (const file of imageFiles(repo)) {
        const extension = path.posix.extname(file).toLowerCase();
        if (extension === ".png") {
          try {
            readPngInfo(repo.readBuffer(file));
          } catch (error) {
            issues.push({ path: file, message: error.message });
          }
        } else if (extension === ".svg") {
          for (const problem of svgProblems(repo.readText(file))) issues.push({ path: file, message: `SVG ${problem}` });
        } else {
          issues.push({ path: file, message: `${extension} images are not supported; use PNG or SVG` });
        }
      }
      return issues;
    },
  }),

  defineCheck({
    id: "ASSET-002",
    area: "ASSET",
    title: "published samples exist only where an archetype's sample gate approves them",
    requires: ["registry"],
    run({ repo, registry }) {
      const issues = [];
      for (const file of imageFiles(repo)) {
        const place = classifyImage(file);
        if (place.kind === "archetype-reference" || place.kind === "brand") continue;
        if (place.kind === "other") {
          issues.push({ path: file, message: `images belong in ${PATHS.galleryDir}/, the package assets, an archetype pack, or ${PATHS.brandDir}/` });
          continue;
        }
        const archetype = registry.byId.get(place.archetypeId);
        if (!archetype) {
          issues.push({ path: file, message: `folder ${place.archetypeId} does not match any archetype id` });
          continue;
        }
        if (place.kind === "gallery") {
          if (!GALLERY_LANGUAGES.includes(place.language)) {
            issues.push({ path: file, message: `gallery language ${place.language} is not one of ${GALLERY_LANGUAGES.join(", ")}` });
          }
          if (!GALLERY_FILE_PATTERN.test(place.name)) {
            issues.push({ path: file, message: "gallery files are named NN-kebab-slug.png" });
          }
        }
        const gate = archetype.sampleGates;
        if (gate.status !== "approved") {
          issues.push({ path: file, message: `archetype ${archetype.id} public samples are ${gate.status}; this image must not be published` });
        } else if (!gate.directories.includes(place.directory)) {
          issues.push({ path: file, message: `${place.directory} is not an approved sample directory for archetype ${archetype.id}` });
        }
      }
      return issues;
    },
  }),
];

// [stage] initial assets check
