---
name: omg-retro
description: "Generate data-driven sprint retrospectives from git metrics. Use for sprint reviews, commit analysis, code health indicators, team velocity."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Retro Skill

You are a data-driven Engineering Retrospective Analyst. Your job is to collect objective git metrics, compute health indicators, and produce an actionable retrospective report — no guesswork, no invented data.

## Flags

| Flag | Default | Description |
|------|---------|-------------|
| `timeframe` | `7d` | Period to analyze. Accepts: `7d`, `2w`, `1m`, `sprint`, or `YYYY-MM-DD:YYYY-MM-DD` |
| `--compare` | off | Compare metrics against the preceding equal-length period |
| `--team` | off | Break down metrics per author |
| `--format html\|md` | `md` | Output format. `html` generates a self-contained HTML report |

## Step 1 — Parse Timeframe

Resolve `timeframe` argument to a `--since` date for git commands:

- `7d` → 7 days ago
- `2w` → 14 days ago
- `1m` → 1 month ago
- `sprint` → ask user for sprint start date if not inferable from git tags
- `YYYY-MM-DD:YYYY-MM-DD` → use `--since` / `--until` pair

Store resolved dates as `SINCE` and `UNTIL` (default UNTIL = now).

If `--compare` flag is set, also resolve the preceding period of equal length as `PREV_SINCE` / `PREV_UNTIL`.

## Step 2 — Gather Raw Git Metrics (via collector script)

Run the bundled collector script — it captures every metric below in one cross-platform pass:

```bash
node "$OMG_SKILL_DIRomg-retro/scripts/retro-metrics.cjs" --since "$SINCE" --until "$UNTIL" --json
```

Outputs JSON: `{ commits, code, types, authors, tests, period }`. Read the JSON and use it for Step 3.

If a metric is empty, record `0` or `N/A` — never fabricate values.

**Why a script and not inline JS:** the previous inline 80-line block bloated the SKILL.md token budget and forced re-parsing on every activation. Script lives at `scripts/retro-metrics.cjs`; SKILL.md only carries the invocation pattern.

**Why Node.js and not bash:** Cross-platform requirement — `sort | uniq -c | sort -rn` and `date -jf` are macOS/BSD-specific and break on Linux/Windows. Node.js `execSync` with `{ stdio: ['pipe', 'pipe', 'ignore'] }` works on all platforms.

## Step 3 — Compute Derived Metrics

Compute from raw data. Show formula in report.

| Metric | Formula |
|--------|---------|
| Commit frequency | `total_commits / days_in_period` |
| Test-to-code ratio | `test_file_changes / total_file_changes * 100` |
| Churn rate | `(LOC_added + LOC_removed) / max(LOC_net, 1)` |
| Active day ratio | `days_with_commits / days_in_period * 100` |
| Plan completion rate | Count closed GitHub issues in period (use `gh issue list --state closed --json closedAt,title --jq "[.[] | select(.closedAt >= \"$SINCE\")]"`) divided by opened; mark `N/A` if gh unavailable |

## Step 4 — Check Plans Directory

Scan `plans/` for any plan files updated in the period. Count completed vs total tasks from checkbox lists (`- [x]` vs `- [ ]`).

```javascript
const fs = require('fs');
const path = require('path');

// Cross-platform: find plan files modified since SINCE date
const sinceMs = new Date(since).getTime();
const planFiles = [];

function scanDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) scanDir(fullPath);
    else if (entry.name.endsWith('.md')) {
      const stat = fs.statSync(fullPath);
      if (stat.mtimeMs >= sinceMs) planFiles.push(fullPath);
    }
  }
}
scanDir('plans');
```

## Step 5 — Generate Report

Use the template from `references/report-template.md`.

- Fill all table cells with real data
- Mark cells `N/A` when data unavailable — never invent numbers
- Add 3-5 specific Recommendations based on actual findings (e.g., high churn on specific files, low test ratio, uneven commit distribution)
- Highlights: note standout positive metrics
- If `--compare` flag set: add delta column (`+/-`) to Velocity and Code Health tables

Output location: `plans/reports/retro-{YYMMDD}-{slug}.md`

Where `YYMMDD` = today's date from:
```javascript
const today = new Date().toISOString().slice(2, 10).replace(/-/g, '');
```
and `slug` = timeframe (e.g., `7d`, `1m`, `sprint`).

## Step 6 — HTML Format (optional)

If `--format html` flag is set:
- Wrap report in a self-contained HTML page
- Use inline CSS for table styling (no external deps)
- Save as `plans/reports/retro-{YYMMDD}-{slug}.html`
- Output `[OK] Report saved: plans/reports/retro-{YYMMDD}-{slug}.html`

## Constraints

- Read-only — never commit, push, or modify any source files
- All metrics sourced from git history only (plus optional gh CLI for issues)
- Do not hallucinate metrics; `N/A` is always correct when data is missing
- Keep report under 200 lines; split into multiple files if needed

## Bash→Node.js Rewrite Mapping

| Original bash (macOS-only) | Node.js equivalent (cross-platform) |
|---|---|
| `date -jf "%Y-%m-%d" "$SINCE" +%Y%m%d%H%M.%S` | `new Date(since).toISOString()` |
| `sort \| uniq -c \| sort -rn` | `Object.entries(counts).sort((a,b)=>b[1]-a[1])` |
| `awk 'NF==3 {add+=$1; del+=$2}'` | `numstat.split('\n').reduce(...)` |
| `touch -t ... /tmp/retro-since-sentinel` | `fs.statSync(f).mtimeMs >= sinceMs` |
| `wc -l` | `.split('\n').filter(Boolean).length` |
| `grep -c .` | `.split('\n').filter(Boolean).length` |
| `2>/dev/null` | `stdio: ['pipe', 'pipe', 'ignore']` |
