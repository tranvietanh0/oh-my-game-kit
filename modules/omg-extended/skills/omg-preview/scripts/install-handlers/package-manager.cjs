// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * package-manager.cjs — Detect platform package manager and emit an install via it.
 *
 * Platform probe order (per install-handlers.md):
 *   Linux:   apt-get → dnf → pacman → zypper → manual-hint
 *   macOS:   brew → manual-hint
 *   Windows: choco → winget → manual-hint
 *
 * This handler is "best-effort" for non-interactive contexts:
 *   - Never runs `sudo` automatically; prompts user if privilege escalation is needed.
 *   - Windows choco: detects elevation; if not elevated, falls through to winget.
 *   - winget consent: detects first-time prompt; records skipped-winget-terms-unacknowledged.
 *   - On missing package manager → installs nothing; emits manual hint.
 *
 * All installs are logged. Rollback via detected package manager's remove command.
 */
'use strict';

const os = require('os');
const path = require('path');
const fs = require('fs');
const { probeCommand, runCommand } = require('./subprocess-utils.cjs');

const HANDLER_NAME = 'package-manager';
const HANDLER_VERSION = '1.0.0';

// ── Sentinel paths ─────────────────────────────────────────────────────────

function wingetConsentSentinelPath() {
  const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(appData, 'oh-my-game-kit', 'winget-consent');
}

// ── Elevation detection (Windows) ─────────────────────────────────────────

function isWindowsElevated() {
  const result = probeCommand('net', ['session'], { timeout: 5_000 });
  return result.ok;
}

// ── winget consent detection ──────────────────────────────────────────────

function wingetConsentAcknowledged() {
  return fs.existsSync(wingetConsentSentinelPath());
}

/**
 * Probe winget availability and consent state.
 * Returns: { available: boolean, consentNeeded: boolean }.
 */
function probeWinget() {
  const sentinel = wingetConsentSentinelPath();
  // If user has previously acknowledged, skip probe
  if (fs.existsSync(sentinel)) return { available: true, consentNeeded: false };

  const result = probeCommand('winget', ['list', '--accept-source-agreements'], { timeout: 8_000 });
  if (result.exitCode === 127) return { available: false, consentNeeded: false };
  if (result.stderr && result.stderr.toLowerCase().includes('ms store terms')) {
    return { available: true, consentNeeded: true };
  }
  if (!result.ok && result.exitCode !== 0) return { available: true, consentNeeded: true };
  // Store consent sentinel
  fs.mkdirSync(path.dirname(sentinel), { recursive: true });
  fs.writeFileSync(sentinel, new Date().toISOString(), 'utf8');
  return { available: true, consentNeeded: false };
}

// ── Package manager detection ──────────────────────────────────────────────

const LINUX_PKG_MANAGERS = ['apt-get', 'dnf', 'pacman', 'zypper'];
const MACOS_PKG_MANAGERS = ['brew'];
const WIN_PKG_MANAGERS = ['choco', 'winget'];

function detectPlatformManagers() {
  const platform = process.platform;
  let candidates;
  if (platform === 'darwin') candidates = MACOS_PKG_MANAGERS;
  else if (platform === 'win32') candidates = WIN_PKG_MANAGERS;
  else candidates = LINUX_PKG_MANAGERS; // Linux + anything else

  return candidates
    .map(cmd => {
      const result = probeCommand(cmd, ['--version'], { timeout: 5_000 });
      // Some package managers don't support --version but exist on PATH
      return {
        cmd,
        available: result.ok || (result.exitCode !== 127 && result.exitCode !== -1),
      };
    })
    .filter(m => m.available);
}

// ── Command builders ───────────────────────────────────────────────────────

/**
 * Returns { installCmd: string[], uninstallCmd: string[], needsSudo: boolean }.
 * Returns null if packageName mapping not deterministic for this manager.
 */
function buildCommands(mgr, pkgName) {
  switch (mgr) {
    case 'apt-get':
      return { installArgs: ['install', '-y', pkgName], uninstallArgs: ['remove', '-y', pkgName], needsSudo: process.getuid ? process.getuid() !== 0 : false };
    case 'dnf':
      return { installArgs: ['install', '-y', pkgName], uninstallArgs: ['remove', '-y', pkgName], needsSudo: process.getuid ? process.getuid() !== 0 : false };
    case 'pacman':
      return { installArgs: ['-S', '--noconfirm', pkgName], uninstallArgs: ['-R', '--noconfirm', pkgName], needsSudo: process.getuid ? process.getuid() !== 0 : false };
    case 'zypper':
      return { installArgs: ['install', '-y', pkgName], uninstallArgs: ['remove', '-y', pkgName], needsSudo: process.getuid ? process.getuid() !== 0 : false };
    case 'brew':
      return { installArgs: ['install', pkgName], uninstallArgs: ['uninstall', pkgName], needsSudo: false };
    case 'choco':
      return { installArgs: ['install', pkgName, '-y'], uninstallArgs: ['uninstall', pkgName, '-y'], needsSudo: true };
    case 'winget':
      return { installArgs: ['install', '--id', pkgName, '--silent', '--accept-package-agreements', '--accept-source-agreements'], uninstallArgs: ['uninstall', '--id', pkgName, '--silent'], needsSudo: false };
    default:
      return null;
  }
}

// ── Prerequisites ──────────────────────────────────────────────────────────

function listPrerequisites() {
  return detectPlatformManagers().map(m => ({
    name: m.cmd,
    check: `${m.cmd} --version`,
    installHint: `Install ${m.cmd} via your platform's method`,
  }));
}

// ── Public API ─────────────────────────────────────────────────────────────

async function check(step, _ctx) {
  // For package managers we do a best-effort probe via `which <target>` or equivalent
  const target = step.target;
  const result = probeCommand(process.platform === 'win32' ? 'where' : 'which', [target], { timeout: 5_000 });
  if (result.ok) return { installed: true, installedVersion: null, path: result.stdout.split('\n')[0].trim() || null };
  return { installed: false, installedVersion: null, path: null };
}

async function install(step, ctx) {
  const pkgName = step.package || step.target;
  const managers = detectPlatformManagers();

  if (managers.length === 0) {
    const hint = step.installHintUrl || 'Check your operating system documentation.';
    ctx.logger.warn(`package-manager: no package manager detected. Manual install required:\n  ${hint}`);
    return { success: false, method: HANDLER_NAME, log: `no-package-manager-detected` };
  }

  for (const mgr of managers) {
    if (mgr.cmd === 'choco' && process.platform === 'win32') {
      if (!isWindowsElevated()) {
        ctx.logger.warn(
          `package-manager: 'choco install ${pkgName}' requires Administrator. ` +
          `Re-run in PowerShell (Admin) or use --prefer-winget. Falling through to winget.`
        );
        continue; // fall through to winget
      }
    }

    if (mgr.cmd === 'winget') {
      const wingetState = probeWinget();
      if (!wingetState.available) continue;
      if (wingetState.consentNeeded) {
        ctx.logger.warn(
          `package-manager: winget terms not acknowledged. ` +
          `Run 'winget source update' once in a new terminal, then re-run this install.`
        );
        return { success: false, method: HANDLER_NAME, log: 'skipped-winget-terms-unacknowledged' };
      }
    }

    const cmds = buildCommands(mgr.cmd, pkgName);
    if (!cmds) continue;

    if (cmds.needsSudo) {
      ctx.logger.info(`package-manager: running: sudo ${mgr.cmd} ${cmds.installArgs.join(' ')}`);
    } else {
      ctx.logger.info(`package-manager: running: ${mgr.cmd} ${cmds.installArgs.join(' ')}`);
    }

    const finalCmd = cmds.needsSudo ? 'sudo' : mgr.cmd;
    const finalArgs = cmds.needsSudo ? [mgr.cmd, ...cmds.installArgs] : cmds.installArgs;

    runCommand(finalCmd, finalArgs, { timeout: 300_000 });
    return { success: true, method: `${HANDLER_NAME}:${mgr.cmd}`, log: `installed-via-${mgr.cmd}` };
  }

  const hint = step.installHintUrl || 'Check your OS documentation.';
  ctx.logger.warn(`package-manager: all package managers failed or unavailable. Manual install:\n  ${hint}`);
  return { success: false, method: HANDLER_NAME, log: `manual-install-required: ${hint}` };
}

async function uninstall(step, ctx) {
  const pkgName = step.package || step.target;
  const managers = detectPlatformManagers();

  for (const mgr of managers) {
    const cmds = buildCommands(mgr.cmd, pkgName);
    if (!cmds) continue;

    try {
      const finalCmd = cmds.needsSudo && process.platform !== 'win32' ? 'sudo' : mgr.cmd;
      const finalArgs = cmds.needsSudo && process.platform !== 'win32' ? [mgr.cmd, ...cmds.uninstallArgs] : cmds.uninstallArgs;
      runCommand(finalCmd, finalArgs, { timeout: 120_000 });
      return { success: true, log: `uninstalled-via-${mgr.cmd}` };
    } catch (err) {
      ctx.logger.warn(`package-manager: uninstall via ${mgr.cmd} failed: ${err.message}`);
      // Try next manager
    }
  }

  ctx.logger.warn(`package-manager: could not uninstall '${pkgName}' via any package manager.`);
  return { success: false, log: 'uninstall-failed-all-managers' };
}

async function verify(step, ctx) {
  if (step.verify) {
    const parts = step.verify.split(/\s+/);
    const result = probeCommand(parts[0], parts.slice(1), { timeout: 10_000 });
    if (result.ok) return { ok: true, reason: 'verify-command-passed' };
    return { ok: false, reason: `verify command failed: ${result.stderr}` };
  }
  const info = await check(step, ctx);
  if (!info.installed) return { ok: false, reason: `'${step.target}' not found on PATH` };
  return { ok: true, reason: `found@${info.path}` };
}

function manifest() {
  return { handler: HANDLER_NAME, version: HANDLER_VERSION };
}

module.exports = { name: HANDLER_NAME, check, install, uninstall, verify, listPrerequisites, manifest };
