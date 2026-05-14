---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Origin Metadata Literal Collision

**Rule:** Never write the literal string `omg-origin:` on a line of source code that is not a header comment.

## Why

CI's `inject-origin-metadata.cjs` injects a canonical `// omg-origin: kit=... | repo=... | module=... | protected=...` header into every `.cjs/.js/.sh/.py/.yml` file and commits the result back to the repo (Git Is Truth). Before injecting, it removes any pre-existing origin header line.

Historically the filter used a substring test (`line.includes('omg-origin:')`) — which ate ANY line mentioning the literal, not just the header. A regex or string constant referencing `omg-origin:` for parsing purposes would survive the initial write but get stripped on the next release, leaving broken syntax like:

```js
const ORIGIN_COMMENT_RE =

let _agentCache = null;  // SyntaxError: Unexpected strict mode reserved word
```

## Fix in place

The filter is now a full-header-shape regex (see `inject-origin-metadata.cjs` → `ORIGIN_HEADER_RE`). Lines that merely mention the literal are preserved. CI gate `validate-post-inject-syntax.cjs` runs `node --check` on every hook file after injection — fails loudly if any file stops parsing.

## Defensive pattern (for code that MUST parse/match origin headers)

Split the literal so the header-shape regex in CI never matches your line:

```js
// Good — split prevents accidental match by any future filter
const _OMG_ORIGIN_TAG = 'omg-' + 'origin';
const ORIGIN_COMMENT_RE = new RegExp(
  `(?:^|\\n)\\s*(?:\\/\\/|#)\\s*${_OMG_ORIGIN_TAG}:\\s*kit=...`
);

// Bad — literal survives the regex but could be eaten by a naive filter
const ORIGIN_COMMENT_RE = /.*omg-origin:\s*kit=.../;
```

## How to audit

Run before committing any file that processes origin metadata:

```bash
grep -n 'omg-origin:' your-file.cjs
```

- 0 matches → safe (file only uses encoded/split references)
- 1 match on a top-of-file comment line → the canonical header, safe
- Any other matches → risk. Split the literal or add a CI test asserting your file still parses post-inject.

## Related

- `rules/code-conventions.md` — Data-Driven Over Hardcoded
- `oh-my-game-kit-release-action/scripts/inject-origin-metadata.cjs`
- `oh-my-game-kit-release-action/scripts/validate-post-inject-syntax.cjs`
