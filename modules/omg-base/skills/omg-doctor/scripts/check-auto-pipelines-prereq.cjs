#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-auto-pipelines-prereq.cjs — Doctor check #46: GitHub MCP prereq for auto-pipelines.
//
// When `features.autoIssueSubmission` or `features.autoLessonSync` is ON, the
// pipeline relies on a background sub-agent that calls `mcp__github__*` tools
// (create_issue, create_pull_request, search_issues). If the GitHub MCP is
// missing or not authenticated, the marker queues silently and the sub-agent
// has no way to submit — the user sees nothing and maintainers receive nothing.
//
// This check correlates the enabled state of the two pipelines with the
// presence of the GitHub MCP and emits a diagnostic WARN when there is a
// mismatch.
//
// Output: JSON to stdout
//   { status: "pass" | "skip" | "warn",
//     enabled: { autoIssueSubmission, autoLessonSync },
//     githubMcpPresent: bool,
//     reason: string }
// Exit 0 always (advisory check; never blocks doctor).
//
// Usage:  node check-auto-pipelines-prereq.cjs [project-root]

'use strict';

const fs           = require('node:fs');
const path         = require('node:path');
const { execFileSync } = require('node:child_process');

function readMergedFeatureFlags(codexDir) {
  const flags = { autoIssueSubmission: false, autoLessonSync: false };
  if (!fs.existsSync(codexDir)) return flags;
  let entries;
  try { entries = fs.readdirSync(codexDir); } catch { return flags; }
  for (const f of entries) {
    if (!f.startsWith('omg-config-') || !f.endsWith('.json')) continue;
    try {
      const cfg = JSON.parse(fs.readFileSync(path.join(codexDir, f), 'utf8'));
      if (cfg && cfg.features && typeof cfg.features === 'object') {
        if (typeof cfg.features.autoIssueSubmission === 'boolean') {
          flags.autoIssueSubmission = cfg.features.autoIssueSubmission;
        }
        if (typeof cfg.features.autoLessonSync === 'boolean') {
          flags.autoLessonSync = cfg.features.autoLessonSync;
        }
      }
    } catch { /* skip malformed fragment */ }
  }
  return flags;
}

function isGithubMcpPresent() {
  try {
    const out = execFileSync('codex', ['mcp', 'list'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
      windowsHide: true,
    });
    return /^\s*github\s/m.test(out) || /\bgithub\b/i.test(out);
  } catch {
    return null;
  }
}

function main() {
  const projectRoot = process.argv[2] || process.cwd();
  const codexDir = path.join(projectRoot, '.agents');

  const flags = readMergedFeatureFlags(codexDir);
  const anyEnabled = flags.autoIssueSubmission || flags.autoLessonSync;

  if (!anyEnabled) {
    process.stdout.write(JSON.stringify({
      status: 'pass',
      enabled: flags,
      githubMcpPresent: null,
      reason: 'auto-pipelines disabled — GH MCP prereq not applicable',
    }) + '\n');
    return;
  }

  const present = isGithubMcpPresent();

  if (present === null) {
    process.stdout.write(JSON.stringify({
      status: 'skip',
      enabled: flags,
      githubMcpPresent: null,
      reason: 'codex CLI not available — cannot probe MCP state',
    }) + '\n');
    return;
  }

  if (present) {
    process.stdout.write(JSON.stringify({
      status: 'pass',
      enabled: flags,
      githubMcpPresent: true,
      reason: 'GitHub MCP present and CLI reachable',
    }) + '\n');
    return;
  }

  const enabledList = Object.entries(flags).filter(([, v]) => v).map(([k]) => k).join(', ');
  const msg = `auto-pipelines [${enabledList}] are ON but GitHub MCP is not registered — submissions will queue and silently fail. Fix: codex mcp add github`;
  process.stderr.write(`WARN: ${msg}\n`);
  process.stdout.write(JSON.stringify({
    status: 'warn',
    enabled: flags,
    githubMcpPresent: false,
    reason: msg,
  }) + '\n');
}

main();
