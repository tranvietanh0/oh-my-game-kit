---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Codex from Source — Master Study Report

**Source:** https://codex-code-from-source.com/ (chapters ch01–ch18)
**Date studied:** 2026-04-26
**Method:** Site downloaded, converted to markdown via pandoc, 6 parallel sub-agents read 3 chapters each, synthesis below.

---

## TL;DR — The Five Architectural Bets (from Ch 18 epilogue)

1. **Generator loop over callbacks.** One `query()` async generator (~1,700 LOC, 10 terminal + 7 continuation states in a discriminated-union return type) drives REPL, SDK, sub-agents, headless print, compaction. Adding a new exit reason = adding one variant to one union.
2. **File-based memory over databases.** Plain Markdown in `~/.agents/projects/<sanitized-git-root>/memory/` plus a Sonnet side-query for relevance recall. No infrastructure, observable to the user (`vim`/`cat`/`rm`).
3. **Self-describing tools over central orchestrators.** Each `Tool` carries name, description, schema, prompt contribution, concurrency-safety predicate, and execution logic. MCP tools implement the same interface — first-class, no adapter layer.
4. **Fork agents for cache sharing.** Forked sub-agents inherit parent's full conversation and share the **prompt cache**: ~90% input-token discount makes spawning small sub-agents (memory extraction, verification) economical.
5. **Hooks over plugins.** External processes communicating via exit codes + JSON on stdin/stdout. Plugins crash hosts; hooks crash themselves. Stable protocol since 1971.

The closing meta-principle: **push complexity to the boundaries.** Messy outside (5 keyboard protocols, 8 MCP transports, untrusted hooks). Typed/exhaustive inside (`ParsedKey`, recalled memories, `Tool` objects, permission decisions).

---

## Chapter 1 — The Architecture of an AI Agent

**Topic:** Six core abstractions, the golden request path, permission system, multi-provider plumbing, bundler tricks.

### Core concepts
- **Agentic CLI vs classical CLI.** Classical = deterministic function. Agentic = loop around an LLM that generates its own instruction sequence at runtime.
- **Six abstractions are exhaustive.** Query Loop, Tool System, Tasks, State, Memory, Hooks. Everything else (~400 utilities, vim emulation, cost tracking, forked terminal renderer) supports these. Emerged retrospectively under shipping pressure.
- **Query Loop (`query.ts`, ~1,700 LOC)** is an async generator yielding `Message` and returning a discriminated `Terminal` union (normal completion, abort, token-budget exhaustion, hook intervention, max turns, error). REPL, SDK, sub-agent, headless `--print` — all funnel through it.
- **Tool System self-describes.** Schema, permission logic, concurrency safety, progress reporting, rendering. Orchestrator never has tool-specific knowledge.
- **Tasks = recursive query loops.** Sub-agents are new `query()` instances with isolated message history, tool set, permission mode. Permission escalation flows upward via `bubble`.
- **Memory: 3-tiered + LLM-curated.** Project (`AGENTS.md`), user (`~/.agents/MEMORY.md`), team (symlinked). At session start, LLM picks which memories are relevant.
- **Hooks at 27 events × 4 execution types.** Shell commands, single-shot LLM prompts, multi-turn agent conversations, HTTP webhooks. Can block, modify, inject, short-circuit.

### Key code patterns
- `query()` returns `AsyncGenerator<Message, Terminal>`. Consumers `for await`.
- `Terminal` is a discriminated union — termination reason is typed first-class.
- Provider abstraction: `getAnthropicClient()` factory returns Anthropic-shaped wrappers regardless of cloud. `as unknown as Anthropic` cast (deliberate, labeled in source).
- Bundler-stripped feature flags use `require()` (synchronously eliminable) not `import()` (preserves Promise).

### Mechanisms
- **Golden Path:** REPL → query loop → model stream → `StreamingToolExecutor` may begin executing concurrency-safe tools BEFORE model finishes streaming (speculative; if model invalidates, result discarded). Tool results appended; loop re-enters model. Terminates when model emits no tool calls or external constraint fires.
- **Permission resolution chain (7 modes):** `bypassPermissions` → `dontAsk` → `auto` → `acceptEdits` → `default` → `plan` (read-only) → `bubble` (escalate to parent). `auto` mode runs a separate lightweight LLM call as classifier.

### Surprises
- **Speculative tool execution overlaps with streaming.** Concurrency-safe tools run while model still generating.
- **Sub-agents default to `bubble`** — cannot self-approve dangerous actions.
- **Source maps leaked the entire codebase.** Early npm releases shipped `sourcesContent` containing full TS. This is how the book exists at all.
- **Generators chosen for backpressure + cancellation + typed terminal state.** Event emitters can't encode "why did we stop" in the type system.
- **Model decides termination implicitly** — just stops emitting tool calls. No "I'm done" message type.

---

## Chapter 2 — Bootstrap Pipeline

**Topic:** How Codex initializes everything in **<300 ms** by overlapping I/O with module evaluation.

### Core concepts
- **300 ms human-perception threshold** is the forcing function.
- **Five-file funnel:** `cli.tsx` → `main.tsx` → `init.ts` → `setup.ts` → `replLauncher.ts`. Each phase narrows scope.
- **Four parallelism strategies:** module-level subprocess dispatch (fire I/O during import evaluation), `Promise.all` parallelism in setup, post-render deferred prefetches, dynamic `import()` to defer module evaluation (OpenTelemetry alone = 400KB + 700KB gRPC).
- **Trust boundary** = Codex trusting the **environment**, not the user trusting Codex. Poisoned `.bashrc` could set `LD_PRELOAD`. Pre-trust whitelist is exactly **10 operations**.
- **Hook config snapshotted and frozen** at setup. On-disk modifications mid-session ignored. Security feature.
- **Seven launch paths converge on `query()`.** REPL, `--print`, SDK, `--resume`, `--continue`, pipe, headless.

### Key patterns
- Fast-path: `if (args[0] === '--version') { const { printVersion } = await import('./commands/version.js'); ... }` — dynamic import, run, exit. Rest of codebase never loads.
- Module-scope side effects: `const mdmPromise = startMDMSubprocess()` fires at import-evaluation time.
- Commander preAction hook: `program.hook('preAction', async (cmd) => { await init(cmd) })` — fires after parsing, before handler. Fast-path commands never trigger Commander → zero `init()` cost.

### Phases (~240 ms warm)
- Phase 0: Fast-path dispatch (~5 ms).
- Phase 1: Module-level I/O (~138 ms).
- Phase 2: Parse + Trust (~14 ms).
- Phase 3: Setup (~35 ms): socket binding, hook snapshotting, command loading via `Promise.all`.
- Phase 4: Launch (~25 ms): `replLauncher` picks one of 7 paths.

### Surprises
- **Module evaluation treated as overlap-able compute time, not idle.**
- **Hook snapshot freezing is a security feature** — attacker who edits hooks file mid-session sees no effect.
- **Initial prompt captured from argv before any async work** — `codex "fix the bug"` doesn't lose the prompt if init drags.
- Cold start adds ~200 ms to module eval, eating the 60 ms headroom.

---

## Chapter 3 — State: The Two-Tier Architecture

**Topic:** Mutable process singleton (~80 fields) for infrastructure + 34-line reactive store for UI, bridged by one centralized `onChange` callback.

### Core concepts
- **Two tiers, not one store.** Single global would either trigger React re-renders on every cost-tracker tick OR force infrastructure modules (running before React mounts) to import React.
- **Bootstrap state (`bootstrap/state.ts`)** = mutable `STATE` singleton, ~100 getter/setter wrappers, **DAG leaf** (imports only utility types + `node:crypto`), enforced by ESLint. Source comments: `DO NOT ADD MORE STATE HERE`.
- **AppState (`state/store.ts`)** = ~30-line Zustand-shape store. `DeepImmutable` with surgical mutability escapes for Maps/AbortControllers/functions.
- **Sticky latches.** 5 `boolean | null` flags (`afkModeHeaderLatched`, `fastModeHeaderLatched`, ...) that, once `true`, **never go back**. Sole purpose: prevent prompt-cache busting from feature toggles flipping HTTP headers mid-session.
- **Centralized side effects via `onChangeAppState`.** Every `setState` triggers a single diff-aware callback fired synchronously BEFORE subscriber notification. Permission-mode sync used to be scattered across 8+ paths; only 2 actually called the remote sync.
- **Memoized context builders.** `getGitStatus`, `getUserContext` use Lodash `memoize` (no TTL) — re-computing would bust the server-side prompt cache.

### Mechanisms
- **Latch lifecycle:** `null` (uninitialized) → `true` (latched, permanent). `boolean | null` precisely encodes the three states.
- **`/model` flow:** Command handler → `store.setState` → `Object.is` change check → `onChangeAppState` synchronously calls `setMainLoopModelOverride()` (bootstrap) + persist to disk → all subscribers fire → React re-renders. Next API call reads from bootstrap, not AppState. **Two-tier handoff: UI store = source of truth for what user chose; bootstrap = source of truth for what API client uses.**
- **Cost tracking** uses **reservoir sampling (Algorithm R)** with 1,024-entry reservoirs producing p50/p95/p99.
- **AGENTS.md cache breaks circular dependency.** Auto-mode classifier needs AGENTS.md → loading goes through filesystem → goes through permissions → calls classifier. Cache in bootstrap (DAG leaf) breaks it.

### Surprises
- **Sticky latches were not designed up-front.** Added after prompt-cache busting became a measurable cost problem.
- **NFC normalization on every path setter** — macOS HFS+/APFS produces NFD; world uses NFC.
- **No middleware/devtools/time-travel — and that's a feature.** State management bugs cost real money (cache misses).
- **`onChange` fires BEFORE listeners** — side-effect synchronization completes before UI re-renders.
- **Selector reference identity is a footgun.** Selectors must return existing sub-object references.
- **DAG leaf enforced by ESLint.**

---

## Chapter 4 — API Layer

**Topic:** How a single API call to the model is constructed, sent, streamed, and recovered from — protecting the server-side prompt cache.

### Core concepts
- **Provider-transparent client factory.** `getAnthropicClient()` dispatches by env var to Direct/Bedrock/Foundry/Vertex, casts every result `as unknown as Anthropic`. Decided once at bootstrap. Dynamic `import()` keeps unused providers out.
- **buildFetch UUID injection.** Every outbound request gets `x-client-request-id`. Timeouts have no server request ID, so without client-side UUID the API team can't correlate stalled requests with backend logs. Only sent to first-party endpoints.
- **Cache-stable system prompt.** Ordered array split by **explicit boundary marker**. Pre-boundary = static (top-tier global cache). Post-boundary = user/session-specific (per-session cache). Naming is loud: `systemPromptSection` vs `DANGEROUS_uncachedSystemPromptSection(text, _reason)` — `_reason` parameter is mandatory in source even though ignored at runtime.
- **The 2^N hash explosion.** Every runtime conditional placed before the boundary doubles unique cache prefix hashes. Three booleans = 8 cache variants. Compile-time bundler flags fine; runtime branches must be after the boundary. Fragments the entire fleet's cache silently.
- **Three-tier prompt cache.** Ephemeral (~5 min TTL), 1-hour TTL (subscription-gated, latched), global cross-org scope (only when MCP tools absent).
- **`queryModel` orchestrating async generator (~700 LOC).** 6-step assembly: kill-switch → beta headers (sticky latches) → tool schemas (parallel `Promise.all`, deferred tools omitted) → message normalization (repair orphans) → system block construction → retry-wrapped streaming.
- **Idle watchdog vs SDK timeout.** SDK timeout satisfies on HTTP 200; body can stall indefinitely after. Watchdog = `setTimeout` reset on every chunk. Warn at 45s, abort at 90s.
- **8K default output cap.** Production p99 = ~4,911 output tokens. SDK default 32K-64K over-reserves 8-16×. Cap at 8K, retry at 64K on <1% truncation. Saves substantial fleet cost.

### Key patterns
- Prompt array shape: `[...staticSections, BOUNDARY, ...dynamicSections]`.
- Streaming uses raw `Stream<BetaRawMessageStreamEvent>`, not `BetaMessageStream` — to avoid `partialParse()` re-parsing growing JSON every chunk (O(n²)).
- `withRetry()` is itself an async generator yielding `SystemAPIErrorMessage` events so retry status appears inline.

### Mechanisms
- **Streaming with watchdog and fallback:** open SSE, start 90s watchdog. Reset on every chunk. Warn at 45s. Abort + non-streaming retry on watchdog fire. Fallback DISABLED when `StreamingToolExecutor` is active (re-execution would risk running tools twice).
- **Retry strategies:** 529 overloaded → backoff retry, optional fast-mode downgrade. Primary model error → fallback (Opus → Sonnet). Context overflow → reduce thinking budget. 401 → refresh OAuth, retry once.

### Surprises
- SDK type cast (`as unknown as Anthropic`) is intentional and labeled in source as deliberate dishonesty.
- Cache-busting damage is invisible — only seen as fleet-wide cost spike, not local error.
- **Global cache scope automatically disabled when MCP tools present** — adding any MCP tool measurably degrades cache economics.
- 8K cap is data-driven cost optimization, not a model limit.
- Streaming fallback can silently cause double tool execution if not gated against streaming executor.

---

## Chapter 5 — The Agent Loop ⭐ (Heart of the book)

**Topic:** The single 1,730-line async generator (`query()` in `query.ts`) that IS Codex — one code path that streams the model, executes tools, compresses context, recovers from errors, runs hooks, and decides when to stop.

### Core concepts
- **One generator to rule them all.** Sub-agents recurse into the same loop. The compactor recurses into it too (with `querySource: 'compact'` to bypass blocking-limit guards that would otherwise deadlock when the compactor needs to *reduce* tokens).
- **Async generator over event emitter.** Three reasons: backpressure, typed terminal return value (10-state discriminated union), `yield*` composability.
- **Lazy generator startup.** `function*` body only runs on first `.next()`. `query()` returns instantly; heavy init (config snapshot, memory prefetch, budget tracker) deferred. Lets React renderer set up first.
- **Three-way state separation.** Mutable `LoopState`, immutable `QueryConfig` (snapshotted once at entry), injectable `QueryDeps` (model caller, compactor, microcompactor, UUID generator).
- **Immutable transitions inside a mutable loop.** Every `continue` site reconstructs the *entire* `State` object. Verbose by design. Tests assert on `transition.reason`.
- **10 terminal states + 7 continue states** in the discriminated union.
- **Withholding pattern.** Recoverable errors (prompt-too-long, max-output-tokens) suppressed from yield stream because SDK consumers (Cowork, desktop app) terminate sessions on any error message. Pushed into internal `assistantMessages` array; surfaced only when all recovery exhausted.
- **Death-spiral guards (5 total, each earned in production).**

### Mechanisms — the loop in full

**Single iteration body:**

1. **Context management — four layers in fixed order:**
   - Layer 0: Tool result budget (`applyToolResultBudget()`).
   - Layer 1: Snip compact (physically removes old messages).
   - Layer 2: Microcompact (removes tool results no longer needed by `tool_use_id`). For *cached* microcompact, boundary message is deferred until AFTER the API response — client-side token estimates lie; only server's `cache_deleted_input_tokens` tells you what was actually freed.
   - Layer 3: Context collapse (replaces conversation spans with summaries). Runs BEFORE auto-compact.
   - Layer 4: Auto-compact. Heaviest: forks a Codex conversation to summarize history. Circuit breaker: 3 consecutive failures and it stops. (Production saw 250K API calls/day in compact-fail-retry loops.)

   Thresholds: `effectiveContextWindow = contextWindow - min(modelMaxOutput, 20000)`. Auto-compact at `effectiveWindow - 13000`. Hard blocking at `effectiveWindow - 3000`.

2. **Model streaming.** `while(attemptWithFallback)` outer loop. Inner `for await` over `deps.callModel({...})`. Streaming tool execution: `StreamingToolExecutor` runs concurrency-safe tools as `tool_use` blocks arrive. Each message passes through withholding filter.

3. **Post-stream classification.**
   - **No tool_use blocks** → "done" path: token-budget check, stop hooks. If hooks block: append errors, set `stopHookActive`, continue.
   - **Has tool_use blocks** → tool-use path. Haiku summary kicked off in background; *previous* iteration's Haiku promise resolves during *this* iteration's streaming.

4. **Error recovery escalation ladder:**
   - 413 prompt-too-long → drain staged context-collapse → reactive compact (one-shot, guarded).
   - Max-output-tokens hit → escalate to 64K override → multi-turn recovery (max 3 attempts).
   - Model error → fallback model (strip thinking signatures first — they are model-bound).
   - Other recoverable errors → withhold + retry; surface only on exhaustion.

**Death-spiral guards:**
1. `hasAttemptedReactiveCompact` one-shot flag.
2. `MAX_OUTPUT_TOKENS_RECOVERY_LIMIT = 3`.
3. Auto-compact circuit breaker after 3 consecutive failures.
4. **No stop hooks on error responses** — explicit return before stop hooks when last message is API error.
5. **`hasAttemptedReactiveCompact` preserved across stop hook retries.** Source comment: "Resetting to false here caused an infinite loop burning thousands of API calls."

**Token budgets (`+500k`):** Subagents always stop. Continue if `turnTokens < budget * 0.9`. After 3+ continuations, stop early if both current and previous deltas < 500 tokens. On continue, inject nudge message with remaining budget.

**Orphaned tool_result safety net.** `yieldMissingToolResultBlocks()` synthesizes error tool_results for orphans. Fires in three places: outer error handler, fallback handler, abort handler. Prevents protocol errors on next turn.

**Abort handling — two distinct paths.** Streaming abort: streaming executor drains queued tools or `yieldMissingToolResultBlocks` covers. `signal.reason` distinguishes hard abort (Ctrl+C) from submit-interrupt (user typed new message) — submit-interrupts skip interruption message.

**Thinking block rules (inviolable):**
1. Containing message must be in a query with `max_thinking_length > 0`.
2. Thinking block must not be last block in a message.
3. Thinking blocks preserved for the entire assistant trajectory.

Violations produce opaque API errors. Fallback handler strips signatures (model-bound); compaction preserves the protected tail; microcompact never touches thinking blocks.

### Surprises
- 1,730 lines in one file — every other system feeds in or out of it. Splitting would dilute invariants.
- Generator laziness is load-bearing: instant return lets React renderer set up before heavy work runs.
- Withholding errors from SDK consumers feels wrong but is necessary.
- The `compact` `querySource` exists ONLY to bypass blocking-limit guard.
- Previous turn's Haiku summary resolves during NEXT turn's streaming — overlapping latency.
- The 13K/3K threshold gap exists so reactive compact can catch overflows that bypass proactive compact.

---

## Chapter 6 — Tools

**Topic:** 40+ tool implementations, feature-flag-gated registry, 14-step execution pipeline, seven-mode permission resolver, result-budgeting system.

### Core concepts
- **Five-of-45 interface.** `Tool` has ~45 members but only 5 load-bearing for the loop: `call()`, `inputSchema`, `isConcurrencySafe(input)`, `checkPermissions(input)`, `validateInput(input)`. Other 40 support UI/telemetry/search.
- **Three type parameters.** `Tool<Input, Output, P>`. Input is Zod schema doing double duty: API JSON Schema + runtime parser. P is per-tool progress event type.
- **`buildTool()` with fail-closed defaults.** Every tool spread over `SAFE_DEFAULTS`: `isParallelSafe: () => false`, `isReadOnly: () => false`, `isDestructive: () => false`, etc. The one non-fail-closed default — `checkPermissions: () => allow` — runs AFTER general permissions, so "allow" means "no tool-specific objection."
- **Input-dependent safety.** `Bash("ls -la")` is concurrency-safe; `Bash("rm -rf")` is not. Concurrency check parses commands.
- **`ToolUseContext` god object (~40 fields).** Threaded through every tool. Sub-agent variant via `createSubagentContext()` resets/clones specific fields.
- **Registry: `getAllBaseTools()` SSOT.** `assembleToolPool()` filters by deny rules + REPL hiding + `isEnabled()`, sorts each partition alphabetically, then concatenates **built-ins (prefix) + MCP (suffix)** — the API server places a cache breakpoint after the last built-in; flat sort would interleave MCP tools and shift positions on every install.
- **Deferred loading.** Tools with `shouldDefer: true` send only name + description. Model must call `ToolSearchTool` to load schema. Calling deferred without loading → all params arrive as strings → Zod fails → recovery hint appended.
- **Result budgeting at two scales.** Per-tool `maxResultSizeChars` (Bash 30K, Edit/Grep 100K, Read Infinity). Plus `ContentReplacementState` aggregate budget across the conversation.

### 14-step pipeline (`checkPermissionsAndCallTool()`)

**Validation (1-4):** tool lookup → abort check → Zod validation (recovery hint for deferred) → semantic validation (FileEdit rejects no-op edits, Bash blocks bare `sleep` when MonitorTool available).

**Preparation (5-6):** speculative classifier start (kicks off auto-mode classifier in parallel — saves hundreds of ms) → input backfill (clone parsed input + add derived fields like `~/foo.txt` → absolute path; original preserved for transcript fidelity).

**Permission (7-9):** PreToolUse hooks → permission resolution chain (hook decision → rule matching → tool-specific check → mode default → interactive prompt → auto-mode classifier two-stage: fast model + extended thinking on ambiguous) → permission-denied handling.

**Execution + cleanup (10-14):** tool execution with original input → result budgeting (oversized → persisted to `~/.agents/tool-results/{hash}.txt` + preview wrapper) → PostToolUse hooks → new messages appended → error handling (`classifyToolError()` extracts safe strings).

### Permission modes (7)
- `default` — tool checks + prompt for unrecognized.
- `acceptEdits` — auto-allow file edits.
- `plan` — read-only.
- `dontAsk` — auto-deny anything that would prompt (background agents).
- `bypassPermissions` — allow everything.
- `auto` — transcript classifier (feature-flagged).
- `bubble` — internal sub-agent mode; permission requests propagate to parent.

### Surprises
- **Sort-then-concatenate is cache-stability mandate**, not aesthetic.
- BashTool's permission matcher returns `() => true` on AST parse failure — counterintuitive; "too complex to parse → too complex to skip safety."
- **`_simulatedSedEdit` pattern**: when user approves a sed in dialog, result is *pre-computed in a sandbox* and injected. `call()` applies the pre-computed result, bypassing shell re-execution. Guarantees what user previewed = what gets written.
- FileReadTool is the ONLY tool with `maxResultSizeChars: Infinity` — persisting Read result would create circular Read-the-persisted-file loop.
- `contextModifier` is silently queued for parallel tools — easy footgun.
- FileEditTool fuzzy-matches whitespace and quote styles — accommodates model getting whitespace slightly wrong.
- macOS-specific bug surface: FileReadTool handles U+202F narrow no-break space in "Screen Shot" filenames.

---

## Chapter 7 — Concurrent Tool Execution

**Topic:** Two cooperating layers — post-stream batch partitioner + mid-stream speculative executor — overlap I/O with model token generation while preserving conversation-order semantics.

### Core concepts
- **Per-call safety, not per-tool-type.** Concurrency safety is property of `(tool, parsed input)`.
- **Mutual exclusion contract.** A tool may execute iff (a) nothing running, OR (b) it's concurrency-safe AND every running tool is concurrency-safe.
- **Order preservation as invariant.** Results yielded in *submission* order, not *completion* order — preserves coherent conversation history.
- **Three-tier abort hierarchy.** Query controller → sibling controller → per-tool controller. Aborts can bubble.
- **Selective error cascade.** Only Bash errors cancel siblings (implicit pipelines `mkdir && cp && tar`). Read/Grep/Fetch errors are independent.
- **Context modifiers are serial-only.** Parallel batches: deferred and applied in submission order AFTER batch completes.
- **Speculative execution** begins as soon as a `tool_use` block fully parses out of streaming response.

### Key patterns
- `Group = { parallel: boolean; calls: ToolCall[] }` — partition output.
- `partitionToolCalls()` is left-to-right `reduce`: merges consecutive safe tools, breaks on unsafe.
- `StreamingToolExecutor.addTool(block, msg)` is synchronous; pushes `TrackedTool { status: 'queued'|'executing'|'completed'|'yielded' }`, calls `void this.processQueue()` (fire-and-forget).
- `canRun = noToolsRunning || (newToolIsSafe && allRunningAreSafe)`.
- Two harvest methods: `getCompletedResults()` (sync gen, mid-stream) and `getRemainingResults()` (async gen, post-stream drain via `Promise.race(toolPromise, progressSignal)`).
- `MAX_CONCURRENCY = 10`, configurable via `CLAUDE_CODE_MAX_TOOL_USE_CONCURRENCY`.

### Surprises
- `addTool()` is intentionally fire-and-forget. Awaiting `processQueue` would stall streaming parser.
- Bash error cascade is asymmetric to Read/Grep.
- **`tool_use_id`s and submission order are load-bearing for the model.** Cost of buffering > cost of reordering.
- Order break in `getCompletedResults` only applies to serial tools.
- Interruptibility is conjunctive — one `'block'` tool poisons the whole set.
- Cancel synthetic message includes 40 chars of errored sibling's command for context.

---

## Chapter 8 — Spawning Sub-Agents

**Topic:** `Agent` tool definition, fifteen-step `runAgent()` lifecycle, flag-driven type registry — every agent variant flows through the same universal lifecycle function.

### Core concepts
- **The Agent tool is a model-facing dispatch surface.** Registered as `"Agent"` (legacy alias `"Task"`).
- **Schema is feature-flag-shaped, not just feature-flag-validated.** Fields are *omitted* (not just disabled) when flags are off. Model cannot misuse what it cannot see.
- **`runAgent()` is universal.** ~400-line async generator with 17 parameters drives every variant — fork, built-in, custom, sync, async, worktree-isolated, coordinator-worker.
- **Routing in `call()` vs lifecycle in `runAgent()`.** `call()` makes routing decisions; `runAgent()` receives resolved definition and executes.
- **Resolution-chain principle:** explicit override > declaration > inheritance > default.
- **Sync vs async asymmetry.** Sync agents share parent's abort controller (Escape kills both) and `setAppState`. Async agents get independent controllers but share `setAppStateForTasks`.

### The 15 steps
1. **Model resolution** — `getAgentModel(agent.model, parent.mainLoopModel, callerOverride, permissionMode)`.
2. **Agent ID creation** — `agent-<hex>` from `crypto.randomUUID()`.
3. **Context preparation** — fork: clone parent messages through `filterIncompleteToolCalls()` (strips orphan `tool_use` lacking `tool_result`).
4. **AGENTS.md stripping** for `omitCodexMd: true` agents (Explore, Plan). Also strips gitStatus (40KB stale snapshot).
5. **Permission isolation** — wrapper `getAppState()` overlays mode cascade, prompt avoidance, automated checks, tool allow-rule scoping.
6. **Tool resolution** — `useExactTools` → parent's exact array (fork). Else filter by `tools[]/disallowedTools[]`, then `ASYNC_AGENT_ALLOWED_TOOLS` if async.
7. **System prompt** — `override.systemPrompt` (fork — already-rendered bytes) OR `getAgentSystemPrompt()` (fresh).
8. **Abort controller** — override > async (new unlinked) > sync (parent's).
9. **Hook registration** via `registerFrontmatterHooks()` with `isAgent: true` (converts `Stop` → `SubagentStop`).
10. **Skill preloading** (3 resolution strategies, concurrent via `Promise.all`).
11. **MCP initialization** — reference-by-name (shared/memoized) vs inline (cleaned up in `finally`).
12. **Context creation** via `createSubagentContext()`.
13. **Cache-safe params callback** for background summarization.
14. **Query loop.** Same `query()` drives the agent. Each yielded message recorded via `recordSidechainTranscript()`.
15. **Cleanup `finally`** — 8-stage tear-down. **Returning the iterator triggers `finally` deterministically — generator architecture is for cleanup correctness, not just streaming.**

**Fork guards (recursion prevention):** primary = `querySource === 'agent:builtin:fork'` (survives autocompact); fallback = scan messages for `<fork-boilerplate>` tag.

### Surprises
- **Schema-shape-by-flag pattern.** `run_in_background` literally disappears from Zod schema when fork is active.
- **Attachment-based agent list.** Dynamic agent lists are an *attachment message*, not in tool description. Internal data: ~10.2% of fleet `cache_creation` tokens were attributable to dynamic tool descriptions. Moving them to attachments preserves prompt cache.
- `filterIncompleteToolCalls` is mandatory for fork — API rejects orphan `tool_use`.
- gitStatus is up to 40KB and explicitly labeled stale.
- **Thinking is disabled for non-fork agents.** "The parent pays for thinking; the children execute."
- **`Agent` tool is removed from default disallowed list of every spawned child** — prevents exponential fan-out.
- Verification agent has anti-avoidance prompting + `criticalSystemReminder_EXPERIMENTAL` reinjects after every tool result.
- **One-shot Explore optimization saves 135 chars × 34M invocations/week ≈ 4.6 billion characters/week** of saved prompt tokens.
- `initialMessages.length = 0` is manual GC hint — releases ~1MB per child of duplicated message references.
- Plan agent uses `'inherit'` model deliberately — Haiku-class plans would mislead Opus-class executors.
- Coordinator mode replaces all built-ins with single `worker` agent.

---

## Chapter 9 — Fork Agents and the Prompt Cache

**Topic:** Fork agents as a prompt-cache exploitation engine — restructure parallel sub-agent dispatch around byte-identical API request prefixes to claim the 90% cached-input discount.

### Core concepts
- **Cache hits are byte-exact.** Not similar, not semantically equivalent.
- **The 99.75% overlap insight.** Five parallel children spawned from same parent share ~80,000 prefix tokens; only ~200 tokens of per-child directive differ.
- **Three frozen layers** for prefix identity:
  1. System prompt threaded as bytes, not regenerated.
  2. Tool array passed exactly through, not refiltered/reordered.
  3. Message array carefully constructed so divergence boundary falls right before per-child directive.
- **`buildForkedMessages()` constructs divergence boundary** with a constant placeholder result (`'Fork started -- processing in background'`) for every parent `tool_use` block.
- **Fork boilerplate XML tag** wraps each child's directive — both behavioral guidance ("you ARE the fork, do NOT spawn") AND a recursion-detection marker.
- **Sync-to-async transition without losing work** — foreground fork can be backgrounded mid-execution by racing iterator against a background signal.
- **Trades architectural cleanliness for cache hit rate.** Several decisions deliberately less elegant or less safe to preserve byte identity.

### Key patterns
- Fork agent definition: `tools: ['*']`, `model: 'inherit'`, `permissionMode: 'bubble'`, system-prompt function is a no-op (real prompt arrives via `override.systemPrompt`).
- `useExactTools: true` flag bypasses `resolveAgentTools()` entirely.
- `FORK_PLACEHOLDER_RESULT = 'Fork started -- processing in background'` — constant.
- Message array post-`buildForkedMessages()`: `[...shared_history, assistant(all_tool_uses), user(placeholder_results..., wrapped_directive)]`.
- `querySource = 'agent:builtin:fork'` survives autocompact.
- Auto-background timeout: 120 seconds, gated by `CLAUDE_AUTO_BACKGROUND_TASKS`.

### Mechanisms
**Layer 1 — System prompt threading:** Parent's *rendered* prompt captured to `toolUseContext.renderedSystemPrompt`. Fork child receives via `override.systemPrompt`. Agent's `getSystemPrompt()` never invoked — preventing re-renders that could diverge if GrowthBook flags transitioned cold→warm.

**Layer 2 — Tool array exact passthrough:** `useExactTools` short-circuits filtering. Includes the `Agent` tool itself even though child must not use it.

**Layer 3 — Message construction (`buildForkedMessages`):**
1. Clone parent's assistant message (preserve all `tool_use` block IDs).
2. For each `tool_use`, emit `tool_result(id, FORK_PLACEHOLDER_RESULT)`.
3. Build single user message: `[...placeholderResults, wrapDirective(directive)]`.

**Recursive fork prevention:** primary = `querySource` check (single string compare). Fallback = message history scan for `<fork-boilerplate>` tag. Belt-and-suspenders.

**Sync→async transition:**
1. `registerAgentForeground()` creates background signal promise.
2. Parent loop races `iterator.next()` against `backgroundSignal`.
3. On signal: call `iterator.return()` → triggers runAgent's `finally`.
4. Spawn new `runAgent({ isAsync: true, agentId: <same> })` with accumulated history.
5. Original `call()` returns `{ status: 'async_launched' }`. No work lost.

### Surprises
- **Fork is excluded in 3 cases:** coordinator mode (mutually exclusive), non-interactive sessions (no terminal for `bubble`), explicit `subagent_type`.
- **Placeholder result is a documented lie.** Every child sees `'Fork started -- processing in background'` for every parent tool call, regardless of what those tools actually did. Brevity + uniformity > accuracy.
- **Agent tool intentionally retained in fork children's pools.** Removing it would change tool array serialization → cache miss. Compensating control: runtime guards.
- **Rule 1 of fork boilerplate explicitly contradicts inherited parent prompt.** Parent says "default to forking when you have parallel work"; boilerplate says "you ARE the fork." Override happens at directive layer.
- **Concrete economics:** 48,500-token prefix, 200-token directive, five children. Without fork = 5× full input. With fork = 1× full + 4× (cached@10%). 4 children pay ~5,050 tokens-equivalent each instead of 48,700 — ~90% reduction.
- **Fork inherits "irrelevant" history deliberately.** Stripping would bust cache. Bet: cache savings > context-window cost.

---

## Chapter 10 — Tasks, Coordination, Swarms

**Topic:** Layered orchestration stack: unified `Task` state machine underpins three composable patterns — background delegation, hierarchical coordinator mode, peer-to-peer swarms — glued by `SendMessage` routing primitive.

### Core concepts
- **Unified Task abstraction (`Task.ts`).** Every async unit (shells, sub-agents, remote agents, swarm teammates, workflows, MCP monitors, dreams) is a `Task`.
- **Seven task types, single-letter ID prefixes:** `local_bash` (b), `local_agent` (a), `remote_agent` (r), `in_process_teammate` (t), `local_workflow` (w), `monitor_mcp` (m), `dream` (d) + 8 random alphanumeric chars.
- **Five-status DAG**: `pending → running → {completed | failed | killed}`. `isTerminalTaskStatus()` is universal liveness guard.
- **Three communication channels:** disk output files (incremental read via `outputOffset`), XML task notifications injected as user-role messages, `pendingMessages[]` queue drained at tool-round boundaries.
- **Coordinator mode** = "thinking" agent split from "doing" agents. Coordinator gets exactly 3 tools (Agent, SendMessage, TaskStop). Workers get full toolset minus internal tools. `CLAUDE_CODE_COORDINATOR_MODE` env var.
- **Swarm system** = peer-to-peer alternative. `teamContext` with named, color-coded teammates. File-based mailbox, plan approval gate, cooperative shutdown.
- **Auto-resume in SendMessage.** Sending message to dead/killed agent transparently resurrects it from disk transcript.
- **Mutual exclusion of orchestration philosophies:** coordinator mode disables fork subagents at flag level — opposing delegation models.

### Mechanisms
**Foreground→Background transition (`Promise.race` escape hatch):** Each iteration of sync agent loop races `agentIterator.next()` against `backgroundPromise`. If background wins: cleanly call `agentIterator.return(undefined)`, re-spawn `runAgent({...params, isAsync: true})` with fresh abort controller, flip `isBackgrounded`, return `{ status: 'async_launched' }`. Atomic.

**Coordinator's four-phase workflow** (encoded in 370-line system prompt): Research → Synthesis (coordinator alone reads results) → Implementation (workers receive *specific* prompts with file paths) → Verification. Dominant failure: skipping synthesis → coordinator delegates *comprehension*.

**Continue-vs-spawn decision** (function of context overlap):
- High overlap, same files → continue (preserves cached file contents)
- Low overlap, different domain → spawn fresh
- High overlap but worker failed → spawn fresh + explicit failure guidance
- Follow-up needs prior output → continue, include output in SendMessage

**Auto-resume from disk:** read sidechain JSONL → reconstruct message history filtering orphans → rebuild content-replacement state for cache stability → re-resolve agent definition → re-register as background task → call `runAgent()`.

### Surprises
- **Cumulative vs summed tokens.** Input tokens are *latest value* (full convo re-sent each call); output tokens are *summed* (per-turn generation).
- **50-message UI cap saved 36GB RSS.** "Whale session" launched 292 agents in 2 min → 36.8GB RSS. Cap truncates UI snapshot only; conversation keeps full history.
- **Notification dedup via `notified` flag** — task completing between two queue polls would generate duplicate notifications.
- **Naming collision footgun:** `TaskStop` operates on `AppState.tasks` (runtime task system); `TaskCreate/Get/List/Update` operate on a *separate* todo-list project tracker.
- **Bridge messages require explicit consent** — prevents compromised agent from unilaterally exfiltrating to remote session.
- **Scratchpad solves coordinator-as-bottleneck:** workers move information by *reference* (file paths) not *value* (through coordinator's token window).
- `shutdownRequested` is cooperative; teammates can refuse if mid-critical-work.

---

## Chapter 11 — Memory: Learning Across Conversations

**Topic:** Cross-session memory — Markdown files on disk, four-type taxonomy, Sonnet-powered LLM relevance instead of vectors, layered always-loaded index + on-demand body.

### Core concepts
- **Files-not-databases bet.** `~/.agents/projects/<sanitized-git-root>/memory/MEMORY.md` + `<type>_<topic>.md`. Inspectable with `ls`/`cat`, editable with `vim`, deletable with `rm`, version-controllable with git, zero infrastructure.
- **Tool reuse as architectural principle.** No memory API. Model uses same `FileWriteTool`/`FileEditTool` it uses for source. Memory is *emergent behavior* under new instructions.
- **Four-type taxonomy as filter:** `user`, `feedback`, `project`, `reference`. Filter criterion: *is this knowledge derivable from current project state?* Code patterns, architecture, git history, debug solutions are EXCLUDED — re-deriving keeps model grounded.
- **Two-tier recall:** `MEMORY.md` index (always loaded, capped 200 lines/25KB) + on-demand topic files. 150 memories = 150-line index ≈ 3K tokens, not 100K of full bodies.
- **LLM-powered relevance** instead of keywords/embeddings. Sonnet side-query reads frontmatter manifests, returns `{ selected_memories: string[] }` (≤5 per turn). Async-prefetched.
- **Per-project scoping via canonical git root.** `findCanonicalGitRoot()` ensures all worktrees share one memory dir.
- **Staleness warnings, not expiration.** Memories never auto-delete. Age caveats injected ("47 days ago" triggers staleness reasoning where ISO timestamps don't).
- **Background extraction agent.** Forked at end of query loop, shares parent prompt cache, read-only tools + write access scoped to memory paths. Two-turn strategy: parallel reads, then parallel writes. Cooperative — defers when main agent already saved.
- **KAIROS mode** (long-running sessions): separates capture (append-only daily logs, never reorganize) from consolidation (`/dream` command, behind PID-based lock).

### Frontmatter contract
```yaml
---
name: Testing Policy
description: Integration tests must hit real DB, not mocks
type: feedback
---
Don't mock the database in integration tests.
**Why:** burned last quarter when mocked tests passed but production hit edges.
**How to apply:** Any test under `__tests__/` touching DB → use real PGlite.
```

Index entry: `- [Testing Policy](feedback_testing.md) -- integration tests must hit real DB`

### Mechanisms
**Path resolution priority chain:** (1) `CLAUDE_COWORK_MEMORY_PATH_OVERRIDE`, (2) `autoMemoryDirectory` in trusted settings (policy/flag/local/user only — *project settings excluded*), (3) default.

**Recall pipeline:** session start loads `MEMORY.md`. Per turn: (1) `scanMemoryFiles()` reads each file's first ~30 lines (frontmatter only); (2) async-prefetch Sonnet side-query with manifest + system prompt: "include only useful, skip if uncertain, don't select API docs for tools already loaded but DO surface gotchas"; (3) structured output `{ selected_memories: string[] }`; (4) filenames validated; (5) selected files loaded with staleness caveats for memories > 1 day old.

**Three-layer path-traversal defense for team memory:** (1) `sanitizePathKey()` rejects null bytes, URL-encoded traversals, Unicode normalization attacks, backslashes, absolute paths; (2) `path.resolve()` + prefix check with trailing separator; (3) `realpathDeepestExisting()` on deepest existing ancestor (catches `team/evil → /etc/`). All failures throw `PathTraversalError` — fail closed.

**KAIROS consolidation phases:** Orient → Gather → Consolidate (write/update, *merge into existing files*) → Prune (keep index < 200 lines).

### Surprises
- **Empirical eval-driven prompt phrasing.** "Before recommending from memory" scored 3/3 vs "Trusting what you recall" 0/3 — same body, different action-cue framing. Override-when-asked-to-save pattern went 0/2 → 3/3 when override instruction added.
- **25KB byte cap exists because of 200-line cap abuse.** P97 had 197 lines but 197KB.
- **Project settings intentionally excluded from `autoMemoryDirectory` override.** Malicious repo committing `.agents/settings.json` with `autoMemoryDirectory: "~/.ssh"` would gain auto-write to SSH keys.
- **Frontmatter scan reads only first 30 lines** — body is genuinely private until selected. Why `description` is the load-bearing field.
- **Selection-rate telemetry distinguishes precision vs coverage:** 0/150 = precision (saving too much), 0/3 = coverage (not saving enough).
- **Save-correction AND save-confirmation** — saving only corrections drifts model away from validated approaches.
- **KAIROS path is a pattern, not literal date** to avoid midnight cache invalidation.
- **Memories are hypotheses, not facts** — philosophical underpinning of staleness system.

---

## Chapter 12 — Extensibility: Skills and Hooks

**Topic:** Two cleanly separated extension axes — skills (capability via injected content) and hooks (control via lifecycle interception).

### Core concepts
- **Content vs control flow split.** Skills add *what* the model can do; hooks constrain *when/how*.
- **Two-phase skill loading.** Phase 1 at startup: read frontmatter only, body in closure. Phase 2 on invocation: full content + variable substitution + inline `!`-prefixed shell commands. 50 skills = 50 short descriptions in tokens, not 50 full bodies.
- **Seven skill sources, priority-ordered:** managed/policy, user, project, `--add-dir`, legacy commands, bundled, MCP server prompts. First-seen wins after `realpath`-based dedup (handles symlinks, NFS/ExFAT).
- **MCP security boundary is absolute.** MCP skills *never* execute inline shell. `` !`rm -rf /` `` in MCP prompt would otherwise run with user permissions.
- **Six hook types:** Command (shell + stdin JSON + exit code), Prompt (single LLM call returning `{ok}`), Agent (full multi-turn loop, max 50 turns, dontAsk perms, thinking off), HTTP (POST to URL), Callback (internal, programmatic, **fast-path -70% overhead**), Function (session-scoped TS callbacks).
- **Five dominant lifecycle events:** PreToolUse (deny>ask>allow precedence), PostToolUse, Stop (block to force continuation — single-shot becomes goal-directed loop), SessionStart, UserPromptSubmit. 24+ total.
- **Exit code semantics:** 0 = success (stdout parsed if JSON), **2 = blocking error** (stderr → system message), other = non-blocking warning. Exit 2 chosen because exit 1 is ambient noise.
- **Snapshot security.** `captureHooksConfigSnapshot()` runs once at startup. `executeHooks()` only reads snapshot. Eliminates TOCTOU.
- **Policy cascade:** `disableAllHooks` clears everything; `allowManagedHooksOnly` excludes user/project; users can disable own hooks but cannot override enterprise.

### Skill frontmatter
```yaml
name: my-skill
description: shown in autocomplete + system prompt
when_to_use: detailed scenarios for model discovery
allowed-tools: ['Bash', 'Read']
disable-model-invocation: false
user-invocable: true              # both true → invisible (hooks-only skill)
context: 'fork'                   # run as sub-agent w/ own context
paths: 'packages/database/**'     # conditional activation glob
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/validate.sh"
          once: true              # self-removes after first run
```

### Mechanisms
**Two-phase skill loading:** Startup → enumerate sources in parallel → split YAML frontmatter from body. On invocation: lookup closure → `getPromptForCommand(baseDir, args)` → variable substitution (`$ARGUMENTS`, `${CLAUDE_SKILL_DIR}`) → execute backtick-`!` shell commands (skip if MCP source).

**Hook execution flow with fast path.** `executeHooks(event, input)` → trust-check gate (`shouldSkipHookDueToTrust()` — added after vulnerabilities) → policy cascade → matcher filter → if all matched are internal callbacks: skip span tracking + abort signal + progress messages (-70% overhead) → else parallel execution with shared lazy `getJsonInput()` → merge per precedence (deny > ask > allow).

**Stop hook continuation loop.** Stop fires before Codex concludes. If hook returns exit 2, stderr becomes feedback shown to model and conversation continues. **Single-shot prompt-response → goal-directed loop.**

**Skill→hook lifecycle conversion.** When skill declares `Stop` hook and is invoked from sub-agent context, registration auto-converts to `SubagentStop`. Sub-agents fire `SubagentStop`, not `Stop`.

### Surprises
- **Exit 2 chosen specifically against accidental blocking.** Exit 1 too ambient.
- **Two-vulnerability-driven trust check.** SessionEnd hooks fired even when users *declined* trust dialog; SubagentStop fired before trust was presented.
- **`disable-model-invocation: true` + `user-invocable: true` = invisible skill.** Pattern for skills that exist purely to register hooks.
- **Stop hook is "the most powerful integration point."** Turns conversation into verifiable loop — automated quality gates the model cannot bypass by claiming completion.
- **MCP prompts ARE skills (source #7)** but with inline-shell-execution carve-out as security boundary.
- **`once: true` on a skill-declared hook** — self-removing for one-shot validation.
- **`realpath` for skill dedup, not inodes** — inode equality unreliable on container/NFS/ExFAT mounts.
- **Plugin hooks at priority 999 (lowest).** Plugins explicitly cannot override user/project/policy.

---

## Chapter 13 — Terminal UI

**Topic:** Forked Ink retaining React + Yoga but rewriting the critical path with packed typed-array cell buffers, pool-based string interning, double buffering, cell-level diffing — to sustain 60fps streaming on 200-column terminals.

### Core concepts
- **Custom DOM with 7 element types:** `ink-root`, `ink-box` (flexbox), `ink-text` (with Yoga measure function), `ink-virtual-text` (auto-promoted nested styled text), `ink-link` (OSC 8), `ink-progress`, `ink-raw-ansi` (pre-highlighted code blocks bypass per-character decomposition).
- **Why handlers are separate from attributes.** React handler identity churns every render. If stored as attributes, every render dirties node and forces full repaint. Storing separately lets `commitUpdate` swap handlers without `dirty=true`.
- **`markDirty()` walks ancestor chain.** Single character change dirties path-to-root only — sibling subtrees stay clean and become blit candidates next frame.
- **ConcurrentRoot mode + `react-reconciler`.** Enables Suspense (lazy syntax highlighting) and transitions.
- **Packed-cell buffer (central optimization).** Two `Int32` words per cell, stored in `Int32Array`, parallel `BigInt64Array` view for bulk row clears. 24,000 cells on 200×120 grid = contiguous typed array, not 24,000 JS objects.
- **Three interning pools shared across frames.** `CharPool` (fast-path 128-entry `Int32Array` for ASCII, `Map` fallback for emoji/CJK), `StylePool`, `HyperlinkPool`. Sharing across front/back frames is required for blit to copy packed words without re-interning.
- **Double-buffer with 60fps throttle.** `frontFrame` displayed, `backFrame` rendered into; swap is pointer assignment. `lodash.throttle(deferredRender, 16ms, {leading: true, trailing: true})`.

### Cell layout
- `word0: charId (32b)`
- `word1: styleId[31:17] | hyperlinkId[16:2] | width[1:0]`
- Width in low 2 bits = free width check.
- StylePool encodes "visible-on-space" in bit 0 of style ID: even = foreground-only (skippable on space cells), odd = visible. Skip predicate: `if (!(styleId & 1) && charId === 0) continue`.

### 7-stage frame pipeline
1. **React commit + Yoga layout.** `resetAfterCommit` runs `yogaNode.calculateLayout()`.
2. **DOM-to-screen** writes packed cells into `Screen` buffer.
3. **Overlay.** Selection/search highlight mutates style IDs in place via `StylePool.withSelectionBg()`. Sets `prevFrameContaminated = true`. Saves 48KB versus separate overlay buffer at cost of one full-damage frame on overlay clear.
4. **Diff** cell-by-cell against front frame, walking only `damage` rectangle. Two `Int32` comparisons per cell. Steady-state spinner = 3 patches out of 24,000 cells.
5. **Optimize.** Merge adjacent same-row patches; eliminate redundant cursor moves; use cached `StylePool.transition()` strings. 30-50% byte reduction.
6. **Write.** Single `stdout.write()` wrapped in BSU/ESU (`ESC[?2026h` / `ESC[?2026l`) on capable terminals — atomic frame, no tearing.
7. **Swap.** `backFrame ↔ frontFrame`.

**Blit fast path** (dominant performance win): when node not dirty and position hasn't shifted (checked via `nodeCache`), copy cells directly from `prevScreen` to current. Disabled when (a) `prevFrameContaminated`, (b) absolute-positioned node was removed, (c) cached node position differs.

**Pool reset cycle.** Every 5 minutes, fresh pools created; live cells re-interned; old pools become garbage. Generational GC at application level — JS GC has no visibility into pool entry liveness.

### Surprises
- **`useInsertionEffect`, not `useLayoutEffect`, for alt-screen entry.** `ENTER_ALT_SCREEN` must reach terminal before first frame; layout effects would be one frame late.
- **Microtask deferral of render is load-bearing.** `resetAfterCommit` runs before React's layout effects. Synchronous render here would miss cursor declarations set in `useLayoutEffect`. Microtask runs after layout effects but within same event-loop tick.
- **Resize is synchronous, not debounced.** For alt-screen, `ERASE_SCREEN` is *deferred* into next BSU/ESU block — writing immediately would leave screen blank ~80ms.
- **Scroll path bypasses React entirely.** `ScrollBox.scrollBy()` mutates DOM properties directly + `markDirty()` + microtask render. No reconciliation.
- **`OffscreenFreeze`.** Off-screen messages cached and frozen so spinner ticks in message #3 don't repaint when user looking at message #47.
- **React Compiler everywhere** — slot-array memoization finer than `useMemo`.
- **Memory locality > allocation count.** `Int32Array` diff fits L1/L2 cache → <0.5ms; object-per-cell would be 3-5ms from cache misses alone.

---

## Chapter 14 — Input and Interaction

**Topic:** Reverse path — stdin bytes → typed actions through tokenizer → multi-protocol parser → keybinding resolver (with chord state machine) → typed handler.

### Core concepts
- **Five terminal protocols simultaneously:** CSI u (Kitty, modern), xterm modifyOtherKeys (fallback), legacy VT100/VT220/xterm, SGR mouse, bracketed paste.
- **Progressive enhancement, never error.** Modern terminals get full Ctrl+Shift+A vs Ctrl+A distinction and Cmd shortcuts; legacy/SSH lose modifier distinctions but `ctrl+r` still works.
- **Tokenizer state machine with timeout.** Lone `ESC` is ambiguous (Escape key vs CSI prefix). Buffer + 50ms timer; before flushing on timeout, check `stdin.readableLength` — if bytes are kernel-buffered, re-arm the timer. Bracketed paste uses 500ms.
- **Discriminated union for parser output.** `ParsedKey | ParsedMouse | ParsedResponse`. Terminal responses (DA1/DA2, kittyKeyboard, cursorPosition, OSC, XTVERSION, DECRPM) routed to `TerminalQuerier`, never to input handlers.
- **stdin raw mode with reference counting.** Multiple components each enable raw mode; counter increments. Disables only at zero. Solves classic terminal-app bug.
- **Keybinding system separates 3 concerns.** Bindings (data), handlers (code), contexts (16 active scopes). User overrides in `~/.agents/keybindings.json` use "last wins."
- **Chord state machine.** Multi-key sequences like `ctrl+x ctrl+k`. State machine + 1000ms timeout. `ChordInterceptor` + `pendingChordRef` (synchronous, not React state) prevents second keystroke from being processed before first's state update.
- **Vim mode as exhaustively-typed state machine.** 12-variant `CommandState` discriminated union; transitions are pure functions returning `{ next?, execute? }`.

### Key patterns
- `ParsedKey { kind: 'key'; name; ctrl; meta; shift; option; super; sequence; isPasted }`. `meta` = Alt/Option (bit 2), `super` = Cmd (bit 8) — distinct fields.
- 16 contexts: Global, Chat, Autocomplete, Confirmation, Scroll, Transcript, HistorySearch, Task, Help, MessageSelector, MessageActions, DiffDialog, Select, Settings, Tabs, Footer.
- Reservation tiers: **non-rebindable** (`ctrl+c`, `ctrl+d`, `ctrl+m`); **terminal-reserved warnings** (`ctrl+z`, `ctrl+\`); **macOS-reserved errors** (`cmd+c/v/x/q/w/tab/space`).
- Vim `CommandState`: 12 variants — `idle`, `count`, `operator`, `operatorCount`, `operatorFind`, `operatorTextObj`, `find`, `g`, `operatorG`, `replace`, `indent`.
- `TransitionResult { next?: CommandState; execute?: () => void }` — pure transition; effect is closure returned, not run.
- `PersistentState { lastChange: RecordedChange; lastFind; register; registerIsLinewise }` — survives across commands. Drives `.` (dot-repeat), `;`/`,` (find repeat), `p`/`P` linewise paste.

### Mechanisms
**Key parsing pipeline:** Tokenizer emits complete escape sequences. Protocol parser dispatches: CSI u (`ESC[codepoint;modifier u`), modifyOtherKeys (`ESC[27;modifier;keycode~` — note **reversed param order**, frequent bug), legacy regex, SGR mouse, bracketed paste. Bracketed-paste content gets `isPasted: true` regardless of escape sequences inside; resolver skips keybinding match (security: `\x03` in pasted code shouldn't trigger Ctrl+C). All keys from one read processed in single `reconciler.discreteUpdates()` — 100-char paste = one render not 100.

**Keybinding resolution:** Build context list (rebuilt every keystroke, ~16 strings, cheap). `resolveKeyWithChordState(input, key, contexts)`. Outcomes: `match`, `chord_started` (1000ms timeout), `chord_cancelled`, `unbound`, `none`.

**Vim transitions** (`fromIdle`): digits 1-9 → `count`; `0` is "start of line" unless digits accumulated; `d/c/y` → `operator`; `f/F/t/T` → `find`; `g` → composite prefix; motion characters execute immediately. Motions classified as **exclusive** (default — `dw` excludes destination), **inclusive** (`e`, `E`, `$`), **linewise** (`j`, `k`, `G`, `gg`).

**Virtual scrolling.** Height cache per message (invalidated on column resize); `useVirtualScroll` mounts only viewport-visible + buffer; scroll mutates DOM directly + microtask render. `markScrollActivity()` is cooperative scheduling flag.

### Surprises
- **`stdin.readableLength` re-arm.** 50ms timeout *checks kernel buffer before flushing*; re-arms if bytes queued but unread.
- **stdin-gap detector.** No input for 5 seconds → re-assert terminal modes (Kitty keyboard, modifyOtherKeys, bracketed paste, focus reporting). Handles tmux reattach and laptop wake.
- **Multiplexer wrapping.** Inside tmux, certain sequences need DCS passthrough (`ESC P ... ST`).
- **XTVERSION query for terminal identity** — survives SSH (unlike `TERM_PROGRAM` env var).
- **`onExit` cleanup is mandatory.** Crash without restoring raw mode + cursor + alt-screen exit leaves user typing blindly until `reset`.
- **`isPasted` flag is security primitive.** Skips keybinding match — pasted `\x03` is text, not Ctrl+C.
- **modifyOtherKeys param order is reversed** vs CSI u — frequent parser bug.
- **Cmd shortcuts only work on Kitty protocol** — other protocols silently swallow super-modified keys.
- **DECXCPR specifically requested for cursor disambiguation** (private marker `?`).
- **Vim register linewise flag.** Yanked content ending in `\n` → `p` inserts below, `P` above. Critical for "delete line, paste" workflow.
- **`[Image #N]` chip snapping** — word motions snap to entire chip; can't half-delete.

---

## Chapter 15 — MCP: The Universal Tool Protocol

**Topic:** Implementation of Model Context Protocol — JSON-RPC 2.0 contract for tool discovery (`tools/list`) and invocation (`tools/call`). Eight transports, seven config scopes, full OAuth 2.0+PKCE with two-RFC discovery.

### Core concepts
- **Minimal protocol surface, maximal engineering around it.** Spec is 2 JSON-RPC methods + JSON Schema. Everything else is implementation glue.
- **Eight transports:** `stdio` (default for local subprocesses; backwards-compatible when `type` omitted), `http` (Streamable HTTP — current spec recommendation), `sse` (legacy but widely deployed), `ws-ide` (WebSocket with Bun/Node runtime split), `sdk`, IDE, `codexai-proxy`, `inProcess`.
- **Seven config scopes merged with content-based dedup.** `local`, `user`, `project`, `enterprise`, `managed`, `codexai`, `dynamic`. `getMcpServerSignature()` produces canonical key (`stdio:["command","arg1"]` or `url:https://...`) — two configs with different *names* but same signature deduped.
- **Tool wrapping makes MCP indistinguishable from built-ins.** Same `Tool` interface from Ch 6.
- **OAuth 2.0+PKCE with two-RFC discovery chain.** RFC 9728 + RFC 8414, with `authServerMetadataUrl` escape hatch. Cross-App Access (XAA) via federated IdP.
- **Five connection states:** `connected`, `failed`, `needs-auth` (with 15-min TTL cache), `pending`, `disabled`.
- **Layered timeouts:** Connection 30s, per-request 60s (recreated fresh), tool-call ~27.8 hours, auth 30s.

### Key patterns
- Tool name FQN: `mcp__{serverName}__{toolName}`; valid chars `^[a-zA-Z0-9_-]{1,64}$`.
- Description cap: **2,048 chars**. OpenAPI-generated servers seen dumping 15-60KB → ~15K tokens/turn for one tool.
- Annotation map: `readOnlyHint` → safe for concurrent execution; `destructiveHint` → extra permission scrutiny.
- `InProcessTransport.send()` uses `queueMicrotask(() => this.peer?.onmessage?.(message))` — prevents stack-depth blowup. Whole class is 63 lines.
- Session-expiry detection: HTTP 404 + JSON-RPC `-32001`. String inclusion check for both `'"code":-32001'` and `'"code": -32001'` — pragmatic but admittedly fragile.
- Local-server connection batches: 3 (subprocess fd exhaustion); remote: 20.

### Mechanisms
**Tool wrapping (4 stages):** name normalization → description truncation (2,048-char cap) → schema passthrough (no wrapping-time validation; errors surface at call time) → annotation mapping with explicit acknowledgment that malicious server marking destructive tools as read-only is an accepted attack vector.

**OAuth discovery chain:** server metadata URL configured? Use it. Else try RFC 9728. Fall back to RFC 8414. Run PKCE-protected flow. With XAA: federated token exchange across multiple servers.

**Error body normalization (`normalizeOAuthErrorBody`):** Slack returns HTTP 200 for OAuth errors with error string in JSON body. Function peeks at 2xx POST bodies; if matches `OAuthErrorResponseSchema` but not `OAuthTokensSchema`, rewrite response to HTTP 400. Normalizes Slack-specific codes (`invalid_refresh_token`, `expired_refresh_token`, `token_expired`) → standard `invalid_grant`.

**Per-request timeout fix.** Old: shared `AbortSignal.timeout(60000)` → after 60s idle, next request aborts immediately. New: `wrapFetchWithTimeout()` creates fresh signal per request + normalizes `Accept` header.

### Surprises
- **`stdio` is implicit default** when `type` omitted.
- **Content-based dedup, not name-based** — silently suppresses duplicate plugin-provided servers.
- **15-60KB tool descriptions in the wild.** OpenAPI-to-MCP converters dump entire spec text.
- **Annotation trust boundary acknowledged, not closed.** Worth understanding when threat-modeling MCP.
- **Slack-specific OAuth violations baked in** — HTTP 200 with error body, non-standard refresh-token error codes.
- **String-inclusion check for JSON-RPC error code** — explicitly called out as pragmatic but fragile.
- **In-process transport via `queueMicrotask`** — without it, synchronous req/resp could blow the stack.
- **Bun vs Node runtime split for `ws-ide`** — Bun's `WebSocket` natively accepts proxy/TLS; Node needs the `ws` package.
- **15-minute `needs-auth` cache.** Without it, 30 connected servers would each independently rediscover same expired token.

---

## Chapter 16 — Remote Control and Cloud Execution

**Topic:** Four transport topologies (Bridge v1, Bridge v2, Direct Connect, Upstream Proxy) that let the agent be driven from a browser, run inside a cloud container, or expose itself on a LAN — without changing core loop.

### Core concepts
- **Asymmetric transport (central design).** Reads use persistent connection (WebSocket/SSE) for high-frequency server-pushed token streams; writes go over plain HTTP POST for low-frequency, ack-required RPCs. Two channels, optimized independently.
- **Bridge v1 — registration + long-poll dispatch.** `codex remote-control` registers with Environments API, long-polls for sessions/healthchecks, spawns a child Codex per session. NDJSON over stdin/stdout. Pre-flight gauntlet: feature gate → OAuth check → org policy → dead-token cross-process backoff (3 fails on same expired token) → proactive refresh saves ~9% of first-attempt registrations.
- **Bridge v2 — collapsed lifecycle, no Environments API.** Three steps: `POST /v1/code/sessions` → `POST /sessions/{id}/bridge` (returns `worker_jwt`, `api_base_url`, `worker_epoch`) → open SSE for reads + `CCRClient` for writes. **No registration, no polling, no heartbeat, no deregistration.**
- **`ReplBridgeTransport` abstraction** — unifying interface so message router doesn't know whether v1 or v2 underneath.
- **Echo deduplication via two `BoundedUUIDSet`s.** `recentPostedUUIDs` and `recentInboundUUIDs`, capacity 2000 each.
- **FlushGate — ordering during history replay.** When bridge flushes conversation history, live writes from web UI must not interleave; FlushGate queues them and drains in order.
- **Epoch-based split-brain prevention.** 409 epoch mismatch on either connection closes both — no silent two-worker state.
- **Direct Connect** — local server topology. Five session states (`starting`, `running`, `detached`, `stopping`, `stopped`), persisted to `~/.agents/server-sessions.json`, addressed by `cc://` URL scheme. No OAuth.
- **Upstream Proxy** — credential injection inside containers. Local CONNECT-to-WebSocket relay that injects org credentials into outbound HTTPS while defending the token against same-UID heap scraping.

### Key patterns
- `BoundedUUIDSet` — circular buffer + Set, FIFO eviction at capacity. O(1) lookup, no timers/TTLs.
- Per-instance `getAuthToken` closure (NOT process-wide env var) on write path — prevents JWT leakage between concurrent sessions.
- Hand-encoded protobuf for `UpstreamProxyChunk { bytes data = 1 }` — 10 lines instead of pulling protobuf runtime.
- Reconnect strategy table is data-driven on close code: 4003→stop, 4001→3 retries linear (transient during conversation compaction), other→exp backoff cap 5.

### Mechanisms
**Upstream Proxy setup sequence (order is load-bearing):**
1. Read session token from `/run/ccr/session_token`.
2. `prctl(PR_SET_DUMPABLE, 0)` via Bun FFI — blocks same-UID `ptrace`/`gdb -p $PPID` from scraping heap.
3. Download proxy CA, concatenate with system CA bundle.
4. Start CONNECT-to-WebSocket relay on ephemeral port.
5. **Unlink the token file** — token now exists only on heap.
6. Export env vars for subprocesses.
Every step **fails open**: broken proxy disables credential injection but doesn't kill session.

**v2 SSE recovery on 401:** transport rebuilds with fresh `/bridge` credentials while preserving sequence-number cursor — zero message loss.

### Surprises
- **v2 actively removes infrastructure.** Win wasn't adding features; it was deleting Environments API layer.
- **Unknown control-request subtypes get explicit error response, not silence.** Silence would leave server hanging until timeout.
- **Permission round-trip budget is ~10-14s.** Below this floor, remote permission UX feels broken; above it, users abandon.
- **"No work" log message throttled to every 100 polls** — observability hygiene.
- **Hand-rolled protobuf is right call here** — single-field message doesn't justify supply-chain dependency.
- **Linear backoff (not exponential) used for 4001** — transient cause, exponential would over-penalize.

---

## Chapter 17 — Performance: Every Millisecond and Token Counts

**Topic:** Five-front performance war — startup latency, token efficiency, API cost, rendering throughput, search speed. 50+ profiling checkpoints, sampled at 100% internal / 0.5% external.

### Core concepts
- **Five distinct performance problems**, not one. Each has its own measurement, bottleneck, and tooling.
- **Module-level I/O parallelism.** Entry point intentionally violates "no side effects at module scope": keychain reads and MDM raw reads fire as fire-and-forget Promises before imports finish, overlapping ~65ms of sync spawns with ~135ms of otherwise-idle module loading.
- **API preconnection.** `HEAD` request to Anthropic API during init warms TCP+TLS handshake (100-200ms) under cover of setup work.
- **Slot reservation: 8K default, 64K on truncation.** SDK default 32-64K; production p99 output is 4,911 tokens. Default over-reserves 8-16×. Cap at 8K, retry at 64K on <1% truncation → 12-28% more usable context for free on 200K window.
- **Tool result budgeting** — three layered caps: 50K chars per tool (excess persisted), 100K tokens per tool, **200K chars aggregate per message** (the critical one).
- **Prompt cache stability as architecture.** Anthropic's cache is exact-prefix; one mid-prefix token change kills everything after. Stable content first, volatile last is not optimization — it's a structural decision that determines cost.
- **Sticky latch fields.** Five booleans sticky-on. Sacrifice mid-session toggling to preserve ~50K-70K cached tokens.
- **Bitmap pre-filter for fuzzy search.** 26-bit lowercase letter bitmap per path — single integer comparison rejects 10% (broad query) to 90%+ (rare-letter query) of candidates before any string operation.
- **Speculative tool execution.** `StreamingToolExecutor` partitions streaming tool calls into runs of safe-concurrent vs exclusive, executes early, but yields results in original order.

### Key patterns
- `getSessionStartDate = memoize(getLocalISODate)` — single most cost-efficient line in codebase. Without memoization, midnight crossover would bust entire cached prefix.
- `systemPromptSection(name, compute)` cached until `/clear` or `/compact`. Escape hatch: `DANGEROUS_uncachedSystemPromptSection(name, compute, reason)` — naming forces developers to document cache-bust justification.
- `shouldUseGlobalCacheScope()` → entries before dynamic boundary get `scope: 'global'`, sharing prefix cache across users on same Codex version. Disabled when MCP tools present.
- 26-bit bitmap: `mask |= 1 << (code - 97)` per char; reject test `(charBits[i] & needleBitmap) !== needleBitmap`.
- Branchless yield-check: `(i & 0xff) === 0xff` — modulo-256 to amortize `performance.now()` cost.
- `loadFromFileListAsync()` returns **two promises**: `queryable` (resolves on first chunk → user can search in 5-10ms) and `done` (full index). Yields every ~4ms.
- `partitionToolCalls()` → `[Read, Read, Grep, Edit, Read, Read]` becomes `[[R,R,G] concurrent, [E] serial, [R,R] concurrent]`.

### Fuzzy search hot path (per keystroke, 270K paths, target <few ms):
1. **Bitmap pre-filter** — single 32-bit AND, reject paths missing any query letter.
2. **Score-bound rejection** — compute best-case score; if can't beat current top-K threshold, skip.
3. **Fused `String.indexOf` scan** — find positions and accumulate gap/consecutive bonuses in one pass, leaning on JSC/V8 SIMD-accelerated indexOf.

### Why raw streaming API instead of SDK helper
SDK's `BetaMessageStream` calls `partialParse()` on every `input_json_delta` — O(n²) in tool input length. Codex accumulates raw strings and parses **once** when block completes.

### Adaptive renderer throttling
60fps via `throttle(deferredRender, FRAME_INTERVAL_MS)`; doubles to 30fps on terminal blur; quarter-interval drain frames during scroll for max scroll speed. Pre-allocated `Object.freeze()`'d render-path values save one allocation per frame.

### Memory relevance side-query (intersection of token efficiency + cost)
Lightweight Sonnet call (256 max output tokens) selects which memory files to include for main Opus call. Single irrelevant 2K-token memory costs more in wasted main-model context than side query costs in API fees.

### Surprises
- **Biggest single win is `max_output_tokens`** — a config value, not a clever algorithm.
- **A `memoize(date)` call protects an entire conversation cache.** Stale date is cosmetic; cache bust reprocesses everything.
- **Module-scope side effects are right answer here** — dogma "no side effects at import time" loses to measured 200ms latency reductions.
- **Sticky latches are cure to UI features.** Every config toggle user can flip mid-session is potential cache bomb.
- **Global cache scope is multi-user prefix sharing trick** — two users on same CC version share prompt-cache hits.
- **The 4-layer compaction kicks in at window limit**, anchored on API's `usage` field (not client-side estimation) to account for cache credits, thinking tokens, server-side transforms.
- **Author's closing line:** "Bitmap pre-filters, circular buffers, memoization, interning — these are CS fundamentals. The sophistication is in knowing where to apply them." Measurement-first culture is the actual product.

---

## Chapter 18 — Epilogue

### The Five Architectural Bets

**Bet 1 — Generator loop over callbacks.** `query()` is a 1,700-line async generator; the developer owns the loop. 10 terminal + 7 continuation states in a discriminated-union return type. Counter-intuitive bet: one big function > distributed callback graph because the loop is auditable in one place.

**Bet 2 — File-based memory over databases.** Plain Markdown in `~/.agents/projects/myapp/memory/MEMORY.md`. Files give up rich queries, fast lookups, transactional guarantees in exchange for **observability**. Sonnet side-query selecting 5 memories from a manifest beats embedding similarity *with zero infrastructure*.

**Bet 3 — Self-describing tools over central orchestrators.** Each `Tool` carries name, description, input schema, prompt contribution, concurrency-safety flag, execution logic. **MCP tools become first-class** — wrapping yields a standard `Tool`; everything downstream (permissions, concurrency, budgets, hooks) is unchanged.

**Bet 4 — Fork agents for cache sharing.** A forked sub-agent inherits parent's full conversation and **shares parent's prompt cache** — 90% input-token discount. This is what makes spawning agents for *small* tasks (memory extraction, code review, verification) economical.

**Bet 5 — Hooks over plugins.** External processes communicating via exit codes and JSON. Plugin can crash host, leak memory into host heap, require versioned API. Hook crashes its own process, dies with its memory, uses **a protocol stable since 1971**.

### Patterns that transfer to any agent
- **Generator loop pattern** + discriminated-union "why did the loop stop?" return type.
- **File-based memory with LLM recall** — simple storage + intelligent retrieval. Four-type taxonomy (user/feedback/project/reference) and the **derivability test** ("can this be re-derived from current project state?").
- **Asymmetric read/write channels** for remote execution.
- **Bitmap pre-filters for search** — 4 bytes per entry, one int compare per candidate.
- **Prompt cache stability as architecture** — stable first, volatile last is not optimization; it determines cost structure.

### Patterns specific to Codex's scale (don't blindly copy)
- Forked Ink renderer with packed typed arrays + pool interning + cell diffing — only justified by 60fps terminal streaming as primary UI.
- 50+ startup profiling checkpoints with 0.5% external sampling — needs hundreds of thousands of users to be meaningful.
- Eight MCP transports — most agents need stdio + HTTP.
- Hooks snapshot security model — pointless if your agent only runs in trusted environments.

### Three sources of complexity (the cost ledger)
The ~2,000 file count is misleading; behavioral complexity concentrates in: `query.ts` (1,700 lines), `hooks.ts` (4,900 lines), `REPL.tsx` (5,000 lines), and memory prompt-builders.

1. **Protocol diversity** — 5 keyboard protocols, 8 MCP transports, 4 remote topologies, 7 config scopes. Accidental complexity in Brooksian sense — comes from environment, not problem. Linear, not exponential, but sum is large.
2. **Performance optimization** — pool rendering, bitmap search, sticky cache latches, speculative execution. Justified by measurement; risk is optimizations interact in ways that make hot paths hard to modify later.
3. **Behavioral tuning** — prompt instructions, staleness warnings, "ignore memory" anti-pattern instructions. Prompt complexity, not code complexity. Eval infrastructure is the regression defense.

### Where agentic systems are heading
- **MCP as universal protocol.** "If you're defining a custom tool protocol, you're probably making a mistake." Build an MCP client.
- **Multi-agent coordination.** Tension: "how do we coordinate N agents?" vs "how do we make 1 agent capable enough that coordination is unnecessary?"
- **Persistent memory.** Open question: does file-based scale to 2,000 memories per project? At that point, manifests overflow Sonnet's recall context.
- **Autonomous operation.** Constraint is trust. **Path to more autonomous agents runs through more transparent agents.**

### The closing meta-principle

> **Push complexity to the boundaries.**

- Rendering: complexity at the pools and the diff; inside the pipeline, integer comparisons.
- Input: complexity at the tokenizer and keybinding resolver; inside handlers, typed actions.
- Memory: complexity at the write protocol and recall selector; inside the conversation, context.
- Agent loop: complexity at terminal states and tool system; inside the loop, just stream → collect → execute → append → repeat.

**Each boundary absorbs chaos and exports order.** Define your boundaries, absorb complexity there, keep everything between them clean. Boundaries are where engineering is hard. Interiors are where engineering is pleasant. Design for pleasant interiors; spend your complexity budget at the edges.

---

## Cross-cutting Themes (synthesis)

### 1. Encode "why did this stop" in the type system
The `Terminal` discriminated union (Ch 1, 5), the `boolean | null` latch (Ch 3), the seven explicit launch paths converging on one `query()` (Ch 2), `ParsedKey | ParsedMouse | ParsedResponse` (Ch 14), the 12-variant Vim `CommandState` (Ch 14), the `Tool` interface unifying built-ins and MCP (Ch 6, 15), the 5 connection states for MCP (Ch 15) — all use types to make state and termination first-class.

### 2. Centralize structural invariants, not manual notifications
`onChangeAppState` diff (Ch 3), Commander `preAction` hook (Ch 2), self-describing tool interface (Ch 6), hook snapshot at startup (Ch 2, 12). Coverage comes from architecture, not from contributors remembering to call something.

### 3. Mechanical enforcement of DAGs and frozen snapshots
ESLint forbids bootstrap from importing higher layers (Ch 3). Hook snapshots freeze at setup (Ch 2, 12). Speculative tool execution is bounded by per-tool concurrency declarations (Ch 1, 7). The system trusts only what it has snapshotted at a defined moment.

### 4. Bypass React for hot paths
Scroll mutations, chord state, rendering all use refs/microtasks rather than React state to avoid 5-10ms reconcile cycles per event. React is for frame boundaries, not event handlers.

### 5. Layered timeouts/limits, each protecting one failure
16ms render throttle, 50ms tokenizer flush, 500ms paste flush, 1000ms chord, 5min pool reset, 5s stdin-gap detector, 30s MCP connect, 60s MCP request, 27.8h tool call, 15min OAuth needs-auth cache, 90s streaming watchdog, 45s warning, 13K auto-compact threshold, 3K hard-block threshold. Each addresses a specific failure mode.

### 6. Graceful degradation, never user-facing errors about environment
Modern terminal → Kitty protocol. Legacy SSH → modifyOtherKeys. Neither RFC for OAuth → `authServerMetadataUrl` escape hatch. Broken upstream proxy → fail-open without credential injection. Compact failure 3× → circuit-break and continue.

### 7. Eval-driven prompt design
Prompt phrasing scored against eval suites: "Before recommending from memory" 3/3 vs "Trusting what you recall" 0/3. Override-when-asked-to-save 0/2 → 3/3 when override instruction added. Coordinator anti-patterns derived from observed LLM failures. Exit-code-2 chosen from production incidents.

### 8. Cache stability is an architectural invariant, not an optimization
Tool sort order (built-ins prefix, MCP suffix). Sticky latches. `DANGEROUS_uncachedSystemPromptSection` naming. Boundary marker in system prompt. `memoize(getLocalISODate)`. Fork's three-frozen-layers (prompt bytes, tool array, message divergence boundary). Memoized git status. Treating attachment-vs-tool-description placement as a 10.2% cache_creation budget item. Deferred MCP tool loading.

### 9. Architectural growth is responsive, not designed
Sticky latches were added when prompt-cache busting became measurable. Centralized `onChange` was added after permission sync was found broken on 6 of 8 paths. AGENTS.md cache was added when circular dep emerged. Death-spiral guards were each earned in production. The two-tier state split is the *invariant that contained the growth* — but the growth itself was bug-driven, not blueprint-driven.

### 10. Observable storage > efficient storage
Markdown files for memory. `~/.agents/projects/<sanitized-git-root>/` filesystem layout. JSONL transcript on disk for sidechain agent resurrection. `~/.agents/server-sessions.json` for Direct Connect state. `~/.agents/tool-results/{hash}.txt` for oversized tool output. The user can `vim`/`grep`/`rm` everything.

---

## Local files
Downloaded HTML + converted Markdown for all 18 chapters live at `/tmp/ccfs/` for reference if needed:
- `/tmp/ccfs/ch01-architecture.md` through `/tmp/ccfs/ch18-epilogue.md`
- Original HTMLs at `/tmp/ccfs/chXX-*.html`

Note: `/tmp` clears on reboot; redownload via `curl -sSL https://codex-code-from-source.com/chXX-name/` if needed later.
