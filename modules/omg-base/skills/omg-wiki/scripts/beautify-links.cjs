#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Normalize internal wiki links to a single canonical form:
 *   [text](Page-Name)     ← preferred (matches GitHub wiki's native form)
 * Rewrites:
 *   [text](./Page-Name)        → [text](Page-Name)
 *   [text](./Page-Name.md)     → [text](Page-Name)
 *   [text](Page-Name.md)       → [text](Page-Name)
 *   [[Page-Name]]              → [Page Name](Page-Name)  (prefer md form)
 *   [[Display Text|Page-Name]] → [Display Text](Page-Name)
 *
 * Preserves:
 *   - External URLs (http(s)://, mailto:, etc.)
 *   - Same-page #anchors
 *   - Image links (leading !)
 *   - Link targets with /: sub-paths (left alone, likely intentional)
 *
 * Usage: node beautify-links.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: beautify-links.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  let total = 0;
  let filesTouched = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const { next, count } = normalize(content);
    if (count > 0) {
      total += count;
      filesTouched++;
      if (!dry) fs.writeFileSync(page, next, 'utf8');
      console.log(`[beautify-links] ${dry ? '[dry] ' : ''}${path.basename(page)}: ${count} links normalized`);
    }
  }
  console.log(`[beautify-links] ${dry ? '[dry] ' : ''}${total} links normalized across ${filesTouched} files`);
  process.exit(0);
}

function normalize(content) {
  let count = 0;
  // Fence-safe — wiki link examples inside code blocks must not be rewritten.
  const next = utils.replaceOutsideFences(content, (prose) => {
    // Rewrite [text](./Page.md) and [text](Page.md) (internal only — skip URLs)
    prose = prose.replace(/(?<!!)\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, text, target, title) => {
      if (/^(https?:|mailto:|ftp:|tel:|data:)/i.test(target)) return m;
      if (target.startsWith('#')) return m;
      if (target.includes('/')) return m; // sub-path, probably intentional
      let newTarget = target.replace(/^\.\//, '').replace(/\.md(?=#|$)/, '');
      if (newTarget === target) return m;
      count++;
      return title ? `[${text}](${newTarget} "${title}")` : `[${text}](${newTarget})`;
    });

    // Rewrite [[Page]] and [[Display|Page]] → [text](Page)
    prose = prose.replace(/\[\[([^\]]+)\]\]/g, (m, inner) => {
      if (inner.includes('://')) return m; // leave untouched
      let text, target;
      if (inner.includes('|')) {
        [text, target] = inner.split('|').map((s) => s.trim());
      } else {
        target = inner.trim();
        text = target.replace(/-/g, ' ');
      }
      target = target.replace(/\.md$/, '').replace(/\s+/g, '-');
      count++;
      return `[${text}](${target})`;
    });

    return prose;
  });

  return { next, count };
}

main();
