#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const modulesDir = path.join(repoRoot, "modules");

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && /\.test\.(cjs|js)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const tests = walk(modulesDir).sort();
const failed = [];

for (const testFile of tests) {
  const result = spawnSync(process.execPath, [testFile], {
    cwd: repoRoot,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });

  if (result.status !== 0) {
    failed.push({
      file: path.relative(repoRoot, testFile).replaceAll("\\", "/"),
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
    });
  }
}

if (failed.length) {
  for (const failure of failed) {
    console.error(`module test failed: ${failure.file}`);
    if (failure.stdout) console.error(failure.stdout);
    if (failure.stderr) console.error(failure.stderr);
  }
  process.exitCode = 1;
} else {
  console.log(`module tests: OK (${tests.length})`);
}
