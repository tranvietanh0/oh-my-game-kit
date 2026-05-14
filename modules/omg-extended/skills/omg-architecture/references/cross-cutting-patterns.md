---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Cross-Cutting Patterns

Ten themes that recur across all 18 chapters. Apply these *between* the architectural bets — they're the connective tissue.

---

## 1. Encode "why did this stop?" in the type system

**Examples.**
- `Terminal` discriminated union for the agent loop (Ch 1, 5) — 10 terminal states + 7 continuation states.
- `boolean | null` sticky latches encoding three states: uninitialized, latched, never-back (Ch 3).
- `ParsedKey | ParsedMouse | ParsedResponse` for input dispatch (Ch 14).
- 12-variant `CommandState` for vim mode — TypeScript exhaustiveness forbids dead states (Ch 14).
- 5 connection states for MCP servers (Ch 15).

**Apply.** Any state machine, any control loop, any termination decision. If you find yourself returning a tuple `[ok, reason]`, you're missing a discriminated union.

**Anti-patterns.** Sentinels (`-1`, `null`), boolean flags that mean different things in combination, "is this done?" status fields without exhaustive variants.

---

## 2. Centralize structural invariants, not manual notifications

**The lesson.** Permission-mode sync used to be scattered across 8+ mutation paths in Codex; only 2 actually called the remote sync. Fix wasn't to "remember to add the call to all paths" — it was structural: diff at one chokepoint (`onChangeAppState`).

**Apply.**
- One central `onChange` callback fires before subscribers, sees a diff, dispatches side effects.
- Commander `preAction` hook fires after parse, before handler — every command pays through one chokepoint.
- Self-describing tools (Bet 3) are the same pattern — orchestrator queries the tool instead of remembering tool-specific logic.

**Anti-patterns.** "Make sure to call `syncPermissions()` after any mode change" comments. Long lists of "places to update when X happens." Manual notification fan-out.

---

## 3. Mechanical enforcement of DAGs and frozen snapshots

**Examples.**
- ESLint rule forbids `bootstrap/state.ts` from importing modules outside its allowed set (DAG leaf invariant).
- Hook config snapshot frozen at setup; on-disk modifications mid-session ignored (security + correctness).
- Speculative tool execution bounded by per-tool concurrency declarations (orchestrator can't override the tool's own decision).

**Apply.**
- ESLint custom rules to enforce import boundaries.
- "Snapshot at trust boundary" pattern: read once, freeze, never re-read at runtime.
- Trust the snapshot, not the live source.

**Anti-patterns.** "We document that you should not import X from Y, but the lint doesn't enforce it." Live config re-reads on every event (TOCTOU). Trusting on-disk state mid-session.

---

## 4. Bypass React (or your reactive framework) for hot paths

**Examples.**
- Scroll mutations use refs + microtasks, not React state (5-10ms reconcile per event).
- Chord state machine uses synchronous `pendingChordRef` so the second keystroke isn't processed before the first's state update.
- Render path mutates DOM properties directly + `markDirty()` + microtask render. No reconciliation.
- Pre-allocated `Object.freeze()`'d render-path values save one allocation per frame.

**Apply.** React (or equivalent) is for frame boundaries, not event handlers. The hot path bypasses; the boundary syncs.

**Anti-patterns.** Driving 60fps animations through `setState`. Storing chord/transient/throttle state in React state. Allocating new objects in render hot paths.

---

## 5. Layered timeouts/limits, each protecting one specific failure

**Codex's timeout stack.**
- 16ms render throttle (60fps target).
- 50ms tokenizer flush (lone-ESC ambiguity).
- 500ms paste flush (bracketed paste accumulation).
- 1000ms chord (multi-key sequence cancellation).
- 5min pool reset (generational GC for interning pools).
- 5s stdin-gap detector (re-assert terminal modes after tmux reattach).
- 30s MCP connect.
- 60s MCP per-request (recreated fresh, NOT shared — shared signal causes false aborts).
- 90s streaming watchdog (warn at 45s, abort + non-streaming retry at 90s).
- 27.8h tool call (long-running ops).
- 15min OAuth needs-auth cache (prevents 30 servers each rediscovering same expired token).
- 13K token auto-compact threshold.
- 3K token hard-block threshold.

**Apply.** When in doubt, add a timeout. Each layer should protect one specific failure. Don't reuse one signal across layers — Codex's per-request timeout fix replaced one shared `AbortSignal.timeout(60000)` (after 60s idle, next request aborts immediately) with a fresh signal per request.

**Anti-patterns.** One global timeout for everything. No timeout because "it shouldn't fail." Reusing one `AbortController` across requests/sessions.

---

## 6. Graceful degradation, never user-facing errors about environment

**Examples.**
- Modern terminal → Kitty protocol; legacy SSH → modifyOtherKeys; neither → legacy regex parsing. User never sees "your terminal is unsupported."
- OAuth: RFC 9728 → RFC 8414 → `authServerMetadataUrl` escape hatch.
- Broken upstream proxy → fail-open without credential injection (session continues).
- Compact failure 3× → circuit-break and continue (not crash).
- MCP: `stdio` is implicit default when `type` is omitted (backwards-compatible with earliest configs).

**Apply.** Capability detection + progressive enhancement + fallback chain. Errors only when there's no useful fallback.

**Anti-patterns.** "Your version of X is not supported." Hard-failing on a missing capability that has a known degraded path.

---

## 7. Eval-driven prompt design

**Concrete examples.**
- "Before recommending from memory" scored 3/3 vs "Trusting what you recall" 0/3 — same body, different action-cue framing.
- Override-when-asked-to-save pattern went 0/2 → 3/3 when override instruction was added.
- Coordinator anti-patterns derived from observed LLM failures.
- Exit-code-2 chosen specifically because exit 1 was hitting in production.

**Apply.** Treat prompts like code — versioned, eval'd, regression-tested. Eval scores in comments next to prompt strings. The investment in eval infra is the regression defense for behavioral tuning.

**Anti-patterns.** "Just iterate on prompts" without eval. Long prose prompts that haven't been tested against alternatives. No regression suite for prompt changes.

---

## 8. Cache stability is an architectural invariant, not an optimization

**Concrete decisions in Codex.**
- Tool sort order: built-ins prefix + MCP suffix (server places cache breakpoint after last built-in; flat sort would interleave and shift positions on every install).
- Sticky latches: 5 booleans that never go false, sacrificing mid-session toggling.
- Naming: `DANGEROUS_uncachedSystemPromptSection(text, _reason)` — naming convention forces developers to document cache-bust justification.
- Boundary marker explicit in system prompt: `[...static, BOUNDARY, ...dynamic]`.
- `memoize(getLocalISODate)` — single most cost-efficient line in codebase. Without it, midnight crossover busts entire cached prefix.
- Fork's three-frozen-layers (system prompt bytes, tool array, message divergence boundary).
- Memoized git status / user context (no TTL).
- Attachment-vs-tool-description placement: dynamic agent lists in attachments, not tool description (saved 10.2% of fleet `cache_creation` tokens).
- Deferred MCP tool loading: send name + description only; load schema on demand.

**The 2^N hash explosion.** Every runtime conditional placed before the cache boundary doubles unique prefix hashes the server caches. Three booleans = 8 cache variants; five = 32. **Compile-time bundler flags fine; runtime branches must be after the boundary.** Violating this silently fragments the entire fleet's cache.

**Apply.** Treat the prompt as a layered structure. Static-first, volatile-last is not optimization — it determines cost.

**Anti-patterns.** Conditional inserts in the middle of system prompts. Re-rendering prompts per call. Sorting tool arrays by user preference (busts cache on every reorder). Including timestamps in static prompt sections.

---

## 9. Architectural growth is responsive, not designed

**The honest framing from Ch 3.** Sticky latches were added when prompt-cache busting became measurable. Centralized `onChange` was added after permission sync was found broken on 6 of 8 paths. AGENTS.md cache was added when the circular dep emerged. Death-spiral guards were each earned in production.

**The two-tier state split is the *invariant that contained the growth* — but the growth itself was bug-driven, not blueprint-driven.**

**Apply.**
- Don't pre-design every invariant. Identify the *containing* invariant (DAG split, generator boundary, snapshot freeze) early; let the system grow patches against it.
- Document the production incident that motivated each unusual decision. Comments like "Resetting to false here caused an infinite loop burning thousands of API calls" are gold for future maintainers.

**Anti-patterns.** Spending months designing the perfect agent loop before shipping. Removing "weird" code without checking why it was added (most weird code is a bug pin).

---

## 10. Measurement before optimization (50+ checkpoints, sampled)

**The Codex numbers.**
- 50+ startup profiling checkpoints (`profileCheckpoint('main_tsx_entry')` etc.).
- Sampling: **100% of internal users, 0.5% of external users** — every optimization in ch17 was motivated by the data, not intuition.
- Slot reservation tuning: production p99 output = 4,911 tokens → default `max_output_tokens` cap = 8K (retry at 64K on <1% truncation). On a 200K window, this is **12-28% more usable context** purely from measurement.
- Bitmap pre-filter rejection rates: ~10% for broad queries like "test", 90%+ for queries with rare letters. Cost: 4 bytes/path = ~1MB for 270,000 paths.
- Cache-creation savings from moving dynamic agent lists to attachments: **10.2% of fleet `cache_creation` tokens**.

**Apply.** Performance work without measurement is guesswork. Instrument first, ship the optimization second. The fancy data structures (bitmap, circular buffers, interning) are CS fundamentals — sophistication is in *where* to apply them, which only measurement tells you.

**Anti-patterns.** "We don't need profiling — the code is fast." Hand-tuned `max_output_tokens` defaults set to "be safe." Optimizations driven by code review intuition.

---

## 11. Observable storage > efficient storage

**Examples.**
- Markdown files for memory (vim/cat/rm friendly).
- `~/.agents/projects/<sanitized-git-root>/` filesystem layout.
- JSONL transcript on disk for sidechain agent resurrection.
- `~/.agents/server-sessions.json` for Direct Connect state.
- `~/.agents/tool-results/{hash}.txt` for oversized tool output.
- Hook config in `settings.json` (inspectable, version-controllable).

**Apply.** When in doubt, file-on-disk. The user must be able to `vim`/`grep`/`rm` everything that affects their experience. Trust is earned through observability.

**Anti-patterns.** SQLite-only state with no inspection tooling. Encrypted/binary blobs for human-meaningful data. Storing in DB what could be a file.

---

## How to use this reference in practice

When designing or reviewing:

1. **Pick the most relevant pattern.** Most architectural decisions touch 1-3 of these themes.
2. **Quote it by name** in feedback ("This violates Pattern 5 — you're reusing one timeout across two distinct failure modes").
3. **Acknowledge tradeoffs.** Some patterns (mechanical enforcement, eval-driven design) require infra investment that small projects may not justify. Say so explicitly.
4. **Watch for double violations.** When a change violates 2+ patterns, that's almost always a missing abstraction. Stop and redesign.

---

## Currency notes (updated 2026-04-26)

**Pattern 1 — Type-encoded termination:** Industry-wide adoption confirmed. LangGraph uses state graphs + exhaustive node definitions; OpenAI Agents SDK uses typed message envelopes; Microsoft Agent Framework uses typed workflow states. Discriminated unions are the expected approach across frameworks.

**Pattern 7 — Eval-driven prompt design:** Research-backed (Anthropic's own development process) and increasingly standard in production systems. As of 2026, prompt-as-code with versioning, evals, and regression testing is recognized as essential for reliability. The pattern is not new but has moved from "nice-to-have" to "table stakes."

**Pattern 8 — Cache stability as invariant:** The skill's numbers remain accurate as of April 2026. Prompt caching pricing is confirmed: write-token multipliers (1.25x for 5-min, 2x for 1-hour), cache reads at 0.1x (90% discount). Workspace-level isolation (vs org-level) was introduced Feb 5, 2026. For Agent SDK users building one-off agents, cache is less critical than for Codex sessions (which see cache reuse across turns). For multi-turn API sessions with prompt caching enabled, the rule applies identically.

**Pattern 11 — Observable storage over efficient storage:** This principle is specific to Codex's design philosophy. Other frameworks (LangGraph, AutoGen, Agent Framework) default to database backends or vector storage. File-on-disk observability is less universal, making this a Codex-specific design win. The broader principle ("trust is earned through observability") carries across systems.
