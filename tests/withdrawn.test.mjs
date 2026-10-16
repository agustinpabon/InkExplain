import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { gitBlobSha1 } from "../scripts/lib/provenance.mjs";
import { loadRegistry, resolveArchetypeRequest } from "../scripts/lib/registry.mjs";
import { Repository } from "../scripts/lib/repository.mjs";

// Characters taken out of the repository because permission to redistribute them could not be established.
// A name here stays unresolved, so the skill asks instead of guessing, until someone changes this list on purpose.
// The record, and how to bring a character back, is docs/provenance.md#withdrawn-characters.
const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const repo = new Repository(REPO_ROOT);

const han = (...codePoints) => String.fromCodePoint(...codePoints);

const SEAL = {
  id: "seal",
  // The Chinese names are spelled from code points, so this English-default file holds no Han script (LANG-001).
  names: [
    "Seal",
    "hoodie seal",
    "white seal",
    "blue hoodie seal",
    han(0x6d77, 0x8c79),
    han(0x8fde, 0x5e3d, 0x886b, 0x6d77, 0x8c79),
    han(0x767d, 0x8272, 0x6d77, 0x8c79),
    han(0x84dd, 0x8272, 0x8fde, 0x5e3d, 0x886b, 0x6d77, 0x8c79),
    "Sealos",
    "Sealos mascot",
  ],
  folders: ["skills/inkexplain/references/archetypes/seal", "examples/gallery/en/seal", "examples/gallery/zh/seal"],
  // The git blob hash of each of the 16 gallery images that were withdrawn, so a renamed copy is found too.
  imageBlobs: [
    "323ba8b1b490b3f8ee453fe51577858232c3a44f",
    "bffc6898dc989db41a81d7042ba4ded50238df12",
    "c3bf792e9087e69d613969f6974b9b5e858383fb",
    "3ff2951f332d3714424e0097a40f6383eaf9003b",
    "b6adffd74d160eb537d35ad67afea3f79bdec1e2",
    "268e1f6dd948f108687732e798c3b211f0b9c23c",
    "816d238ebc37d4577b5f99bc8e5f3e6c49bf753f",
    "e3ce64e6162831fe461e8bfc3aebdfdcd9efc6c7",
    "1cbb89582781f5f0a08c5deff5e420814f975984",
    "ac2554dad9f8b4b496789a17fe8f7027c2f5965a",
    "fe756fde427aa10f93703b6370d6545741ad51f3",
    "470416121c45a2c4397e1a26dc8c35292c2cbfca",
    "bffc913d8c4485d3368ed9992aa88a1bcaf7e363",
    "33eceaa05ae85badb198ace1a766b36151a1d487",
    "3400e6aeec256b677060653cfa2fe1893c79379c",
    "ff45c2da4cbb3f43897a00fcaedc52564643eb71",
  ],
};

test("withdrawn characters stay withdrawn: Seal is not in the registry, and none of its names selects an archetype", () => {
  const { registry } = loadRegistry(repo);
  assert.equal(registry.byId.has(SEAL.id), false, "the registry has no seal entry");
  for (const name of SEAL.names) {
    const result = resolveArchetypeRequest(registry, [name]);
    assert.equal(result.mode, "unresolved", `${name} must make the agent ask, not pick a character`);
    assert.deepEqual(result.archetypes, [], `${name} selects nothing, the default included`);
    assert.equal(result.unknown[0].name, name);
  }
  // A withdrawn name next to a real one still stops the request: the agent asks about the unknown part.
  assert.equal(resolveArchetypeRequest(registry, ["Ferris", "Seal"]).mode, "unresolved");
});

test("withdrawn characters stay withdrawn: no pack, no gallery folder, and none of the original images under any name", () => {
  for (const folder of SEAL.folders) assert.equal(repo.exists(folder), false, `${folder} must not exist`);
  const withdrawn = new Set(SEAL.imageBlobs);
  const images = repo.walk().filter((file) => file.toLowerCase().endsWith(".png"));
  assert.ok(images.length > 0, "the repository has images to look through");
  for (const file of images) {
    assert.equal(withdrawn.has(gitBlobSha1(repo.readBuffer(file))), false, `${file} is one of the withdrawn Seal images (docs/provenance.md#withdrawn-characters)`);
  }
});

test("withdrawn characters stay withdrawn: the installed skill, the gallery, and the READMEs do not offer Seal or name Sealos", () => {
  const surfaces = repo
    .textFiles()
    .filter((file) => /^(?:skills\/inkexplain|examples|readmes)\//.test(file) || ["README.md", "ATTRIBUTIONS.md", "SECURITY.md", "AGENTS.md", "CONTRIBUTING.md"].includes(file));
  assert.ok(surfaces.length > 20, "the surfaces were found");
  for (const file of surfaces) {
    const found = new RegExp(`sealos|hoodie seal|${han(0x6d77, 0x8c79)}`, "i").exec(repo.readText(file));
    assert.equal(found, null, `${file} mentions ${found?.[0]}: Seal is withdrawn, and only docs/provenance.md, the evaluation record, and the release checklist may say why`);
  }
});
