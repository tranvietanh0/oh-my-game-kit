#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Auto-fix mermaid style/classDef lines that lack an explicit color:.
 * Appends ",color:#0d1117" to every offending line (both mode-safe on GitHub).
 *
 * Usage: node fix-mermaid-contrast.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: fix-mermaid-contrast.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  let fixed = 0;
  let filesTouched = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const { next, edits } = fixContent(content);
    if (edits === 0) continue;
    filesTouched++;
    fixed += edits;
    if (!dry) fs.writeFileSync(page, next, 'utf8');
    console.log(`[fix-mermaid-contrast] ${dry ? '[dry] ' : ''}${path.basename(page)}: ${edits} style lines patched`);
  }

  console.log(`[fix-mermaid-contrast] ${dry ? '[dry] ' : ''}${fixed} lines fixed across ${filesTouched} files`);
  process.exit(0);
}

function fixContent(content) {
  const lines = content.split('\n');
  let inFence = false;
  let edits = 0;
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!inFence && /^```\s*mermaid\b/i.test(trimmed)) {
      inFence = true;
      out.push(line);
      continue;
    }
    if (inFence && /^```\s*$/.test(trimmed)) {
      inFence = false;
      out.push(line);
      continue;
    }
    if (inFence) {
      const info = utils.inspectStyleLine(line);
      if (info.match && !info.hasColor) {
        // Append ,color:#0d1117 to the attrs
        // Preserve existing trailing whitespace (rare but possible)
        const trailingWs = line.match(/\s*$/)[0];
        const core = line.slice(0, line.length - trailingWs.length);
        const patched = `${core},color:${utils.MERMAID_TEXT_COLOR}${trailingWs}`;
        out.push(patched);
        edits++;
        continue;
      }
    }
    out.push(line);
  }
  return { next: out.join('\n'), edits };
}

main();
