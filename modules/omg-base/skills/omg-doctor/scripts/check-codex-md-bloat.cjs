#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-codex-md-bloat.cjs — Doctor check #35: AGENTS.md token budget.
//
// Warns when the project `AGENTS.md` exceeds 5000 tokens (char/4 heuristic),
// since oversized AGENTS.md duplicates content that belongs in
// `.agents/rules/` (auto-loaded) or `docs/` (searchable on demand).
//
// Usage:
//   node check-codex-md-bloat.cjs [path/to/project-root]
//
// Exits 0 always (WARN level). Prints a single PASS/WARN line with token
// estimate and remediation hint.

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { estimateTokens } = require('../../../hooks/lib/token-estimate.cjs');

const BUDGET_TOKENS = 5000;

function run() {
  const projectRoot = process.argv[2] || process.cwd();
  const codexMdPath = path.join(projectRoot, 'AGENTS.md');

  if (!fs.existsSync(codexMdPath)) {
    console.log('[omg-doctor] codex-md-bloat: SKIP — no AGENTS.md in project root');
    return;
  }

  let content;
  try {
    content = fs.readFileSync(codexMdPath, 'utf8');
  } catch (err) {
    console.log(`[omg-doctor] codex-md-bloat: SKIP — read error: ${err.message}`);
    return;
  }

  const tokens = estimateTokens(content);

  if (tokens <= BUDGET_TOKENS) {
    console.log(`[omg-doctor] codex-md-bloat: PASS (~${tokens} tokens, budget ${BUDGET_TOKENS})`);
    return;
  }

  console.log(
    `[omg-doctor] codex-md-bloat: WARN — AGENTS.md is ~${tokens} tokens (budget ${BUDGET_TOKENS}, over by ${tokens - BUDGET_TOKENS})`,
  );
  console.log(
    '  fix: move details to docs/ (searchable on demand) and rules in .agents/rules/ (auto-loaded).',
  );
  console.log(
    '  typical wins: remove duplicates of rules/*.md, cut CI gate backlogs, cut implementation details',
  );
}

try {
  run();
} catch (err) {
  console.log(`[omg-doctor] codex-md-bloat: WARN — check errored: ${err.message}`);
}
