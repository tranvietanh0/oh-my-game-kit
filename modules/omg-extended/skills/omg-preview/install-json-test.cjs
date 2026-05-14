// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
'use strict';

// install-json-test.cjs — validates install.json catalog integrity.
// Run: node .agents/skillsomg-preview/install-json-test.cjs
// Exit code 0 = all assertions pass. Non-zero = failures printed to stderr.

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const INSTALL_JSON_PATH = path.join(__dirname, 'install.json');

const KNOWN_HANDLERS = new Set([
  'npm-global',
  'npm-project',
  'dotnet-tool',
  'binary-download',
  'jar-download',
  'package-manager',
  'manual-hint',
]);

const REQUIRED_TOOL_FIELDS = ['handler', 'version', 'verify', 'prerequisites'];
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
const PLACEHOLDER = 'RESEARCH_NEEDED';

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

let failures = 0;

function assert(condition, message) {
  if (!condition) {
    process.stderr.write(`FAIL: ${message}\n`);
    failures++;
  }
}

// ---------------------------------------------------------------------------
// Load and parse
// ---------------------------------------------------------------------------

assert(fs.existsSync(INSTALL_JSON_PATH), `install.json exists at ${INSTALL_JSON_PATH}`);

let doc;
try {
  const raw = fs.readFileSync(INSTALL_JSON_PATH, 'utf8');
  doc = JSON.parse(raw);
  process.stdout.write('PASS: install.json is valid JSON\n');
} catch (err) {
  process.stderr.write(`FAIL: install.json failed to parse — ${err.message}\n`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// 1. Top-level shape
// ---------------------------------------------------------------------------

assert(typeof doc.schemaVersion === 'string', 'schemaVersion is a string');
assert(typeof doc.catalog === 'object' && doc.catalog !== null, 'catalog is an object');
assert(typeof doc.presets === 'object' && doc.presets !== null, 'presets is an object');
assert(Array.isArray(doc._todo), '_todo is an array (research backlog present)');

// ---------------------------------------------------------------------------
// 2. Each tool entry: required fields present
// ---------------------------------------------------------------------------

const catalogTools = Object.keys(doc.catalog);
assert(catalogTools.length === 9, `catalog has exactly 9 tools (got ${catalogTools.length})`);

for (const toolName of catalogTools) {
  const tool = doc.catalog[toolName];

  for (const field of REQUIRED_TOOL_FIELDS) {
    assert(
      Object.prototype.hasOwnProperty.call(tool, field),
      `tool '${toolName}' has required field '${field}'`
    );
  }

  // verify sub-fields
  if (tool.verify) {
    assert(
      typeof tool.verify.command === 'string' && tool.verify.command.length > 0,
      `tool '${toolName}' verify.command is a non-empty string`
    );
    assert(
      Array.isArray(tool.verify.args),
      `tool '${toolName}' verify.args is an array`
    );
    assert(
      typeof tool.verify.matches === 'string',
      `tool '${toolName}' verify.matches is a string`
    );
  }

  // prerequisites is an array
  assert(
    Array.isArray(tool.prerequisites),
    `tool '${toolName}' prerequisites is an array`
  );
}

// ---------------------------------------------------------------------------
// 3. version is never empty / 'latest' (BLOCKER 4)
//    Documented exceptions:
//    - graphviz: '*' — system package, no meaningful semver pin at catalog level
//    - Any tool: 'RESEARCH_NEEDED' — flagged in _todo for human resolution
// ---------------------------------------------------------------------------

const GRAPHVIZ_VERSION_EXCEPTION = new Set(['*']);

for (const toolName of catalogTools) {
  const { version } = doc.catalog[toolName];

  // Must not be null/undefined/empty
  assert(
    version !== null && version !== undefined && version !== '',
    `tool '${toolName}' version is not null/undefined/empty`
  );

  // Must not be 'latest' or 'next' — these are the dangerous non-pins
  assert(
    version !== 'latest' && version !== 'next',
    `tool '${toolName}' version must not be 'latest' or 'next'`
  );

  // If not the graphviz exception and not RESEARCH_NEEDED, must look like a version string
  if (!GRAPHVIZ_VERSION_EXCEPTION.has(version) && version !== PLACEHOLDER) {
    assert(
      /^(v?\d)/.test(version),
      `tool '${toolName}' version '${version}' should be a semver pin (starts with digit or 'v')`
    );
  }

  // Every RESEARCH_NEEDED version must have a matching _todo entry
  if (version === PLACEHOLDER) {
    const hasBacklog = doc._todo.some(t => t.tool === toolName && t.field === 'version');
    assert(
      hasBacklog,
      `tool '${toolName}' has RESEARCH_NEEDED version but no matching _todo entry`
    );
  }
}

// ---------------------------------------------------------------------------
// 4. handler names are in the known built-in set
//    Exception: tools with handlerPath may use any handler name (kit-custom)
// ---------------------------------------------------------------------------

for (const toolName of catalogTools) {
  const tool = doc.catalog[toolName];
  const { handler } = tool;

  assert(
    typeof handler === 'string' && handler.length > 0,
    `tool '${toolName}' handler is a non-empty string`
  );

  if (!tool.handlerPath) {
    assert(
      KNOWN_HANDLERS.has(handler),
      `tool '${toolName}' handler '${handler}' is not in known built-in handler set: [${[...KNOWN_HANDLERS].join(', ')}]. Provide handlerPath if this is a custom handler.`
    );
  }
}

// ---------------------------------------------------------------------------
// 5. Each preset references only tools present in the catalog
// ---------------------------------------------------------------------------

for (const presetName of Object.keys(doc.presets)) {
  const preset = doc.presets[presetName];

  assert(
    Array.isArray(preset.tools),
    `preset '${presetName}' has a 'tools' array`
  );
  assert(
    typeof preset.description === 'string' && preset.description.length > 0,
    `preset '${presetName}' has a non-empty description`
  );

  for (const toolRef of preset.tools) {
    assert(
      Object.prototype.hasOwnProperty.call(doc.catalog, toolRef),
      `preset '${presetName}' references tool '${toolRef}' which is not in catalog`
    );
  }
}

// ---------------------------------------------------------------------------
// 6. sha256 hashes (when present) are valid 64-char hex strings
//    Exception: RESEARCH_NEEDED placeholder is allowed, but must have _todo entry
// ---------------------------------------------------------------------------

for (const toolName of catalogTools) {
  const tool = doc.catalog[toolName];

  // Flat sha256 string field
  if (
    Object.prototype.hasOwnProperty.call(tool, 'sha256') &&
    typeof tool.sha256 === 'string'
  ) {
    if (tool.sha256 !== PLACEHOLDER) {
      assert(
        SHA256_PATTERN.test(tool.sha256),
        `tool '${toolName}' sha256 must be a 64-char hex string (got '${tool.sha256}')`
      );
    } else {
      const hasBacklog = doc._todo.some(t => t.tool === toolName && t.field === 'sha256');
      assert(
        hasBacklog,
        `tool '${toolName}' sha256 is RESEARCH_NEEDED but has no matching _todo entry`
      );
    }
  }

  // sha256 map (per-platform, used by binary-download tools like d2)
  if (
    Object.prototype.hasOwnProperty.call(tool, 'sha256') &&
    typeof tool.sha256 === 'object' &&
    tool.sha256 !== null
  ) {
    for (const [platform, hash] of Object.entries(tool.sha256)) {
      if (hash !== PLACEHOLDER) {
        assert(
          SHA256_PATTERN.test(hash),
          `tool '${toolName}' sha256['${platform}'] must be a 64-char hex string (got '${hash}')`
        );
      } else {
        const hasBacklog = doc._todo.some(t => t.tool === toolName && t.field === 'sha256');
        assert(
          hasBacklog,
          `tool '${toolName}' sha256['${platform}'] is RESEARCH_NEEDED but has no _todo entry`
        );
      }
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Preset 'minimal' contains 'mermaid-cli'
// ---------------------------------------------------------------------------

assert(
  doc.presets.minimal && doc.presets.minimal.tools.includes('mermaid-cli'),
  "preset 'minimal' includes 'mermaid-cli'"
);

// ---------------------------------------------------------------------------
// 8. Preset 'full' contains all 9 catalog tools
// ---------------------------------------------------------------------------

const fullTools = new Set(doc.presets.full ? doc.presets.full.tools : []);
for (const toolName of catalogTools) {
  assert(
    fullTools.has(toolName),
    `preset 'full' includes tool '${toolName}'`
  );
}

// ---------------------------------------------------------------------------
// 9. _origin block present and correct shape
// ---------------------------------------------------------------------------

assert(
  typeof doc._origin === 'object' && doc._origin !== null,
  '_origin block present'
);
assert(typeof doc._origin.kit === 'string', '_origin.kit is a string');
assert(typeof doc._origin.repository === 'string', '_origin.repository is a string');
assert(typeof doc._origin.module === 'string', '_origin.module is a string');

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

const presetCount = Object.keys(doc.presets).length;

if (failures === 0) {
  process.stdout.write(
    `\nAll assertions passed. Catalog: ${catalogTools.length} tools, ${presetCount} presets.\n`
  );

  if (doc._todo.length > 0) {
    process.stdout.write(
      `\nRESEARCH_NEEDED items (${doc._todo.length}) — resolve before Phase 1 release:\n`
    );
    for (const item of doc._todo) {
      process.stdout.write(`  - ${item.tool}.${item.field}: ${item.note.slice(0, 100)}\n`);
    }
    process.stdout.write('\n');
  }

  process.exit(0);
} else {
  process.stderr.write(`\n${failures} assertion(s) failed.\n`);
  process.exit(1);
}
