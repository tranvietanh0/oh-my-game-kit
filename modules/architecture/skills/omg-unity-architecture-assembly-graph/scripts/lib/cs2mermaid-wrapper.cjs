#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-unity | repo=The1Studio/oh-my-game-kit-unity | module=unity-architecture | protected=false
'use strict';

/**
 * cs2mermaid-wrapper.cjs
 *
 * Wraps the cs2mmd CLI tool (Cs2Mermaid) for per-.asmdef invocation.
 * For each asmdef:
 *   1. Collect .cs files under its directory (respecting includes/excludes)
 *   2. Copy to temp dir (cs2mmd requires a directory input)
 *   3. Invoke cs2mmd subprocess with timeout
 *   4. Post-process output via unity-stereotype-postprocessor.cjs
 *   5. Return per-asmdef Mermaid content
 *
 * Exports:
 *   generateClassDiagramForAsmdef(asmdefNode, options) -> Promise<{mermaid, warnings, skipped}>
 *   generateClassDiagrams(asmdefNodes, options) -> Promise<Array<{name, mermaid, warnings, skipped}>>
 *
 * If cs2mmd is not on PATH, all asmdefs are returned with skipped=true and a diagnostic message.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');
const { postprocess } = require('./unity-stereotype-postprocessor.cjs');

const DEFAULT_TIMEOUT_MS = 60_000;
const SKIP_DIRS = new Set(['Library', 'Temp', 'Logs', 'obj', 'bin', 'node_modules', '.git', 'Editor', 'Tests']);
const MAX_DEPTH = 10;

/**
 * Check if cs2mmd is available on PATH.
 */
function isCs2mmdAvailable() {
  const result = spawnSync('cs2mmd', ['--version'], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  return result.status === 0 || result.error == null;
}

/**
 * Recursively find all .cs files under a directory.
 */
function findCsFiles(dir, depth = 0, includeGenerated = false) {
  if (depth > MAX_DEPTH) return [];
  let results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    if (entry.isDirectory()) {
      results = results.concat(findCsFiles(path.join(dir, entry.name), depth + 1, includeGenerated));
    } else if (entry.isFile() && entry.name.endsWith('.cs')) {
      if (!includeGenerated && entry.name.endsWith('.generated.cs')) continue;
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

/**
 * Generate a class diagram for a single asmdef node.
 *
 * @param {object} asmdefNode - node from asmdef-parser
 * @param {object} options
 * @param {boolean} [options.includeGenerated=false]
 * @param {number} [options.timeoutMs=60000]
 * @returns {Promise<{name: string, mermaid: string, warnings: string[], skipped: boolean, skipReason: string|null}>}
 */
async function generateClassDiagramForAsmdef(asmdefNode, options = {}) {
  const { includeGenerated = false, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const { name, dir } = asmdefNode;

  if (!isCs2mmdAvailable()) {
    return {
      name,
      mermaid: generateSkipNotice(name, 'cs2mmd not found on PATH. Install via: omg diagram install cs2mermaid'),
      warnings: [],
      skipped: true,
      skipReason: 'cs2mmd not installed'
    };
  }

  const csFiles = findCsFiles(dir, 0, includeGenerated);
  if (csFiles.length === 0) {
    return {
      name,
      mermaid: `classDiagram\n  note "No .cs files found in ${path.relative(process.cwd(), dir) || dir}"`,
      warnings: [`No .cs files in ${dir}`],
      skipped: false,
      skipReason: null
    };
  }

  // Create temp directory for this asmdef
  const tmpBase = os.tmpdir();
  const tmpDir = path.join(tmpBase, `omg-cs2mmd-${name.replace(/[^a-zA-Z0-9]/g, '_')}-${Date.now()}`);
  const outFile = path.join(tmpDir, 'out.mmd');

  try {
    fs.mkdirSync(tmpDir, { recursive: true });

    // Copy .cs files to temp dir (cs2mmd takes a flat directory)
    for (const csFile of csFiles) {
      const destName = path.basename(csFile);
      // Handle name collisions by prefixing parent dir
      let dest = path.join(tmpDir, destName);
      if (fs.existsSync(dest)) {
        dest = path.join(tmpDir, `${path.basename(path.dirname(csFile))}_${destName}`);
      }
      fs.copyFileSync(csFile, dest);
    }

    // Invoke cs2mmd
    try {
      execFileSync('cs2mmd', ['-i', tmpDir, '-o', outFile], {
        windowsHide: true,
        timeout: timeoutMs,
        stdio: ['pipe', 'pipe', 'ignore']
      });
    } catch (err) {
      if (err.signal === 'SIGTERM' || err.code === 'ETIMEDOUT') {
        const notice = generateTimeoutNotice(name, timeoutMs);
        return { name, mermaid: notice, warnings: [`cs2mmd timed out after ${timeoutMs / 1000}s`], skipped: false, skipReason: null };
      }
      const msg = err.stderr ? err.stderr.toString() : err.message;
      const notice = generateErrorNotice(name, msg);
      return { name, mermaid: notice, warnings: [`cs2mmd failed: ${msg.slice(0, 200)}`], skipped: false, skipReason: null };
    }

    // Read output
    let rawMermaid;
    try {
      rawMermaid = fs.readFileSync(outFile, 'utf8');
    } catch {
      // cs2mmd may produce .md file instead
      const mdOut = outFile.replace('.mmd', '.md');
      try {
        rawMermaid = fs.readFileSync(mdOut, 'utf8');
        // Strip markdown code fences if present
        const fenceMatch = rawMermaid.match(/```mermaid\n([\s\S]*?)```/);
        if (fenceMatch) rawMermaid = fenceMatch[1];
      } catch {
        return {
          name,
          mermaid: generateErrorNotice(name, 'cs2mmd produced no output file'),
          warnings: ['No output file from cs2mmd'],
          skipped: false,
          skipReason: null
        };
      }
    }

    // Post-process: inject Unity stereotypes
    const { mermaid, warnings } = postprocess(rawMermaid, csFiles);

    return { name, mermaid, warnings, skipped: false, skipReason: null };
  } finally {
    // Clean up temp dir
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // best-effort
    }
  }
}

/**
 * Generate class diagrams for multiple asmdefs using a bounded worker pool.
 *
 * @param {object[]} asmdefNodes
 * @param {object} options
 * @param {number} [options.concurrency] - defaults to min(8, cpuCount)
 * @param {boolean} [options.includeGenerated=false]
 * @param {number} [options.timeoutMs=60000]
 * @returns {Promise<Array<{name, mermaid, warnings, skipped, skipReason}>>}
 */
async function generateClassDiagrams(asmdefNodes, options = {}) {
  const { concurrency = Math.min(8, os.cpus().length), ...rest } = options;

  const results = new Array(asmdefNodes.length);
  let idx = 0;

  async function worker() {
    while (idx < asmdefNodes.length) {
      const i = idx++;
      results[i] = await generateClassDiagramForAsmdef(asmdefNodes[i], rest);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, asmdefNodes.length) }, worker);
  await Promise.all(workers);
  return results;
}

function generateSkipNotice(asmdefName, reason) {
  return `classDiagram\n  note "⚠️ ${asmdefName}: ${reason}"`;
}

function generateTimeoutNotice(asmdefName, timeoutMs) {
  return `classDiagram\n  note "⚠️ Timed out after ${timeoutMs / 1000}s — consider --include-generated=false or split asmdef"`;
}

function generateErrorNotice(asmdefName, reason) {
  return `classDiagram\n  note "⚠️ Error generating diagram: ${reason.replace(/"/g, "'").slice(0, 200)}"`;
}

module.exports = { generateClassDiagramForAsmdef, generateClassDiagrams, isCs2mmdAvailable };
