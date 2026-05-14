#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Mermaid beautify pass — a superset of fix-mermaid-contrast:
 *   1. Strip %%{init: {... theme: ...}}%% overrides (break the opposite GitHub
 *      wiki theme). The exception: explicit `themeVariables` without `theme`
 *      is preserved.
 *   2. Ensure every `style` and `classDef` line has an explicit `color:` (via
 *      fix-mermaid-contrast logic — keeps the single source of truth).
 *   3. Add a trailing blank line after each mermaid block to avoid GitHub's
 *      fence-collapse rendering bug.
 *
 * Usage: node beautify-mermaid.cjs <wiki-dir> [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const dry = flags.includes('--dry-run');
  if (!wikiDir) {
    console.error('usage: beautify-mermaid.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: true });
  let total = { theme: 0, contrast: 0 };
  let filesTouched = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const { next, counts } = transform(content);
    if (counts.theme + counts.contrast > 0) {
      total.theme += counts.theme;
      total.contrast += counts.contrast;
      filesTouched++;
      if (!dry) fs.writeFileSync(page, next, 'utf8');
      console.log(
        `[beautify-mermaid] ${dry ? '[dry] ' : ''}${path.basename(page)}: ` +
          `theme=${counts.theme} contrast=${counts.contrast}`
      );
    }
  }
  console.log(
    `[beautify-mermaid] ${dry ? '[dry] ' : ''}${total.contrast} contrast fixes, ${total.theme} theme overrides removed (${filesTouched} files)`
  );
  process.exit(0);
}

function transform(content) {
  const lines = content.split('\n');
  const out = [];
  const counts = { theme: 0, contrast: 0 };
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!inFence && /^```\s*mermaid\b/i.test(trimmed)) {
      inFence = true;
      out.push(line);
      continue;
    }
    if (inFence && /^```\s*$/.test(trimmed)) {
      inFence = false;
      out.push(line);
      continue;
    }
    if (inFence) {
      // Strip theme override init lines
      if (/%%\s*\{\s*init\s*:\s*\{[^}]*theme\s*:[^}]*\}\s*\}%%/i.test(line)) {
        counts.theme++;
        continue; // drop the line entirely
      }
      // Contrast fix
      const info = utils.inspectStyleLine(line);
      if (info.match && !info.hasColor) {
        const trailingWs = line.match(/\s*$/)[0];
        const core = line.slice(0, line.length - trailingWs.length);
        out.push(`${core},color:${utils.MERMAID_TEXT_COLOR}${trailingWs}`);
        counts.contrast++;
        continue;
      }
    }
    out.push(line);
  }
  return { next: out.join('\n'), counts };
}

main();
