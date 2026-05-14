// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * subprocess-utils.cjs — Shared subprocess helpers for install handlers.
 * All handlers that invoke external processes use these utilities to ensure
 * cross-platform correctness and consistent error reporting.
 *
 * Cross-platform: windowsHide: true, no 2>/dev/null, path.join() only, os.tmpdir().
 */
'use strict';

const { execFileSync } = require('child_process');

/**
 * Run a command via execFileSync with safe cross-platform options.
 * Returns stdout as string. Throws with context on failure.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, env?: object, timeout?: number }} [opts]
 * @returns {string} stdout
 */
function runCommand(cmd, args, opts = {}) {
  try {
    const result = execFileSync(cmd, args, {
      cwd: opts.cwd || process.cwd(),
      env: opts.env || process.env,
      timeout: opts.timeout || 30_000,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result ? result.toString('utf8').trim() : '';
  } catch (err) {
    const stderr = err.stderr ? err.stderr.toString('utf8').trim() : '';
    const stdout = err.stdout ? err.stdout.toString('utf8').trim() : '';
    throw new HandlerExecError(cmd, args, err.status || 1, stderr || stdout, err);
  }
}

/**
 * Run a command and return { ok, stdout, stderr, exitCode } — never throws.
 * Use for probe/check operations where failure is expected.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd?: string, timeout?: number }} [opts]
 * @returns {{ ok: boolean, stdout: string, stderr: string, exitCode: number }}
 */
function probeCommand(cmd, args, opts = {}) {
  try {
    const stdout = runCommand(cmd, args, opts);
    return { ok: true, stdout, stderr: '', exitCode: 0 };
  } catch (err) {
    if (err instanceof HandlerExecError) {
      return { ok: false, stdout: '', stderr: err.stderr, exitCode: err.exitCode };
    }
    // ENOENT = command not found
    if (err.code === 'ENOENT') {
      return { ok: false, stdout: '', stderr: `Command not found: ${cmd}`, exitCode: 127 };
    }
    return { ok: false, stdout: '', stderr: String(err), exitCode: -1 };
  }
}

/**
 * Check whether a command exists on PATH by probing it with --version or -version.
 * Returns { found: boolean, version?: string }.
 */
function commandExists(cmd, versionArgs = ['--version']) {
  const result = probeCommand(cmd, versionArgs, { timeout: 5_000 });
  if (!result.ok && result.exitCode === 127) return { found: false };
  // Many tools output version to stderr (e.g. java -version)
  const output = result.stdout || result.stderr;
  return { found: true, version: output };
}

// ── Custom error ───────────────────────────────────────────────────────────

class HandlerExecError extends Error {
  /**
   * @param {string} cmd
   * @param {string[]} args
   * @param {number} exitCode
   * @param {string} stderr
   * @param {Error} [cause]
   */
  constructor(cmd, args, exitCode, stderr, cause) {
    super(`Command failed (exit ${exitCode}): ${cmd} ${args.join(' ')}\n${stderr}`);
    this.name = 'HandlerExecError';
    this.cmd = cmd;
    this.args = args;
    this.exitCode = exitCode;
    this.stderr = stderr;
    if (cause) this.cause = cause;
  }
}

class PrerequisiteError extends Error {
  /**
   * @param {string} prerequisite  e.g. "Node.js >= 18"
   * @param {string} installHint
   */
  constructor(prerequisite, installHint) {
    super(`Missing prerequisite: ${prerequisite}. Install it first:\n  ${installHint}`);
    this.name = 'PrerequisiteError';
    this.prerequisite = prerequisite;
    this.installHint = installHint;
  }
}

class VerificationError extends Error {
  constructor(tool, reason) {
    super(`Verification failed for '${tool}': ${reason}`);
    this.name = 'VerificationError';
    this.tool = tool;
  }
}

module.exports = { runCommand, probeCommand, commandExists, HandlerExecError, PrerequisiteError, VerificationError };
