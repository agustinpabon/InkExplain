// ASSET: image integrity, SVG safety, and the public-sample gate.

import path from "node:path";
import { defineCheck } from "../check-runner.mjs";
import { GALLERY_FILE_PATTERN, GALLERY_LANGUAGES, PATHS } from "../config.mjs";
import { readPngInfo, svgProblems } from "../images.mjs";
import { gitBlobSha1, loadProvenance, setFor } from "../provenance.mjs";

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
  if (file.startsWith(`${PATHS.showcaseDir}/`)) return { kind: "showcase" };
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
        if (place.kind === "archetype-reference" || place.kind === "brand" || place.kind === "showcase") continue;
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

  defineCheck({
    id: "ASSET-003",
    area: "ASSET",
    title: "every published sample has a recorded source and still matches the copy on record",
    run({ repo }) {
      const published = new Map();
      for (const file of imageFiles(repo)) {
        const place = classifyImage(file);
        if (place.kind !== "gallery") continue;
        if (!published.has(place.directory)) published.set(place.directory, []);
        published.get(place.directory).push(place.name);
      }
      if (published.size === 0) return [];

      const { manifest, issues: problems, missing } = loadProvenance(repo);
      if (manifest === null) {
        return missing
          ? [{ path: PATHS.galleryProvenance, message: "missing; every published sample needs a recorded source (see docs/provenance.md)" }]
          : problems.map((issue) => ({ path: PATHS.galleryProvenance, message: `${issue.where}: ${issue.message}` }));
      }

      const issues = [];
      for (const [directory, names] of published) {
        const set = manifest.sets.find((candidate) => candidate.directory === directory);
        if (set === undefined) {
          issues.push({ path: directory, message: `published samples have no set in ${PATHS.galleryProvenance}; record where they came from` });
          continue;
        }
        for (const name of names) {
          const recorded = set.files[name];
          if (recorded === undefined) {
            issues.push({ path: `${directory}/${name}`, message: "is not listed in the provenance manifest" });
          } else if (gitBlobSha1(repo.readBuffer(`${directory}/${name}`)) !== recorded) {
            issues.push({
              path: `${directory}/${name}`,
              message: `differs from the copy on record (git blob ${recorded.slice(0, 10)}...); an edited image is not a copy, so describe it as an inkexplain set`,
            });
          }
        }
        for (const name of Object.keys(set.files)) {
          if (!names.includes(name)) issues.push({ path: `${directory}/${name}`, message: "is listed in the provenance manifest but the image is missing" });
        }
      }
      for (const set of manifest.sets) {
        if (!published.has(set.directory)) issues.push({ path: PATHS.galleryProvenance, message: `describes ${set.directory}, which has no gallery images` });
      }
      return issues;
    },
  }),

  defineCheck({
    id: "ASSET-004",
    area: "ASSET",
    title: "a review of another project's images is dated after they were published",
    requires: ["registry"],
    run({ repo, registry }) {
      // ASSET-003 reports a missing or broken manifest.
      const { manifest } = loadProvenance(repo);
      if (manifest === null) return [];
      const issues = [];
      for (const archetype of registry.archetypes) {
        const gate = archetype.sampleGates;
        if (gate.status !== "approved") continue;
        for (const directory of gate.directories) {
          const set = setFor(manifest, directory);
          if (set?.origin !== "historical") continue;
          const published = set.source.firstPublished;
          // ISO dates compare as text. A review of copies cannot come before, or on the day of, the publication that made them.
          if (gate.date <= published) {
            issues.push({
              path: PATHS.registryFile,
              message: `archetype ${archetype.id} records a review on ${gate.date}, but ${directory} holds copies first published by ${set.source.project} on ${published}; review the copies and record the day you did`,
            });
          }
        }
      }
      return issues;
    },
  }),
];
