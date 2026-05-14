---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# MCP Profiling Workflow

**Required: Game view visible + Play mode active.**

## Step-by-Step

```
Step 1 — Rendering baseline
  rendering_stats(action="get_stats")
  → target: drawCalls < 100, batches < 50, FPS > 60

Step 2 — Memory baseline
  rendering_stats(action="get_memory")
  → flag: monoHeap > 200MB (GC pressure), graphicsDriver growing (leak)

Step 3 — ECS baseline
  manage_dots(action="performance_snapshot")
  → flag: chunk utilization < 50% (archetype fragmentation), large empty archetypes

Step 4 — CPU breakdown
  rendering_stats(action="get_profiler")
  → flag: mainThread > 10ms, renderThread > 5ms
```

## Post-Session Analysis Workflow

Sessions auto-save on Play exit — no manual action required.

```
Step 1 — List available sessions
  rendering_stats(action="list_sessions")
  → returns list of filenames: perf-YYYYMMDD-HHmmss.json
  → sorted newest first; each file is in Logs/PerfSessions/

Step 2 — Analyze a session
  rendering_stats(action="analyze_session", filename="perf-YYYYMMDD-HHmmss.json")
  → bottleneck report: HIGH/MEDIUM severity issues
  → top 30 systems ranked by CPU time
  → FPS avg/min/max/p95, CPU avg/min/max/p95
  → scene name, session duration, peak entity count

Step 3 — Regression detection (optional)
  analyze both baseline and post-fix sessions
  → compare top-system rankings for improved/regressed systems
  → flag any system that increased CPU time between sessions
```

**Session JSON contents**: summary (FPS/CPU avg/min/max/p95), top 30 systems by CPU ms, 500-point timeline, metadata (scene, duration, peak entities).

**Advantage**: Diagnose CPU bottlenecks from a prior session without entering Play mode. Useful for investigating performance issues reported from earlier runs.

## Verification Checklist

After any optimization:
- [ ] `rendering_stats(get_stats)` — draw calls/batches improved or unchanged
- [ ] `rendering_stats(get_memory)` — no memory regression
- [ ] `manage_dots(performance_snapshot)` — chunk utilization improved
- [ ] `read_console` — zero new errors/warnings
- [ ] FPS stable at target (not just peak)
- [ ] **Report saved** (MANDATORY) — see Reporting section below

## Optimization Reporting (MANDATORY — Never Skip)

**Every optimization pass MUST produce a report.** This is critical for:
- Tracking optimization history and preventing regressions
- Providing data for future optimization decisions
- Documenting what was tried, what worked, and what remains

**Report path**: `plans/reports/dots-optimizer-{YYMMDD}-{HHMM}-{slug}.md`

**Required sections**:
1. **Baseline** — before metrics table (FPS, draw calls, batches, memory, chunk utilization)
2. **Bottleneck Identified** — root cause with MCP evidence
3. **Fix Applied** — concrete code changes with before/after snippets
4. **Result** — after metrics table, delta, pass/fail assessment
5. **Remaining Issues** — what's still suboptimal and recommended next steps

**Anti-pattern**: Optimizing without saving a report. Even if the fix is small, always document it. Future optimizers need this data.
