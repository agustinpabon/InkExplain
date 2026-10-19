import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { main } from "../scripts/audit-series.mjs";
import { auditSeries, characterParagraphs, imageToolCalls } from "../scripts/lib/series-audit.mjs";

// The character lock says what every image call of a series must carry. A report that says "the reference was
// attached to every call" is a claim, and the calls are the evidence, so these tests read calls in the shapes a real
// Codex session writes them (agent code inside a tool call, with values held in variables and paths built from a
// workspace folder) and check each rule.
const REFERENCE = "references/archetypes/xiaohei/xiaohei.png";
const PACKAGED = "/opt/agent/skills/inkexplain/references/archetypes/xiaohei/xiaohei.png";

/** One rollout line holding a piece of agent code, the way Codex records it. */
const code = (source) => JSON.stringify({ timestamp: "2026-10-18T22:00:00.000Z", type: "response_item", payload: { type: "custom_tool_call", name: "exec", input: source } });
const rollout = (...sources) => `${sources.map(code).join("\n")}\n`;
const call = (arguments_) => `const result = await tools.image_gen__imagegen(${arguments_});\nstore("result", result);\n`;

const audit = (calls, options) => auditSeries(calls, { reference: REFERENCE, ...options });
const result = (report, id) => report.results.find((entry) => entry.id === id);
const knownPaths = (calls) => calls.map((entry) => entry.references?.map((reference) => reference.known) ?? null);

test("a series that attached the packaged reference to every call passes, with the path held in a variable", () => {
  const log = rollout(
    `const ref = "${PACKAGED}";\nconst shots = load("shots");\n`,
    `// @exec: {"yield_time_ms": 120000}\n${call("{prompt: shots[0].prompt, referenced_image_paths: [ref]}")}`,
    call("{prompt: shots[1].prompt, referenced_image_paths: [ref], transparent_background: false}"),
    call(`{prompt: shots[2].prompt, referenced_image_paths: ["${PACKAGED}"]}`),
  );
  const calls = imageToolCalls(log);
  assert.equal(calls.length, 3);
  assert.deepEqual(knownPaths(calls), [[PACKAGED], [PACKAGED], [PACKAGED]]);
  assert.deepEqual(calls[1].keys, ["prompt", "referenced_image_paths", "transparent_background"]);
  const report = audit(calls);
  assert.equal(report.ok, true, JSON.stringify(report.results));
  assert.deepEqual(
    Object.fromEntries(report.results.map((entry) => [entry.id, entry.status])),
    { CALLS: "pass", VISIBLE: "pass", "NO-LAST-IMAGES": "pass", "NO-RENDER": "pass", ATTACHED: "pass", "SAME-FILE": "pass", PACKAGED: "pass", "SAME-CHARACTER": "skip" },
  );
});

test("a path built from a workspace folder and a literal end is read by its end, as real runs write it", () => {
  const tail = ".agents/skills/inkexplain/references/archetypes/xiaohei/xiaohei.png";
  const log = rollout(
    `const workspace = load("workspace");\n${call(`{prompt: a, referenced_image_paths: [load("workspace") + "/${tail}"], transparent_background: false}`)}`,
    call("{prompt: b, referenced_image_paths: [workspace + `/" + tail + "`]}"),
    call("{prompt: c, referenced_image_paths: [`${load('workspace')}/" + tail + "`]}"),
  );
  const calls = imageToolCalls(log);
  assert.deepEqual(calls.map((entry) => entry.references.map((reference) => [reference.known, reference.complete])), [[[`/${tail}`, false]], [[`/${tail}`, false]], [[`/${tail}`, false]]]);
  const report = audit(calls);
  assert.equal(report.ok, true, JSON.stringify(report.results));
  assert.equal(result(report, "VISIBLE").status, "pass");
  assert.equal(result(report, "SAME-FILE").status, "pass");
  assert.equal(result(report, "PACKAGED").status, "pass");
  // A computed end names nothing, so it is not read.
  assert.equal(audit(imageToolCalls(rollout(call("{prompt: a, referenced_image_paths: [load('workspace') + suffix]}")))).ok, false);
});

test("a reference path kept in Codex's store is followed through load(), at the value it had when the call ran", () => {
  const tail = ".agents/skills/inkexplain/references/archetypes/xiaohei/xiaohei.png";
  const keep = `store("root", "/opt/agent/project");\nstore("reference", load("root") + "/${tail}");\n`;
  const clean = imageToolCalls(rollout(
    keep,
    call(`{prompt: load("shots")[0].prompt, referenced_image_paths: [load("reference")], transparent_background: false}`),
    call(`{prompt: load("shots")[1].prompt, referenced_image_paths: [load("reference")], transparent_background: false}`),
  ));
  assert.deepEqual(knownPaths(clean), [[`/opt/agent/project/${tail}`], [`/opt/agent/project/${tail}`]]);
  const cleanReport = audit(clean);
  assert.equal(cleanReport.ok, true, JSON.stringify(cleanReport.results));
  assert.equal(result(cleanReport, "SAME-FILE").detail, `one file: /opt/agent/project/${tail}`);

  // A later store changes what load() returns for the calls that follow it, and the calls before it keep their value.
  const swapped = imageToolCalls(rollout(
    keep,
    call(`{prompt: a, referenced_image_paths: [load("reference")]}`),
    `store("reference", "/opt/agent/project/assets/x-xiaohei/01-a.png");\n`,
    call(`{prompt: b, referenced_image_paths: [load("reference")]}`),
  ));
  assert.deepEqual(knownPaths(swapped), [[`/opt/agent/project/${tail}`], ["/opt/agent/project/assets/x-xiaohei/01-a.png"]]);
  const swappedReport = audit(swapped);
  assert.equal(swappedReport.ok, false);
  assert.equal(result(swappedReport, "NO-RENDER").status, "fail");
  assert.equal(result(swappedReport, "SAME-FILE").status, "fail");

  // A name that was never stored, or a store in a comment, names nothing, so nothing is claimed.
  const unknown = audit(imageToolCalls(rollout(`// store("reference", "${PACKAGED}");\n`, call(`{prompt: a, referenced_image_paths: [load("reference")]}`))));
  assert.equal(unknown.ok, false);
  assert.equal(result(unknown, "VISIBLE").status, "fail");
  assert.match(result(unknown, "VISIBLE").detail, /call 1: the reference paths/);
});

test("an Antigravity transcript is read: its generate_image calls, with every argument written as JSON text", () => {
  const line = (entry) => JSON.stringify({ source: "MODEL", type: "PLANNER_RESPONSE", status: "DONE", created_at: "2026-10-19T04:15:53Z", ...entry });
  const generate = (step, args) => line({ step_index: step, tool_calls: [{ name: "generate_image", args: { AspectRatio: '"16:9"', ImageName: '"xiaohei_one"', Prompt: JSON.stringify("Generate one standalone 16:9 illustration."), toolAction: '"Generating image"', ...args } }] });
  const transcript = [
    line({ step_index: 1, tool_calls: [{ name: "run_command", args: { CommandLine: '"Get-ChildItem assets"' } }] }),
    line({ step_index: 2, type: "GENERIC", content: "a tool result that is not a call" }),
    generate(3, { ImagePaths: JSON.stringify([PACKAGED]) }),
    generate(4, {}),
  ].join("\n");
  const calls = imageToolCalls(transcript);
  assert.equal(calls.length, 2, "only the image calls count, not run_command");
  assert.deepEqual(knownPaths(calls), [[PACKAGED], null]);
  assert.deepEqual(calls[0].keys, ["AspectRatio", "ImageName", "Prompt", "toolAction", "ImagePaths"]);
  assert.equal(calls[0].prompt, "Generate one standalone 16:9 illustration.", "a value written as JSON text is decoded");
  const alone = audit(imageToolCalls(generate(3, { ImagePaths: JSON.stringify([PACKAGED]) })));
  assert.equal(alone.ok, true, JSON.stringify(alone.results));
  const report = audit(calls);
  assert.equal(report.ok, false);
  assert.match(result(report, "ATTACHED").detail, /call 2 passed no reference/);
  // The same call with its reference list under the name Codex or Cursor would use is read the same way.
  const named = imageToolCalls(JSON.stringify([{ description: "d", reference_image_paths: [PACKAGED] }, { prompt: "p", referenced_image_paths: [PACKAGED] }]));
  assert.deepEqual(knownPaths(named), [[PACKAGED], [PACKAGED]]);
});

test("a call that passes no reference is found, and a series whose first call has one is not rescued by it", () => {
  const calls = imageToolCalls(rollout(
    `const ref = "${PACKAGED}";\n${call("{prompt: p1, referenced_image_paths: [ref]}")}`,
    call("{prompt: p2}"),
    call("{prompt: p3, referenced_image_paths: [ref]}"),
  ));
  const report = audit(calls);
  assert.equal(report.ok, false);
  assert.equal(result(report, "ATTACHED").status, "fail");
  assert.match(result(report, "ATTACHED").detail, /call 2 passed no reference/);
  assert.equal(result(report, "SAME-FILE").status, "fail");
  assert.match(result(report, "PACKAGED").detail, /call 2 attached nothing/);
});

test("a render is never the identity reference; one attached after it is a note, because a label repair edits a render", () => {
  const render = "/opt/agent/.codex/generated_images/01a1/exec-5858ac15.png";
  const saved = "/opt/agent/project/assets/repo-xiaohei/01-system-overview.png";
  for (const bad of [render, saved]) {
    const alone = audit(imageToolCalls(rollout(call(`{prompt: p, referenced_image_paths: ["${bad}"]}`))));
    assert.equal(result(alone, "NO-RENDER").status, "fail", bad);
    assert.equal(alone.ok, false);
    const first = audit(imageToolCalls(rollout(call(`{prompt: p, referenced_image_paths: ["${bad}", "${PACKAGED}"]}`))));
    assert.equal(result(first, "NO-RENDER").status, "fail", `${bad} as the first image stands in for the reference`);

    const after = audit(imageToolCalls(rollout(call(`{prompt: p, referenced_image_paths: ["${PACKAGED}", "${bad}"]}`))));
    assert.equal(result(after, "NO-RENDER").status, "pass");
    assert.equal(result(after, "SAME-FILE").status, "pass");
    assert.equal(result(after, "EXTRA-IMAGES").status, "note");
    assert.match(result(after, "EXTRA-IMAGES").detail, /call 1 also attached/);
    assert.match(result(after, "EXTRA-IMAGES").detail, /an identity repair must regenerate from the reference alone/);
    assert.equal(after.ok, true, "a note does not fail the audit");
  }
});

test("selecting recent conversation images fails, because that carries earlier renders into the next image", () => {
  const calls = imageToolCalls(rollout(call(`{prompt: p, num_last_images_to_include: 1}`), call(`{prompt: q, referenced_image_paths: ["${PACKAGED}"]}`)));
  assert.deepEqual(calls.map((entry) => entry.lastImages), [1, null]);
  const report = audit(calls);
  assert.equal(result(report, "NO-LAST-IMAGES").status, "fail");
  assert.match(result(report, "NO-LAST-IMAGES").detail, /call 1 used num_last_images_to_include/);
  assert.equal(report.ok, false);
});

test("a different first image in a later call, or one that is not the packaged file, fails", () => {
  const other = "/opt/agent/pictures/my-xiaohei.png";
  const drift = audit(imageToolCalls(rollout(call(`{prompt: a, referenced_image_paths: ["${PACKAGED}"]}`), call(`{prompt: b, referenced_image_paths: ["${other}"]}`))));
  assert.equal(result(drift, "SAME-FILE").status, "fail");
  assert.match(result(drift, "SAME-FILE").detail, /2 different first images/);
  assert.match(result(drift, "PACKAGED").detail, /call 2: \/opt\/agent\/pictures\/my-xiaohei\.png/);
  // The documented fallback, a copy of the reference in the workspace, is still the reference.
  const copy = "/opt/agent/project/assets/repo-xiaohei/identity-reference.png";
  assert.equal(result(audit(imageToolCalls(rollout(call(`{prompt: a, referenced_image_paths: ["${copy}"]}`)))), "PACKAGED").status, "pass");
});

test("a value the code computes cannot be read, so the audit says so and claims nothing", () => {
  const calls = imageToolCalls(rollout(`const base = process.env.SKILL;\n${call("{prompt: p, referenced_image_paths: [path.join(base, 'xiaohei.png')]}")}`, call("{...options}")));
  const report = audit(calls);
  assert.equal(result(report, "VISIBLE").status, "fail");
  assert.match(result(report, "VISIBLE").detail, /call 1: the reference paths/);
  assert.match(result(report, "VISIBLE").detail, /call 2: a spread/);
  assert.equal(report.ok, false);
});

test("a call that is only mentioned in a comment is not a call, and strings and brackets in a prompt do not confuse the reading", () => {
  const log = rollout(`// next: await tools.image_gen__imagegen({prompt: "not run", referenced_image_paths: ["x.png"]});\n/* tools.image_gen__imagegen({prompt: "not run either"}) */\n${call(`{prompt: "Character: (a dome) [with] {braces}, \\"quotes\\" and a // slash", referenced_image_paths: ["${PACKAGED}"]}`)}`);
  const calls = imageToolCalls(log);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].prompt, 'Character: (a dome) [with] {braces}, "quotes" and a // slash');
  assert.deepEqual(knownPaths(calls), [[PACKAGED]]);
});

test("a call written as a direct function call, and a plain JSON list of calls from another host, are read the same way", () => {
  const direct = `${JSON.stringify({ type: "response_item", payload: { type: "function_call", name: "image_gen__imagegen", arguments: JSON.stringify({ prompt: "p", referenced_image_paths: [PACKAGED] }) } })}\n`;
  assert.deepEqual(knownPaths(imageToolCalls(direct)), [[PACKAGED]]);
  const list = JSON.stringify([{ prompt: "a", referenced_image_paths: [PACKAGED] }, { prompt: "b", referenced_image_paths: [PACKAGED] }], null, 2);
  assert.equal(audit(imageToolCalls(list)).ok, true);
  // A tool that names its reference list reference_image_paths and its prompt description is read the same way.
  const cursorStyle = imageToolCalls(JSON.stringify([{ description: "a", reference_image_paths: [PACKAGED] }, { description: "b", reference_image_paths: [PACKAGED] }]));
  assert.deepEqual(cursorStyle.map((entry) => entry.prompt), ["a", "b"]);
  assert.equal(audit(cursorStyle).ok, true);
  assert.equal(audit(imageToolCalls(JSON.stringify({ calls: [{ prompt: "a" }] }))).ok, false);
  assert.equal(imageToolCalls("").length, 0, "no calls at all is its own failure");
  assert.equal(audit([]).results[0].status, "fail");
});

test("a text-only series is honest only if it attached nothing", () => {
  const plain = imageToolCalls(rollout(call("{prompt: a}"), call("{prompt: b, transparent_background: false}")));
  assert.equal(audit(plain, { mode: "text-only" }).ok, true);
  const claimed = imageToolCalls(rollout(call(`{prompt: a, referenced_image_paths: ["${PACKAGED}"]}`)));
  const report = audit(claimed, { mode: "text-only" });
  assert.equal(report.ok, false);
  assert.match(result(report, "TEXT-ONLY").detail, /call 1 passed one/);
});

test("every prompt of a series carries the same Character paragraph, read from the saved prompts.md", () => {
  const prompt = (character) => `\`\`\`text\nGenerate one standalone 16:9 horizontal article illustration.\n\nStyle: plain.\n\nCharacter: ${character}\n\nAction: it works.\n\`\`\`\n`;
  const same = `# Prompts\n${prompt("one dome, two dot eyes.")}${prompt("one dome, two dot eyes.")}${prompt("one dome,   two dot eyes.")}`;
  assert.deepEqual(characterParagraphs(same), ["Character: one dome, two dot eyes.", "Character: one dome, two dot eyes.", "Character: one dome, two dot eyes."]);
  const calls = imageToolCalls(rollout(call(`{prompt: a, referenced_image_paths: ["${PACKAGED}"]}`)));
  assert.equal(result(audit(calls, { characterParagraphs: characterParagraphs(same) }), "SAME-CHARACTER").status, "pass");
  const drifted = `${same}${prompt("one dome with two little ears.")}`;
  const verdict = result(audit(calls, { characterParagraphs: characterParagraphs(drifted) }), "SAME-CHARACTER");
  assert.equal(verdict.status, "fail");
  assert.match(verdict.detail, /4 prompts, 2 distinct Character paragraphs/);
  assert.equal(result(audit(calls, { characterParagraphs: [] }), "SAME-CHARACTER").status, "fail", "no prompts found is not a pass");
});

// ---- the command ---------------------------------------------------------------------------------------------

function files(t, contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ie-audit-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [name, text] of Object.entries(contents)) fs.writeFileSync(path.join(dir, name), text);
  return dir;
}
const collect = () => ({ text: "", write(chunk) { this.text += chunk; } });

test("the command exits 0 when no check failed, 1 when one did, and 2 for a usage error or an unreadable file", (t) => {
  const dir = files(t, {
    "good.jsonl": rollout(call(`{prompt: a, referenced_image_paths: ["${PACKAGED}"]}`), call(`{prompt: b, referenced_image_paths: ["${PACKAGED}"]}`)),
    "bad.jsonl": rollout(call("{prompt: a}")),
    "edit.jsonl": rollout(call(`{prompt: a, referenced_image_paths: ["${PACKAGED}", "/opt/agent/project/assets/x-xiaohei/02-a.png"]}`)),
  });
  const run = (...argv) => {
    const out = collect();
    const err = collect();
    return { code: main(argv, out, err), out: out.text, err: err.text };
  };
  const good = run("--reference", REFERENCE, path.join(dir, "good.jsonl"));
  assert.equal(good.code, 0, good.out);
  assert.match(good.out, /^PASS {2}CALLS {10}the run called the image tool: 2 calls found/m);
  assert.match(good.out, /No check failed\./);

  const note = run("--reference", REFERENCE, path.join(dir, "edit.jsonl"));
  assert.equal(note.code, 0, "a note is shown and does not fail");
  assert.match(note.out, /^NOTE {2}EXTRA-IMAGES {3}images attached after the reference: call 1 also attached/m);

  const bad = run("--reference", REFERENCE, path.join(dir, "bad.jsonl"));
  assert.equal(bad.code, 1);
  assert.match(bad.out, /^FAIL {2}ATTACHED {7}the reference is attached to every call: call 1 passed no reference/m);
  assert.match(bad.out, /Some check failed/);

  assert.equal(run("--mode", "text-only", path.join(dir, "bad.jsonl")).code, 0, "the same log is honest as a text-only series");
  assert.equal(JSON.parse(run("--json", "--reference", REFERENCE, path.join(dir, "good.jsonl")).out).ok, true);
  assert.equal(run().code, 2);
  assert.equal(run("--mode", "sideways", path.join(dir, "good.jsonl")).code, 2);
  assert.equal(run("--bogus", path.join(dir, "good.jsonl")).code, 2);
  assert.equal(run(path.join(dir, "missing.jsonl")).code, 2);
  assert.equal(run("--help").code, 0);
});
