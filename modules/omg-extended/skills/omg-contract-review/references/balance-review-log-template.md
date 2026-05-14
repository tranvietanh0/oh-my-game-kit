---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Balance Review Log Template

Template for documenting changes during `balance` mode rounds. Used to track what moved, what held, and why — across R1 (deal-killer fixes), R2 (structural moderation), R3 (polish), R4 (edge cases), R5 (consistency).

**Output location:** `{scope}/plans/reports/balance-review-{YYMMDD}-{HHMM}-{slug}.md`

Each round produces ONE log file. Don't overwrite previous rounds — they're the audit trail of decisions.

---

## Template

```markdown
# Balance Review — {contract-name}, Round {N}

**Date:** {YYMMDD-HHMM}
**Round:** R{N} of 5 (typical: R1=deal-killers, R2=structural, R3=polish, R4=edge-cases, R5=consistency)
**Reviewer:** {Name or "self-review"}
**Target posture:** {neutral / slightly-company-favorable / slightly-partner-favorable}
**Starting state:** {where the doc was before this round — typically the v{N-1} draft}
**Ending state:** {where the doc is after this round — typically the v{N} draft}

---

## Posture diagnosis

Before this round, the draft was {description of starting posture}.
After this round, the draft is {description of ending posture}.

Posture shift on this round: {Company ↑ / Partner ↑ / no shift / mixed}

---

## Changes applied

| § | Change type | Before | After | Posture shift | Reason |
|---|-------------|--------|-------|---------------|--------|
| 5.1 | Cliff condition | "30 days notice, no cure" | "5 exceptions + 8-month lock" | Partner ↑ | R1 deal-killer #4 — fair-cause exceptions |
| 9 | Non-compete | "2-year worldwide, no carve-outs" | "18 months + Schedule A genre scope" | Partner ↑ (enforceability ↑) | R1 deal-killer #2 |
| 6.3 | Margin gate | "Gating: 40% gross margin or tranche forfeits" | "Reported metric only, not gating" | Partner ↑ | R1 deal-killer #5 |
| 7.1 | Pool B ladder | "Cliff at $10M = 0%" | "Graduated 0.5%/1%/2%/3%/3.5%/4%" | Partner ↑ | R1 deal-killer #6 |
| 12.1 | Material breach | "Material breach (undefined)" | "Material breach defined: (a) materially impairs economic position AND (b) not cured within 30 days" | Both ↑ (clarity) | R1 deal-killer #8 |
| 11.3 | Key Person | "60-day continuous unavailability triggers replacement" | "60-day continuous OR 90-day cumulative within 12-month rolling window" | Company ↑ (closes loophole) | R4 edge-case |
| ... | ... | ... | ... | ... | ... |

---

## Held (considered, rejected)

Items considered for change in this round but kept as-is:

| § | Counterparty's ask | Why held | Pre-authorized fallback |
|---|---------------------|----------|-------------------------|
| 7.2 | "Remove Pool B minimum (≥2 buyers at LOI)" | Too aggressive — preserves Company downside protection against bad-faith advisor | Soften to "≥1 buyer at LOI + Company-approved" if needed in R2 |
| 6.3 | "Drop concentration cap" | Critical guardrail against single-client portfolio fragility | Loosen 25% → 35% if needed in R3 |
| 11 | "Delete Key Person clause" | Without §11, no accountability for who actually does the work | Soften to "named lead Partner with notice rule" if needed |
| ... | ... | ... | ... |

---

## Intentional scenario divergences preserved

(For multi-scenario contracts — e.g., ARR-based vs. client-count KPI)

| Section | ARR-based version | Client-count version | Why divergence is intentional |
|---------|-------------------|----------------------|-------------------------------|
| 6.3.3 (clawback) | 6 months | 8 months | Client-count has higher per-client equity weight; longer stickiness window calibrates risk |
| 6.3.1 (Qualifying Client) | Fractional credit (0.25×, 0.5×) | Zero credit | Client-count integrity requires no fractional dilution |
| 6.2 (Gates) | ARR target | WCP target + ACV floor | Different KPI shapes, both calibrated to identical Gate 3 economics |

---

## Cross-reference integrity check

- [ ] All §X.Y cross-references verified after section renumbering
- [ ] All "(see §Z)" links resolve to existing sections
- [ ] All defined terms used in the document appear in definition section
- [ ] All scenario-comparison tables are byte-for-byte identical where they should be
- [ ] All numerical values match across term sheet and deal summary

If any unchecked → flag in "follow-up" section below.

---

## Follow-up items for next round

Items to address in R{N+1}:

1. {Item} — {brief description}
2. {Item} — {brief description}
3. {Item} — {brief description}

---

## Decisions made (committed)

These are decisions made in this round that future rounds should NOT re-litigate:

1. {Decision}
2. {Decision}
3. {Decision}

---

## Stakeholders consulted

- {Name} — {role} — {their input that influenced this round}
- {Name} — {role} — {input}

---

## Notes / observations

{Free-text notes about negotiation dynamics, counterparty behavior, market shifts that influenced decisions in this round}
```

---

## Round structure (R1–R5)

### R1 — Deal-killer fixes

**Focus:** Repair clauses from `tilt` review that would make counterparty walk. Also repair self-tilt in your own draft.

**Typical change types:**
- Vested equity sacrosanct on voluntary exit
- Clawback fair-cause exceptions
- Unilateral termination acceleration formula
- Non-compete duration + Schedule A
- Pool B graduated ladder (no cliff)
- Material breach definition

**Source:** `deal-killer-checklist.md` — 10 canonical deal-killers.

### R2 — Structural moderation

**Focus:** Tune defensible-but-edge clauses toward target posture.

**Typical change types:**
- Non-compete 2y → 18mo
- Non-circumvention 3y → 2y
- Expense cap tuning
- CRM cure window
- Concentration cap percentage tuning
- Stickiness window tuning

### R3 — Polish

**Focus:** Cross-reference cleanup, tightening language, adding safety valves.

**Typical change types:**
- Cross-reference verification after renumbering
- "Reasonable" vs "best" consistency
- Dispute mediation timelines
- Business Day rollover rules
- Notification mechanics

### R4 — Edge cases (adversarial pre-send pass)

**Focus:** What an adversarial reader would weaponize. Common findings:

- Asymmetric safety valves (cliff extensions for Company-side delay only — add symmetric carve-out for client-side)
- Closed exception lists missing realistic causes (catch-all + neutral expert)
- Undefined terms ("Pipeline coverage", "Qualified substitute" need definitions)
- Boundary mechanics (weekend/holiday rollover, ACV exact-threshold ties)
- Time-loophole closure (90-day cumulative unavailability, not just 60-day continuous)
- Non-cash transaction handling (stock-for-stock, earn-outs, asset vs. share deals)

### R5 — Cross-document consistency

**Focus:** Numbers match across all documents.

**Typical checks:**
- Term sheet vs. deal summary: every number identical
- Term sheet vs. cover email: every claim maps to a clause
- Scenario A vs. Scenario B: clauses marked "identical" are byte-for-byte identical
- Schedule A: in-scope items match what term sheet §9 references
- Numbers across sections (e.g., Cliff WCP must compound to Gate 1 WCP)

---

## Recommended cadence

For a fresh draft:
1. R1 deal-killer fixes — 60-90 minutes
2. R2 structural moderation — 60-90 minutes
3. R3 polish — 30-45 minutes
4. R4 edge cases — 90-120 minutes (most valuable — prevents pre-send embarrassment)
5. R5 consistency — 30-45 minutes

Total: 4-6 hours of focused balance review per draft.

For each round, write a balance-review log file. Future rounds reference past logs to avoid re-litigating decisions.

---

## When to skip rounds

Sometimes you don't need all 5 rounds:

- **Standard template adoption (low novelty):** R1 + R3 only
- **Round-2 cover email response (you're reacting to counterparty's markup):** R2 + R3 + R4
- **Final pre-signature pass:** R4 + R5

When you skip, document why in the balance-review log.

---

## Filled example (Alfa Round 1)

```markdown
# Balance Review — Alfa Term Sheet Client-Count Scenario, Round 1

**Date:** 2026-04-23 14:05
**Round:** R1 of 5 (deal-killer fixes)
**Reviewer:** self-review (with consultation from advisor on legal items)
**Target posture:** slightly-company-favorable
**Starting state:** Initial draft from Founder, never sent
**Ending state:** R1 draft, ready for R2 structural moderation

---

## Changes applied

| § | Change type | Before | After | Posture shift | Reason |
|---|-------------|--------|-------|---------------|--------|
| 9 | Non-compete | "Worldwide, 3 years, all gaming" | "Worldwide, 18 months + Schedule A (5 in-scope genres + 9 out-of-scope)" | Partner ↑ | DK#2 — enforceability + reasonable scope |
| 11 | Key Person | "If departs, 30-day replacement window" | "60-day replacement window + 15-business-day Company response + 90-day cumulative unavailability trigger" | Both ↑ (clarity) | DK#10 — fairness + edge cases |
| 12.2 | Termination without cause | "30 days notice, no acceleration" | "90 days notice + greater of (50% unvested) or (100% next-tranche) acceleration" | Partner ↑ | DK#4 — bad-faith firing protection |
| 7.1 | Pool B ladder | "Cliff at $10M = 0%" | "Graduated 0.5%/1%/2%/3%/3.5%/4% from $4M to $15M+" | Partner ↑ | DK#6 — discontinuity at threshold removed |
| 6.3 | Margin gate | "40% gross margin gating" | "40% gross margin reported only, not gating" | Partner ↑ | DK#5 — Partner doesn't control delivery cost |
| 12.1 | Material breach | "Material breach (undefined)" | "Material breach: (a) materially impairs economic position AND (b) not cured within 30 days" | Both ↑ (clarity) | DK#8 — arbitration bait removed |
| 12.3 | Vested equity | "All equity forfeits on termination" | "Vested equity retained except breach of §§9,10,11 or fraud (good leaver / bad leaver)" | Partner ↑ | DK#1 — vested equity sacrosanct |

---

## Held (considered, rejected)

| § | Counterparty's ask | Why held | Fallback |
|---|---------------------|----------|----------|
| 4 | "Increase total cap to 12%" | 10% is industry-standard advisor cap | 11% if R3 reveals counterparty walking |
| 11 | "Delete Key Person clause entirely" | Critical accountability mechanism | Soften to "named lead Partner with notice rule" if R2 needs |
| 6.3 | "Drop concentration cap" | Single-client risk management | 25% → 35% if R3 needs |

---

## Cross-reference integrity check

- [x] All §X.Y cross-references verified
- [x] Defined terms appear in definition section
- [x] Numbers match across term sheet and deal summary
- [x] Scenario A and Scenario B parity sections byte-for-byte identical

---

## Follow-up items for R2

1. Tune §6.3 concentration cap percentage based on Round 1 Alfa response
2. Tune §11.2 Key Person hours/week based on Alfa's expected response
3. R2 should target Schedule A genre scope refinement

---

## Decisions committed (do not re-litigate)

1. 10% total equity cap is firm
2. Pool A 5% / Pool B 4% split is firm
3. Hong Kong arbitration (HKIAC) is firm
4. 4-month cliff is firm (FAST-aligned)

---

## Notes

- This is the foundational round; R1 establishes the structural floor
- R2 will moderate edges based on Alfa's expected pushback (predicted from `pattern-catalog.md`)
- R4 must verify §6.3 concentration cap doesn't have edge-case where 35% threshold is gamed via reorg
```

---

## Cross-reference

- For deal-killer canonical list: `deal-killer-checklist.md`
- For Schedule A drafting: `schedule-a-template.md`
- For cover email after R5 is complete: `cover-email-round2-template.md`
- For pattern-recognize mode (when reviewing counterparty's response): main SKILL.md Mode 7
- For framework theory behind balance posture choice: `omg-negotiation/references/frameworks.md`
