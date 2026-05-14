// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-base | protected=true
/**
 * Shared utilities for omg-wiki scripts.
 *
 * All scripts in ../validate-*.cjs, ../fix-*.cjs, and ../wiki-helper.cjs
 * import from here. Keep this file pure — no side effects at require time.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const MERMAID_TEXT_COLOR = '#0d1117';
const RESERVED_PAGES = new Set(['Home.md', '_Sidebar.md', '_Footer.md']);

/**
 * Detect the wiki clone directory for the current project.
 * Resolution order:
 *   1. env OMG_WIKI_DIR (absolute or relative to cwd)
 *   2. ./.wiki/ (preferred default; gitignored)
 *   3. ../<repoName>.wiki (sibling of current repo — common pattern)
 * Returns absolute path, or null if nothing looks like a wiki clone.
 */
function resolveWikiDir(cwd) {
  cwd = cwd || process.cwd();
  if (process.env.OMG_WIKI_DIR) {
    const p = path.isAbsolute(process.env.OMG_WIKI_DIR)
      ? process.env.OMG_WIKI_DIR
      : path.resolve(cwd, process.env.OMG_WIKI_DIR);
    if (isWikiClone(p)) return p;
  }
  const dotWiki = path.join(cwd, '.wiki');
  if (isWikiClone(dotWiki)) return dotWiki;
  const remote = getWikiRemoteUrl(cwd);
  if (remote) {
    const sibling = path.resolve(cwd, '..', path.basename(remote, '.git'));
    if (isWikiClone(sibling)) return sibling;
  }
  return null;
}

function isWikiClone(p) {
  if (!p || !fs.existsSync(p)) return false;
  // Must be a git clone (has .git) AND contain wiki-shaped .md files
  if (!fs.existsSync(path.join(p, '.git'))) return false;
  const entries = fs.readdirSync(p).filter((f) => f.endsWith('.md'));
  return entries.length > 0;
}

/**
 * Derive the wiki repo URL from the current project's git remote.
 * For `git@github.com:Org/Repo.git` → `git@github.com:Org/Repo.wiki.git`
 * For `https://github.com/Org/Repo.git` → `https://github.com/Org/Repo.wiki.git`
 * Returns null if no remote origin or not a GitHub-shaped URL.
 */
function getWikiRemoteUrl(cwd) {
  try {
    const out = execFileSync('git', ['config', '--get', 'remote.origin.url'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    if (!out) return null;
    if (out.endsWith('.wiki.git')) return out;
    return out.replace(/(\.git)?$/, '.wiki.git');
  } catch (_e) {
    return null;
  }
}

/** List all wiki pages (absolute paths), excluding reserved sidebars/footers. */
function listPages(wikiDir, { includeReserved = false } = {}) {
  if (!wikiDir || !fs.existsSync(wikiDir)) return [];
  return fs
    .readdirSync(wikiDir)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => includeReserved || !RESERVED_PAGES.has(f))
    .map((f) => path.join(wikiDir, f));
}

/**
 * Scan the markdown content and call onBlock(blockText, startLine) for each
 * ```mermaid ... ``` fenced block. Returns an array of block descriptors.
 */
function extractMermaidBlocks(content) {
  const lines = content.split('\n');
  const blocks = [];
  let inFence = false;
  let startLine = -1;
  let buf = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!inFence && /^```\s*mermaid\b/i.test(trimmed)) {
      inFence = true;
      startLine = i;
      buf = [];
      continue;
    }
    if (inFence && /^```\s*$/.test(trimmed)) {
      blocks.push({ startLine, endLine: i, lines: buf.slice() });
      inFence = false;
      startLine = -1;
      buf = [];
      continue;
    }
    if (inFence) buf.push(line);
  }
  return blocks;
}

/**
 * Check a single `style X attrs` or `classDef X attrs` line for an explicit
 * `color:` field. Returns { hasColor, attrsStart } where attrsStart is the
 * character index where attrs begin on the line (for splice insertion).
 */
function inspectStyleLine(line) {
  // Match: optional leading whitespace, keyword, identifier, whitespace, attrs
  const m = /^(\s*(?:style|classDef)\s+\S+\s+)(.*)$/.exec(line);
  if (!m) return { match: false };
  const attrs = m[2];
  const hasColor = /\bcolor:\s*[^,;\s]/.test(attrs);
  return {
    match: true,
    prefix: m[1],
    attrs,
    hasColor,
  };
}

/**
 * Return the canonical GitHub-wiki filename for a user-provided page name.
 *   "Mechanic Registry" → "Mechanic-Registry.md"
 *   "mechanic_registry" → "Mechanic-Registry.md"
 *   "Already-Valid.md"  → "Already-Valid.md"
 * Throws if the input is empty after normalization.
 */
function canonicalPageName(input) {
  let s = String(input || '').trim();
  if (s.endsWith('.md')) s = s.slice(0, -3);
  // Replace any run of spaces/underscores/hyphens with a single hyphen
  s = s.replace(/[\s_]+/g, '-').replace(/-+/g, '-');
  // Strip leading/trailing hyphens
  s = s.replace(/^-+|-+$/g, '');
  if (!s) throw new Error('canonicalPageName: input resolves to empty string');
  // PascalCase each hyphen segment
  s = s
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join('-');
  return `${s}.md`;
}

/** True when a filename is already canonical (safe to skip fixer). */
function isCanonicalPageName(filename) {
  if (RESERVED_PAGES.has(filename)) return true;
  try {
    return canonicalPageName(filename) === filename;
  } catch (_e) {
    return false;
  }
}

/**
 * Parse a markdown line and return all link targets (both `[text](target)`
 * and Gollum `[[target]]` forms). Skips URLs and same-page anchors.
 * Returns [{ raw, target, line, kind }] where kind is 'md' | 'gollum' | 'image'.
 */
function extractLinks(content) {
  const out = [];
  const lines = content.split('\n');
  const mdLink = /(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  const gollum = /\[\[([^\]]+)\]\]/g;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m;
    while ((m = mdLink.exec(line)) !== null) {
      const [raw, bang, , target] = m;
      const isImage = bang === '!';
      if (isExternal(target) || isAnchor(target)) continue;
      out.push({
        raw,
        target,
        line: i + 1,
        kind: isImage ? 'image' : 'md',
      });
    }
    while ((m = gollum.exec(line)) !== null) {
      const inner = m[1];
      // [[display|target]] or [[target]]
      const target = inner.includes('|') ? inner.split('|')[1].trim() : inner.trim();
      if (isExternal(target)) continue;
      out.push({
        raw: m[0],
        target,
        line: i + 1,
        kind: 'gollum',
      });
    }
  }
  return out;
}

function isExternal(target) {
  return /^(https?:|mailto:|ftp:|tel:)/i.test(target);
}

function isAnchor(target) {
  return target.startsWith('#');
}

/**
 * Resolve an internal link target to an expected wiki filename.
 * "Mechanic-Registry" → "Mechanic-Registry.md"
 * "./Mechanic-Registry.md" → "Mechanic-Registry.md"
 * "Home" → "Home.md"
 * Drops any #anchor fragment.
 * Returns null when the target can't be resolved (e.g., starts with `../`).
 */
function linkTargetToFilename(target) {
  if (!target) return null;
  const noAnchor = target.split('#')[0];
  if (!noAnchor) return null;
  // Reject paths that try to escape the wiki root
  if (noAnchor.includes('..')) return null;
  let name = noAnchor.replace(/^\.\//, '');
  if (name.includes('/')) return null; // Sub-paths don't exist in GH wikis
  if (!name.endsWith('.md')) name = `${name}.md`;
  return name;
}

/** Emit a GitHub-actions style error annotation to stdout. */
function ghError(file, line, msg) {
  console.log(`::error file=${file},line=${line}::${msg}`);
}

function ghWarning(file, line, msg) {
  console.log(`::warning file=${file},line=${line}::${msg}`);
}

const FENCE_MASK_PREFIX = '\u0000OMGFENCE';
const FENCE_MASK_SUFFIX = '\u0000';
const FENCE_MASK_RE = /\u0000OMGFENCE(\d+)\u0000/g;

/**
 * Replace every ```...``` fenced block with an opaque placeholder so regex
 * transforms can safely run on the prose without touching code examples.
 * Unterminated fences (EOF inside a fence) are also masked to preserve
 * content verbatim.
 *
 * Returns { masked, fences } where `fences[i]` is the original fenced text
 * (including the opening/closing ``` lines) for placeholder `\u0000OMGFENCE<i>\u0000`.
 */
function maskFencedBlocks(content) {
  const fences = [];
  const lines = content.split('\n');
  const out = [];
  let inFence = false;
  let buf = [];
  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      buf.push(line);
      if (inFence) {
        const idx = fences.length;
        fences.push(buf.join('\n'));
        out.push(`${FENCE_MASK_PREFIX}${idx}${FENCE_MASK_SUFFIX}`);
        buf = [];
        inFence = false;
      } else {
        inFence = true;
      }
      continue;
    }
    if (inFence) {
      buf.push(line);
    } else {
      out.push(line);
    }
  }
  if (inFence) {
    // Unterminated fence — mask verbatim so unmask restores exactly.
    const idx = fences.length;
    fences.push(buf.join('\n'));
    out.push(`${FENCE_MASK_PREFIX}${idx}${FENCE_MASK_SUFFIX}`);
  }
  return { masked: out.join('\n'), fences };
}

/** Inverse of maskFencedBlocks. */
function unmaskFencedBlocks(masked, fences) {
  return masked.replace(FENCE_MASK_RE, (_, idx) => fences[Number(idx)]);
}

/**
 * Run `replacer(text)` only on prose (fenced blocks are masked out first,
 * restored after). Use this instead of `content.replace(RE, ...)` whenever
 * the regex could plausibly match example syntax shown inside a code block.
 */
function replaceOutsideFences(content, replacer) {
  const { masked, fences } = maskFencedBlocks(content);
  const next = replacer(masked);
  return unmaskFencedBlocks(next, fences);
}

module.exports = {
  MERMAID_TEXT_COLOR,
  RESERVED_PAGES,
  resolveWikiDir,
  getWikiRemoteUrl,
  isWikiClone,
  listPages,
  extractMermaidBlocks,
  inspectStyleLine,
  canonicalPageName,
  isCanonicalPageName,
  extractLinks,
  linkTargetToFilename,
  ghError,
  ghWarning,
  maskFencedBlocks,
  unmaskFencedBlocks,
  replaceOutsideFences,
};
