#!/usr/bin/env node
// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * omg-wiki dispatcher.
 *
 * Usage:
 *   node wiki-helper.cjs <op> [args...]
 *
 * Ops:
 *   init        - clone <repo>.wiki.git to .wiki/ (or $OMG_WIKI_DIR)
 *   pull        - git pull the wiki clone
 *   status      - git status + unpushed log
 *   list        - list pages grouped by sidebar section
 *   add <Name>  - create new page from template
 *   validate    - run all validators; exit non-zero on failures
 *   fix         - apply safe auto-fixes (mermaid contrast, page names, sidebar regen)
 *   beautify    - full format pass (structure + visuals, AI+human dual audience)
 *   publish [-m msg] - validate → commit → push (blocks on errors)
 *   audit       - validate --verbose
 *
 * Env:
 *   OMG_WIKI_DIR   - override wiki clone path (default .wiki/)
 *   OMG_WIKI_VERBOSE=1 - verbose output
 */

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const utils = require('./lib/wiki-utils.cjs');

const VALIDATORS = [
  'validate-mermaid-contrast.cjs',
  'validate-wiki-links.cjs',
  'validate-page-names.cjs',
  'validate-sidebar.cjs',
  'validate-images.cjs',
  'validate-frontmatter.cjs',
  'validate-section-headers.cjs',
  'validate-chunk-size.cjs',
  'validate-anti-patterns.cjs',
];
const FIXERS = [
  'fix-mermaid-contrast.cjs',
  'fix-page-names.cjs',
  'sync-sidebar.cjs',
];
const BEAUTIFIERS = [
  // Keep order: structure first, then visuals, then links
  'beautify-frontmatter.cjs',
  'beautify-headings.cjs',
  'beautify-code-fences.cjs',
  'beautify-callouts.cjs',
  'beautify-tables.cjs',
  'beautify-mermaid.cjs',
  'beautify-toc.cjs',
  'beautify-breadcrumbs.cjs',
  'beautify-links.cjs',
];

function main() {
  const [, , op, ...rest] = process.argv;
  if (!op) {
    usage();
    process.exit(2);
  }
  switch (op) {
    case 'init':
      return opInit(rest[0]);
    case 'pull':
      return opPull();
    case 'status':
      return opStatus();
    case 'list':
      return opList();
    case 'add':
      return opAdd(rest[0], rest.slice(1));
    case 'validate':
      return opValidate(rest);
    case 'fix':
      return opFix(rest);
    case 'beautify':
      return opBeautify(rest);
    case 'publish':
      return opPublish(rest);
    case 'audit':
      return opValidate([...rest, '--verbose']);
    case '-h':
    case '--help':
      usage();
      return;
    default:
      console.error(`Unknown op: ${op}`);
      usage();
      process.exit(2);
  }
}

function usage() {
  console.log(`omg-wiki dispatcher — operations:
  init         clone the wiki repo into .wiki/
  pull         git pull the wiki clone
  status       show diff + unpushed commits
  list         list pages by section
  add <Name>   create new page
  validate     run all validators (non-zero exit on FAIL)
  fix          auto-apply safe fixes (contrast, names, sidebar)
  beautify     full format pass (structure + visuals)
  publish      validate → commit → push (-m "msg")
  audit        validate --verbose

Env:
  OMG_WIKI_DIR       override wiki path (default .wiki/)
  OMG_WIKI_VERBOSE=1 verbose output`);
}

function opInit(remoteOverride) {
  const cwd = process.cwd();
  const target = process.env.OMG_WIKI_DIR
    ? path.resolve(cwd, process.env.OMG_WIKI_DIR)
    : path.join(cwd, '.wiki');
  if (fs.existsSync(target)) {
    console.error(`[init] path already exists: ${target}`);
    console.error('[init] remove it or set OMG_WIKI_DIR to a different path');
    process.exit(1);
  }
  const url = remoteOverride || utils.getWikiRemoteUrl(cwd);
  if (!url) {
    console.error('[init] no git remote origin detected; pass remote URL as argument');
    process.exit(1);
  }
  console.log(`[init] cloning ${url} → ${target}`);
  const r = spawnSync('git', ['clone', url, target], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status || 1);
  const home = path.join(target, 'Home.md');
  if (!fs.existsSync(home)) {
    fs.writeFileSync(
      home,
      `# Home\n\nWelcome to the wiki. Edit this file to get started.\n`,
      'utf8'
    );
    console.log('[init] wrote default Home.md');
  }
  const sidebar = path.join(target, '_Sidebar.md');
  if (!fs.existsSync(sidebar)) {
    fs.writeFileSync(sidebar, `## Pages\n\n- [Home](Home)\n`, 'utf8');
    console.log('[init] wrote default _Sidebar.md');
  }
  console.log('[init] done');
}

function opPull() {
  const wiki = requireWiki();
  const r = spawnSync('git', ['-C', wiki, 'pull', '--ff-only'], {
    stdio: 'inherit',
  });
  process.exit(r.status || 0);
}

function opStatus() {
  const wiki = requireWiki();
  console.log(`[status] wiki dir: ${wiki}\n`);
  spawnSync('git', ['-C', wiki, 'status', '--short', '--branch'], {
    stdio: 'inherit',
  });
  console.log('');
  const upstream = hasUpstream(wiki);
  if (upstream) {
    const r = execFileSync('git', ['-C', wiki, 'log', '@{u}..HEAD', '--oneline'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (r) {
      console.log('[status] unpushed commits:');
      console.log(r);
    } else {
      console.log('[status] branch is up to date with upstream');
    }
  } else {
    console.log('[status] no upstream tracking branch');
  }
}

function opList() {
  const wiki = requireWiki();
  const pages = utils.listPages(wiki);
  console.log(`[list] ${pages.length} pages in ${wiki}:\n`);
  pages.forEach((p) => console.log(`  ${path.basename(p)}`));
}

function opAdd(name, _extra) {
  if (!name) {
    console.error('[add] usage: add <PageName>');
    process.exit(2);
  }
  const wiki = requireWiki();
  const filename = utils.canonicalPageName(name);
  const target = path.join(wiki, filename);
  if (fs.existsSync(target)) {
    console.error(`[add] page already exists: ${filename}`);
    process.exit(1);
  }
  const title = filename.replace(/\.md$/, '').replace(/-/g, ' ');
  const today = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(
    target,
    `---
title: ${title}
wikiSection: Uncategorized
audience: [ai, human]
summary: "TODO: one-line summary"
lastUpdated: ${today}
---

# ${title}

> [!NOTE]
> TODO: write the page.

## Overview

TODO

## See also

- [Home](Home)
`,
    'utf8'
  );
  console.log(`[add] created ${filename}`);
  // Best-effort sidebar append
  const sidebar = path.join(wiki, '_Sidebar.md');
  if (fs.existsSync(sidebar)) {
    fs.appendFileSync(sidebar, `- [${title}](${filename.replace(/\.md$/, '')})\n`, 'utf8');
    console.log('[add] appended to _Sidebar.md');
  }
}

function opValidate(args) {
  const wiki = requireWiki();
  const verbose = args.includes('--verbose') || process.env.OMG_WIKI_VERBOSE === '1';
  const results = [];
  for (const v of VALIDATORS) {
    const p = path.join(__dirname, v);
    if (!fs.existsSync(p)) {
      console.error(`[validate] missing validator: ${v}`);
      results.push({ name: v, ok: false });
      continue;
    }
    const r = spawnSync('node', [p, wiki, ...(verbose ? ['--verbose'] : [])], {
      stdio: 'inherit',
    });
    results.push({ name: v, ok: r.status === 0 });
  }
  const failed = results.filter((r) => !r.ok);
  console.log('');
  console.log(`[validate] ${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('[validate] failed:');
    failed.forEach((f) => console.log(`  - ${f.name}`));
    process.exit(1);
  }
}

function opFix(args) {
  const wiki = requireWiki();
  const dry = args.includes('--dry-run');
  for (const f of FIXERS) {
    const p = path.join(__dirname, f);
    if (!fs.existsSync(p)) {
      console.error(`[fix] missing fixer: ${f}`);
      continue;
    }
    const r = spawnSync('node', [p, wiki, ...(dry ? ['--dry-run'] : [])], {
      stdio: 'inherit',
    });
    if (r.status !== 0) {
      console.error(`[fix] fixer failed: ${f}`);
      process.exit(r.status || 1);
    }
  }
  console.log('[fix] done — review diff with: git -C "' + wiki + '" diff');
}

function opBeautify(args) {
  const wiki = requireWiki();
  const dry = args.includes('--dry-run');
  const passFilter = args.find((a) => a.startsWith('--pass='));
  const passes = passFilter
    ? [passFilter.split('=')[1]]
    : BEAUTIFIERS;
  for (const b of passes) {
    const p = path.join(__dirname, b);
    if (!fs.existsSync(p)) {
      console.error(`[beautify] missing pass: ${b}`);
      continue;
    }
    const r = spawnSync('node', [p, wiki, ...(dry ? ['--dry-run'] : [])], {
      stdio: 'inherit',
    });
    if (r.status !== 0) {
      console.error(`[beautify] pass failed: ${b}`);
      process.exit(r.status || 1);
    }
  }
  console.log('[beautify] done — review diff with: git -C "' + wiki + '" diff');
}

function opPublish(args) {
  const wiki = requireWiki();
  const mi = args.indexOf('-m');
  const msg = mi >= 0 && args[mi + 1] ? args[mi + 1] : `wiki: update ${new Date().toISOString().slice(0, 10)}`;
  // 1. Validate (blocking)
  console.log('[publish] running validators…');
  const v = spawnSync('node', [__filename, 'validate'], { stdio: 'inherit' });
  if (v.status !== 0) {
    console.error('[publish] validation failed — fix errors before publishing');
    process.exit(1);
  }
  // 2. Secret scan on staged content
  console.log('[publish] scanning for secrets…');
  scanForSecrets(wiki);
  // 3. Stage, commit, push
  spawnSync('git', ['-C', wiki, 'add', '-A'], { stdio: 'inherit' });
  const diff = execFileSync('git', ['-C', wiki, 'diff', '--cached', '--stat'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }).trim();
  if (!diff) {
    console.log('[publish] nothing staged — skipping commit/push');
    return;
  }
  console.log('[publish] staged changes:');
  console.log(diff);
  const c = spawnSync('git', ['-C', wiki, 'commit', '-m', msg], { stdio: 'inherit' });
  if (c.status !== 0) {
    console.error('[publish] commit failed');
    process.exit(c.status || 1);
  }
  const p = spawnSync('git', ['-C', wiki, 'push'], { stdio: 'inherit' });
  if (p.status !== 0) {
    console.error('[publish] push failed');
    process.exit(p.status || 1);
  }
  console.log('[publish] done');
}

function scanForSecrets(wiki) {
  const patterns = [
    { name: 'API key (sk-*)', re: /\bsk-[A-Za-z0-9]{20,}\b/ },
    { name: 'GitHub PAT (ghp_/ghs_/gho_)', re: /\b(ghp|ghs|gho)_[A-Za-z0-9]{20,}\b/ },
    { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/ },
    { name: 'JWT', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/ },
    { name: 'env-var assignment', re: /\b(?:API_KEY|SECRET|PASSWORD|TOKEN)\s*=\s*['"][^'"]{8,}['"]/i },
  ];
  const staged = execFileSync('git', ['-C', wiki, 'diff', '--cached'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const hits = [];
  for (const { name, re } of patterns) {
    const m = re.exec(staged);
    if (m) hits.push({ name, sample: m[0].slice(0, 40) });
  }
  if (hits.length) {
    console.error('[publish] POSSIBLE SECRETS IN STAGED CONTENT — aborting:');
    hits.forEach((h) => console.error(`  - ${h.name}: ${h.sample}…`));
    console.error('[publish] inspect with: git -C "' + wiki + '" diff --cached');
    process.exit(1);
  }
}

function hasUpstream(wiki) {
  try {
    execFileSync('git', ['-C', wiki, 'rev-parse', '--abbrev-ref', '@{u}'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return true;
  } catch (_e) {
    return false;
  }
}

function requireWiki() {
  const wiki = utils.resolveWikiDir(process.cwd());
  if (!wiki) {
    console.error('[wiki-helper] no wiki clone found.');
    console.error('  Set OMG_WIKI_DIR, create .wiki/, or run: wiki-helper init');
    process.exit(1);
  }
  return wiki;
}

main();
