#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Validate that each H2 section is 100–800 tokens. Sections outside this
 * range are suboptimal for RAG retrieval:
 *   - <100 tokens: chunk is too thin to answer alone
 *   - >800 tokens: precision drops; relevant answer drowns in unrelated text
 *
 * Token count is approximated as words * 1.3 (GPT-style BPE average).
 * This is deliberately an approximation — don't pull tiktoken into the hook
 * runtime just for a heuristic.
 *
 * Usage: node validate-chunk-size.cjs <wiki-dir> [--verbose]
 * Exit:  0 always (warnings only).
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

const MIN_TOKENS = 100;
const MAX_TOKENS = 800;

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const verbose = flags.includes('--verbose');
  if (!wikiDir) {
    console.error('usage: validate-chunk-size.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  let warnings = 0;
  let scanned = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const sections = splitByH2(content);
    for (const s of sections) {
      scanned++;
      const tokens = approxTokens(s.body);
      if (tokens < MIN_TOKENS) {
        utils.ghWarning(
          page,
          s.line,
          `section "${s.heading}" is ~${tokens} tokens (< ${MIN_TOKENS}) — too thin for RAG; merge with sibling or expand`
        );
        warnings++;
      } else if (tokens > MAX_TOKENS) {
        utils.ghWarning(
          page,
          s.line,
          `section "${s.heading}" is ~${tokens} tokens (> ${MAX_TOKENS}) — split into subsections for better RAG precision`
        );
        warnings++;
      }
    }
  }

  if (verbose) {
    console.log(`[chunk-size] scanned ${scanned} sections across ${pages.length} pages (target ${MIN_TOKENS}–${MAX_TOKENS} tokens)`);
  }
  console.log(`[chunk-size] OK — ${warnings} warnings${warnings ? ' (non-blocking)' : ''}`);
  process.exit(0);
}

function splitByH2(content) {
  const lines = content.split('\n');
  const out = [];
  let cur = null;
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      if (cur) cur.body += line + '\n';
      continue;
    }
    if (!inFence) {
      const m = /^##\s+(.+?)\s*$/.exec(line);
      if (m) {
        if (cur) out.push(cur);
        cur = { heading: m[1], body: '', line: i + 1 };
        continue;
      }
    }
    if (cur) cur.body += line + '\n';
  }
  if (cur) out.push(cur);
  return out;
}

function approxTokens(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.round(words * 1.3);
}

main();
