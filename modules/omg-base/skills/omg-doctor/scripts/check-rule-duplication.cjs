#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
// check-rule-duplication.cjs — Doctor check #36: Rule file duplication.
//
// Detects rule files that are double-loaded, either by:
//   (a) Filename match — same .md filename in both global and project rules/
//   (b) Content match — byte-hash identical content, even if filenames differ
//
// Both are auto-loaded by Codex every session, so duplicates waste
// context window budget.
//
// Content normalization before hashing (same contract as OMG CLI
// `src/services/file-operations/content-hash.ts` — independent CJS
// implementation, cross-referenced for parity):
//   1. Strip YAML frontmatter fields: origin:, repository:, module:, protected:
//   2. Normalize CRLF → LF
//   3. Strip UTF-8 BOM
//   4. Trim leading/trailing whitespace
//
// Usage:
//   node check-rule-duplication.cjs [path/to/project-codex-dir]
//
// Exits 0 always (INFO level). Prints PASS/INFO with duplicated entries.

'use strict';

const crypto = require('node:crypto');
const fs     = require('node:fs');
const os     = require('node:os');
const path   = require('node:path');

// ── Content normalization ─────────────────────────────────────────────────────

const FRONTMATTER_STRIP_RE = /^(origin|repository|module|protected):[ \t]*.*/gm;

/**
 * Normalize file content for hash comparison.
 * Strips origin metadata, normalizes line endings, removes BOM.
 * @param {string} content
 * @returns {string}
 */
function normalizeContent(content) {
  // Strip UTF-8 BOM
  let s = content.replace(/^\uFEFF/, '');
  // CRLF → LF
  s = s.replace(/\r\n/g, '\n');
  // Strip tracked frontmatter fields (they change between kit copies)
  s = s.replace(FRONTMATTER_STRIP_RE, '');
  // Collapse runs of blank lines introduced by stripping (max 2 → 1)
  s = s.replace(/\n{3,}/g, '\n\n');
  // Trim
  s = s.trim();
  return s;
}

/**
 * Compute a short hex hash of normalized content.
 * @param {string} content  raw file content
 * @returns {string}
 */
function contentHash(content) {
  const normalized = normalizeContent(content);
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex').slice(0, 16);
}

// ── File listing ──────────────────────────────────────────────────────────────

/**
 * @param {string} rulesDir
 * @returns {string[]} sorted .md filenames
 */
function listRuleFiles(rulesDir) {
  if (!fs.existsSync(rulesDir)) return [];
  try {
    return fs
      .readdirSync(rulesDir)
      .filter((f) => f.endsWith('.md'))
      .sort();
  } catch {
    return [];
  }
}

/**
 * Build a map of filename → { hash, absPath } for all .md files in rulesDir.
 * Files that cannot be read are skipped.
 * @param {string} rulesDir
 * @returns {Map<string, {hash: string, absPath: string}>}
 */
function buildFileMap(rulesDir) {
  const map = new Map();
  for (const filename of listRuleFiles(rulesDir)) {
    const absPath = path.join(rulesDir, filename);
    try {
      const content = fs.readFileSync(absPath, 'utf8');
      map.set(filename, { hash: contentHash(content), absPath });
    } catch {
      // Skip unreadable files
    }
  }
  return map;
}

// ── Inheritance helpers ────────────────────────────────────────────────────────

/**
 * Read metadata.json from a .agents/ directory.
 * Returns the parsed object or null if absent/unreadable/invalid JSON.
 * @param {string} codexDir
 * @returns {object|null}
 */
function readMetadata(codexDir) {
  const metaPath = path.join(codexDir, 'metadata.json');
  if (!fs.existsSync(metaPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Determine whether the project declares `inheritsFrom` pointing at the same
 * directory as `globalCodexDir` (the parent of globalRulesDir).
 *
 * Returns:
 *   'inherited'       — inheritsFrom is set AND points at globalCodexDir (or resolves to same)
 *   'missing-parent'  — inheritsFrom is set BUT the declared path does not exist
 *   'unrelated'       — inheritsFrom is set but points at a different dir
 *   'none'            — inheritsFrom not set
 *
 * @param {string} projectCodexDir
 * @param {string} globalCodexDir  path.join(os.homedir(), '.agents')
 * @returns {'inherited'|'missing-parent'|'unrelated'|'none'}
 */
function classifyInheritance(projectCodexDir, globalCodexDir) {
  const meta = readMetadata(projectCodexDir);
  const inheritsFrom = meta && typeof meta.inheritsFrom === 'string' ? meta.inheritsFrom : null;
  if (!inheritsFrom) return 'none';

  if (!fs.existsSync(inheritsFrom)) return 'missing-parent';

  try {
    const resolvedDeclared = fs.realpathSync(inheritsFrom);
    const resolvedGlobal   = fs.realpathSync(globalCodexDir);
    if (resolvedDeclared === resolvedGlobal) return 'inherited';
  } catch {
    // realpathSync can fail on race or perms — treat as unrelated
  }
  return 'unrelated';
}

// ── Main ──────────────────────────────────────────────────────────────────────

function run() {
  const projectCodexDir = process.argv[2] || path.join(process.cwd(), '.agents');
  const projectRulesDir  = path.join(projectCodexDir, 'rules');
  const globalCodexDir  = path.join(os.homedir(), '.agents');
  const globalRulesDir   = path.join(globalCodexDir, 'rules');

  // Resolve real paths to compare — skip when project IS the global dir.
  try {
    const resolvedProject = fs.realpathSync(projectRulesDir);
    const resolvedGlobal  = fs.realpathSync(globalRulesDir);
    if (resolvedProject === resolvedGlobal) {
      console.log('[omg-doctor] rule-duplication: SKIP — project rules/ resolves to global dir');
      return;
    }
  } catch {
    // One or both missing — continue; buildFileMap handles absence
  }

  // Check inheritance relationship before loading file maps
  const inheritanceStatus = classifyInheritance(projectCodexDir, globalCodexDir);

  if (inheritanceStatus === 'missing-parent') {
    // inheritsFrom is set but the parent path does not exist — loud error, not silent fallback
    process.stderr.write(
      '[omg-doctor] rule-duplication: ERROR — inheritsFrom is set but parent path does not exist.\n' +
      `  declared: ${readMetadata(projectCodexDir).inheritsFrom}\n` +
      '  fix: rm the inheritsFrom field from .agents/metadata.json OR re-create the parent .agents/\n',
    );
    process.exit(1);
  }

  const projectMap = buildFileMap(projectRulesDir);
  const globalMap  = buildFileMap(globalRulesDir);

  if (projectMap.size === 0 || globalMap.size === 0) {
    console.log('[omg-doctor] rule-duplication: SKIP — one or both rules/ dirs empty');
    return;
  }

  // (a) Filename duplicates
  const nameDupes = [...projectMap.keys()]
    .filter((f) => globalMap.has(f))
    .sort();

  // (b) Content duplicates — same hash, different filename
  //     Build hash → [filename, scope] index from both sides
  const globalHashToFiles = new Map(); // hash → filename
  for (const [filename, { hash }] of globalMap) {
    globalHashToFiles.set(hash, filename);
  }

  const contentDupes = []; // { projectFile, globalFile, hash }
  for (const [projFile, { hash }] of projectMap) {
    if (nameDupes.includes(projFile)) continue; // already counted above
    const globalFile = globalHashToFiles.get(hash);
    if (globalFile && globalFile !== projFile) {
      contentDupes.push({ projectFile: projFile, globalFile, hash });
    }
  }

  // Under inheritance (inheritsFrom → global), filename duplicates are INTENTIONAL
  // overrides — the child wins. Do not report them as accidental duplicates.
  // Content duplicates (byte-identical copies) are still reported regardless.
  const isInheritedFromGlobal = inheritanceStatus === 'inherited';

  const effectiveNameDupes  = isInheritedFromGlobal ? [] : nameDupes;
  const totalIssues          = effectiveNameDupes.length + contentDupes.length;

  if (isInheritedFromGlobal) {
    if (nameDupes.length > 0) {
      console.log(
        `[omg-doctor] rule-duplication: SKIP — project inherits from global (inheritsFrom set); ` +
        `${nameDupes.length} filename override(s) are intentional (child wins).`,
      );
    }
  }

  if (totalIssues === 0) {
    if (!isInheritedFromGlobal || contentDupes.length === 0) {
      console.log('[omg-doctor] rule-duplication: PASS');
    }
    return;
  }

  if (contentDupes.length > 0) {
    console.log(
      `[omg-doctor] rule-duplication: INFO — ${contentDupes.length} byte-identical rule copy(ies) detected (loaded twice per session)`,
    );
    console.log(`  Content duplicates — same content, different filename (${contentDupes.length}):`);
    for (const { projectFile, globalFile } of contentDupes) {
      console.log(`    project:${projectFile}  ≡  global:${globalFile}`);
    }
    console.log(
      '  fix: keep the rule in ONE scope. Prefer global for shared patterns; project for repo-specific rules.',
    );
  }

  if (effectiveNameDupes.length > 0) {
    console.log(
      `[omg-doctor] rule-duplication: INFO — ${effectiveNameDupes.length} duplicate rule(s) detected (loaded twice per session)`,
    );
    console.log(`  Filename duplicates (${effectiveNameDupes.length}):`);
    for (const f of effectiveNameDupes) {
      console.log(`    ${f}`);
    }
    console.log(
      '  fix: keep the rule in ONE scope. Prefer global for shared patterns; project for repo-specific rules.',
    );
  }
}

try {
  run();
} catch (err) {
  console.log(`[omg-doctor] rule-duplication: INFO — check errored: ${err.message}`);
}
