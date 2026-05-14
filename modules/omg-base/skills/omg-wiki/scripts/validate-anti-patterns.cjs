#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Flag prose patterns that degrade RAG retrieval + human scanning:
 *   1. "As mentioned above" / "see above" / "as discussed earlier"
 *      → AI may not have the referenced chunk in context; always name the target.
 *   2. Non-self-contained H2 headings ("Overview", "Introduction", "Details")
 *      → Headings are chunk labels; bare "Overview" provides no retrieval signal.
 *   3. Section-leading pronoun ("It", "This", "That" as the first word of a
 *      sentence right after a heading)
 *      → Breaks coreference when the chunk is retrieved standalone.
 *   4. Mermaid %%{init: ... theme: ...}%% overrides
 *      → Breaks the opposite GitHub theme; prefer per-node color instead.
 *   5. Code fences without a language tag
 *      → Harms syntax highlighting AND AI's ability to recognize language.
 *
 * Usage: node validate-anti-patterns.cjs <wiki-dir> [--verbose]
 * Exit:  0 always (warnings only).
 */

const fs = require('fs');
const path = require('path');
const utils = require('./lib/wiki-utils.cjs');

const AMBIGUOUS_REFS = /\b(as (?:mentioned|discussed|noted) (?:above|earlier|previously)|see (?:above|previous section)|shown (?:above|previously))\b/i;
const LEADING_PRONOUN = /^(It|This|That|These|Those|They)\b/;
const BARE_HEADINGS = new Set([
  'overview',
  'introduction',
  'details',
  'summary',
  'notes',
  'background',
]);

function main() {
  const [, , wikiDir, ...flags] = process.argv;
  const verbose = flags.includes('--verbose');
  if (!wikiDir) {
    console.error('usage: validate-anti-patterns.cjs <wiki-dir>');
    process.exit(2);
  }
  const pages = utils.listPages(wikiDir, { includeReserved: false });
  let warnings = 0;

  for (const page of pages) {
    const content = fs.readFileSync(page, 'utf8');
    const lines = content.split('\n');
    let inFence = false;
    let fenceLanguageCheckedFor = null;
    let lastH2Line = -1;
    let lastH2Text = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Code fence tracking
      if (trimmed.startsWith('```')) {
        if (!inFence) {
          const lang = trimmed.slice(3).trim();
          if (!lang) {
            utils.ghWarning(page, i + 1, 'code fence without language tag — hurts syntax highlighting + AI language recognition');
            warnings++;
          }
          inFence = true;
          fenceLanguageCheckedFor = i;
        } else {
          inFence = false;
        }
        continue;
      }
      if (inFence) {
        // Check for mermaid init theme overrides
        if (/%%\s*\{\s*init\s*:\s*\{[^}]*theme\s*:/i.test(line)) {
          utils.ghWarning(
            page,
            i + 1,
            'mermaid %%{init: ... theme}%% breaks the opposite GitHub theme — prefer per-node color via style/classDef'
          );
          warnings++;
        }
        continue;
      }

      // H2 tracking for "leading pronoun after heading" check
      const h2 = /^##\s+(.+?)\s*$/.exec(line);
      if (h2) {
        lastH2Line = i;
        lastH2Text = h2[1];
        const norm = h2[1].toLowerCase().trim();
        if (BARE_HEADINGS.has(norm)) {
          utils.ghWarning(
            page,
            i + 1,
            `non-self-contained heading "## ${h2[1]}" — add a topic qualifier (e.g., "Architecture Overview") for retrieval`
          );
          warnings++;
        }
        continue;
      }

      // Ambiguous back-references
      if (AMBIGUOUS_REFS.test(line)) {
        utils.ghWarning(
          page,
          i + 1,
          'ambiguous back-reference ("as mentioned above" / "see above") — replace with explicit §Section or [[Page]] link'
        );
        warnings++;
      }

      // Leading pronoun right after an H2 (first non-blank content line)
      if (
        lastH2Line >= 0 &&
        i === lastH2Line + 1 &&
        trimmed === ''
      ) {
        // Skip blank line — check next iteration
        continue;
      }
      if (
        lastH2Line >= 0 &&
        i > lastH2Line &&
        i <= lastH2Line + 3 &&
        trimmed &&
        !trimmed.startsWith('>') &&
        !trimmed.startsWith('|') &&
        LEADING_PRONOUN.test(trimmed)
      ) {
        utils.ghWarning(
          page,
          i + 1,
          `section "${lastH2Text}" opens with pronoun — use full noun for AI retrieval (chunks have no prior context)`
        );
        warnings++;
        lastH2Line = -1; // only flag once per section
      }
    }
  }

  if (verbose) {
    console.log(`[anti-patterns] scanned ${pages.length} pages`);
  }
  console.log(`[anti-patterns] OK — ${warnings} warnings${warnings ? ' (non-blocking)' : ''}`);
  process.exit(0);
}

main();
