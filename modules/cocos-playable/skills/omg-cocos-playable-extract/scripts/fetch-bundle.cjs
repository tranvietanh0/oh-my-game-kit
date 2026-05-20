#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=playable | protected=false
'use strict';

// fetch-bundle.cjs <url> <outDir>
//
// Fetches a playable-ad HTML bundle and crawls same-origin referenced assets.
// Writes files to <outDir>/ and emits <outDir>/manifest.json with:
//   { sourceUrl, sourceUrlHash, fetchedAt, totalBytes, files: [{ url, path, sha256, size, mime, status }], gaps: [...] }
//
// Hard cap: TOTAL_CAP_BYTES (10 MB). Exits non-zero if exceeded (R-A2 / Q3=A).
// Same-origin only — never cross host without explicit allow.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dns = require('dns').promises;
const net = require('net');

const cheerio = require('cheerio');
const { sanitizeUrl } = require('./lib/sanitize.cjs');
const { urlHash } = require('./lib/cache-check.cjs');

const TOTAL_CAP_BYTES = 10 * 1024 * 1024;
const PER_FILE_TIMEOUT_MS = 30_000;
const MAX_REDIRECTS = 5;
const USER_AGENT = 'omg-cocos-playable-extract/0.1';

// SSRF guard: reject hosts that resolve to loopback / private / link-local IPs.
// Applied to root URL and to every redirect hop.
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true;
    if (/^fe[89ab][0-9a-f]:/.test(lower)) return true; // link-local fe80::/10
    if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // ULA fc00::/7
    if (lower.startsWith('::ffff:')) {
      const mapped = lower.slice(7);
      if (net.isIPv4(mapped)) return isPrivateIp(mapped);
    }
    return false;
  }
  return true; // unparseable → reject
}

async function assertAllowedTarget(urlString) {
  let urlObj;
  try { urlObj = new URL(urlString); } catch { throw new Error('invalid-url'); }
  if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
    throw new Error('disallowed-scheme');
  }
  const host = urlObj.hostname;
  if (net.isIP(host)) {
    if (isPrivateIp(host)) throw new Error('ssrf-blocked');
    return;
  }
  const records = await dns.lookup(host, { all: true });
  for (const r of records) {
    if (isPrivateIp(r.address)) throw new Error('ssrf-blocked');
  }
}

function inferMime(url, contentType) {
  if (contentType) return contentType.split(';')[0].trim().toLowerCase();
  const ext = path.extname(new URL(url).pathname).toLowerCase().replace('.', '');
  const map = {
    html: 'text/html',
    htm: 'text/html',
    js: 'application/javascript',
    mjs: 'application/javascript',
    json: 'application/json',
    css: 'text/css',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',
    bin: 'application/octet-stream',
    txt: 'text/plain'
  };
  return map[ext] || 'application/octet-stream';
}

function categoryOf(mime) {
  if (!mime) return 'misc';
  if (mime === 'text/html') return '.';
  if (mime.startsWith('image/')) return 'assets/img';
  if (mime.startsWith('audio/')) return 'assets/audio';
  if (mime === 'application/javascript') return 'scripts';
  if (mime === 'application/json') return 'assets/json';
  if (mime === 'text/css') return 'assets/css';
  return 'assets/bin';
}

function safeBasename(urlObj) {
  let base = path.posix.basename(urlObj.pathname) || 'index';
  base = base.replace(/[^A-Za-z0-9._\-]/g, '_');
  if (!path.extname(base)) base += '.bin';
  return base;
}

// Manual redirect handling: each hop re-validated against SSRF + (optional) same-origin guard.
// Streaming body with running byte counter so we never load >capRemaining into memory.
async function fetchOne(urlString, { timeoutMs, capRemaining, originGuard }) {
  let current = urlString;
  for (let hops = 0; hops <= MAX_REDIRECTS; hops++) {
    await assertAllowedTarget(current);
    if (originGuard && !sameOrigin(current, originGuard)) {
      throw new Error('cross-origin-redirect-blocked');
    }

    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    let res;
    try {
      res = await fetch(current, {
        headers: { 'User-Agent': USER_AGENT, Accept: '*/*' },
        signal: controller.signal,
        redirect: 'manual'
      });
    } finally {
      clearTimeout(to);
    }

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      try { await res.body?.cancel(); } catch {}
      if (hops >= MAX_REDIRECTS) throw new Error('too-many-redirects');
      current = new URL(res.headers.get('location'), current).toString();
      continue;
    }

    const declared = Number(res.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > capRemaining) {
      try { await res.body?.cancel(); } catch {}
      throw new Error('CAP_EXCEEDED');
    }

    const chunks = [];
    let received = 0;
    if (res.body) {
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.length;
        if (received > capRemaining) {
          try { await reader.cancel(); } catch {}
          throw new Error('CAP_EXCEEDED');
        }
        chunks.push(Buffer.from(value));
      }
    }
    return {
      status: res.status,
      contentType: res.headers.get('content-type') || '',
      buf: Buffer.concat(chunks)
    };
  }
  throw new Error('too-many-redirects');
}

function sha256Hex(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileSafe(outDir, relPath, buf) {
  const full = path.join(outDir, relPath);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, buf);
  return full;
}

function extractReferencesFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  const refs = new Set();
  const add = (u) => {
    if (!u) return;
    if (u.startsWith('data:')) return;
    if (u.startsWith('javascript:')) return;
    if (u.startsWith('#')) return;
    try {
      const abs = new URL(u, baseUrl).toString();
      refs.add(abs);
    } catch {
      // skip malformed
    }
  };
  $('script[src]').each((_, el) => add($(el).attr('src')));
  $('link[href]').each((_, el) => add($(el).attr('href')));
  $('img[src]').each((_, el) => add($(el).attr('src')));
  $('audio[src]').each((_, el) => add($(el).attr('src')));
  $('audio source[src]').each((_, el) => add($(el).attr('src')));
  $('video[src]').each((_, el) => add($(el).attr('src')));
  $('source[src]').each((_, el) => add($(el).attr('src')));
  return [...refs];
}

function extractReferencesFromJs(jsText, baseUrl) {
  const refs = new Set();
  const re = /["']([a-zA-Z0-9_\-./]+\.(png|jpg|jpeg|gif|webp|mp3|wav|ogg|m4a|json|atlas|plist|fnt))["']/g;
  let m;
  while ((m = re.exec(jsText)) !== null) {
    const candidate = m[1];
    if (candidate.startsWith('http')) {
      try { refs.add(new URL(candidate).toString()); } catch {}
    } else if (candidate.startsWith('/') || candidate.startsWith('./') || /^[a-z0-9_\-]/.test(candidate)) {
      try { refs.add(new URL(candidate, baseUrl).toString()); } catch {}
    }
  }
  return [...refs];
}

function sameOrigin(a, b) {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.origin === ub.origin;
  } catch {
    return false;
  }
}

async function main(rawUrl, outDir) {
  if (!rawUrl || !/^https?:\/\//.test(rawUrl)) {
    console.error(JSON.stringify({ ok: false, error: 'invalid-url', url: rawUrl }));
    process.exit(2);
  }
  if (!outDir) {
    console.error(JSON.stringify({ ok: false, error: 'missing-outDir' }));
    process.exit(2);
  }
  try {
    await assertAllowedTarget(rawUrl);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: err.message || 'ssrf-blocked', url: sanitizeUrl(rawUrl) }));
    process.exit(2);
  }
  ensureDir(outDir);

  const startedAt = new Date().toISOString();
  const files = [];
  const gaps = [];
  let totalBytes = 0;
  const seen = new Set();
  const sanitizedSource = sanitizeUrl(rawUrl);

  async function tryFetch(targetUrl, kindHint) {
    if (seen.has(targetUrl)) return;
    seen.add(targetUrl);
    if (!sameOrigin(targetUrl, rawUrl)) {
      gaps.push({ url: sanitizeUrl(targetUrl), reason: 'cross-origin-skipped' });
      return null;
    }
    let result;
    try {
      result = await fetchOne(targetUrl, {
        timeoutMs: PER_FILE_TIMEOUT_MS,
        capRemaining: TOTAL_CAP_BYTES - totalBytes,
        originGuard: kindHint === 'root' ? null : rawUrl
      });
    } catch (err) {
      if (err && err.message === 'CAP_EXCEEDED') {
        gaps.push({ url: sanitizeUrl(targetUrl), reason: 'cap-exceeded' });
        throw new Error('TOTAL_CAP_EXCEEDED');
      }
      gaps.push({ url: sanitizeUrl(targetUrl), reason: `fetch-failed:${err && err.message || err && err.name || 'error'}` });
      return null;
    }
    if (result.status >= 400) {
      gaps.push({ url: sanitizeUrl(targetUrl), reason: `http-${result.status}` });
      return null;
    }
    const mime = inferMime(targetUrl, result.contentType);
    const size = result.buf.length;
    if (totalBytes + size > TOTAL_CAP_BYTES) {
      gaps.push({ url: sanitizeUrl(targetUrl), reason: 'cap-exceeded' });
      throw new Error('TOTAL_CAP_EXCEEDED');
    }
    const urlObj = new URL(targetUrl);
    const cat = kindHint === 'root' ? '.' : categoryOf(mime);
    const baseName = kindHint === 'root' ? 'index.html' : safeBasename(urlObj);
    let relPath = cat === '.' ? baseName : path.posix.join(cat, baseName);
    let collisionIdx = 1;
    while (fs.existsSync(path.join(outDir, relPath))) {
      const dir = path.dirname(relPath);
      const ext = path.extname(relPath);
      const base = path.basename(relPath, ext);
      relPath = path.posix.join(dir === '.' ? '' : dir, `${base}_${collisionIdx}${ext}`);
      collisionIdx++;
      if (collisionIdx > 50) break;
    }
    writeFileSafe(outDir, relPath, result.buf);
    totalBytes += size;
    const entry = {
      url: sanitizeUrl(targetUrl),
      path: relPath.split(path.sep).join('/'),
      sha256: sha256Hex(result.buf),
      size,
      mime,
      status: result.status
    };
    files.push(entry);
    return { entry, buf: result.buf, mime };
  }

  let root;
  try {
    root = await tryFetch(rawUrl, 'root');
  } catch (e) {
    if (e && e.message === 'TOTAL_CAP_EXCEEDED') {
      writeManifestAndExit({ outDir, sanitizedSource, rawUrl, startedAt, totalBytes, files, gaps, capped: true });
      return;
    }
    throw e;
  }
  if (!root) {
    console.error(JSON.stringify({ ok: false, error: 'root-fetch-failed', gaps }));
    process.exit(3);
  }
  if (root.mime !== 'text/html' && !root.entry.path.endsWith('.html')) {
    gaps.push({ url: sanitizedSource, reason: `root-not-html:${root.mime}` });
  }

  const htmlRefs = extractReferencesFromHtml(root.buf.toString('utf8'), rawUrl);
  const jsTargets = [];
  try {
    for (const ref of htmlRefs) {
      try {
        const sub = await tryFetch(ref, 'sub');
        if (sub && sub.mime === 'application/javascript') {
          jsTargets.push({ url: ref, text: sub.buf.toString('utf8') });
        }
      } catch (e) {
        if (e && e.message === 'TOTAL_CAP_EXCEEDED') {
          writeManifestAndExit({ outDir, sanitizedSource, rawUrl, startedAt, totalBytes, files, gaps, capped: true });
          return;
        }
        throw e;
      }
    }
    for (const js of jsTargets) {
      const refs = extractReferencesFromJs(js.text, js.url);
      for (const ref of refs) {
        try {
          await tryFetch(ref, 'sub');
        } catch (e) {
          if (e && e.message === 'TOTAL_CAP_EXCEEDED') {
            writeManifestAndExit({ outDir, sanitizedSource, rawUrl, startedAt, totalBytes, files, gaps, capped: true });
            return;
          }
          throw e;
        }
      }
    }
  } catch (err) {
    gaps.push({ url: sanitizedSource, reason: `crawl-failed:${err && err.message || 'error'}` });
  }

  writeManifestAndExit({ outDir, sanitizedSource, rawUrl, startedAt, totalBytes, files, gaps, capped: false });
}

function writeManifestAndExit({ outDir, sanitizedSource, rawUrl, startedAt, totalBytes, files, gaps, capped }) {
  const manifest = {
    schemaVersion: 1,
    sourceUrl: sanitizedSource,
    sourceUrlHash: urlHash(rawUrl),
    fetchedAt: startedAt,
    finishedAt: new Date().toISOString(),
    totalBytes,
    capBytes: TOTAL_CAP_BYTES,
    capped,
    fileCount: files.length,
    files,
    gaps
  };
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  process.stdout.write(JSON.stringify({
    ok: !capped && files.length > 0,
    capped,
    fileCount: files.length,
    totalBytes,
    gapCount: gaps.length,
    manifestPath: path.join(outDir, 'manifest.json')
  }) + '\n');
  process.exit(capped ? 4 : 0);
}

if (require.main === module) {
  const [, , url, outDir] = process.argv;
  main(url, outDir).catch((err) => {
    console.error(JSON.stringify({ ok: false, error: err && err.message || String(err) }));
    process.exit(1);
  });
}

module.exports = { TOTAL_CAP_BYTES };
