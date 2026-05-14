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
  run(["install", "--target", "project", "--fresh", "--preset", "unity-minimal"], tmp);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-cook", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-unity-base-mcp-skill", "SKILL.md")), true);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "agents", "omg-fullstack-developer.toml")), true);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "config.toml")), true);
  const agents = fs.readFileSync(path.join(tmp, "AGENTS.md"), "utf8");
  assert.match(agents, /oh-my-game-kit:start/);
  assert.equal(fs.existsSync(path.join(tmp, ".oh-my-game-kit", "install-state.json")), true);
  run(["doctor", "--target", "project"], tmp);
  run(["uninstall", "--target", "project"], tmp);
  assert.equal(fs.existsSync(path.join(tmp, ".agents", "skills", "omg-cook")), false);
  assert.equal(fs.existsSync(path.join(tmp, ".codex", "agents", "omg-fullstack-developer.toml")), false);
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log("smoke: OK");
