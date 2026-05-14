// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * npm-project.cjs — Per-project npm install handler.
 *
 * Does NOT run `npm install` globally. Records a per-project install hint
 * (`npm install --save-dev <pkg>@<version>`) so the CLI can surface it to users.
 *
 * Verification: checks `node_modules/<pkg>` existence OR `npm ls --json` in CWD.
 * Uninstall: `npm uninstall <pkg>` in CWD.
 *
 * Rationale (from plan): ts-morph, dependency-cruiser, tsuml2 bundle the TS compiler
 * and must be version-locked to the project. Global installs cause version drift.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { probeCommand, commandExists, PrerequisiteError } = require('./subprocess-utils.cjs');

const HANDLER_NAME = 'npm-project';
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

function resolveProjectCwd(opts) {
  return (opts && opts.cwd) || process.cwd();
}

/**
 * Check node_modules/<pkg>/package.json for installed version.
 */
function checkNodeModules(pkg, cwd) {
  const pkgJson = path.join(cwd, 'node_modules', pkg, 'package.json');
  if (!fs.existsSync(pkgJson)) return { installed: false, installedVersion: null, path: null };
  try {
    const meta = JSON.parse(fs.readFileSync(pkgJson, 'utf8'));
    return { installed: true, installedVersion: meta.version || null, path: path.join(cwd, 'node_modules', pkg) };
  } catch {
    return { installed: true, installedVersion: null, path: path.join(cwd, 'node_modules', pkg) };
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * @param {{ target: string, package?: string, version: string }} step
 * @param {{ logger: any, cwd?: string }} ctx
 */
async function check(step, ctx) {
  const pkg = step.package || step.target;
  const cwd = resolveProjectCwd(ctx);
  return checkNodeModules(pkg, cwd);
}

/**
 * Per-project handler records the install hint; the actual install is user-initiated.
 * If --global opt is passed via ctx.opts, runs npm install -g (opt-in only).
 *
 * @param {{ target: string, package?: string, version: string }} step
 * @param {{ logger: any, cwd?: string, opts?: { global?: boolean } }} ctx
 */
async function install(step, ctx) {
  assertPrerequisites();
  const pkg = step.package || step.target;
  if (!step.version) {
    throw new Error(`npm-project: 'version' is required for package '${pkg}'. Never use 'latest'.`);
  }
  const cwd = resolveProjectCwd(ctx);

  const existing = checkNodeModules(pkg, cwd);
  if (existing.installed && existing.installedVersion === step.version) {
    ctx.logger.info(`npm-project: '${pkg}@${step.version}' already present in node_modules — skipping.`);
    return { success: true, method: HANDLER_NAME, log: `already-installed@${step.version}` };
  }

  const isGlobal = ctx.opts && ctx.opts.global;
  if (!isGlobal) {
    // Per-project default: record hint only
    const hint = `cd ${cwd} && npm install --save-dev ${pkg}@${step.version}`;
    ctx.logger.info(`npm-project: per-project install required.\n  Run: ${hint}`);
    return {
      success: true,
      method: HANDLER_NAME,
      log: `per-project-install-required: ${hint}`,
    };
  }

  // --global opt-in: run global install
  ctx.logger.info(`npm-project (--global): installing ${pkg}@${step.version} globally ...`);
  const { runCommand } = require('./subprocess-utils.cjs');
  runCommand('npm', ['install', '-g', `${pkg}@${step.version}`], { timeout: 120_000 });
  return { success: true, method: HANDLER_NAME, log: `global-installed@${step.version}` };
}

/**
 * @param {{ target: string, package?: string }} step
 * @param {{ logger: any, cwd?: string, opts?: { global?: boolean } }} ctx
 */
async function uninstall(step, ctx) {
  const pkg = step.package || step.target;
  const cwd = resolveProjectCwd(ctx);
  const isGlobal = ctx.opts && ctx.opts.global;

  if (isGlobal) {
    const result = probeCommand('npm', ['uninstall', '-g', pkg], { timeout: 60_000 });
    if (!result.ok) {
      ctx.logger.warn(`npm-project: global uninstall of '${pkg}' failed: ${result.stderr}`);
    }
    return { success: result.ok, log: result.ok ? 'global-uninstalled' : result.stderr };
  }

  const existing = checkNodeModules(pkg, cwd);
  if (!existing.installed) {
    ctx.logger.info(`npm-project: '${pkg}' not in node_modules — uninstall is a no-op.`);
    return { success: true, log: 'not-installed' };
  }

  const result = probeCommand('npm', ['uninstall', pkg], { cwd, timeout: 60_000 });
  if (!result.ok) {
    ctx.logger.warn(`npm-project: uninstall of '${pkg}' failed: ${result.stderr}`);
  }
  return { success: result.ok, log: result.ok ? 'uninstalled' : result.stderr };
}

/**
 * @param {{ target: string, package?: string, version: string, verify?: string }} step
 * @param {{ logger: any, cwd?: string, opts?: { global?: boolean } }} ctx
 */
async function verify(step, ctx) {
  const pkg = step.package || step.target;
  const cwd = resolveProjectCwd(ctx);
  const isGlobal = ctx.opts && ctx.opts.global;

  if (isGlobal && step.verify) {
    const parts = step.verify.split(/\s+/);
    const result = probeCommand(parts[0], parts.slice(1), { timeout: 10_000 });
    if (result.ok) return { ok: true, reason: 'verify-command-passed' };
    return { ok: false, reason: `verify command failed: ${result.stderr}` };
  }

  const info = checkNodeModules(pkg, cwd);
  if (!info.installed) {
    // Per-project tools may legitimately not be installed yet
    return { ok: false, reason: `'${pkg}' not found in ${cwd}/node_modules` };
  }
  if (step.version && info.installedVersion !== step.version) {
    return { ok: false, reason: `version mismatch: installed=${info.installedVersion} expected=${step.version}` };
  }
  return { ok: true, reason: `installed@${info.installedVersion}` };
}

function manifest() {
  return { handler: HANDLER_NAME, version: HANDLER_VERSION };
}

module.exports = { name: HANDLER_NAME, check, install, uninstall, verify, listPrerequisites, manifest };
