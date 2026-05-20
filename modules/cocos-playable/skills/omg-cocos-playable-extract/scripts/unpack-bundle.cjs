#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=playable | protected=false
'use strict';

// unpack-bundle.cjs <rawDir>
//
// Reads <rawDir>/index.html, extracts inline <script> blocks, decodes inline
// base64 data-URIs, and beautifies all JS files in <rawDir>/scripts/.
// Writes:
//   <rawDir>/scripts/inline-N.js          (each inline <script> tag)
//   <rawDir>/scripts/inline-N.beautified.js
//   <rawDir>/scripts/<external>.beautified.js (for every external .js)
//   <rawDir>/assets/img|audio|...        (decoded data: URIs)
//   updates <rawDir>/manifest.json with `unpack` block

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const cheerio = require('cheerio');
const beautify = require('js-beautify').js;

const BEAUTIFY_OPTS = {
  indent_size: 2,
  preserve_newlines: true,
  max_preserve_newlines: 2,
  end_with_newline: true,
  wrap_line_length: 120,
  brace_style: 'collapse,preserve-inline'
};

const MAX_INLINE_BEAUTIFY_BYTES = 5 * 1024 * 1024;

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function decodeDataUri(dataUri) {
  const m = /^data:([^;,]+)?(?:;([^,]+))?,(.*)$/s.exec(dataUri);
  if (!m) return null;
  const mime = m[1] || 'application/octet-stream';
  const encoding = (m[2] || '').toLowerCase();
  const payload = m[3];
  let buf;
  if (encoding.includes('base64')) {
    try {
      buf = Buffer.from(payload, 'base64');
    } catch {
      return null;
    }
  } else {
    try {
      buf = Buffer.from(decodeURIComponent(payload), 'utf8');
    } catch {
      buf = Buffer.from(payload, 'utf8');
    }
  }
  return { mime, buf };
}

function extOfMime(mime) {
  const map = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'application/javascript': 'js',
    'application/json': 'json',
    'text/css': 'css',
    'text/plain': 'txt',
    'application/octet-stream': 'bin'
  };
  return map[mime] || 'bin';
}

function categoryOfMime(mime) {
  if (!mime) return 'assets/bin';
  if (mime.startsWith('image/')) return 'assets/img';
  if (mime.startsWith('audio/')) return 'assets/audio';
  if (mime === 'application/javascript') return 'scripts';
  if (mime === 'application/json') return 'assets/json';
  if (mime === 'text/css') return 'assets/css';
  return 'assets/bin';
}

function safeBeautify(text) {
  if (text.length > MAX_INLINE_BEAUTIFY_BYTES) {
    return { beautified: text, skipped: true, reason: 'too-large' };
  }
  try {
    return { beautified: beautify(text, BEAUTIFY_OPTS), skipped: false };
  } catch (err) {
    return { beautified: text, skipped: true, reason: `beautify-error:${err && err.message || 'unknown'}` };
  }
}

function listFiles(dir, results = []) {
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) listFiles(full, results);
    else results.push(full);
  }
  return results;
}

function main(rawDir) {
  if (!rawDir || !fs.existsSync(rawDir)) {
    console.error(JSON.stringify({ ok: false, error: 'missing-rawDir', rawDir }));
    process.exit(2);
  }
  const indexPath = path.join(rawDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error(JSON.stringify({ ok: false, error: 'no-index-html', rawDir }));
    process.exit(3);
  }
  const html = fs.readFileSync(indexPath, 'utf8');
  const $ = cheerio.load(html);

  const inlineScripts = [];
  const dataUriAssets = [];

  $('script').each((idx, el) => {
    const $el = $(el);
    const src = $el.attr('src');
    if (src) return;
    const body = $el.html() || '';
    if (body.trim().length === 0) return;
    const name = `inline-${idx}.js`;
    const scriptsDir = path.join(rawDir, 'scripts');
    ensureDir(scriptsDir);
    fs.writeFileSync(path.join(scriptsDir, name), body, 'utf8');
    const { beautified, skipped, reason } = safeBeautify(body);
    fs.writeFileSync(path.join(scriptsDir, name.replace(/\.js$/, '.beautified.js')), beautified, 'utf8');
    inlineScripts.push({
      path: `scripts/${name}`,
      beautifiedPath: `scripts/${name.replace(/\.js$/, '.beautified.js')}`,
      size: Buffer.byteLength(body, 'utf8'),
      sha256: sha256Hex(Buffer.from(body, 'utf8')),
      beautifySkipped: !!skipped,
      beautifySkipReason: reason || null
    });
  });

  const decodeAttrUri = (el, attr) => {
    const v = $(el).attr(attr);
    if (!v || !v.startsWith('data:')) return;
    const decoded = decodeDataUri(v);
    if (!decoded) return;
    const ext = extOfMime(decoded.mime);
    const cat = categoryOfMime(decoded.mime);
    const sha = sha256Hex(decoded.buf);
    const fname = `inline-${sha.slice(0, 12)}.${ext}`;
    const dir = path.join(rawDir, cat);
    ensureDir(dir);
    const rel = path.posix.join(cat, fname);
    if (!fs.existsSync(path.join(rawDir, rel))) {
      fs.writeFileSync(path.join(rawDir, rel), decoded.buf);
    }
    dataUriAssets.push({ path: rel, mime: decoded.mime, size: decoded.buf.length, sha256: sha, attr });
  };

  $('img[src]').each((_, el) => decodeAttrUri(el, 'src'));
  $('audio[src]').each((_, el) => decodeAttrUri(el, 'src'));
  $('source[src]').each((_, el) => decodeAttrUri(el, 'src'));
  $('link[href]').each((_, el) => decodeAttrUri(el, 'href'));

  const scriptsDir = path.join(rawDir, 'scripts');
  const beautifiedExternal = [];
  if (fs.existsSync(scriptsDir)) {
    for (const full of listFiles(scriptsDir)) {
      if (!full.endsWith('.js') || full.endsWith('.beautified.js')) continue;
      if (path.basename(full).startsWith('inline-')) continue;
      const text = fs.readFileSync(full, 'utf8');
      const { beautified, skipped, reason } = safeBeautify(text);
      const outFile = full.replace(/\.js$/, '.beautified.js');
      fs.writeFileSync(outFile, beautified, 'utf8');
      beautifiedExternal.push({
        path: path.relative(rawDir, full).split(path.sep).join('/'),
        beautifiedPath: path.relative(rawDir, outFile).split(path.sep).join('/'),
        size: Buffer.byteLength(text, 'utf8'),
        beautifySkipped: !!skipped,
        beautifySkipReason: reason || null
      });
    }
  }

  const manifestPath = path.join(rawDir, 'manifest.json');
  let manifest = {};
  if (fs.existsSync(manifestPath)) {
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { manifest = {}; }
  }
  manifest.unpack = {
    unpackedAt: new Date().toISOString(),
    inlineScripts,
    dataUriAssets,
    beautifiedExternal,
    counts: {
      inlineScripts: inlineScripts.length,
      dataUriAssets: dataUriAssets.length,
      beautifiedExternal: beautifiedExternal.length
    }
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  process.stdout.write(JSON.stringify({
    ok: true,
    inlineScripts: inlineScripts.length,
    dataUriAssets: dataUriAssets.length,
    beautifiedExternal: beautifiedExternal.length
  }) + '\n');
}

if (require.main === module) {
  const [, , rawDir] = process.argv;
  try {
    main(rawDir);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err && err.message || String(err) }));
    process.exit(1);
  }
}
