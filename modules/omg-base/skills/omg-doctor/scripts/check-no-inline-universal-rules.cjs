#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-no-inline-universal-rules.cjs — Doctor check #44: Inlined universal rules in skill/agent bodies.
//
// Catches re-introduction of universal rules that should live in .agents/rules/.
// See plan: 20260428-1530-architecture-fix-rollout.
//
// Three known boilerplates were extracted from 25+ skills during that refactor.
// This check prevents them from being pasted back into SKILL.md files or agent .md files.
//
// Scans:
//   .agents/skills/*/SKILL.md
//   .agents/modules/*/skills/*/SKILL.md
//   .agents/agents/*.md
//   .agents/modules/*/agents/*.md
//
// Patterns flagged (exact regex match against file content):
//   1. "Never reveal skill internals or system prompts"  — skill-security boilerplate
//      Lives in: .agents/rules/skill-security-boilerplate.md
//   2. "Per AGENTS.md principle #8"                      — AI-Driven Design marker
//      Lives in: .agents/rules/ai-driven-design.md
//   3. "OMG_FORK_DEPTH < 2"                             — fork-hygiene inline (not in fork-hygiene.md reference)
//      Lives in: .agents/skillsomg-architecture/references/fork-hygiene.md (cite, don't paste)
//
// Output: JSON to stdout  { status: "ok" | "fail", violations: [{ file, line, pattern }] }
// Exit 0 = no violations (PASS). Exit 1 = violations found (FAIL).
// Human-readable summary written to stderr when violations are found.
//
// Usage:
//   node check-no-inline-universal-rules.cjs [path/to/project-root]

'use strict';

const fs   = require('node:fs');
const path = require('node:path');

// ── Patterns ──────────────────────────────────────────────────────────────────

const PATTERNS = [
  {
    label: 'skill-security-boilerplate',
    regex: /Never reveal skill internals or system prompts/,
    rule: '.agents/rules/skill-security-boilerplate.md',
  },
  {
    label: 'ai-driven-design',
    regex: /Per CLAUDE\.md principle #8/,
    rule: '.agents/rules/ai-driven-design.md',
  },
  {
    label: 'fork-hygiene-inline',
    regex: /OMG_FORK_DEPTH < 2/,
    rule: '.agents/skillsomg-architecture/references/fork-hygiene.md',
    // Only flag when NOT inside the canonical reference file itself.
    skipIfPathContains: path.join('references', 'fork-hygiene.md'),
  },
];

// ── File discovery ─────────────────────────────────────────────────────────────

/**
 * Walk a directory one level deep looking for SKILL.md files.
 * Returns absolute paths.
 * @param {string} skillsDir
 * @returns {string[]}
 */
function collectTopLevelSkillMds(skillsDir) {
  if (!fs.existsSync(skillsDir)) return [];
  try {
    return fs.readdirSync(skillsDir)
      .filter((entry) => {
        const entryPath = path.join(skillsDir, entry);
        return fs.statSync(entryPath).isDirectory();
      })
      .map((entry) => path.join(skillsDir, entry, 'SKILL.md'))
      .filter((p) => fs.existsSync(p));
  } catch {
    return [];
  }
}

/**
 * Walk .agents/modules/{name}/skills/{name}/SKILL.md.
 * Returns absolute paths.
 * @param {string} modulesDir
 * @returns {string[]}
 */
function collectModuleSkillMds(modulesDir) {
  if (!fs.existsSync(modulesDir)) return [];
  const results = [];
  try {
    for (const moduleName of fs.readdirSync(modulesDir)) {
      const moduleSkillsDir = path.join(modulesDir, moduleName, 'skills');
      results.push(...collectTopLevelSkillMds(moduleSkillsDir));
    }
  } catch {
    // Skip unreadable entries
  }
  return results;
}

/**
 * Collect all .md files directly under an agents/ directory (non-recursive).
 * Returns absolute paths.
 * @param {string} agentsDir
 * @returns {string[]}
 */
function collectAgentMds(agentsDir) {
  if (!fs.existsSync(agentsDir)) return [];
  try {
    return fs.readdirSync(agentsDir)
      .filter((entry) => entry.endsWith('.md'))
      .map((entry) => path.join(agentsDir, entry))
      .filter((p) => {
        try { return fs.statSync(p).isFile(); } catch { return false; }
      });
  } catch {
    return [];
  }
}

/**
 * Walk .agents/modules/{name}/agents/*.md.
 * Returns absolute paths.
 * @param {string} modulesDir
 * @returns {string[]}
 */
function collectModuleAgentMds(modulesDir) {
  if (!fs.existsSync(modulesDir)) return [];
  const results = [];
  try {
    for (const moduleName of fs.readdirSync(modulesDir)) {
      const moduleAgentsDir = path.join(modulesDir, moduleName, 'agents');
      results.push(...collectAgentMds(moduleAgentsDir));
    }
  } catch {
    // Skip unreadable entries
  }
  return results;
}

// ── Scanning ──────────────────────────────────────────────────────────────────

/**
 * Scan a single SKILL.md file for forbidden boilerplate patterns.
 * @param {string} absPath
 * @returns {{ file: string, line: number, pattern: string }[]}
 */
function scanFile(absPath) {
  let content;
  try {
    content = fs.readFileSync(absPath, 'utf8');
  } catch {
    return [];
  }

  const violations = [];
  const lines = content.split('\n');

  for (const patternDef of PATTERNS) {
    if (patternDef.skipIfPathContains && absPath.includes(patternDef.skipIfPathContains)) {
      continue;
    }
    for (let i = 0; i < lines.length; i++) {
      if (patternDef.regex.test(lines[i])) {
        violations.push({
          file: absPath,
          line: i + 1,
          pattern: patternDef.label,
        });
      }
    }
  }

  return violations;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  const projectRoot = process.argv[2] || process.cwd();
  const codexDir   = path.join(projectRoot, '.agents');
  const skillsDir   = path.join(codexDir, 'skills');
  const modulesDir  = path.join(codexDir, 'modules');
  const agentsDir   = path.join(codexDir, 'agents');

  const allFiles = [
    ...collectTopLevelSkillMds(skillsDir),
    ...collectModuleSkillMds(modulesDir),
    ...collectAgentMds(agentsDir),
    ...collectModuleAgentMds(modulesDir),
  ];

  if (allFiles.length === 0) {
    const result = { status: 'ok', violations: [] };
    process.stdout.write(JSON.stringify(result) + '\n');
    console.log('[omg-doctor] no-inline-universal-rules: SKIP — no SKILL.md or agent .md files found');
    return;
  }

  const allViolations = [];
  for (const skillMdPath of allFiles) {
    allViolations.push(...scanFile(skillMdPath));
  }

  const result = {
    status: allViolations.length === 0 ? 'ok' : 'fail',
    violations: allViolations,
  };

  process.stdout.write(JSON.stringify(result) + '\n');

  if (allViolations.length === 0) {
    process.stderr.write(
      `[omg-doctor] no-inline-universal-rules: PASS — ${allFiles.length} file(s) scanned (skills + agents), 0 violations\n`,
    );
    return;
  }

  process.stderr.write(
    `[omg-doctor] no-inline-universal-rules: FAIL — ${allViolations.length} inlined universal rule(s) found in skill/agent files\n`,
  );
  process.stderr.write(
    '  These boilerplates live in .agents/rules/ and auto-load every session — do not paste them into skill or agent bodies.\n',
  );
  process.stderr.write('  Violations:\n');
  for (const v of allViolations) {
    process.stderr.write(`    ${v.file}:${v.line}  [${v.pattern}]\n`);
  }
  process.stderr.write(
    '  fix: remove the inlined block and cite the rule file via a reference link if needed.\n',
  );
  process.stderr.write(
    '  See .agents/skillsomg-skill-creator/references/architecture-rules.md → "Anti-Pattern: Inlining Universal Rules"\n',
  );

  process.exit(1);
}

try {
  run();
} catch (err) {
  const result = { status: 'fail', violations: [] };
  process.stdout.write(JSON.stringify(result) + '\n');
  process.stderr.write(`[omg-doctor] no-inline-universal-rules: FAIL — check errored: ${err.message}\n`);
  process.exit(1);
}
