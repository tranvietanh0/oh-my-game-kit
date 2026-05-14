---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# The Five Architectural Bets

Distilled from Codex's chapter 18 epilogue. Use these as the **load-bearing decisions** to evaluate any agentic system design against.

---

## Bet 1 — Generator loop over callbacks

**The pattern.** One async generator (`query()` in Codex, ~1,700 LOC) that streams the model, executes tools, manages context, recovers from errors, and decides when to stop. Returns a discriminated union with **10 terminal states + 7 continuation states**.

**Why it works.**
- Backpressure for free (consumer pulls; no buffer overflow).
- Typed terminal return value encodes *why* the loop stopped — exhaustive handling enforced by the type system.
- `yield*` composability — sub-generators forward yields and returns transparently.
- `finally` blocks fire deterministically on consumer return — used as *the* cleanup correctness guarantee for sub-agent lifecycles.

**Apply when.**
- Designing any LLM-driven control loop.
- Adding a new "exit reason" — should be one variant in one union, not a new field on a result type.
- Wrapping retry logic — make the retry wrapper itself a generator yielding status events inline.

**Don't apply when.**
- The loop has fewer than ~3 distinct exit reasons (event emitter is fine).
- You need to fork/rewind state — generators are forward-only in JS.

**Anti-patterns to flag in review.**
- Returning `{ ok: boolean, reason?: string }` instead of a discriminated union.
- "Done" signaled by a special message type or a side-channel — Codex's loop terminates implicitly when the model emits no tool calls.
- Promise-based loops where cancellation requires custom plumbing — generators get `.return()` for free.

---

## Bet 2 — File-based memory over databases

**The pattern.** Plain Markdown files in `~/.agents/projects/<sanitized-git-root>/memory/`:
- `MEMORY.md` — always-loaded index, capped at 200 lines / 25KB.
- `<type>_<topic>.md` — on-demand body files with YAML frontmatter (`name`, `description`, `type`).
- LLM (Sonnet) side-query selects up to 5 memories per turn from the manifest. No embeddings, no vector DB, no infra.

**Why it works.**
- **Observability is the killer feature.** User can `vim` the memory and see exactly what the agent knows. Different trust relationship from "ask the agent and hope."
- File medium signals epistemological status: "notes someone wrote down" (revisable) vs DB "authoritative state."
- Sonnet recall handles negation ("do NOT mock") that embeddings struggle with.
- Side-query latency hides behind main model's initial processing.

**Apply when.**
- Building a memory/notes system for an agent — start with files, defer DB until profiling demands.
- The user needs to inspect/edit/delete memory.
- Cross-project memory sharing — git is the versioning system.

**Don't apply when.**
- 10K+ memories per project (manifests overflow side-query context — Codex's epilogue flags this as the bet's hardest test).
- Sub-millisecond lookup is required (rare in agent contexts).

**The four-type taxonomy.**
- `user` — preferences, role, working style.
- `feedback` — corrections AND validated approaches (saving only corrections drifts the model away from confirmed wins). Each feedback memory has a fixed shape: rule, then `**Why:**` line (often a past incident), then `**How to apply:**` line (trigger conditions).
- `project` — ongoing work context (who/what/why/by-when). Convert relative dates to absolute ("Thursday" → "2026-03-05") so the memory is interpretable weeks later.
- `reference` — pointers to where information lives (Linear URL, Grafana dashboard, Slack channel). Tells where to look, not what to find.

**The derivability test.** Don't save what's already derivable from the current project state (code patterns, architecture, git history). Re-derivation keeps the model grounded; memory of stale code becomes a liability. Even when the user explicitly asks to save a derivable thing ("remember this PR list"), the model is instructed to push back — *what was surprising or non-obvious about it?* — eval went 0/2 → 3/3 when the override-on-explicit-ask instruction was added.

**KAIROS consolidation pattern (long-running sessions).** Standard memory's two-step write doesn't scale to multi-day sessions. KAIROS mode separates capture from consolidation:
- Capture: append-only timestamped bullets in `<autoMemPath>/logs/YYYY/MM/YYYY-MM-DD.md`. The model is told "do not rewrite or reorganize" — restructuring during capture loses chronological signal.
- Path is described to the model as a *pattern*, not today's literal date — caching optimization so the prompt doesn't bust at midnight. The current date arrives via a separate `date_change` attachment.
- `/dream` runs four phases: **Orient** (list directory, read index, skim files), **Gather** (search logs, check drifted memories), **Consolidate** (write/update files; merge into existing rather than create new), **Prune** (update index under 200 lines, remove stale pointers).
- `.consolidate-lock` file is dual-purpose: content = holder's PID (mutual exclusion), mtime = `lastConsolidatedAt` (scheduling state). Three gates evaluated cheapest-first: hours since last consolidation > 24, sessions modified > 5, no other process holds lock. Crash recovery via `process.kill(pid, 0)`; 1-hour staleness fallback against PID reuse.

**Anti-patterns to flag.**
- Memory schema with derived/computed fields (violates SSOT — see also: no derived fields rule).
- "Auto-save everything" without a relevance gate — precision dies (selection-rate telemetry: 0/150 = saving too much; 0/3 = coverage problem; the two cases need different fixes).
- Vector embeddings as the *only* retrieval — fine to add later, but Sonnet recall + frontmatter manifest scales surprisingly far for free.
- Frontmatter scan that reads full file — `scanMemoryFiles()` reads only first ~30 lines per file; body is private until selected.
- Recall returns large result sets — Sonnet side-query selects **at most 5** memories per turn via structured output `{ selected_memories: string[] }`, with filenames validated against the known set.

---

## Bet 3 — Self-describing tools over central orchestrators

**The pattern.** Each `Tool` carries:
- Name, description (system prompt contribution).
- Input schema (Zod doing double duty: API JSON Schema + runtime parser).
- `isConcurrencySafe(input)` — per-input safety classifier.
- `checkPermissions(input)` — per-input permission check.
- `validateInput(input)` — semantic validation beyond schema.
- `call(input, ctx)` — execution.
- Plus ~40 UI/telemetry/search-hint members, but only the 5 above are load-bearing for the loop.

The orchestrator never knows tool-specific details. Adding tool N+1 changes zero existing code.

**Why it works.**
- MCP tools become first-class by implementing the same interface — no separate adapter layer.
- Permission system, concurrency executor, hooks pipeline, result budgeter all consume the uniform interface.
- Per-input safety is more precise than per-type: `Bash("ls")` is safe; `Bash("rm -rf")` is not.

**Apply when.**
- Designing a tool/plugin/extension interface for an agent.
- Wrapping external protocols (MCP, OpenAPI, custom) — make them all conform to your `Tool` interface.

**Anti-patterns to flag.**
- Orchestrator switching on `tool.name` to apply special-case logic. Move that logic to the tool itself.
- Concurrency safety declared as a tool-type-level boolean instead of a per-input function.
- Adding a "tool category" enum to drive orchestrator behavior — almost always means missing self-description fields.
- Fail-open defaults. Use `SAFE_DEFAULTS` spread pattern: `{ isParallelSafe: () => false, isReadOnly: () => false, isDestructive: () => false, ...toolDef }`.

---

## Bet 4 — Fork agents for cache sharing

**The pattern.** Spawn sub-agents that inherit the parent's full conversation history with byte-identical request prefixes, claiming Anthropic's ~90% cached-input discount.

Three frozen layers:
1. **System prompt threaded as bytes** (parent's already-rendered prompt passed via `override.systemPrompt`; the agent's `getSystemPrompt()` is never invoked).
2. **Tool array passed exactly through** (`useExactTools: true` short-circuits filtering; even tools the child can't use stay in the array to preserve serialization).
3. **Message array constructed so divergence boundary falls right before the per-child directive** (`buildForkedMessages` emits a constant placeholder result `'Fork started -- processing in background'` for every parent `tool_use` block).

**Why it works.**
- ~99.75% prefix overlap across N parallel children (~80,000 prefix tokens shared, ~200 tokens of per-child directive differ).
- Concrete economics: 5 children × 48,500-token prefix → without fork = 5× full input; with fork = 1× full + 4× cached@10% → ~90% reduction on the four siblings.
- Makes spawning agents for *small* tasks (memory extraction, code review, verification) economically viable.

**Apply when.**
- Parallel sub-agents share most context (research dispatch, parallel verification, batch processing of similar items).
- The cost of dead-weight context is less than the cache savings.

**Don't apply when.**
- Sub-agent needs a clean/different context (different domain, security isolation, fresh persona).
- Coordinator-mode patterns (different orchestration model — Codex mutually excludes fork and coordinator at the flag level).
- Non-interactive sessions where `bubble` permissions can't surface.

**Anti-patterns to flag.**
- Stripping "irrelevant" history to "keep the child focused" — busts the cache, costs more than the dead context did.
- Re-rendering system prompts per-child (GrowthBook flag transitions cold→warm between calls cause divergence).
- Filtering the tool array per-child — even reordering busts the cache.
- Mutating placeholder results to "make the child see what really happened" — same cache-bust cost.

**Recursion prevention.** Belt-and-suspenders: primary check on `querySource === 'agent:builtin:fork'` (single string compare); fallback scan of message history for `<fork-boilerplate>` tag. The `Agent` tool stays in the child's pool (changing the array would bust cache) — runtime guards prevent recursive forking.

---

## Bet 5 — Hooks over plugins

**The pattern.** External processes communicating via:
- **Exit codes** — `0` = success, `2` = blocking error (stderr → system message), other = non-blocking warning. Exit `2` chosen specifically because exit `1` is ambient noise (every unhandled exception/syntax error).
- **JSON on stdin/stdout** — input event passed as JSON on stdin; structured output (or plain text) on stdout.
- **Lifecycle events** — 24+ hook points (PreToolUse, PostToolUse, Stop, SessionStart, UserPromptSubmit, etc.).

Six hook types: Command (shell), Prompt (single LLM call), Agent (full multi-turn loop), HTTP (POST to URL), Callback (internal, fast-path -70% overhead), Function (session-scoped TS).

**Why it works.**
- Plugin crashes the host; hook crashes only itself.
- Hook protocol uses primitives stable since 1971 (process exit + stdin/stdout).
- No versioned API surface to maintain.
- Internal callbacks get the fast path (-70% overhead) for the hot path; external hooks get the safe path. Same interface, two execution paths.

**Snapshot security.** `captureHooksConfigSnapshot()` runs once at startup. `executeHooks()` only reads from the snapshot. Eliminates TOCTOU: a malicious repo cannot edit `.agents/settings.json` post-trust to inject hooks at runtime. Update channels: `/hooks` command (explicit) or file-watcher rebuild.

**Stop hook is the most powerful integration point.** Returning exit 2 forces continuation — single-shot prompt-response becomes a goal-directed loop ("are you really done?" verification).

**Apply when.**
- Extending an agent's behavior at lifecycle boundaries.
- Enterprise/untrusted contexts where extension isolation matters.
- Building automated quality gates the model cannot bypass by claiming completion.

**Don't apply when.**
- Pure performance hot path with hundreds of invocations per second (process spawn overhead dominates) — use internal callback type instead.

**Anti-patterns to flag.**
- Re-reading hook config on every event (TOCTOU vulnerability).
- Treating exit `1` as blocking (collides with ambient script failures).
- In-process plugins with shared memory — one bad plugin nukes the host.
- "We'll just use a versioned plugin API" — every version transition becomes a migration headache.

---

## Cross-bet synthesis

The five bets share a unified philosophy:

- **Encode termination/intent in types** (Bet 1 generator return type; Bet 5 exit code semantics).
- **Push complexity to boundaries** (Bet 2 LLM recall absorbs messy memory; Bet 3 tools self-describe instead of orchestrator switching).
- **Trust observable storage** (Bet 2 file memory; Bet 5 hook snapshots on disk).
- **Mechanical enforcement** (Bet 4 fork recursion guards; Bet 5 hook freeze + policy cascade).

When you find yourself violating two bets at once for the same change, that is almost always a sign of a missing abstraction — stop and redesign.

---

## Agent SDK vs CLI — what carries over

Critical for SDK users: not every CLI bet maps to the Agent SDK surface. Don't blindly copy CLI patterns to SDK code.

| Bet | Codex CLI | Codex Agent SDK | Apply in SDK? |
|---|---|---|---|
| 1 — Generator loop | `query()` async generator, 10+7 union | Same `query()` pattern in Python + TS SDK | **Yes — directly.** Discriminated-union returns work identically. |
| 2 — File-based memory | `~/.agents/projects/<root>/memory/*.md` + Sonnet recall | SDK has no built-in memory layer | **Pattern only.** Files-on-disk + side-query is your own implementation; SDK won't load it for you. |
| 3 — Self-describing tools | Internal `Tool` interface with `isConcurrencySafe(input)` etc. | SDK accepts custom tools via `tools: [...]` parameter; uniform interface | **Yes — but the SDK's tool interface is narrower.** Self-description fields you add stay in your wrapper. |
| 4 — Fork agents | `fork: true` mode, `useExactTools`, byte-frozen prefix | **Not exposed in SDK.** Subagents via `Agent` tool / `AgentDefinition` are fresh agents only. | **No.** Use `resume: session_id` for context continuity instead. |
| 5 — Hooks | External processes via exit code + stdin JSON | In-process callback functions (PreToolUse, PostToolUse, Stop, etc.) | **Lifecycle taxonomy yes; isolation no.** Hooks are functions, not subprocesses, so crashes propagate. |

**SDK-specific watch items:** session resumption (`resume`) replaces fork-style cache sharing for context continuity; tool definitions are typed via SDK schemas (no Zod double-duty); hooks crashes are not isolated, so wrap them in try/catch.

## Cross-system applicability matrix

How the bets travel across the agentic-framework landscape (calibrate before quoting):

| Bet | Codex CLI | Codex Agent SDK | LangGraph (LangChain) | OpenAI Agents SDK | MS Agent Framework | Google ADK |
|---|---|---|---|---|---|---|
| 1 — Generator loop | Native | Native | Graph-state equivalent | Typed message envelopes | Typed workflow states | Workflow agents |
| 2 — File memory + LLM recall | Native | Pattern only | Default: vector/DB | Default: vector/DB | Default: vector/DB | Default: vector/DB |
| 3 — Self-describing tools | Native | Partial (SDK limits fields) | Tools = functions, less self-describing | Function-calling schemas | Tool plugins | Tool plugins |
| 4 — Fork agents (cache-share) | Native | **Not supported** | Not supported | Not supported | Not supported | Not supported |
| 5 — Hooks | External process | In-process callbacks | Graph-node hooks | Run-lifecycle callbacks | Activity callbacks | Plugin/callback layer |

**Reading the matrix.**
- Bets 1, 3, 5 (taxonomy/intent) translate broadly. Quote freely.
- Bet 2 (file memory) is Codex-specific design philosophy. Treat as inspiration; other frameworks expect DB/vector.
- Bet 4 (fork+cache) is unique to Codex CLI. Do **not** assume it works in Agent SDK or any other framework.

## Currency notes (updated 2026-04-26)

- **Bet 1.** Async-generator loops are now standard across major frameworks. Discriminated-union return types are accepted-best-practice for terminations.
- **Bet 4 economics.** Book-claimed ~90% input-token reduction across siblings assumes ~99.75% prefix overlap. Independent fleets typically see **40–80% input-cost reduction** depending on prompt-size, sibling count, and how cleanly the divergence boundary is preserved. Measure before quoting "90%" to your team.
- **Bet 5 hook isolation.** True process isolation requires the CLI's external-hook model. Agent SDK callback hooks share process — wrap them defensively.
