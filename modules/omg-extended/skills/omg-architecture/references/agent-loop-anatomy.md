---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Agent Loop Anatomy

Detailed reference for the **single 1,730-line async generator** at the heart of Codex (`query()` in `query.ts`). Use this when designing your own agent loop, debugging one that's looping, or explaining how agentic systems actually work.

---

## The bigger picture

`query()` is the only function that:
- Talks to the model.
- Dispatches tools.
- Manages context (compaction).
- Recovers from errors.
- Runs lifecycle hooks.
- Decides when to stop.

Everything else in the system is a peripheral. **REPL, SDK, sub-agents, headless `--print`, compaction itself** — all funnel through it. Sub-agents recurse into the same loop. The compactor recurses too (with `querySource: 'compact'` to bypass blocking-limit guards that would otherwise deadlock when the compactor needs to *reduce* tokens).

Signature:
```ts
async function* query(params: LoopParams): AsyncGenerator<Message | Event, Terminal>
```

The `Terminal` return type is a 10-state discriminated union encoding *exactly* why the loop stopped. The `Message | Event` yield type encodes everything observable to the caller.

---

## Why an async generator (not callbacks, not promises)

1. **Backpressure for free.** Consumer pulls; no buffer overflow. A slow consumer (e.g., React renderer, slow terminal) naturally pauses the loop.
2. **Typed terminal return.** Event emitters can't encode "why did we stop" in the type system. Promises return one value once.
3. **`yield*` composability.** Sub-generators forward yields and returns transparently.
4. **`finally` is the cleanup mechanism.** Iterator return triggers `finally` deterministically — used as *the* cleanup correctness guarantee for sub-agent lifecycles.
5. **Lazy startup.** `function*` body only runs on first `.next()`. `query()` returns instantly; heavy initialization (config snapshot, memory prefetch, budget tracker) deferred. This lets the React renderer set up first.

Tradeoff: generators are forward-only in JS. You can't rewind or fork. Codex's loop is strictly forward-moving so this is fine.

---

## State separation

Three distinct kinds of state:

### Mutable `LoopState`
- Messages, turn counter, recovery counters, compaction tracking, pending Haiku summary promise from previous iteration.
- Reconstructed in full at every `continue` site (no in-place mutation, no `state.x = y`).
- Verbose by design — each `continue` is self-documenting; tests assert on the `transition.reason` field.

### Immutable `QueryConfig`
- Snapshotted once at entry. Feature flags, env vars, session state.
- Read-only for the entire loop lifetime.

### Injectable `QueryDeps`
- Model caller, compactor, microcompactor, UUID generator.
- Designed to refactor cleanly into a pure `step(state, event, config)` reducer.

---

## The single iteration body

### Step 1 — Context management (4 layers, fixed order)

Order matters. Each layer is more aggressive than the previous.

**Layer 0: Tool result budget.** `applyToolResultBudget()` enforces per-message size limits. Tools without finite `maxResultSizeChars` are exempt.

**Layer 1: Snip compact.** Physically removes old messages from the array. Emits a boundary message to the UI; reports tokens freed (feeds Layer 4's threshold).

**Layer 2: Microcompact.** Removes tool results no longer needed (matched by `tool_use_id`). For *cached* microcompact (which mutates the API cache), the boundary message is **deferred until *after* the API response** — because client-side token estimates lie; only `cache_deleted_input_tokens` from the server tells you what was actually freed.

**Layer 3: Context collapse.** Replaces conversation spans with summaries. Runs *before* auto-compact — if collapse drops below threshold, auto-compact becomes a no-op, preserving granular context instead of one monolithic summary.

**Layer 4: Auto-compact.** Heaviest: forks an entire Codex conversation to summarize history. Circuit breaker: 3 consecutive failures and it stops. (Production saw sessions burning 250K API calls/day in compact-fail-retry loops without this.)

### Thresholds

```
effectiveContextWindow = contextWindow - min(modelMaxOutput, 20000)
autoCompactTrigger     = effectiveWindow - 13000  // AUTOCOMPACT_BUFFER_TOKENS
hardBlockingLimit      = effectiveWindow - 3000   // MANUAL_COMPACT_BUFFER_TOKENS — reserves /compact space
```

The 13K/3K gap exists so reactive compact can catch overflows that bypass proactive compact.

Token counts come from `tokenCountWithEstimation`: authoritative API counts for the most recent response + conservative client estimate for messages added since. Errs high → fires slightly early.

### Step 2 — Model streaming

```
while (attemptWithFallback) {
  for await (msg of deps.callModel({...})) {
    // streaming tool execution may begin here
    // if msg passes the withholding filter, yield it
  }
}
```

With streaming tool execution enabled, `StreamingToolExecutor` starts running concurrency-safe tools as `tool_use` blocks arrive — **before the model finishes the response**. Each streamed message passes through the withholding filter.

### Step 3 — Post-stream classification

**No tool_use blocks** → "done" path:
- Token-budget check.
- Stop hooks (template classification, background tasks like prompt suggestion + memory extraction).
- If hooks block: append errors to messages, set `stopHookActive: true`, continue.
- If hooks `preventContinuation`: terminate `stop_hook_prevented`.
- Else terminate `completed`.

**Has tool_use blocks** → tool-use path:
- Results arrive (some pre-executed by streaming executor, others run now).
- Haiku summary promise kicked off in background.
- The *previous* iteration's Haiku promise resolves during *this* iteration's streaming and is yielded as a `ToolUseSummaryMessage`.
- State reconstructed; loop continues.

### Step 4 — Error recovery (escalation ladder)

Each step triggered when the previous fails:

- **413 prompt-too-long** → drain staged context-collapse → if still too long, reactive compact (one-shot, guarded by `hasAttemptedReactiveCompact`).
- **Max-output-tokens hit (8K cap)** → escalate to 64K override → if still hitting, multi-turn recovery (max 3 attempts, `MAX_OUTPUT_TOKENS_RECOVERY_LIMIT`).
- **Model error** → fallback model (strip thinking signatures first — they are model-bound).
- **All other recoverable errors** → withhold + retry; surface only on exhaustion.

---

## Death-spiral guards (5 total, each earned in production)

1. **`hasAttemptedReactiveCompact` one-shot flag.**
2. **`MAX_OUTPUT_TOKENS_RECOVERY_LIMIT = 3`.**
3. **Auto-compact circuit breaker after 3 consecutive failures.**
4. **No stop hooks on error responses.** Code explicitly returns before stop hooks when last message is API error. Source comment: "Error → hook blocking → retry → error → hook injects more tokens each cycle."
5. **`hasAttemptedReactiveCompact` preserved across stop hook retries.** Source comment: "Resetting to false here caused an infinite loop burning thousands of API calls."

If you find yourself adding a 6th to your own loop, the guard *is* the design — not patches around it.

---

## The withholding pattern

Recoverable errors (prompt-too-long, max-output-tokens) are *suppressed* from the yield stream because SDK consumers (Cowork, desktop app) terminate sessions on any error message. Errors are pushed into an internal `assistantMessages` array so recovery code can find them; surfaced only when all recovery exhausted.

```ts
let withheld = false
if (contextCollapse?.isWithheldPromptTooLong(message)) withheld = true
if (reactiveCompact?.isWithheldPromptTooLong(message)) withheld = true
if (isWithheldMaxOutputTokens(message)) withheld = true
if (!withheld) yield yieldMessage
```

**Triggered by typed predicates, not string-matching error messages.**

---

## Token budgets (`+500k`)

- Subagents always stop (budget is top-level only).
- Continue if `turnTokens < budget * 0.9`.
- After 3+ continuations: stop early if both current and previous deltas < 500 tokens (diminishing returns).
- On continue, inject a nudge message telling the model how much budget remains.

---

## Orphaned `tool_result` safety net

API protocol requires every `tool_use` to have a matching `tool_result`. `yieldMissingToolResultBlocks()` synthesizes error tool_results for orphans.

Fires in three places:
1. Outer error handler (model crash).
2. Fallback handler (model switch mid-stream).
3. Abort handler (Ctrl+C).

Without this, the next turn's API call fails with protocol errors.

---

## Abort handling (two distinct paths)

**Streaming abort:**
- Streaming executor (if active) drains queued tools, generating synthetic tool_results.
- Otherwise `yieldMissingToolResultBlocks` covers.
- `signal.reason` distinguishes hard abort (Ctrl+C) from submit-interrupt (user typed new message).
- Submit-interrupts skip the interruption message because the queued user message provides context.

**Tool-execution abort:** same logic plus `toolUse: true` on the interruption message.

---

## Thinking block rules (inviolable, source-verbatim)

Source quote: *"Codex's thinking/redacted_thinking blocks have three inviolable rules"* (ch 5):

1. **A message containing a thinking block must be part of a query whose `max_thinking_length > 0`.**
2. **A thinking block may not be the last block in a message.**
3. **Thinking blocks must be preserved for the entire assistant trajectory** (across all messages in the conversation, not just the current message).

Violations produce **opaque API errors**. Three places in the code defend the rules:
- **Fallback handler** strips signature blocks before retry — *thinking signatures are model-bound*; replaying a protected-thinking block from one model to a fallback model causes a 400 error. All orphaned assistant messages from the failed attempt are tombstoned so the UI removes them.
- **Compaction pipeline** preserves the protected tail.
- **Microcompact** never touches thinking blocks.

---

## The 17 parameters of `runAgent()` (for sub-agent recursion)

When a sub-agent recurses into the loop, 17 parameters configure it:

```
agentDefinition, promptMessages, toolUseContext, canUseTool, isAsync,
canShowPermissionPrompts, forkContextMessages, querySource,
override (systemPrompt | abortController | agentId | userContext),
model, maxTurns, availableTools, allowedTools, onCacheSafeParams,
useExactTools, worktreePath, description
```

Resolution-chain principle: **explicit override > declaration > inheritance > default.**

The schema is **feature-flag-shaped, not just feature-flag-validated.** Fields are *omitted* (not just disabled) when controlling flags are off. The model cannot misuse what it cannot see.

---

## Lessons distilled

When designing your own loop:

1. **Make termination types-first.** 10 terminal + 7 continuation states is a useful baseline target.
2. **Reconstruct state at every continue.** Mutation in place is the source of every "stale field" bug.
3. **Layer your recovery.** Lightest first (suppress + retry), heaviest last (compact, model fallback, multi-turn recovery).
4. **Document each death-spiral guard with the production incident that motivated it.** "Resetting this to false caused an infinite loop burning thousands of API calls" is a comment future-you will thank you for.
5. **Use `finally` for cleanup, not explicit `try/finally` per resource.** Iterator return triggers it deterministically — that's the contract.
6. **Withhold recoverable errors from public streams.** SDK consumers will terminate; show errors only when recovery exhausted.
7. **One generator function. Don't split it for "cleanliness."** All the invariants live in one place because the invariants are global to the loop — splitting dilutes them.

---

## Anti-patterns (review checklist)

- [ ] Returning `{ ok, reason?: string }` instead of discriminated union.
- [ ] Mutating loop state in place across iterations.
- [ ] No circuit breaker on heaviest recovery path.
- [ ] Withhold pattern decided by string-matching error messages.
- [ ] No protection against death spirals (no one-shot flags, no recovery counters).
- [ ] Stop hooks fire on error responses without an explicit guard.
- [ ] Splitting the loop body across multiple files.
- [ ] No orphan `tool_result` safety net (next turn fails with protocol errors).
- [ ] Recovery counters reset on stop-hook retries (production-confirmed infinite-loop trigger).
