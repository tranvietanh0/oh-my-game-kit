// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * dotnet-tool.cjs — Install .NET global tools via `dotnet tool install -g`.
 *
 * Prerequisites: .NET SDK >= 8.0.0 on PATH.
 * Rollback: `dotnet tool uninstall -g <package>`.
 * Idempotent: check via `dotnet tool list -g` output parsing.
 * Windows hint: prefer `winget install Microsoft.DotNet.SDK.8`.
 * macOS hint: prefer `brew install --cask dotnet-sdk`.
 * Linux hint: distro-specific `apt install dotnet-sdk-8.0` (with Microsoft repo).
 */
'use strict';

const os = require('os');
const { runCommand, probeCommand, commandExists, PrerequisiteError, VerificationError } = require('./subprocess-utils.cjs');

const HANDLER_NAME = 'dotnet-tool';
const HANDLER_VERSION = '1.0.0';
const DOTNET_MIN_MAJOR = 8;

// ── Platform-specific install hints ───────────────────────────────────────

function dotnetInstallHint() {
  const p = process.platform;
  if (p === 'win32') return 'winget install Microsoft.DotNet.SDK.8 (or https://dotnet.microsoft.com/download/dotnet/8.0)';
  if (p === 'darwin') return 'brew install --cask dotnet-sdk (or https://dotnet.microsoft.com/download/dotnet/8.0)';
  return 'apt install dotnet-sdk-8.0 (add Microsoft repo first) or https://dotnet.microsoft.com/download/dotnet/8.0';
}

// ── Prerequisites ──────────────────────────────────────────────────────────

function listPrerequisites() {
  return [
    {
      name: '.NET SDK >= 8.0.0',
      check: 'dotnet --list-sdks',
      installHint: dotnetInstallHint(),
    },
  ];
}

function assertPrerequisites() {
  const result = probeCommand('dotnet', ['--list-sdks'], { timeout: 10_000 });
  if (!result.ok && result.exitCode === 127) {
    throw new PrerequisiteError('.NET SDK >= 8.0.0', dotnetInstallHint());
  }
  if (!result.ok) {
    throw new PrerequisiteError(`.NET SDK >= 8.0.0 (dotnet --list-sdks failed: ${result.stderr})`, dotnetInstallHint());
  }
  // Parse SDK list — each line: "8.0.100 [/path]"
  const lines = (result.stdout || '').split('\n').filter(Boolean);
  const hasV8Plus = lines.some(line => {
    const match = line.match(/^(\d+)\./);
    return match && parseInt(match[1], 10) >= DOTNET_MIN_MAJOR;
  });
  if (!hasV8Plus) {
    throw new PrerequisiteError(
      `.NET SDK >= ${DOTNET_MIN_MAJOR}.0.0 (found: ${lines.join(', ') || 'none'})`,
      dotnetInstallHint(),
    );
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Parse `dotnet tool list -g` tabular output.
 * Returns map of { packageId.toLowerCase() → { id, version, commands } }.
 */
function parseDotnetToolList() {
  const result = probeCommand('dotnet', ['tool', 'list', '-g'], { timeout: 15_000 });
  if (!result.ok) return {};
  const map = {};
  const lines = (result.stdout || '').split('\n');
  // Skip header (2 lines: header + separator)
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/\s{2,}/);
    if (parts.length >= 2) {
      const id = parts[0].trim().toLowerCase();
      map[id] = { id: parts[0].trim(), version: parts[1].trim(), commands: parts[2] ? parts[2].trim() : '' };
    }
  }
  return map;
}

// ── Public API ─────────────────────────────────────────────────────────────

async function check(step, _ctx) {
  const pkg = (step.package || step.target).toLowerCase();
  const tools = parseDotnetToolList();
  if (tools[pkg]) {
    return { installed: true, installedVersion: tools[pkg].version, path: null };
  }
  return { installed: false, installedVersion: null, path: null };
}

async function install(step, ctx) {
  assertPrerequisites();
  const pkg = step.package || step.target;
  if (!step.version) {
    throw new Error(`dotnet-tool: 'version' is required for '${pkg}'. Never use 'latest' (BLOCKER 4).`);
  }

  const existing = await check(step, ctx);
  if (existing.installed && existing.installedVersion === step.version) {
    ctx.logger.info(`dotnet-tool: '${pkg}@${step.version}' already installed — skipping.`);
    return { success: true, method: HANDLER_NAME, log: `already-installed@${step.version}` };
  }

  // If different version installed: uninstall first, then reinstall
  if (existing.installed) {
    ctx.logger.info(`dotnet-tool: updating '${pkg}' from ${existing.installedVersion} → ${step.version}`);
    runCommand('dotnet', ['tool', 'uninstall', '-g', pkg], { timeout: 60_000 });
  }

  ctx.logger.info(`dotnet-tool: installing ${pkg}@${step.version} ...`);
  runCommand('dotnet', ['tool', 'install', '-g', pkg, '--version', step.version], { timeout: 120_000 });
  return { success: true, method: HANDLER_NAME, log: `installed@${step.version}` };
}

async function uninstall(step, ctx) {
  const pkg = step.package || step.target;
  const existing = await check(step, ctx);
  if (!existing.installed) {
    ctx.logger.info(`dotnet-tool: '${pkg}' not installed — uninstall is a no-op.`);
    return { success: true, log: 'not-installed' };
  }
  ctx.logger.info(`dotnet-tool: uninstalling ${pkg} ...`);
  runCommand('dotnet', ['tool', 'uninstall', '-g', pkg], { timeout: 60_000 });
  return { success: true, log: 'uninstalled' };
}

async function verify(step, ctx) {
  const pkg = step.package || step.target;
  if (step.verify) {
    const parts = step.verify.split(/\s+/);
    const result = probeCommand(parts[0], parts.slice(1), { timeout: 10_000 });
    if (result.ok) return { ok: true, reason: 'verify-command-passed' };
    return { ok: false, reason: `verify command failed: ${result.stderr}` };
  }
  const info = await check(step, ctx);
  if (!info.installed) return { ok: false, reason: `'${pkg}' not found in dotnet tool list -g` };
  if (step.version && info.installedVersion !== step.version) {
    return { ok: false, reason: `version mismatch: installed=${info.installedVersion} expected=${step.version}` };
  }
  return { ok: true, reason: `installed@${info.installedVersion}` };
}

function manifest() {
  return { handler: HANDLER_NAME, version: HANDLER_VERSION };
}

module.exports = { name: HANDLER_NAME, check, install, uninstall, verify, listPrerequisites, manifest };
