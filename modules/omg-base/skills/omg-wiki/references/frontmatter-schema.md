---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Frontmatter Schema

Every non-reserved wiki page carries YAML frontmatter. Fields drive
retrieval (AI), navigation (sidebar), and validation (blocking vs.
warning). `_Sidebar.md` and `_Footer.md` are exempt.

## Required fields

```yaml
---
title: "Mechanic Registry"
page-type: reference
summary: "Indexed catalog of reusable game mechanics with versioned metadata."
audiences: [ai, human]
wikiSection: "Platform"
---
```

### `title`

String. Display name for the page. Used by:
- `beautify-headings.cjs` to synchronize the H1 text
- `sync-sidebar.cjs` for the link text in the sidebar
- `beautify-breadcrumbs.cjs` for the breadcrumb tail

Default: filename with hyphens turned into spaces.

### `page-type`

Enum: `tutorial` | `how-to` | `reference` | `explanation`. Drives
section-header validation (see `diataxis-guide.md`). Required — the
validator fails a page without this field.

### `summary`

String, ≤ 200 characters. One-sentence description of the page. Used by:
- RAG retrieval systems to decide relevance before embedding
- `sync-sidebar.cjs` (optionally) as tooltip text
- `omg-find-skill` and similar discovery tools

Warning (not blocking) at > 200 chars — shorter summaries weight higher
in most retrieval systems.

### `audiences`

List of tags; non-empty. Known values:
- `ai`, `ai-agent` — AI consumers (RAG, MCP-served lookups)
- `human`, `human-engineer`, `human-designer`, `human-pm` — human readers by role
- `gamedev-artist` — specialist role
- `maintainer`, `contributor` — docs/code governance

Drives:
- RAG filtering ("only show `audiences: [ai]` when the agent queries for narrow facts")
- Human curation (sidebar filters by role)

Unknown tags produce a warning, not a failure — custom tags are allowed
but should be added to the KNOWN list in `validate-frontmatter.cjs`.

### `wikiSection`

String. Groups pages in the sidebar. Drives:
- `sync-sidebar.cjs` — pages with the same `wikiSection` form a group
- `beautify-breadcrumbs.cjs` — the middle crumb (`Home › <section> › <page>`)

Default when missing: "Uncategorized" (warns, doesn't fail).

## Optional fields

### `keywords`

List, ≤ 8 items. Additional terms for retrieval beyond what `title` and
`summary` already carry.

**Don't:** use keywords to repeat words from the title.
**Do:** include synonyms, acronyms, and domain terms: `[PLA, playable ad, Cocos 3.8.7]`.

Lists > 8 entries warn — over-tagging dilutes the relevance signal.

### `related`

List of page names (without `.md`, hyphenated form). Every entry must
resolve to an existing wiki page (validator fails otherwise). Drives:
- Graph-based RAG retrieval: "user asked about A, and A lists B as related, so B is likely relevant too"
- "See also" section rendering (optional beautifier pass)

```yaml
related:
  - Game-Modules
  - Phase-0-Audit
  - Variant-Generator
```

### `lastUpdated`

ISO date `YYYY-MM-DD`. Non-ISO formats warn. `beautify-frontmatter.cjs`
auto-populates this on any page it touches — so drift between "when
this page was last edited" and `lastUpdated` is at most one beautify
pass behind.

### `status`

Enum (optional): `draft` | `published` | `deprecated`. Purely
informational today. Future: `sync-sidebar.cjs` could hide `draft`
pages from the sidebar.

### `owner`

String. GitHub username or team slug of the page's editorial owner.
Purely informational — no validator check.

## Field-order convention

Beautifier writes fields in this order (enforced by re-rendering):

1. `title`
2. `page-type`
3. `summary`
4. `audiences`
5. `wikiSection`
6. `keywords`
7. `related`
8. `lastUpdated`
9. `status`
10. `owner`
11. *(any custom fields — preserved, not reordered)*

Manual out-of-order values are accepted on read but reformatted on the
next beautify pass.

## Example: fully-populated page

```yaml
---
title: "Variant Generator"
page-type: reference
summary: "Derives ad variants from a canonical PLA template by composing deltas."
audiences: [ai, human-engineer, gamedev-artist]
wikiSection: "Generation Pipeline"
keywords: [PLA, variant, delta, Cocos, template]
related:
  - Template-Scaffolder
  - Existing-Ecosystem
  - Game-Modules
lastUpdated: 2026-04-22
status: published
owner: the1studio/platform
---
```

## Parser note

The in-skill parser (`validate-frontmatter.cjs` → `parseFrontmatter`)
supports scalars, flow lists (`[a, b]`), and block lists (`- a` on
their own line). It does NOT support:
- Nested objects (`owner: { team: foo }` — write as `owner: foo-team`)
- Multi-line strings with `|` or `>` (inline everything)
- Anchors & aliases (`&x` / `*x`)

For anything richer than the above, add the field to a sibling JSON
file and reference it from the body — frontmatter is not a DB.
