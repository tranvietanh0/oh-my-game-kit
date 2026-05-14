---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Auto-Detection Mode (telemetry-kit-error-collector Pipeline)

Use this when: invoked by `telemetry-kit-error-collector.cjs` via background sub-agent. The parent assistant reads a `[omg-auto-issue]` marker from hook output and spawns a sub-agent with a pending submission entry from `.agents/telemetry/pending-issue-submissions.jsonl`.

## Mandatory rules

- **DO NOT** call `AskUserQuestion` — zero user interaction
- **Duplicate check is MANDATORY** before filing — see `references/dedup-existing.md`
- If duplicate found: add comment with `Fingerprint: {fp} | Occurrences: {count} | Reason: {classifier}`

## Input schema (from JSONL queue)

```json
{
  "ts": "ISO timestamp",
  "fingerprint": "16-char md5",
  "origin": {
    "kit": "oh-my-game-kit-<name>",
    "kitVersion": "from .agents/metadata.json",
    "repository": "Owner/repo",
    "module": "string or null",
    "moduleVersion": "from module.json, or null"
  },
  "environment": {
    "cliVersion": "from omg --version",
    "nodeVersion": "process.version",
    "platform": "process.platform + os.release()",
    "shell": "basename of $SHELL"
  },
  "affectedFile": "relative path or null",
  "label": "bug",
  "description": "human summary",
  "context": {
    "toolName": "Bash|Task|Skill|mcp__*",
    "sanitizedCmd": "sanitized command",
    "stderrHead": "first 200 chars of error",
    "classifierReason": "omg-command|omg-agent|skill-invocation|stack-trace-path|origin-metadata|required-mcp",
    "count": 1,
    "filesMentioned": []
  }
}
```

## Title format

```
auto({kit}): {first 60 chars of stderrHead}
auto({kit}/{module}): {first 60 chars}   ← when module is set
```

## Labels

MUST include BOTH: `auto-detected` AND `classifier:{classifierReason}`

Example: `auto-detected`, `classifier:stack-trace-path`

## Issue body template

```markdown
## Auto-Detected OMG Error

**Detected at:** {ts}
**Classifier reason:** {classifierReason}
**Affected file:** {affectedFile or "unknown"}
**Module:** {module or "kit-wide"}
**Fingerprint:** `{fingerprint}`

### Sanitized Error Context

**Tool:** {toolName}
**Command:** `{sanitizedCmd}`

**Error head (sanitized):**
```
{stderrHead}
```

### Reproduction

Auto-submitted from live session — no manual reproduction steps available.
Use fingerprint above to correlate with session telemetry.

### Auto-submission metadata

- Submitted by: `telemetry-kit-error-collector.cjs`
- Rate limit: reads from `omg-config-core.json` → `autoIssueSubmission.maxPerSession`
- Dedup: local TTL from `autoIssueSubmission.dedupeTTLDays` + GitHub title search
- Opt out: set `features.autoIssueSubmission: false` in `omg-config-core.json`
```

## After filing — writeback

See `references/queue-writeback.md`. MUST write back `submitted: true` + `issueUrl` to the JSONL queue.

## Collector-side preconditions

`telemetry-kit-error-collector.cjs` MUST populate `origin.kitVersion`, `origin.moduleVersion` (when module set), and all four `environment` fields before writing a pending submission. Missing `kitVersion` or `environment.cliVersion` → collector logs a warning and skips the entry.
