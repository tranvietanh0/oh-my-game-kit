// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * npm-global.cjs — Install npm packages globally via `npm install -g`.
 *
 * Prerequisites: Node.js >= 18, npm on PATH.
 * Rollback: `npm uninstall -g <package>`.
 * Idempotent: check via `npm ls -g --json`; skip if already at the correct version.
 * Windows: npm.cmd is resolved by Node's execFileSync on Windows; no shell=true needed.
 */
'use strict';

const os = require('os');
const { runCommand, probeCommand, commandExists, PrerequisiteError, VerificationError } = require('./subprocess-utils.cjs');

const HANDLER_NAME = 'npm-global';
const HANDLER_VERSION = '1.0.0';
const NODE_MIN_MAJOR = 18;

// ── Prerequisites ──────────────────────────────────────────────────────────

function listPrerequisites() {
  return [
    {
      name: 'Node.js >= 18',
      check: 'node --version',
      installHint: 'https://nodejs.org (LTS recommended)',
    },
    {
      name: 'npm (bundled with Node)',
      check: 'npm --version',
      installHint: 'https://nodejs.org',
    },
  ];
}

function assertPrerequisites() {
  const node = commandExists('node', ['--version']);
  if (!node.found) {
    throw new PrerequisiteError('Node.js >= 18', 'https://nodejs.org');
  }
  const match = (node.version || '').match(/v?(\d+)/);
  if (match && parseInt(match[1], 10) < NODE_MIN_MAJOR) {
    throw new PrerequisiteError(
      `Node.js >= ${NODE_MIN_MAJOR} (found ${node.version})`,
      'https://nodejs.org (LTS recommended)',
    );
  }
  const npm = commandExists('npm', ['--version']);
  if (!npm.found) {
    throw new PrerequisiteError('npm', 'https://nodejs.org');
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse `npm ls -g --json` output to find installed package + version.
 * Returns { installed: boolean, installedVersion: string|null, path: string|null }.
 */
function parseNpmLsGlobal(pkg) {
  const result = probeCommand('npm', ['ls', '-g', '--json', '--depth=0'], { timeout: 15_000 });
  if (!result.ok && !result.stdout) {
    return { installed: false, installedVersion: null, path: null };
  }
  try {
    const parsed = JSON.parse(result.stdout || '{}');
    const deps = (parsed && parsed.dependencies) || {};
    if (deps[pkg]) {
      return {
        installed: true,
        installedVersion: deps[pkg].version || null,
        path: deps[pkg].resolved || null,
      };
    }
  } catch {
    // JSON parse failure treated as not installed
  }
  return { installed: false, installedVersion: null, path: null };
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * @param {{ target: string, package?: string, version: string }} step
 * @param {{ logger: { info(msg:string):void, warn(msg:string):void }, abortSignal?: AbortSignal }} ctx
 * @returns {Promise<{ installed: boolean, installedVersion: string|null, path: string|null }>}
 */
async function check(step, _ctx) {
  const pkg = step.package || step.target;
  return parseNpmLsGlobal(pkg);
}

/**
 * @param {{ target: string, package?: string, version: string }} step
 * @param {{ logger: { info(msg:string):void, warn(msg:string):void } }} ctx
 * @returns {Promise<{ success: boolean, method: string, log: string }>}
 */
async function install(step, ctx) {
  assertPrerequisites();
  const pkg = step.package || step.target;
  if (!step.version) {
    throw new Error(`npm-global: 'version' is required for package '${pkg}'. Never use 'latest'.`);
  }

  const existing = parseNpmLsGlobal(pkg);
  if (existing.installed && existing.installedVersion === step.version) {
    ctx.logger.info(`npm-global: '${pkg}@${step.version}' already installed — skipping.`);
    return { success: true, method: HANDLER_NAME, log: `already-installed@${step.version}` };
  }

  const pkgSpec = `${pkg}@${step.version}`;
  ctx.logger.info(`npm-global: installing ${pkgSpec} ...`);
  runCommand('npm', ['install', '-g', pkgSpec], { timeout: 120_000 });

  ctx.logger.info(`npm-global: installed ${pkgSpec}`);
  return { success: true, method: HANDLER_NAME, log: `installed@${step.version}` };
}

/**
 * @param {{ target: string, package?: string }} step
 * @param {{ logger: { info(msg:string):void, warn(msg:string):void } }} ctx
 * @returns {Promise<{ success: boolean, log: string }>}
 */
async function uninstall(step, ctx) {
  const pkg = step.package || step.target;
  const existing = parseNpmLsGlobal(pkg);
  if (!existing.installed) {
    ctx.logger.info(`npm-global: '${pkg}' not installed — uninstall is a no-op.`);
    return { success: true, log: 'not-installed' };
  }
  ctx.logger.info(`npm-global: uninstalling ${pkg} ...`);
  runCommand('npm', ['uninstall', '-g', pkg], { timeout: 60_000 });
  return { success: true, log: `uninstalled` };
}

/**
 * @param {{ target: string, package?: string, version: string, verify?: string }} step
 * @param {{ logger: { info(msg:string):void } }} ctx
 * @returns {Promise<{ ok: boolean, reason: string }>}
 */
async function verify(step, ctx) {
  const pkg = step.package || step.target;
  // Prefer running the declared verify command if present
  if (step.verify) {
    const parts = step.verify.split(/\s+/);
    const result = probeCommand(parts[0], parts.slice(1), { timeout: 10_000 });
    if (result.ok) return { ok: true, reason: 'verify-command-passed' };
    return { ok: false, reason: `verify command failed: ${result.stderr}` };
  }
  const info = parseNpmLsGlobal(pkg);
  if (!info.installed) return { ok: false, reason: `'${pkg}' not found in npm ls -g` };
  if (step.version && info.installedVersion !== step.version) {
    return { ok: false, reason: `version mismatch: installed=${info.installedVersion} expected=${step.version}` };
  }
  return { ok: true, reason: `installed@${info.installedVersion}` };
}

function manifest() {
  return { handler: HANDLER_NAME, version: HANDLER_VERSION };
}

module.exports = { name: HANDLER_NAME, check, install, uninstall, verify, listPrerequisites, manifest };
