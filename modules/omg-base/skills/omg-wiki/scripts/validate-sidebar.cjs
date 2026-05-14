#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Validate _Sidebar.md:
 *   - Every linked page exists on disk.
 *   - Every page on disk (minus reserved) is linked from the sidebar.
 *
 * Usage: node validate-sidebar.cjs <wiki-dir> [--verbose]
 * Exit:  0 on pass, 1 on any FAIL.
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const verbose = flags.includes('--verbose');
  if (!wikiDir) {
    console.error('usage: validate-sidebar.cjs <wiki-dir>');
    process.exit(2);
  }
  const sidebarPath = path.join(wikiDir, '_Sidebar.md');
  if (!fs.existsSync(sidebarPath)) {
    utils.ghWarning(wikiDir, 1, '_Sidebar.md missing — GitHub will fall back to default alphabetical nav');
    console.log(`[sidebar] WARN — _Sidebar.md missing`);
    process.exit(0);
  }
  const content = fs.readFileSync(sidebarPath, 'utf8');
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  const pageNames = new Set(pages.map((p) => path.basename(p)));

  let failures = 0;
  const sidebarLinks = utils.extractLinks(content);
  const linkedTargets = new Set();
  for (const link of sidebarLinks) {
    if (link.kind === 'image') continue;
    const expected = utils.linkTargetToFilename(link.target);
    if (!expected) {
      utils.ghError(sidebarPath, link.line, `unresolvable sidebar link: "${link.target}"`);
      failures++;
      continue;
    }
    if (!pageNames.has(expected) && expected !== 'Home.md') {
      utils.ghError(sidebarPath, link.line, `sidebar links to missing page: "${expected}"`);
      failures++;
      continue;
    }
    linkedTargets.add(expected);
  }

  // Orphan pages (on disk, not linked from sidebar) → warning not error
  let orphans = 0;
  for (const page of pages) {
    const filename = path.basename(page);
    if (!linkedTargets.has(filename)) {
      utils.ghWarning(page, 1, `page not listed in _Sidebar.md (orphan) — add to sidebar or run: wiki-helper fix`);
      orphans++;
    }
  }

  if (verbose) {
    console.log(`[sidebar] ${linkedTargets.size} linked, ${pages.length} on disk, ${orphans} orphans`);
  }
  if (failures === 0) {
    console.log(`[sidebar] OK — ${linkedTargets.size} valid links${orphans ? ` (${orphans} orphans — warnings only)` : ''}`);
    process.exit(0);
  }
  console.error(`[sidebar] FAIL — ${failures} broken sidebar links`);
  process.exit(1);
}

main();
