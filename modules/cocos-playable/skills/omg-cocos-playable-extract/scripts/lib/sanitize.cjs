#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-cocos | repo=The1Studio/oh-my-game-kit-cocos | module=playable | protected=false
'use strict';

// SSOT for URL/text sanitization in omg-cocos-playable-extract.
// Strips tracking params, PII patterns, and user-path leaks before
// content reaches manifest.json, docs, or user-facing chat.

const TRACKING_PARAM_KEYS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'gclid', 'fbclid', 'mc_eid', 'mc_cid',
  'msclkid', 'ttclid', 'ttid',
  'idfa', 'gaid', 'adid', 'aaid',
  'device_id', 'session_id', 'user_id', 'uid',
  'sub_id', 'subid', 'sub1', 'sub2', 'sub3', 'sub4', 'sub5',
  'click_id', 'clickid', 'cid',
  'token', 'auth', 'access_token', 'api_key', 'apikey', 'key', 'sig', 'signature'
]);

const SENSITIVE_PATTERNS = [
  { name: 'bearer-token', re: /Bearer\s+[A-Za-z0-9_\-.=]+/gi, replace: 'Bearer [REDACTED]' },
  { name: 'aws-key', re: /AKIA[0-9A-Z]{16}/g, replace: '[AWS_KEY_REDACTED]' },
  { name: 'github-pat', re: /ghp_[A-Za-z0-9]{36}/g, replace: '[GH_PAT_REDACTED]' },
  { name: 'jwt', re: /\beyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+/g, replace: '[JWT_REDACTED]' },
  { name: 'win-user-path', re: /C:\\Users\\[^\\/\s"']+/gi, replace: 'C:\\Users\\[USER]' },
  { name: 'unix-user-path', re: /\/(?:home|Users)\/[^/\s"']+/g, replace: '/home/[USER]' },
  { name: 'email', re: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g, replace: '[EMAIL_REDACTED]' },
  { name: 'ipv4', re: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replace: '[IP_REDACTED]' }
];

function sanitizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) return '';
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return sanitizeText(rawUrl);
  }
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAM_KEYS.has(key.toLowerCase())) {
      url.searchParams.delete(key);
    }
  }
  url.username = '';
  url.password = '';
  return sanitizeText(url.toString());
}

function sanitizeText(input) {
  if (typeof input !== 'string') return '';
  let out = input;
  for (const { re, replace } of SENSITIVE_PATTERNS) {
    out = out.replace(re, replace);
  }
  return out;
}

function sanitizeManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') return manifest;
  const out = JSON.parse(JSON.stringify(manifest));
  if (typeof out.sourceUrl === 'string') out.sourceUrl = sanitizeUrl(out.sourceUrl);
  if (Array.isArray(out.files)) {
    out.files = out.files.map((f) => {
      if (!f || typeof f !== 'object') return f;
      const copy = { ...f };
      if (typeof copy.url === 'string') copy.url = sanitizeUrl(copy.url);
      if (typeof copy.path === 'string') copy.path = sanitizeText(copy.path);
      return copy;
    });
  }
  return out;
}

module.exports = {
  sanitizeUrl,
  sanitizeText,
  sanitizeManifest,
  TRACKING_PARAM_KEYS,
  SENSITIVE_PATTERNS
};

if (require.main === module) {
  const arg = process.argv[2];
  if (!arg) {
    console.error('usage: sanitize.cjs <url-or-text>');
    process.exit(1);
  }
  const result = arg.startsWith('http') ? sanitizeUrl(arg) : sanitizeText(arg);
  process.stdout.write(result + '\n');
}
