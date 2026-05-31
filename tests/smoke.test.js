import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(args, cwd = repoRoot) {
  return execFileSync(process.execPath, [path.join(repoRoot, "src", "cli.js"), ...args], {
    cwd,
    encoding: "utf8",
  });
}

function assertRunFails(args, cwd = repoRoot, pattern) {
  let failed = false;
  try {
    run(args, cwd);
  } catch (error) {
    failed = true;
    const output = `${error.stdout ?? ""}${error.stderr ?? ""}`;
    if (pattern) assert.match(output, pattern);
  }
  assert.equal(failed, true, `${args.join(" ")} should fail`);
}

run(["validate"]);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-test-"));
try {
  run(["install", "--target", "project", "--fresh", "--engine", "unity"], tmp);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-cook", "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-unity-base-mcp-skill", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-cocos-base-script-graph", "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "agents", "omg-fullstack-developer.toml")), false);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "agents", "omg-cocos-developer.toml")), false);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "config.toml")), true);
  const agents = fs.readFileSync(path.join(tmp, "AGENTS.md"), "utf8");
  assert.match(agents, /oh-my-game-kit:start/);
  const state = JSON.parse(fs.readFileSync(path.join(tmp, ".oh-my-game-kit", "install-state.json"), "utf8"));
  assert.equal(state.engine, "unity");
  assert.equal(state.preset, "unity-project");
  run(["doctor", "--target", "project"], tmp);
  run(["uninstall", "--target", "project"], tmp);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "agents", "omg-fullstack-developer.toml")), false);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

const cocosTmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-cocos-test-"));
try {
  run(["install", "--target", "project", "--fresh", "--engine", "cocos"], cocosTmp);
  assert.equal(fs.existsSync(path.join(cocosTmp, ".agents", "skills", "omg-cocos-base-script-graph", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(cocosTmp, ".agents", "skills", "omg-cocos-playable-parameter", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(cocosTmp, ".agents", "skills", "omg-cook", "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(cocosTmp, ".agents", "skills", "omg-unity-base-mcp-skill", "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(cocosTmp, ".codex", "agents", "omg-cocos-playable-extractor.toml")), true);
  assert.equal(fs.existsSync(path.join(cocosTmp, ".codex", "agents", "omg-unity-developer.toml")), false);
  run(["doctor", "--target", "project"], cocosTmp);
} finally {
  fs.rmSync(cocosTmp, { recursive: true, force: true });
}

const allTmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-all-test-"));
try {
  run(["install", "--target", "project", "--fresh", "--engine", "all"], allTmp);
  assert.equal(fs.existsSync(path.join(allTmp, ".agents", "skills", "omg-cocos-playable-parameter", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(allTmp, ".agents", "skills", "omg-unity-base-mcp-skill", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(allTmp, ".agents", "skills", "omg-cook", "SKILL.md")), false);
} finally {
  fs.rmSync(allTmp, { recursive: true, force: true });
}

const presetTmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-preset-test-"));
try {
  run(["install", "--target", "project", "--fresh", "--preset", "cocos-playable"], presetTmp);
  assert.equal(fs.existsSync(path.join(presetTmp, ".agents", "skills", "omg-cocos-playable-parameter", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(presetTmp, ".agents", "skills", "omg-unity-base-mcp-skill", "SKILL.md")), false);
} finally {
  fs.rmSync(presetTmp, { recursive: true, force: true });
}

const safetyTmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-safety-test-"));
try {
  const userSkill = path.join(safetyTmp, ".agents", "skills", "omg-user-skill");
  const userAgent = path.join(safetyTmp, ".codex", "agents", "omg-user-agent.toml");
  fs.mkdirSync(userSkill, { recursive: true });
  fs.mkdirSync(path.dirname(userAgent), { recursive: true });
  fs.writeFileSync(path.join(userSkill, "SKILL.md"), "---\nname: omg-user-skill\ndescription: User-owned skill.\n---\n", "utf8");
  fs.writeFileSync(userAgent, 'description = "User-owned agent."\n', "utf8");
  run(["install", "--target", "project", "--fresh", "--engine", "unity"], safetyTmp);
  assert.equal(fs.existsSync(path.join(userSkill, "SKILL.md")), true);
  assert.equal(fs.existsSync(userAgent), true);
  run(["uninstall", "--target", "project"], safetyTmp);
  assert.equal(fs.existsSync(path.join(userSkill, "SKILL.md")), true);
  assert.equal(fs.existsSync(userAgent), true);
} finally {
  fs.rmSync(safetyTmp, { recursive: true, force: true });
}

const conflictTmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-conflict-test-"));
try {
  run(["install", "--target", "project", "--engine", "cocos"], conflictTmp);
  const refFile = path.join(conflictTmp, ".agents", "skills", "omg-cocos-playable-parameter", "references", "workflow-steps.md");
  fs.appendFileSync(refFile, "\nlocal edit\n", "utf8");
  assertRunFails(["install", "--target", "project", "--engine", "cocos"], conflictTmp, /Conflict:/);
} finally {
  fs.rmSync(conflictTmp, { recursive: true, force: true });
}

const targetTmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-target-test-"));
try {
  assertRunFails(["doctor", "--target", "projcet"], targetTmp, /Unknown target "projcet"/);
} finally {
  fs.rmSync(targetTmp, { recursive: true, force: true });
}

console.log("smoke: OK");
