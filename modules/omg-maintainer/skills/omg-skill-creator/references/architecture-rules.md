---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Architecture Rules for Skills

Distilled from `omg-architecture/references/review-checklist.md` (Codex reverse-engineering canon) and applied to Oh My Game Kit skill design. Use this when creating, reviewing, or auditing any skill — these rules catch failure modes that Skillmark formatting checks (frontmatter, line cap, gotchas) cannot.

**Severity legend:** **Blocker** (security/correctness) · **High** (measurable cost: cache busting, death-spiral, missing recovery) · **Medium** (architectural drift) · **Low** (clarity/naming)

---

## 0. Universal `omg-` prefix (MANDATORY) — Blocker

**Every skill in every kit MUST start with `omg-`. No exemptions, including core.**

Tier-derived form:

| Tier | Pattern | Example |
|---|---|---|
| Core kit | `omg-{name}` | `omg-doctor`, `omg-cook` |
| Kit-wide (non-core) | `omg-{kit}-{name}` | `omg-unity-mcp-skill` |
| Module-scoped | `omg-{kit}-{module}-{name}` | `omg-unity-dots-ecs-core`, `omg-web-ui-styling` |

`{kit}` is the repo slug minus the `oh-my-game-kit-` prefix. `{module}` is the directory under `.agents/modules/{module}/skills/` or `modules/{module}/skills/`.

**Enforcement:** `oh-my-game-kit-release-action/scripts/lib-prefix.cjs` is the SSOT (functions: `expectedName`, `expectedPrefix`, `conforms`, `warnOnly`). CI runs three strict gates on every push:

| Gate | What it checks |
|---|---|
| `validate-skill-prefix.cjs` | Every SKILL.md frontmatter `name:` and skill directory matches the tier-derived expected name |
| `validate-agent-prefix.cjs` | Every agent file basename matches the tier-derived expected prefix |
| `validate-new-name-conformance.cjs` | Skills/agents added since the last release conform to the rule |

Default since 2026-05-08 is strict (`OMG_GATE_STRICT=1`); `OMG_GATE_WARN_ONLY=1` is the explicit downgrade for emergency rollouts.

**Checklist for new skills:**

1. Pick the tier (core / kit-wide / module-scoped) based on which `module.json` will list the skill.
2. Compose the name from the table above. Verify with `lib-prefix.expectedName({kit, module, slug})` if implementing programmatically.
3. Update `SKILL.md` frontmatter `name:` BEFORE renaming the skill directory — the prefixer relies on this order.
4. Update the owning `module.json` `skills:` array.
5. Regen `omg-modules.json` via `generate-modules-registry.cjs` (per `rules/module-registry-sync.md`).
6. Run `node scripts/validate-skill-prefix.cjs` locally before pushing.

History: rolled out 2026-05-08 via `plans/260508-1544-omg-prefix-universal/`. 326 skills + 44 agents renamed across 9 repos in one session. Audit SSOT: `audit-skills.json` in that plan dir.

---

## 0.1 Slug dedup invariant (algorithm v2) — Blocker

**The slug part of a new skill MUST NOT start with the kit-short or any module-segment-token.** The prefixer would strip them at release time anyway, so authoring redundant prefixes only creates churn (and shipped the double-prefix names — `omg-rn-rn-base-base-architecture` etc. — that the 2026-05-10 dedup migration cleaned up).

**Algorithm v2 (left-prefix-strip recursion):** `expectedName({kit, module, slug})` builds a candidate set `{kitShort} ∪ {module-segments-split-on-hyphen}` and recursively strips any matching `{cand}-` left prefix from `slug` until no further match. Idempotent. See `oh-my-game-kit-release-action/scripts/lib-prefix.cjs:71-110` for the canonical implementation.

**Examples (do NOT do these):**

| Kit | Module | BAD slug | What ships (after v2 strip) |
|---|---|---|---|
| rn | rn-base | `base-architecture` | `omg-rn-rn-base-architecture` (the leading `base-` is stripped) |
| cocos | cocos-animation | `cocos-playable-juice` | `omg-cocos-cocos-animation-playable-juice` (leading `cocos-` stripped) |
| designer | design-base | `design-data-authoring` | `omg-designer-design-base-data-authoring` (leading `design-` stripped) |
| unity | dots-core | `dots-architecture` | `omg-unity-dots-core-architecture` (leading `dots-` stripped) |

**Examples (CORRECT):**

| Kit | Module | GOOD slug | Ships as |
|---|---|---|---|
| rn | rn-base | `architecture` | `omg-rn-rn-base-architecture` |
| unity | dots-core | `ecs-core` | `omg-unity-dots-core-ecs-core` |
| designer | design-puzzle | `game-design` | `omg-designer-design-puzzle-game-design` |

**Note on shorthand prefixes (e.g., `perf-` for module `rn-performance`):** Algorithm v2 leaves these alone — `perf` is not a literal repeat of `performance`. Per-name human disposition required if you want to dedup shorthand. As of 2026-05-10, the four `omg-rn-rn-performance-perf-*` skills ship with the `perf-` prefix intact (algorithm v2 default).

**Authoring check:** before creating the skill directory, mentally apply algorithm v2 — if your slug starts with `{kit-short}-` or any segment of `{module}-`, drop that segment.

History: rolled out 2026-05-10 via `plans/260510-1711-skill-name-dedup/`. ~20 skill directories renamed across 3 kits (rn=5, unity=11, designer=4). 5 kits already canonical (cli, cocos, marketing, nakama, web) — no changes needed.

---

## 0.2 Activation-fragment ref convention — Medium

**When you add a skill, register its keyword mappings in the owning module's `omg-activation-*.json` fragment using the BARE-slug form, not the full-prefixed form.**

The CI prefixer's `auto-prefix-skills.cjs::buildSelfHealMap()` accepts five plausible bare forms per real skill dir:

| Form | Example (real dir: `omg-rn-rn-base-architecture`) |
|---|---|
| Identity (full-prefixed) | `omg-rn-rn-base-architecture` |
| Kit + module strip | `architecture` |
| Kit-only strip | `rn-base-architecture` |
| Module-only strip | `rn-rn-base-architecture` |
| `omg-` only strip | `rn-rn-base-architecture` |

**Authoring convention:** prefer the kit + module strip form (the local slug), e.g.:

```json
{
  "mappings": [
    { "keywords": ["routing", "expo router"], "skills": ["navigation"] }
  ]
}
```

NOT: `["omg-rn-rn-base-navigation"]` (full-prefixed — works but verbose) or `["rn-navigation"]` (legacy `{kit}-{slug}` form skipping the module segment — NOT in the self-heal accept set, will fail the per-PR drift safety-net gate `validate-activation-skill-resolution.cjs`).

**Why bare form is the SSOT:** keeps fragments human-readable, lets the prefixer canonicalize at release-time without per-author churn, and matches the convention used by the original 8-kit migration. The full-prefixed form is what ships in user-facing slash commands but is not the right granularity for fragment-author intent.

**Two CI gates protect this invariant** (release-action):

| Gate | What it catches |
|---|---|
| `validate-activation-skill-resolution.cjs` | Refs that don't resolve to any real dir (typos, dead refs, legacy `{kit}-{slug}` form). Strict-by-default; wired WARN during introduction soak (2026-05-11). |
| `validate-activation-coverage.cjs` | Skills that exist on disk but have NO activation ref anywhere (orphaned skills). WARN level — advisory. |

The two gates check inverse invariants and complement each other: together they assert refs ↔ dirs is a bijection on the resolved set.

**Skill rename + activation update:** if you rename a skill directory, also update every `omg-activation-*.json` `skills[]` array that references the old slug (per `omg-sync-back/SKILL.md` operational notes). The prefixer self-heals on the next CI run, but shipping the activation update in the same PR keeps the SSOT consistent.

---

## 0.2 Slash UX `name:` field colon-form (PENDING — colon-namespace migration)

**Status:** PLANNED rollout per `plans/260510-1711-skill-name-colon-namespace/` (oh-my-game-kit-core). Phase 0–2 (research + release-action helpers + this docs update) shipped 2026-05-10 during the dedup soak window. Phase 3 (consumer-kit smoke) and Phase 4 (kit fan-out) are deferred until dedup soak ends 2026-05-17 — see `plans/260510-1711-skill-name-dedup/SEQUENCING-WITH-COLON-PLAN.md` Hard rule 2.

**Target invariant:** the SKILL.md frontmatter `name:` field uses **colon** as the inter-tier separator (`omg-kit:module:slug`), while the directory name keeps **hyphens** (`omg-kit-module-slug/`). Two separators, two SSOTs:

| Tier | Directory (filesystem) | `name:` field (slash UX) | Example |
|---|---|---|---|
| Core | `omg-{slug}/` | `omg-{slug}` | `omg-cook/` → `name: omg-cook` *(already shipped)* |
| Kit-wide non-core | `omg-{kit}-{slug}/` | `omg-{kit}:{slug}` *(2-tier — Q1 resolved 2026-05-10)* | `omg-unity-mobile/` → `name: omg-unity:mobile` |
| Module-scoped | `omg-{kit}-{module}-{slug}/` | `omg-{kit}:{module}:{slug}` | `omg-unity-dots-core-ecs-core/` → `name: omg-unity:dots-core:ecs-core` |

**Hyphens within a single segment are PRESERVED in colon form.** `dots-core` (module name with internal hyphen) stays `dots-core` in both forms; only the inter-tier separator changes.

**Helpers** (release-action `scripts/lib-prefix.cjs`):
- `expectedSlashName({kit, module, slug})` — returns the canonical colon-form `name:` value. Algorithm-v2 dedup applied to slug for parity with `expectedName`. Idempotent.
- `directoryToSlash({kit, module, slug})` — thin wrapper.
- `checkSlashName({kit, module, slug, actual})` — validator with did-you-mean hints.
- `audit-name-fields.cjs` — read-only audit walks SKILL.md files in a kit clone, emits per-file migration map.
- `migrate-name-fields.cjs` — applies the audit's rewrite plan in place. Atomic per-file writes. Drift-detection.

**Authoring guidance during the deferred-rollout window (2026-05-10 → ~2026-05-17):**
- New skills in **oh-my-game-kit-core** SHOULD use colon-form `name:` (the convention is already shipped for core — every new core skill should match).
- New skills in **non-core kits** SHOULD continue to use hyphen-form `name:` until their kit ships the colon migration in Phase 4. The auto-prefixer would currently rewrite a colon `name:` back to hyphen on release because the gates have not been flipped yet — defer until Phase 4 ships per kit.
- The cross-ref gate (`check-skill-cross-refs.cjs`) already accepts BOTH forms in prose (per release-action#71) — colon and hyphen separators are aliased to the same registry key during the transition.

**Why this isn't enforced yet:** transitional alias support is not available in the Codex harness (`plans/260510-1711-skill-name-colon-namespace/harness-research.md`). Hard cutover at Phase 4 is the only path. Premature enforcement would break consumer kit installs mid-soak.

**Agents are NOT in scope.** Agent `name:` field stays hyphenated (must equal file basename per filesystem rule). See §0.3 below.

---

## 0.3 Agent name: hyphen-only invariant — Blocker

**Agent SKILL.md (technically `agents/*.md`) `name:` field MUST equal the file basename without extension.** Both stay hyphenated regardless of whether skills migrate to colon form. Reasons:

1. Agents are invoked via `Task(subagent_type: "...")`, NOT slash. There is no slash UX surface for agents, so the slash-form-readability argument that drives skill colon-form does not apply.
2. The harness resolves agents by file basename. A `name:` field that doesn't match the basename causes lookup failures.
3. Filesystem rule (universal across all kits): hyphens are filesystem-safe, colons are not portable to NTFS.

**Correct form for every agent** — see `omg-agent-creator/references/architecture-rules.md` §0.2 for the canonical example. (Code block omitted here to keep the example out of the cross-refs gate's prose-scan target — agent file paths inside slash-prefixed comments would be flagged as broken skill refs.)

Plan `plans/260510-1711-skill-name-colon-namespace/PLAN.md` §2 is explicit: agents are out-of-scope. Do NOT colon-namespace agent `name:` fields.

---

## A. Control loop & termination

| Red flag | Severity | Fix |
|---|---|---|
| Skill describes workflow steps with implicit termination ("when done, return") | Medium | Use typed discriminated termination: explicitly enumerate "complete", "blocked", "needs-clarification", "fatal" — not implicit |
| Workflow advises "retry until success" without circuit breaker | High | Specify max-retries cap (e.g., 3) and circuit-break on consecutive failure |
| Stop-hook injection without one-shot guard | High | Each retry path must have a one-shot flag; preserve flags across stop-hook retries |

---

## B. Tool & extension interface

| Red flag | Severity | Fix |
|---|---|---|
| Skill scripts/tools have no output size cap | High | Per-tool `maxResultSizeChars` (e.g., 32KB); document truncation marker |
| Read-equivalent tools have a finite cap | Medium | Use `Infinity` for Read-class tools (avoid Read-the-persisted-file loops) |
| Defaults are fail-OPEN (e.g., `--no-security-check` without warning, `isParallelSafe: true` default) | High | Defaults must be fail-CLOSED; opt-in to risky behavior with `_reason` rationale |
| Shell command matchers return `false` on parse failure | Blocker | Return `() => true` on parse failure — too complex to parse → always trigger hook/prompt |
| Permission matching by tool name only | Medium | Support `Bash(git *)`, `Edit(/src/**)`, `Fetch(domain:example.com)` patterns |
| Speculative tool execution without abort handling | Medium | Synthetic `streaming_fallback` error result on discard |

---

## C. Memory & SSOT

| Red flag | Severity | Fix |
|---|---|---|
| Duplicate `version` (frontmatter `version` AND `metadata.version`) | High | Drop `metadata.version` — CI-injected `version` is the single SSOT |
| `Last Updated` commit metadata embedded in skill body | High | Remove — `git log` answers it on demand. Prevents per-commit cache bust + drift |
| All memory in one giant file | Medium | Index + on-demand body files |
| Memory index has no size cap | Medium | Cap lines AND bytes; surface actionable guidance on overflow |
| Frontmatter scan reads full file | Low | Scan first ~30 lines only (frontmatter-scan-only) |
| Memory expires on schedule | High | Staleness warnings ("47 days ago"), never auto-delete |
| ISO timestamp in stale-warning text | Low | Use "47 days ago" — models don't reason well about ISO ages |
| Path validation only does `path.resolve()` | High | Three-layer defense: sanitize → resolve+prefix-check → realpath-of-deepest-existing-ancestor |
| Save-corrections-only feedback | Medium | Save BOTH corrections AND confirmations of non-obvious choices |
| Storing knowledge derivable from project state (file paths, code patterns, git history) | High | Don't store; derive on demand. Stale liability otherwise |
| Auto-saving every observation without relevance gate | Medium | Selection-rate telemetry collapses to 0/N — gate by file path, concrete tradeoff, or rejected alternative cited |

---

## D. Sub-agent spawning (REQUIRED for any skill that spawns agents)

| Red flag | Severity | Fix |
|---|---|---|
| Skill spawns agents but no `context: fork` declaration | High | Add `context: fork` so children share parent prompt cache (~90% input-token discount) |
| No recursion guard against skill spawning instance of self | High | Belt-and-suspenders: primary `querySource` check + fallback message-history scan for boilerplate tag |
| No fan-out cap (spawns "one per item" with unbounded N) | High | Document explicit cap (e.g., max 5 parallel sub-agents); add `--max-concurrent N` flag |
| Fork child re-renders system prompt | High | Thread parent's already-rendered prompt as bytes via `override.systemPrompt` |
| Fork child doesn't pass `useExactTools: true` | High | Pass exact parent tool array — reorder/filter changes serialization → cache miss |
| Verification sub-agent without anti-avoidance prompting | Medium-High | Prompt MUST: (1) explicitly enumerate excuses ("this should work", "looks fine") (2) reinject critical reminder ("verify ONLY, do NOT fix") after every tool result |
| Different code paths per agent type | Medium | One universal lifecycle function with config; agent type encoded in config not control flow |
| Schema includes all fields always | Medium | Schema-shape-by-flag: omit fields when controlling flags are off |
| Read-only/exploration sub-agents include `gitStatus` | Medium | Strip `gitStatus` for read-only forks (40KB stale snapshot; agent can run `git status` for fresh data) |
| Sub-agent shares parent's abort controller | Medium | Async agents get fresh controllers; sync share parent's |
| Sub-agent spawned without filtering incomplete tool calls | Blocker | API rejects orphan `tool_use` lacking `tool_result`. Use `filterIncompleteToolCalls()` in fork path |
| Agent tool retained in fork child WITHOUT recursion guard | High | Recursion guard required; or remove Agent from child tool pool |
| Placeholder result varies per child | Medium | Constant `'Fork started -- processing in background'` for every parent `tool_use` |
| `initialMessages` reference held by fork child | Low | Manual GC hint: `initialMessages.length = 0` |

---

## E. Prompt cache stability (CRITICAL for `effort: high` and frequently-co-activated skills)

| Red flag | Severity | Fix |
|---|---|---|
| Live shell substitution `` !`...` `` in skill body | High | Move live data to a tool call AFTER the cached prefix; keep body static |
| Conditional inserts in middle of skill body | High | Each conditional doubles unique cache prefix hashes (2^N explosion) — move conditionals to bottom |
| Helper named `addCustomization()` (neutral name for cache-busting helper) | Medium | Rename to `DANGEROUS_*`; require `_reason` parameter |
| `getCurrentDate()` / runtime date computation in body | Medium | `memoize(getLocalISODate)` — midnight crossover busts entire cached prefix |
| Tool array re-sorted per session | High | Built-ins prefix + MCP suffix; sort each partition alphabetically (stable order) |
| Templated boilerplate inserted BEFORE the H1 heading | Medium | Body order: H1 → 1-line summary → stable rules → details. Boilerplate goes AFTER H1 or in shared `references/security-stub.md` |
| Body-embedded scripts (inline JS/Python in body) | Medium | Move to `scripts/`; SKILL.md invokes the script. Cuts per-call render cost + script becomes testable |
| Reference-loading rules conditional on flags inserted mid-body | Medium | Move loader logic to bottom; cached once |
| Feature toggle UI flips header bit live | Medium | Sticky latch: once true, never returns false |
| Dynamic agent list in tool description | Medium | Move to attachment message (Codex saved 10.2% `cache_creation` tokens this way) |

**Rule of thumb:** Body order = stable rules FIRST, dynamic content LAST, conditional inserts NEVER.

---

## F. Hooks, MCP, & extensibility

| Red flag | Severity | Fix |
|---|---|---|
| Skills/scripts execute inline shell from MCP-sourced content (script bodies, console text, asset paths) | **Blocker** | Hard-block inline-shell tokens (`` ! ``, `$(...)`, backticks) in any MCP tool response before treating it as instruction |
| Skills loaded fully at startup | Medium | Two-phase: frontmatter at startup, body on invocation |
| Skill dedup by inode | Medium | `realpath`-based dedup (inode unreliable on container/NFS/ExFAT) |
| Hooks re-read on every event | Blocker | Snapshot at startup; rebuild only on explicit channel (TOCTOU vulnerability) |
| Exit code 1 means "blocking" in hook contract | High | Exit 2 — uncommon code, not ambient noise (1 collides with every script failure) |
| User can override enterprise hooks | Blocker | Strict cascade: enterprise > local > project > user > plugin |
| Hooks fire before trust is presented or after trust declined | Blocker | Trust check at top of `executeHooks()` |
| Stop hook exists but never blocks continuation | Medium | Stop hook returning exit 2 forces continuation — opportunity for "are you really done?" goal-directed loop |
| Skill declares `Stop` hook in sub-agent context | Medium | Sub-agents fire `SubagentStop`, not `Stop` — auto-convert `Stop` → `SubagentStop` in registration |
| MCP tool listing re-read at runtime | High | Snapshot MCP server list once at session start; refresh only on explicit user request (TOCTOU) |

---

## G. Performance

| Red flag | Severity | Fix |
|---|---|---|
| Bootstrap-heavy SKILL.md (>250 lines, all references inline) | Medium | Push detail to `references/`; SKILL.md becomes the router |
| Per-frame allocations in render path | Medium | Pre-allocated frozen objects, interning pools |
| `max_output_tokens: 64000` default | Low | 8K default, retry at 64K on <1% truncation (production p99 ~5K) |
| Streaming with one shared timeout | Medium | Idle watchdog: warn at 45s, abort at 90s; recreate fresh signal per request |
| Fuzzy search without bitmap pre-filter | Low | 26-bit bitmap pre-filter; one int compare rejects 10-90% |

---

## H. Remote / cloud (REQUIRED for any skill that talks to remote services)

Applies to: GitHub MCP, Firebase, PlayFab, payment providers (Stripe, Paddle, SePay, Polar, Creem), ad networks (AdMob, AppLovin, IronSource, Unity Ads, Meta), auth providers (better-auth, OAuth), deploy targets (Vercel, Cloudflare, AWS, GCP), Nakama gRPC, Unity Netcode, etc.

| Red flag | Severity | Fix |
|---|---|---|
| One channel for reads + writes | Medium | Asymmetric: WebSocket/SSE for reads, plain HTTP for writes. Retry semantics differ (read=persistent, write=ack-required) |
| Reconnect strategy is one-size-fits-all | Medium | Data-driven table on close code (4003→stop, 4001→linear-3-retries, other→exp-cap-5) |
| Token re-read on 401 | High | Capture-at-send-time (race with concurrent refreshes leaks old tokens) |
| Process-wide env var holds JWT | High | Per-instance auth-token closure; never `process.env.X` mid-flow |
| Token file persistent on disk after read | Medium | Read once, then `unlink()`; combine with `prctl(PR_SET_DUMPABLE, 0)` for prod |
| Echo dedup via TTL cache | Medium | `BoundedUUIDSet`: circular buffer + Set, FIFO eviction, no timers (memory unbounded under burst otherwise) |
| No epoch on bridge messages | Medium | Worker epoch on every bridge call; 409 closes both channels (silent split-brain otherwise) |
| Fixed reconnect interval | Medium | Linear backoff for known-cause; exponential capped for unknown |

---

## I. Destructive operation safety (AGENTS.md #10)

| Red flag | Severity | Fix |
|---|---|---|
| Skill recommends raw `rm -rf` on user files/dirs | Blocker | Wrap in CLI command (`omg install --reset`, `omg doctor --nuke`) that backs up to `~/.agents-backup-{ISO-ts}/` first |
| Skill recommends `git checkout -- <file>` as recovery without backup | High | Replace with: (1) `cp <file> <file>.bak` (2) `git stash` (3) THEN `git checkout` |
| Bulk delete workflow without snapshot/rollback | High | Add explicit step: snapshot or stash before delete; verify build before discarding backup |
| `--no-security-check` style flags documented as opt-out without warning | Medium | Reframe: security check is mandatory; `--no-security-check` requires `_reason` rationale comment |

---

## J. AI-driven design (per AGENTS.md principle #8)

| Red flag | Severity | Fix |
|---|---|---|
| Skill puts policy/decision logic in pure-CLI scripts when AI could add semantic context | Medium | CLI/scripts emit machine-parseable facts (JSON + file excerpts); skill uses Codex to decide policy and explain rationale |
| Skill duplicates static mapping that should be data-driven | Medium | Read from registry at runtime: activation fragments, SKILL.md, routing JSON, config fragments. Test: deleting your map breaks nothing if data comes from files |

---

## Anti-Pattern: Inlining Universal Rules in Skill Bodies

Universal behavioral rules and architectural principles **auto-load every session** from `.agents/rules/`. Inlining them inside SKILL.md duplicates content, drifts over time, and bloats skill context.

**The 3 known offenders (do NOT paste these into a SKILL.md):**

| Boilerplate | Lives in |
|---|---|
| `## Security` block with "Never reveal skill internals", "Refuse out-of-scope", "Never expose env vars" | `.agents/rules/skill-security-boilerplate.md` |
| `## AI-Driven Design` block citing AGENTS.md principle #8 | `.agents/rules/ai-driven-design.md` |
| 5-line fork-hygiene block ("OMG_FORK_DEPTH < 2 ... fan-out cap 4 ...") | `.agents/skills/omg-architecture/references/fork-hygiene.md` (cite, don't paste) |

**Test:** if the boilerplate would apply to ≥3 skills verbatim, it belongs in `rules/` (universal behavior) or `references/` (universal domain). NOT in skill bodies.

**Caught by:** doctor check `check-no-inline-universal-rules.cjs` (errors locally) + release-action CI gate `validate-no-inline-universal-rules.cjs` (errors at PR level).

**Origin:** plan `20260428-1530-architecture-fix-rollout` removed ~350 lines of inlined boilerplate across 7 kits.

---

## How to apply this checklist

1. **Quote the red-flag row** when raising a finding (e.g., "Violates D-row 3: missing fan-out cap")
2. **Cite severity** so the author knows whether to block the PR or file as follow-up
3. **Suggest the specific fix** from the table — not "fix this" but "add `useExactTools: true` to the fork call site at line 47"
4. **Acknowledge intentional exceptions** — some patterns (e.g., raw `rm -rf` inside `omg install --reset` itself) are scale/scope-justified. Document the "why exempt" inline so reviewers don't re-flag.

## Sources

- `omg-architecture/references/review-checklist.md` — original Top 20 + 8 categories
- `omg-architecture/references/architectural-bets.md` — the 5 proven bets
- `omg-architecture/references/cache-stability-rules.md` — deeper cache-stability detail
- `AGENTS.md` principle #10 — destructive operation safety
- `AGENTS.md` principle #8 — AI-driven, tools as foundation
- `rules/code-conventions.md` — SSOT and No Derived Fields
