#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Insert or refresh an anchor-based TOC on pages with >=6 H2 sections.
 *
 * TOC is wrapped in a fenced marker block so re-runs replace cleanly:
 *   <!-- omg-wiki:toc:start -->
 *   ## Contents
 *   - [Section A](#section-a)
 *   ...
 *   <!-- omg-wiki:toc:end -->
 *
 * Placement: immediately after the first H1. Skipped if the file has fewer
 * than 6 H2s (small pages don't benefit from a TOC).
 *
 * Usage: node beautify-toc.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

const TOC_START = '<!-- omg-wiki:toc:start -->';
const TOC_END = '<!-- omg-wiki:toc:end -->';
const MIN_H2 = 6;

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: beautify-toc.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  let updated = 0;
  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const next = applyToc(content);
    if (next !== content) {
      updated++;
      if (!dry) fs.writeFileSync(page, next, 'utf8');
      console.log(`[beautify-toc] ${dry ? '[dry] ' : ''}${path.basename(page)}`);
    }
  }
  console.log(`[beautify-toc] ${dry ? '[dry] ' : ''}${updated}/${pages.length} pages with TOC refreshed`);
  process.exit(0);
}

function applyToc(content) {
  const h2s = extractH2(content);
  if (h2s.length < MIN_H2) {
    // Strip any stale TOC block when page shrinks below threshold
    return stripTocBlock(content);
  }
  const tocBody = buildToc(h2s);
  const block = `${TOC_START}\n\n## Contents\n\n${tocBody}\n\n${TOC_END}`;
  if (content.includes(TOC_START) && content.includes(TOC_END)) {
    return content.replace(
      new RegExp(`${escapeRegex(TOC_START)}[\\s\\S]*?${escapeRegex(TOC_END)}`),
      block
    );
  }
  // Insert after first H1
  return insertAfterH1(content, `\n${block}\n`);
}

function extractH2(content) {
  const out = [];
  const lines = content.split('\n');
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) out.push(m[1]);
  }
  return out;
}

function buildToc(h2s) {
  return h2s
    .filter((h) => h !== 'Contents')
    .map((h) => `- [${h}](#${slug(h)})`)
    .join('\n');
}

function slug(heading) {
  // GitHub slug: lowercase, remove punct except hyphens, spaces → hyphens
  return heading
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

function insertAfterH1(content, block) {
  const lines = content.split('\n');
  let inFence = false;
  let h1Idx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i].trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^#\s+/.test(lines[i])) {
      h1Idx = i;
      break;
    }
  }
  if (h1Idx < 0) return content + block;
  lines.splice(h1Idx + 1, 0, block);
  return lines.join('\n');
}

function stripTocBlock(content) {
  if (!content.includes(TOC_START)) return content;
  return content.replace(
    new RegExp(`\\n?${escapeRegex(TOC_START)}[\\s\\S]*?${escapeRegex(TOC_END)}\\n?`),
    '\n'
  );
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
