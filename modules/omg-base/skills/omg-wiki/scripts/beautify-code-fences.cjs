#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Add a language tag to every bare ``` fence.
 *   - Heuristic detection: inspect the fence body for shell/js/ts/python/bash
 *     signatures; default to "text" when nothing matches.
 *   - Preserves existing language tags (never overwrites).
 *
 * Usage: node beautify-code-fences.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

const DETECTORS = [
  // Each: { lang, test } — first match wins.
  { lang: 'bash', test: /^\s*(\$\s|#!\/.*\/(bash|sh|zsh)|git\s|npm\s|node\s|curl\s|brew\s|apt\s|sudo\s|ls\s|cd\s|cp\s|mv\s|rm\s|mkdir\s)/m },
  { lang: 'javascript', test: /^\s*(const\s|let\s|var\s|function\s|import\s|require\(|=>\s*\{|module\.exports)/m },
  { lang: 'typescript', test: /^\s*(interface\s+\w|type\s+\w+\s*=|enum\s+\w|export\s+(interface|type|enum))/m },
  { lang: 'python', test: /^\s*(def\s|class\s|import\s|from\s+\w+\s+import|print\()/m },
  { lang: 'json', test: /^\s*[\{\[][\s\S]*[\}\]]\s*$/ },
  { lang: 'yaml', test: /^\s*[\w-]+:\s/m },
  { lang: 'csharp', test: /^\s*(using\s+\w|public\s+class|namespace\s+\w|public\s+static\s+void\s+Main)/m },
  { lang: 'html', test: /^\s*<(html|div|p|span|h\d|script|style)\b/i },
  { lang: 'css', test: /^[.#]?[\w-]+\s*\{[^}]*\}/m },
  { lang: 'sql', test: /^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/im },
  { lang: 'markdown', test: /^(#{1,6}\s|>\s|\*\s|-\s|\d+\.\s|\|\s)/m },
];

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: beautify-code-fences.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  let total = 0;
  let files = 0;
  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const { next, count } = process_(content);
    if (count > 0) {
      total += count;
      files++;
      if (!dry) fs.writeFileSync(page, next, 'utf8');
      console.log(`[beautify-code-fences] ${dry ? '[dry] ' : ''}${path.basename(page)}: +${count} tags`);
    }
  }
  console.log(`[beautify-code-fences] ${dry ? '[dry] ' : ''}${total} fences tagged across ${files} files`);
  process.exit(0);
}

// Fence regex: opener (with optional language tag) OR closer (always bare).
// We pair them up sequentially so we never tag a closing fence.
const BARE_FENCE_RE = /^(\s*)```\s*$/;
const TAGGED_FENCE_RE = /^(\s*)```[\w+-]+\s*$/;

function process_(content) {
  const lines = content.split('\n');
  const out = lines.slice();
  let count = 0;

  // Fence-pair state machine — fixes #78.
  // Without state, every bare ``` looks like an opener, so closers get tagged
  // (and the next opener stays bare). With state, we track whether we're inside
  // a block and only tag bare openers.
  let insideBlock = false;
  let openerIdx = -1;
  let openerWasBare = false;

  for (let i = 0; i < out.length; i++) {
    const line = out[i];
    const bare = BARE_FENCE_RE.exec(line);
    const tagged = TAGGED_FENCE_RE.exec(line);
    if (!bare && !tagged) continue;

    if (!insideBlock) {
      // Opening a new block. Remember whether it was bare so we can decide
      // whether to tag it once we see the closer.
      insideBlock = true;
      openerIdx = i;
      openerWasBare = !!bare;
      continue;
    }

    // We're inside a block — this fence is the closer (bare or tagged
    // doesn't matter; markdown closes blocks on the next ``` line of any
    // form). Only tag the opener if it was bare; closers stay bare.
    if (openerWasBare) {
      const body = out.slice(openerIdx + 1, i).join('\n');
      const lang = detectLanguage(body);
      const m = BARE_FENCE_RE.exec(out[openerIdx]);
      out[openerIdx] = `${m[1]}\`\`\`${lang}`;
      count++;
    }
    insideBlock = false;
    openerIdx = -1;
    openerWasBare = false;
  }

  return { next: out.join('\n'), count };
}

function detectLanguage(body) {
  for (const d of DETECTORS) {
    if (d.test.test(body)) return d.lang;
  }
  return 'text';
}

main();
