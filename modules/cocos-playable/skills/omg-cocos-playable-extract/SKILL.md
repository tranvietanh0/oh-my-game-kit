---
name: omg-cocos-playable-extract
description: "Reverse-engineer a competitor playable-ad HTML bundle. Given a URL, fetches + unpacks + statically analyzes the bundle and emits 3 commit-ready English docs (gameplay.md, code-structure.md, cocos-implementation.md) plus a gitignored raw/ artifact tree. The cocos-implementation.md doc cites Cocos kit skills with concrete invocation arguments."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Cocos Playable Extract — Competitor Playable Reverse-Engineer

Given a competitor playable-ad HTML bundle URL, produce 3 commit-ready English docs and a gitignored `raw/` artifact tree.

## Usage

```
omg-cocos:playable:extract <https-url-to-playable.html>
```

## Pipeline (5 runtime phases)

1. **Fetch** — `scripts/fetch-bundle.cjs <url> <outDir>/raw/` — crawls same-origin HTML/JS/img/audio/json, writes `raw/manifest.json` (sourceUrl, timestamp, fileList, sha256Map, cacheKey). Hard cap: **10 MB**.
2. **Unpack** — `scripts/unpack-bundle.cjs <outDir>/raw/` — extracts inline `<script>` tags, decodes base64, beautifies JS via `js-beautify`.
3. **Detect** — engine fingerprint (cocos creator 3.x / 2.x / pixi / playcanvas / custom) using regex catalog in `references/engine-fingerprints.md`. Output: detected engine + version + confidence + entry-point JS file.
4. **Analyze** — spawn `omg-cocos-playable-extractor` subagent (background, fork context). Subagent reads beautified JS + assets, infers gameplay loop, code architecture, monetization hooks (catalog: `references/monetization-hooks.md`).
5. **Generate** — subagent writes 3 docs from templates in `references/templates/`:
   - `gameplay.md` — genre, core loop, win/lose, CTAs, session length, monetization
   - `code-structure.md` — engine + version, bundle breakdown, entry point, modules, event flow, obfuscation level
   - `cocos-implementation.md` — Cocos rebuild recipe; **MUST cite ≥5 distinct `omg-cocos-playable-*` skills** with concrete invocation arguments

## Skill Body Steps (when invoked)

1. Validate `<url>` is http(s); reject otherwise
2. Compute `slug = sha256(url).slice(0,8) + '-' + guessGameNameFromUrl(url)` (rules: `references/slug-rules.md`)
3. Resolve `outDir = plans/research/playable-{slug}/`
4. Cache check: if `outDir/raw/manifest.json` matches input URL hash → skip to step 7
5. Run `scripts/fetch-bundle.cjs` → smoke first file, surface result, gate via user confirm before full crawl (per `rules/preview-first-batch.md`)
6. Run `scripts/unpack-bundle.cjs`
7. Spawn `omg-cocos-playable-extractor` subagent in background with arguments: `rawDir`, module-inventory (from `metadata.json.installedModules` + `omg-activation-*.json`), 3 doc output paths
8. Skill validates output: each doc exists, `cocos-implementation.md` cites ≥5 distinct `omg-cocos-playable-*` skills, no inline binary, no PII (URLs/tokens/query params stripped via `scripts/lib/sanitize.cjs`)
9. Append `outDir/raw/` to `.gitignore` under marker block `# omg-cocos:playable:extract BEGIN/END` (append-only)
10. **Commit `outDir/raw/manifest.json` only** — full raw assets stay gitignored (Q2=B resolution)
11. Final prompt: "Run `omg-plan` against `cocos-implementation.md`?"

## Output Layout

```
plans/research/playable-{slug}/
├── gameplay.md                  # committed
├── code-structure.md            # committed
├── cocos-implementation.md      # committed
└── raw/
    ├── manifest.json            # committed (Q2=B)
    ├── index.html               # gitignored
    ├── scripts/*.js             # gitignored
    ├── scripts/*.beautified.js  # gitignored
    └── assets/                  # gitignored
```

## Constraints

- **Static analysis only** — no headless execution, no source-map de-obfuscation
- **10 MB hard cap** on total bundle size; refuses past cap with explicit message (Q3=A resolution)
- **Single URL per invocation** — no batch mode
- **Cocos rebuild recipe always emitted**, regardless of detected engine (kit's purpose)
- **Confidence tagging mandatory** — every doc footer states confidence (high/med/low) with reason; subagent must fall back to "behavioral spec" mode rather than fabricate identifiers when obfuscation defeats analysis

## Common Mistakes

- Hardcoding ad-network CDN domains in scripts — keep configurable via input URL only
- Re-fetching when cache is valid — always check `manifest.json` first
- Committing `raw/` assets — only `manifest.json` is committed; full tree is gitignored
- Citing fewer than 5 Cocos skills in `cocos-implementation.md` — validator must reject

## Gotchas

- **Mintegral CDN 401/403** — some assets walled; `fetch-bundle.cjs` logs gap to manifest and continues with available files. Subagent must flag "partial bundle — analysis may miss assets" in `code-structure.md`.
- **Obfuscated identifiers** — `t/e/n` minified variable names defeat structure analysis. Subagent uses "describe-by-behavior" mode: notes `obfuscation: heavy — identifiers unrecoverable` instead of fabricating names.
- **Cocos runtime is ~2 MB of boilerplate** — subagent must skip engine code (regex-detected via `references/engine-fingerprints.md`) to preserve token budget for game-specific code.
- **URL sanitizer is SSOT** — never write a raw URL to manifest, docs, or chat; route every URL through `scripts/lib/sanitize.cjs` first to strip tracking params and PII.

## Related

- `omg-cocos-playable-build-size` — bundle-size targets the recipe references
- `omg-cocos-playable-fsm`, `omg-cocos-playable-signalbus`, `omg-cocos-playable-lifecycle`, `omg-cocos-playable-object-pool`, `omg-cocos-playable-parameter` — core skills the rebuild recipe cites
- `rules/preview-first-batch.md` — smoke-first gate enforced in Step 5
- `rules/code-conventions-cocos.md` — file scaffold the recipe matches
