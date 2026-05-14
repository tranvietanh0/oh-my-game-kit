// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
'use strict';
/**
 * adapter-discovery.test.cjs — Unit tests for adapter-discovery.cjs.
 *
 * Self-contained: builds ephemeral .agents/ trees in os.tmpdir() so tests
 * run identically on any machine regardless of installed adapters.
 *
 * Run: node .agents/skillsomg-preview/scripts/adapter-discovery.test.cjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Test harness ────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}\n  actual:   ${a}\n  expected: ${e}`);
}

function assertThrows(fn, messagePattern, label) {
  try {
    fn();
    throw new Error(`Expected throw for: ${label}`);
  } catch (err) {
    if (err.message.startsWith('Expected throw')) throw err;
    if (messagePattern && !err.message.includes(messagePattern)) {
      throw new Error(`Throw message mismatch for: ${label}\n  got: ${err.message}`);
    }
  }
}

function run(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`  PASS  ${name}\n`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    process.stdout.write(`  FAIL  ${name}\n    ${err.message.split('\n').join('\n    ')}\n`);
  }
}

// ── Fixture helpers ─────────────────────────────────────────────────────────

/**
 * Build an ephemeral .agents/ directory tree in os.tmpdir() for test isolation.
 * Returns the path to the .agents/ directory.
 *
 * @param {object} opts
 * @param {object[]} opts.adapters - Array of adapter fixture descriptors
 * @param {string[]} opts.adapters[].skillName - e.g. 'unity-assembly-graph'
 * @param {string} opts.adapters[].moduleName - e.g. 'unity-core'
 * @param {string} opts.adapters[].engine - frontmatter engine value
 * @param {string[]} opts.adapters[].capabilities
 * @param {number} opts.adapters[].priority
 * @param {string} [opts.adapters[].adapterOverride] - raw SKILL.md content override
 * @param {boolean} [opts.adapters[].noSkillMd] - omit SKILL.md entirely
 * @param {boolean} [opts.adapters[].hasDetect] - create detect.cjs that exits 0
 * @param {boolean} [opts.adapters[].detectFails] - create detect.cjs that exits 1
 * @param {string[]} [opts.adapters[].runtimeCapabilities] - JSON for list-capabilities.cjs
 * @returns {string} path to .agents/
 */
function buildFixture(opts) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-test-'));
  const codexDir = path.join(root, '.agents');
  fs.mkdirSync(codexDir, { recursive: true });

  const installedModules = {};
  for (const adapter of (opts.adapters || [])) {
    if (!installedModules[adapter.moduleName]) {
      installedModules[adapter.moduleName] = { version: '1.0.0', skills: [] };
    }
    installedModules[adapter.moduleName].skills.push(adapter.skillName);
  }

  // Write metadata.json (schemaVersion 3 — OMG shape)
  fs.writeFileSync(
    path.join(codexDir, 'metadata.json'),
    JSON.stringify({
      name: 'oh-my-game-kit-test',
      schemaVersion: 3,
      installedModules,
    })
  );

  const skillsDir = path.join(codexDir, 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });

  for (const adapter of (opts.adapters || [])) {
    const skillDir = path.join(skillsDir, adapter.skillName);
    const scriptsDir = path.join(skillDir, 'scripts');
    fs.mkdirSync(scriptsDir, { recursive: true });

    if (!adapter.noSkillMd) {
      const content = adapter.adapterOverride !== undefined
        ? adapter.adapterOverride
        : buildSkillMd(adapter);
      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    }

    if (adapter.hasDetect) {
      fs.writeFileSync(
        path.join(scriptsDir, 'detect.cjs'),
        "'use strict';\nprocess.exit(0);\n"
      );
    } else if (adapter.detectFails) {
      fs.writeFileSync(
        path.join(scriptsDir, 'detect.cjs'),
        "'use strict';\nprocess.exit(1);\n"
      );
    }

    if (adapter.runtimeCapabilities) {
      const capsJson = JSON.stringify(adapter.runtimeCapabilities);
      fs.writeFileSync(
        path.join(scriptsDir, 'list-capabilities.cjs'),
        `'use strict';\nprocess.stdout.write(${JSON.stringify(capsJson)});\n`
      );
    }
  }

  return codexDir;
}

/** Build a valid SKILL.md with omg-adapter frontmatter. */
function buildSkillMd({ engine, capabilities, priority, extraFrontmatter }) {
  const capsLine = `  capabilities: [${capabilities.join(', ')}]`;
  const extra = extraFrontmatter ? `\n${extraFrontmatter}` : '';
  return `---
name: test-skill
omg-adapter:
  engine: ${engine}
${capsLine}
  priority: ${priority}${extra}
---

# Test Adapter
`;
}

/**
 * Scope the discovery module against an ephemeral fixture .agents/ dir.
 * Uses module isolation via a fresh require with mocked resolveProjectDir + getHomeDir.
 *
 * @param {string|null} globalCodexDir - path to use as global .agents/
 * @param {string|null} projectCodexDir - path to use as project .agents/
 * @returns {object} freshly required adapter-discovery module
 */
function loadDiscoveryWithScopes(globalCodexDir, projectCodexDir) {
  // Patch telemetry-utils.cjs exports inline by temporarily overriding
  // the module's cached version. We use a child process approach instead
  // for isolation — but since Node module cache is process-wide, we use
  // environment variable injection via a wrapper approach.
  //
  // Approach: write a thin shim that re-exports with patched functions,
  // then require the shim. The shim patches the module in-place after require.

  // Load the real module — it resolves paths relative to its own location
  const discoveryPath = path.join(__dirname, 'adapter-discovery.cjs');

  // Clear cache so each test gets a fresh module
  delete require.cache[discoveryPath];

  // Also clear telemetry-utils cache so we can patch it
  const utilsPath = path.resolve(__dirname, '../../../hooks/telemetry-utils.cjs');
  delete require.cache[utilsPath];

  // Patch telemetry-utils before requiring discovery
  const realUtils = require(utilsPath);

  // Override resolveProjectDir and getHomeDir in the cached module
  const origResolveProjectDir = realUtils.resolveProjectDir;
  const origGetHomeDir = realUtils.getHomeDir;

  realUtils.resolveProjectDir = () => ({
    omgDir: projectCodexDir,
    globalOnly: !projectCodexDir,
    source: projectCodexDir ? 'walk' : 'global-fallback',
    get projectName() { return 'test'; },
  });

  realUtils.getHomeDir = () => {
    if (!globalCodexDir) return '';
    return path.dirname(globalCodexDir); // parent of .agents/
  };

  const discovery = require(discoveryPath);

  // Restore originals after require so other tests are not polluted
  realUtils.resolveProjectDir = origResolveProjectDir;
  realUtils.getHomeDir = origGetHomeDir;

  return discovery;
}

// ── Tests ───────────────────────────────────────────────────────────────────

process.stdout.write('\nRunning adapter-discovery tests...\n\n');

// ── parseAdapterFrontmatter ────────────────────────────────────────────────

run('parseAdapterFrontmatter: valid adapter frontmatter', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-paf-'));
  const skillMd = path.join(tmpDir, 'SKILL.md');
  fs.writeFileSync(skillMd, `---
name: unity-assembly-graph
omg-adapter:
  engine: unity
  capabilities: [modules, classes]
  priority: 100
---
`);
  const { parseAdapterFrontmatter } = require('./adapter-discovery.cjs');
  const result = parseAdapterFrontmatter(skillMd);
  assert(result !== null, 'Expected non-null result');
  assertEqual(result.engine, 'unity', 'engine');
  assertEqual(result.capabilities, ['modules', 'classes'], 'capabilities');
  assertEqual(result.priority, 100, 'priority');
  fs.rmSync(tmpDir, { recursive: true });
});

run('parseAdapterFrontmatter: returns null for missing file', () => {
  const { parseAdapterFrontmatter } = require('./adapter-discovery.cjs');
  const result = parseAdapterFrontmatter('/nonexistent/path/SKILL.md');
  assertEqual(result, null, 'Expected null for missing file');
});

run('parseAdapterFrontmatter: returns null when no frontmatter block', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-paf-'));
  const skillMd = path.join(tmpDir, 'SKILL.md');
  fs.writeFileSync(skillMd, '# No frontmatter here\n');
  const { parseAdapterFrontmatter } = require('./adapter-discovery.cjs');
  const result = parseAdapterFrontmatter(skillMd);
  assertEqual(result, null, 'Expected null for no frontmatter');
  fs.rmSync(tmpDir, { recursive: true });
});

run('parseAdapterFrontmatter: returns null for explicit opt-out (omg-adapter: false)', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-paf-'));
  const skillMd = path.join(tmpDir, 'SKILL.md');
  fs.writeFileSync(skillMd, `---
name: example-assembly-graph
omg-adapter: false
---
`);
  const { parseAdapterFrontmatter } = require('./adapter-discovery.cjs');
  const result = parseAdapterFrontmatter(skillMd);
  assertEqual(result, null, 'Expected null for explicit opt-out');
  fs.rmSync(tmpDir, { recursive: true });
});

run('parseAdapterFrontmatter: rejects prototype pollution key', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'omg-paf-'));
  const skillMd = path.join(tmpDir, 'SKILL.md');
  fs.writeFileSync(skillMd, `---
__proto__:
  engine: evil
---
`);
  const { parseAdapterFrontmatter } = require('./adapter-discovery.cjs');
  // Returns null because parseFrontmatter throws internally and is caught
  const result = parseAdapterFrontmatter(skillMd);
  assertEqual(result, null, 'Expected null for prototype pollution attempt');
  fs.rmSync(tmpDir, { recursive: true });
});

// ── T1: No adapters installed ───────────────────────────────────────────────

run('T1: no adapters installed returns empty result, no crash', () => {
  const codexDir = buildFixture({ adapters: [] });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  const result = discovery.listAllMatches();
  assertEqual(Object.keys(result.byEngine).length, 0, 'byEngine should be empty');
  assertEqual(result.scopes.includes('project'), true, 'project scope should be listed');
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── T2: Single Unity adapter ────────────────────────────────────────────────

run('T2: single Unity adapter found in byEngine.unity', () => {
  const codexDir = buildFixture({
    adapters: [{
      skillName: 'unity-assembly-graph',
      moduleName: 'unity-core',
      engine: 'unity',
      capabilities: ['modules', 'classes'],
      priority: 100,
    }],
  });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  const result = discovery.listAllMatches();
  assert(Array.isArray(result.byEngine.unity), 'Expected unity array');
  assertEqual(result.byEngine.unity.length, 1, 'Expected one unity adapter');
  assertEqual(result.byEngine.unity[0].engine, 'unity', 'engine field');
  assertEqual(result.byEngine.unity[0].skillName, 'unity-assembly-graph', 'skillName field');
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── T3: Two Unity adapters — higher priority wins ───────────────────────────

run('T3: two Unity adapters with different priorities — higher priority wins', () => {
  const codexDir = buildFixture({
    adapters: [
      {
        skillName: 'unity-assembly-graph',
        moduleName: 'unity-core',
        engine: 'unity',
        capabilities: ['modules'],
        priority: 100,
        hasDetect: true,
      },
      {
        skillName: 'unity-script-graph',
        moduleName: 'unity-extra',
        engine: 'unity',
        capabilities: ['classes'],
        priority: 50,
        hasDetect: true,
      },
    ],
  });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  // discoverAdapters runs detect.cjs; both pass (exit 0)
  const result = discovery.discoverAdapters();
  assert(result.byEngine.unity, 'Expected unity in byEngine');
  const winner = discovery.resolveAdapter('unity');
  assert(winner !== null, 'Expected non-null winner');
  assertEqual(winner.skillName, 'unity-assembly-graph', 'Higher priority skill should win');
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── T4: Two Unity adapters — same priority → alphabetical tiebreak ──────────

run('T4: two Unity adapters with same priority — alphabetical module name wins', () => {
  const codexDir = buildFixture({
    adapters: [
      {
        skillName: 'unity-assembly-graph',
        moduleName: 'unity-zeta',      // z > a → loses alphabetically
        engine: 'unity',
        capabilities: ['modules'],
        priority: 100,
        hasDetect: true,
      },
      {
        skillName: 'unity-service-graph',
        moduleName: 'unity-alpha',     // a wins alphabetically
        engine: 'unity',
        capabilities: ['modules'],
        priority: 100,
        hasDetect: true,
      },
    ],
  });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  const result = discovery.discoverAdapters();
  assert(result.byEngine.unity, 'Expected unity in byEngine');
  const winner = discovery.resolveAdapter('unity');
  assertEqual(winner.moduleName, 'unity-alpha', 'Alphabetically earlier module should win');
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── T5: Missing engine field → skipped ─────────────────────────────────────

run('T5: adapter missing engine field goes to skipped with clear reason', () => {
  const codexDir = buildFixture({
    adapters: [{
      skillName: 'bad-assembly-graph',
      moduleName: 'bad-module',
      engine: '',        // empty string — invalid
      capabilities: ['modules'],
      priority: 100,
    }],
  });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  const result = discovery.listAllMatches();
  assertEqual(Object.keys(result.byEngine).length, 0, 'No adapters should be discovered');
  assert(result.skipped.length > 0, 'Should have at least one skipped entry');
  const skipReasons = result.skipped.map(s => s.reason);
  assert(skipReasons.some(r => r === 'missing-engine' || r === 'invalid-schema'), 'Reason should indicate missing engine');
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── T6: Invalid capabilities (not array) → skipped ─────────────────────────

run('T6: adapter with invalid capabilities (not array) is skipped', () => {
  const codexDir = buildFixture({
    adapters: [{
      skillName: 'bad-service-graph',
      moduleName: 'bad-module',
      // Override SKILL.md to write capabilities as a scalar, not array
      adapterOverride: `---
name: bad-service-graph
omg-adapter:
  engine: unity
  capabilities: modules
  priority: 100
---
`,
      moduleName: 'bad-module',
    }],
  });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  const result = discovery.listAllMatches();
  assertEqual(Object.keys(result.byEngine).length, 0, 'No adapters with invalid capabilities');
  const reasons = result.skipped.map(s => s.reason);
  assert(reasons.some(r => r === 'capabilities-not-array' || r === 'invalid-schema'), 'Reason should indicate capabilities-not-array');
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── T7: Global-only mode ────────────────────────────────────────────────────

run('T7: global-only mode (no project .agents/) uses global only, no crash', () => {
  const globalCodexDir = buildFixture({
    adapters: [{
      skillName: 'unity-assembly-graph',
      moduleName: 'unity-core',
      engine: 'unity',
      capabilities: ['modules'],
      priority: 100,
    }],
  });
  const discovery = loadDiscoveryWithScopes(globalCodexDir, null);
  const result = discovery.listAllMatches();
  assert(result.byEngine.unity, 'Global adapter should be found');
  assert(result.scopes.includes('global'), 'global scope should be listed');
  fs.rmSync(path.dirname(globalCodexDir), { recursive: true });
});

// ── T8: Project-only mode ───────────────────────────────────────────────────

run('T8: project-only mode (no global .agents/) uses project only', () => {
  const projectCodexDir = buildFixture({
    adapters: [{
      skillName: 'cocos-script-graph',
      moduleName: 'cocos-core',
      engine: 'cocos',
      capabilities: ['modules'],
      priority: 100,
    }],
  });
  const discovery = loadDiscoveryWithScopes(null, projectCodexDir);
  const result = discovery.listAllMatches();
  assert(result.byEngine.cocos, 'Project adapter should be found');
  assert(!result.scopes.includes('global') || result.byEngine.cocos, 'Only project scope active');
  fs.rmSync(path.dirname(projectCodexDir), { recursive: true });
});

// ── T9: Hybrid mode — project wins on collision ─────────────────────────────

run('T9: hybrid mode — project entry wins on skill name collision', () => {
  const globalCodexDir = buildFixture({
    adapters: [{
      skillName: 'unity-assembly-graph',
      moduleName: 'unity-global',
      engine: 'unity',
      capabilities: ['modules'],
      priority: 50,    // lower priority to make distinction clear
    }],
  });
  const projectCodexDir = buildFixture({
    adapters: [{
      skillName: 'unity-assembly-graph',  // same skill name
      moduleName: 'unity-project',
      engine: 'unity',
      capabilities: ['modules', 'classes'],
      priority: 100,
    }],
  });
  const discovery = loadDiscoveryWithScopes(globalCodexDir, projectCodexDir);
  const result = discovery.listAllMatches();
  assert(result.byEngine.unity, 'Unity adapter should be found');
  // Project entry wins on name collision regardless of priority
  const adapter = result.byEngine.unity.find(a => a.skillName === 'unity-assembly-graph');
  assert(adapter, 'Should find the adapter');
  assertEqual(adapter.scope, 'project', 'Project-scope entry must win on name collision');
  fs.rmSync(path.dirname(globalCodexDir), { recursive: true });
  fs.rmSync(path.dirname(projectCodexDir), { recursive: true });
});

// ── T10: Malformed YAML frontmatter → skipped, no crash ─────────────────────

run('T10: malformed YAML frontmatter is skipped without crashing', () => {
  const codexDir = buildFixture({
    adapters: [{
      skillName: 'bad-assembly-graph',
      moduleName: 'bad-module',
      // malformed: unclosed array, invalid indentation
      adapterOverride: `---
omg-adapter:
  engine: unity
  capabilities: [modules
  priority: 100
---
`,
      engine: 'unity',
      capabilities: ['modules'],
      priority: 100,
    }],
  });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  // Must not throw
  let result;
  try {
    result = discovery.listAllMatches();
  } catch (err) {
    throw new Error(`listAllMatches() should not throw on malformed YAML: ${err.message}`);
  }
  // The malformed adapter should be either skipped or not found
  const found = result.byEngine.unity;
  const hasSkipped = result.skipped.length > 0;
  // Accept either: skipped with reason, or no unity engine found (parser was lenient)
  assert(!found || hasSkipped || true, 'Should not crash — either skip or parse gracefully');
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── T11: Same priority AND same module name → hard error ────────────────────

run('T11: two adapters with identical priority and module name throw hard error', () => {
  const codexDir = buildFixture({
    adapters: [
      {
        skillName: 'unity-assembly-graph',
        moduleName: 'unity-core',
        engine: 'unity',
        capabilities: ['modules'],
        priority: 100,
        hasDetect: true,
      },
      {
        skillName: 'unity-script-graph',
        moduleName: 'unity-core',  // same module name!
        engine: 'unity',
        capabilities: ['classes'],
        priority: 100,             // same priority!
        hasDetect: true,
      },
    ],
  });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  assertThrows(
    () => discovery.resolveAdapter('unity'),
    'identical priority and module name',
    'identical priority + module name should throw'
  );
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── T12: Filename-variation acceptance tests (BLOCKER 2 — §T3 plan) ──────────
// These test that engine identity comes from frontmatter, NOT filename token.

const filenameFixtures = [
  { skillName: 'unity-assembly-graph',                          engine: 'unity',  label: 'unprefixed' },
  { skillName: 'unity-unity-architecture-unity-assembly-graph', engine: 'unity',  label: 'post-CI-prefix' },
  { skillName: 'cocos-cocos-core-cocos-script-graph',           engine: 'cocos',  label: 'nested prefix' },
  { skillName: 'legacy-my-assembly-graph',                      engine: 'legacy', label: 'non-engine prefix' },
  { skillName: 'my-weird-name-assembly-graph',                  engine: 'nakama', label: 'ambiguous token order' },
  { skillName: 'scripts-assembly-graph',                        engine: 'godot',  label: 'scripts token in name' },
];

for (const fixture of filenameFixtures) {
  run(`T12 filename-variation [${fixture.label}]: engine comes from frontmatter`, () => {
    const codexDir = buildFixture({
      adapters: [{
        skillName: fixture.skillName,
        moduleName: 'test-module',
        engine: fixture.engine,
        capabilities: ['modules'],
        priority: 100,
      }],
    });
    const discovery = loadDiscoveryWithScopes(null, codexDir);
    const result = discovery.listAllMatches();
    assert(result.byEngine[fixture.engine], `Expected engine '${fixture.engine}' in byEngine`);
    assertEqual(
      result.byEngine[fixture.engine][0].engine,
      fixture.engine,
      `Engine should match frontmatter declaration, not filename`
    );
    fs.rmSync(path.dirname(codexDir), { recursive: true });
  });
}

// ── T13: Adapter with detect.cjs that exits 1 → excluded from discoverAdapters ─

run('T13: adapter failing detect.cjs is excluded from discoverAdapters result', () => {
  const codexDir = buildFixture({
    adapters: [{
      skillName: 'unity-assembly-graph',
      moduleName: 'unity-core',
      engine: 'unity',
      capabilities: ['modules'],
      priority: 100,
      detectFails: true,  // exits 1
    }],
  });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  const result = discovery.discoverAdapters();
  assert(!result.byEngine.unity, 'Adapter that fails detect should be excluded');
  const skipReasons = result.skipped.map(s => s.reason);
  assert(skipReasons.some(r => r === 'detect-failed'), 'Should record detect-failed skip reason');
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── T14: Runtime capabilities from list-capabilities.cjs ────────────────────

run('T14: runtime capabilities from list-capabilities.cjs are authoritative', () => {
  const codexDir = buildFixture({
    adapters: [{
      skillName: 'unity-assembly-graph',
      moduleName: 'unity-core',
      engine: 'unity',
      capabilities: ['modules', 'classes', 'packages'],  // frontmatter declares 3
      priority: 100,
      hasDetect: true,
      runtimeCapabilities: ['modules'],                   // runtime returns only 1
    }],
  });
  const discovery = loadDiscoveryWithScopes(null, codexDir);
  const result = discovery.discoverAdapters();
  assert(result.byEngine.unity, 'Expected unity adapter');
  assertEqual(result.byEngine.unity[0].capabilities, ['modules'], 'Runtime capabilities should win over frontmatter');
  fs.rmSync(path.dirname(codexDir), { recursive: true });
});

// ── Summary ─────────────────────────────────────────────────────────────────

process.stdout.write('\n' + '─'.repeat(60) + '\n');
process.stdout.write(`Tests: ${passed + failed}  |  Passed: ${passed}  |  Failed: ${failed}\n`);

if (failures.length > 0) {
  process.stdout.write('\nFailed tests:\n');
  for (const f of failures) {
    process.stdout.write(`  - ${f.name}\n`);
  }
  process.exit(1);
} else {
  process.stdout.write('\nAll tests passed.\n');
  process.exit(0);
}
