#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Ensure every wiki page has canonical frontmatter. If a field is missing,
 * inject a sensible default:
 *   - page-type: inferred from H2 sections (first match wins) or "reference"
 *   - summary: first non-heading paragraph of the body, trimmed to 160 chars
 *   - audiences: [ai, human]
 *   - wikiSection: "Uncategorized"
 *   - lastUpdated: today (UTC, ISO date)
 *   - title: H1 text or filename-derived title
 *
 * Non-destructive: existing fields are NEVER overwritten.
 *
 * Usage: node beautify-frontmatter.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');
const { parseFrontmatter } = require('./validate-frontmatter.cjs');

const INFER = [
  { match: /^(prereq|setup|steps|walkthrough|part\s*\d)/i, type: 'how-to' },
  { match: /^(objective|walkthrough|wrap[-\s]?up|setup)/i, type: 'tutorial' },
  { match: /^(context|core concept|best practice|related)/i, type: 'explanation' },
];

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: beautify-frontmatter.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  let updated = 0;
  const today = new Date().toISOString().slice(0, 10);

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const fm = parseFrontmatter(content);
    const next = injectMissing(page, content, fm, today);
    if (next !== content) {
      updated++;
      if (!dry) fs.writeFileSync(page, next, 'utf8');
      console.log(`[beautify-frontmatter] ${dry ? '[dry] ' : ''}patched ${path.basename(page)}`);
    }
  }
  console.log(`[beautify-frontmatter] ${dry ? '[dry] ' : ''}${updated}/${pages.length} files updated`);
  process.exit(0);
}

function injectMissing(page, content, fm, today) {
  const filename = path.basename(page);
  const titleFromFilename = filename.replace(/\.md$/, '').replace(/-/g, ' ');
  const body = fm ? content.slice(indexAfterFrontmatter(content)) : content;
  const h1 = extractH1(body);
  const inferredType = inferPageType(body);
  const inferredSummary = inferSummary(body);

  const defaults = {
    title: h1 || titleFromFilename,
    'page-type': inferredType || 'reference',
    summary: inferredSummary || `TODO: add a 1-line summary of ${titleFromFilename}`,
    audiences: ['ai', 'human'],
    wikiSection: 'Uncategorized',
    lastUpdated: today,
  };

  if (fm) {
    const missing = Object.entries(defaults).filter(([k]) => fm.data[k] === undefined);
    if (missing.length === 0) return content;
    return appendToFrontmatter(content, fm, missing);
  }

  // No frontmatter at all — prepend one
  return renderFullFrontmatter(defaults) + '\n' + content;
}

function indexAfterFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0] !== '---') return 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      // Position just after the closing --- line
      const before = lines.slice(0, i + 1).join('\n');
      return before.length + 1;
    }
  }
  return 0;
}

function extractH1(body) {
  const m = /^#\s+(.+?)\s*$/m.exec(body);
  return m ? m[1] : null;
}

function inferPageType(body) {
  const h2s = [];
  const lines = body.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^##\s+(.+?)\s*$/.exec(line);
    if (m) h2s.push(m[1]);
  }
  for (const h of h2s) {
    for (const rule of INFER) {
      if (rule.match.test(h)) return rule.type;
    }
  }
  return null;
}

function inferSummary(body) {
  const lines = body.split('\n');
  let inFence = false;
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('>') || trimmed.startsWith('|') || trimmed.startsWith('-') || trimmed.startsWith('*')) continue;
    // Found a prose paragraph
    const plain = trimmed.replace(/[*_`\[\]]/g, '').replace(/\s+/g, ' ');
    return plain.length > 160 ? plain.slice(0, 157) + '…' : plain;
  }
  return null;
}

function appendToFrontmatter(content, fm, missing) {
  const lines = content.split('\n');
  const endIdx = fm.endLine - 1; // 0-based index of the closing ---
  const additions = missing.map(([k, v]) => renderField(k, v));
  lines.splice(endIdx, 0, ...additions);
  return lines.join('\n');
}

function renderFullFrontmatter(data) {
  const out = ['---'];
  for (const [k, v] of Object.entries(data)) {
    out.push(renderField(k, v));
  }
  out.push('---');
  return out.join('\n');
}

function renderField(k, v) {
  if (Array.isArray(v)) {
    return `${k}: [${v.map((x) => JSON.stringify(String(x))).join(', ')}]`;
  }
  const s = String(v);
  // Quote values containing colons or leading special chars
  if (/[:#*&!]/.test(s) || s.length > 100) {
    return `${k}: ${JSON.stringify(s)}`;
  }
  return `${k}: ${s}`;
}

main();
