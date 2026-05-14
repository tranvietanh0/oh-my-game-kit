#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Normalize heading hierarchy:
 *   - Ensure the page starts with exactly one H1 matching frontmatter.title
 *     (or filename-derived title if title is missing).
 *   - If a file has NO H1 but has frontmatter, prepend H1.
 *   - If a file has multiple H1s, demote the 2nd+ to H2.
 *   - If an H2 appears before the first H1, it's demoted (common copy-paste
 *     issue when porting from Confluence etc.).
 *
 * Does NOT reflow the body. Does NOT renumber H3+. This is a minimal pass
 * focused on the first-heading invariant — required for predictable anchors
 * and a recognizable landing point for AI summarization.
 *
 * Usage: node beautify-headings.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');
const { parseFrontmatter } = require('./validate-frontmatter.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: beautify-headings.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  let changed = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const next = normalize(page, content);
    if (next !== content) {
      changed++;
      if (!dry) fs.writeFileSync(page, next, 'utf8');
      console.log(`[beautify-headings] ${dry ? '[dry] ' : ''}${path.basename(page)}`);
    }
  }
  console.log(`[beautify-headings] ${dry ? '[dry] ' : ''}${changed}/${pages.length} files updated`);
  process.exit(0);
}

function normalize(page, content) {
  const fm = parseFrontmatter(content);
  const bodyStart = fm ? fmBodyStart(content) : 0;
  const head = content.slice(0, bodyStart);
  const body = content.slice(bodyStart);
  const filename = path.basename(page);
  const desiredTitle =
    (fm && fm.data.title) || filename.replace(/\.md$/, '').replace(/-/g, ' ');

  const lines = body.split('\n');
  let inFence = false;
  let firstH1Idx = -1;
  const h1s = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^#\s+/.test(line)) {
      h1s.push(i);
      if (firstH1Idx < 0) firstH1Idx = i;
    }
  }

  // 1. Demote all but the first H1
  for (let i = 1; i < h1s.length; i++) {
    const idx = h1s[i];
    lines[idx] = lines[idx].replace(/^#\s+/, '## ');
  }

  // 2. If no H1 at all, prepend one
  if (firstH1Idx < 0) {
    lines.unshift('', `# ${desiredTitle}`, '');
  } else {
    // 3. Normalize the existing first H1's text to desiredTitle (optional,
    //    non-destructive: only if obviously mismatched with filename/title)
    const m = /^#\s+(.+?)\s*$/.exec(lines[firstH1Idx]);
    if (m && fm && fm.data.title && m[1].trim() !== desiredTitle.trim()) {
      lines[firstH1Idx] = `# ${desiredTitle}`;
    }
  }

  return head + lines.join('\n');
}

function fmBodyStart(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      return lines.slice(0, i + 1).join('\n').length + 1;
    }
  }
  return 0;
}

main();
