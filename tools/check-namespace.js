#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacyToken = ["t", "1", "k"].join("");
const legacyPackage = ["theone", "kit"].join("");
const legacyTitle = ["The", "One", "Kit"].join("");
const forbidden = [
  legacyToken,
  legacyToken.toUpperCase(),
  legacyPackage,
  legacyTitle,
];

const ignoredDirs = new Set([
  ".git",
  ".github",
  ".agents",
  ".codex",
  ".oh-my-game-kit",
  "node_modules",
  "coverage",
  "dist",
  "build",
  ".cache",
  ".tmp",
  "tmp",
]);

const binaryExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
  ".ico",
  ".zip",
  ".gz",
  ".tgz",
  ".dll",
  ".exe",
]);

function walk(dir) {
  const matches = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    const rel = path.relative(repoRoot, full).replaceAll("\\", "/");
    if (forbidden.some((token) => entry.name.includes(token))) {
      matches.push(`${rel}: path contains forbidden legacy namespace`);
    }
    if (entry.isDirectory()) {
      matches.push(...walk(full));
      continue;
    }
    if (!entry.isFile() || binaryExtensions.has(path.extname(entry.name).toLowerCase())) continue;
    const content = fs.readFileSync(full, "utf8");
    const lines = content.split(/\r?\n/);
    lines.forEach((line, index) => {
      if (forbidden.some((token) => line.includes(token))) {
        matches.push(`${rel}:${index + 1}: contains forbidden legacy namespace`);
      }
    });
  }
  return matches;
}

const matches = walk(repoRoot);
if (matches.length) {
  console.error(matches.join("\n"));
  process.exitCode = 1;
} else {
  console.log("namespace: OK");
}
