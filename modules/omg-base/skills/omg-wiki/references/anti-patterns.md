---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Anti-Patterns — What Not to Write

Patterns that degrade retrieval (AI) or scanning (human). Validator
`validate-anti-patterns.cjs` flags these as warnings. Fixes are
manual — rewriting prose is semantic and the skill refuses to guess.

## 1. Ambiguous back-references

**Problem:** "As mentioned above…", "See the previous section…", "Per the diagram earlier…"

**Why it breaks:** when a RAG system retrieves a single H2 chunk, it
does NOT retrieve the section the back-reference points to. The reader
(AI or human scrolling to a deep link) has no way to resolve what
"above" refers to.

**Fix:** name the target explicitly.

| Bad | Good |
|---|---|
| "As mentioned above, the registry is versioned." | "As described in §Versioning, the registry is versioned." |
| "See above for the schema." | "See [Mechanic-Registry#Schema](Mechanic-Registry#schema)." |

## 2. Pronoun-first sentences after H2

**Problem:** Every section starts with "It…", "This…", "That…":
```markdown
## The Mechanic Registry

It's a JSON-backed store that tracks…
```

**Why it breaks:** an H2 chunk retrieved without the page title loses
the antecedent. "It's a JSON-backed store" is gibberish on its own.

**Fix:** name the subject in the first sentence.

```markdown
## The Mechanic Registry

The Mechanic Registry is a JSON-backed store that tracks…
```

This also helps humans who deep-link to a section from search.

## 3. Non-self-contained H2 headings

**Problem:** `## Overview`, `## Introduction`, `## Details`, `## Summary`,
`## Notes`, `## Background`

**Why it breaks:** H2 text IS the chunk label in most RAG systems. A
chunk labeled "Overview" provides zero signal about the topic. Worse,
embeddings of `## Overview` across many pages cluster together,
dragging unrelated content into the same neighborhood.

**Fix:** prefix with the page's topic.

| Bad | Good |
|---|---|
| `## Overview` | `## Mechanic-Registry Overview` |
| `## Introduction` | `## Introduction to Variant Generation` |

Exception: on very short pages (< 3 H2s), repetition can feel
verbose — consider flattening to a single H1 + prose instead.

## 4. Implicit cross-page references

**Problem:** "[See Mechanic Registry](Mechanic-Registry)" without a
section anchor, when the intended target is a specific subsection.

**Why it breaks:** an AI following the link has to read the ENTIRE
target page, then decide which section is relevant. A link with an
anchor lands on the exact chunk.

**Fix:** always include the anchor when pointing at a subsection.

```markdown
See [Mechanic-Registry#Constraints](Mechanic-Registry#constraints) for
the size limits.
```

## 5. Mermaid `%%{init: {theme: dark/forest/…}}%%` overrides

**Problem:** per-diagram theme override that conflicts with the
opposite GitHub theme.

**Why it breaks:** GitHub's wiki renders mermaid with the viewer's
active theme. A `theme: dark` override makes the diagram unreadable on
light theme, and vice versa.

**Fix:** use explicit per-shape `color:` (see `mermaid-guidelines.md`).

`beautify-mermaid.cjs` strips these overrides automatically.

## 6. Code fences without a language tag

**Problem:** ```` ``` ```` followed by code without a language hint.

**Why it breaks:**
- No syntax highlighting for humans
- AI loses a strong signal about what kind of code it's looking at
- GitHub's search can't indexed language-typed snippets

**Fix:** always tag. Use `text` for free-form content (e.g., console
output) that isn't any particular language.

`beautify-code-fences.cjs` infers the tag when possible.

## 7. Single-term synonym drift

**Problem:** "variant generation" on one page, "ad variant creation"
on another, "variant pipeline" on a third — all referring to the same
thing.

**Why it breaks:** embeddings treat these as distinct concepts.
Retrieval for "variant pipeline" will miss the "variant generation"
page. Humans also search-by-term and give up when they hit the wrong
phrase.

**Fix:** pick one canonical phrase per concept. Record non-canonical
variants in a `Glossary.md` page with `canonical: <phrase>` notes.

This skill does NOT yet ship a glossary validator — flagged as a
future enhancement.

## 8. Raw HTML

**Problem:** `<div class="foo">…</div>`, `<script>`, `<iframe>`, custom
tags, inline styles.

**Why it breaks:** GitHub's wiki sanitizer strips most HTML silently.
What survives (basic tags, some attributes) renders inconsistently
across light/dark themes and doesn't export well to other markdown
renderers.

**Fix:** use markdown equivalents. Layout that requires HTML isn't
wiki-friendly — move it to a rendered docs site.

## 9. Tables as layout

**Problem:** using a 1-row × 2-column table to put two blocks of text
side-by-side.

**Why it breaks:** markdown tables are for tabular data. AI tokenizers
treat pipes as column separators — text inside a layout-table gets
split unnaturally. Mobile renderers often collapse the table.

**Fix:** just use paragraphs. If side-by-side is critical, use an
image or mermaid diagram.

## 10. Hidden-context callouts

**Problem:**
```markdown
> [!NOTE]
> See the comment in the code for details.
```

**Why it breaks:** "the code" could be anywhere. An AI that retrieves
this callout has no way to find what "the code" refers to; a human
deep-linking has the same problem.

**Fix:** include the reference inline.

```markdown
> [!NOTE]
> See the comment at `src/registry.ts:42` for details.
```

## Summary — one rule to catch them all

Every H2 section should be understandable when retrieved **alone**,
without the rest of the page loaded. If removing the page's other
sections makes the chunk nonsensical, rewrite the chunk to carry its
own context.
