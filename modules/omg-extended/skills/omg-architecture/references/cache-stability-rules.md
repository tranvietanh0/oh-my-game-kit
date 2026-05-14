---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Prompt Cache Stability Rules

The single highest-leverage architectural concern in any LLM agent. Get this wrong and your fleet costs 5-10× more for no observable reason. Get it right and you collect a 90% discount on input tokens.

This reference is concrete, actionable, and testable.

---

## The mental model

Anthropic's prompt cache is **exact-prefix**:
- Hashes the request prefix byte-by-byte.
- One mid-prefix token change kills everything after.
- "Similar" or "semantically equivalent" doesn't count.

Three tiers:
- **Ephemeral** (~5 min TTL, default).
- **1-hour TTL** (available via cache_control parameter with 2x write-token multiplier vs 1.25x for 5-min; cache reads cost 0.1x base input).
- **Workspace-level isolation** (as of February 5, 2026, cache is isolated by workspace within an organization, not org-wide).

The system prompt is structured as `[...static, BOUNDARY, ...dynamic]` with an explicit boundary marker. Pre-boundary = top-tier global cache (shared across users on same Codex version). Post-boundary = per-session.

---

## Rule 1 — No runtime conditionals before the boundary

**The 2^N hash explosion.** Every runtime conditional placed before the boundary doubles the number of unique Blake2b prefix hashes the server caches. Three booleans = 8 cache variants. Five = 32. Violating this silently fragments the entire fleet's cache.

**Compile-time flags resolved by the bundler are fine.** Runtime branches must go after the boundary.

**Test:** if your `system_prompt` array changes content based on user state/feature flags before the BOUNDARY index, you're violating this rule.

---

## Rule 2 — Name cache-busting helpers `DANGEROUS_*`

```ts
systemPromptSection(text)                              // safe, cached
DANGEROUS_uncachedSystemPromptSection(text, _reason)   // explicitly busts cache
```

The `_reason` parameter is **mandatory in source even though ignored at runtime.** This forces every developer to document why this section can't be cached — which means review can challenge it.

**Test:** `grep DANGEROUS_ src/` should find every cache-busting site. If you find unnamed busters, rename immediately.

---

## Rule 3 — Sort tools built-ins-first, MCP-suffix

```
[built-in-A, built-in-B, ..., built-in-Z, mcp-tool-A, ..., mcp-tool-Z]
```

Each partition sorted alphabetically. The API server places a cache breakpoint **after the last built-in**. A flat sort would interleave MCP tools and shift positions on every plugin install.

**Test:** install or uninstall any MCP server. The position of every built-in tool in the array MUST stay identical. If positions shift, you're sorting wrong.

---

## Rule 4 — Sticky latches for any UI feature toggle that affects HTTP headers

5 sticky latches in Codex:
- `afkModeHeaderLatched`
- `fastModeHeaderLatched`
- `cacheEditingHeaderLatched`
- `thinkingClearLatched`
- `pendingPostCompaction`

Type: `boolean | null`. States:
- `null` — uninitialized, not yet evaluated.
- `true` — latched permanently for the session.
- (Never returns to `false`.)

```ts
if (latched === true) return true              // already latched
if (featureCurrentlyActive) {
  setLatched(true)                              // latch and stay
  return true
}
return false                                    // not active, not latched
```

**Why.** Toggle a header bit live = cache miss every toggle. With 50,000+ token system prompts, this is genuinely expensive. The latch sacrifices mid-session toggling to preserve the warmed cache.

**Test:** any feature toggle the user can flip mid-session that affects request shape MUST have a latch. Otherwise it's a cache bomb.

---

## Rule 5 — Memoize date-stamps and context builders

```ts
const getSessionStartDate = memoize(getLocalISODate)   // single most cost-efficient line
const getGitStatus        = memoize(...)
const getUserContext      = memoize(...)
```

**No TTL.** Re-computing busts cache. Stale date is cosmetic; cache-bust reprocesses the entire conversation.

**The system prompt explicitly tells the model:** "this status is a snapshot in time at conversation start." This is honest about staleness — and it's the right tradeoff.

**Section memoization is two-tier.** Most content uses `systemPromptSection(name, compute)` — cached until `/clear` or `/compact`. Cache-busting helper is the nuclear option (`DANGEROUS_uncachedSystemPromptSection`); the naming is the entire review-time signal.

**Test:** any function call inside system-prompt construction that returns time-varying data must be memoized.

---

## Rule 6 — Use long-lived caches to break circular dependencies

Codex caches AGENTS.md content in bootstrap state (DAG leaf) because:
- Auto-mode classifier needs AGENTS.md content.
- AGENTS.md loading goes through filesystem.
- Filesystem ops go through permissions.
- Permissions call the classifier.

Without the cache, the cycle is fatal. With the cache, it breaks at the leaf.

**Test:** if any prompt-building dependency calls back into the system being built (classifier, memory, permissions), cache it once at startup.

---

## Rule 7 — Move dynamic agent lists to attachments, not tool descriptions

Internal Codex data: **~10.2% of fleet `cache_creation` tokens** were attributable to dynamic tool descriptions.

The fix: dynamic agent lists are an *attachment message*, NOT in the tool description. Moving them to attachments preserves the prompt cache prefix when MCPs/plugins load.

**Test:** is your tool description string deterministic across sessions on the same version? If `JSON.stringify(toolDefinitions)` differs based on plugins/agents installed, you have cache fragmentation.

---

## Rule 8 — Defer heavy MCP tool schemas

Tools with `shouldDefer: true` send only **name + description** to the API. The model must call `ToolSearchTool` to load the schema before use.

**Why this wins on cache stability.** Adding/removing a deferred MCP tool changes the prompt by tokens (just the name+description), not hundreds (full schema).

**Cost.** Calling a deferred tool without first loading its schema → all params arrive as strings → Zod fails → recovery hint appended ("call ToolSearchTool first").

**Test:** if your tool roster changes frequently and each tool's schema is hundreds of tokens, defer them.

---

## Rule 9 — Fork the prompt cache, don't refresh it

For parallel sub-agents, freeze three layers:

1. **System prompt threaded as bytes.** Parent's already-rendered prompt → `override.systemPrompt`. Agent's `getSystemPrompt()` is **never invoked** — preventing re-renders that could diverge if GrowthBook flags transition cold→warm between calls.

2. **Tool array passed exactly through.** `useExactTools: true` short-circuits filtering. Even tools the child can't use stay in the array.

3. **Constant placeholder result for parent `tool_use` blocks.** `'Fork started -- processing in background'` — byte-identical across children, regardless of what those tools actually did.

**Concrete economics:**
- 48,500-token prefix, 200-token directive, 5 children.
- Without fork: 5× full input.
- With fork: 1× full + 4× cached@10%.
- **~90% reduction on the 4 siblings.**

**Test:** capture two parallel children's API requests. Diff them byte-by-byte. The diff should start exactly at the per-child directive — not before.

---

## Rule 10 — Disable global cache scope when MCP tools are present

Global cache scope shares prompt-cache hits across users on the same Codex version. **Disabled when MCP tools present** because MCP tool definitions are user-specific and would explode the global key space.

**Practical implication:** adding any MCP tool to your config measurably degrades cache economics. Worth surfacing this in user-facing docs.

---

## Anti-patterns (review checklist)

| Pattern | Cost | Fix |
|---|---|---|
| `if (user.hasFeatureX) { systemPrompt += "..." }` before boundary | Doubles cache variants | Move conditional content to post-boundary |
| `getCurrentTime()` in system prompt | Cache miss every minute | Memoize at session start |
| Tool array sorted by user preference | Cache miss on every reorder | Built-ins prefix + MCP suffix; deterministic order |
| Feature toggle UI that flips header bit live | Cache miss per toggle | Sticky latch |
| Fork child re-renders system prompt | Divergence on flag transitions | `override.systemPrompt` from parent's rendered bytes |
| Fork child filters tool array | Cache-busting reorder | `useExactTools: true` |
| Mutable placeholder result per child | Bytes differ | Constant placeholder string |
| Dynamic tool list in tool description | 10.2% `cache_creation` tax | Move to attachment message |
| Heavy MCP schemas always sent | Token bloat per session | `shouldDefer: true` + `ToolSearchTool` |
| `addCustomization()` helper bypasses cache | No review-time signal | Rename `DANGEROUS_*`, require `_reason` |
| Re-render context per call | Repeated cost | Memoize once, no TTL |

---

## How to audit

1. **Capture two API requests** from your system, ideally from "different user states but same version."
2. **Diff them byte-by-byte** (hexdump, not text diff).
3. **The diff should start where you expect** — at the boundary, at the per-user section.
4. **If the diff appears earlier than expected**, hunt:
   - `Date.now()` / time-varying data in static section.
   - Conditional inserts based on user state.
   - Tool array reordering.
   - Re-rendered prompt instead of cached.
5. **Measure `cache_creation_input_tokens` from response** — high ratio of `cache_creation` to `input_tokens` means you're constantly creating new cache entries.

The goal: at steady state, `cache_read_input_tokens` should dominate `cache_creation_input_tokens` by 10:1 or better.

---

## Cache-hit reality check (read this before quoting numbers)

The book reports **~90% input-token discount** on cache reads (verified pricing: 0.1× base rate). That's the **per-read pricing**, not the **fleet-wide reduction**.

Realistic fleet-level outcomes after correctly applying every rule above:
- **40–80% input-cost reduction** vs no caching, depending on session length, prompt size, MCP tool count, and how aggressively the user toggles features mid-session.
- The 10:1 `cache_read : cache_creation` ratio is achievable but requires sustained sessions and disciplined prompt structure.
- One-shot / non-interactive runs see far less benefit — the cache must amortize across multiple turns to pay back the 1.25× write-tax.

**Quote pricing as 0.1× per-read (verified). Quote fleet-cost reduction as a measurement target (your number) — not a default expectation.**

## Currency notes (updated 2026-04-26)

**Prompt cache pricing (v2026-04, externally verified):** 5-min write 1.25× base, 1-hour write 2× base, cache reads 0.1× (90% discount confirmed). 5-min ROI break-even after 1 read; 1-hour break-even after 2 reads.

**Workspace isolation (Feb 5, 2026):** Cache scope changed from org-level to workspace-level. Two workspaces in the same org no longer share cache hits.

**MCP transport stability (verified, MCP spec 2025-03 + 2026 roadmap):**
- SSE (HTTP+SSE) deprecated March 2025; deployments must migrate by mid-2026 (e.g., Atlassian Rovo June 30, Keboola April 1).
- Streamable HTTP is the canonical remote transport.
- **The 2026 MCP roadmap explicitly does NOT add new transports** — the set is stable. Treat the eight transports as the canonical list for the foreseeable future, with SSE strictly on the deprecation path.
