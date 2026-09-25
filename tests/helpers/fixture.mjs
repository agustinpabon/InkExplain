// Builds small, fully valid InkExplain repositories in temporary directories.
// Each test mutates one detail and asserts that exactly the expected check fails.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createContext, runChecks } from "../../scripts/lib/check-runner.mjs";
import { copyrightHolder } from "../../scripts/lib/checks/legal.mjs";
import { ALL_CHECKS } from "../../scripts/lib/checks/index.mjs";
import {
  LANGUAGE_DEFAULT_SURFACES,
  LANGUAGE_EXCEPTION_CATEGORIES,
  LEGAL,
  PACK_FILES,
  PRODUCT,
  WORKFLOW_MODULES,
} from "../../scripts/lib/config.mjs";
import { planGeneratedDocuments } from "../../scripts/lib/docs-render.mjs";
import { CATEGORIES, outputDirectory, packDirectory, parseRegistry } from "../../scripts/lib/registry.mjs";
import { Repository } from "../../scripts/lib/repository.mjs";

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** A real, decodable RGB PNG of the given size. */
export function makePng(width = 4, height = 3) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8);
  const row = Buffer.concat([Buffer.from([0]), Buffer.alloc(width * 3, 0xff)]);
  const pixels = zlib.deflateSync(Buffer.concat(Array.from({ length: height }, () => row)));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", pixels),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const SECTION_TEXT = "Fixture content.";

/** The origin project credited in fixture ATTRIBUTIONS.md files. */
export const FIXTURE_ORIGIN = Object.freeze({
  name: "Example Origin Kit",
  account: "example-origin",
  repository: "example-origin-kit",
  url: "https://github.com/example-origin/example-origin-kit",
});

function motion(actor, signatureActions) {
  return { actor, signatureActions, poses: ["leans into the work"], timing: "One decisive beat per image" };
}

function styleSheet(palette) {
  return { medium: "Hand-drawn sketch", canvas: "16:9 white", linework: "Loose black ink", palette, avoid: ["logos"] };
}

/** A three-archetype registry: the house-style default, a mascot, and a gated tribute character. */
export function fixtureRegistryData() {
  return {
    schemaVersion: 2,
    skill: "inkexplain",
    defaultArchetype: "ink",
    archetypes: [
      {
        id: "ink",
        name: "InkExplain Sketch",
        category: "house-style",
        status: "active",
        summary: "Default fixture archetype with no mascot.",
        aliases: ["InkExplain Sketch", "ink sketch"],
        outputSuffix: "illustrations",
        motionDna: motion("The ink figure", ["carry", "sort", "weigh"]),
        styleSheet: styleSheet(["explainer blue", "black ink"]),
        legalNotice: { credit: "Original to InkExplain", rightsHolder: "InkExplain contributors", license: "MIT", attributionTerms: [], restrictions: [] },
        sampleGates: { status: "pending", decision: "No samples in this fixture yet.", directories: [] },
        contract: { identityMarkers: ["ink figure"], isolationMarkers: ["ink figure"] },
      },
      {
        id: "demo",
        name: "Demo Crab",
        category: "mascot",
        status: "active",
        summary: "A third-party crab mascot used to exercise third-party archetype rules.",
        aliases: ["Demo Crab", "demo mascot"],
        excludedTerms: ["crab"],
        outputSuffix: "demo",
        motionDna: motion("Demo Crab, with both claws", ["pinch", "scuttle", "sort"]),
        styleSheet: styleSheet(["coral orange"]),
        legalNotice: {
          credit: "Demo Crab by Example Author",
          rightsHolder: "Example Author",
          license: "CC0",
          attributionTerms: ["Example Author"],
          restrictions: ["No logos."],
        },
        sampleGates: {
          status: "approved",
          decision: "Approved for the fixture gallery.",
          reviewer: "Fixture Reviewer",
          date: "2026-01-02",
          directories: ["examples/gallery/en/demo"],
        },
        contract: { identityMarkers: ["orange shell"], isolationMarkers: ["Demo Crab"] },
      },
      {
        id: "guarded",
        name: "Guarded Cat",
        category: "tribute-character",
        status: "gated-authorized",
        summary: "A protected character used to exercise gated archetype rules.",
        aliases: ["Guarded Cat"],
        outputSuffix: "guarded",
        motionDna: motion("Guarded Cat, solo", ["pounce", "guard", "stamp"]),
        styleSheet: styleSheet(["slate grey"]),
        legalNotice: {
          credit: "Guarded Cat is owned by Example Studio",
          rightsHolder: "Example Studio",
          license: "Proprietary",
          attributionTerms: ["Example Studio"],
          restrictions: ["Use only within your own authorization."],
        },
        sampleGates: { status: "withheld", decision: "Withheld in the fixture: no authorization.", directories: [] },
        contract: { identityMarkers: ["grey whiskers"], isolationMarkers: ["Guarded Cat"] },
      },
    ],
  };
}

function doc(title, headings, { body = SECTION_TEXT, preamble = "", extra = "" } = {}) {
  return `# ${title}\n\n${preamble}${headings.map((heading) => `## ${heading}\n\n${body}\n`).join("\n")}${extra}`;
}

/** Valid pack files for one archetype, satisfying every SCHEMA and LEGAL contract. */
export function packFiles(archetype) {
  const identity = archetype.contract.identityMarkers.join(", ");
  const palette = archetype.styleSheet.palette.join(", ");
  const status = archetype.status === "active" ? "" : `Status: \`${archetype.status}\`.\n\n`;
  const legal = archetype.legalNotice;
  const thirdParty = CATEGORIES[archetype.category].thirdParty;
  const rightsNote = thirdParty
    ? `\n## Rights note\n\n\`\`\`text\n${status.replace(/\n/g, " ").trim()} Credit: ${legal.credit}. ${legal.restrictions.join(" ")}\n\`\`\`\n`
    : "";
  return {
    "rights.md": doc(`${archetype.name} Rights`, ["Source", "Rights and restrictions", "Public samples"], {
      body: `Category \`${archetype.category}\`, status \`${archetype.status}\`. Rights holder: ${legal.rightsHolder}. Credit: ${legal.attributionTerms.join(", ")}.`,
    }),
    "identity.md": doc(`${archetype.name} Identity`, ["Identity", "Recognition", "Failure modes"], { body: `Keep ${identity}.` }),
    "style.md": doc(`${archetype.name} Style`, ["Canvas", "Linework", "Color", "Labels", "Avoid"], { body: `Clean. ${palette}` }),
    "motion-and-acting.md": doc(`${archetype.name} Motion and Acting`, ["Actions", "Patterns", "Supporting objects", "Originality"], {
      body: `Signature actions: ${archetype.motionDna.signatureActions.join(", ")}.`,
    }),
    "prompts.md": doc(`${archetype.name} Prompts`, ["Planning fields", "Edit prompts", "Review and repair", "Delivery notes"], {
      preamble:
        `${status}Output folder: \`${outputDirectory(archetype)}\`.\n\n` +
        `## Generation prompt\n\n\`\`\`text\nDraw one idea with ${identity}. Colors: ${palette}.\n\`\`\`\n\n`,
      extra: rightsNote,
    }),
  };
}

const MIT = `MIT License

${LEGAL.requiredCopyrightLines.join("\n")}

${LEGAL.mitPermission}

${LEGAL.mitCondition}

${LEGAL.mitDisclaimer}
`;

function attributionsText(registryData) {
  const holders = LEGAL.requiredCopyrightLines.map(copyrightHolder).join(" and ");
  return [
    "# Attributions",
    "",
    "## Character archetypes",
    "",
    ...registryData.archetypes.flatMap((archetype) => archetype.legalNotice.attributionTerms).map((term) => `- ${term}`),
    "",
    `## ${LEGAL.originsSection}`,
    "",
    `- **${FIXTURE_ORIGIN.name}** by ${holders} (<${FIXTURE_ORIGIN.url}>): the project InkExplain began from.`,
    "",
    "## Trademarks",
    "",
    "Names, characters, and marks of third parties belong to their owners.",
  ].join("\n");
}

function baseFiles(registryData) {
  const files = {};
  const pkg = "skills/inkexplain";
  files["package.json"] = JSON.stringify({ name: "inkexplain", private: true, type: "module" }, null, 2);
  files["LICENSE"] = MIT;
  files["ATTRIBUTIONS.md"] = attributionsText(registryData);
  files["docs/language-policy.md"] = `# Language policy\n\n${[...LANGUAGE_DEFAULT_SURFACES, ...LANGUAGE_EXCEPTION_CATEGORIES]
    .map((label) => `- ${label}`)
    .join("\n")}\n`;
  files["readmes/locales.json"] = JSON.stringify({
    locales: [
      {
        code: "en",
        label: "English",
        file: "README.md",
        strings: { archetype: "Archetype", category: "Category", summary: "Style summary", legalStatus: "Legal status", default: "default" },
      },
    ],
  });
  files["README.md"] = [
    `# ${PRODUCT.name}`,
    "",
    `*${PRODUCT.tagline}*`,
    "",
    PRODUCT.description,
    "",
    "<!-- inkexplain:languages:start -->",
    "<!-- inkexplain:languages:end -->",
    "",
    `Install \`skills/inkexplain\` and invoke \`${PRODUCT.invocation}\`. See [the attributions](ATTRIBUTIONS.md).`,
    "",
    "## Archetypes",
    "",
    "<!-- inkexplain:archetypes:start -->",
    "<!-- inkexplain:archetypes:end -->",
    "",
    "## Credits",
    "",
    "<!-- inkexplain:credits:start -->",
    "Builds on earlier MIT-licensed work; see ATTRIBUTIONS.md.",
    "<!-- inkexplain:credits:end -->",
    "",
  ].join("\n");
  files["examples/prompts.md"] = [
    "# Prompts",
    "",
    "```text",
    `Use ${PRODUCT.invocation} to illustrate this article.`,
    "```",
    "",
    "```text",
    `Use ${PRODUCT.invocation} with Demo Crab for this article.`,
    "```",
    "",
    "```text",
    `Use ${PRODUCT.invocation} with Guarded Cat; I hold the authorization.`,
    "```",
    "",
    "```text",
    `Use ${PRODUCT.invocation} to show one idea as Demo Crab and Guarded Cat groups.`,
    "```",
    "",
    "```text",
    `Use ${PRODUCT.invocation} in prompt mode. Do not generate images.`,
    "```",
    "",
  ].join("\n");
  files[`${pkg}/SKILL.md`] = [
    "---",
    "name: inkexplain",
    "description: Turn articles and abstract ideas into consistent hand-drawn explanatory illustrations for fixtures.",
    "---",
    "",
    "# InkExplain",
    "",
    `Invoke as \`${PRODUCT.invocation}\`. Read \`references/routing.md\`.`,
    "",
    "## When to use",
    "",
    "Fixtures.",
    "",
    "## Modes",
    "",
    "Plan, prompt, generate, edit.",
    "",
    "## Workflow",
    "",
    ...WORKFLOW_MODULES.map((module) => `- \`references/workflow/${module}\``),
    "",
    "## Rules",
    "",
    "One idea per image.",
    "",
    "## Output",
    "",
    "A short report.",
    "",
  ].join("\n");
  files[`${pkg}/agents/openai.yaml`] = [
    "interface:",
    '  display_name: "InkExplain"',
    '  short_description: "Turn ideas into illustrations."',
    `  default_prompt: "Use ${PRODUCT.invocation} to illustrate this article."`,
    "policy:",
    "  allow_implicit_invocation: true",
    "",
  ].join("\n");
  files[`${pkg}/registry.json`] = `${JSON.stringify(registryData, null, 2)}\n`;
  for (const module of WORKFLOW_MODULES) {
    files[`${pkg}/references/workflow/${module}`] = `# ${module}\n\n${SECTION_TEXT}\n`;
  }
  for (const archetype of registryData.archetypes) {
    const pack = packFiles(archetype);
    for (const file of PACK_FILES) files[`${pkg}/${packDirectory(archetype)}/${file}`] = pack[file];
  }
  files["examples/gallery/en/demo/01-demo-scene.png"] = makePng();
  files["assets/brand/mark.svg"] =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="#1F1F1F"/></svg>\n';
  return files;
}

/** Policy used for fixtures: no extra Han-script tokens; default origin-name classification. */
export const FIXTURE_POLICY = Object.freeze({ languageAllowlist: [] });

export class Fixture {
  constructor(root) {
    this.root = root;
  }

  path(relative) {
    return path.join(this.root, ...relative.split("/"));
  }

  write(relative, content) {
    fs.mkdirSync(path.dirname(this.path(relative)), { recursive: true });
    fs.writeFileSync(this.path(relative), content);
    return this;
  }

  read(relative) {
    return fs.readFileSync(this.path(relative), "utf8");
  }

  exists(relative) {
    return fs.existsSync(this.path(relative));
  }

  remove(relative) {
    fs.rmSync(this.path(relative), { recursive: true, force: true });
    return this;
  }

  /** Replace text in a file, asserting the original text is present. */
  replace(relative, search, replacement) {
    const text = this.read(relative);
    if (!text.includes(search)) throw new Error(`${relative} does not contain ${JSON.stringify(search)}`);
    return this.write(relative, text.replace(search, replacement));
  }

  append(relative, text) {
    return this.write(relative, this.read(relative) + text);
  }

  updateRegistry(mutator) {
    const file = "skills/inkexplain/registry.json";
    const data = JSON.parse(this.read(file));
    mutator(data);
    return this.write(file, `${JSON.stringify(data, null, 2)}\n`);
  }

  /** Add an archetype to the registry and write a valid pack for it. */
  addArchetype(archetype) {
    this.updateRegistry((data) => data.archetypes.push(archetype));
    const pack = packFiles(archetype);
    for (const file of PACK_FILES) this.write(`skills/inkexplain/${packDirectory(archetype)}/${file}`, pack[file]);
    return this;
  }

  /** Regenerate routing.md and README regions after registry or locale changes. */
  regenerateDocs() {
    const repo = new Repository(this.root);
    const { registry } = parseRegistry(repo.readText("skills/inkexplain/registry.json"));
    const locales = JSON.parse(repo.readText("readmes/locales.json")).locales;
    for (const plan of planGeneratedDocuments(repo, registry, locales)) {
      if (plan.problems.length === 0 && plan.current !== plan.expected) this.write(plan.path, plan.expected);
    }
    return this;
  }

  run({ only, policy = FIXTURE_POLICY } = {}) {
    const checks = only ? ALL_CHECKS.filter((check) => only.includes(check.id) || only.includes(check.area)) : ALL_CHECKS;
    return runChecks(checks, createContext(this.root, { policy }));
  }

  /** The single result for one check id. */
  check(id, options) {
    const [result] = this.run({ ...options, only: [id] });
    if (!result) throw new Error(`no check ${id}`);
    return result;
  }

  dispose() {
    fs.rmSync(this.root, { recursive: true, force: true });
  }
}

/** Create a valid fixture repository. Pass `t` to dispose it automatically. */
export function createFixture(t, { registryData = fixtureRegistryData(), files = {} } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "inkexplain-fixture-"));
  const fixture = new Fixture(root);
  for (const [relative, content] of Object.entries({ ...baseFiles(registryData), ...files })) fixture.write(relative, content);
  fixture.regenerateDocs();
  t?.after(() => fixture.dispose());
  return fixture;
}

/** Issues of a check result, formatted like the CLI (`path:line: message`). */
export function messages(result) {
  return result.issues
    .map((issue) => {
      if (!issue.path) return issue.message;
      return issue.line ? `${issue.path}:${issue.line}: ${issue.message}` : `${issue.path}: ${issue.message}`;
    })
    .join("\n");
}

// [stage] speed up fixtures
