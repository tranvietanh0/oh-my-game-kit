// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
'use strict';
/**
 * backwards-compat.test.cjs — Regression guard for omg-preview pre-T2 flags.
 *
 * Purpose: prove that adding --syntax, --from-file, --refresh, --engine, --out-dir
 * (T2 extensions) did NOT remove or reorder any flag that existed before T2.
 *
 * Strategy: static analysis of SKILL.md only — no runtime invocation needed
 * because the actual generation is Codex runtime behaviour (not a standalone
 * binary). Tests parse the documented interface to assert invariants.
 *
 * Run: node .agents/skillsomg-preview/scripts/tests/backwards-compat.test.cjs
 */

const fs = require('fs');
const path = require('path');

// ── Harness ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function run(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`  PASS  ${name}\n`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    process.stdout.write(`  FAIL  ${name}\n       ${err.message}\n`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ── Load SKILL.md ────────────────────────────────────────────────────────────

const SKILL_MD = path.resolve(__dirname, '../../SKILL.md');
const content = fs.readFileSync(SKILL_MD, 'utf8');

// ── Pre-T2 flags that MUST still be documented ───────────────────────────────

const PRE_T2_FLAGS = ['--explain', '--slides', '--diagram', '--ascii', '--html', '--stop'];

// ── New T2 flags (additive — must exist but must NOT replace pre-T2 flags) ──

const T2_FLAGS = ['--syntax', '--from-file', '--refresh', '--engine', '--out-dir'];

// ── Pre-T2 argument-resolution priority order (positional labels) ───────────
// These labels appeared in the "Argument Resolution Priority" section before T2.
// --refresh was inserted as the new #2 item; all others must still be present
// and the relative order of the surviving pre-T2 items must be preserved.

const PRE_T2_PRIORITY_LABELS = [
  '--stop',
  '--html',
  '--explain',
  '--slides',
  '--diagram',
  '--ascii',
];

// ── Tests ────────────────────────────────────────────────────────────────────

run('SKILL.md exists and is non-empty', () => {
  assert(fs.existsSync(SKILL_MD), `SKILL.md not found at: ${SKILL_MD}`);
  assert(content.length > 200, 'SKILL.md appears truncated');
});

for (const flag of PRE_T2_FLAGS) {
  run(`pre-T2 flag ${flag} still documented`, () => {
    assert(content.includes(flag), `Missing pre-T2 flag: ${flag}`);
  });
}

for (const flag of T2_FLAGS) {
  run(`T2 flag ${flag} is additive (present in SKILL.md)`, () => {
    assert(content.includes(flag), `T2 flag missing from SKILL.md: ${flag}`);
  });
}

run('Mermaid is documented as the default for --diagram', () => {
  // Either "Default: mermaid" or "default" near "mermaid" in same section.
  const lower = content.toLowerCase();
  const mermaidIdx = lower.indexOf('mermaid');
  const defaultIdx = lower.indexOf('default');
  assert(mermaidIdx !== -1, 'No mention of "mermaid" in SKILL.md');
  assert(defaultIdx !== -1, 'No mention of "default" in SKILL.md');
  // They must appear within 300 chars of each other somewhere in the file.
  const found = (function () {
    let idx = 0;
    while (true) {
      const mi = lower.indexOf('mermaid', idx);
      if (mi === -1) return false;
      const di = lower.indexOf('default', Math.max(0, mi - 300));
      if (di !== -1 && Math.abs(di - mi) <= 300) return true;
      idx = mi + 1;
    }
  })();
  assert(found, '"mermaid" and "default" must co-occur within 300 chars in SKILL.md');
});

run('Backwards-compatibility note is present', () => {
  const hasNote =
    content.includes('Backwards compatibility') ||
    content.includes('backwards compat') ||
    content.includes('unchanged when no') ||
    content.includes('defaults to mermaid');
  assert(hasNote, 'No backwards-compatibility note found in SKILL.md');
});

run('Pre-T2 priority order preserved in Argument Resolution section', () => {
  const sectionMatch = content.match(/## Argument Resolution Priority[\s\S]*?(?=^##|\z)/m);
  assert(sectionMatch, 'Section "Argument Resolution Priority" not found in SKILL.md');
  const section = sectionMatch[0];

  // Extract ordered labels from numbered lines: "1. `--stop`" etc.
  const labelRe = /`(--[a-z-]+)`/g;
  const found = [];
  let m;
  while ((m = labelRe.exec(section)) !== null) {
    if (PRE_T2_PRIORITY_LABELS.includes(m[1]) && !found.includes(m[1])) {
      found.push(m[1]);
    }
  }

  for (const label of PRE_T2_PRIORITY_LABELS) {
    assert(found.includes(label), `Pre-T2 priority label ${label} missing from section`);
  }

  // Verify relative order matches PRE_T2_PRIORITY_LABELS (no reordering).
  const indices = PRE_T2_PRIORITY_LABELS.map((l) => found.indexOf(l));
  for (let i = 1; i < indices.length; i++) {
    assert(
      indices[i] > indices[i - 1],
      `Pre-T2 priority order violated: ${PRE_T2_PRIORITY_LABELS[i - 1]} should precede ${PRE_T2_PRIORITY_LABELS[i]}`
    );
  }
});

run('--refresh inserted as new step without displacing --stop as first', () => {
  const sectionMatch = content.match(/## Argument Resolution Priority[\s\S]*?(?=^##|\z)/m);
  assert(sectionMatch, 'Section "Argument Resolution Priority" not found');
  const section = sectionMatch[0];

  // --stop must still appear before --refresh in the priority list.
  const stopIdx = section.indexOf('--stop');
  const refreshIdx = section.indexOf('--refresh');
  assert(stopIdx !== -1, '--stop missing from Argument Resolution Priority section');
  assert(refreshIdx !== -1, '--refresh missing from Argument Resolution Priority section');
  assert(stopIdx < refreshIdx, '--stop must appear before --refresh (--stop is priority #1)');
});

run('--diagram is in Modes Quick Reference table', () => {
  const tableMatch = content.match(/## Modes Quick Reference[\s\S]*?(?=^##|\z)/m);
  assert(tableMatch, '"Modes Quick Reference" section not found');
  assert(tableMatch[0].includes('--diagram'), '--diagram missing from Modes Quick Reference table');
});

run('Generation Flags table lists --syntax as modifier (not replacement)', () => {
  const tableSectionMatch = content.match(/## Generation Flags[\s\S]*?(?=^##|\z)/m);
  assert(tableSectionMatch, '"Generation Flags" section not found');
  const section = tableSectionMatch[0];
  assert(section.includes('--syntax'), '--syntax not in Generation Flags table');
  // The modifier cell must say "Modifier for" (not "Replaces" or "Overrides --diagram").
  assert(
    section.includes('Modifier for') || section.includes('modifier'),
    '--syntax should be documented as a Modifier, not a replacement'
  );
});

// ── Summary ──────────────────────────────────────────────────────────────────

process.stdout.write(`\n  ${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.stdout.write('\nFailed tests:\n');
  for (const f of failures) process.stdout.write(`  - ${f.name}: ${f.error}\n`);
  process.exit(1);
}
