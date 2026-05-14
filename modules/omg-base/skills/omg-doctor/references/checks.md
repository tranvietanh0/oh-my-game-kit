---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Doctor Checks Reference

## Core Checks (#1–6)

1. **Role coverage** — every role in `omg-routing-*.json` has a matching agent `.md` file
2. **Skill existence** — every skill in `omg-activation-*.json` has a matching skill folder in `.agents/skills/`
3. **No cross-layer hardcoding** — scan `omg-routing-*.json` values for engine-specific strings (dots-, unity-, cocos-)
4. **Manifest integrity** — `.omg-manifest.json` matches actually installed files
5. **Registry version compat** — all `omg-routing-*.json` and `omg-activation-*.json` use `registryVersion: 1`
6. **Config completeness** — every command in `omg-config-*.json` has a matching skill folder

## Module Checks (#7–17)

Follow protocol: `skillsomg-modules/references/module-detection-protocol.md` — skip if no `installedModules` key or no metadata.

| # | Check | Validates |
|---|---|---|
| 7 | Module file ownership | Every skill file belongs to exactly one module via `.omg-manifest.json` (no overlap) |
| 8 | Module dependency integrity | All declared dependencies (from module.json) are installed with compatible versions |
| 9 | Activation fragment match | Each installed module has activation source (module.json or omg-activation-*.json) |
| 10 | Module agent presence | Each module declaring agents has matching `.md` files |
| 11 | Routing overlay validity | Module overlays reference only that module's agents |
| 12 | No stale module files | No files from uninstalled modules remain (cross-check manifests) |
| 13 | SessionBaseline in required module | `sessionBaseline` skills are in required modules only |
| 14 | Keyword uniqueness | No keyword maps to skills in two different modules |
| 15 | Routing priority uniqueness | No two module overlays override same role at same priority |
| 16 | Origin frontmatter match | In-file `origin` frontmatter matches metadata entry |
| 17 | Module frontmatter presence | Files in `modules/*/` have `module:` field in frontmatter matching parent dir |

## Manifest Checks (#21)

| # | Check | Validates |
|---|---|---|
| 21 | Module manifest integrity | Each installed module has `modules/{name}/manifest.json`; listed files exist at flat locations; no orphaned flat files |

**Check #21 details:**
1. For each installed module in metadata: verify `.agents/modules/{name}/manifest.json` exists
2. For each file in manifest: verify it exists at the flattened location
3. Scan `.agents/skills/` for dirs matching `{module}-*` pattern not in any manifest → orphaned
4. Severity: WARN (pre-flattening installs won't have manifests)

## SSOT & Structure Checks (#22–27)

| # | Check | Validates |
|---|---|---|
| 22 | schemaVersion present | `metadata.json` has `schemaVersion: 3` |
| 23 | Version presence | `metadata.json` has real `version` (not `"0.0.0-source"`) and `buildDate` (not `null`) |
| 24 | No stale root modules/ | No `modules/` at repo root alongside `.agents/modules/` (canonical) |
| 25 | Context requiredPaths set | Engine kits (unity/cocos/rn) have `context.requiredPaths` in config |
| 26 | Activation format modern | All `omg-activation-*.json` use `mappings` array, not deprecated `keywords` object |
| 27 | v3 installedModules | CLI writes `installedModules` with `kit`, `repository`, `version` per module |

## No-Override Checks (#28–29)

| # | Check | Validates |
|---|---|---|
| 28 | Filename collision detection | No two installed kits/modules have same-named agents, skills, or rules. Group files by basename + read `origin` metadata. Exception: merge targets (metadata.json, omg-modules.json, settings.json, AGENTS.md). |
| 29 | Agent prefix correctness | Non-core agents have proper prefix: `{kit-short}-` (kit-wide) or `{kit-short}-{module}-` (module). Core agents have no prefix. Slug part must be canonical per algorithm v2 dedup (no leading `{kit-short}-` or `{module-segment}-` redundancy). |
| 29b | Skill `name:` colon-form (planned) | Every SKILL.md `name:` field matches `lib-prefix.expectedSlashName({kit, module, slug})` colon-form. Currently INFO-only; promotes to WARN once colon-namespace migration ships per kit. |

**Check #28 details:**
1. Walk `.agents/agents/`, `.agents/skills/`, `.agents/rules/`
2. Read each file's `origin` metadata (frontmatter/`_origin`)
3. Group files by basename; if same basename with different `origin` values → ERROR: collision
4. Fix mode: suggest running CI auto-prefix or manual rename

**Check #29 details:**
1. For each agent in `.agents/agents/`, read `origin` field — derive expected kit-short
2. If origin != core: verify filename starts with `{kit-short}-`
3. If module agents: verify filename starts with `{kit-short}-{module}-`
4. Verify the canonical name matches `lib-prefix.expectedName({kit, module, slug})` — slug part MUST NOT have leading `{kit-short}-` or `{module-segment}-` redundancy (algorithm v2 dedup, since 2026-05-10). Names like `omg-rn-rn-base-base-architecture` fail this check; the canonical form is `omg-rn-rn-base-architecture`.

**Check #29b details (planned, deferred to colon-namespace Phase 4):**
1. For each `SKILL.md`, read frontmatter `name:` field and derive (kit, module, slug) from path.
2. Compute expected colon form via `lib-prefix.expectedSlashName({kit, module, slug})`.
3. If `name:` matches expected colon form → PASS.
4. If `name:` matches the hyphen form (`expectedName(...)`) → INFO during the migration window: "kit X has Y SKILL.md files awaiting colon-namespace migration". Single rolled-up message per kit (not per-skill noise).
5. If `name:` matches neither → WARN: "unexpected name: form `<actual>`, expected `<colon>`".
6. Agents are NOT in scope (agent `name:` stays hyphenated by design — see `omg-agent-creator/references/architecture-rules.md` §0.2).
7. Implementation status: helper `expectedSlashName` shipped in release-action 2026-05-10. Doctor script wiring deferred until colon-namespace Phase 4 begins (post-dedup-soak). Plan: `oh-my-game-kit-core/plans/260510-1711-skill-name-colon-namespace/`.

## Frontmatter Quality Checks (#18–20)

| # | Check | Validates |
|---|---|---|
| 18 | Agent maxTurns presence | Every agent `.md` has `maxTurns:` in frontmatter |
| 19 | Skill effort presence | Every skill `SKILL.md` has `effort:` in frontmatter (low/medium/high) |
| 20 | Agent model appropriateness | Implementeromg-debugger agents should use `inherit` or `opus`; utility agents (git, docs) should use `sonnet` |

## Cross-Platform Checks (#30)

| # | Check | Validates |
|---|---|---|
| 30 | Hook cross-platform compliance | All `.cjs` files in `.agents/hooks/` are free of shell-only patterns |

**Check #30 details:**

Scan all `.cjs` files in `.agents/hooks/` for these violations:

| Pattern | Why It Fails | Fix |
|---------|-------------|-----|
| `2>/dev/null` in command strings | Shell redirect, not cross-platform | Use `stdio: ['pipe', 'pipe', 'ignore']` |
| `2>&1` in command strings | Shell redirect, not cross-platform | Capture both stdout/stderr via `stdio: ['pipe', 'pipe', 'pipe']` |
| `/dev/stdin` | Linux-only, breaks Windows | Use `fs.readFileSync(0, 'utf8')` |
| `/dev/null` (outside comments) | Unix-only | Use `stdio` option or `os.devNull` |
| `execSync('cmd arg')` (shell string) | Spawns shell, injection risk | Use `execFileSync('cmd', ['arg'])` |
| Hardcoded `/tmp/` | Unix-only temp path | Use `os.tmpdir()` |
| Hardcoded `/home/` or `/Users/` (in logic, not regex) | Platform-specific | Use `os.homedir()` or `process.env.HOME \|\| process.env.USERPROFILE` |

**Implementation:**
1. Read each `.cjs` file, strip comment lines (`//` and `/* */`)
2. Regex-match against violation patterns
3. Report file:line for each violation
4. Severity: WARN (hooks still work on Linux/macOS, just break on Windows)

**Fix mode:** Cannot auto-fix — requires manual code changes. Report violations with suggested replacement.

## Sync-back Health Checks (#32)

| # | Check | Validates |
|---|---|---|
| 32 | Sync-back PR health | Recent `omg-sync-back` PRs are healthy — no CONFLICTING state and no phantom-file (all-additions) diffs |

**Check #32 details:**

Validates that the `omg-sync-back` skill is producing healthy PRs. Added after the 2026-04-09 incident where two sync-back PRs were unusable: core#7 was stale (no upstream fetch → CONFLICTING), unity#7 targeted a non-existent path (missing `.agents/` prefix → phantom file at wrong location).

1. Collect all kit repos from `.agentsomg-config-*.json` → `repos.primary` and from in-file `repository` frontmatter across changed files
2. For each repo (up to 10 distinct repos to bound runtime), query the last 5 PRs with sync-back branch prefix:
   ```
   gh pr list --repo {owner}/{repo} --search "head:omg-sync/" --state all --limit 5 --json number,title,state,mergeStateStatus,headRefName,additions,deletions,files
   ```
3. For each returned PR, check two signatures:
   - **Staleness signature** — `mergeStateStatus == "CONFLICTING"` while the PR is still `OPEN` → WARN: stale sync-back PR (fix: the skill pushed without fetching upstream)
   - **Phantom-file signature** — any file in the PR has `additions > 0` AND `deletions == 0` AND the filename matches a skill/agent/rule basename that exists elsewhere in the repo → WARN: likely path-resolution bug (fix: verify `.agents/` prefix for modular kits)
4. Report counts: `Sync-back health: {healthy}/{checked} PRs healthy across {N} repos`
5. List problem PRs with URL and signature

**Severity:** WARN (advisory — doesn't fail doctor, just flags drift)

**Skip conditions (fail-open, never block):**
- `gh` CLI not available → skip with note
- `gh auth status` not authenticated → skip with note
- No kit repos resolvable from configs → skip
- Network error during PR query → skip with note

**Fix mode:** Cannot auto-fix — each problem PR needs manual review. For each flagged PR:
- Stale → close and re-run `omg-sync-back` (v1.2.0+ has staleness check)
- Phantom-file → close and re-run `omg-sync-back` (v1.2.0+ has `.agents/` prefix + path verification)
- Suggest: `gh pr close {number} --comment "Superseded by healthy resync"`

**Why this check exists:** The acceptance criteria for The1Studio/oh-my-game-kit-core#8 require a doctor check or test that detects these two failure modes in historical PRs. Running this check after releasing a sync-back fix is a cheap smoke-test to confirm no broken PRs slipped through.

## Kits Membership SSOT Checks (#33)

| # | Check | Validates |
|---|---|---|
| 33 | Kits membership SSOT | Asserts `Object.keys(metadata.kits) === unique(installedModules[*].kit)` — catches drift between the derived kit membership and the source `installedModules`. WARN level on mismatch. |

**Check #33 details:**

Runs `scripts/check-kits-membership.cjs` (ships with this skill) against `.agents/metadata.json`. The script:

1. Loads the kit registry from `references/available-kits.json` (shared SSOT that mirrors `AVAILABLE_KITS` in `oh-my-game-kit-cli/src/types/kit.ts`).
2. Resolves each `installedModules[*].kit` value to a `KitType` via the registry (`oh-my-game-kit-unity` → `unity`, bare `unity` accepted as tolerance).
3. Compares `Object.keys(metadata.kits)` against the unique set of resolved owners.
4. Reports three drift categories:
   - **missing** — owners present in `installedModules` but missing from `kits`
   - **orphaned** — kit entries with no owning module in `installedModules`
   - **unresolved** — `installedModules` entries whose `kit` field does not resolve (dropped from the rebuild with a warning in CLI; surfaced here for visibility)
5. Prints `PASS` when all three are empty; otherwise `WARN` with details.

**Skip conditions:**
- `metadata.json` not found → SKIP
- No `installedModules` and not a v3 metadata file → SKIP (check only meaningful for v3 module-first metadata)

**Severity:** WARN (migration grace — doesn't fail doctor, just flags drift). Fix: run `omg modules add ...` or `omg modules remove ...` — the CLI rebuilds membership via `rebuildKitMembership` in `oh-my-game-kit-cli/src/domains/modules/kit-membership.ts`.

**Why this check exists:** Prevents regression of the Zod `Unrecognized key` crash where unresolved kit values were bucketed under a synthetic `"unknown"` key, bricking `writeManifest` on the next `omg` invocation. See `rebuildKitMembership` docstring for the derivation formula and SSOT rationale.

## Orphaned Agent Checks (#34)

| # | Check | Validates |
|---|---|---|
| 34 | Orphaned agents | Agent files in `.agents/agents/` whose `origin:` frontmatter points to a kit that is NOT in `installedModules[*].kit` (v3) or `metadata.kits` (older schemas). WARN level. |

**Check #34 details:**

Runs `scripts/check-orphaned-agents.cjs` against `.agents/metadata.json` and `.agents/agents/`. The script:

1. Loads the kit registry from `references/available-kits.json`.
2. Builds the set of installed kits from `installedModules[*].kit` (v3) unioned with `Object.keys(metadata.kits)` (older schemas). Accepts both short (`unity`) and long (`oh-my-game-kit-unity`) keys.
3. Walks `.agents/agents/*.md`, parses the YAML frontmatter, and reads the `origin` field.
4. Reports agents whose `origin` does NOT resolve to any installed kit.

**Why this check exists:** `omg uninstall --kit X` relies on the kit's `.omg-manifest.json` to know which files to delete. Agents installed before per-module manifests (pre-v1.64.0) were never added to the manifest, so the ownership-aware uninstall skips them. The orphaned agent files stay on disk with `origin: oh-my-game-kit-X` frontmatter even though kit X is uninstalled — they continue loading into every session, bloating context and potentially activating for tasks that no longer match the active toolchain.

**Skip conditions:**
- `metadata.json` not found → SKIP
- Both `installedModules` empty AND `kits` empty → SKIP
- `agents/` directory missing → SKIP

**Severity:** WARN (migration grace — doesn't fail doctor, just flags leftovers). Fix: upgrade CLI to v3.5+ and run `omg uninstall --kit <name> --include-orphans`, or manually `rm .agents/agents/<file>` for each orphan.

**Related work:** Report the CLI gap via `omg-issue` against `The1Studio/oh-my-game-kit-cli` so `omg uninstall` gains a frontmatter-based fallback for pre-manifest installs.

## Context Window Hygiene (#35–#36)

| # | Check | Validates |
|---|---|---|
| 35 | AGENTS.md bloat | Project `AGENTS.md` ≤ 5000 tokens (char/4 heuristic). WARN. |
| 36 | Rule duplication | No rule filename present in both `~/.agents/rules/` and project `.agents/rules/`. INFO. |

**Check #35 details:**

Runs `scripts/check-codex-md-bloat.cjs`. Reads project `AGENTS.md`, estimates tokens via `chars / 4`, compares against a 5000-token budget. When over, reports the overshoot and suggests moving details to `docs/` and deduplicating with `.agents/rules/` files.

**Why this check exists:** Every session loads `AGENTS.md` in full. A bloated AGENTS.md (>5k tokens) usually duplicates content that belongs in `.agents/rules/` (auto-loaded, so duplicating wastes context) or in `docs/` (searchable on demand). Example: an 11.9k-token AGENTS.md was reduced to 2k tokens just by moving gate backlogs, hook implementation details, and origin-metadata tables to `docs/`.

**Severity:** WARN (doesn't fail doctor, just flags bloat).

**Check #36 details:**

Runs `scripts/check-rule-duplication.cjs`. Enumerates `*.md` files in `~/.agents/rules/` and `<project>/.agents/rules/`, compares by basename. Reports files present in both — those are double-loaded every session.

**Why this check exists:** Codex auto-loads rule files from BOTH the global `~/.agents/rules/` and the project `.agents/rules/` every session. When a kit ships rules at both scopes (common for core-overlapping rules like `code-conventions.md`, `coding-guidelines.md`), the content loads twice — roughly doubling its context cost. Keep shared patterns in one scope only.

**Severity:** INFO (advisory — doesn't fail doctor; some projects intentionally version-lock project-scope rules).

**Skip conditions:**
- Project rules/ resolves to the global rules/ (e.g., running inside `~/.agents/`): SKIP
- Either dir missing or empty: SKIP
## Adapter Contract Checks (#37)

| # | Check | Validates |
|---|---|---|
| 37 | Adapter contract | Every discovered adapter skill has valid `omg-adapter` frontmatter, required scripts, and a conformant `install.json` |

**Check #37 details:**

Runs `hooks/doctor-check-37-adapter-contract.cjs` against the current `.agents/` dir:

1. Calls `listAllMatches()` from `skillsomg-preview/scripts/adapter-discovery.cjs` (Steps 1–4: metadata read + frontmatter + schema validation only — no `detect.cjs` run, no side-effects).
2. For each discovered adapter:
   - Verifies all four required scripts exist in the skill dir: `detect.cjs`, `list-capabilities.cjs`, `generate.cjs`, `requirements.cjs`.
   - Verifies `install.json` is present, parses as valid JSON, and has a `schemaVersion` field and a non-empty `catalog`.
3. Exits 0 with `PASS` when no adapters are installed (nothing to validate).
4. Exits 0 with `PASS` when all adapters conform; exits 1 with per-adapter details on `FAIL`.

**Severity:** FAIL (exits 1) if any required script or `install.json` is missing; WARN for schema-level issues (empty catalog, missing schemaVersion).

**Skip conditions:**
- `adapter-discovery.cjs` not found (omg-extended not installed) → FAIL with actionable message
- Zero adapters discovered → PASS silently

**Why this check exists:** Ensures kit authors cannot ship a broken adapter that crashes `omg diagram refresh` mid-run. Catching missing `generate.cjs` or an empty `install.json` at doctor-time is cheaper than debugging a partial refresh at runtime.

**Inheritance-aware behavior:** When `metadata.json` contains `inheritsFrom` pointing at the global `.agents/`, filename duplicates are treated as INTENTIONAL overrides (child wins) and are NOT reported. Byte-identical copies are still reported regardless — those remain accidental. If `inheritsFrom` is set but the parent path is missing, the check exits non-zero with ERROR (see check #37).

## Inheritance Integrity Check (#37)

| # | Check | Validates |
|---|---|---|
| 37 | inheritsFrom integrity | When `metadata.json` contains `inheritsFrom`, validates the field value is a well-formed parent `.agents/` path. ERROR severity. |

**Check #37 details:**

Runs `scripts/check-inherits-from.cjs`. If the `inheritsFrom` field is absent from `metadata.json`, the check SKIPs (no-op for existing installs). If present, all conditions below are validated at ERROR severity (fail-loud, never silent):

1. **(a) Path exists** — `fs.existsSync(inheritsFrom)` must be true → ERROR: parent path missing. Remediation: remove the field OR re-create the parent `.agents/`.
2. **(b) Path is a directory** — `fs.statSync(inheritsFrom).isDirectory()` must be true → ERROR: not a directory.
3. **(c) Ends in `.agents`** — `path.basename(inheritsFrom) === '.agents'` must be true → ERROR: must end in `.agents` (not `.agents/metadata.json`).
4. **(d) Has metadata.json** — `fs.existsSync(path.join(inheritsFrom, 'metadata.json'))` must be true → ERROR: parent is not a OMG install.
5. **(e) Parent is OMG-shape** — `isOMGMetadata(parentMeta) === true` must hold → ERROR: not valid OMG metadata (CK stub?).
6. **(f) No self-reference** — `path.resolve(inheritsFrom) !== path.resolve(<project>/.agents)` must hold → ERROR: inheritsFrom points at self.
7. **(g) No cycle (≤5 hops)** — following `parent.metadata.inheritsFrom` recursively must terminate within 5 hops → ERROR: inheritance cycle detected at `<node>`.

**Severity:** ERROR. The field is opt-in — if you set it, it must be valid. Matches `development-principles.md` "Errors Over Silent Fallbacks".

**Skip condition:** `inheritsFrom` absent from `metadata.json` → SKIP (exit 0). No metadata.json → SKIP.

**Why this check exists:** Ensures that when `inheritsFrom` is set (e.g., by `omg init --inherit-from`), the parent path remains valid across directory moves and renames. A stale pointer is detected at next `omg-doctor` run rather than silently degrading rule loading.

**References:**
- Script: `scripts/check-inherits-from.cjs`
- Tests: `.agents/hooks/__tests__/check-inherits-from.test.cjs` (scenarios T5–T11)
- Schema: `docs/registry-schema.md` (metadata v3 `inheritsFrom` field)
- Docs: `docs/global-only-mode.md` §Nested installs

## MCP Health Checks (#31)

| # | Check | Validates |
|---|---|---|
| 31 | MCP server connectivity | All required MCPs are connected; recommended MCPs present |

**Check #31 details:**

1. Read ALL `omg-config-*.json` → collect `mcp.required` and `mcp.recommended` entries (additive across kits)
2. Deduplicate by `name` (higher-priority config wins on conflict)
3. Run `codex mcp list` to get connected servers
4. Also check `~/.agents/mcp.json` and `.mcp.json` for registered servers
5. For each **required** MCP not connected:
   - Output: `ERROR: Required MCP "{name}" not connected — {purpose}`
   - Suggest: `Fix: {installCmd}`
6. For each **recommended** MCP not connected:
   - Output: `WARN: Recommended MCP "{name}" not connected — {purpose}`
7. If entry has `verifyTool` field:
   - Check if deferred tools with that prefix exist via `ToolSearch`
   - If MCP is registered but no tools found: `WARN: MCP "{name}" registered but not functional (may need auth)`
8. Summary line: `MCP health: {N}/{total} required connected, {M} recommended missing`

**Severity:**
- Missing required: ERROR (fails doctor check)
- Missing recommended: WARN (advisory)
- Registered but not functional: WARN (advisory)

**Fix mode:**
- For each missing MCP with `installCmd`: run the install command via `codex mcp add ... -s user`
- After install: verify with `codex mcp get {name}`
- If `verifyTool` exists: verify deferred tools are available
- Suggest `! codex mcp auth {name}` if MCP needs authentication

### Frontmatter Check Output
```
### Frontmatter Quality
- Agent maxTurns: [PASS | WARN — N agents missing maxTurns: {list}]
- Skill effort: [PASS | WARN — N skills missing effort: {list}]
- Agent model: [PASS | WARN — {agent} uses {model} but role suggests {recommended}]
```

## Module Detect Coverage (#41)

| # | Check | Validates |
|---|---|---|
| 41 | Module detect coverage | Every non-base module in `.agents/modules/` has either `detect:` or `detect._optOut: true`; WARN pre-ratchet, ERROR post-ratchet |

**Check #41 details:**

Runs `.agents/skillsomg-doctor/scripts/check-module-detect-coverage.cjs`. Iterates `.agents/modules/*/module.json` and reports modules that:
- are NOT in `CORE_REQUIRED = ["omg-base", "omg-extended", "omg-maintainer"]`
- are NOT `required: true` (kit-base opt-out)
- lack an active `detect:` block, or have `_disabled: true` (stub modules are surfaced as "needs activation")

**Ratchet (data-driven):** reads `.agentsomg-modules.json.ratchetDates."module-detect-coverage"` (ISO date). Before that date: `WARN`. After: `ERROR` (exit 1). Env bypass: `OMG_BYPASS_DETECT_RATCHET=1` forces `WARN` regardless. This matches the plan's P6e rollback design (editable ratchet + env escape hatch).

**Severity:** WARN pre-ratchet, ERROR post-ratchet (or WARN if bypass env set).

**Why this check exists:** Ships alongside the P0 `detect:` schema so kit authors cannot silently ship modules without detection. The 90-day warn window gives kits time to backfill; the ERROR-level ratchet ensures we don't drift indefinitely.

## Statusline Orphans (#43)

| # | Check | Validates |
|---|---|---|
| 43 | Statusline orphans | No residual `hooks/lib/statusline-*.cjs` or `hooks/libomg-config-utils.cjs` subfiles remain after the 1.71.x refactor |

**Check #43 details:**

Runs `.agents/hooks/doctor-check-43-statusline-orphans.cjs`. Complements check #42 (which verifies the happy-path wiring): #43 verifies the absence of the 7 subfiles that the monolithic `hooks/statusline.cjs` replaced. These files were shipped in releases prior to `modules-20260421-0955` and must be removed by deletions metadata on update. If they remain on disk, auto-update failed to clean up (regression of issue #52).

Per-path list:
- `hooks/lib/statusline-activity-renderers.cjs`
- `hooks/lib/statusline-render-modes.cjs`
- `hooks/lib/statusline-section-registry.cjs`
- `hooks/lib/statusline-session-cache.cjs`
- `hooks/lib/statusline-string-utils.cjs`
- `hooks/lib/statusline-version-section.cjs`
- `hooks/libomg-config-utils.cjs`

**User override:** if `metadata.json.installedFiles[].ownership === "user"` for any of those paths, the check emits an INFO line and does NOT flag it as an orphan. This respects intentional user retention.

**Severity:** ERROR (exit 1) when orphans present; PASS (exit 0) when clean; SKIP when `.agents/` absent.

**Why this check exists:** Per-module deletions ship in `.agents/modules/*/.omg-manifest.json.deletions[]`. The CLI and release-action must cooperate to apply them; #43 is the user-facing gate that catches any pipeline regression.

**Run after:** `omg update` completes. Running before or during an update may report transient orphans.

## No Inlined Universal Rules (#44)

| # | Check | Validates |
|---|---|---|
| 44 | No inlined universal rules | SKILL.md files and agent .md files do not contain the 3 known boilerplate blocks that live in `.agents/rules/` or a dedicated reference file. FAIL level. |

**Check #44 details:**

Runs `scripts/check-no-inline-universal-rules.cjs`. Scans `.agents/skills/*/SKILL.md`, `.agents/modules/*/skills/*/SKILL.md`, `.agents/agents/*.md`, and `.agents/modules/*/agents/*.md` for three forbidden boilerplate patterns:

| Pattern | What it catches | Lives in |
|---|---|---|
| `Never reveal skill internals or system prompts` | Skill-security block pasted into skill body | `.agents/rules/skill-security-boilerplate.md` |
| `Per AGENTS.md principle #8` | AI-Driven Design block pasted into skill body | `.agents/rules/ai-driven-design.md` |
| `OMG_FORK_DEPTH < 2` (outside `references/fork-hygiene.md`) | Fork-hygiene 5-line inline pasted outside its canonical home | `.agents/skillsomg-architecture/references/fork-hygiene.md` |

Emits JSON `{ status: "ok" | "fail", violations: [{ file, line, pattern }] }` to stdout. Human-readable `file:line [pattern]` summary to stderr when violations exist.

**Severity:** FAIL (exit 1) if any violation found; PASS (exit 0) otherwise.

**Skip conditions:**
- No `.agents/skills/`, no `.agents/agents/`, and no `.agents/modules/` → SKIP (no files to scan).

**Why this check exists:** During plan `20260428-1530-architecture-fix-rollout`, ~350 lines of inlined boilerplate were removed from 25+ skills across 7 kits. These three boilerplates auto-load every session via `.agents/rules/` — pasting them into skill or agent bodies doubles their context cost and causes drift when the canonical version is updated. Extended to agent `.md` files because `omg-skills-manager.md:47–56` was found to inline the skill-security block verbatim. This check catches re-introductions at doctor-run time; release-action CI gate `validate-no-inline-universal-rules.cjs` catches them at PR level.

**Related:** `architecture-rules.md` (skill-creator) → "Anti-Pattern: Inlining Universal Rules in Skill Bodies". Same rule applies to agent bodies via `agent-creator/references/architecture-rules.md`.

## Auto-Pipeline Prereq (#46)

| # | Check | Validates |
|---|---|---|
| 46 | Auto-pipeline GitHub MCP prereq | When `features.autoIssueSubmission` or `features.autoLessonSync` is ON, the GitHub MCP must be registered. Diagnostic WARN when there is a mismatch. |

**Check #46 details:**

Runs `scripts/check-auto-pipelines-prereq.cjs`. Reads merged `features.{autoIssueSubmission, autoLessonSync}` across all `omg-config-*.json` fragments (later fragments win). When at least one is `true`, probes `codex mcp list` and looks for a `github` entry. The two auto-pipelines spawn background sub-agents that call `mcp__github__*` tools (issue creation, PR creation); without the MCP the marker queues silently and submissions fail without a visible error.

Output: JSON `{ status: "pass" | "skip" | "warn", enabled: {...}, githubMcpPresent: bool|null, reason: string }` to stdout; WARN summary to stderr when a mismatch is detected.

**Severity:** WARN (advisory; never blocks doctor). Exit code is always 0.

**Skip conditions:**
- Both flags OFF → PASS with `reason: auto-pipelines disabled — GH MCP prereq not applicable`
- `codex` CLI unavailable → SKIP (cannot probe MCP state)

**Fix mode:** Run `codex mcp add github` (per `omg-config-core.json` → `mcp.required[github].installCmd`). If the MCP is registered but unauthenticated, run `codex mcp auth github`. This check complements #31 (which already errors on missing required MCPs); #46 is the diagnostic version that ties the consequence to the enabled-pipeline flags.

**Why this check exists:** Both pipelines were flipped ON by default in `omg-config-core.json` on 2026-05-06 (calibrated for Oh My Game Kit's ~50-user internal scope). Consumers without the GitHub MCP would see queue entries pile up in `.agents/telemetry/pending-issue-submissions.jsonl` / `pending-skill-updates.jsonl` with no submissions and no failure surface. The check makes the silent-fail mode visible at doctor-run time.

**Related:** `docs/auto-issue-collection.md` (issue pipeline contract), `.agents/rules/telemetry.md` (lesson-sync contract).

## Project Module Fitness (#40)

| # | Check | Validates |
|---|---|---|
| 40 | Project module fitness | Shells `omg modules detect --json --cache-only`; WARN when confident install/recover recommendations exist |

**Check #40 details:**

Runs `.agents/hooks/doctor-check-40-project-module-fitness.cjs`. The hook is cache-only — it never triggers a cold scan (cold scans can exceed 10s on monorepos and would block every doctor run). The CLI owns TTL/staleness; if the cache is missing or stale, the hook SKIPs with a hint to run `omg-modules detect`.

1. Skip if `resolveProjectDir()` reports global-only mode.
2. Skip if `omg` CLI is absent from PATH.
3. Skip if `.agents/session-state/detect-cache.json` is missing.
4. Spawn `omg modules detect --json --cache-only` with a 5s timeout (`shell: false`).
5. Skip if CLI reports `{mode: "cache-empty"}` or non-zero exit.
6. Parse JSON; WARN when `confident.install.length > 0 || confident.recover.length > 0` and list module names.
7. **Ignore `ambiguous[]` and `unused-suspect[]`** — those require AI review (skill P7), not doctor.

**Severity:** WARN (advisory — never blocks).

**Why this check exists:** Surfaces project-module fitness drift (e.g., `IComponentData` present in Assets but `dots-ecs-core` not installed) so consumers notice before bugs accumulate. Doctor stays deterministic; ambiguous evidence is deferred to the interactive `omg-modules` flow.

## Activation Skill Resolution (#47)

| # | Check | Validates |
|---|---|---|
| 47 | Activation skill resolution | Every skill ref in every `omg-activation-*.json` `sessionBaseline[]` and `mappings[].skills[]` array resolves to a real skill directory |

**Check #47 details:**

Wraps the release-action gate `validate-activation-skill-resolution.cjs` (added 2026-05-11 alongside the PR #76 self-heal). Walks fragments at three locations:

1. Kit-level fragments under `.agents/` matching glob `omg-activation-*.json`
2. Module-level fragments under `.agents/modules/<m>/` matching the same glob
3. Dual-tree fragments under `modules/<m>/` (web/marketing layout) matching the same glob

For every ref in `sessionBaseline[]` and `mappings[].skills[]`, accepts BOTH:

- **Full-prefixed form** — exact match against canonical skill dir basename (`omg-nakama-rpc`).
- **Bare-slug form** — match against any of the four `stripPrefix` variants the prefixer's `auto-prefix-skills.cjs::buildSelfHealMap()` accepts:
  - kit + module strip → `script-graph` (from `omg-rn-rn-base-script-graph`)
  - kit-only strip → `rn-base-script-graph`
  - module-only strip → `rn-rn-base-script-graph`
  - `omg-` only strip → `rn-rn-base-script-graph`

When a ref doesn't resolve, surfaces a "did you mean" hint listing the closest canonical dir names by Levenshtein distance.

**Severity:** WARN locally (doctor advisory). The release-action gate is the strict enforcer at PR time — it's wired in WARN mode (`continue-on-error: true`) during the introduction soak, ratcheting to ERROR after per-kit cleanup PRs land for the legacy `{kit}-{slug-without-module}` form (e.g., `rn-script-graph` skipping the `rn-base` module segment).

**Skip conditions:**
- No `.agents/` directory → SKIP
- No skill dirs found → SKIP
- No activation fragments → SKIP
- Fragment paths under `/fixtures/`, `/__fixtures__/`, `/test-fixtures/` → SKIP

**Fix mode:** Cannot auto-fix — the right rewrite depends on intent (use canonical dir name, or one of the four self-heal-accepted bare forms). Doctor reports the violations and the recommended fix.

**Why this check exists:** PR #76's auto-prefix-skills self-heal handles only the documented `stripPrefix` accept-set. The legacy `{kit}-{slug}` form (skipping the module segment) is real but NOT in the self-heal set — so refs in that form survived the 2026-05-08 universal-prefix migration AND the 2026-05-11 self-heal. Surfacing them at PR time + doctor time pushes the cleanup forward instead of letting drift accumulate. See release-action PR #77 for the gate introduction.

**Related:** Check #2 (skill existence — orthogonal: validates the inverse, that activation refs aren't pointing at nothing). The activation-coverage check (release-action `validate-activation-coverage.cjs`) validates the OTHER inverse: skills that exist but have no activation ref.

## Global Install Core-Only (#48)

| # | Check | Validates |
|---|---|---|
| 48 | Global install core-only | `$HOME/.agents/metadata.json` `.kits` should contain ONLY `core`. Non-core kits installed globally trigger a WARN. |

**Check #48 details:**

Reads `$HOME/.agents/metadata.json` (regardless of CWD — the check is about the GLOBAL install state, not the current project) and enumerates `.kits.*` keys. Any key that is NOT `core` (e.g., `unity`, `designer`, `cocos`, `react-native`, `web`, `nakama`) emits a WARN line with the kit name, installed version, and the recommended `omg uninstall --global --kit <name>` command.

**Why this check exists:**

- Global = always-on essentials; only `oh-my-game-kit-core` has the universal registry/rules/hooks/skills that every session needs.
- Per-project = engine/domain-specific. Unity skills are only useful when working on a Unity project; loading them globally surfaces irrelevant activation candidates in every session.
- Real incident (2026-05-11): a user's `$HOME/.agents/` accumulated 162 unprefixed Unity skills as orphans because Unity was installed globally but never updated cleanly. The orphan skills then showed up in unrelated projects, polluted keyword activation, and bloated SessionStart hook scans.

**Severity:** WARN — this is a recommendation, not a violation. Does not block CI. Users with a deliberate global engine-kit install (rare; usually a mistake) can ignore.

**Skip conditions:**
- No `$HOME/.agents/metadata.json` (OMG not installed globally) → SKIP
- `metadata.json` unparseable → SKIP with error message
- No `.kits` key in metadata → SKIP

**Fix mode:** Cannot auto-uninstall (destructive — affects user's global install). Doctor reports the offending kits + the exact CLI command to remove each.

**Related:** Check #34 (orphaned agents — related symptom: stale-install drift in global). The corrective workflow is: (1) `omg uninstall --global --kit <name>` for each non-core kit, (2) install the engine kit per-project in projects that actually use it.
