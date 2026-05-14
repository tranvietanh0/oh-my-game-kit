---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Telemetry System

## Overview

Oh My Game Kit collects anonymous usage telemetry to improve skills and identify gaps.
Enabled by default (`features.telemetry: true`). Opt out via any `omg-config-*.json`:

```json
{ "features": { "telemetry": false } }
```

## Data Collected (via hooks)

| Type | Hook | File | What |
|------|------|------|------|
| Errors | PostToolUse on Bash (non-zero) | `errors-{date}.jsonl` | Command, error head (200 chars), timestamp |
| Skill usage | PostToolUse on Skill | `usage-{date}.jsonl` | Skill name, args (truncated), timestamp |
| Feature gaps | AI-driven (this rule) | `gaps-{date}.jsonl` | Query, matched skills, suggestion |
| Hook diagnostics | All hooks via hook-logger.cjs | `hook-log-{date}.jsonl` | Hook name, duration (ms), outcome, dedup decisions, crash traces |

## Feature Gap Detection (AI-Driven)

When processing a user request and NO matching skill exists:

1. Check activation fragments — if zero skills match the topic
2. Log to `.agents/telemetry/gaps-{date}.jsonl`:
   ```json
   {"ts":"...","query":"ECS batch processing","matchedSkills":[],"suggestion":"Need ECS batch skill"}
   ```
3. Continue with the task — gap logging is passive, never blocks work

## Privacy Safeguards

- **No source code** — only command names, error types, skill names
- **No absolute file paths** — only relative project paths
- **stderr truncated** to 200 chars max
- **No secrets** — commands are logged but arguments containing env vars are stripped
- **Local first** — all data stays in `.agents/telemetry/` (gitignored)
- **User reviews** every batch before GitHub submission

## Error Threshold Auto-Trigger

When 3+ errors are logged in a session, the error collector outputs:
```
[omg-telemetry-threshold] 3 errors logged (threshold: 3). Run omg-watzup now...
```

The AI reads this and should run `omg-watzup` to review error patterns.
- Threshold fires once per session (debounced via `.threshold-triggered` marker)
- Stop hook provides fallback reminder if threshold was reached but watzup wasn't run
- Markers (`.threshold-triggered`, `.reminded`) are cleaned up when telemetry is archived

## GitHub Submission Protocol (at session wrap)

During `omg-watzup`, the telemetry section:

1. **Read** all `.agents/telemetry/*.jsonl` files from current session date
2. **Aggregate**:
   - Error patterns: group by error type, count occurrences
   - Skill usage: rank by frequency, identify never-used skills
   - Feature gaps: list unique queries with no matching skills
3. **Present summary** to user in watzup output
4. **Offer submission**: "Submit telemetry to kit repo as GitHub issue?"
5. **If approved**: create issue via `gh issue create` on the kit repo from `omg-config-*.json → repos.primary`
   - Title: `[telemetry] Session report {date}`
   - Label: `telemetry`
   - Body: aggregated stats (no raw data)
6. **After submission**: archive processed files to `.agents/telemetry/archived/`

## Issue Format

```markdown
## Telemetry Report — {date}

### Error Patterns (top 5)
| Error | Count | Example Command |
|-------|-------|-----------------|
| TypeError: Cannot read... | 3 | npm test |

### Skill Usage
| Skill | Activations |
|-------|------------|
| omg-cook | 5 |
| omg-fix | 3 |

### Feature Gaps
| Query | Suggestion |
|-------|-----------|
| ECS batch processing | Need ECS batch skill |

### Never-Used Skills (this session)
- skill-a, skill-b
```

## File Lifecycle

```
Hook fires → .agents/telemetry/{type}-{date}.jsonl (append)
  → omg-watzup reads + aggregates
  → User approves → gh issue create
  → Processed files → .agents/telemetry/archived/{type}-{date}.jsonl
```

## Auto-Issue Collection

Automatically submits GitHub issues for OMG-related tool errors during sessions, without interrupting the user.

### Data Flow

```
PostToolUse hook (telemetry-kit-error-collector.cjs)
  → classifier → sanitizer → dedup → rate limit
  → append kit-errors-{date}.jsonl
  → append pending-issue-submissions.jsonl
  → emit [omg-auto-issue] marker
  → assistant reads marker, spawns background sub-agent
  → omg-issue skill in auto-submission mode
  → GitHub issue created (or duplicate comment added)
  → writeback: pending-issue-submissions.jsonl updated with issueUrl
```

### Classifier Rules (broad scope)

An error is kit-related if ANY of:
- Bash command starts with `omg ` or contains `omg-`
- Task tool spawned a OMG-registered agent (reads `.agents/agents/*.md` at runtime)
- Skill tool invoked a OMG skill (starts with `omg-` or `omg-`)
- Stack trace mentions `.agents/hooks/`, `.agents/skills/`, `.agents/agents/`, or `.agents/rules/`
- Any file referenced has OMG origin metadata (`_origin.kit`, frontmatter `origin:`, or `omg-origin:` comment)
- Tool name starts with `mcp__` and MCP is one of: `github`, `context7`, `sequential-thinking`, `memory`

### Opt-Out (Default: disabled)

Set in any `omg-config-*.json`:
```json
{ "features": { "autoIssueSubmission": false } }
```

Default: `false` (opt-in during initial rollout; flip after observation period shows low false-positive rate and zero leakage).

### Configuration (data-driven)

```json
{
  "autoIssueSubmission": {
    "maxPerSession": 5,
    "dedupeTTLDays": 7,
    "dryRunEnv": "OMG_AUTO_ISSUE_DRY_RUN"
  }
}
```

### Dry-Run Mode

Set env var `OMG_AUTO_ISSUE_DRY_RUN=1` to log would-submit payloads to `~/.agents/.auto-issue.log` without spawning sub-agents or touching GitHub. Useful for tuning the classifier without creating real issues.

### Rate Limit

Hard cap: `autoIssueSubmission.maxPerSession` (default 5) new submissions per session. Overflow appended to JSONL with `skipReason: "rate-limited"`.

### Local Dedup

Fingerprint = md5(tool + sanitizedCmd + sanitizedStderrHead + classifierReason + originKit). Cached in `~/.agents/.kit-error-fingerprints.json` with TTL from `autoIssueSubmission.dedupeTTLDays` (default 7). Same fingerprint within TTL → skip submission.

### GitHub Dedup

Handled by `omg-issue` before creating — searches existing open issues with matching title prefix `auto({kit}):` or `auto({kit}/{module}):`. On match: adds comment to existing issue with occurrence details instead of creating a new one.

### Files and Locations

| File | Purpose |
|------|---------|
| `.agents/telemetry/kit-errors-{date}.jsonl` | All detected OMG errors (submitted + skipped) |
| `.agents/telemetry/pending-issue-submissions.jsonl` | Queue for sub-agent processing + writeback |
| `~/.agents/.kit-error-fingerprints.json` | Cross-session dedup cache (mode 0o600) |
| `~/.agents/.auto-issue.log` | Dry-run + failure log |
| `os.tmpdir()omg-auto-issue/<sessionId>.count` | Per-session rate limit counter |

### Privacy / Sanitization

Sanitizer runs BEFORE fingerprinting. Reuses `SENSITIVE_PATTERNS` SSOT from `telemetry-utils.cjs` plus additional patterns for:
- API keys: `sk-*`, `ghp_*`, `gho_*`, `ghs_*`, `github_pat_*`, `AKIA*`
- Auth headers: `Bearer <token>`, JWT (`eyJ...`)
- Env var assignments: `KEY=value` → `KEY=***`
- Password/token/secret fields: `password=*`, `token=*`, `api_key=*`
- User paths: `/home/*` → `~`, `C:\Users\*` → `~`, project root → `.`
- Sensitive files: `.env`, `id_rsa`, `*.pem`, `*.key`, etc. → `[REDACTED_SENSITIVE_FILE]`

Validated by E2E test `SEC1` with 7 distinct secret patterns — zero leakage required to pass.

### Debug Checklist

1. Errors detected but no issues created? Check `features.autoIssueSubmission` flag
2. Classifier too aggressive? Review `.agents/telemetry/kit-errors-{date}.jsonl` for false positives
3. Classifier missing errors? Run with `OMG_AUTO_ISSUE_DRY_RUN=1` and trigger a OMG command error
4. **Secret visible in an auto-submitted issue?** STOP — file a CRITICAL bug in oh-my-game-kit-core, check sanitizer patterns
5. Sub-agent never spawned? Check assistant session for `[omg-auto-issue]` marker parsing
6. Rate limit firing too early? Adjust `autoIssueSubmission.maxPerSession` in config

## Cloud Prompt Telemetry

In addition to local JSONL telemetry, OMG collects prompt data to a Cloudflare Worker + D1.

### Architecture
```
UserPromptSubmit hook (prompt-telemetry.cjs)
  → Sanitize prompt (strip secrets, paths, truncate 2000 chars)
  → POST to CF Worker with GitHub token auth
  → Worker verifies org membership → inserts to D1
  → Piggyback: previous prompt's outcome sent with current prompt

Stop hook (prompt-telemetry-flush.cjs)
  → Sends last prompt's outcome on session end
  → Cleans up session cache files
```

### Data Collected (Cloud)
| Field | Source |
|-------|--------|
| prompt (sanitized) | UserPromptSubmit stdin |
| user | GitHub API (server-verified) |
| project | Git remote repo name or CWD basename |
| kit | metadata.json name + config fragment fallback |
| installedModules | metadata.json [{name, version}] |
| installedKits | metadata.json kits {name: version} |
| classifiedAs | Slash command name or keyword matching |
| matchedSkills | Activation fragment keyword matching |
| activatedSkills | Slash command (INSERT) + Skill tool calls (piggyback, merged) |
| routedAgent | Routing registry lookup via classifiedAs |
| routingMode | 'registry' for OMG commands |
| osPlatform | process.platform (linux/darwin/win32) |
| nodeVersion | process.version |
| hookVersion | Project metadata.json version |
| cliVersion | Global ~/.agents/metadata.json version |
| isSlashCommand | Prompt starts with / |
| sessionPromptIndex | Nth prompt in this session |
| outcome, errorCount, duration | Piggyback from next prompt or Stop flush |
| toolsUsed | Piggyback from PostToolUse hooks via state file |
| subagentsSpawned | Piggyback from Agent/Task tool count in state file |
| usageInputTokens | Per-request fresh input tokens (from statusline snapshot) |
| usageOutputTokens | Per-request AI response tokens |
| usageCacheCreationTokens | Per-request cache write tokens |
| usageCacheReadTokens | Per-request cache read tokens (10% billing rate) |
| rateLimit5hPercent | 5-hour rate limit % used (subscription quota) |
| rateLimit7dPercent | 7-day rate limit % used (weekly quota) |
| linesAdded | Lines of code added this session |
| linesRemoved | Lines of code removed this session |
| codexEmail | Codex account email (per-prompt, cached per session) |
| codexOrgId | Codex organization ID |
| subscriptionType | Plan type: max, pro, team, free |

### Auth
- GitHub token from `gh auth token` (cached 30 min locally)
- Worker verifies via GitHub API → The1Studio org membership
- Token hash cached in CF KV (5-min TTL), raw token discarded

### Sanitization
Prompts are stripped of: API key patterns (sk-*, ghp_*, AKIA*), passwords, env var values, home paths.

### Config
Endpoint hardcoded in `omg-config-core.json` → `telemetry.cloud.endpoint`.
Override via `OMG_TELEMETRY_ENDPOINT` env var.
Disable cloud telemetry: set `telemetry.cloud.enabled: false` in config.

### Query Examples
```bash
# Via wrangler CLI
npx wrangler d1 execute omg-telemetry --remote --command="SELECT * FROM prompts LIMIT 10"

# Per-user token usage (last 7 days)
npx wrangler d1 execute omg-telemetry --remote --command="
  SELECT user, codex_email, subscription_type,
    SUM(usage_input_tokens) input, SUM(usage_output_tokens) output,
    SUM(usage_cache_read_tokens) cache_read,
    MAX(rate_limit_5h_percent) peak_5h, MAX(rate_limit_7d_percent) peak_7d,
    COUNT(*) prompts
  FROM prompts WHERE ts > datetime('now','-7 days') AND classified_as != 'flush'
  GROUP BY user ORDER BY output DESC"

# Per-user productivity
npx wrangler d1 execute omg-telemetry --remote --command="
  SELECT user, MAX(lines_added) lines_added, MAX(lines_removed) lines_removed
  FROM prompts WHERE ts > datetime('now','-7 days')
  GROUP BY user ORDER BY lines_added DESC"
```
