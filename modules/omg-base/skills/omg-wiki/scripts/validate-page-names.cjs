#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Validate wiki page filenames match GitHub conventions:
 *   - Hyphen-separated (no spaces, underscores, or camelCase)
 *   - PascalCase per segment
 *   - Flat (no subdirectories — GitHub wiki flattens)
 *
 * Usage: node validate-page-names.cjs <wiki-dir> [--verbose]
 * Exit:  0 on pass, 1 on any FAIL.
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const verbose = flags.includes('--verbose');
  if (!wikiDir) {
    console.error('usage: validate-page-names.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  let failures = 0;

  // Flag non-canonical filenames
  for (const page of pages) {
    const filename = path.basename(page);
    if (utils.RESERVED_PAGES.has(filename)) continue;
    if (!utils.isCanonicalPageName(filename)) {
      const canonical = safeCanonical(filename);
      utils.ghError(
        page,
        1,
        canonical
          ? `non-canonical filename — rename to "${canonical}"`
          : `non-canonical filename — rename to hyphen-separated PascalCase`
      );
      failures++;
    }
  }

  // Flag subdirectories (wiki must be flat)
  walkSubdirs(wikiDir, (subdir) => {
    utils.ghError(subdir, 1, 'wiki subdirectories are flattened by GitHub — move pages to the wiki root');
    failures++;
  });

  if (verbose) {
    console.log(`[page-names] scanned ${pages.length} pages`);
  }
  if (failures === 0) {
    console.log(`[page-names] OK — ${pages.length} pages`);
    process.exit(0);
  }
  console.error(`[page-names] FAIL — ${failures} violations`);
  process.exit(1);
}

function safeCanonical(filename) {
  try {
    return utils.canonicalPageName(filename);
  } catch (_e) {
    return null;
  }
}

function walkSubdirs(dir, onFind) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name !== '.git') {
      onFind(path.join(dir, entry.name));
    }
  }
}

main();
