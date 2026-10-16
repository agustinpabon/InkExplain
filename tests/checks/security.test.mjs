// Secret-shaped strings and machine paths are assembled at runtime so this
// file never contains a literal that the scanners would (rightly) flag.

import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createFixture, messages } from "../helpers/fixture.mjs";

const fakeGithubToken = ["gh", "p_", "A".repeat(36)].join("");
const fakePrivateKey = ["-----BEGIN ", "RSA PRIVATE KEY-----"].join("");
const fakeMacPath = ["", "Users", "someone", "Downloads", "logo.jpg"].join("/");
const fakeWindowsPath = ["C:", "Users", "someone", "file.png"].join("\\");

test("a valid fixture passes every security check", (t) => {
  const fixture = createFixture(t);
  for (const result of fixture.run({ only: ["SEC"] })) assert.equal(result.status, "pass", `${result.id}\n${messages(result)}`);
});

test("SEC-001 reports credential-shaped strings without echoing them", (t) => {
  const fixture = createFixture(t).append("docs/language-policy.md", `\ntoken=${fakeGithubToken}\n${fakePrivateKey}\n`);
  const result = fixture.check("SEC-001");
  const text = messages(result);
  assert.match(text, /possible GitHub token/);
  assert.match(text, /possible private key block/);
  assert.ok(!text.includes(fakeGithubToken), "the secret value must not be printed");
});

test("SEC-002 reports absolute paths from a local machine", (t) => {
  const fixture = createFixture(t).append("ATTRIBUTIONS.md", `\nFrom ${fakeMacPath} and ${fakeWindowsPath}.\n`);
  const result = fixture.check("SEC-002");
  assert.equal(result.issues.length, 1, "one line, one finding");
  assert.match(messages(result), /^ATTRIBUTIONS\.md:\d+: machine-specific path/m);
});

test("SEC-002 ignores home-relative and placeholder paths", (t) => {
  const fixture = createFixture(t).append("README.md", "\nInstall to `~/.codex/skills` or `${CODEX_HOME:-$HOME/.codex}/skills`.\n");
  assert.equal(fixture.check("SEC-002").status, "pass");
});

test("SEC-003 reports symbolic links anywhere in the repository", (t) => {
  const fixture = createFixture(t);
  try {
    fs.symlinkSync(fixture.path("docs"), fixture.path("docs-link"), "junction");
  } catch (error) {
    t.skip(`symlinks unavailable: ${error.code}`);
    return;
  }
  assert.match(messages(fixture.check("SEC-003")), /docs-link: symbolic links/);
});

test("SEC-005 fails when package.json declares dependencies of any kind", (t) => {
  const fixture = createFixture(t);
  assert.equal(fixture.check("SEC-005").status, "pass");
  for (const field of ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    fixture.write("package.json", JSON.stringify({ name: "inkexplain", private: true, [field]: { "left-pad": "^1.3.0" } }));
    assert.match(messages(fixture.check("SEC-005")), new RegExp(`package\\.json: ${field} must stay empty`), field);
  }
  for (const field of ["bundleDependencies", "bundledDependencies"]) {
    fixture.write("package.json", JSON.stringify({ name: "inkexplain", [field]: ["left-pad"] }));
    assert.match(messages(fixture.check("SEC-005")), new RegExp(`${field} must stay empty`), field);
  }
});

test("SEC-005 accepts empty dependency fields and leaves unreadable manifests to BRAND-002", (t) => {
  const fixture = createFixture(t).write("package.json", JSON.stringify({ name: "inkexplain", dependencies: {}, devDependencies: {}, bundleDependencies: [] }));
  assert.equal(fixture.check("SEC-005").status, "pass");
  fixture.write("package.json", "{");
  assert.equal(fixture.check("SEC-005").status, "pass");
  fixture.remove("package.json");
  assert.equal(fixture.check("SEC-005").status, "pass");
});

const GALLERY = "examples/gallery/index.html";
const CSP = "default-src 'none'; img-src 'self' file: data:; style-src 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'";

test("SEC-006 accepts the offline gallery and ignores a repository without one", (t) => {
  const fixture = createFixture(t);
  assert.equal(fixture.check("SEC-006").status, "pass");
  assert.match(fixture.read(GALLERY), /Content-Security-Policy/);
  fixture.remove(GALLERY);
  assert.equal(fixture.check("SEC-006").status, "pass", "DOC-003 reports a missing page");
});

test("SEC-006 requires a policy that blocks the network", (t) => {
  const fixture = createFixture(t);
  fixture.replace(GALLERY, /<meta http-equiv[^>]*>\n/.exec(fixture.read(GALLERY))[0], "");
  assert.match(messages(fixture.check("SEC-006")), /has no Content-Security-Policy meta tag/);

  fixture.write(GALLERY, fixture.read(GALLERY).replace("<title>", `<meta http-equiv="Content-Security-Policy" content="default-src https:; img-src 'self'">\n<title>`));
  const loose = messages(fixture.check("SEC-006"));
  assert.match(loose, /default-src must be 'none'/);
  assert.match(loose, /allows "https:" in default-src/);

  fixture.write(GALLERY, fixture.read(GALLERY).replace(/<meta http-equiv[^>]*>\n/, `<meta http-equiv="Content-Security-Policy" content="${CSP}; connect-src https://example.com; script-src 'self' 'unsafe-eval'">\n`));
  const connect = messages(fixture.check("SEC-006"));
  assert.match(connect, /allows "https:\/\/example\.com" in connect-src/);
  assert.match(connect, /allows "'unsafe-eval'" in script-src/);
});

test("SEC-006 rejects remote resources, forms, and frames", (t) => {
  const cases = [
    ['<script src="https://cdn.example.com/lib.js"></script>', /an external script/],
    ['<script src="app.js"></script>', /an external script/],
    ['<link rel="stylesheet" href="https://fonts.example.com/css">', /points at the network: https:\/\/fonts\.example\.com\/css/],
    ['<link rel="stylesheet" href="//fonts.example.com/css">', /points at the network: \/\/fonts\.example\.com\/css/],
    ['<img src="http://example.com/pixel.png" alt="">', /points at the network: http:\/\/example\.com\/pixel\.png/],
    ['<a href="https://example.com">out</a>', /points at the network/],
    ["<style>@import url(styles.css);</style>", /a CSS @import/],
    ["<style>body{background:url(https://example.com/a.png)}</style>", /a CSS url\(\) that points at the network/],
    ['<iframe src="about:blank"></iframe>', /a frame, object, or embed/],
    ['<form action="x"></form>', /a form/],
    ['<base href="/">', /a base element/],
    ['<meta http-equiv="refresh" content="0;url=index.html">', /a refresh redirect/],
  ];
  for (const [markup, expected] of cases) {
    const fixture = createFixture(t);
    fixture.write(GALLERY, fixture.read(GALLERY).replace("</body>", `${markup}\n</body>`));
    assert.match(messages(fixture.check("SEC-006")), expected, markup);
  }
});

test("SEC-006 rejects network and dynamic-code APIs in the page script", (t) => {
  const cases = [
    ['fetch("/data.json")', /network access/],
    ["new XMLHttpRequest()", /network access/],
    ['new WebSocket("wss://example.com")', /network access/],
    ['navigator.sendBeacon("/log", "x")', /network access/],
    ['new Worker("w.js")', /a worker or service worker/],
    ["eval(code)", /dynamic code evaluation/],
    ["new Function(code)", /dynamic code evaluation/],
    ['import("./module.js")', /dynamic code evaluation/],
    ["node.innerHTML = value", /HTML built from strings/],
    ['document.write("<b>x</b>")', /HTML built from strings/],
  ];
  for (const [code, expected] of cases) {
    const fixture = createFixture(t);
    // The page script is the last <script>; the first closes the generated data block.
    const html = fixture.read(GALLERY);
    const end = html.lastIndexOf("</script>");
    fixture.write(GALLERY, `${html.slice(0, end)};${code}${html.slice(end)}`);
    assert.match(messages(fixture.check("SEC-006")), expected, code);
  }
});

test("SEC-006 keeps the generated data block inert", (t) => {
  const fixture = createFixture(t);
  assert.match(fixture.read(GALLERY), /<script type="application\/json" id="inkexplain-data">/);
  fixture.write(GALLERY, fixture.read(GALLERY).replace(/<script type="application\/json"[\s\S]*?<\/script>/, '<script type="application/json" id="inkexplain-data">{"a":"</script><script>x()</script>"}</script>'));
  assert.match(messages(fixture.check("SEC-006")), /generated data block must be one JSON script with no raw "<"/);
  fixture.write(GALLERY, fixture.read(GALLERY).replace(/<!-- inkexplain:gallery-data:start -->[\s\S]*<!-- inkexplain:gallery-data:end -->/, "<!-- inkexplain:gallery-data:start -->\n<script>steal()</script>\n<!-- inkexplain:gallery-data:end -->"));
  assert.match(messages(fixture.check("SEC-006")), /generated data block must be one JSON script/);
});

test("SEC-004 keeps repository scripts offline and shell-free", (t) => {
  const fixture = createFixture(t);
  fixture.write("scripts/tool.mjs", ["import { execSync } from \"node:child_process\";", "await fetch(\"https://example.com\");", "// fetch( in a comment is fine", ""].join("\n"));
  const text = messages(fixture.check("SEC-004"));
  assert.match(text, /scripts\/tool\.mjs:1: child process execution/);
  assert.match(text, /scripts\/tool\.mjs:2: network access/);
  assert.doesNotMatch(text, /:3:/);
});
