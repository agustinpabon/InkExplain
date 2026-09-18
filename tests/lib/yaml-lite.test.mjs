import assert from "node:assert/strict";
import test from "node:test";
import { getPath, parseYaml } from "../../scripts/lib/yaml-lite.mjs";

test("parses nested mappings with typed scalars", () => {
  const { value, errors } = parseYaml(
    'interface:\n  display_name: "InkExplain"\n  count: 3\n  ratio: 1.5\npolicy:\n  allow_implicit_invocation: true\n  empty:\n',
  );
  assert.deepEqual(errors, []);
  assert.equal(getPath(value, "interface.display_name"), "InkExplain");
  assert.equal(getPath(value, "interface.count"), 3);
  assert.equal(getPath(value, "interface.ratio"), 1.5);
  assert.equal(getPath(value, "policy.allow_implicit_invocation"), true);
  assert.equal(getPath(value, "policy.empty"), null);
});

test("handles double- and single-quoted strings with escapes", () => {
  const { value, errors } = parseYaml(`a: "say \\"hi\\"\\nnext"\nb: 'it''s: fine'\nc: plain text # comment\n`);
  assert.deepEqual(errors, []);
  assert.equal(value.a, 'say "hi"\nnext');
  assert.equal(value.b, "it's: fine");
  assert.equal(value.c, "plain text");
});

test("parses literal and folded block scalars with chomping", () => {
  const { value, errors } = parseYaml("lit: |\n  one\n  two\nfold: >-\n  one\n  two\n\n  three\nkeep: |+\n  x\n\nend: 1\n");
  assert.deepEqual(errors, []);
  assert.equal(value.lit, "one\ntwo\n");
  assert.equal(value.fold, "one two\nthree");
  assert.equal(value.keep, "x\n\n");
  assert.equal(value.end, 1);
});

test("parses sequences of scalars", () => {
  const { value, errors } = parseYaml("tools:\n  - one\n  - \"two\"\n");
  assert.deepEqual(errors, []);
  assert.deepEqual(value.tools, ["one", "two"]);
});

test("reports YAML that strict loaders reject, with line numbers", () => {
  const cases = [
    ["a: b: c\n", /plain values cannot contain/],
    ["a: 1\na: 2\n", /duplicate key/],
    ["a:\n\tb: 1\n", /tabs/],
    ['a: "unterminated\n', /unterminated/],
    ["a: [1, 2]\n", /unsupported YAML syntax/],
    ["a: &anchor x\n", /unsupported YAML syntax/],
    ["  a: 1\n", /must not be indented/],
    ["a: 1\n  b: 2\n", /unexpected indentation/],
    ["- item\n", /sequence item where a key was expected/],
  ];
  for (const [text, pattern] of cases) {
    const { errors } = parseYaml(text);
    assert.ok(errors.some((error) => pattern.test(error.message)), `${JSON.stringify(text)} -> ${JSON.stringify(errors)}`);
    assert.ok(errors.every((error) => Number.isInteger(error.line) && error.line >= 1));
  }
});

test("accepts CRLF input", () => {
  const { value, errors } = parseYaml("a: 1\r\nb:\r\n  c: two\r\n");
  assert.deepEqual(errors, []);
  assert.deepEqual(value, { a: 1, b: { c: "two" } });
});
