#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Normalize callout blocks to GFM alert syntax (GitHub wiki supports these):
 *   > [!NOTE] / [!TIP] / [!IMPORTANT] / [!WARNING] / [!CAUTION]
 *
 * Rewrites common alternatives seen in imported docs:
 *   - "> **Note:** ..." → "> [!NOTE]\n> ..."
 *   - "> **Warning:** ..." / "> ⚠️ ..." → "> [!WARNING]"
 *   - ":::note ... :::" (Docusaurus-style) → GFM alert
 *
 * Usage: node beautify-callouts.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

const BOLD_PREFIX_RE = /^>\s*\*\*(Note|Tip|Important|Warning|Caution)\s*:?\*\*\s*(.*)$/i;
const EMOJI_PREFIX_MAP = [
  { re: /^>\s*(?:⚠️|⚠)\s*(.*)$/, kind: 'WARNING' },
  { re: /^>\s*(?:💡)\s*(.*)$/, kind: 'TIP' },
  { re: /^>\s*(?:ℹ️|ℹ)\s*(.*)$/, kind: 'NOTE' },
  { re: /^>\s*(?:❗|🚨)\s*(.*)$/, kind: 'IMPORTANT' },
  { re: /^>\s*(?:🛑|⛔)\s*(.*)$/, kind: 'CAUTION' },
];
const ADMONITION_BLOCK_RE = /:::(note|tip|important|warning|caution)([\s\S]*?):::/gi;

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: beautify-callouts.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  let total = 0;
  let filesTouched = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const { next, count } = transform(content);
    if (count > 0) {
      total += count;
      filesTouched++;
      if (!dry) fs.writeFileSync(page, next, 'utf8');
      console.log(`[beautify-callouts] ${dry ? '[dry] ' : ''}${path.basename(page)}: ${count} callouts`);
    }
  }
  console.log(`[beautify-callouts] ${dry ? '[dry] ' : ''}${total} callouts rewritten across ${filesTouched} files`);
  process.exit(0);
}

function transform(content) {
  let count = 0;

  // Admonition blocks :::note ... ::: (fence-safe: ignore inside ```)
  const next = utils.replaceOutsideFences(content, (prose) =>
    prose.replace(ADMONITION_BLOCK_RE, (_m, kind, body) => {
      count++;
      const upper = kind.toUpperCase();
      const lines = body.trim().split('\n').map((l) => `> ${l.trim()}`).join('\n');
      return `> [!${upper}]\n${lines}`;
    })
  );

  // Inline ">\s*\*\*Note:\*\*" and emoji prefixes (line-by-line)
  const lines = next.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const bold = BOLD_PREFIX_RE.exec(line);
    if (bold) {
      count++;
      const [, kind, rest] = bold;
      const upper = kind.toUpperCase();
      lines[i] = `> [!${upper}]\n> ${rest}`;
      continue;
    }
    for (const { re, kind } of EMOJI_PREFIX_MAP) {
      const m = re.exec(line);
      if (m) {
        count++;
        lines[i] = `> [!${kind}]\n> ${m[1]}`;
        break;
      }
    }
  }

  return { next: lines.join('\n'), count };
}

main();
