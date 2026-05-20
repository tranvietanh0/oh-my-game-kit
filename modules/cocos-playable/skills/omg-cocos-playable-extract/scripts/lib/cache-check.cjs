#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=playable | protected=false
'use strict';

// Slug derivation + idempotency check for omg-cocos-playable-extract.
// Slug rule: sha256(url).slice(0, 8) + '-' + guessGameName(url)

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const STOPWORD_TOKENS = new Set([
  'html', 'creative', 'ad', 'ads', 'preview', 'mraid', 'index',
  'cdn', 'mintegral', 'ironsource', 'applovin', 'unity', 'vungle',
  'global', 'asia', 'us', 'eu', 'umcdn', 'static'
]);

function urlHash(url) {
  return crypto.createHash('sha256').update(String(url)).digest('hex').slice(0, 8);
}

function guessGameName(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return 'unknown';
  }
  const pathname = parsed.pathname.replace(/^\/+|\/+$/g, '');
  const segments = pathname.split('/').filter(Boolean);
  const tokens = [];
  for (const seg of segments) {
    const base = seg.replace(/\.[a-z0-9]+$/i, '');
    if (/^[a-f0-9]{16,}$/i.test(base)) continue;
    const parts = base.split(/[-_]+/).filter(Boolean);
    for (const p of parts) {
      const lower = p.toLowerCase();
      if (lower.length < 3) continue;
      if (STOPWORD_TOKENS.has(lower)) continue;
      if (/^\d+$/.test(lower)) continue;
      tokens.push(lower);
    }
  }
  if (tokens.length === 0) {
    const hostFirst = parsed.hostname.split('.').shift() || 'unknown';
    return hostFirst.toLowerCase().replace(/[^a-z0-9]/g, '') || 'unknown';
  }
  return tokens.slice(0, 3).join('-');
}

function buildSlug(url) {
  return `${urlHash(url)}-${guessGameName(url)}`;
}

function resolveOutDir(kitRoot, slug) {
  return path.join(kitRoot, 'plans', 'research', `playable-${slug}`);
}

function readManifest(outDir) {
  const manifestPath = path.join(outDir, 'raw', 'manifest.json');
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch {
    return null;
  }
}

function isCacheValid(outDir, url) {
  const manifest = readManifest(outDir);
  if (!manifest) return { valid: false, reason: 'no-manifest' };
  if (!manifest.sourceUrlHash || manifest.sourceUrlHash !== urlHash(url)) {
    return { valid: false, reason: 'url-hash-mismatch' };
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    return { valid: false, reason: 'empty-file-list' };
  }
  for (const f of manifest.files) {
    if (!f || typeof f.path !== 'string') continue;
    const full = path.join(outDir, 'raw', f.path);
    if (!fs.existsSync(full)) {
      return { valid: false, reason: `missing-file:${f.path}` };
    }
  }
  return { valid: true, manifest };
}

module.exports = {
  urlHash,
  guessGameName,
  buildSlug,
  resolveOutDir,
  readManifest,
  isCacheValid
};

if (require.main === module) {
  const url = process.argv[2];
  const kitRoot = process.argv[3] || process.cwd();
  if (!url) {
    console.error('usage: cache-check.cjs <url> [kit-root]');
    process.exit(1);
  }
  const slug = buildSlug(url);
  const outDir = resolveOutDir(kitRoot, slug);
  const cache = isCacheValid(outDir, url);
  process.stdout.write(JSON.stringify({
    slug,
    outDir,
    urlHash: urlHash(url),
    guessedName: guessGameName(url),
    cache
  }, null, 2) + '\n');
}
