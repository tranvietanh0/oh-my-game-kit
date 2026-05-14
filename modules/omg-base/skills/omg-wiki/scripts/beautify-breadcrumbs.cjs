#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Insert or refresh a breadcrumb line at the top of each page (after H1):
 *   > [Home](Home) › <wikiSection> › <current page>
 *
 * Wrapped in a marker block so re-runs replace cleanly:
 *   <!-- omg-wiki:breadcrumb:start -->
 *   > [Home](Home) › Section › Page
 *   <!-- omg-wiki:breadcrumb:end -->
 *
 * Skipped for Home.md and pages without a wikiSection (no hierarchy to show).
 *
 * Usage: node beautify-breadcrumbs.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');
const { parseFrontmatter } = require('./validate-frontmatter.cjs');

const BC_START = '<!-- omg-wiki:breadcrumb:start -->';
const BC_END = '<!-- omg-wiki:breadcrumb:end -->';

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: beautify-breadcrumbs.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  let updated = 0;
  for (const page of pages) {
    const filename = path.basename(page);
    if (filename === 'Home.md') continue;
    const content = fs.readFileSync(page, 'utf8');
    const fm = parseFrontmatter(content);
    const section = fm && fm.data.wikiSection;
    const title = (fm && fm.data.title) || filename.replace(/\.md$/, '').replace(/-/g, ' ');
    if (!section || section === 'Uncategorized') {
      // No hierarchy worth showing — strip any stale block
      const stripped = stripBlock(content);
      if (stripped !== content) {
        updated++;
        if (!dry) fs.writeFileSync(page, stripped, 'utf8');
      }
      continue;
    }
    const next = applyBreadcrumb(content, section, title);
    if (next !== content) {
      updated++;
      if (!dry) fs.writeFileSync(page, next, 'utf8');
      console.log(`[beautify-breadcrumbs] ${dry ? '[dry] ' : ''}${filename}`);
    }
  }
  console.log(`[beautify-breadcrumbs] ${dry ? '[dry] ' : ''}${updated}/${pages.length} pages`);
  process.exit(0);
}

function applyBreadcrumb(content, section, title) {
  const line = `> [Home](Home) › ${section} › ${title}`;
  const block = `${BC_START}\n${line}\n${BC_END}`;
  // Fence-safe — only touch a marker block that lives in prose, not in a
  // code example that happens to reference the marker strings.
  if (hasProseBlock(content, BC_START, BC_END)) {
    return utils.replaceOutsideFences(content, (prose) =>
      prose.replace(
        new RegExp(`${escapeRegex(BC_START)}[\\s\\S]*?${escapeRegex(BC_END)}`),
        block
      )
    );
  }
  return insertAfterH1(content, `\n${block}\n`);
}

function hasProseBlock(content, startMarker, endMarker) {
  const { masked } = utils.maskFencedBlocks(content);
  return masked.includes(startMarker) && masked.includes(endMarker);
}

function stripBlock(content) {
  if (!hasProseBlock(content, BC_START, BC_END)) return content;
  return utils.replaceOutsideFences(content, (prose) =>
    prose.replace(
      new RegExp(`\\n?${escapeRegex(BC_START)}[\\s\\S]*?${escapeRegex(BC_END)}\\n?`),
      '\n'
    )
  );
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
  if (h1Idx < 0) return content;
  lines.splice(h1Idx + 1, 0, block);
  return lines.join('\n');
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
