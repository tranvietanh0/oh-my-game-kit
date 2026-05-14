#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Validate that every internal wiki link resolves to an existing page.
 *
 * Catches:
 *   - [text](Some-Page)         when Some-Page.md doesn't exist
 *   - [[Some Page]]             same
 *   - [text](./some-page.md)    same
 * Skips:
 *   - http(s)://...             external URLs
 *   - #anchor-only              same-page anchors (validated separately)
 *   - image links               validated in validate-images.cjs
 *
 * Usage: node validate-wiki-links.cjs <wiki-dir> [--verbose]
 * Exit:  0 on pass, 1 on any FAIL.
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const verbose = flags.includes('--verbose');
  if (!wikiDir) {
    console.error('usage: validate-wiki-links.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  const pageNames = new Set(pages.map((p) => path.basename(p)));
  // GitHub wiki silently case-normalizes page names in links; track lowercase too
  const lowerMap = new Map();
  pages.forEach((p) => lowerMap.set(path.basename(p).toLowerCase(), path.basename(p)));

  let failures = 0;
  let checked = 0;
  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const links = utils.extractLinks(content);
    for (const link of links) {
      if (link.kind === 'image') continue; // covered by validate-images
      checked++;
      const expected = utils.linkTargetToFilename(link.target);
      if (!expected) {
        utils.ghError(page, link.line, `unresolvable link target: "${link.target}"`);
        failures++;
        continue;
      }
      if (pageNames.has(expected)) continue;
      // Case-insensitive fallback: GitHub wiki is lenient, but flag as WARN
      if (lowerMap.has(expected.toLowerCase())) {
        utils.ghWarning(
          page,
          link.line,
          `link case mismatch: "${link.target}" → canonical "${lowerMap.get(expected.toLowerCase())}"`
        );
        continue;
      }
      utils.ghError(
        page,
        link.line,
        `broken wiki link: "${link.target}" (expected file "${expected}")`
      );
      failures++;
    }
  }
  if (verbose) {
    console.log(`[wiki-links] scanned ${checked} internal links across ${pages.length} pages`);
  }
  if (failures === 0) {
    console.log(`[wiki-links] OK — ${checked} links checked`);
    process.exit(0);
  }
  console.error(`[wiki-links] FAIL — ${failures} broken links`);
  process.exit(1);
}

main();
