#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-kits-membership.cjs — Doctor check: `metadata.kits` SSOT consistency.
//
// Asserts that Object.keys(metadata.kits) equals the unique set of
// installedModules[*].kit values (resolved to KitType). See
// `oh-my-game-kit-cli/src/domains/modules/kit-membership.ts` for the
// derivation formula and the SSOT "materialized for performance" rationale.
//
// Usage:
//   node check-kits-membership.cjs [path/to/.agents]
//
// Exits 0 always (WARN level — migration grace). Prints a single line
// describing PASS/WARN status, optionally followed by drift details.

'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Load the shared SSOT kit registry (ships with the omg-doctor skill).
// This JSON mirrors AVAILABLE_KITS in oh-my-game-kit-cli/src/types/kit.ts so this
// script stays in sync when a new kit is added — no hardcoded duplicate map.
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

function resolveKitType(kitFieldValue) {
  if (!kitFieldValue || typeof kitFieldValue !== 'string') return null;
  if (REPO_TO_KIT_TYPE[kitFieldValue]) return REPO_TO_KIT_TYPE[kitFieldValue];
  if (KIT_TYPES.has(kitFieldValue)) return kitFieldValue;
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

function run() {
  const codexDir = process.argv[2] || path.join(process.cwd(), '.agents');
  const metadata = loadMetadata(codexDir);
  if (!metadata) {
    console.log('[omg-doctor] kits-membership: SKIP — metadata.json not found');
    return;
  }

  const installedModules = metadata.installedModules || {};
  const kits = metadata.kits || {};

  // Doctor check is only meaningful for v3 module-first metadata.
  if (Object.keys(installedModules).length === 0 && metadata.schemaVersion !== 3) {
    console.log('[omg-doctor] kits-membership: SKIP — not a v3 installedModules metadata');
    return;
  }

  const kitKeys = Object.keys(kits).sort();
  const owners = new Set();
  const unresolved = [];
  for (const [modName, mod] of Object.entries(installedModules)) {
    const kitField = mod && typeof mod === 'object' ? mod.kit : null;
    const resolved = resolveKitType(kitField);
    if (resolved) {
      owners.add(resolved);
    } else {
      unresolved.push({ module: modName, kit: kitField });
    }
  }
  const uniqueOwners = Array.from(owners).sort();

  // Drift checks
  const missing = uniqueOwners.filter((owner) => !kitKeys.includes(owner));
  const orphaned = kitKeys.filter((kit) => !uniqueOwners.includes(kit));

  if (missing.length === 0 && orphaned.length === 0 && unresolved.length === 0) {
    console.log('[omg-doctor] kits-membership: PASS');
    return;
  }

  // WARN level — migration grace, not a hard fail. Details follow.
  console.log('[omg-doctor] kits-membership: WARN — metadata.kits drifted from installedModules');
  if (missing.length > 0) {
    console.log(`  missing kit entries (owners present in installedModules): ${missing.join(', ')}`);
  }
  if (orphaned.length > 0) {
    console.log(`  orphaned kit entries (no installed module owns them): ${orphaned.join(', ')}`);
  }
  if (unresolved.length > 0) {
    const sample = unresolved.slice(0, 3).map((u) => `${u.module}(kit=${u.kit})`).join(', ');
    console.log(
      `  unresolved installedModules.kit values (${unresolved.length}): ${sample}${unresolved.length > 3 ? ', ...' : ''}`,
    );
  }
  console.log(
    '  fix: run `omg modules add ...` or `omg modules remove ...` — CLI rebuilds membership',
  );
}

try {
  run();
} catch (err) {
  // Fail-open: doctor checks must never crash the suite.
  console.log(`[omg-doctor] kits-membership: WARN — check errored: ${err.message}`);
}
