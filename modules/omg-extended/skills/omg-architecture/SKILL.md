---
name: omg-architecture
description: "Design and review agentic systems against Codex architecture canon — agent loops, tool interfaces, prompt-cache strategy, MCP/hooks/memory primitives, CLI vs Agent SDK."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Codex Architecture — Design & Review Skill

Canon for designing/reviewing agentic systems, distilled from an 18-chapter reverse-engineering of Anthropic's Codex CLI.

## When to use

- **Designing** an agent loop, sub-agent system, tool interface, memory system, hooks/extension model, prompt-cache strategy, or remote agent transport.
- **Reviewing** kit code, agent defs, tool implementations, hook configs, prompts — to spot drift.
- **Debugging** an agent that's looping, leaking cache, busting context, fanning out unsafely.
- **Comparing** Codex CLI to Agent SDK / LangGraph / OpenAI Agents / MS Agent Framework / Google ADK.
- **Sanity-checking** a change: "would Codex do it this way? if not, why?"

## Decision tree — which reference do I load?

Load only the reference you need (each is self-contained):

| Intent | Load |
|--------|------|
| "Is my design aligned with proven bets?" | `references/architectural-bets.md` |
| "Cross-cutting patterns / connective tissue" | `references/cross-cutting-patterns.md` |
| "I'm starting a new design — what should I ask?" | `references/design-checklist.md` |
| "Review this kit/agent/tool code" | `references/review-checklist.md` |
| "Walk me through the agent loop in detail" | `references/agent-loop-anatomy.md` |
| "Prompt-cache stability concerns" | `references/cache-stability-rules.md` |
| "Tool pipeline / MCP / remote transport / skills+hooks specifics" | `references/tool-and-extension-internals.md` |
| "CLI pattern vs Agent SDK; cross-framework applicability" | `references/architectural-bets.md` → "Agent SDK vs CLI" + "Cross-system matrix" |
| "Full chapter-by-chapter digest" | `references/full-study.md` |

## The 5 architectural bets (one-liner each)

1. **Generator loop > callbacks.** One async generator (`query()`); 10 terminal + 7 continuation states in a discriminated-union return type.
2. **File-based memory > databases.** Markdown on disk + Sonnet side-query for relevance. Observable, version-controllable, zero infra.
3. **Self-describing tools > central orchestrator.** Each tool carries its own schema/permissions/concurrency-safety. MCP tools become first-class via the same interface.
4. **Fork agents > fresh agents (for parallel work).** Forked sub-agents share parent's prompt cache → ~90% input-token discount on book-claimed numbers; measure your own fleet.
5. **Hooks > plugins.** External processes via exit codes + JSON. Crashes isolated. Protocol stable since 1971 (Unix process exit + stdin/stdout).

## Closing meta-principle

> **Push complexity to the boundaries.** Messy outside (5 keyboard protocols, 8 MCP transports, untrusted hooks). Typed/exhaustive inside (`ParsedKey`, recalled memories, `Tool` objects, permission decisions). Each boundary absorbs chaos and exports order.

## Quick-fire heuristics (apply before opening a reference)

- **LLM-driven loop:** typed discriminated union for termination ("why did we stop?"). Not a sentinel/flag.
- **Prompt-cache surface:** system prompt is `[static..., BOUNDARY, dynamic...]`. Runtime branches before the boundary cause 2^N hash explosion. Cache-busters MUST be named `DANGEROUS_*` with a `_reason` parameter.
- **Sub-agent spawn:** decide explicitly — fork (cache-shared) vs fresh (clean context). High-overlap parallel → fork. Different domain → fresh.
- **Extension surface:** prefer hooks (process isolation) over plugins. Snapshot-and-freeze hook config at startup; never re-read at runtime (TOCTOU).
- **Cross-session storage:** files-on-disk first; DB only when profiling demands. User must `vim`/`grep`/`rm` it.
- **Timeouts:** layered, each protecting one specific failure. Don't reuse one signal across requests.

## How to apply

1. **Match activation cue → reference** via the decision tree.
2. **Load only that reference.**
3. **Quote the bet/pattern by name.** e.g., *"Violates Bet 3 — orchestrator switches on `tool.name`. Move `isConcurrencySafe(input)` to the tool."*
4. **Acknowledge intentional mismatch.** Some patterns are scale-justified only (forked Ink renderer, 8 MCP transports). Smaller projects can simplify — say so.
5. **Calibrate to runtime.** If the user is on the Agent SDK (not CLI), fork-agents and CLI-internal patterns may not apply — see SDK-vs-CLI section in `architectural-bets.md`.

## Sources & verification

### Stable sources (design principles — rarely change)
- Architecture principles and bets: `references/architectural-bets.md`
- Chapter-by-chapter digest: `references/full-study.md`
- Source site: `https://codex-code-from-source.com/`

### Volatile sources (live specs — verify freshness before citing)
- **Externally verified** (Anthropic docs / MCP spec): cache pricing (1.25x write 5min, 2x write 1hr, 0.1x read), 1-hour TTL, workspace cache isolation (Feb 2026), Skills frontmatter, MCP transport set + SSE deprecation (March 2025), Agent SDK surface.
- **Book-claimed only** (direction, not benchmarks): 250K compact-fail-loop calls/day, 10.2% `cache_creation` savings, ~90% prefix overlap, 4.6B chars/week, 1,730-LOC `query.ts`. Quote with "Codex's reverse-engineered design indicates..." not as confirmed metrics.

## Scope

Architectural review/design guidance only. Does NOT write code (use `omg-cook` / `omg-plan`), replace your measurement, or apply identically to non-Codex frameworks (see cross-system matrix in `architectural-bets.md`).
