---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-base
protected: true
---
# Runtime Awareness

Monitor context window utilization and usage limits in real-time to optimize OMG sessions.

## Overview

OMG hooks provide automatic visibility into two critical metrics:
1. **Context Window** — Current token utilization within the 200K context limit
2. **Usage Limits** — API quota consumption (5-hour and 7-day rolling windows)

These are injected automatically by the `usage-context-awareness.cjs` hook — trust them, do not duplicate the logic.

## OMG Hook Architecture

```
┌──────────────────────┐    ┌──────────────────────────┐
│ generate-baseline-   │    │  check-module-keywords   │
│ context.cjs          │    │  .cjs                    │
│ (SessionStart hook)  │    │  (UserPromptSubmit hook) │
└──────────┬───────────┘    └──────────┬───────────────┘
           │                            │
           ▼                            ▼
  Injects module context       Warns on uninstalled
  into session baseline        module keywords

┌──────────────────────────────────────────────────────┐
│  usage-context-awareness.cjs  (PostToolUse hook)     │
│  - Reads context window data                         │
│  - Fetches usage limit data                          │
│  - Injects <usage-awareness> block                   │
└──────────────────────────────────────────────────────┘
```

Hooks are registered in `.agents/settings.json`. If a hook is missing from settings, it will not fire — verify with `omg-doctor`.

## Hook Output Format

The PostToolUse hook injects awareness data every 5 minutes:

```xml
<usage-awareness>
Context: 67%
</usage-awareness>
```

With warnings:

```xml
<usage-awareness>
Context: 78% [WARNING - consider compaction]
</usage-awareness>
```

Critical state:

```xml
<usage-awareness>
Context: 91% [CRITICAL - compaction needed]
</usage-awareness>
```

## Warning Thresholds

| Level | Threshold | Action |
|-------|-----------|--------|
| Normal | < 70% | Continue normally |
| Warning | 70-89% | Plan compaction strategy |
| Critical | ≥ 90% | Execute compaction immediately |

## Recommendations by Threshold

### Context Window

| Utilization | Action |
|-------------|--------|
| < 70% | Continue normally |
| 70-80% | Plan compaction — identify what to summarize |
| 80-90% | Execute compaction now |
| > 90% | Immediate compaction or spawn fresh subagent |

**Compaction approach**: Summarize tool outputs first, then old turns. Never compact: system prompt, current task, active reasoning. Write summary to `plans/` before compacting.

### Usage Limits

| 5-Hour | Action |
|--------|--------|
| < 70% | Normal usage |
| 70-90% | Reduce parallelization — fewer concurrent subagents |
| > 90% | Wait for reset or switch to lower-tier model |

| 7-Day | Action |
|-------|--------|
| < 70% | Normal usage |
| 70-90% | Monitor daily consumption |
| > 90% | Limit to essential tasks only |

## Hook Configuration

Hooks registered in `.agents/settings.json`:

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node .agents/hooks/generate-baseline-context.cjs" }] }
    ],
    "UserPromptSubmit": [
      { "hooks": [{ "type": "command", "command": "node .agents/hooks/check-module-keywords.cjs" }] }
    ],
    "PostToolUse": [
      { "matcher": "*", "hooks": [{ "type": "command", "command": "node .agents/hooks/usage-context-awareness.cjs" }] }
    ]
  }
}
```

### Throttling

- **Injection interval**: 5 minutes (300,000ms) — avoids noise on every tool call
- **Context data freshness**: Updated each tool use by statusline
- **API cache TTL**: 60 seconds for usage limit data

## Credential Location (Linux)

Usage limit data requires OAuth credentials:

| Platform | Location |
|----------|----------|
| Linux | `~/.agents/.credentials.json` |
| macOS | Keychain — `Codex-credentials` |
| Windows | `%USERPROFILE%\.agents\.credentials.json` |

If usage limits show N/A: run `codex login` to re-authenticate.

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| No awareness injected | Hook not in settings | Verify PostToolUse in settings.json |
| No usage limits | No OAuth token | Run `codex login` |
| Stale context % | Hook not firing | Check hook registered correctly |
| 401 Unauthorized | Expired token | Re-authenticate |

Run `omg-doctor` to validate all hooks are registered and firing correctly.

## Related

- [Context Optimization](./context-optimization.md)
- [Context Compression](./context-compression.md)
