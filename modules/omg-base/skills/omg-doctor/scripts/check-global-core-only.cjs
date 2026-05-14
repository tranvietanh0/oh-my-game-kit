#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-global-core-only.cjs — Doctor check #48: warn on non-core kits installed globally.
//
// Best practice: `$HOME/.agents/` should contain ONLY `oh-my-game-kit-core`. Engine-specific
// kits (unity, designer, cocos, react-native, web, nakama) belong PER-PROJECT in
// `.agents/` of the relevant project, not globally.
//
// Rationale:
//   - Global = always-on essentials; only core has the universal registry/rules/hooks/skills
//   - Per-project = engine/domain-specific (e.g. Unity skills only useful inside a Unity project)
//   - Mixing engine kits globally causes activation bleed (irrelevant skills auto-load),
//     stale-install drift, and orphaned files (real incident 2026-05-11: $HOME/.agents/
//     accumulated 162 unprefixed Unity skills as orphans because Unity was installed
//     globally but never updated cleanly)
//
// WARN level — this is a recommendation, not a violation. Does not block CI.
//
// Usage:
//   node check-global-core-only.cjs
//
// Exit 0 always. Reads $HOME/.agents/metadata.json regardless of CWD — the check
// is about the GLOBAL install state, not the project state.

'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHECK_NUM = 48;
const globalMetadataPath = path.join(os.homedir(), '.agents', 'metadata.json');

function main() {
  if (!fs.existsSync(globalMetadataPath)) {
    console.log(`[omg-doctor] check #${CHECK_NUM} SKIP — no global $HOME/.agents/metadata.json (OMG not installed globally)`);
    process.exit(0);
  }

  let metadata;
  try {
    metadata = JSON.parse(fs.readFileSync(globalMetadataPath, 'utf8'));
  } catch (err) {
    console.log(`[omg-doctor] check #${CHECK_NUM} SKIP — could not parse global metadata.json: ${err.message}`);
    process.exit(0);
  }

  const kits = metadata.kits;
  if (!kits || typeof kits !== 'object') {
    console.log(`[omg-doctor] check #${CHECK_NUM} SKIP — no .kits key in global metadata`);
    process.exit(0);
  }

  const installed = Object.keys(kits);
  const nonCore = installed.filter((name) => name !== 'core');

  if (nonCore.length === 0) {
    console.log(`[omg-doctor] check #${CHECK_NUM} PASS — global install is core-only.`);
    process.exit(0);
  }

  console.log(`[omg-doctor] check #${CHECK_NUM} WARN — ${nonCore.length} non-core kit(s) installed globally:`);
  for (const name of nonCore) {
    const version = (kits[name] && kits[name].version) || 'unknown';
    console.log(
      `  - Non-core kit '${name}' (version=${version}) is installed globally. ` +
        `Best practice: install engine-specific kits per-project (.agents/), keep ` +
        `$HOME/.agents/ to core only. Run 'omg uninstall --global --kit ${name}' to remove.`,
    );
  }
  console.log('');
  console.log(
    `[omg-doctor] check #${CHECK_NUM} Rationale: Global = always-on essentials (core only). ` +
      `Per-project = engine/domain-specific kits. Mixing engine kits globally causes ` +
      `activation bleed, irrelevant skill auto-load, and stale-install drift.`,
  );

  // Exit 0 — WARN level does not block CI
  process.exit(0);
}

main();
