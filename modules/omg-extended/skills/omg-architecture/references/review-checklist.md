---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Review Checklist

Use this when **reviewing** kit code, agent definitions, tool implementations, hook configurations, prompts, or architectural decisions in any agentic system. The structure mirrors the design checklist but is reframed as **red flags** to look for.

---

## Top 20 review red flags (scan for these first)

1. **Tool name string-switching in the orchestrator.** Move logic to the tool itself.
2. **Concurrency safety as a tool-type-level boolean** instead of `isConcurrencySafe(input)`.
3. **Re-rendering the system prompt per call** instead of caching it. Busts the prompt cache.
4. **Conditional content before the cache boundary** in system prompts. 2^N hash explosion.
5. **No `DANGEROUS_*` prefix** on cache-busting helpers. Naming convention is the only review-time signal.
6. **Tools sorted by user preference** (or any reorder-on-config-change). Cache-bust on every preference toggle.
7. **Stripping "irrelevant" history from forked sub-agents.** Costs more in cache miss than the dead context did.
8. **Re-reading hook config at runtime.** TOCTOU vulnerability — malicious repos can inject hooks post-trust.
9. **Exit code 1 used as blocking signal in hooks.** Collides with ambient script failures (every unhandled exception).
10. **Plugin model with shared memory** instead of process-isolated hooks.
11. **Single shared `AbortSignal.timeout()`** across requests. After idle period, next request aborts immediately.
12. **One global timeout protecting "everything."** Each timeout should protect one specific failure mode.
13. **Embedding-only retrieval** for memory. Embeddings struggle with negation; LLM side-query handles it for free.
14. **Storing memory in a database** without inspect/delete tooling. Files are observable; DBs aren't.
15. **Auto-saving every observation** without a relevance gate. Selection-rate telemetry collapses to 0/N.
16. **Saving knowledge derivable from project state** (code patterns, architecture, git history). Becomes stale liability.
17. **Tasks/sub-agents without typed termination states.** Hidden state machine, untestable transitions.
18. **Permission self-approval in sub-agents.** Default to `bubble` — escalate to parent.
19. **Hooks/extensions without policy cascade** (enterprise > local > project > user). User can override enterprise.
20. **Recursive sub-agent spawning** without a guard (primary `querySource` + fallback message-history scan).

---

## A. Control loop review

| Red flag | Why it matters | What to suggest |
|---|---|---|
| Returning `{ ok, reason?: string }` instead of discriminated union | No exhaustive handling; new exit reasons silently break callers | Discriminated union with `kind` discriminant |
| Termination signaled by special message type or side channel | Implicit state | Implicit termination via "no more tool calls" + typed `Terminal` return |
| Nested try/catch in the loop body | Error handling soup; recovery state hard to reason about | Single error-handler that returns next state object |
| Mutable state object inherited across iterations | Stale fields cause subtle bugs | Reconstruct full state object at every continue site |
| Death-spiral risk: stop hook injects context → retries → injects more | Burns thousands of API calls/session | Guard each retry path with one-shot flag; preserve flags across stop-hook retries |
| Recoverable errors leak to public stream | SDK consumers terminate on any error | Withhold pattern: internal `assistantMessages` array; surface only on exhaustion |
| No circuit breaker on heaviest recovery path | Auto-compact loops have been measured at 250K calls/day in production | After 3 consecutive failures, circuit-break |

---

## B. Tool / extension interface review

| Red flag | Why it matters | What to suggest |
|---|---|---|
| Orchestrator imports specific tool to apply special-case logic | Coupling; new tool requires orchestrator change | Self-describing tools — query the tool, don't switch on name |
| `isParallelSafe: true` as default | Fail-open default; wrong concurrency decisions are silent | `SAFE_DEFAULTS` spread pattern with fail-closed defaults |
| `checkPermissions(): allow` as a deliberate "no permission needed" | Looks dangerous in review | Justified ONLY because it runs after general permissions; document this |
| Tool result no size cap | One large output overwhelms model context | Per-tool `maxResultSizeChars` + aggregate-per-message budget |
| Read-equivalent tools with finite cap | Persisting Read result creates circular Read-the-persisted-file | `Infinity` for Read-class tools |
| Shell command matcher returns `false` on parse failure | Dangerous commands silently approved | Return `() => true` on parse failure — too complex to parse → always trigger hook/prompt |
| Permission rule matching by tool name only | Misses fine-grained rules | Support `Bash(git *)`, `Edit(/src/**)`, `Fetch(domain:example.com)` |
| Speculative tool execution without abort handling | Stale results from invalidated streams | Synthetic `streaming_fallback` error result on discard |

---

## C. Memory review

| Red flag | Why it matters | What to suggest |
|---|---|---|
| All memory in one giant file | Token cost on every load | Index + on-demand body files |
| Index has no size cap | "P97 had 197 lines but 197KB" — users pack long lines | Cap lines AND bytes; surface actionable guidance on overflow |
| Frontmatter scan reads full file | Body should be private until selected | Scan first ~30 lines only |
| Memory expires on schedule | Institutional knowledge is valid for years | Staleness warnings, never auto-delete |
| ISO timestamp in stale-warning text | Models don't reason well about ISO ages | "47 days ago" — human-readable form triggers staleness reasoning |
| `autoMemoryDirectory` overridable from project settings | Malicious repo can `autoMemoryDirectory: "~/.ssh"` and gain auto-write to keys | Exclude project settings from override sources |
| Path validation only does `path.resolve()` | Symlink attacks (`team/evil → /etc/`) bypass | Three-layer defense: sanitize → resolve+prefix-check → realpath-of-deepest-existing-ancestor |
| Save-corrections-only feedback | Drifts model away from validated approaches | Save both: corrections AND confirmations of non-obvious choices |
| Retrieval via embeddings only | Negation handling is poor | LLM side-query (Sonnet) — handles negation, no infra |

---

## D. Sub-agent review

| Red flag | Why it matters | What to suggest |
|---|---|---|
| Different code paths per agent type | Maintenance nightmare; bugs in one path don't fix others | One universal lifecycle function with config; agent type encoded in config not control flow |
| Schema includes all fields always | Model misuses fields not relevant to current mode | Schema-shape-by-flag: omit fields when controlling flags are off |
| Async agent shares parent's abort controller | ESC kills the background work | Async agents get fresh controllers; sync share parent's |
| Background extraction not gated by main-agent activity | Duplicates work or contradicts main agent | Cooperative — defer when main agent already saved |
| Sub-agent spawned without filtering incomplete tool calls | API rejects orphan `tool_use` lacking `tool_result` | `filterIncompleteToolCalls()` in fork path |
| `Agent` tool retained in fork child's pool BUT no recursion guard | Exponential fan-out | Belt-and-suspenders: primary `querySource` check + fallback message-history scan for boilerplate tag |
| Plan/Explore agents include `gitStatus` | 40KB stale snapshot; agent can run `git status` for fresh data | Strip `gitStatus` for read-only/exploration agents |
| Verification agent without anti-avoidance prompting | Drifts from "verify" to "fix" | Explicitly enumerate excuses ("this should work"); reinject critical reminder after every tool result |
| `initialMessages` reference held by fork child | ~1MB per child of duplicated message references | Manual GC hint: `initialMessages.length = 0` |

---

## E. Prompt cache review

| Red flag | Why it matters | What to suggest |
|---|---|---|
| Conditional inserts in middle of system prompt | Each one doubles unique cache prefix hashes | Move all conditionals after the boundary |
| Helper named `addCustomization()` or similar neutral name | No review-time signal that this busts cache | Rename to `DANGEROUS_*`; require `_reason` parameter |
| `getCurrentDate()` called per request | Midnight crossover busts entire cached prefix | `memoize(getLocalISODate)` |
| Tool array re-sorted per session | Position shifts on every install | Built-ins prefix + MCP suffix; sort each partition alphabetically |
| Feature toggle UI flips header bit live | Cache miss every toggle | Sticky latch: once true, never returns false |
| Dynamic agent list in tool description | Cache_creation cost spikes with plugin install | Move to attachment message (Codex saved 10.2% of fleet `cache_creation` tokens this way) |
| Fork child re-renders system prompt | GrowthBook flag transitions cold→warm cause divergence | Thread parent's already-rendered prompt as bytes via `override.systemPrompt` |
| Fork child filters tool array | Reorder/filter changes serialization | `useExactTools: true` — pass exact parent array |
| Placeholder result varies per child | Bytes differ → cache miss | Constant `'Fork started -- processing in background'` for every parent `tool_use` |

---

## F. Extensibility review

| Red flag | Why it matters | What to suggest |
|---|---|---|
| Skills loaded fully at startup | Pays for unused skills in token cost | Two-phase: frontmatter at startup, body on invocation |
| MCP skills can execute inline shell | `` !`rm -rf /` `` from remote prompt | Hard-block inline-shell for MCP-sourced skills |
| Skill dedup by inode | Unreliable on container/NFS/ExFAT mounts | `realpath`-based dedup |
| Hooks re-read on every event | TOCTOU vulnerability | Snapshot at startup; rebuild only on explicit channel |
| Exit 1 means "blocking" in hook contract | Collides with every script failure | Exit 2 — uncommon code, not ambient noise |
| User can override enterprise hooks | Policy bypass | Strict cascade: enterprise > local > project > user > plugin (priority 999) |
| Hooks fire before trust is presented or after trust declined | Two real Codex vulnerabilities | Trust check at top of `executeHooks()` |
| Stop hook exists but never blocks continuation | Missing the "are you really done?" goal-directed loop opportunity | Stop hook returning exit 2 forces continuation |
| Skill declares `Stop` hook in sub-agent context | Sub-agents fire `SubagentStop`, not `Stop` — hook never fires | Auto-convert `Stop` → `SubagentStop` in registration |

---

## G. Performance review

| Red flag | Why it matters | What to suggest |
|---|---|---|
| Bootstrap > 300ms warm | Crosses human-perception threshold; CLI feels sluggish | Fast-path argv dispatch, module-level I/O parallelism, dynamic imports for heavy deps |
| `max_output_tokens: 64000` default | Production p99 ~5K; over-reserves 8-16× | 8K default, retry at 64K on <1% truncation |
| Streaming with one shared timeout | Body can stall after HTTP 200 | Idle watchdog: warn at 45s, abort at 90s; recreate fresh signal per request |
| Fuzzy search without bitmap pre-filter | Per-keystroke latency dominated by string ops | 26-bit bitmap pre-filter; one int compare rejects 10-90% |
| `BetaMessageStream` (SDK helper) for streaming | `partialParse()` re-parses growing JSON each chunk — O(n²) | Raw `Stream<BetaRawMessageStreamEvent>`; accumulate strings, parse once on block complete |
| Driving 60fps animations through `setState` | 5-10ms reconcile per event | Refs + microtasks; React for frame boundaries only |
| Per-frame allocations in render path | GC pressure on hot path | Pre-allocated frozen objects, interning pools |

---

## H. Remote/cloud review (if applicable)

| Red flag | Why it matters | What to suggest |
|---|---|---|
| One channel for reads + writes | Retry semantics conflict (read = persistent, write = ack-required) | Asymmetric: WebSocket/SSE for reads, plain HTTP for writes |
| Reconnect strategy is one-size-fits-all | Different close codes have different causes | Data-driven table on close code (4003→stop, 4001→linear-3-retries, other→exp-cap-5) |
| Token re-read on 401 | Race with concurrent refreshes (other connector may have just won) | Capture-at-send-time |
| Process-wide env var holds JWT | Leaks between concurrent sessions | Per-instance auth-token closure |
| Token file persistent on disk after read | Same-UID heap scrape exposure | Read once, then `unlink()`; combine with `prctl(PR_SET_DUMPABLE, 0)` |
| Echo dedup via TTL cache | Memory unbounded under burst | `BoundedUUIDSet`: circular buffer + Set, FIFO eviction, no timers |
| No epoch on bridge messages | Silent split-brain (two workers think they're "the" worker) | Worker epoch on every bridge call; 409 closes both channels |
| 5-second reconnect on every WebSocket close | Permission round-trip > 14s makes UX feel broken | Linear backoff for known-cause; exponential capped for unknown |

---

## How to give review feedback

1. **Quote the violated pattern by name** — "This violates Bet 3 (self-describing tools): the orchestrator switches on `tool.name`."
2. **Cite the specific Codex lesson** — "Codex measured a 10.2% `cache_creation` saving by moving dynamic agent lists from tool description to attachment. The same pattern applies here."
3. **Suggest the specific fix** — not "fix this," but "add `isConcurrencySafe(input): boolean` to the Tool interface, replace the orchestrator switch with `tool.isConcurrencySafe(parsedInput)`."
4. **Flag deliberate tradeoffs** — when the reviewed code intentionally diverges from the canon (e.g., for scale reasons that don't apply), say so explicitly so the author can document intent.
5. **Score severity:**
   - **Blocker** — security/correctness issue (TOCTOU, recursion, fail-open default).
   - **High** — measurable cost (cache busting, death-spiral risk, missing recovery guard).
   - **Medium** — architectural drift (orchestrator coupling, missing types).
   - **Low** — style/clarity (naming convention misses, missing comment for production-incident-driven code).

The review is highest-value when the author can take the feedback, find the relevant Codex chapter, and read the production-incident story behind the rule. Always link to `references/architectural-bets.md` or specific chapters when challenging a decision.
