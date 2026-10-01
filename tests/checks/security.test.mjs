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

test("SEC-004 keeps repository scripts offline and shell-free", (t) => {
  const fixture = createFixture(t);
  fixture.write("scripts/tool.mjs", ["import { execSync } from \"node:child_process\";", "await fetch(\"https://example.com\");", "// fetch( in a comment is fine", ""].join("\n"));
  const text = messages(fixture.check("SEC-004"));
  assert.match(text, /scripts\/tool\.mjs:1: child process execution/);
  assert.match(text, /scripts\/tool\.mjs:2: network access/);
  assert.doesNotMatch(text, /:3:/);
});

// [stage] test(checks/security): assert offline check detects fetch and http imports
