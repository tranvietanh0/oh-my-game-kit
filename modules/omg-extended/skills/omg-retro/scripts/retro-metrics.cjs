#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * Retro metrics collector (extracted from SKILL.md per E11).
 *
 * Usage:
 *   node retro-metrics.cjs --since "2026-04-01" --until "2026-04-28" [--json]
 *
 * Cross-platform — uses Node.js execSync, never relies on bash-specific shell
 * features like `sort | uniq -c` (BSD/GNU diverge) or `date -jf` (macOS only).
 *
 * Output: JSON to stdout when `--json` is set, otherwise human-readable summary.
 *
 * Exit codes:
 *   0 — success
 *   1 — git not available or not a repo
 *   2 — invalid args
 */

'use strict';

const { execSync } = require('child_process');

function parseArgs(argv) {
  const args = { since: '', until: '', json: false };
  for (let i = 2; i < argv.length; i++) {
    const v = argv[i];
    if (v === '--since') args.since = argv[++i] || '';
    else if (v === '--until') args.until = argv[++i] || '';
    else if (v === '--json') args.json = true;
  }
  if (!args.since) {
    console.error('error: --since is required (e.g. "2026-04-01" or "1 month ago")');
    process.exit(2);
  }
  return args;
}

function git(cmd, since, until) {
  const sinceFlag = since ? `--since="${since}"` : '';
  const untilFlag = until ? `--until="${until}"` : '';
  try {
    return execSync(`git ${cmd} ${sinceFlag} ${untilFlag}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
  } catch (e) {
    return '';
  }
}

function collect(since, until) {
  // Commits per day
  const commitDates = git('log --format="%ai"', since, until);
  const perDay = {};
  for (const line of commitDates.split('\n').filter(Boolean)) {
    const date = line.split(' ')[0];
    if (date) perDay[date] = (perDay[date] || 0) + 1;
  }

  const totalCommits = git('log --oneline', since, until)
    .split('\n')
    .filter(Boolean).length;

  // LOC added / removed
  const numstat = git('log --numstat --format=""', since, until);
  let added = 0;
  let deleted = 0;
  for (const line of numstat.split('\n').filter(Boolean)) {
    const parts = line.split('\t');
    if (parts.length === 3 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1]))) {
      added += Number(parts[0]);
      deleted += Number(parts[1]);
    }
  }
  const net = added - deleted;

  // File hotspots
  const nameOnly = git('log --name-only --format=""', since, until);
  const fileCounts = {};
  for (const line of nameOnly.split('\n').filter(Boolean)) {
    fileCounts[line] = (fileCounts[line] || 0) + 1;
  }
  const hotspots = Object.entries(fileCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Commit type distribution (conventional commits)
  const subjects = git('log --format="%s"', since, until);
  const typeCounts = {};
  for (const line of subjects.split('\n').filter(Boolean)) {
    const type = line.replace(/\(.*/, '').replace(/:.*/, '').trim();
    if (type) typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  // Authors
  const authors = git('log --format="%ae"', since, until)
    .split('\n')
    .filter(Boolean);
  const uniqueAuthors = [...new Set(authors)];
  const authorCounts = {};
  for (const a of authors) authorCounts[a] = (authorCounts[a] || 0) + 1;

  // Active days
  const activeDays = new Set(
    git('log --format="%ai"', since, until)
      .split('\n')
      .filter(Boolean)
      .map((l) => l.split(' ')[0])
  ).size;

  // Files changed
  const uniqueFiles = new Set(nameOnly.split('\n').filter(Boolean)).size;

  // Test files
  const testFiles = nameOnly
    .split('\n')
    .filter(Boolean)
    .filter((f) => /\.test\.|\.spec\.|__tests__|test_/.test(f)).length;
  const totalFileChanges = nameOnly.split('\n').filter(Boolean).length;

  return {
    period: { since, until: until || 'now' },
    commits: {
      total: totalCommits,
      perDay,
      activeDays,
    },
    code: {
      added,
      deleted,
      net,
      uniqueFiles,
      hotspots,
    },
    types: typeCounts,
    authors: {
      unique: uniqueAuthors.length,
      perAuthor: authorCounts,
    },
    tests: {
      testFileChanges: testFiles,
      totalFileChanges,
      ratio: totalFileChanges > 0 ? testFiles / totalFileChanges : 0,
    },
  };
}

function main() {
  const args = parseArgs(process.argv);
  const data = collect(args.since, args.until);
  if (args.json) {
    process.stdout.write(JSON.stringify(data, null, 2));
    return;
  }
  console.log(`Retro metrics: ${data.period.since} → ${data.period.until}`);
  console.log(`  Commits: ${data.commits.total} across ${data.commits.activeDays} active days`);
  console.log(`  LOC: +${data.code.added} / -${data.code.deleted} (net ${data.code.net})`);
  console.log(`  Files touched: ${data.code.uniqueFiles}`);
  console.log(`  Test changes: ${data.tests.testFileChanges} / ${data.tests.totalFileChanges} (${(data.tests.ratio * 100).toFixed(1)}%)`);
  console.log(`  Authors: ${data.authors.unique}`);
  console.log(`  Top hotspots:`);
  for (const [f, n] of data.code.hotspots) {
    console.log(`    ${n.toString().padStart(4)}  ${f}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { collect, git };
