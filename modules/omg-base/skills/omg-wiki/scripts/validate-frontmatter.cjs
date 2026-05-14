#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Validate YAML frontmatter on every wiki page.
 *
 * Required fields (Diátaxis + RAG-friendly):
 *   - page-type: tutorial | how-to | reference | explanation
 *   - summary: <=200 chars (drives RAG relevance filtering)
 *   - audiences: non-empty list, subset of known tags
 *   - wikiSection: short string (drives sidebar grouping)
 *
 * Optional fields:
 *   - keywords: list, <=8 entries
 *   - related: list of page names that must exist
 *   - lastUpdated: ISO date (YYYY-MM-DD)
 *
 * _Sidebar.md and _Footer.md are exempt (they are GitHub-special structural pages).
 *
 * Usage: node validate-frontmatter.cjs <wiki-dir> [--verbose]
 * Exit:  0 on pass, 1 on any FAIL.
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

const PAGE_TYPES = new Set(['tutorial', 'how-to', 'reference', 'explanation']);
const KNOWN_AUDIENCES = new Set([
  'ai',
  'ai-agent',
  'human',
  'human-engineer',
  'human-designer',
  'human-pm',
  'gamedev-artist',
  'maintainer',
  'contributor',
]);

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const verbose = flags.includes('--verbose');
  if (!wikiDir) {
    console.error('usage: validate-frontmatter.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  const pageNames = new Set(pages.map((p) => path.basename(p)));
  let failures = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) {
      utils.ghError(page, 1, 'missing YAML frontmatter — add --- page-type / summary / audiences / wikiSection');
      failures++;
      continue;
    }
    failures += checkRequired(page, fm);
    failures += checkOptional(page, fm, pageNames);
  }

  if (verbose) {
    console.log(`[frontmatter] scanned ${pages.length} pages`);
  }
  if (failures === 0) {
    console.log(`[frontmatter] OK — ${pages.length} pages`);
    process.exit(0);
  }
  console.error(`[frontmatter] FAIL — ${failures} violations`);
  process.exit(1);
}

function checkRequired(page, fm) {
  let failures = 0;
  if (!fm.data['page-type']) {
    utils.ghError(page, fm.startLine, 'missing required frontmatter: page-type (tutorial|how-to|reference|explanation)');
    failures++;
  } else if (!PAGE_TYPES.has(String(fm.data['page-type']).trim())) {
    utils.ghError(
      page,
      fm.startLine,
      `invalid page-type: "${fm.data['page-type']}" — must be one of: ${Array.from(PAGE_TYPES).join(', ')}`
    );
    failures++;
  }
  if (!fm.data.summary) {
    utils.ghError(page, fm.startLine, 'missing required frontmatter: summary (<=200 chars, drives RAG retrieval)');
    failures++;
  } else if (String(fm.data.summary).length > 200) {
    utils.ghWarning(page, fm.startLine, `summary > 200 chars (${String(fm.data.summary).length}) — shorten for better RAG weighting`);
  }
  if (!fm.data.audiences || !Array.isArray(fm.data.audiences) || fm.data.audiences.length === 0) {
    utils.ghError(page, fm.startLine, 'missing required frontmatter: audiences (non-empty list, e.g. [ai, human])');
    failures++;
  } else {
    for (const a of fm.data.audiences) {
      if (!KNOWN_AUDIENCES.has(String(a).trim())) {
        utils.ghWarning(page, fm.startLine, `unknown audience tag: "${a}" — known: ${Array.from(KNOWN_AUDIENCES).join(', ')}`);
      }
    }
  }
  if (!fm.data.wikiSection) {
    utils.ghWarning(page, fm.startLine, 'missing wikiSection — used for sidebar grouping; defaulting to "Uncategorized"');
  }
  return failures;
}

function checkOptional(page, fm, pageNames) {
  let failures = 0;
  if (fm.data.keywords) {
    if (!Array.isArray(fm.data.keywords)) {
      utils.ghError(page, fm.startLine, 'keywords must be a list');
      failures++;
    } else if (fm.data.keywords.length > 8) {
      utils.ghWarning(page, fm.startLine, `keywords length > 8 (${fm.data.keywords.length}) — trim to improve retrieval`);
    }
  }
  if (fm.data.related) {
    if (!Array.isArray(fm.data.related)) {
      utils.ghError(page, fm.startLine, 'related must be a list of page names');
      failures++;
    } else {
      for (const r of fm.data.related) {
        const expected = utils.linkTargetToFilename(String(r));
        if (!expected || !pageNames.has(expected)) {
          utils.ghError(page, fm.startLine, `related page not found: "${r}"`);
          failures++;
        }
      }
    }
  }
  if (fm.data.lastUpdated && !/^\d{4}-\d{2}-\d{2}$/.test(String(fm.data.lastUpdated))) {
    utils.ghWarning(page, fm.startLine, `lastUpdated should be ISO date YYYY-MM-DD, got "${fm.data.lastUpdated}"`);
  }
  return failures;
}

/**
 * Minimal YAML frontmatter parser — supports scalars, single-line flow lists,
 * and block lists. Deliberately does NOT pull in js-yaml (this skill ships in
 * a hook-only runtime with no npm install).
 */
function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return null;
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      end = i;
      break;
    }
  }
  if (end < 0) return null;
  const data = {};
  let currentKey = null;
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (/^\s*#/.test(line)) continue;
    // Block-list entry: "  - value"
    const blockItem = /^\s*-\s+(.+)$/.exec(line);
    if (blockItem && currentKey && Array.isArray(data[currentKey])) {
      data[currentKey].push(stripQuotes(blockItem[1].trim()));
      continue;
    }
    const kv = /^([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, k, rawVal] = kv;
    currentKey = k;
    const val = rawVal.trim();
    if (val === '') {
      data[k] = []; // assume block list will follow (or stays empty)
    } else if (val.startsWith('[') && val.endsWith(']')) {
      data[k] = val
        .slice(1, -1)
        .split(',')
        .map((s) => stripQuotes(s.trim()))
        .filter(Boolean);
    } else {
      data[k] = stripQuotes(val);
    }
  }
  return { data, startLine: 1, endLine: end + 1 };
}

function stripQuotes(s) {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

module.exports = { parseFrontmatter };
if (require.main === module) main();
