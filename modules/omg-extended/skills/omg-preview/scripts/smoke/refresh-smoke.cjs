// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
'use strict';
/**
 * refresh-smoke.cjs — Integration smoke tests for refresh-orchestrator.cjs.
 *
 * Scenarios:
 *   S1 — 0 adapters  : discoverAdapters returns {}, expects exit 0, stderr notice, no writes.
 *   S2 — 1 adapter   : Unity fixture detects + generates modules.md; expects meta.json written
 *                       with valid SHA-256.
 *   S3 — 2 adapters  : Unity (p90) + Nakama (p85) both detect; expects polyglot notice in
 *                       stderr, Unity runs (higher priority), Nakama hint in stderr.
 *
 * Each scenario runs in an isolated os.tmpdir() sandbox, cleaned up in finally.
 *
 * Cross-platform: path.join(), os.tmpdir(), process.platform — no /tmp literals.
 *
 * @returns {{ passed: number, failed: number, results: object[] }}
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const ORCHESTRATOR = path.resolve(__dirname, '..', 'refresh-orchestrator.cjs');

// ── Helpers ────────────────────────────────────────────────────────────────

function pass(name) { return { name, ok: true, error: null }; }
function fail(name, msg) { return { name, ok: false, error: msg }; }

/**
 * Create a minimal metadata.json that adapter-discovery will accept as OMG-shape.
 * Lists the given skill names under an installed module.
 *
 * @param {string} codexDir
 * @param {string[]} skillNames
 */
function writeFakeMetadata(codexDir, skillNames) {
  const installedModules = {};
  if (skillNames.length > 0) {
    installedModules['smoke-adapter-module'] = {
      version: '0.1.0',
      skills: skillNames,
    };
  }
  const meta = {
    schemaVersion: 3,
    name: 'oh-my-game-kit-smoke',
    installedModules,
  };
  fs.mkdirSync(codexDir, { recursive: true });
  fs.writeFileSync(path.join(codexDir, 'metadata.json'), JSON.stringify(meta, null, 2), 'utf8');
}

/**
 * Copy a fixture adapter's SKILL.md and scripts/ into a .agents/skills/<name>/ directory.
 *
 * @param {string} codexDir
 * @param {string} fixtureName  e.g. 'adapter-unity'
 * @param {string} skillName    e.g. 'unity-assembly-graph'
 */
function installFixtureAdapter(codexDir, fixtureName, skillName) {
  const fixtureDir = path.join(FIXTURES_DIR, fixtureName);
  const skillDir = path.join(codexDir, 'skills', skillName);
  fs.mkdirSync(path.join(skillDir, 'scripts'), { recursive: true });

  // Copy SKILL.md
  fs.copyFileSync(
    path.join(fixtureDir, 'SKILL.md'),
    path.join(skillDir, 'SKILL.md'),
  );

  // Copy scripts
  const scriptsDir = path.join(fixtureDir, 'scripts');
  for (const file of fs.readdirSync(scriptsDir)) {
    fs.copyFileSync(
      path.join(scriptsDir, file),
      path.join(skillDir, 'scripts', file),
    );
  }
}

/**
 * Invoke refresh-orchestrator.cjs as a subprocess with the given options.
 * Returns { stdout, stderr, exitCode }.
 * Uses spawnSync to capture stderr even on exit 0.
 *
 * @param {string[]} args
 * @param {{ cwd: string, env?: object }} opts
 * @returns {{ stdout: string, stderr: string, exitCode: number }}
 */
function invokeOrchestrator(args, { cwd, env }) {
  const result = spawnSync(
    process.execPath,
    [ORCHESTRATOR, ...args],
    {
      cwd,
      env: { ...process.env, ...env },
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000,
      encoding: 'utf8',
    },
  );
  return {
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    exitCode: result.status != null ? result.status : 1,
  };
}

/**
 * Create a temp sandbox directory.
 *
 * @returns {string}
 */
function makeSandbox() {
  const dir = path.join(os.tmpdir(), `omg-smoke-${process.pid}-${Date.now()}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Recursively remove a directory (best-effort, no throw).
 *
 * @param {string} dir
 */
function rmrf(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort
  }
}

// ── Scenario S1: 0 adapters ────────────────────────────────────────────────

function runS1() {
  const results = [];
  const sandbox = makeSandbox();
  try {
    const projectDir = path.join(sandbox, 'project');
    const codexDir = path.join(projectDir, '.agents');
    const outDir = path.join(projectDir, 'docs', 'diagrams');

    // Metadata with no skills
    writeFakeMetadata(codexDir, []);

    const { stdout, stderr, exitCode } = invokeOrchestrator(
      ['--out-dir', outDir, '--no-interactive', '--types', 'modules'],
      {
        cwd: projectDir,
        env: {
          CLAUDE_PROJECT_DIR: projectDir,
          OMG_DIAGRAM_LOCK_TIMEOUT_MS: '5000',
        },
      },
    );

    // Should exit 0
    if (exitCode === 0) {
      results.push(pass('S1: exit code 0'));
    } else {
      results.push(fail('S1: exit code', `expected 0, got ${exitCode}\nstdout: ${stdout}\nstderr: ${stderr}`));
    }

    // Should emit "No adapter matched" notice
    const combinedOutput = stdout + stderr;
    if (combinedOutput.includes('No adapter matched')) {
      results.push(pass('S1: stderr notice emitted'));
    } else {
      results.push(fail('S1: stderr notice', `expected "No adapter matched" in output.\nstdout: ${stdout}\nstderr: ${stderr}`));
    }

    // Should NOT write meta.json
    const metaPath = path.join(outDir, '.omg-diagram-meta.json');
    if (!fs.existsSync(metaPath)) {
      results.push(pass('S1: no meta.json written'));
    } else {
      results.push(fail('S1: no writes', 'meta.json was written unexpectedly'));
    }
  } finally {
    rmrf(sandbox);
  }
  return results;
}

// ── Scenario S2: 1 adapter (Unity) ────────────────────────────────────────

function runS2() {
  const results = [];
  const sandbox = makeSandbox();
  try {
    const projectDir = path.join(sandbox, 'project');
    const codexDir = path.join(projectDir, '.agents');
    const outDir = path.join(projectDir, 'docs', 'diagrams');
    const skillName = 'unity-assembly-graph';

    writeFakeMetadata(codexDir, [skillName]);
    installFixtureAdapter(codexDir, 'adapter-unity', skillName);

    const { stdout, stderr, exitCode } = invokeOrchestrator(
      ['--out-dir', outDir, '--no-interactive', '--types', 'modules'],
      {
        cwd: projectDir,
        env: {
          CLAUDE_PROJECT_DIR: projectDir,
          OMG_DIAGRAM_LOCK_TIMEOUT_MS: '5000',
        },
      },
    );

    if (exitCode === 0) {
      results.push(pass('S2: exit code 0'));
    } else {
      results.push(fail('S2: exit code', `expected 0, got ${exitCode}\nstdout: ${stdout}\nstderr: ${stderr}`));
    }

    // modules.md should exist
    const modulesMd = path.join(outDir, 'modules.md');
    if (fs.existsSync(modulesMd)) {
      results.push(pass('S2: modules.md written'));
    } else {
      results.push(fail('S2: modules.md', `not found at ${modulesMd}\nstdout: ${stdout}\nstderr: ${stderr}`));
    }

    // meta.json should exist with valid SHA-256
    const metaPath = path.join(outDir, '.omg-diagram-meta.json');
    if (fs.existsSync(metaPath)) {
      results.push(pass('S2: meta.json written'));
      try {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        const sha = meta.generated && meta.generated['modules.md'] && meta.generated['modules.md'].sha256;
        if (sha && /^[0-9a-f]{64}$/.test(sha)) {
          results.push(pass('S2: meta.json modules.md SHA-256 is valid hex-64'));
        } else {
          results.push(fail('S2: meta.json SHA-256', `invalid sha256: ${sha}`));
        }
      } catch (err) {
        results.push(fail('S2: meta.json parse', err.message));
      }
    } else {
      results.push(fail('S2: meta.json', `not found at ${metaPath}\nstdout: ${stdout}\nstderr: ${stderr}`));
    }
  } finally {
    rmrf(sandbox);
  }
  return results;
}

// ── Scenario S3: 2 adapters (Unity p90 + Nakama p85) ──────────────────────

function runS3() {
  const results = [];
  const sandbox = makeSandbox();
  try {
    const projectDir = path.join(sandbox, 'project');
    const codexDir = path.join(projectDir, '.agents');
    const outDir = path.join(sandbox, 'out');
    const unitySkill = 'unity-assembly-graph';
    const nakamaSkill = 'nakama-service-graph';

    writeFakeMetadata(codexDir, [unitySkill, nakamaSkill]);
    installFixtureAdapter(codexDir, 'adapter-unity', unitySkill);
    installFixtureAdapter(codexDir, 'adapter-nakama', nakamaSkill);

    const { stdout, stderr, exitCode } = invokeOrchestrator(
      ['--out-dir', outDir, '--no-interactive', '--types', 'modules'],
      {
        cwd: projectDir,
        env: {
          CLAUDE_PROJECT_DIR: projectDir,
          OMG_DIAGRAM_LOCK_TIMEOUT_MS: '5000',
        },
      },
    );

    if (exitCode === 0) {
      results.push(pass('S3: exit code 0'));
    } else {
      results.push(fail('S3: exit code', `expected 0, got ${exitCode}\nstdout: ${stdout}\nstderr: ${stderr}`));
    }

    const combinedOutput = stdout + stderr;

    // Polyglot notice: "Multiple adapters matched"
    if (combinedOutput.includes('Multiple adapters matched') || combinedOutput.includes('Multiple adapters')) {
      results.push(pass('S3: polyglot notice emitted'));
    } else {
      results.push(fail('S3: polyglot notice', `"Multiple adapters" not found in output.\nstdout: ${stdout}\nstderr: ${stderr}`));
    }

    // Re-invocation hint for Nakama
    if (combinedOutput.includes('nakama') || combinedOutput.includes('--engine nakama')) {
      results.push(pass('S3: Nakama re-invocation hint in output'));
    } else {
      results.push(fail('S3: nakama hint', `nakama hint not found in output.\nstdout: ${stdout}\nstderr: ${stderr}`));
    }

    // Unity should have run (modules.md present)
    const modulesMd = path.join(outDir, 'modules.md');
    if (fs.existsSync(modulesMd)) {
      results.push(pass('S3: Unity adapter ran (modules.md written)'));
      // Confirm it is the Unity mermaid fixture content
      const content = fs.readFileSync(modulesMd, 'utf8');
      if (content.includes('Assembly')) {
        results.push(pass('S3: modules.md contains Unity fixture content'));
      } else {
        results.push(fail('S3: modules.md content', `expected Unity fixture Mermaid, got: ${content.slice(0, 120)}`));
      }
    } else {
      results.push(fail('S3: Unity ran', `modules.md not found at ${modulesMd}\nstdout: ${stdout}\nstderr: ${stderr}`));
    }
  } finally {
    rmrf(sandbox);
  }
  return results;
}

// ── Runner ─────────────────────────────────────────────────────────────────

function runRefreshSmoke() {
  const results = [
    ...runS1(),
    ...runS2(),
    ...runS3(),
  ];
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  return { passed, failed, results };
}

module.exports = { runRefreshSmoke };

if (require.main === module) {
  const { passed, failed, results } = runRefreshSmoke();
  for (const r of results) {
    const icon = r.ok ? '[PASS]' : '[FAIL]';
    const detail = r.error ? `\n     ${r.error}` : '';
    process.stdout.write(`  ${icon} ${r.name}${detail}\n`);
  }
  process.stdout.write(`\nrefresh-smoke: ${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}
