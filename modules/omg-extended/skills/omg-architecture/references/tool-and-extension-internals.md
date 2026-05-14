---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Tool, MCP, and Remote-Transport Internals

Concrete implementation details from chapters 6, 12, 15, 16. Use when designing tool pipelines, MCP integrations, or remote agent transports — these are the production-incident-driven specifics that don't fit elsewhere.

---

## A. Tool result-budget table (ch 6)

Per-tool size caps are not arbitrary — each value is justified:

| Tool | `maxResultSizeChars` | Rationale |
|---|---|---|
| BashTool | 30,000 | Enough for most useful output |
| FileEditTool | 100,000 | Diffs can be large but model needs them |
| GrepTool | 100,000 | Search results with context lines add up fast |
| FileReadTool | `Infinity` | Self-bounds via own token limits; persisting would create circular Read-the-persisted-file loops |

**Aggregate cap (ch 17 numbers).** Per-tool 50,000 chars / 100,000 tokens / **per-message aggregate 200,000 chars** prevents N parallel reads from blowing the budget in one turn ("read all files in src/" → 10 parallel × 40K each).

**Persistence pattern.** Oversized → save to `~/.agents/tool-results/{hash}.txt` + replace with `<persisted-output>` wrapper containing preview and file path. The model can then `Read` the file if needed. **Read-class tools must skip persistence** (else circular loop).

---

## B. The 14-step tool pipeline (ch 6)

`checkPermissionsAndCallTool()` — every tool call passes through these in order:

| Step | Phase | What it does |
|---|---|---|
| 1 | Validation | Tool lookup (with alias fallback for renamed tools) |
| 2 | Validation | Abort check (skip work for queued calls after Ctrl+C) |
| 3 | Validation | Zod schema validation (deferred tools get hint to call ToolSearch first) |
| 4 | Validation | Semantic validation (no-op edits rejected, standalone `sleep` blocked when MonitorTool present) |
| 5 | Preparation | Speculative classifier start (auto-mode security check kicks off in parallel) |
| 6 | Preparation | Input backfill (clone parsed input + add derived fields like absolute paths) |
| 7 | Permission | PreToolUse hooks (decide / modify / inject context / stop) |
| 8 | Permission | Permission resolution (rules → tool-specific check → mode default → prompt → auto-classifier) |
| 9 | Permission | Permission-denied handling (build error + run `PermissionDenied` hooks) |
| 10 | Execution | Tool `call()` with original input |
| 11 | Execution | Result budgeting (persist oversized + preview wrapper) |
| 12 | Execution | PostToolUse hooks (modify MCP output / block continuation) |
| 13 | Execution | Append `newMessages` (sub-agent transcripts, system reminders) |
| 14 | Execution | Error classification (telemetry-safe; never log raw error message) |

**`_simulatedSedEdit` pattern.** When user approves a sed command, the system runs it in a sandbox, captures output, injects it as `_simulatedSedEdit` in the input. `call()` applies the edit directly, bypassing shell re-execution. **Guarantees what user previewed = what gets written**, even if the file changed between preview and execution.

---

## C. Tool gotchas (ch 6)

- **GrepTool** default `head_limit: 250`; auto-excludes 6 VCS dirs (`.git`, `.svn`, `.hg`, `.bzr`, `.jj`, `.sl`) — searching `.git/objects` is never wanted and accidental binary pack inclusion blows token budgets. Set `head_limit: 0` to disable.
- **FileReadTool** blocks `/dev/zero`, `/dev/random`, `/dev/stdin`. Handles macOS screenshot quirk: U+202F narrow no-break space vs regular space in "Screen Shot" filenames.
- **FileEditTool** integrates with `readFileState` LRU cache: rejects edits if file was modified since last read (background process, other tool, user). `findActualString()` normalizes whitespace + quote styles before matching for fuzzy matching. `replace_all` enables bulk; without it, non-unique matches rejected.
- **BashTool permission matcher** uses `parseForSecurity()` (bash AST). On parse failure (heredocs, nested subshells), returns `() => true` — fail-safe meaning the hook always fires. Too complex to parse → too complex to confidently exclude from safety checks.
- **Auto-classifier `safetyCheck.classifierApprovable`**: `.agents/` and `.git/` edits are `classifierApprovable: true` (unusual but sometimes legitimate). Windows path bypass attempts are `classifierApprovable: false` (almost always adversarial).
- **Permission rules `ruleContent`** support fine-grained matching: `Bash(git *)`, `Edit(/src/**)`, `Fetch(domain:example.com)`. Without `ruleContent`, matches all invocations.

---

## D. MCP transport + integration (ch 15)

**Eight transports.** `stdio` (default — implicit when `type` omitted, backwards-compatible), `http` (Streamable HTTP, recommended as of March 2025 MCP spec update), `sse` (deprecated as of March 2025; mid-2026 migration deadlines), `ws-ide` (Bun/Node runtime split — Bun's WebSocket accepts proxy/TLS natively, Node needs `ws`), `sdk`, `codexai-proxy`, `inProcess` (via `createLinkedTransportPair`), and a runtime-injected variant.

**Seven config scopes.** local, user, project, enterprise, managed (plugin-provided), codexai (web interface), dynamic (SDK runtime). Deduplication is **content-based, not name-based** — `getMcpServerSignature()` returns `stdio:["command","arg1"]` or `url:https://...` as canonical key. Two different names with the same command are recognized as the same server.

**Tool wrapping (4 stages).**
1. **Name normalization** — invalid chars → underscores, prefix as `mcp__{serverName}__{toolName}`.
2. **Description truncation — 2,048 chars cap.** OpenAPI-generated servers have been observed dumping **15-60 KB into `tool.description`** ≈ 15,000 tokens per turn for a single tool.
3. **Schema passthrough** — schema errors surface at call time, not registration time.
4. **Annotation mapping** — `readOnlyHint` enables concurrent execution; `destructiveHint` triggers extra scrutiny. Trust boundary: a malicious server marking destructive as read-only is an accepted risk (alternative — ignoring annotations — would block legitimate UX wins).

**Five connection states.** `connected`, `failed`, `needs-auth` (with **15-minute TTL cache** to prevent 30 servers each rediscovering the same expired token), `pending`, `disabled`.

**Batched connections.** Local servers in batches of **3** (process spawning can exhaust file descriptors). Remote servers in batches of **20**.

**OAuth discovery chain.** RFC 9728 → RFC 8414 → `authServerMetadataUrl` escape hatch (for servers implementing neither RFC). Cross-App Access (XAA) = federated token exchange via IdP — one login unlocks multiple servers.

**Slack-style error normalization.** `normalizeOAuthErrorBody()` peeks at 2xx POST bodies. If body matches `OAuthErrorResponseSchema` but not `OAuthTokensSchema`, rewrites response to HTTP 400. Normalizes Slack-specific codes (`invalid_refresh_token`, `expired_refresh_token`, `token_expired`) → standard `invalid_grant`.

**Session-expiry detection.** Streamable HTTP returns 404 with JSON-RPC -32001 on server restart. `isMcpSessionExpiredError()` uses **string-includes on the error message** (pragmatic but fragile) — connection cache clears, call retries once.

**Per-request timeout (production-incident fix).** Initial bug: single `AbortSignal.timeout(60000)` at connection time → after 60s idle, *next* request aborts immediately. Fix: `wrapFetchWithTimeout()` creates **fresh signal per request**. Same function normalizes `Accept` header as last-step defense against runtimes/proxies that drop it.

**In-process transport (63 lines total).** `send()` delivers via `queueMicrotask()` — prevents stack depth issues in synchronous request/response cycles. `close()` cascades to peer to prevent half-open states. Used by Chrome MCP server and Computer Use MCP server.

---

## E. Remote-control transport details (ch 16)

**Bridge v1 vs v2 lifecycle.**
- v1: register → poll → dispatch → spawn child per session. Pre-flight gauntlet: runtime feature gate, OAuth validation, org policy check, **dead token detection (cross-process backoff after 3 consecutive failures with same expired token)**, proactive token refresh that eliminates ~9% of registrations that would otherwise fail on first attempt. Throttles "no work" log to every 100 empty polls.
- v2: 3 steps — `POST /v1/code/sessions` → `POST /v1/code/sessions/{id}/bridge` (returns `worker_jwt`, `api_base_url`, `worker_epoch` — each call bumps epoch and IS the registration) → open SSE for reads + `CCRClient` for writes.

**FlushGate ordering.** Bridge sends conversation history while accepting live writes. Without ordering, live writes during history flush deliver out-of-order. `FlushGate` queues live writes during flush POST and drains them in order on completion.

**Epoch-based split-brain prevention.** New epoch = same worker with fresh creds. **409 response = epoch mismatch → both connections close, exception unwinds the caller**.

**BoundedUUIDSet (ch 16).** Capacity **2,000**, FIFO-bounded set backed by circular buffer + Set. Two parallel instances (`recentPostedUUIDs` for echo dedup, `recentInboundUUIDs` for re-delivery dedup). O(1) lookup, O(capacity) memory, no timers/TTLs.

**Asymmetric channels (the why).** Reads = high-frequency, low-latency, server-initiated (hundreds of small messages/sec during streaming). Writes = low-frequency, client-initiated, ack-required (per minute, not per second). Unifying on a single WebSocket creates retry-semantics conflict ("not sent" vs "sent but ack lost").

**Reconnect strategy table.**

| Close code | Strategy |
|---|---|
| 4003 (unauthorized) | Stop immediately, no retries |
| 4001 (session not found) | Max 3 retries, linear backoff (transient during compaction) |
| Other | Exponential backoff, max 5 attempts |

**Direct Connect** = local-only WebSocket server. 5 session states: `starting`, `running`, `detached`, `stopping`, `stopped`. Metadata persists to `~/.agents/server-sessions.json` for resume across server restart. URL scheme `cc://`.

**Upstream proxy 6-step setup (in container).**
1. Read session token from `/run/ccr/session_token`.
2. **`prctl(PR_SET_DUMPABLE, 0)` via Bun FFI** — blocks same-UID ptrace of process heap. Without this, prompt-injected `gdb -p $PPID` could scrape the token.
3. Download upstream proxy CA cert + concat with system CA bundle.
4. Start local CONNECT-to-WebSocket relay on ephemeral port.
5. **`unlink()` token file** — token now exists only on heap.
6. Export env vars for subprocesses.

**Every step fails open.** Failed proxy = some integrations don't work, but core functionality remains available.

**Hand-encoded protobuf (10 lines).** `UpstreamProxyChunk { bytes data = 1; }` is encoded by hand instead of pulling in a runtime — single-field message doesn't justify the dep. Bit manipulation maintenance < supply chain risk.

```ts
export function encodeChunk(data: Uint8Array): Uint8Array {
  const varint: number[] = []
  let n = data.length
  while (n > 0x7f) { varint.push((n & 0x7f) | 0x80); n >>>= 7 }
  varint.push(n)
  const out = new Uint8Array(1 + varint.length + data.length)
  out[0] = 0x0a  // field 1, wire type 2
  out.set(varint, 1)
  out.set(data, 1 + varint.length)
  return out
}
```

---

## F. Skills + hooks specifics (ch 12)

**Skill dedup.** `getFileIdentity()` resolves to canonical path via **`realpath` (NOT inode)**. Inodes are unreliable on container/NFS mounts and ExFAT. **First-seen source wins.**

**Skill frontmatter.**
- `name`, `description`, `when_to_use`, `allowed-tools` — standard.
- `disable-model-invocation` — block autonomous model use.
- `user-invocable` — gate slash-command invocation.
- Setting **both** `disable-model-invocation: true` AND `user-invocable: false` makes the skill invisible (useful for hooks-only skills).
- `context: 'fork'` runs the skill as a sub-agent with own context window — for skills that need significant work without polluting main conversation's token budget.

**Hook engine.** Main execution exceeds **4,900 lines**. Three audiences: individual devs, teams, enterprises. Six types: Command (shell), Prompt (single LLM call), Agent (full multi-turn loop), HTTP (POST to URL), Callback (internal, **−70% overhead** fast-path), Function (session-scoped TS).

**Policy cascade.** `userSettings` → highest user priority, but **policy layer always wins**:
- `disableAllHooks` in policy settings clears everything.
- `allowManagedHooksOnly` excludes user and project hooks.
- A user can disable their own hooks but cannot disable enterprise-managed hooks.
- Plugin hooks default to priority 999 (lowest).

**Trust check at top of `executeHooks()`.** Two real Codex vulnerabilities pinned by this guard: hooks firing before trust presented, and after trust declined.

**Stop → SubagentStop auto-conversion.** Sub-agent context fires `SubagentStop`, not `Stop`. Skills that declare a `Stop` hook in sub-agent context need their hook auto-converted at registration — otherwise the hook never fires.

---

## G. How to apply this reference

- Designing a tool? Start with section A (budget table) + B (14 steps) + C (gotchas) — answer each in the design doc explicitly.
- Integrating MCP? Section D — quote the description-truncation number (2,048 / 15-60 KB observed) when explaining why your wrapper truncates.
- Remote agent transport? Section E — copy the BoundedUUIDSet pattern, the reconnect strategy table, and the 6-step proxy setup; don't reinvent.
- Skills/hooks? Section F — `realpath` not inode, policy cascade, trust check, Stop→SubagentStop conversion.

When in doubt, reach for the source: `/tmp/ccfs/ch{06,12,15,16,17}.md` have the production-incident stories behind every rule above.

---

## Currency notes (updated 2026-04-26)

**MCP transport evolution + stability:** SSE (HTTP+SSE) is deprecated as of March 2025 MCP spec; mid-2026 migration deadlines (Atlassian Rovo Jun 30, Keboola Apr 1). Streamable HTTP is the canonical remote transport; `stdio` remains default for local. **The 2026 MCP roadmap explicitly does NOT introduce new transports** — the eight-transport set is stable for the foreseeable future. Plan integrations against this list with confidence; the deprecation path is SSE-only.

**Codex Agent SDK availability:** The Codex Agent SDK (successor to the older SDK) is now production-ready. It exposes the same `query()` generator loop, subagent spawning, and hooks as Codex CLI, making the architectural bets (Bet 1: generator loop; Bet 5: hooks) directly applicable to SDK users. Fork agents (`fork: true` mode) are supported in interactive sessions but disabled in non-interactive Agent SDK calls.

**Skills frontmatter compliance:** The `tool-and-extension-internals.md` reference aligns with Anthropic's published Skills specification (GitHub: anthropics/skills). Frontmatter fields include `name`, `description`, `allowed-tools` (list format), `license`, and optional metadata. The `allowed-tools` field pre-approves tools without permission prompts.
