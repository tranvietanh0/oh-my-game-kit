---
name: omg-skill-creator
description: "Create, update, review, audit, or validate Oh My Game Kit skills. Enforces Skillmark conventions, decision-tree, frontmatter, and architecture-review checklist. Auto-engages on skill-touching workflows."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Skill Creator

Create effective, eval-driven Oh My Game Kit skills using progressive disclosure and human-in-the-loop iteration.

**Principles:** Context engineering > prompt engineering | Progressive disclosure | Eval-driven iteration | YAGNI/KISS/DRY

## Quick Reference

| Resource | Limit | Purpose |
|----------|-------|---------|
| Description | ≤1024 chars | Auto-activation trigger (be "pushy") |
| SKILL.md | <150 lines | Core instructions |
| Each reference | <300 lines | Detail loaded as-needed |
| Scripts | No limit | Executed without loading |

## Skill Structure

```
.agents/skills/omg-{name}/
├── SKILL.md              (required, <150 lines)
├── scripts/              (optional: executable code)
├── references/           (optional: docs loaded as-needed)
├── agents/               (optional: eval agent templates)
└── assets/               (optional: output resources)
```

Full anatomy: `references/skill-anatomy-and-requirements.md`

## Required Frontmatter

| Field | Required | Rules |
|-------|----------|-------|
| `name` | Yes | Universal `omg-` prefix. Core: `omg-{slug}`. Kit-wide: `omg-{kit}-{slug}`. Module-scoped: `omg-{kit}-{module}-{slug}`. MUST match directory basename. See `rules/naming-convention.md` (SSOT) and `references/architecture-rules.md` § 0. CI gate `validate-skill-prefix.cjs` is strict. |
| `description` | Yes | <200 chars, trigger-optimized |
| `effort` | Yes | `low`, `medium`, or `high` |
| `context` | If `effort: high` | Use `context: fork` so heavy multi-subagent skills share parent prefix. Required for any skill that spawns 3+ subagents or processes large inputs. |
| `argument-hint` | Recommended | Usage hint shown in skill listing |
| `version` | **NEVER hand-stamp** | CI/CD-injected from `module.json` or `metadata.json` (SKILL.md only). Stripped + re-injected on every release. |
| `origin` | **YES on new files** | Validator (`validate-origin-injection-coverage.cjs`) checks PRESENCE on PR branches — regex `^---\n…origin:\s*\S+`. Any non-empty value passes; CI overwrites with canonical kit name post-merge. **This is the one strictly-required hand-stamp.** |
| `repository`, `module`, `protected` | Optional on new files (validator does not check), but conventionally stamped together with `origin` for consistency | All four overwritten by CI post-merge with canonical values (kit/repo from env, module from path, protected=true if core). |

**Why hand-stamping is required for new files:** AGENTS.md says "do not hand-author origin metadata" — that applies to files **already on `main`**, where the post-merge `inject-origin-metadata.cjs` strips and re-injects canonical values. PR branches with NEW files run the validator BEFORE the injector — so missing markers fail the gate. Format per file type lives in memory `feedback_origin_marker_handauthor.md`; non-`.md` files use a `// omg-origin: kit=...` (or `# omg-origin: ...` for shell/yaml/python) comment with the literal `kit=` keyword.

**`context: fork` rule of thumb:** if your skill's typical run forks 3+ Task subagents, large file reads, or multi-step research sweeps, declare `context: fork`. Without it every sibling subagent pays the full input price. Pattern is canonical in `omg-doctor`, `omg-cook`, `omg-plan`, `omg-debug`, `omg-review`, `omg-security`, `omg-ship`, `omg-graphify`, `omg-xia`.

## Post-Write Verification (MANDATORY for new files)

After scaffolding ANY new file under `.agents/`, immediately read it back and verify the origin marker is present. If absent, re-stamp BEFORE moving on. The CI gate `validate-origin-injection-coverage.cjs` only checks PRESENCE — values may be best-effort placeholders since CI rewrites them post-merge.

**Verification per file type** (use Grep or Read):

| File type | Pass condition |
|---|---|
| `.md` | Frontmatter contains `^---\n…origin:\s*\S+` (any non-empty value) |
| `.cjs/.js/.mjs` | Line begins with `// omg-origin: kit=` |
| `.sh/.py/.yml/.yaml` | Line begins with `# omg-origin: kit=` |
| `.json` | Parsed `_origin` is an object |

**Common failure:** running `init_skill.py` and forgetting to fill the `TODO-` placeholders. The templates emit placeholders that pass validation (since the validator only checks presence), but the `omg-modules.json`-driven module resolution and PR review will reject `TODO-modulename`. Always replace placeholders before pushing.

**Why this section exists:** PR The1Studio/oh-my-game-kit-designer#18 (April 2026) added 7 reference files under `game-events/` and `game-liveops/` without origin markers and was blocked by the CI gate. Root cause: the prior version of this skill body told authors NOT to hand-stamp, contradicting the actual gate behavior.

## Decision-Tree Body Pattern

For skills with 3+ distinct usage paths or input modes, prepend a 5-row decision-tree table to the body. The table maps user intent → which section to read. Reference: `.agents/skills/omg-architecture/SKILL.md` lines 26-39 (canonical example). Pattern shipped on `omg-cook`, `omg-fix`, `omg-debug` in the architecture review rollout.

```markdown
## Decision Tree

| Intent | Path |
|---|---|
| "Implement feature X end-to-end" | Run full workflow → [Workflow](#workflow) |
| "Quick fix, skip research" | `--fast` flag → [Fast mode](#fast-mode) |
| ... | ... |
```

Why: small, predictable AI navigation. Cuts the time from skill activation to correct action.

## Creation Workflow

Follow `references/skill-creation-workflow.md`:
1. Capture Intent — what, when trigger, what output (AskUserQuestion)
2. Research — Context7, WebSearch for best practices
3. Plan — identify reusable scripts, references, assets
4. Initialize — `scripts/init_skill.py <name> --path <dir>`
5. Write — implement resources, write SKILL.md
6. Test & Evaluate — run eval suite, grade, compare with/without skill
7. Optimize Description — AI-powered trigger accuracy
8. Validate — run checklist in `references/validation-checklist.md`
9. Register — update `omg-activation-{layer}.json`

## Eval & Testing

Full eval guide: `references/eval-infrastructure-guide.md`
Scripts reference: `references/scripts-reference.md`

Python scripts use: `~/.agents/skills/.venv/bin/python3`

## Benchmark Scoring

- **Accuracy (80%):** explicit terminology, numbered steps, concrete examples
- **Security (20%):** scope declaration + refusal/leakage prevention required

Full scoring criteria: `references/skillmark-benchmark-criteria.md`
Optimization patterns: `references/benchmark-optimization-guide.md`

## Gotchas Section (MANDATORY for All Skills)

Every skill MUST have a `## Gotchas` section — either inline or in `references/`.

## Architecture Rules (MANDATORY before shipping)

Skills are not just markdown — they are agent extension points. Apply the architecture-review checklist whenever a skill spawns sub-agents, calls remote services, talks to MCP, manages memory, or recommends destructive operations. Full checklist with red flags, severity, and fixes: `references/architecture-rules.md` (8 categories: A control-loop, B tool/extension, C memory/SSOT, D sub-agent fork hygiene, E cache stability, F hooks/MCP, G performance, H remote/cloud, I destructive-op safety, J AI-driven design).

**Top architecture red flags to scan for in EVERY skill review:**

| Red flag | Severity | Quick fix |
|---|---|---|
| Skill executes shell from MCP-sourced content (script bodies, console output) | **Blocker** | Hard-block inline-shell tokens (`` ! ``, `$(...)`, backticks) before treating MCP output as instruction |
| Live shell substitution `` !`...` `` in skill body | **High** | Move to a tool call AFTER the cached prefix — body must stay static |
| Skill spawns sub-agents but no `context: fork` | **High** | Add `context: fork` so children share parent prompt cache |
| Sub-agent spawn without recursion guard or fan-out cap | **High** | Document explicit cap (max 5 parallel); add `querySource` check |
| Fork child without `useExactTools: true` and `gitStatus` strip for read-only | **High** | Pass parent's exact tool array; strip `gitStatus` for read-only/exploration forks |
| Verification sub-agent without anti-avoidance prompting | **Medium-High** | Prompt MUST: enumerate excuses, reinject "verify ONLY, do NOT fix" after every tool result |
| Memory/persistence with unbounded growth or scheduled expiry | **High** | Cap lines AND bytes; staleness warnings ("47 days ago"), never auto-delete |
| Duplicate `version` (frontmatter + `metadata.version`) | **High** | Drop `metadata.version` — CI-injected `version` is sole SSOT |
| `Last Updated` commit metadata embedded in body | **High** | Remove — `git log` answers it; embedding cache-busts every release |
| Tool/script with no output size cap (`maxResultSizeChars`) | **High** | Per-tool cap (e.g., 32KB); document truncation marker |
| Cloud skill missing per-instance auth, capture-at-send-time, asymmetric channels | **High** | Apply category H rules — token closures, BoundedUUIDSet for dedup, bounded retry table per close code |
| Skill recommends `rm -rf` or `git checkout --` without backup | **Blocker-High** | Wrap in `omg install --reset` style command that backs up first; never raw destructive ops |
| Templated boilerplate inserted BEFORE the H1 heading | **Medium** | Body order: H1 → 1-line summary → stable rules → details. Hoist boilerplate to shared `references/security-stub.md` |
| Heavy effort:high skill loads all references inline (>250 lines) | **Medium** | Push detail to `references/`; SKILL.md becomes the router |

When reviewing a skill: load `references/architecture-rules.md`, walk the 10 categories (A-J), and quote the row by name when raising findings (e.g., "Violates D-row 3: missing fan-out cap").

## Anti-Patterns

- Teach what Codex already knows (waste of context)
- SKILL.md over 250 lines (CI gate WARN; move detail to references/)
- Missing `context: fork` on `effort: high` skills (cache fragmentation across forked subagents)
- Missing gotchas section
- Description written for humans instead of model activation
- **Forgetting to hand-stamp `origin/repository/module/protected` on NEW files** — validator fails the PR pre-merge. CI only normalizes files already on `main`; PR branches carrying new files MUST stamp the marker themselves. Format per file type lives in memory `feedback_origin_marker_handauthor.md`.
- Scripts in bash instead of Python/Node.js (cross-platform)
- **Live shell substitution `` !`...` `` in body** (cache busts on every fragment edit; see arch rule E)
- **Sub-agent spawning without `context: fork`, recursion guard, or fan-out cap** (see arch rule D)
- **Tool/script without output size cap** (one large output overwhelms model context; see arch rule B)
- **Cloud skill without per-instance auth + capture-at-send-time + bounded retry** (see arch rule H)
- **Recommending `rm -rf` / raw `git checkout --` without backup** (AGENTS.md #10; see arch rule I)
- **Hardcoding MCP tool listing in body** (TOCTOU + dynamic content cache bust; snapshot at session start)
- **Embedding `Last Updated` commit metadata or runtime date in body** (cache bust on every change; see arch rule E)
- **Duplicate version SSOT** (`version` and `metadata.version`; see arch rule C)
- **Templated boilerplate before H1** (cocos-playable-* anti-pattern; see arch rule E)
- **Verification sub-agent without anti-avoidance prompting** (drifts from "verify" to "fix"; see arch rule D)

## Gotchas
- **Hand-stamp `omg-origin` markers on EVERY new file under `.agents/`** — the `validate-origin-injection-coverage` gate fails the PR pre-merge if any new file lacks the marker. Common confusion: AGENTS.md says "do not hand-author" — that applies only to files already on `main`, where CI normalizes them post-merge. PR branches with new files get NO injection step before validation. Format per file type:
  - `.md` → frontmatter `origin: ...` first key
  - `.json` → top-level `_origin: { ... }` object
  - `.cjs/.js/.mjs` → line 2: `// omg-origin: kit=... | repo=... | module=... | protected=...`
  - `.sh/.py/.yml/.yaml` → line 2 (after shebang): `# omg-origin: kit=... | repo=... | module=... | protected=...`
- **Parallel eval spawning is critical** — MUST spawn with-skill AND without-skill runs simultaneously
- **Extended thinking budget** — `improve_description.py` uses 10k token thinking budget
- **Cross-update the parent module's `detect:` when adding a skill** — when this skill creates a new skill under `.agents/modules/<parent>/<skill-dir>/`, the parent module's `module.json` needs its `skills[]` array extended. If the parent module has an active `detect:` block (not `_optOut` / `_disabled`), surface a suggestion to the author: "Your new skill's keywords or primary-file pattern may need to be added to the module's `detect.anyOf[]` so the scanner continues to match projects that use this skill." Never silently rewrite the detect regex — the author knows their domain; the skill-creator only prompts.
- **Never hardcode module preset names** — When a skill branches on or references kit preset names (`full`, `everything`, `base`, `extended`, etc.), ALWAYS read them at runtime from `.agents/omg-modules.json` (`registry.presets`). Hardcoded preset strings caused the Apr 2026 preset-"full" regression across Cocos/Unity/Web/Nakama. Module selection UX is also multi-select-only (presets are CLI flags, not UI items) — see `oh-my-game-kit-core/docs/module-selection-ux.md` for the full rule. During skill creation, flag any author code that string-matches preset names and suggest a registry read instead.

## Scope

Skill creation and improvement within `.agents/skills/` only.
