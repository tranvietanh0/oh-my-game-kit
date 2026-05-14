#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-context-budget.cjs — Doctor check #37: Context-window token budget.
//
// Sums the token estimates for all tree-walk-reachable rule files
// (`.agents/rules/*.md`) and the project `AGENTS.md`. Warns when total
// exceeds 12 000 tokens, fails (exit 1) when it exceeds 15 000 tokens.
//
// This is the session-time complement to the release-time gate
// `validate-context-window-budget.cjs` in oh-my-game-kit-release-action.
//
// Usage:
//   node check-context-budget.cjs [path/to/project-root]
//
// Exit 0 = PASS or WARN. Exit 1 = FAIL (over hard budget).

'use strict';

const fs   = require('node:fs');
const path = require('node:path');
const { sumTokens } = require('../../../hooks/lib/token-estimate.cjs');

const WARN_TOKENS = 12000;
const FAIL_TOKENS = 15000;

function run() {
  const projectRoot    = process.argv[2] || process.cwd();
  const projectRulesDir = path.join(projectRoot, '.agents', 'rules');
  const codexMdPath   = path.join(projectRoot, 'AGENTS.md');

  const filePaths = [];

  // Collect .agents/rules/*.md
  if (fs.existsSync(projectRulesDir)) {
    try {
      const ruleFiles = fs.readdirSync(projectRulesDir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => path.join(projectRulesDir, f));
      filePaths.push(...ruleFiles);
    } catch (err) {
      console.log(`[omg-doctor] context-budget: WARN — could not read rules dir: ${err.message}`);
    }
  }

  // Include project AGENTS.md if present
  if (fs.existsSync(codexMdPath)) {
    filePaths.push(codexMdPath);
  }

  if (filePaths.length === 0) {
    console.log('[omg-doctor] context-budget: SKIP — no rules/ files and no AGENTS.md found');
    return;
  }

  const total = sumTokens(filePaths);

  if (total <= WARN_TOKENS) {
    console.log(`[omg-doctor] context-budget: PASS (~${total} tokens, budget ${FAIL_TOKENS})`);
    return;
  }

  if (total <= FAIL_TOKENS) {
    console.log(
      `[omg-doctor] context-budget: WARN — context load is ~${total} tokens (warn threshold ${WARN_TOKENS}, hard limit ${FAIL_TOKENS})`,
    );
    console.log('  fix: move verbose docs to docs/ (searchable), trim rules/*.md, reduce AGENTS.md.');
    return;
  }

  // Over hard limit
  console.log(
    `[omg-doctor] context-budget: FAIL — context load is ~${total} tokens, exceeds hard limit ${FAIL_TOKENS}`,
  );
  console.log('  fix: move verbose docs to docs/ (searchable), trim rules/*.md, reduce AGENTS.md.');
  process.exit(1);
}

try {
  run();
} catch (err) {
  console.log(`[omg-doctor] context-budget: WARN — check errored: ${err.message}`);
}
