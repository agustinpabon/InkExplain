import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { main } from "../scripts/check-explanation.mjs";
import { checkExplanation, fileReferences } from "../scripts/lib/explanation-check.mjs";

// An explanation of a repository is only as good as the files behind it. The method asks an agent to cite
// `path:line` for each claim and never to invent a path (references/workflow/repository-explanation.md); a real run
// once cited 1-41 for a file of 39 lines. These tests read an explanation against a small checkout and show what is
// found, what is missing, and what runs past the end of its file.
function checkout(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ie-explain-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
    fs.writeFileSync(path.join(root, name), text);
  }
  return root;
}
const lines = (count) => `${Array.from({ length: count }, (_, index) => `line ${index + 1}`).join("\n")}\n`;
const statusOf = (report) => report.results.map((result) => `${result.text}=${result.status}`);

test("file references are the code spans that look like a file and the links to one, and nothing else", () => {
  const found = fileReferences([
    "The server starts in `src/server.ts:10-20` and reads `config/app.json`.",
    "A command `pnpm test`, a route `/api/status`, a setting `PORT`, a dotfile `.env`, a method `OracleRuntime.recalculate` and a type `Foo.bar` are not files, nor is `node_modules/`.",
    "See [the router](../../src/router.ts), [the docs](https://example.com/a/b.md), [an image](shot.png), [a sibling](prompts.md), [an anchor](#top).",
    "| `packages/core/` | the core | `src/index.ts:1-8,40-60`; `../util.ts:3` | `packages/util/` | read |",
  ].join("\n"));
  assert.deepEqual(found.map((reference) => [reference.line, reference.text]), [
    [1, "src/server.ts:10-20"],
    [1, "config/app.json"],
    [3, "../../src/router.ts"],
    [4, "src/index.ts:1-8,40-60"],
    [4, "../util.ts:3"],
  ]);
  assert.deepEqual(found[0].ranges, [[10, 20]]);
  assert.deepEqual(found[3].ranges, [[1, 8], [40, 60]]);
  assert.deepEqual(found[4].ranges, [[3, 3]]);
  assert.equal(found[2].link, true);
  assert.equal(found[3].module, "packages/core", "a table row's first directory is its module");
});

test("a path is read from the root, from its row's module, from the folder of a link, or by its one end", (t) => {
  const root = checkout(t, {
    "src/server.ts": lines(30),
    "packages/core/src/index.ts": lines(60),
    "packages/util/src/helpers.ts": lines(12),
    "packages/util/src/other/helpers.ts": lines(5),
    "docs/guide.md": lines(3),
  });
  const markdown = [
    "Root: `src/server.ts:1-30`.",
    "| Module | Evidence |",
    "| `packages/core/` | `src/index.ts:1-60` |",
    "A link from the explanation's folder: [guide](../../docs/guide.md).",
    "By its end: `other/helpers.ts:1-5`, ambiguous: `helpers.ts:1-2`.",
  ].join("\n");
  const report = checkExplanation(markdown, root, { documentDirectory: "assets/repo-xiaohei" });
  assert.deepEqual(statusOf(report), ["src/server.ts:1-30=found", "src/index.ts:1-60=found", "../../docs/guide.md=found", "other/helpers.ts:1-5=found", "helpers.ts:1-2=ambiguous"]);
  assert.equal(report.results[1].resolved, "packages/core/src/index.ts");
  assert.equal(report.results[2].resolved, "docs/guide.md");
  assert.equal(report.results[3].resolved, "packages/util/src/other/helpers.ts");
  assert.equal(report.results[4].resolved, null, "an ambiguous end names no file");
  assert.deepEqual(report.problems, [], "an ambiguous reference is a warning, not a failure");
  // Without the folder, the same link still resolves once its leading ../ is dropped.
  assert.equal(statusOf(checkExplanation("[guide](../../docs/guide.md)", root)).join(), "../../docs/guide.md=found");
});

test("a file that does not exist, and a range past the end of its file, are the references that fail", (t) => {
  const root = checkout(t, { "src/app.tsx": lines(39), "src/empty.ts": "" });
  const report = checkExplanation(
    ["`src/app.tsx:1-39` is fine, `src/app.tsx:1-41` is not.", "`src/app.tsx:39-39`, `src/app.tsx:0-3`, `src/app.tsx:5-4`.", "`src/missing.ts:1-3` and `src/invented/router.ts`.", "`src/empty.ts:1-1`."].join("\n"),
    root,
  );
  assert.deepEqual(statusOf(report), [
    "src/app.tsx:1-39=found",
    "src/app.tsx:1-41=beyond",
    "src/app.tsx:39-39=found",
    "src/app.tsx:0-3=beyond",
    "src/app.tsx:5-4=beyond",
    "src/missing.ts:1-3=missing",
    "src/invented/router.ts=missing",
    "src/empty.ts:1-1=beyond",
  ]);
  assert.equal(report.results[1].lines, 39, "a file that ends with a newline has 39 lines, not 40");
  assert.equal(report.problems.length, 6);
});

test("the command lists every reference, fails on one that does not resolve, and can require a number of cited files", (t) => {
  const root = checkout(t, { "src/a.ts": lines(10), "src/b.ts": lines(10), "docs/explanation.md": "" });
  const write = (text) => {
    const file = path.join(root, "docs", "explanation.md");
    fs.writeFileSync(file, text);
    return file;
  };
  const run = (...argv) => {
    let out = "";
    let err = "";
    const code = main(argv, { write: (chunk) => (out += chunk) }, { write: (chunk) => (err += chunk) });
    return { code, out, err };
  };

  const good = run("--root", root, write("`src/a.ts:1-10` and `src/b.ts:2-3`."));
  assert.equal(good.code, 0, good.out);
  assert.match(good.out, /^ok {5}src\/a\.ts:1-10 {2}->{1} {2}src\/a\.ts \(10 lines\)$/m);
  assert.match(good.out, /2 references to 2 distinct files in a checkout of 3 files; 0 do not resolve\./);

  const bad = run("--root", root, write("`src/a.ts:1-11`, `src/nope.ts`."));
  assert.equal(bad.code, 1);
  assert.match(bad.out, /^FAIL {3}src\/a\.ts:1-11 {2}->{1} {2}src\/a\.ts has 10 lines \(line 1\)$/m);
  assert.match(bad.out, /^FAIL {3}src\/nope\.ts {2}->{1} {2}no such file in the checkout \(line 1\)$/m);

  const few = run("--root", root, "--min-files", "3", write("`src/a.ts:1-2` and `src/b.ts:1-2`."));
  assert.equal(few.code, 1);
  assert.match(few.out, /Fewer than the 3 files required\./);
  assert.equal(run("--root", root, "--min-files", "2", write("`src/a.ts:1-2` and `src/b.ts:1-2`.")).code, 0);

  // A link is read from the explanation's own folder, which is inside the checkout.
  assert.equal(run("--root", root, write("[a](../src/a.ts)")).code, 0);

  assert.equal(run().code, 2);
  assert.equal(run("--root", root).code, 2);
  assert.equal(run("--root", root, "--min-files", "x", write("`src/a.ts`")).code, 2);
  assert.equal(run("--root", root, path.join(root, "docs", "absent.md")).code, 2);
  assert.equal(run("--help").code, 0);
});
