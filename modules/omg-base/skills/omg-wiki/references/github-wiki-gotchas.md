---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# GitHub Wiki Gotchas

Surprising behaviors of the GitHub wiki system that break assumptions ported from regular Markdown or from other wiki platforms.

## Default branch is `master`, not `main`

Every `<repo>.wiki.git` repo provisions with `master` as the default branch. This is hard-coded by GitHub and not configurable per-repo. Scripts that assume `main` will:
- Push to a branch GitHub ignores (silent data loss)
- Fail on `git switch main` (branch doesn't exist)

**Fix:** always resolve the default branch at runtime:
```bash
git -C .wiki symbolic-ref refs/remotes/origin/HEAD | sed 's@^refs/remotes/origin/@@'
```
or trust the helper's auto-detect.

## Wiki repo doesn't exist until first page

A fresh repo has no `<repo>.wiki.git` endpoint until someone creates at least one page via the GitHub UI OR via the REST API:

```
PUT /repos/{owner}/{repo}/wiki
```

Cloning before that returns `repository not found`. `init` handles this with a clear error. Do NOT assume the wiki always exists.

## Subdirectories get flattened

GitHub stores all wiki pages at the repo root regardless of filesystem structure. `mechanics/Boss.md` renders as `Boss` at the URL `<repo>/wiki/Boss`, and a second `npc/Boss.md` would COLLIDE.

Rule: one page = one file at the root. Use `-` hyphenation to fake sections.

## `_Sidebar.md` is special

Files starting with `_` are "special" in GitHub wiki:
- `_Sidebar.md` renders as the right-hand nav on every page
- `_Footer.md` renders at the bottom of every page
- `_Header.md` — does NOT exist (common misconception)

No other underscore-prefixed files are meaningful. The validator warns on unknown underscore-prefixed filenames.

## Anchors are lossy

GitHub generates anchors from headings by:
1. Lowercasing
2. Replacing spaces with hyphens
3. Stripping non-alphanumeric characters (except hyphens and some extended)

`## Section: Overview` → `#section-overview`
`## FAQ & Troubleshooting` → `#faq--troubleshooting` (note double hyphen)

Edge cases:
- Multiple identical headings get `-1`, `-2` suffixes
- Unicode is passed through (most of the time)
- Emoji in headings generate unpredictable anchors — avoid

`validate-wiki-links.cjs` resolves anchors correctly per GitHub's algorithm.

## Images are NOT repo-relative

A page referencing `![x](./images/foo.png)` resolves against the wiki clone, NOT the source repo. Two consequences:
1. Images from the source repo's `docs/images/` are NOT accessible from wiki pages.
2. To use an image in both, copy it into the wiki clone's `images/` dir separately.

`validate-images.cjs` flags unresolved references.

## Source-repo asset paths don't resolve in wiki

This is the broader form of the image gotcha and the most common publish-time failure. Any link target with a relative path that escapes the wiki dir or refers to a subdirectory the wiki clone doesn't have will fail validation.

Failing forms (all real examples seen in `validate-wiki-links.cjs` output):
- `./data/backpack-crawler/items.csv` — `data/` subdir doesn't exist in the wiki clone
- `./data/foo.json`, `./data/MANIFEST.md` — same
- `../../plans/reports/<file>.md` — escapes wiki dir entirely
- `../../Assets/Demos/Foo/Bar.cs` — escapes wiki dir; source code lives in the parent repo

Why authors hit this: in the source repo `docs/wiki/<page>.md` these relative paths resolve correctly when viewing the markdown on github.com/<repo>/blob/master/docs/wiki/. The author writes the link, the source-side render works, the link looks fine. The breakage is invisible until `publish` runs `validate-wiki-links.cjs` — by then the content is already authored and the fix is bulk-rewriting.

**Canonical fix:** rewrite source-repo asset references to absolute GitHub blob URLs. These work in BOTH the source-render view AND the published wiki page.

```
[items CSV](https://github.com/<owner>/<repo>/blob/<branch>/<path-from-repo-root>)
```

Real example:
```
[items.csv](https://github.com/The1Studio/DOTS-AI/blob/master/docs/wiki/data/backpack-crawler/items.csv)
[plan](https://github.com/The1Studio/DOTS-AI/blob/master/plans/reports/260429-foo.md)
[source](https://github.com/The1Studio/DOTS-AI/blob/master/Assets/Demos/Foo/Bar.cs)
```

For images that must appear in both views, copy the file into the wiki clone's `images/` dir AND keep the source copy — `images/` IS gitignored from the parent repo's perspective but tracked in the wiki repo separately.

See also `wiki-conventions.md` → "Linking to non-page assets" for the full link-form decision table.

## TOC rendering

GitHub's auto-TOC feature for wiki pages is limited:
- Only H2 and H3 are included
- Maximum depth 3 levels
- Custom TOCs written in page content (e.g., from `beautify-toc.cjs`) render as plain links, not collapsible sections

Do not rely on the auto-TOC — write explicit TOCs for pages larger than ~500 lines.

## History is per-file, not atomic

Git history on the wiki repo tracks each file independently. A multi-page refactor (e.g., renaming 5 pages) shows up as 5 separate commits, NOT one atomic unit. This is fine for diffs but makes `git revert` on a refactor painful — keep refactors small or use `git revert <range>`.

## Search is indexed separately

GitHub's wiki search is a separate index from code search. It can lag the repo state by up to a few minutes after a push. Don't assume `publish` means "immediately discoverable via search."

## Clone URL vs web URL

- Clone: `git@github.com:<owner>/<repo>.wiki.git` (SSH) or `https://github.com/<owner>/<repo>.wiki.git` (HTTPS)
- Web: `https://github.com/<owner>/<repo>/wiki`

Do NOT confuse them. `init` auto-resolves clone URL from the source repo's `origin`.

## Force-push is destructive and unrecoverable

`git push --force` on the wiki repo wipes any commits not in your local branch. GitHub does NOT keep a reflog for wiki repos (unlike regular code repos with `git reflog`). If you force-push over someone else's work, it's gone.

`publish` intentionally uses plain push and reports conflict errors. Never add `--force`.

## Phantom page references

The inverse of orphan drift. An orphan = page on disk, missing from `_Sidebar.md`. A phantom = link target referenced from sidebar or another page body, but the target file was never authored.

Real examples seen on this project:
- `Demo-Survivor.md` linking to `Demo-Survivor-Backpack.md` — page never created
- `Demo-WaterSortDemo.md` linking to `Puzzle-Scoring.md` — page never created
- `Demo-BattleDemo2D.md` linking to `Domain-Persistence.md` — page never created

Common cause: copy-pasting a nav block across demos / domains and forgetting to remove refs that don't apply to the current page; or planning a page in a section header but never authoring the body.

**Fix options:**
1. **Create a stub page** — author `Page-Name.md` with frontmatter `page-type: stub` and a one-paragraph "Coming soon — see [Related-Page] for now" body. Validates clean, gives readers a landing surface, and can be filled in later.
2. **Remove the link** — change `[X](Domain-Persistence)` to plain text `X` (no link), or delete the bullet entirely.
3. **Re-target the link** — change to a real existing page that covers the topic.

Option 2 is the right call when the planned page was abandoned; option 1 when it's still on the roadmap; option 3 when the topic was absorbed into a sibling page.

`validate-wiki-links.cjs` flags these. The fixer does NOT auto-create stubs (semantic risk) — operator must choose.

## What NOT to do

- Do not assume the wiki exists before the first page creation
- Do not assume `main` is the default branch
- Do not nest pages in subdirectories
- Do not reference source-repo assets via relative paths — `./data/foo.csv`, `../../plans/foo.md`, `../../Assets/foo.cs`, `../images/foo.png` all fail validation. Use absolute GitHub blob URLs instead. See "Source-repo asset paths don't resolve in wiki" above.
- Do not rely on GitHub's auto-TOC for large pages
- Do not `push --force`
- Do not hand-write `_Header.md` (does nothing)
- Do not embed scripts or iframes (GitHub strips them)
- Do not invoke `scripts/wiki-helper.cjs` from a subdirectory — it resolves `.wiki/` from `process.cwd()` and does NOT walk up. Run from project root or set `OMG_WIKI_DIR` absolutely.
