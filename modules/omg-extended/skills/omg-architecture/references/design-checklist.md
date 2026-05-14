---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Design Checklist

Use this when **designing** a new agentic system, agent loop, sub-agent system, tool interface, memory system, or extension model. Walk through each section and answer the questions explicitly.

---

## Section A — The control loop

### A1. Termination semantics
- [ ] Have you enumerated every reason the loop can stop? (Aim for ~10 — Codex has exactly 10.)
- [ ] Is each reason a typed variant in a discriminated union (not a flag, not a sentinel)?
- [ ] Can you add a new termination reason by changing one union and one switch? If you'd touch many call sites, the design is wrong.
- [ ] Does termination flow through the type system? (No magic "is_done" flags.)

### A2. Continuation semantics
- [ ] What are the continuation states? (Codex has 7.)
- [ ] On every `continue`, is the entire next-state object reconstructed (not mutated in place)?
- [ ] Does each continuation site have a `transition.reason` field tests can assert against?

### A3. Error recovery
- [ ] Do you have an escalation ladder for recoverable errors?
- [ ] Does each recovery step have a one-shot guard (`hasAttemptedReactiveCompact`-style flag)?
- [ ] Are recovery counters bounded? (Codex uses `MAX_OUTPUT_TOKENS_RECOVERY_LIMIT = 3`.)
- [ ] Is there a circuit breaker on the heaviest recovery path? (3 consecutive failures → stop.)
- [ ] Have you tested for death spirals? (Error → hook injection → retry → error...)

### A4. Withholding
- [ ] If the loop talks to external consumers (SDK), do you withhold recoverable errors from the public stream and surface them only on exhaustion?
- [ ] Is the withholding triggered by a typed predicate, not string matching on error messages?

### A5. Generator vs callback
- [ ] If you're choosing between async generator and event emitter — pick generator unless the type system genuinely doesn't help.
- [ ] If using a generator, does the body run lazily on first `.next()` (so callers can construct without paying init cost)?
- [ ] Does the `finally` block do all cleanup? (Iterator return triggers `finally` deterministically — this IS your cleanup mechanism.)

---

## Section B — Tool / extension interface

### B1. Self-description
- [ ] Does every tool carry its own schema, permission logic, concurrency-safety predicate, and validation?
- [ ] Can you add tool N+1 without changing any existing code? (If the orchestrator switches on `tool.name`, you're missing a field.)
- [ ] Are concurrency-safety and destructive-hint flags **functions of input**, not type-level booleans? (`Bash("ls")` ≠ `Bash("rm -rf")`.)

### B2. Fail-closed defaults
- [ ] Is there a `SAFE_DEFAULTS` object that every tool definition spreads OVER?
- [ ] Defaults are restrictive (`isParallelSafe: () => false`, `isReadOnly: () => false`)?
- [ ] The one exception (`checkPermissions: () => allow`) is justified because it runs *after* general permissions?

### B3. Result handling
- [ ] Is there a per-tool result size cap?
- [ ] Is there an aggregate-per-message cap? (Without it, 10 parallel reads × 40K each blows the budget.)
- [ ] Oversized results persisted to disk + replaced with preview wrapper?
- [ ] Read-tool exemption considered? (Persisting Read result creates circular Read-the-persisted-file.)

### B4. Concurrency
- [ ] Does the orchestrator partition tool calls into runs of safe-concurrent vs exclusive?
- [ ] Are results yielded in **submission order**, not completion order? (Re-ordering breaks model reasoning.)
- [ ] Three-tier abort hierarchy? (Query controller → batch controller → per-tool controller.)
- [ ] Selective error cascade? (Bash errors cancel siblings; Read/Grep don't.)

### B5. Speculative execution
- [ ] Can concurrency-safe tools start executing while the model is still streaming?
- [ ] If aborted/invalidated, results are discarded cleanly (not double-applied)?

---

## Section C — Memory / persistence

### C1. Storage medium
- [ ] Files first, DB only if profiling demands.
- [ ] User can inspect with `cat`/`grep`/`vim` and delete with `rm`?
- [ ] Storage location is per-project, scoped via canonical git root?
- [ ] Path sanitization defense: at minimum, reject null bytes, URL-encoded traversals, Unicode normalization attacks, backslashes, absolute paths?

### C2. Schema
- [ ] Frontmatter contract: `name`, `description`, `type` (the four types: user/feedback/project/reference).
- [ ] One-line description is the load-bearing field for retrieval — under 150 chars?
- [ ] No derived fields (computable from existing data)?
- [ ] Each memory type has clear save/skip rules?

### C3. Retrieval
- [ ] Index always loaded; bodies on demand?
- [ ] Index size capped (lines AND bytes) with actionable guidance on overflow?
- [ ] Relevance via LLM side-query (prefetched, async, cached prompt cache)?
- [ ] Selection-rate telemetry tracked? (0/N = precision problem; 0/few = coverage problem.)

### C4. Staleness
- [ ] Memories never auto-delete?
- [ ] Age caveats injected in human-readable form ("47 days ago", not ISO)?
- [ ] The derivability test: is anything saved actually derivable from current project state?

### C5. Path security (for shared/team memory)
- [ ] Three-layer defense: sanitize → resolve+prefix-check → realpath-of-deepest-existing-ancestor?
- [ ] Project settings excluded from path-override sources? (Defense against malicious-repo injection.)
- [ ] All path failures throw — no silent fallbacks?

---

## Section D — Sub-agents / coordination

### D1. Universal lifecycle
- [ ] Is there one universal lifecycle function (`runAgent`-equivalent) that handles all variants via configuration?
- [ ] Resolution-chain principle: explicit override > declaration > inheritance > default?
- [ ] Does the schema *omit* fields when controlling flags are off (not just disable)? Model can't misuse what it can't see.

### D2. Sync vs async
- [ ] Sync agents share parent's abort controller (ESC kills both)?
- [ ] Async agents get fresh controllers + shared task-state channel only?
- [ ] Backgrounding mid-execution uses `Promise.race` against a background signal?
- [ ] On background: clean iterator return (triggers `finally`), then re-spawn as async with same agent ID?

### D3. Fork vs fresh
- [ ] Decision rule documented: high-overlap parallel → fork; different domain → fresh.
- [ ] Fork excludes coordinator mode (mutually exclusive)?
- [ ] Fork excludes non-interactive (no terminal for `bubble`)?
- [ ] Recursion guard: primary `querySource` check + fallback message-history scan for boilerplate tag?

### D4. Permission isolation
- [ ] Mode cascade: parent's `bypassPermissions`/`acceptEdits` always wins?
- [ ] Async agents auto-set `shouldAvoidPermissionPrompts` unless `bubble`?
- [ ] Tool allow-rules scoped to session (preserving `cliArg` rules)?
- [ ] Sub-agents default to `bubble` (cannot self-approve dangerous actions)?

### D5. Cleanup correctness
- [ ] `finally` block has 8-stage tear-down? (MCP cleanup → hooks clear → cache tracking → file state → GC hint → Perfetto unregister → transcript clear → todo entries → orphan kill.)
- [ ] Manual GC hint (`initialMessages.length = 0`) for fork children?
- [ ] Iterator return is the sole cleanup trigger?

---

## Section E — Prompt cache

### E1. Structure
- [ ] System prompt is `[...static, BOUNDARY, ...dynamic]` with explicit boundary marker?
- [ ] Pre-boundary content is identical across all users on this version (top-tier global cache)?
- [ ] Post-boundary content is user/session-specific?
- [ ] Cache-busting helper named `DANGEROUS_*` and requires a `_reason` parameter (mandatory in source, ignored at runtime)?

### E2. Stability
- [ ] No runtime conditionals before the boundary? (Each one doubles unique prefix hashes — 5 booleans = 32 cache variants.)
- [ ] Compile-time flags (bundler-resolved) before the boundary are fine?
- [ ] Tools sorted built-ins-first, MCP-suffix? (Server places cache breakpoint between them.)
- [ ] Sticky latches for any feature toggle that affects HTTP headers? (5 in Codex: AFK, fast-mode, cache-editing, thinking-clear, post-compaction.)

### E3. Memoization
- [ ] Context builders (git status, user context) memoized once, no TTL?
- [ ] Date helpers memoized? (Midnight crossover busts entire cached prefix without it.)
- [ ] Long-lived caches break circular dependencies? (Codex caches AGENTS.md to avoid auto-classifier → filesystem → permission → classifier loop.)

### E4. Fork specifics
- [ ] System prompt threaded as already-rendered bytes (not regenerated)?
- [ ] Tool array passed exactly through (`useExactTools`)?
- [ ] Constant placeholder result for parent `tool_use` blocks (byte-identical across children)?
- [ ] Per-child directive isolated in a single user message at the divergence boundary?

---

## Section F — Extensibility (skills + hooks)

### F1. Skills
- [ ] Two-phase loading: frontmatter at startup, body on invocation?
- [ ] Frontmatter contract: `name`, `description`, `when_to_use`, `allowed-tools`, `disable-model-invocation`, `user-invocable`?
- [ ] First-seen-wins after `realpath`-based dedup (not inode — unreliable on container/NFS/ExFAT)?
- [ ] MCP-sourced skills cannot execute inline shell commands (security boundary)?

### F2. Hooks
- [ ] Snapshot at startup, never re-read at runtime (TOCTOU defense)?
- [ ] Update channels: explicit user action + file-watcher rebuild only?
- [ ] Exit code 2 = blocking error (not 1 — too ambient)?
- [ ] Policy cascade: enterprise > local > project > user > plugin (lowest priority 999)?
- [ ] Internal callbacks get fast path (-70% overhead); external get safe path?
- [ ] Trust check at top of `executeHooks()` (defense against pre-trust hook firing)?

### F3. Skill-hook integration
- [ ] Skills can declare hooks; on invocation, register session-scoped?
- [ ] Sub-agent context auto-converts `Stop` → `SubagentStop`?
- [ ] `once: true` for self-removing one-shot validation hooks?

---

## Section G — Performance

### G1. Bootstrap
- [ ] Sub-300ms target?
- [ ] Fast-path dispatch for narrow argv (e.g., `--version`, `--help`)?
- [ ] Module-level I/O fired during import evaluation (overlap import work with subprocess spawns)?
- [ ] Dynamic `import()` to defer heavy deps (OpenTelemetry, gRPC)?
- [ ] API preconnection during init (warm TCP+TLS handshake)?

### G2. Runtime
- [ ] Tool result default: 8K, retry at 64K on truncation? (Production p99 ~5K — over-reserving wastes context.)
- [ ] Layered timeouts each protecting one specific failure?
- [ ] Hot paths bypass reactive framework (refs/microtasks, not setState)?
- [ ] Pre-allocated frozen objects to save per-frame allocations?

### G3. Search/filter
- [ ] Bitmap pre-filter before string operations? (One int compare rejects 10-90% of candidates.)
- [ ] Fused scan instead of multi-pass?
- [ ] Score-bound rejection (compute best-case, skip if can't beat top-K)?

---

## Section H — Remote / cloud (only if applicable)

### H1. Transport
- [ ] Asymmetric channels: persistent for high-frequency reads, plain HTTP for low-frequency writes?
- [ ] Echo dedup via `BoundedUUIDSet` (capacity ~2000, FIFO eviction, no TTL)?
- [ ] Epoch-based split-brain prevention (409 closes both channels)?

### H2. Credentials
- [ ] Per-instance auth-token closure (not process-wide env var)?
- [ ] Capture-at-send-time (don't re-read on 401 — race with concurrent refreshes)?
- [ ] Heap protection (`prctl(PR_SET_DUMPABLE, 0)`) for credential-injecting proxies?
- [ ] Token file unlinked after read?

### H3. Reconnection
- [ ] Reconnect strategy table data-driven on close code (not one strategy fits all)?
- [ ] Sequence-number cursor preserved across reconnect (zero message loss)?
- [ ] Linear backoff for transient/known-cause errors; exponential for unknown?

---

## How to apply this checklist

- For a **greenfield design**, walk every section. Note tradeoffs explicitly when skipping.
- For a **review of existing code**, walk only the sections relevant to the change.
- **Score** each item explicitly: yes / no / N/A / "deliberate tradeoff because X". The "deliberate tradeoff" cells are the most informative.
- **Quote** specific items by section letter + number when giving feedback ("D3 fork-vs-fresh decision is missing — your code spawns fresh agents for every parallel task, losing ~90% cache discount").
