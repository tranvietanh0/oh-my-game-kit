#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Normalize markdown tables:
 *   - Every row starts AND ends with | (GitHub is tolerant but padding looks ugly)
 *   - Every row has the same column count as the header
 *   - Separator row uses the right alignment marker (|---|, |:--|, |--:|, |:-:|)
 *   - Cells are padded to the max width per column for human readability
 *
 * Does NOT modify tables inside fenced code blocks.
 *
 * Usage: node beautify-tables.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: beautify-tables.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  let filesTouched = 0;
  let tablesFormatted = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const { next, formatted } = process_(content);
    if (formatted > 0) {
      filesTouched++;
      tablesFormatted += formatted;
      if (!dry) fs.writeFileSync(page, next, 'utf8');
      console.log(`[beautify-tables] ${dry ? '[dry] ' : ''}${path.basename(page)}: ${formatted} tables`);
    }
  }
  console.log(`[beautify-tables] ${dry ? '[dry] ' : ''}${tablesFormatted} tables formatted across ${filesTouched} files`);
  process.exit(0);
}

function process_(content) {
  const lines = content.split('\n');
  const out = [];
  let formatted = 0;
  let inFence = false;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      out.push(line);
      i++;
      continue;
    }
    if (inFence || !isTableStart(lines, i)) {
      out.push(line);
      i++;
      continue;
    }
    // Collect the table block
    let end = i + 1;
    while (end < lines.length && /\|/.test(lines[end]) && lines[end].trim() !== '') {
      end++;
    }
    const block = lines.slice(i, end);
    const pretty = formatTable(block);
    if (pretty && pretty.join('\n') !== block.join('\n')) {
      formatted++;
      out.push(...pretty);
    } else {
      out.push(...block);
    }
    i = end;
  }
  return { next: out.join('\n'), formatted };
}

function isTableStart(lines, i) {
  if (i + 1 >= lines.length) return false;
  const head = lines[i];
  const sep = lines[i + 1];
  if (!/\|/.test(head) || !/\|/.test(sep)) return false;
  // Separator row must have at least one dash-run
  return /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/.test(sep);
}

function formatTable(rows) {
  const parsed = rows.map((r) => parseRow(r));
  const cols = Math.max(...parsed.map((p) => p.length));
  // Pad each row to the same column count
  for (const p of parsed) while (p.length < cols) p.push('');
  // Extract alignment from separator row (index 1)
  const sep = parsed[1];
  const aligns = sep.map((cell) => {
    const trimmed = cell.trim();
    const left = trimmed.startsWith(':');
    const right = trimmed.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return 'left';
  });
  // Compute column widths (excluding separator row)
  const widths = new Array(cols).fill(3);
  for (let ri = 0; ri < parsed.length; ri++) {
    if (ri === 1) continue;
    for (let ci = 0; ci < cols; ci++) {
      widths[ci] = Math.max(widths[ci], parsed[ri][ci].trim().length);
    }
  }
  // Render rows
  const renderCell = (text, width, align) => {
    const t = text.trim();
    const pad = Math.max(0, width - t.length);
    if (align === 'right') return ' '.repeat(pad) + t + ' ';
    if (align === 'center') {
      const l = Math.floor(pad / 2);
      const r = pad - l;
      return ' '.repeat(l) + t + ' '.repeat(r) + ' ';
    }
    return ' ' + t + ' '.repeat(pad);
  };
  const out = [];
  for (let ri = 0; ri < parsed.length; ri++) {
    if (ri === 1) {
      out.push(
        '|' +
          aligns
            .map((a, ci) => {
              const w = widths[ci];
              if (a === 'center') return ':' + '-'.repeat(Math.max(1, w)) + ':';
              if (a === 'right') return '-'.repeat(Math.max(1, w + 1)) + ':';
              return ':' + '-'.repeat(Math.max(1, w + 1));
            })
            .join('|') +
          '|'
      );
      continue;
    }
    out.push('|' + parsed[ri].map((c, ci) => renderCell(c, widths[ci], aligns[ci])).join('|') + '|');
  }
  return out;
}

function parseRow(row) {
  let s = row.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|')) s = s.slice(0, -1);
  // Split on | that is not escaped (\\|)
  const cells = [];
  let cur = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '\\' && s[i + 1] === '|') {
      cur += '|';
      i++;
      continue;
    }
    if (ch === '|') {
      cells.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  cells.push(cur);
  return cells;
}

main();
