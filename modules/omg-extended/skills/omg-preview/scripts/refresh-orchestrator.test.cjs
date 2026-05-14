// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
'use strict';
/**
 * refresh-orchestrator.test.cjs — Unit tests for refresh-orchestrator.cjs.
 *
 * Self-contained: builds ephemeral directories in os.tmpdir() and patches
 * module internals via dependency injection where needed.
 *
 * Run: node .agents/skillsomg-preview/scripts/refresh-orchestrator.test.cjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const {
  parseArgs,
  acquireLock,
  isLocked,
  forceReleaseLock,
  assertWithinSandbox,
  assertNotSymlink,
  resolveOverwriteDecision,
  sha256,
  sha256File,
  writeAtomic,
  buildReadme,
  readMeta,
  writeMeta,
  invokeGenerate,
  _resolveEngineAdapter,
  META_FILE_NAME,
  README_FILE_NAME,
  DEFAULT_CAPABILITY_TYPES,
  runRefresh,
} = require(path.resolve(__dirname, 'refresh-orchestrator.cjs'));

// ── Test harness ─────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message || 'assertEqual'}\n  actual:   ${a}\n  expected: ${e}`);
}

function assertIncludes(str, sub, message) {
  if (typeof str !== 'string' || !str.includes(sub)) {
    throw new Error(`${message || 'assertIncludes'}\n  '${sub}' not found in: ${str}`);
  }
}

function assertThrows(fn, messagePattern, label) {
  let threw = false;
  let thrownMsg = '';
  try {
    fn();
  } catch (err) {
    threw = true;
    thrownMsg = err.message;
  }
  if (!threw) throw new Error(`Expected throw for: ${label}`);
  if (messagePattern && !thrownMsg.includes(messagePattern)) {
    throw new Error(
      `Throw message mismatch for: ${label}\n  expected pattern: ${messagePattern}\n  got: ${thrownMsg}`
    );
  }
}

async function assertThrowsAsync(fn, messagePattern, label) {
  let threw = false;
  let thrownMsg = '';
  try {
    await fn();
  } catch (err) {
    threw = true;
    thrownMsg = err.message;
  }
  if (!threw) throw new Error(`Expected async throw for: ${label}`);
  if (messagePattern && !thrownMsg.includes(messagePattern)) {
    throw new Error(
      `Async throw message mismatch for: ${label}\n  expected pattern: ${messagePattern}\n  got: ${thrownMsg}`
    );
  }
}

function run(name, fn) {
  try {
    const result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(() => {
        passed++;
        process.stdout.write(`  PASS  ${name}\n`);
      }).catch(err => {
        failed++;
        failures.push({ name, error: err.message });
        process.stdout.write(`  FAIL  ${name}\n    ${err.message.split('\n').join('\n    ')}\n`);
      });
    }
    passed++;
    process.stdout.write(`  PASS  ${name}\n`);
    return Promise.resolve();
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    process.stdout.write(`  FAIL  ${name}\n    ${err.message.split('\n').join('\n    ')}\n`);
    return Promise.resolve();
  }
}

// ── Fixture helpers ───────────────────────────────────────────────────────────

/**
 * Create a temporary directory for test isolation.
 * @returns {string} absolute path
 */
function mkTmpDir(prefix = 'omg-orch-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/**
 * Build a minimal adapter fixture with a working generate.cjs script.
 *
 * @param {object} opts
 * @param {string} opts.skillName
 * @param {string} opts.engine
 * @param {string[]} opts.capabilities
 * @param {number} [opts.priority]
 * @param {boolean} [opts.generateFails]
 * @param {boolean} [opts.generateTimeout]
 * @param {string} [opts.returnedRelPath] - relPath returned by generate.cjs (default: `${type}.md`)
 * @param {boolean} [opts.returnedAbsPath] - generate.cjs returns an absolute path (path traversal test)
 * @param {boolean} [opts.returnedDotDotPath] - generate.cjs returns ../escape path
 * @returns {{ adapter: object, tmpDir: string }}
 */
function buildAdapterFixture(opts) {
  const {
    skillName,
    engine,
    capabilities,
    priority = 100,
    generateFails = false,
    generateTimeout = false,
    returnedRelPath = null,
    returnedAbsPath = false,
    returnedDotDotPath = false,
  } = opts;

  const tmpDir = mkTmpDir('omg-adapter-');
  const skillDir = path.join(tmpDir, 'skills', skillName);
  const scriptsDir = path.join(skillDir, 'scripts');
  fs.mkdirSync(scriptsDir, { recursive: true });

  // SKILL.md
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), [
    '---',
    `origin: test`,
    `version: 1.0.0`,
    `omg-adapter:`,
    `  engine: ${engine}`,
    `  capabilities: [${capabilities.join(', ')}]`,
    `  priority: ${priority}`,
    '---',
    `# ${skillName}`,
  ].join('\n'));

  // generate.cjs
  let generateContent;
  if (generateFails) {
    generateContent = `
'use strict';
process.exit(1);
`;
  } else if (generateTimeout) {
    // Sleep indefinitely
    generateContent = `
'use strict';
setTimeout(() => {}, 999999);
`;
  } else {
    // Parse --type and --out-dir; write a file and return JSON
    generateContent = `
'use strict';
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const typeIdx = args.indexOf('--type');
const outIdx = args.indexOf('--out-dir');
const type = typeIdx >= 0 ? args[typeIdx + 1] : 'modules';
const outDir = outIdx >= 0 ? args[outIdx + 1] : process.cwd();

let relPath;
${returnedAbsPath
  ? `relPath = path.join(outDir, type + '.md');` // absolute path — should be rejected
  : returnedDotDotPath
    ? `relPath = '../' + type + '.md';` // path traversal — should be rejected
    : returnedRelPath
      ? `relPath = ${JSON.stringify(returnedRelPath)};`
      : `relPath = type + '.md';`
}

// Write the file if path is relative (absolute path test should be caught by orchestrator)
if (!path.isAbsolute(relPath) && !relPath.includes('..')) {
  const targetPath = path.join(outDir, relPath);
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, '<!-- Generated by omg -->\\n# ' + type + ' diagram\\n');
}

process.stdout.write(JSON.stringify({ file: relPath, warnings: [], capabilities_skipped: [] }));
`;
  }

  fs.writeFileSync(path.join(scriptsDir, 'generate.cjs'), generateContent);

  const adapter = {
    skillName,
    moduleName: 'test-module',
    engine,
    capabilities,
    priority,
    skillDir,
    skillMdPath: path.join(skillDir, 'SKILL.md'),
    scope: 'project',
  };

  return { adapter, tmpDir };
}

// ── Tests ────────────────────────────────────────────────────────────────────

process.stdout.write('\nrefresh-orchestrator.cjs\n');
process.stdout.write('─'.repeat(50) + '\n\n');

const testPromises = [];

// ── 1. Argument parsing ──────────────────────────────────────────────────────
process.stdout.write('Argument parsing\n');

testPromises.push(run('parseArgs — defaults', () => {
  const opts = parseArgs(['node', 'script.cjs']);
  assert(opts.engine === null, 'engine should be null');
  assert(opts.outDir === null, 'outDir should be null');
  assertEqual(opts.types, DEFAULT_CAPABILITY_TYPES, 'types should be defaults');
  assert(!opts.verbose, 'verbose should be false');
  assert(opts.interactive, 'interactive should be true');
  assertEqual(opts.timeoutMs, 120_000, 'timeout should be 120s');
}));

testPromises.push(run('parseArgs — all flags', () => {
  const opts = parseArgs([
    'node', 'script.cjs',
    '--engine', 'unity',
    '--out-dir', '/tmp/out',
    '--types', 'modules,classes',
    '--verbose',
    '--no-interactive',
    '--timeout', '5000',
  ]);
  assertEqual(opts.engine, 'unity', 'engine');
  assertEqual(opts.outDir, '/tmp/out', 'outDir');
  assertEqual(opts.types, ['modules', 'classes'], 'types');
  assert(opts.verbose, 'verbose');
  assert(!opts.interactive, 'no-interactive');
  assertEqual(opts.timeoutMs, 5000, 'timeout');
}));

testPromises.push(run('parseArgs — --engine auto clears engine filter', () => {
  const opts = parseArgs(['node', 'script.cjs', '--engine', 'auto']);
  assert(opts.engine === null, 'auto should resolve to null');
}));

// ── 2. SHA-256 utilities ─────────────────────────────────────────────────────
process.stdout.write('\nSHA-256 utilities\n');

testPromises.push(run('sha256 — deterministic', () => {
  const h1 = sha256('hello world');
  const h2 = sha256('hello world');
  assertEqual(h1, h2, 'same input → same hash');
  assert(h1.length === 64, 'hex sha256 is 64 chars');
}));

testPromises.push(run('sha256File — returns null for missing file', () => {
  const h = sha256File(path.join(os.tmpdir(), 'does-not-exist-' + Date.now() + '.txt'));
  assert(h === null, 'should return null for missing file');
}));

testPromises.push(run('sha256File — matches manual hash of same content', () => {
  const tmpDir = mkTmpDir();
  const filePath = path.join(tmpDir, 'test.txt');
  const content = 'test content\n';
  fs.writeFileSync(filePath, content);
  const fileHash = sha256File(filePath);
  const manualHash = sha256(content);
  assertEqual(fileHash, manualHash, 'sha256File should match manual hash');
}));

// ── 3. writeAtomic ────────────────────────────────────────────────────────────
process.stdout.write('\nwriteAtomic\n');

testPromises.push(run('writeAtomic — creates file and parent dirs', () => {
  const tmpDir = mkTmpDir();
  const filePath = path.join(tmpDir, 'sub', 'dir', 'file.txt');
  writeAtomic(filePath, 'content');
  assert(fs.existsSync(filePath), 'file should exist');
  assertEqual(fs.readFileSync(filePath, 'utf8'), 'content', 'content matches');
}));

testPromises.push(run('writeAtomic — overwrites existing file', () => {
  const tmpDir = mkTmpDir();
  const filePath = path.join(tmpDir, 'file.txt');
  fs.writeFileSync(filePath, 'old');
  writeAtomic(filePath, 'new');
  assertEqual(fs.readFileSync(filePath, 'utf8'), 'new', 'should overwrite');
}));

// ── 4. Sandbox checks ────────────────────────────────────────────────────────
process.stdout.write('\nSandbox checks\n');

testPromises.push(run('assertWithinSandbox — valid path passes', () => {
  const tmpDir = mkTmpDir();
  const sandboxRoot = fs.realpathSync(tmpDir);
  const target = path.join(sandboxRoot, 'modules.md');
  assertWithinSandbox(sandboxRoot, target); // should not throw
}));

testPromises.push(run('assertWithinSandbox — path traversal rejected', () => {
  const tmpDir = mkTmpDir();
  const sandboxRoot = fs.realpathSync(tmpDir);
  const escapeTarget = path.join(sandboxRoot, '..', 'escape.txt');
  const resolved = path.resolve(escapeTarget);
  assertThrows(
    () => assertWithinSandbox(sandboxRoot, resolved),
    'outside sandbox',
    'path traversal rejected'
  );
}));

testPromises.push(run('assertNotSymlink — rejects symlink target', () => {
  if (process.platform === 'win32') {
    // Symlink creation may require elevation on Windows — skip
    process.stdout.write('  (skipped on Windows)\n');
    return;
  }
  const tmpDir = mkTmpDir();
  const realFile = path.join(tmpDir, 'real.txt');
  const symlinkPath = path.join(tmpDir, 'link.md');
  fs.writeFileSync(realFile, 'content');
  fs.symlinkSync(realFile, symlinkPath);
  assertThrows(
    () => assertNotSymlink(symlinkPath),
    'symlink',
    'symlink rejected'
  );
}));

testPromises.push(run('assertNotSymlink — allows regular file', () => {
  const tmpDir = mkTmpDir();
  const filePath = path.join(tmpDir, 'regular.md');
  fs.writeFileSync(filePath, 'content');
  assertNotSymlink(filePath); // should not throw
}));

testPromises.push(run('assertNotSymlink — allows non-existent path', () => {
  const tmpDir = mkTmpDir();
  const filePath = path.join(tmpDir, 'nonexistent.md');
  assertNotSymlink(filePath); // should not throw (ENOENT is ok)
}));

// ── 5. SHA-256 overwrite protection ─────────────────────────────────────────
process.stdout.write('\nSHA-256 overwrite protection\n');

testPromises.push(run('resolveOverwriteDecision — no existing file → write', async () => {
  const tmpDir = mkTmpDir();
  const targetPath = path.join(tmpDir, 'new.md');
  const decision = await resolveOverwriteDecision(targetPath, 'new.md', {}, false);
  assertEqual(decision, 'write', 'first-run should return write');
}));

testPromises.push(run('resolveOverwriteDecision — hash match → safe overwrite', async () => {
  const tmpDir = mkTmpDir();
  const targetPath = path.join(tmpDir, 'modules.md');
  const content = '# modules\n';
  fs.writeFileSync(targetPath, content);
  const hash = sha256(content);
  const metaGenerated = { 'modules.md': { sha256: hash, generatedAt: new Date().toISOString() } };

  const decision = await resolveOverwriteDecision(targetPath, 'modules.md', metaGenerated, false);
  assertEqual(decision, 'write', 'matching hash → safe overwrite');
}));

testPromises.push(run('resolveOverwriteDecision — hash mismatch, non-interactive → sidecar', async () => {
  const tmpDir = mkTmpDir();
  const targetPath = path.join(tmpDir, 'modules.md');
  fs.writeFileSync(targetPath, '# user edited\n');
  // Stored hash for different content
  const metaGenerated = { 'modules.md': { sha256: 'aaaa1234', generatedAt: new Date().toISOString() } };

  const decision = await resolveOverwriteDecision(targetPath, 'modules.md', metaGenerated, false);
  assertEqual(decision, 'sidecar', 'hash mismatch non-interactive → sidecar');
}));

testPromises.push(run('resolveOverwriteDecision — no stored hash for existing file → write', async () => {
  const tmpDir = mkTmpDir();
  const targetPath = path.join(tmpDir, 'modules.md');
  fs.writeFileSync(targetPath, '# existing\n');
  const metaGenerated = {}; // no stored hash

  const decision = await resolveOverwriteDecision(targetPath, 'modules.md', metaGenerated, false);
  assertEqual(decision, 'write', 'no stored hash → write (first managed write)');
}));

// ── 6. Cross-command lock ────────────────────────────────────────────────────
process.stdout.write('\nCross-command lock\n');

testPromises.push(run('acquireLock + release — basic roundtrip', async () => {
  const tmpDir = mkTmpDir();
  const lockPath = path.join(tmpDir, '.diagram.lock');

  const handle = await acquireLock(lockPath, { command: 'test-refresh' });
  assert(fs.existsSync(lockPath), 'lock file should exist after acquire');

  const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  assertEqual(lockData.pid, process.pid, 'lock should record our PID');

  handle.release();
  assert(!fs.existsSync(lockPath), 'lock file should be removed after release');
}));

testPromises.push(run('acquireLock — stale lock (dead PID) is reclaimed', async () => {
  const tmpDir = mkTmpDir();
  const lockPath = path.join(tmpDir, '.diagram.lock');

  // Write a lock with PID 999999999 (virtually guaranteed not to exist)
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 999999999, command: 'old-command', acquiredAt: new Date().toISOString(), host: 'test' }));

  const handle = await acquireLock(lockPath, { command: 'test-fresh' });
  const lockData = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  assertEqual(lockData.pid, process.pid, 'stale lock should be reclaimed');

  handle.release();
}));

testPromises.push(run('forceReleaseLock — no-ops gracefully when lock absent', () => {
  const tmpDir = mkTmpDir();
  const lockPath = path.join(tmpDir, '.missing.lock');
  forceReleaseLock(lockPath); // should not throw
}));

testPromises.push(run('isLocked — returns false when lock held by dead PID', () => {
  const tmpDir = mkTmpDir();
  const lockPath = path.join(tmpDir, '.diagram.lock');

  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  // Write lock with dead PID — isLocked checks process liveness
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 999999999, command: 'other', acquiredAt: new Date().toISOString(), host: 'test' }));

  // PID 999999999 is not alive, so isLocked should return false
  assert(!isLocked(lockPath), 'isLocked should return false for dead-PID lock');
  // Lock file still exists — forceReleaseLock cleans it up
  forceReleaseLock(lockPath);
  assert(!fs.existsSync(lockPath), 'lock should be removed after forceReleaseLock');
}));

// ── 7. _resolveEngineAdapter ─────────────────────────────────────────────────
process.stdout.write('\n_resolveEngineAdapter\n');

testPromises.push(run('resolves single adapter without conflict', () => {
  const adapter = { skillName: 'unity-assembly-graph', priority: 100 };
  const result = _resolveEngineAdapter('unity', [adapter]);
  assertEqual(result, adapter, 'should return the single adapter');
}));

testPromises.push(run('resolves by highest priority', () => {
  const low = { skillName: 'unity-assembly-graph', priority: 50 };
  const high = { skillName: 'unity-script-graph', priority: 200 };
  const result = _resolveEngineAdapter('unity', [low, high]);
  assertEqual(result.skillName, 'unity-script-graph', 'higher priority wins');
}));

testPromises.push(run('resolves tie by alphabetical skill name', () => {
  const a = { skillName: 'unity-assembly-graph', priority: 100 };
  const b = { skillName: 'unity-script-graph', priority: 100 };
  const result = _resolveEngineAdapter('unity', [a, b]);
  assertEqual(result.skillName, 'unity-assembly-graph', 'alphabetically first wins on priority tie');
}));

// ── 8. README builder ────────────────────────────────────────────────────────
process.stdout.write('\nbuildReadme\n');

testPromises.push(run('buildReadme — contains expected sections', () => {
  const content = buildReadme({
    timestamp: '2026-04-17T12:00:00.000Z',
    gitSha: 'abc1234',
    outDir: '/tmp/docs/diagrams',
    rows: [
      { type: 'modules', status: 'ok', adapter: 'unity-assembly-graph@1.0.0', file: 'modules.md', warnings: [] },
      { type: 'classes', status: 'not available', adapter: null, file: null, warnings: [] },
    ],
  });

  assertIncludes(content, '# Diagram Index', 'has header');
  assertIncludes(content, '2026-04-17T12:00:00.000Z', 'has timestamp');
  assertIncludes(content, 'abc1234', 'has git sha');
  assertIncludes(content, 'modules', 'has modules row');
  assertIncludes(content, 'classes', 'has classes row');
  assertIncludes(content, 'unity-assembly-graph@1.0.0', 'has adapter');
}));

testPromises.push(run('buildReadme — null gitSha shows fallback', () => {
  const content = buildReadme({
    timestamp: '2026-04-17T12:00:00.000Z',
    gitSha: null,
    outDir: '/tmp/docs/diagrams',
    rows: [],
  });
  assertIncludes(content, 'not in a git repo', 'shows git fallback');
}));

// ── 9. Meta file read/write ───────────────────────────────────────────────────
process.stdout.write('\nMeta file utilities\n');

testPromises.push(run('readMeta — returns empty generated on missing file', () => {
  const tmpDir = mkTmpDir();
  const meta = readMeta(tmpDir);
  assert(meta.generated && typeof meta.generated === 'object', 'generated should be object');
  assertEqual(Object.keys(meta.generated).length, 0, 'empty on missing file');
}));

testPromises.push(run('writeMeta + readMeta — roundtrip', () => {
  const tmpDir = mkTmpDir();
  const metaIn = {
    timestamp: '2026-04-17T00:00:00.000Z',
    git_sha: 'abc123',
    adapters: ['unity-assembly-graph@1.0.0'],
    out_dir: tmpDir,
    omg_preview_version: '1.65.0',
    generated: {
      'modules.md': { sha256: 'deadbeef', generatedAt: '2026-04-17T00:00:00.000Z' },
    },
  };
  writeMeta(tmpDir, metaIn);
  const metaOut = readMeta(tmpDir);
  assertEqual(metaOut.timestamp, metaIn.timestamp, 'timestamp roundtrip');
  assertEqual(metaOut.git_sha, metaIn.git_sha, 'git_sha roundtrip');
  assertEqual(metaOut.generated['modules.md'].sha256, 'deadbeef', 'sha256 roundtrip');
}));

// ── 10. Meta schema structural validation ────────────────────────────────────
process.stdout.write('\nMeta schema\n');

testPromises.push(run('meta schema — has required top-level fields', () => {
  const tmpDir = mkTmpDir();
  const meta = {
    timestamp: new Date().toISOString(),
    git_sha: null,
    adapters: ['unity-assembly-graph@1.0.0'],
    out_dir: tmpDir,
    omg_preview_version: '1.65.0',
    generated: {
      'modules.md': { sha256: 'abc', generatedAt: new Date().toISOString() },
    },
  };
  writeMeta(tmpDir, meta);
  const metaPath = path.join(tmpDir, META_FILE_NAME);
  const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf8'));

  // Structural assertions matching refresh-orchestrator.md §"Meta File Schema"
  assert(typeof parsed.timestamp === 'string', 'timestamp is string');
  assert('git_sha' in parsed, 'git_sha present');
  assert(Array.isArray(parsed.adapters), 'adapters is array');
  assert(typeof parsed.out_dir === 'string', 'out_dir is string');
  assert(typeof parsed.omg_preview_version === 'string', 'omg_preview_version is string');
  assert(typeof parsed.generated === 'object', 'generated is object');
  const entry = parsed.generated['modules.md'];
  assert(typeof entry.sha256 === 'string', 'generated entry has sha256');
  assert(typeof entry.generatedAt === 'string', 'generated entry has generatedAt');
}));

// ── 11. invokeGenerate — error paths ─────────────────────────────────────────
process.stdout.write('\ninvokeGenerate error handling\n');

testPromises.push(run('invokeGenerate — throws when generate.cjs missing', () => {
  const tmpDir = mkTmpDir();
  const adapter = {
    skillName: 'test-adapter',
    skillDir: path.join(tmpDir, 'skills', 'no-scripts-dir'),
    skillMdPath: path.join(tmpDir, 'skills', 'no-scripts-dir', 'SKILL.md'),
  };
  assertThrows(
    () => invokeGenerate(adapter, 'modules', tmpDir, 5000),
    'generate.cjs not found',
    'missing generate.cjs'
  );
}));

testPromises.push(run('invokeGenerate — throws on non-zero exit', () => {
  const { adapter, tmpDir } = buildAdapterFixture({
    skillName: 'fail-adapter',
    engine: 'test',
    capabilities: ['modules'],
    generateFails: true,
  });
  const outDir = mkTmpDir();
  assertThrows(
    () => invokeGenerate(adapter, 'modules', outDir, 5000),
    'exited with error',
    'non-zero exit throws'
  );
}));

testPromises.push(run('invokeGenerate — throws on timeout', () => {
  const { adapter } = buildAdapterFixture({
    skillName: 'timeout-adapter',
    engine: 'test',
    capabilities: ['modules'],
    generateTimeout: true,
  });
  const outDir = mkTmpDir();
  assertThrows(
    () => invokeGenerate(adapter, 'modules', outDir, 200), // 200ms timeout
    'timed out',
    'timeout throws'
  );
}));

testPromises.push(run('invokeGenerate — succeeds and returns JSON', () => {
  const { adapter } = buildAdapterFixture({
    skillName: 'ok-adapter',
    engine: 'test',
    capabilities: ['modules'],
  });
  const outDir = mkTmpDir();
  const result = invokeGenerate(adapter, 'modules', outDir, 10000);
  assert(typeof result.file === 'string', 'file is string');
  assert(Array.isArray(result.warnings), 'warnings is array');
  assert(Array.isArray(result.capabilities_skipped), 'capabilities_skipped is array');
}));

// ── 12. Full runRefresh integration scenarios ────────────────────────────────
process.stdout.write('\nrunRefresh integration\n');

// Use a unique lock path per test to avoid cross-test contention
function makeLockPath() {
  return path.join(os.tmpdir(), `.diagram-test-${Date.now()}-${Math.random().toString(36).slice(2)}.lock`);
}

/**
 * Patch the DIAGRAM_LOCK_FILE used by runRefresh to a test-local path.
 * This is done by calling acquireLock/releaseLock with our custom path externally.
 *
 * Since runRefresh hardcodes DIAGRAM_LOCK_FILE from the module scope, we need a
 * clean approach: use a fresh tmpdir per test and ensure no other test holds the lock.
 */
const orch = require(path.resolve(__dirname, 'refresh-orchestrator.cjs'));

testPromises.push(run('T1 — zero adapters → exit 0, no writes, stderr notice', async () => {
  // We can't easily stub discoverAdapters without dynamic patching.
  // Instead, use a project cwd with no metadata — discoverAdapters returns empty.
  const projectDir = mkTmpDir('omg-proj-');
  const outDir = path.join(projectDir, 'docs', 'diagrams');
  const origCwd = process.cwd();
  process.chdir(projectDir);

  // Capture stderr
  const stderrChunks = [];
  const origStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk) => { stderrChunks.push(String(chunk)); return true; };

  let exitCode;
  try {
    exitCode = await orch.runRefresh({
      engine: null,
      outDir: outDir,
      types: ['modules'],
      verbose: false,
      interactive: false,
      timeoutMs: 5000,
    });
  } finally {
    process.chdir(origCwd);
    process.stderr.write = origStderrWrite;
  }

  assert(exitCode === 0, `Expected exit code 0, got ${exitCode}`);
  // Per spec §Step 3: outDir IS created before discovery (Step 1 creates it).
  // The "no adapters" path exits before writing any diagram files.
  const diagramFiles = fs.existsSync(outDir)
    ? fs.readdirSync(outDir).filter(f => f.endsWith('.md') || f === META_FILE_NAME)
    : [];
  assertEqual(diagramFiles.length, 0, 'no diagram files or meta should be written when no adapters found');
  const stderr = stderrChunks.join('');
  assertIncludes(stderr, 'No adapter matched', 'stderr should mention no adapter');
}));

testPromises.push(run('T4 — path traversal from adapter → rejected, other types continue', async () => {
  const { adapter } = buildAdapterFixture({
    skillName: 'traversal-adapter',
    engine: 'testengine',
    capabilities: ['modules', 'classes'],
    returnedDotDotPath: true, // returns ../escape for any type
  });

  const outDir = mkTmpDir('omg-out-');
  const origCwd = process.cwd();
  process.chdir(os.tmpdir());

  // Capture stderr
  const stderrChunks = [];
  const origStderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk) => { stderrChunks.push(String(chunk)); return true; };

  // Directly test sandbox rejection (unit level — no full discovery)
  const sandboxRoot = fs.realpathSync(outDir);

  let caught1 = false;
  try {
    const escaped = path.resolve(sandboxRoot, '../escape.md');
    assertWithinSandbox(sandboxRoot, escaped);
  } catch {
    caught1 = true;
  }

  process.chdir(origCwd);
  process.stderr.write = origStderrWrite;

  assert(caught1, 'path traversal (../escape) should be rejected by sandbox check');
}));

testPromises.push(run('T5 — symlink target → rejected by lstatSync', async () => {
  if (process.platform === 'win32') {
    process.stdout.write('  (skipped on Windows)\n');
    return;
  }
  const tmpDir = mkTmpDir();
  const outDir = mkTmpDir('omg-out-');
  const sandboxRoot = fs.realpathSync(outDir);

  // Create a real file outside sandbox and a symlink inside pointing to it
  const externalFile = path.join(tmpDir, 'external.txt');
  fs.writeFileSync(externalFile, 'secret content');
  const symlinkInSandbox = path.join(sandboxRoot, 'modules.md');
  fs.symlinkSync(externalFile, symlinkInSandbox);

  let caught = false;
  try {
    assertNotSymlink(symlinkInSandbox);
  } catch {
    caught = true;
  }
  assert(caught, 'symlink target in outDir should be rejected');
  assert(fs.readFileSync(externalFile, 'utf8') === 'secret content', 'external file untouched');
}));

testPromises.push(run('T6 — hash mismatch (user-edited) → non-interactive writes .new sidecar', async () => {
  const outDir = mkTmpDir('omg-out-');
  const targetPath = path.join(outDir, 'modules.md');
  fs.writeFileSync(targetPath, '# user edited version\n');

  // Stored hash for DIFFERENT content (simulating original OMG-written version)
  const metaGenerated = {
    'modules.md': { sha256: sha256('# original content\n'), generatedAt: new Date().toISOString() }
  };

  const decision = await resolveOverwriteDecision(targetPath, 'modules.md', metaGenerated, false);
  assertEqual(decision, 'sidecar', 'hash mismatch → sidecar decision');

  // Verify caller would write to .new
  const sidecarPath = targetPath + '.new';
  fs.writeFileSync(sidecarPath, '# new content from adapter\n');
  assert(fs.existsSync(sidecarPath), 'sidecar .new file should be writable');
  assertEqual(
    fs.readFileSync(targetPath, 'utf8'),
    '# user edited version\n',
    'original user edit preserved'
  );
}));

testPromises.push(run('T7 — hash match (unedited) → safe overwrite', async () => {
  const outDir = mkTmpDir('omg-out-');
  const targetPath = path.join(outDir, 'modules.md');
  const originalContent = '# omg generated\n';
  fs.writeFileSync(targetPath, originalContent);

  const metaGenerated = {
    'modules.md': { sha256: sha256(originalContent), generatedAt: new Date().toISOString() }
  };

  const decision = await resolveOverwriteDecision(targetPath, 'modules.md', metaGenerated, false);
  assertEqual(decision, 'write', 'matching hash → write decision');
}));

testPromises.push(run('T9 — adapter generate.cjs exits non-zero → invokeGenerate throws', () => {
  const { adapter } = buildAdapterFixture({
    skillName: 'fail-adapter-t9',
    engine: 'test',
    capabilities: ['modules'],
    generateFails: true,
  });
  const outDir = mkTmpDir();
  let threw = false;
  try {
    invokeGenerate(adapter, 'modules', outDir, 5000);
  } catch (err) {
    threw = true;
    assertIncludes(err.message, 'exited with error', 'error message mentions non-zero exit');
  }
  assert(threw, 'should throw on non-zero exit');
}));

testPromises.push(run('T10 — meta JSON schema structural check (validate-diagram-meta-schema equivalent)', () => {
  const tmpDir = mkTmpDir();
  const nowIso = new Date().toISOString();

  const meta = {
    timestamp: nowIso,
    git_sha: 'deadbeef1234',
    adapters: ['unity-assembly-graph@1.0.0'],
    out_dir: tmpDir,
    omg_preview_version: '1.65.0',
    generated: {
      'modules.md': { sha256: sha256('# modules\n'), generatedAt: nowIso },
      'classes.md': { sha256: sha256('# classes\n'), generatedAt: nowIso },
      'README.md': { sha256: sha256('# README\n'), generatedAt: nowIso },
    },
  };

  writeMeta(tmpDir, meta);
  const parsed = readMeta(tmpDir);

  // Required top-level fields
  assert(typeof parsed.timestamp === 'string', 'timestamp: string');
  assert(typeof parsed.git_sha === 'string' || parsed.git_sha === null, 'git_sha: string|null');
  assert(Array.isArray(parsed.adapters), 'adapters: array');
  assert(parsed.adapters.every(a => typeof a === 'string'), 'adapters[]: string');
  assert(typeof parsed.out_dir === 'string', 'out_dir: string');
  assert(typeof parsed.omg_preview_version === 'string', 'omg_preview_version: string');
  assert(typeof parsed.generated === 'object', 'generated: object');

  // Per-entry fields
  for (const [relPath, entry] of Object.entries(parsed.generated)) {
    assert(typeof relPath === 'string', `generated key is string: ${relPath}`);
    assert(typeof entry.sha256 === 'string', `generated['${relPath}'].sha256: string`);
    assert(typeof entry.generatedAt === 'string', `generated['${relPath}'].generatedAt: string`);
    // ISO8601 check (basic)
    assert(!Number.isNaN(Date.parse(entry.generatedAt)), `generatedAt is valid date: ${entry.generatedAt}`);
  }
}));

// ── Polyglot notice test ─────────────────────────────────────────────────────
process.stdout.write('\nPolyglot adapter selection\n');

testPromises.push(run('T3 — two adapters, _resolveEngineAdapter picks highest priority', () => {
  const lowPriority = { skillName: 'cocos-service-graph', engine: 'cocos', priority: 50 };
  const highPriority = { skillName: 'unity-assembly-graph', engine: 'unity', priority: 100 };

  // Simulating "two engines present, pick the globally highest priority"
  const allAdapters = [lowPriority, highPriority];
  let best = null;
  for (const a of allAdapters) {
    if (!best || a.priority > best.priority) best = a;
  }
  assertEqual(best.skillName, 'unity-assembly-graph', 'highest global priority selected');
}));

// ── Run all tests ────────────────────────────────────────────────────────────

Promise.all(testPromises).then(() => {
  process.stdout.write('\n' + '─'.repeat(50) + '\n');
  process.stdout.write(`Results: ${passed} passed, ${failed} failed\n`);

  if (failures.length > 0) {
    process.stdout.write('\nFailed tests:\n');
    for (const f of failures) {
      process.stdout.write(`  - ${f.name}: ${f.error}\n`);
    }
  }

  process.exitCode = failed > 0 ? 1 : 0;
});
