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

run(["validate"]);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-test-"));
try {
  run(["install", "--target", "project", "--fresh", "--engine", "unity"], tmp);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-cook", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-unity-base-mcp-skill", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-cocos-base-script-graph", "SKILL.md")), false);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "agents", "omg-fullstack-developer.toml")), true);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "config.toml")), true);
  const agents = fs.readFileSync(path.join(tmp, "AGENTS.md"), "utf8");
  assert.match(agents, /oh-my-game-kit:start/);
  const state = JSON.parse(fs.readFileSync(path.join(tmp, ".oh-my-game-kit", "install-state.json"), "utf8"));
  assert.equal(state.engine, "unity");
  assert.equal(state.preset, "unity-production");
  run(["doctor", "--target", "project"], tmp);
  run(["uninstall", "--target", "project"], tmp);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-cook")), false);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "agents", "omg-fullstack-developer.toml")), false);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

const cocosTmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-cocos-test-"));
try {
  run(["install", "--target", "project", "--fresh", "--engine", "cocos"], cocosTmp);
  assert.equal(fs.existsSync(path.join(cocosTmp, ".agents", "skills", "omg-cocos-base-script-graph", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(cocosTmp, ".agents", "skills", "omg-cocos-playable-parameter", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(cocosTmp, ".agents", "skills", "omg-unity-base-mcp-skill", "SKILL.md")), false);
  run(["doctor", "--target", "project"], cocosTmp);
} finally {
  fs.rmSync(cocosTmp, { recursive: true, force: true });
}

const allTmp = fs.mkdtempSync(path.join(os.tmpdir(), "omg-kit-all-test-"));
try {
  run(["install", "--target", "project", "--fresh", "--engine", "all"], allTmp);
  assert.equal(fs.existsSync(path.join(allTmp, ".agents", "skills", "omg-cocos-playable-parameter", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(allTmp, ".agents", "skills", "omg-unity-base-mcp-skill", "SKILL.md")), true);
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

console.log("smoke: OK");
