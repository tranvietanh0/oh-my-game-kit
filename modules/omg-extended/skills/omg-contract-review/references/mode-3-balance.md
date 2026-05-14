---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Mode 3 — `balance` (round-based polish)

Multi-pass polish of your own draft toward a **target posture**. Posture is explicit, not vibes-based.

## Target postures

| Posture | Description | When to choose |
|---------|-------------|----------------|
| **Neutral** | Both sides could sign without a lawyer's red pen. Clauses balanced. | Opening round with an unknown counterparty; regulator-visible agreement. |
| **Slightly-you-favorable** | Known-reasonable clauses + 1–3 discretionary levers still held for trade. | Default for sending a first draft when you have leverage; leaves room for counterparty to "win" something and still land neutral. |
| **Slightly-them-favorable** | Conceding 1–3 high-signaling clauses upfront; holding firm on the economic core. | When you need to signal good faith to restart a stalled negotiation or when their side has leverage (e.g., you need them more than they need you). |

## Round structure

| Round | Focus | Typical change types |
|-------|-------|---------------------|
| **R1 — Deal-killer fixes** | Repair any clause from tilt review that would make the other side walk. Also repair any self-tilt from your own draft. | Vested equity sacrosanct on voluntary exit; clawback fair-cause exceptions; unilateral termination acceleration. |
| **R2 — Structural moderation** | Tune clauses that are defensible but at the edge of their range toward your posture target. | Non-compete 2y→18mo; non-circumvention 3y→2y; expense cap tuning; CRM cure window. |
| **R3 — Polish** | Close cross-reference gaps, tighten language, add safety valves. | Section cross-ref cleanup after renumbering; "reasonable" vs "best" consistency; dispute mediation timelines. |

R4 (edge-case adversarial pass) and R5 (cross-doc consistency + polish) are run before sending — see `references/second-layer-defects.md`.

## Output — balance review log

After each balance pass, write a delta log to `{scope}/plans/reports/balance-review-{YYMMDD}-{HHMM}-{slug}.md`:

```markdown
# Balance Review — {contract-name}, Round {N}

**Date:** {YYMMDD-HHMM}
**Target posture:** {neutral / slightly-company / slightly-partner}
**Starting state:** {where the doc was before this round}

## Changes applied

| § | Before | After | Posture shift |
|---|--------|-------|---------------|
| 6.3 | "30-day forfeit" | "5 exceptions + 8-month lock" | Partner ↑ |
| 9 | "2-year non-compete" | "18 months + Schedule A" | Partner ↑ (enforceability ↑) |
...

## Held (considered, rejected)

| § | Ask | Why held |
|---|-----|----------|
| 7.2 | Remove Pool B minimum | Too aggressive — preserves Company downside protection |
...

## Intentional scenario divergences preserved

(If the draft has multiple scenarios — e.g., ARR-based and client-count — note which divergences are intentional and why.)
```

## Scenario divergence discipline

If a contract has alternate scenarios (e.g., ARR-Based vs Client-Count KPI), the balance pass must **track intentional divergences**, not blindly mirror everything. Common intentional divergences:

- **Clawback window** — scales with per-client equity weight (client-count 8mo, ARR-based 6mo).
- **Fractional credit** — only makes sense in continuous-ACV scenarios, not in tiered-client scenarios.
- **Tier-drop mechanics** — client-count has tier-drop clawback; ARR-based treats all reductions as "material."

Document these in the balance-review log so future sessions don't accidentally flatten them.