#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=playable | protected=false
/**
 * Project Config Scanner — Cocos Playable Ads
 *
 * Deterministically enumerates project-specific config files and extracts
 * hardcoded data candidates that should be surfaced as dashboard parameters.
 *
 * Per AGENTS.md principle #8: CLI emits facts (JSON); AI reasons over them.
 *
 * Scans under assets/scripts/ (skips submodules: PLAGameFoundation/, PlayableParamterTool/):
 *   - **\/constant*.ts
 *   - **\/*Config*.ts       (excluding PlayableConfig.ts — that's the SSOT, not a candidate source)
 *   - **\/GameConfig*.ts
 *
 * For each file, extracts:
 *   - exported const / static class members with primitive values
 *     (number, boolean, string, color-hex string)
 *   - JSDoc comment immediately preceding the export, if any
 *
 * Filters out:
 *   - STORE_LINK keys (SDK-managed)
 *   - AUDIO_NAME / EFFECT_NAME maps (asset registries, not tunable)
 *   - Anything already present in PlayableConfig.ts
 *   - Private fields (starting with `_`)
 *
 * Usage:
 *   node scan-project-configs.cjs <project-root> [--json] [--include-covered]
 *
 * Exit codes:
 *   0 = scan succeeded (candidates may be empty)
 *   1 = invalid input (project root missing or assets/scripts/ not found)
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const projectRoot = args.find(a => !a.startsWith('--'));
const asJson = args.includes('--json');
const includeCovered = args.includes('--include-covered');

if (!projectRoot) {
    console.error('Usage: node scan-project-configs.cjs <project-root> [--json] [--include-covered]');
    process.exit(1);
}

const scriptsDir = path.resolve(projectRoot, 'assets/scripts');
if (!fs.existsSync(scriptsDir)) {
    console.error(`[scan-project-configs] assets/scripts not found under: ${projectRoot}`);
    process.exit(1);
}

// ---------- File discovery ----------

const SUBMODULE_DIRS = new Set(['PLAGameFoundation', 'PlayableParamterTool', 'node_modules']);

function walk(dir, results = []) {
    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (e) {
        return results;
    }
    for (const ent of entries) {
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) {
            if (SUBMODULE_DIRS.has(ent.name)) continue;
            walk(full, results);
        } else if (ent.isFile() && ent.name.endsWith('.ts')) {
            results.push(full);
        }
    }
    return results;
}

function isConfigFile(filePath) {
    const base = path.basename(filePath);
    // Skip PlayableConfig.ts (it IS the SSOT we are populating)
    if (/^PlayableConfig\.ts$/i.test(base)) return false;
    // Skip CustomParameter / ParameterConfig (composite definitions, not data sources)
    if (/^(CustomParameter|ParameterConfig|ParameterController|ParameterUtils|ParameterManager|ParameterRegister)\.ts$/i.test(base)) return false;
    // Match: constant*.ts, *Config*.ts, GameConfig*.ts
    return (
        /^constant.*\.ts$/i.test(base) ||
        /Config.*\.ts$/i.test(base) ||
        /^GameConfig.*\.ts$/i.test(base)
    );
}

// ---------- Value extraction ----------

const SKIP_KEY_PATTERNS = [
    /^STORE_LINK$/i,
    /^AUDIO_NAME$/i,    // asset registry, not tunable
    /^EFFECT_NAME$/i,   // asset registry, not tunable
    /_LINK$/i,
    /^PIVOT_NODE_NAME$/i, // internal node name, not user-facing
];

function shouldSkipKey(key) {
    if (key.startsWith('_')) return true;
    return SKIP_KEY_PATTERNS.some(re => re.test(key));
}

function classifyValue(raw) {
    const trimmed = raw.trim();
    if (/^(true|false)$/.test(trimmed)) {
        return { type: 'boolean', value: trimmed === 'true', paramType: 'BooleanParameter' };
    }
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
        const n = parseFloat(trimmed);
        const bounded = n >= 0 && n <= 10;
        return {
            type: 'number',
            value: n,
            paramType: bounded ? 'RangeParameter' : 'NumberParameter',
        };
    }
    // Hex color: "#RRGGBB", "#RRGGBBAA", "#RGB" (with or without quotes)
    const hexMatch = trimmed.match(/^['"](#[0-9a-fA-F]{3,8})['"]$/);
    if (hexMatch) {
        return { type: 'color', value: hexMatch[1], paramType: 'ColorParameter' };
    }
    // String literal
    const strMatch = trimmed.match(/^['"`](.*)['"`]$/);
    if (strMatch) {
        return { type: 'string', value: strMatch[1], paramType: 'TextParameter' };
    }
    return null; // not a primitive — skip
}

/**
 * Extract `export const KEY = value` and `static KEY = value` declarations.
 * Captures preceding JSDoc as description hint.
 */
function extractDeclarations(content) {
    const decls = [];
    const lines = content.split(/\r?\n/);

    let pendingDoc = null;
    let inBlockComment = false;
    let blockBuffer = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track block comments for JSDoc capture
        if (inBlockComment) {
            blockBuffer.push(line);
            if (/\*\//.test(line)) {
                inBlockComment = false;
                pendingDoc = blockBuffer.join(' ').replace(/\/\*+|\*+\/|^\s*\*\s?/gm, ' ').replace(/\s+/g, ' ').trim();
                blockBuffer = [];
            }
            continue;
        }
        if (/\/\*\*/.test(line) && !/\*\//.test(line)) {
            inBlockComment = true;
            blockBuffer = [line];
            continue;
        }

        // Inline single-line declaration patterns
        // export const NAME = value;
        // export const NAME: Type = value;
        // public static NAME = value;
        // static NAME = value;
        const reExportConst = /^\s*export\s+const\s+([A-Z][A-Z0-9_]*)\s*(?::\s*[^=]+)?\s*=\s*(.+?);?\s*$/;
        const reStaticField = /^\s*(?:public\s+|private\s+|protected\s+)?static\s+([A-Z][A-Z0-9_]*)\s*(?::\s*[^=]+)?\s*=\s*(.+?);?\s*$/;

        let m = line.match(reExportConst) || line.match(reStaticField);
        if (m) {
            const [, key, valueRaw] = m;
            if (!shouldSkipKey(key)) {
                const classified = classifyValue(valueRaw);
                if (classified) {
                    decls.push({
                        key,
                        line: i + 1,
                        raw: valueRaw,
                        ...classified,
                        doc: pendingDoc || null,
                    });
                }
            }
            pendingDoc = null;
            continue;
        }

        // Blank / non-declaration lines — keep pendingDoc through blank lines only
        if (line.trim() === '' || line.trim().startsWith('//')) continue;
        pendingDoc = null;
    }

    return decls;
}

// ---------- PlayableConfig coverage check ----------

function loadPlayableConfigKeys(projectRoot) {
    const candidatePaths = [
        path.join(projectRoot, 'assets/scripts/parameter/config/PlayableConfig.ts'),
        path.join(projectRoot, 'assets/scripts/PlayableConfig.ts'),
    ];
    for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
            const content = fs.readFileSync(p, 'utf8');
            const keys = new Set();
            // Match identifier-like config keys in `export const PlayableConfig = { Key: ..., }`
            const re = /^\s*([A-Z][A-Za-z0-9_]*)\s*:\s*new\s+/gm;
            let m;
            while ((m = re.exec(content)) !== null) keys.add(m[1]);
            return { path: p, keys };
        }
    }
    return { path: null, keys: new Set() };
}

function looksCovered(key, playableKeys) {
    // Heuristic: a config constant ANDROID_LINK matches PlayableConfig.AndroidLink? Unlikely with snake/screaming case.
    // Best-effort: lowercase compare with non-alphanumeric stripped.
    const norm = key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    for (const k of playableKeys) {
        if (k.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === norm) return true;
    }
    return false;
}

// ---------- Main ----------

const allTsFiles = walk(scriptsDir);
const configFiles = allTsFiles.filter(isConfigFile);
const playableConfig = loadPlayableConfigKeys(projectRoot);

const result = {
    projectRoot: path.resolve(projectRoot),
    scriptsDir,
    playableConfigPath: playableConfig.path,
    playableConfigKnownKeys: playableConfig.keys.size,
    configFiles: [],
    summary: {
        filesScanned: configFiles.length,
        totalCandidates: 0,
        newCandidates: 0,
        coveredCandidates: 0,
    },
};

for (const file of configFiles) {
    const rel = path.relative(projectRoot, file).replace(/\\/g, '/');
    const content = fs.readFileSync(file, 'utf8');
    const decls = extractDeclarations(content);

    const entries = [];
    for (const d of decls) {
        const covered = looksCovered(d.key, playableConfig.keys);
        if (covered && !includeCovered) {
            result.summary.coveredCandidates++;
            continue;
        }
        entries.push({
            key: d.key,
            line: d.line,
            valueType: d.type,
            paramType: d.paramType,
            defaultValue: d.value,
            doc: d.doc,
            covered,
        });
        result.summary.totalCandidates++;
        if (!covered) result.summary.newCandidates++;
    }

    if (entries.length === 0 && !includeCovered) continue;

    result.configFiles.push({
        path: rel,
        candidateCount: entries.length,
        candidates: entries,
    });
}

if (asJson) {
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
} else {
    // Human-readable report
    console.log(`Project config scan: ${result.projectRoot}`);
    console.log(`  Scripts dir: ${result.scriptsDir}`);
    console.log(`  PlayableConfig: ${result.playableConfigPath || 'NOT FOUND'} (${result.playableConfigKnownKeys} keys)`);
    console.log(`  Files scanned: ${result.summary.filesScanned}`);
    console.log(`  Candidates: ${result.summary.newCandidates} NEW, ${result.summary.coveredCandidates} covered (skipped)`);
    console.log('');
    if (result.configFiles.length === 0) {
        console.log('No new data candidates found.');
    } else {
        for (const f of result.configFiles) {
            console.log(`-- ${f.path} (${f.candidateCount} candidate${f.candidateCount === 1 ? '' : 's'})`);
            for (const c of f.candidates) {
                const cov = c.covered ? ' [COVERED]' : '';
                const doc = c.doc ? ` — ${c.doc.slice(0, 80)}${c.doc.length > 80 ? '...' : ''}` : '';
                console.log(`   L${c.line}  ${c.key} = ${JSON.stringify(c.defaultValue)} -> ${c.paramType}${cov}${doc}`);
            }
            console.log('');
        }
    }
}

process.exit(0);
