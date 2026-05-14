// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
/**
 * index.cjs — Handler registry for `omg diagram install`.
 *
 * Exports:
 *   BUILT_IN_HANDLERS   — map of name → handler module for all core handlers
 *   resolveHandler(step, kitSkillDir) → handler module
 *
 * Resolution order (per adapter-contract.md §"Handler resolution order"):
 *   1. step.handler names a core handler → use it; ignore handlerPath.
 *   2. step.handlerPath set → resolve relative to kitSkillDir; validate export shape.
 *   3. Neither → hard error.
 *
 * Kit-shipped handlers must export the same interface as core handlers:
 *   { install, uninstall, verify, manifest } (listPrerequisites optional).
 */
'use strict';

const path = require('path');
const fs = require('fs');

// ── Built-in handler registry ──────────────────────────────────────────────

const BUILT_IN_HANDLERS = {
  'npm-global':       require('./npm-global.cjs'),
  'npm-project':      require('./npm-project.cjs'),
  'dotnet-tool':      require('./dotnet-tool.cjs'),
  'binary-download':  require('./binary-download.cjs'),
  'jar-download':     require('./jar-download.cjs'),
  'package-manager':  require('./package-manager.cjs'),
};

// ── Required export shape ──────────────────────────────────────────────────

const REQUIRED_EXPORTS = ['install', 'uninstall', 'verify', 'manifest'];

/**
 * Validate that a handler module exports the required functions.
 * Throws a descriptive error on shape violation.
 *
 * @param {object} mod
 * @param {string} source  e.g. "npm-global" or "/path/to/go-install.cjs"
 */
function validateHandlerShape(mod, source) {
  if (!mod || typeof mod !== 'object') {
    throw new Error(`Handler '${source}' is not a valid module — expected an object with exports.`);
  }
  for (const fn of REQUIRED_EXPORTS) {
    if (typeof mod[fn] !== 'function') {
      throw new Error(
        `Handler '${source}' is missing required export '${fn}'. ` +
        `All handlers must export: ${REQUIRED_EXPORTS.join(', ')}.`
      );
    }
  }
}

// ── Kit-shipped handler loader ─────────────────────────────────────────────

/**
 * Load a kit-shipped handler from an absolute path.
 * Throws on missing file, path traversal out of kitSkillDir, or shape violation.
 *
 * @param {string} absPath      Resolved absolute path to the handler .cjs
 * @param {string} kitSkillDir  Absolute path to the adapter skill directory (sandbox root)
 * @returns {object} handler module
 */
function loadKitHandler(absPath, kitSkillDir) {
  const normalized = path.normalize(absPath);
  // Security: ensure the resolved path stays within kitSkillDir (no escaping via ../)
  const sandboxRoot = path.normalize(kitSkillDir) + path.sep;
  if (!normalized.startsWith(sandboxRoot) && normalized !== path.normalize(kitSkillDir)) {
    throw new Error(`Handler path rejected — path traversal detected: '${absPath}' escapes skill directory '${kitSkillDir}'`);
  }
  if (!fs.existsSync(normalized)) {
    throw new Error(`Kit handler not found at path: ${normalized}`);
  }
  const mod = require(normalized);
  validateHandlerShape(mod, normalized);
  return mod;
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Resolve the correct handler for an install step.
 *
 * @param {{ target: string, handler?: string, handlerPath?: string }} step
 *   step.handler      — name of a core built-in handler (e.g. 'npm-global')
 *   step.handlerPath  — path relative to kitSkillDir; used only when step.handler absent
 * @param {string} [kitSkillDir]  Absolute path to the adapter skill directory.
 *   Required only when step.handlerPath is used.
 * @returns {object} handler module with { install, uninstall, verify, manifest }
 * @throws {Error} on missing handler or shape violation
 */
function resolveHandler(step, kitSkillDir) {
  // Prefer built-in by name
  if (step.handler) {
    const builtin = BUILT_IN_HANDLERS[step.handler];
    if (builtin) return builtin;
    // Named handler not found in built-ins — do NOT silently fall through to handlerPath
    throw new Error(
      `Step '${step.target}' references unknown built-in handler '${step.handler}'. ` +
      `Available handlers: ${Object.keys(BUILT_IN_HANDLERS).join(', ')}. ` +
      `To use a kit-shipped handler, set 'handlerPath' instead of 'handler'.`
    );
  }

  // Kit-shipped handler via handlerPath
  if (step.handlerPath) {
    if (!kitSkillDir) {
      throw new Error(
        `Step '${step.target}' uses handlerPath '${step.handlerPath}' but kitSkillDir was not provided. ` +
        `Pass the absolute path to the adapter skill directory as the second argument.`
      );
    }
    const absHandlerPath = path.resolve(kitSkillDir, step.handlerPath);
    return loadKitHandler(absHandlerPath, kitSkillDir);
  }

  // Neither handler nor handlerPath
  throw new Error(
    `Step '${step.target}' references no handler. ` +
    `Set 'handler' to a core handler name or 'handlerPath' to a kit-shipped handler file.`
  );
}

module.exports = { BUILT_IN_HANDLERS, resolveHandler };
