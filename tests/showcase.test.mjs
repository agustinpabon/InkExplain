import assert from "node:assert/strict";
import crypto from "node:crypto";
import path from "node:path";
import test from "node:test";
import { Repository } from "../scripts/lib/repository.mjs";

// README showcase renders live in assets/examples/. They are not approved gallery samples, so the sample
// gate does not apply, but each one must be a real file that the page next to it names, with its hash, so a
// swapped or invented image is caught.
const repo = new Repository(path.resolve(import.meta.dirname, ".."));
const manifest = repo.readText("assets/examples/README.md");

test("every showcase image is listed with the tool that made it and a matching hash prefix", () => {
  const images = repo.walk().filter((file) => file.startsWith("assets/examples/") && file.endsWith(".png"));
  assert.ok(images.length > 0);
  for (const file of images) {
    const name = file.slice("assets/examples/".length);
    const row = manifest.split("\n").find((line) => line.includes(`\`${name}\``));
    assert.ok(row, `${name} is listed in assets/examples/README.md`);
    assert.match(row, /Codex Desktop|Cursor|connected image tool|downscale of/, `${name} names the tool that made it, or the render it was scaled from`);
    const hash = crypto.createHash("sha256").update(repo.readBuffer(file)).digest("hex").slice(0, 16).toUpperCase();
    assert.ok(row.includes(hash), `${name} matches the recorded hash ${hash}`);
  }
});

test("the README says the showcase renders are unscored first tries", () => {
  assert.match(repo.readText("README.md"), /first tries, not scored with the \[review protocol\]/);
  assert.match(manifest, /carry no review/);
});
