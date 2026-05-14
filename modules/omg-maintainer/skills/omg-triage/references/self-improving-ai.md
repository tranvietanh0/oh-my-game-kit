---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---

# Future: Self-Improving AI Integration

Triage is a key node in the **Self-Improving AI Pipeline** (see AGENTS.md). Two-way integration:

1. **Input side:** User-reported issues triaged here become training data. Error patterns from triage reports feed into D1 telemetry, which the scheduled AI agent uses to generate auto-gotchas.
2. **Output side:** Auto-generated gotcha PRs from the AI aggregation pipeline will appear in triage results. Triage should recognize `auto-gotcha` labeled PRs and fast-track their review (they've already been AI-validated against error clusters).

**Status:** Not yet implemented. Currently triage only processes human-filed issues and PRs.
