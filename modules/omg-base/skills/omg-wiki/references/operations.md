---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Wiki Operations — Full Semantics

All operations dispatch through `scripts/wiki-helper.cjs <op> [args...]`.

## `init [path]`

Clones `<repo>.wiki.git` into the given path (default `.wiki/`). Scaffolds `Home.md` and `_Sidebar.md` if the wiki is empty. Idempotent — re-running on an already-initialized clone is a no-op (warns + exits 0).

- Resolves wiki URL from the current repo's `origin` remote → appends `.wiki.git`.
- Honors `$OMG_WIKI_DIR` to override the default clone path.
- Default branch on clone is `master` (GitHub's wiki convention).

Failure modes: no `origin` remote configured; no network; wiki repo doesn't exist yet (GitHub provisions it on the first wiki push — run `init` AFTER creating at least one page via the UI, or use the GitHub REST `PUT /repos/{owner}/{repo}/wiki` bootstrap).

## `pull`

Runs `git -C <wiki-dir> pull --ff-only`. On conflict with uncommitted local edits, reports and exits non-zero — the operator resolves manually. No auto-stash.

## `status`

Reports:
- Uncommitted diff (`git status --short`)
- Unpushed commits (`git log @{u}..HEAD`)
- Branch name (should be `master`)

## `list`

Enumerates `*.md` files in the wiki clone, groups them by the section link they appear under in `_Sidebar.md`. Files not referenced in `_Sidebar.md` appear under a synthetic "Orphan" group.

## `add <PageName>`

Creates `<PageName>.md` from a boilerplate template (frontmatter + empty H1 + placeholder body). Appends a link to `_Sidebar.md` under the section inferred from `--section` flag or the last-used section. Rejects names that violate filename rules (see `wiki-conventions.md`).

## `update <PageName>`

Intentional affordance — the skill does NOT write content. Instead:
1. Resolves the file path
2. Prints it for the agent/user to edit
3. Watches for modification (optional, via `--watch` flag)
4. Runs `validate` on save

Wiki content is semantic; auto-writes risk lossy transformations.

## `validate [--verbose]`

Runs every validator in `scripts/validate-*.cjs`:
- `validate-mermaid-contrast.cjs` — enforces `color:` on every `style`/`classDef` line with `fill:`
- `validate-wiki-links.cjs` — resolves `[x](Y.md)` and `[x](#anchor)` across all pages
- `validate-page-names.cjs` — filename format (hyphens, PascalCase per segment)
- `validate-sidebar.cjs` — orphan pages + broken sidebar links
- `validate-images.cjs` — `![x](path)` references resolve to existing files in the wiki clone
- `validate-frontmatter.cjs` — required frontmatter keys present
- `validate-section-headers.cjs` — H1-only-once, no skipped heading levels
- `validate-chunk-size.cjs` — pages over 20KB flagged for split
- `validate-anti-patterns.cjs` — stale TOC, broken callouts, etc.

Exit code: 0 on all-pass, 1 on any FAIL. `--verbose` prints pass lines too (useful for audits).

## `fix`

Applies safe, idempotent fixes:
- `fix-mermaid-contrast.cjs` — injects `color:#0d1117` into every `style`/`classDef` line with `fill:` but no `color:`
- `fix-page-names.cjs` — renames files to canonical format + updates links across other pages
- `sync-sidebar.cjs` — regenerates `_Sidebar.md` from discovered pages + their `wikiSection` frontmatter

Never:
- Rewrites anchor links (semantic risk)
- Changes page content body
- Deletes files

## `beautify [--dry-run]`

**MANDATORY after any page edit. Not optional. Not polish.**

Run sequence: `add`/`update` → **`beautify`** → `validate` → `publish`.

Rationale:
- Humans bounce off unaligned tables, missing TOC, stale breadcrumbs
- RAG loses H2 chunks whose anchors drifted after a heading rename
- Mermaid styles without explicit `color:` render unreadable on dark theme
- Frontmatter key order drift breaks downstream tooling that parses by sequence
- Callout syntax inconsistency (`> NOTE:` vs `> [!NOTE]`) degrades GitHub rendering

`publish` does NOT auto-run `beautify`. It validates (catches errors) but does not format. If you skip beautify, errors accumulate silently between sessions. The next contributor inherits drift they did not cause.

Full format pass, ordered:
1. `beautify-frontmatter.cjs` — normalize key order, strip trailing whitespace
2. `beautify-headings.cjs` — ATX style, single H1, consistent spacing
3. `beautify-code-fences.cjs` — language tags, consistent quoting
4. `beautify-callouts.cjs` — GitHub callout syntax `> [!NOTE]`
5. `beautify-tables.cjs` — align pipes, consistent header separators
6. `beautify-mermaid.cjs` — indent nodes, sort classDefs
7. `beautify-toc.cjs` — regenerate from H2/H3 headings
8. `beautify-breadcrumbs.cjs` — top-of-page breadcrumb link to Home
9. `beautify-links.cjs` — normalize `[text](URL)` format

Dual audience: output must be readable by both humans and LLMs (no raw HTML, no embedded scripts).

## `publish [-m msg]`

Pipeline: `validate` → `git add -A` → `git commit -m <msg>` → `git push`.

**PREREQUISITE:** run `beautify` first. `publish` does NOT format — only validates. Skipping `beautify` is the single most common cause of wiki drift in multi-session workflows.

- Blocks on any validation failure.
- Scans staged content for secret patterns before commit (aborts on hit).
- Default commit message: `docs(wiki): update <page-names>`.
- Plain push — never `--force`.

## `audit`

Alias for `validate --verbose`. Intended for CI runs and pre-release checks — produces a full report regardless of pass/fail state.

## Environment

| Var | Purpose |
|---|---|
| `OMG_WIKI_DIR` | Override wiki clone path (default `.wiki/`) |
| `OMG_WIKI_VERBOSE=1` | Verbose script output |
