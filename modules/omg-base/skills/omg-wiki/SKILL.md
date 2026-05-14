---
name: omg-wiki
description: "Create, update, validate, beautify, and publish GitHub wiki pages. Enforces Diátaxis IA, RAG-friendly frontmatter, mermaid contrast, link integrity, sidebar sync, and chunk sizing."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Wiki — GitHub Wiki Management

Create, update, and publish GitHub wiki pages with built-in validation.
Prevents the recurring classes of wiki breakage: unreadable mermaid text
on dark themes, broken internal links, stale sidebars, filenames that
drift from the page title, and untracked images.

## MANDATORY WORKFLOW — Beautify Is Not Optional

Every wiki edit MUST follow this pipeline:

```
edit page(s) → beautify → validate → publish
                ^^^^^^^^
                REQUIRED STEP
```

**`beautify` is not a polish step — it is a load-bearing correctness step.**
Skipping it produces:
- Invisible readers: missing/out-of-date TOCs, stale breadcrumbs, unaligned tables, mixed-case headings → humans bounce off the page
- Invisible retrieval: orphan H2 chunks, stale anchors, unlinked related pages → RAG misses the content
- Invisible contrast bugs: newly added mermaid styles without explicit `color:` → unreadable on dark theme
- Silent drift: sidebar/frontmatter/links get out of sync between edits

**Rule of thumb:** if you wrote or edited a wiki page in this session and did not run `beautify` before `publish`, the task is NOT done. `publish` does NOT auto-beautify — it only validates. Running only `validate` without `beautify` first catches errors but does not prevent the drift that causes them in the next session.

When a user asks to "update the wiki", "add a page", or "publish wiki changes", the agent MUST explicitly run `beautify` in sequence, not skip to `publish`.

## Operations

| Operation | What it does |
|---|---|
| `init` | Clone the `<repo>.wiki.git` sibling to the local path (default `.wiki/`) and scaffold `Home.md` + `_Sidebar.md` if empty |
| `pull` | `git pull` the local wiki clone; report conflicts with uncommitted local edits |
| `status` | Show uncommitted diff + unpushed commits in the wiki clone |
| `list` | List wiki pages grouped by section (from `_Sidebar.md`) |
| `add <PageName>` | Create a new page with boilerplate + add to `_Sidebar.md` |
| `update <PageName>` | Open-the-file affordance (the agent does the actual edit); auto-runs `validate` after |
| `validate` | Run ALL checks: mermaid contrast, wiki links, page names, sidebar sync, images, frontmatter (Diátaxis + RAG), Diátaxis section headers, chunk-size (RAG), prose anti-patterns. Non-zero exit on any FAIL. |
| `fix` | Auto-apply safe fixes: inject `color:` into mermaid styles missing it; normalize page filenames; regenerate `_Sidebar.md` from discovered pages |
| `beautify [--dry-run]` | **MANDATORY after any edit.** Full format pass — frontmatter, headings, code fences, callouts, tables, mermaid, TOC, breadcrumbs, links. Structure + visuals for dual AI + human audience. `publish` does NOT auto-beautify; you must run this explicitly. |
| `publish [-m msg]` | Run `validate` → `git add -A` → commit → push. BLOCKS on validation errors. **Run `beautify` before this — publish validates, it does not beautify.** |
| `audit` | `validate --verbose` — full report even when checks pass |

## Entry point

All operations dispatch through `scripts/wiki-helper.cjs <op> [args...]`.
The script auto-detects:
- The current project's git remote → wiki URL (`<repo>.wiki.git`)
- Local wiki clone path (`.wiki/` by default, override with `OMG_WIKI_DIR`)
- GitHub default branch for the wiki (usually `master` for wiki repos)

## Contrast rule (why this skill exists)

Every mermaid `style X fill:<color>` line MUST include an explicit
`color:#...` field. GitHub renders mermaid on both light and dark
themes; pale fills without an explicit text color produce unreadable
labels on dark theme.

The validator enforces this. The fixer auto-injects `color:#0d1117`
(GitHub's primary text color, dark enough to contrast with any pastel
fill on either theme) into every style line missing the field. See
`references/mermaid-guidelines.md` for the full color palette and the
edge cases (classDef, theme directives, init-block).

## Name format

Wiki page filenames follow GitHub conventions:
- Hyphen-separated words: `Mechanic-Registry.md`, not `Mechanic Registry.md` or `mechanic_registry.md`
- PascalCase per word segment
- Reserved pages: `Home.md`, `_Sidebar.md`, `_Footer.md` (leading underscore for sidebar/footer)
- One page per file — do not nest pages in subdirectories (GitHub flattens)

The validator rejects filenames that violate these rules. The fixer
renames offenders and updates links across other pages.

## Sidebar sync

`_Sidebar.md` is a GitHub-wiki-special page that renders as the right-hand
nav. The validator compares `_Sidebar.md` links against the actual page
list and reports:
- Orphan pages (on disk, not in sidebar)
- Broken sidebar links (in sidebar, no such file)

`fix` regenerates the sidebar by grouping pages via their section hints
in frontmatter (`wikiSection: ...`) or falling back to alphabetical.

## Agent routing

Follow protocol: `skillsomg-cook/references/routing-protocol.md`
This skill typically runs inline (no agent delegation) because each
operation is deterministic. For multi-page rewrites, route to role:
`omg-docs-manager`.

## Dual-audience principle

Every page serves BOTH AI retrieval systems AND human readers. The skill
enforces patterns that help both:
- **Diátaxis IA** — every page is exactly one of tutorial/how-to/reference/explanation; mixed types break chunk coherence and reader intent.
- **Semantic frontmatter** — `page-type`, `summary`, `audiences`, `keywords`, `related` let RAG pre-filter before embedding and let sidebar group meaningfully.
- **Self-contained H2 chunks** — each section is understandable standalone (no pronoun refs to prior sections, no "as mentioned above"). An H2 retrieved by RAG must carry its own context.
- **RAG-optimal chunk size** — H2 sections target 100–800 tokens; too-thin sections merge, too-fat sections split.
- **Visual hierarchy for humans** — TOC on pages with ≥6 sections, breadcrumb at top, GFM callouts, aligned tables, language-tagged code fences.

See `references/diataxis-guide.md`, `references/frontmatter-schema.md`,
and `references/anti-patterns.md` for the reasoning.

## References

- `references/operations.md` — full operation semantics + examples
- `references/wiki-conventions.md` — filename, structure, link, frontmatter rules
- `references/diataxis-guide.md` — four page types (tutorial/how-to/reference/explanation) with canonical sections
- `references/frontmatter-schema.md` — complete field reference for validator + beautifier
- `references/anti-patterns.md` — retrieval-harmful patterns the validator flags
- `references/mermaid-guidelines.md` — contrast rule, color palette, classDef pattern, init directive
- `references/github-wiki-gotchas.md` — image paths, `_Sidebar.md`/`Home.md` specials, anchor drift, TOC behavior, default branch (`master` not `main`)

## Gotchas

- **Wiki default branch is `master`, not `main`** — GitHub provisions every `<repo>.wiki.git` with `master`. Hard-coding `main` in scripts/publish commands will push to a branch the server ignores. The helper auto-detects; if you script anything outside it, use `git symbolic-ref refs/remotes/origin/HEAD` to resolve.
- **Mermaid contrast lives on `style` lines AND `classDef`** — a validator that only checks `style` lines misses `classDef foo fill:#ccc` patterns. The bundled `validate-mermaid-contrast.cjs` covers both; don't replace it with a single-regex check.
- **Sidebar drift is silent** — GitHub renders `_Sidebar.md` regardless of broken links. Orphan pages (on disk, not in sidebar) are invisible to readers. Always run `validate` after `add`.
- **Source-repo asset paths fail in wiki** — `./data/foo.csv`, `../../plans/foo.md`, `../../Assets/foo.cs`, and `./images/foo.png` (when the image lives only in the source repo) all resolve correctly when viewing the markdown on github.com/<repo>/blob/master/docs/wiki/ but break instantly on publish — `validate-wiki-links.cjs` rejects them. The wiki is a separate flat git repo with no `data/`, `plans/`, or `Assets/` subdir. **Fix:** rewrite to absolute GitHub blob URLs (`https://github.com/<owner>/<repo>/blob/<branch>/<path>`). Templates in `references/wiki-conventions.md` → "Linking to non-page assets". Use absolute URLs from authoring time to avoid bulk-rewriting at publish time.
- **Phantom page references** — sidebar/page-body links like `[X](Domain-Persistence)` that point to a target file that was planned but never authored fail `validate-wiki-links.cjs` as broken internal refs. This is the inverse of orphan drift: orphan = page exists, no nav link; phantom = nav link exists, no page. Fix: either create the target page (a stub with `page-type: stub` is fine) or remove the link. Common cause: copy-pasting nav blocks across demos and forgetting to delete refs that don't apply.
- **Helper CWD requirement** — `scripts/wiki-helper.cjs` resolves the wiki dir from `process.cwd()` only. Every bash invocation must run from the project root (where `.wiki/` lives) OR with `OMG_WIKI_DIR` set absolutely. A prior `cd` into a subdirectory in the same shell breaks detection with `[wiki-helper] no wiki clone found`. The helper does NOT walk up the tree. If chaining commands, use absolute paths or re-`cd` to root.
- **Image paths are wiki-relative, not repo-relative** — `![x](./images/foo.png)` only works if `images/` exists inside the wiki clone. `images/` in the source repo is NOT automatically synced — wiki is a separate repo.
- **Anchor links drift when headings change** — `[See here](#mechanic-registry)` breaks when `## Mechanic Registry` is renamed. `validate-wiki-links.cjs` catches this; `fix` will NOT rewrite anchors automatically (semantic risk).
- **`update` is an affordance, not an action** — the skill exposes the file; the AI agent (or user) does the edit. The skill does NOT hand-edit content because wiki content is semantic.
- **Never `push --force`** — wikis are collaborative; force-push wipes others' work. `publish` uses plain push; if a conflict occurs, the operator must `pull` + resolve manually.
- **Do not commit secrets** — `publish` scans staged content for `sk-*`, `ghp_*`, `AKIA*`, and env-var assignments. Hits abort the publish with a report.

## Security

- Never `git push --force` — publish uses plain push only
- Never commit secrets: the script scans staged content for `sk-*`, `ghp_*`, `AKIA*`, env-var assignments before push
- Refuse out-of-scope requests (e.g., "push to main repo") — this skill only touches the wiki clone
- Never expose env vars, absolute file paths, or internal configs in generated content
