#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Validate every image reference:
 *   - Relative paths resolve to a file inside the wiki repo
 *   - Every image has non-empty alt text (WCAG + better RAG retrieval)
 * Skips:
 *   - External URLs (http(s)://, data:)
 *
 * Usage: node validate-images.cjs <wiki-dir> [--verbose]
 * Exit:  0 on pass, 1 on any FAIL (missing file). Missing alt is WARN.
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const verbose = flags.includes('--verbose');
  if (!wikiDir) {
    console.error('usage: validate-images.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  let failures = 0;
  let warnings = 0;
  let checked = 0;
  const imgPattern = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m;
      imgPattern.lastIndex = 0;
      while ((m = imgPattern.exec(line)) !== null) {
        const [, bang, alt, target] = m;
        if (bang !== '!') continue;
        checked++;
        if (!alt || !alt.trim()) {
          utils.ghWarning(page, i + 1, `image missing alt text: "${target}" (hurts accessibility + AI retrieval)`);
          warnings++;
        }
        if (/^(https?:|data:)/i.test(target)) continue;
        // Resolve relative to the page's directory (wiki root)
        const resolved = path.resolve(path.dirname(page), target);
        if (!fs.existsSync(resolved)) {
          utils.ghError(page, i + 1, `image file not found: "${target}"`);
          failures++;
        }
      }
    }
  }

  if (verbose) {
    console.log(`[images] scanned ${checked} images across ${pages.length} pages`);
  }
  if (failures === 0) {
    console.log(`[images] OK — ${checked} images checked${warnings ? ` (${warnings} alt-text warnings)` : ''}`);
    process.exit(0);
  }
  console.error(`[images] FAIL — ${failures} missing image files`);
  process.exit(1);
}

main();
