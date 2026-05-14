#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Validate that every mermaid `style` / `classDef` line inside every
 * ```mermaid fenced block has an explicit `color:` field.
 *
 * GitHub renders mermaid on both light AND dark wiki themes. Pale fills
 * without an explicit text color produce labels that are unreadable on
 * dark theme. This check catches that before publish.
 *
 * Usage: node validate-mermaid-contrast.cjs <wiki-dir> [--verbose]
 * Exit:  0 on pass, 1 on any FAIL.
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const verbose = flags.includes('--verbose');
  if (!wikiDir) {
    console.error('usage: validate-mermaid-contrast.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  let failures = 0;
  let scanned = 0;
  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const blocks = utils.extractMermaidBlocks(content);
    for (const block of blocks) {
      scanned++;
      for (let i = 0; i < block.lines.length; i++) {
        const line = block.lines[i];
        const info = utils.inspectStyleLine(line);
        if (!info.match) continue;
        if (!info.hasColor) {
          // Absolute line number in the file = fence start + 1 + offset
          const lineNo = block.startLine + 1 + i + 1;
          utils.ghError(
            page,
            lineNo,
            `mermaid style missing explicit color: — add ",color:${utils.MERMAID_TEXT_COLOR}" (hard to read on dark theme)`
          );
          failures++;
        }
      }
    }
  }
  if (verbose) {
    console.log(`[mermaid-contrast] scanned ${scanned} mermaid blocks across ${pages.length} pages`);
  }
  if (failures === 0) {
    console.log(`[mermaid-contrast] OK — ${scanned} blocks checked`);
    process.exit(0);
  }
  console.error(`[mermaid-contrast] FAIL — ${failures} style lines missing color: field`);
  process.exit(1);
}

main();
