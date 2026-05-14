// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-extended | protected=true
'use strict';
/**
 * Smoke fixture generate.cjs — Nakama adapter.
 * Writes a deterministic Mermaid file and prints the expected JSON result.
 *
 * Usage: node generate.cjs --type <type> --out-dir <dir>
 */
const fs = require('fs');
const path = require('path');

const MERMAID_CONTENT = '<!-- omg smoke fixture -->\ngraph LR\n  main --> rpc\n  rpc --> storage\n';

const args = process.argv.slice(2);
let type = 'modules';
let outDir = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--type' && args[i + 1]) type = args[++i];
  else if (args[i] === '--out-dir' && args[i + 1]) outDir = args[++i];
}

if (!outDir) {
  process.stderr.write('generate.cjs: --out-dir required\n');
  process.exit(1);
}

const fileName = `${type}.md`;
const filePath = path.join(outDir, fileName);

try {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(filePath, MERMAID_CONTENT, 'utf8');
} catch (err) {
  process.stderr.write(`generate.cjs: failed to write ${filePath}: ${err.message}\n`);
  process.exit(1);
}

process.stdout.write(JSON.stringify({
  file: fileName,
  warnings: [],
  capabilities_skipped: [],
}) + '\n');
