#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Rename non-canonical page filenames to canonical form AND update every
 * internal link that targets the old name.
 *
 * Usage: node fix-page-names.cjs <wiki-dir> [--dry-run]
 *
 * Rename strategy is conservative:
 *   - If the canonical name would collide with an existing page, skip and WARN.
 *   - If multiple sources rename to the same canonical target, skip both and WARN.
 *   - Links are updated by substring match of "Old-Name" (with and without .md).
 *     If a pre-existing link text happens to contain the old name, we only
 *     rewrite inside `[text](target)` and `[[target]]` forms to be safe.
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: fix-page-names.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  const existingNames = new Set(pages.map((p) => path.basename(p)));
  const renames = [];

  for (const page of pages) {
    const filename = path.basename(page);
    if (utils.RESERVED_PAGES.has(filename)) continue;
    if (utils.isCanonicalPageName(filename)) continue;
    let canonical;
    try {
      canonical = utils.canonicalPageName(filename);
    } catch (_e) {
      console.error(`[fix-page-names] cannot canonicalize: ${filename}`);
      continue;
    }
    if (existingNames.has(canonical) && canonical !== filename) {
      console.error(`[fix-page-names] SKIP — "${filename}" → "${canonical}" collides with existing page`);
      continue;
    }
    renames.push({ from: filename, to: canonical, absFrom: page });
    existingNames.add(canonical);
    existingNames.delete(filename);
  }

  if (renames.length === 0) {
    console.log('[fix-page-names] nothing to rename');
    process.exit(0);
  }

  // Perform renames
  for (const r of renames) {
    const dst = path.join(wikiDir, r.to);
    if (!dry) fs.renameSync(r.absFrom, dst);
    console.log(`[fix-page-names] ${dry ? '[dry] ' : ''}rename: ${r.from} → ${r.to}`);
  }

  // Rewrite links across all pages
  const afterPages = utils.listPages(wikiDir, { includeReserved: true });
  let linksRewritten = 0;
  for (const page of afterPages) {
    const before = fs.readFileSync(page, 'utf8');
    let after = before;
    for (const r of renames) {
      const oldBase = r.from.replace(/\.md$/, '');
      const newBase = r.to.replace(/\.md$/, '');
      // Rewrite [text](oldBase) and [text](oldBase.md)
      const mdRe = new RegExp(
        `(\\[[^\\]]*\\]\\()(?:\\./)?${escapeRegex(oldBase)}(\\.md)?((?:#[^)]+)?\\))`,
        'g'
      );
      after = after.replace(mdRe, (m, pre, dotmd, post) => `${pre}${newBase}${dotmd || ''}${post}`);
      // Rewrite [[oldBase]] and [[display|oldBase]]
      const gollumRe = new RegExp(`\\[\\[(([^\\]]*)\\|)?${escapeRegex(oldBase)}(\\s*\\]\\])`, 'g');
      after = after.replace(gollumRe, (m, _display, inner, closing) => `[[${inner ? inner + '|' : ''}${newBase}${closing}`);
    }
    if (after !== before) {
      linksRewritten++;
      if (!dry) fs.writeFileSync(page, after, 'utf8');
    }
  }
  console.log(`[fix-page-names] ${dry ? '[dry] ' : ''}${renames.length} renames, ${linksRewritten} files had links rewritten`);
  process.exit(0);
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
