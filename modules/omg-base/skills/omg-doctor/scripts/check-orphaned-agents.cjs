#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-orphaned-agents.cjs — Doctor check #34: Orphaned kit agents.
//
// Detects agent files under `.agents/agents/` whose `origin:` frontmatter
// points to a kit that is NOT in `metadata.installedModules[*].kit`.
//
// These are leftovers from a pre-manifest install where `omg uninstall --kit X`
// could not remove them because the kit's `.omg-manifest.json` didn't list them.
// Fresh installs from v1.64.0+ are tracked in manifests and won't hit this.
//
// Usage:
//   node check-orphaned-agents.cjs [path/to/.agents]
//
// Exits 0 always (WARN level). Prints a single PASS/WARN line, optionally
// followed by the orphaned filenames and a fix hint.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

function loadKitRegistry() {
  const registryPath = path.join(__dirname, '..', 'references', 'available-kits.json');
  const raw = fs.readFileSync(registryPath, 'utf8');
  const parsed = JSON.parse(raw);
  const kitTypes = new Set();
  const repoToKitType = {};
  for (const [kitType, cfg] of Object.entries(parsed.kits || {})) {
    kitTypes.add(kitType);
    if (cfg && typeof cfg.repo === 'string') {
      repoToKitType[cfg.repo] = kitType;
    }
  }
  return { kitTypes, repoToKitType };
}

const { kitTypes: KIT_TYPES, repoToKitType: REPO_TO_KIT_TYPE } = loadKitRegistry();

function resolveKitType(value) {
  if (!value || typeof value !== 'string') return null;
  if (REPO_TO_KIT_TYPE[value]) return REPO_TO_KIT_TYPE[value];
  if (KIT_TYPES.has(value)) return value;
  return null;
}

function loadMetadata(codexDir) {
  const metadataPath = path.join(codexDir, 'metadata.json');
  if (!fs.existsSync(metadataPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  } catch {
    return null;
  }
}

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return {};
  const end = content.indexOf('\n---', 3);
  if (end === -1) return {};
  const block = content.slice(3, end);
  const fields = {};
  for (const line of block.split('\n')) {
    const match = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (match) fields[match[1]] = match[2].trim();
  }
  return fields;
}

function run() {
  const codexDir = process.argv[2] || path.join(process.cwd(), '.agents');
  const metadata = loadMetadata(codexDir);
  if (!metadata) {
    console.log('[omg-doctor] orphaned-agents: SKIP — metadata.json not found');
    return;
  }

  const installedModules = metadata.installedModules || {};
  const kits = metadata.kits || {};

  if (Object.keys(installedModules).length === 0 && Object.keys(kits).length === 0) {
    console.log('[omg-doctor] orphaned-agents: SKIP — no installedModules or kits in metadata');
    return;
  }

  // Build the set of installed kit types (the only owners still considered "active").
  // Accept both v3 (installedModules[*].kit) and older schemas (Object.keys(kits)).
  const installedKits = new Set(['oh-my-game-kit-core', 'core']);
  for (const mod of Object.values(installedModules)) {
    const kitField = mod && typeof mod === 'object' ? mod.kit : null;
    const resolved = resolveKitType(kitField);
    if (resolved) installedKits.add(resolved);
    if (kitField && typeof kitField === 'string') installedKits.add(kitField);
  }
  for (const kitKey of Object.keys(kits)) {
    installedKits.add(kitKey);
    const resolved = resolveKitType(kitKey);
    if (resolved) installedKits.add(resolved);
    // The older kits format uses short keys like 'unity' — also accept the full repo name.
    installedKits.add(`oh-my-game-kit-${kitKey}`);
  }

  const agentsDir = path.join(codexDir, 'agents');
  if (!fs.existsSync(agentsDir)) {
    console.log('[omg-doctor] orphaned-agents: SKIP — no agents/ directory');
    return;
  }

  const orphans = [];
  for (const file of fs.readdirSync(agentsDir)) {
    if (!file.endsWith('.md')) continue;
    const fullPath = path.join(agentsDir, file);
    let content;
    try {
      content = fs.readFileSync(fullPath, 'utf8');
    } catch {
      continue;
    }
    const fm = parseFrontmatter(content);
    const origin = fm.origin;
    if (!origin || origin === 'null' || origin === 'none') continue;
    if (origin === 'oh-my-game-kit-core' || origin === 'core') continue;

    const resolved = resolveKitType(origin) || origin;
    if (!installedKits.has(origin) && !installedKits.has(resolved)) {
      orphans.push({ file, origin });
    }
  }

  if (orphans.length === 0) {
    console.log('[omg-doctor] orphaned-agents: PASS');
    return;
  }

  console.log(
    `[omg-doctor] orphaned-agents: WARN — ${orphans.length} agent(s) from uninstalled kits remain`,
  );
  const byKit = {};
  for (const { file, origin } of orphans) {
    (byKit[origin] ||= []).push(file);
  }
  for (const [kit, files] of Object.entries(byKit)) {
    console.log(`  ${kit}: ${files.join(', ')}`);
  }
  console.log(
    '  fix: `omg uninstall --kit <name> --include-orphans` (v3.5+) or manually `rm .agents/agents/<file>`',
  );
}

try {
  run();
} catch (err) {
  // Fail-open: doctor checks must never crash the suite.
  console.log(`[omg-doctor] orphaned-agents: WARN — check errored: ${err.message}`);
}
