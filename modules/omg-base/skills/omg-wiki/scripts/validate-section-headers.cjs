#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Validate that each page has the canonical H2 sections for its Diátaxis
 * page-type. Missing sections are WARN (allows gradual adoption); out-of-order
 * sections are WARN.
 *
 *   reference    → Overview, Syntax, Constraints, Examples, See Also
 *   how-to       → Prerequisites, Steps, Validation, Troubleshooting
 *   tutorial     → Objectives, Setup, Walkthrough, Wrap-Up
 *   explanation  → Context, Core Concepts, Best Practices, Related Links
 *
 * Usage: node validate-section-headers.cjs <wiki-dir> [--verbose]
 * Exit:  0 always (warnings only). Blocking enforcement can be opted-in later.
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');
const { parseFrontmatter } = require('./validate-frontmatter.cjs');

const TEMPLATES = {
  reference: ['Overview', 'Syntax', 'Constraints', 'Examples', 'See Also'],
  'how-to': ['Prerequisites', 'Steps', 'Validation', 'Troubleshooting'],
  tutorial: ['Objectives', 'Setup', 'Walkthrough', 'Wrap-Up'],
  explanation: ['Context', 'Core Concepts', 'Best Practices', 'Related Links'],
};

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const verbose = flags.includes('--verbose');
  if (!wikiDir) {
    console.error('usage: validate-section-headers.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  let warnings = 0;
  let checked = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) continue; // frontmatter validator already flagged this
    const pageType = String(fm.data['page-type'] || '').trim();
    const required = TEMPLATES[pageType];
    if (!required) continue;
    checked++;
    const h2s = extractH2Headings(content);
    const h2Set = new Set(h2s.map((h) => normalize(h.text)));
    for (const req of required) {
      if (!h2Set.has(normalize(req))) {
        utils.ghWarning(
          page,
          fm.endLine,
          `[${pageType}] missing canonical section: "## ${req}" — templates improve AI retrieval + human scanning`
        );
        warnings++;
      }
    }
    // Order check: the first required section that exists should appear before others
    const positions = required
      .map((r) => ({ r, idx: h2s.findIndex((h) => normalize(h.text) === normalize(r)) }))
      .filter((x) => x.idx >= 0);
    for (let i = 1; i < positions.length; i++) {
      if (positions[i].idx < positions[i - 1].idx) {
        utils.ghWarning(
          page,
          fm.endLine,
          `[${pageType}] section order drift: "${positions[i].r}" appears before "${positions[i - 1].r}"`
        );
        warnings++;
        break;
      }
    }
  }

  if (verbose) {
    console.log(`[section-headers] scanned ${checked} typed pages (${pages.length - checked} untyped / exempt)`);
  }
  console.log(`[section-headers] OK — ${warnings} warnings${warnings ? ' (non-blocking)' : ''}`);
  process.exit(0);
}

function extractH2Headings(content) {
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
    if (m) out.push({ text: m[1], line: i + 1 });
  }
  return out;
}

function normalize(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
}

main();
