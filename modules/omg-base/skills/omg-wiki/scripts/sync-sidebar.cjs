#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Regenerate _Sidebar.md by grouping pages via their frontmatter wikiSection.
 * Pages without wikiSection go into an "Uncategorized" bucket. Home is pinned
 * at the top regardless of section.
 *
 * Preserves a manually-maintained sidebar prefix/suffix if the file contains
 * the markers:
 *   <!-- omg-wiki:sidebar:manual-prefix -->
 *   ...manually written content...
 *   <!-- omg-wiki:sidebar:auto-start -->
 *   ...generated content...
 *   <!-- omg-wiki:sidebar:auto-end -->
 *   <!-- omg-wiki:sidebar:manual-suffix -->
 *   ...manually written content...
 *
 * If no markers are present, the entire file is rewritten.
 *
 * Usage: node sync-sidebar.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');
const { parseFrontmatter } = require('./validate-frontmatter.cjs');

const AUTO_START = '<!-- omg-wiki:sidebar:auto-start -->';
const AUTO_END = '<!-- omg-wiki:sidebar:auto-end -->';

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: sync-sidebar.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  const groups = new Map();
  let homeEntry = null;
  for (const page of pages) {
    const filename = path.basename(page);
    const pageTitle = filename.replace(/\.md$/, '').replace(/-/g, ' ');
    const content = fs.readFileSync(page, 'utf8');
    const fm = parseFrontmatter(content);
    const section = (fm && fm.data.wikiSection) || 'Uncategorized';
    const title = (fm && fm.data.title) || pageTitle;
    const entry = { title, filename, pageType: fm && fm.data['page-type'] };
    if (filename === 'Home.md') {
      homeEntry = entry;
      continue;
    }
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(entry);
  }

  // Sort sections and entries
  const sortedSections = Array.from(groups.keys()).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });
  for (const s of sortedSections) {
    groups.get(s).sort((a, b) => a.title.localeCompare(b.title));
  }

  const autoBody = buildAuto(homeEntry, sortedSections, groups);
  const sidebarPath = path.join(wikiDir, '_Sidebar.md');
  let nextContent;
  if (fs.existsSync(sidebarPath)) {
    const current = fs.readFileSync(sidebarPath, 'utf8');
    if (current.includes(AUTO_START) && current.includes(AUTO_END)) {
      nextContent = current.replace(
        new RegExp(`${escapeRegex(AUTO_START)}[\\s\\S]*?${escapeRegex(AUTO_END)}`),
        `${AUTO_START}\n${autoBody}\n${AUTO_END}`
      );
    } else {
      nextContent = `${AUTO_START}\n${autoBody}\n${AUTO_END}\n`;
    }
  } else {
    nextContent = `${AUTO_START}\n${autoBody}\n${AUTO_END}\n`;
  }

  if (!dry) fs.writeFileSync(sidebarPath, nextContent, 'utf8');
  console.log(`[sync-sidebar] ${dry ? '[dry] ' : ''}wrote ${sidebarPath} (${pages.length} pages, ${sortedSections.length} sections)`);
  process.exit(0);
}

function buildAuto(homeEntry, sortedSections, groups) {
  const lines = [];
  if (homeEntry) {
    lines.push(`- [${homeEntry.title}](Home)`);
    lines.push('');
  }
  for (const section of sortedSections) {
    lines.push(`## ${section}`);
    lines.push('');
    for (const entry of groups.get(section)) {
      const base = entry.filename.replace(/\.md$/, '');
      const typeTag = entry.pageType ? ` _(${entry.pageType})_` : '';
      lines.push(`- [${entry.title}](${base})${typeTag}`);
    }
    lines.push('');
  }
  return lines.join('\n').trimEnd();
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
