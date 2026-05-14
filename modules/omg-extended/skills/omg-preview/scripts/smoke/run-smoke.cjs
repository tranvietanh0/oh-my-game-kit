// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
'use strict';
/**
 * run-smoke.cjs — Unified smoke test runner.
 *
 * Runs install-smoke + refresh-smoke, captures results, emits summary.
 * Exits 0 on all pass, 1 on any fail.
 *
 * CI_REQUIRED: Windows/macOS path branches are exercised in platform-matrix CI.
 * This runner verifies Linux (current dev box). Windows/macOS: flag for CI job.
 *
 * Usage: node run-smoke.cjs
 */

const { runInstallSmoke } = require('./install-smoke.cjs');
const { runRefreshSmoke } = require('./refresh-smoke.cjs');

const startMs = Date.now();

process.stdout.write(`\n=== OMG Diagram Tooling — Smoke Tests ===\n`);
process.stdout.write(`Platform: ${process.platform} (${process.arch})\n`);
process.stdout.write(`Node: ${process.version}\n\n`);

// ── install-smoke ──────────────────────────────────────────────────────────

process.stdout.write('--- install-smoke ---\n');
let installResult;
try {
  installResult = runInstallSmoke();
} catch (err) {
  process.stderr.write(`[run-smoke] install-smoke threw unexpectedly: ${err.message}\n`);
  process.exit(1);
}

for (const r of installResult.results) {
  const icon = r.ok ? 'PASS' : 'FAIL';
  const detail = r.error ? ` -- ${r.error}` : '';
  process.stdout.write(`  [${icon}] ${r.name}${detail}\n`);
}
process.stdout.write(`  -> ${installResult.passed} passed, ${installResult.failed} failed\n\n`);

// ── refresh-smoke ──────────────────────────────────────────────────────────

process.stdout.write('--- refresh-smoke ---\n');
let refreshResult;
try {
  refreshResult = runRefreshSmoke();
} catch (err) {
  process.stderr.write(`[run-smoke] refresh-smoke threw unexpectedly: ${err.message}\n`);
  process.exit(1);
}

for (const r of refreshResult.results) {
  const icon = r.ok ? 'PASS' : 'FAIL';
  const detail = r.error ? ` -- ${r.error}` : '';
  process.stdout.write(`  [${icon}] ${r.name}${detail}\n`);
}
process.stdout.write(`  -> ${refreshResult.passed} passed, ${refreshResult.failed} failed\n\n`);

// ── Summary ────────────────────────────────────────────────────────────────

const totalPassed = installResult.passed + refreshResult.passed;
const totalFailed = installResult.failed + refreshResult.failed;
const durationMs = Date.now() - startMs;

process.stdout.write('=== Summary ===\n');
process.stdout.write(`Platform : ${process.platform}\n`);
process.stdout.write(`Duration : ${durationMs}ms\n`);
process.stdout.write(`Passed   : ${totalPassed}\n`);
process.stdout.write(`Failed   : ${totalFailed}\n`);

if (totalFailed === 0) {
  process.stdout.write(`\nALL PASS\n`);
} else {
  process.stdout.write(`\nFAILURES DETECTED\n`);
}

// CI_REQUIRED: Windows/macOS platform branches are exercised in CI matrix.
// This run covers Linux only.
if (process.platform !== 'linux') {
  process.stdout.write(`\n[CI_REQUIRED] Non-Linux platform detected — some platform branches require CI matrix validation.\n`);
}

process.exit(totalFailed > 0 ? 1 : 0);
