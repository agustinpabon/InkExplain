import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { Repository } from "../scripts/lib/repository.mjs";

// How a person reaches the maintainer privately. The channels are GitHub's own, because a mailbox is a
// channel only while someone has confirmed that it receives mail: the domain this repository used to name
// had no DNS records at all (checked on 2026-10-17 against two public resolvers), so a report sent there
// would have vanished. Add an address back only after it has been confirmed to deliver and to be read, and
// change this test in the same commit.
const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const repo = new Repository(REPO_ROOT);

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/;
const CHANNEL_FILES = ["SECURITY.md", "CODE_OF_CONDUCT.md", ".github/ISSUE_TEMPLATE/config.yml"];
const ADVISORY_FORM = "https://github.com/agustinpabon/InkExplain/security/advisories/new";

test("private reports go through GitHub, and no file that explains how to report names a mailbox", () => {
  for (const file of CHANNEL_FILES) {
    const match = EMAIL.exec(repo.readText(file));
    assert.equal(match, null, `${file} names an address (${match?.[0]}): none has been confirmed to receive mail`);
  }
});

test("the security policy and the code of conduct both say how to use the private report form", () => {
  for (const file of ["SECURITY.md", "CODE_OF_CONDUCT.md"]) {
    const text = repo.readText(file);
    assert.match(text, /\*\*Security\*\* tab/, `${file} names the Security tab`);
    assert.match(text, /\*\*Report a vulnerability\*\*/, `${file} names the button`);
    assert.match(text, /issue titled "(Security|Conduct) report"/, `${file} says what to do when the form is not available`);
  }
});

test("a fallback report asks for a private channel without putting details in a public issue", () => {
  const policy = repo.readText("SECURITY.md");
  assert.match(policy, /no details, no proof of concept, and no file names/);
  assert.match(repo.readText("CODE_OF_CONDUCT.md"), /contains no details and asks for a private way to continue/);
});

test("the issue chooser links to the repository's private advisory form", () => {
  const config = repo.readText(".github/ISSUE_TEMPLATE/config.yml");
  assert.ok(config.includes(ADVISORY_FORM), "the chooser offers the advisory form");
  assert.match(config, /blank_issues_enabled: false/);
});
