---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Ops Monthly Variance Review — Template

Internal finance review. Ops team, function leads. Weekly or monthly cadence.

---

## Month: [Month Year]

## Variance to plan — summary

```
                  Actual     Plan      Δ$       Δ%      Flag
Revenue         $ XX,XXX   $XX,XXX   +$X,XXX   +X%    🟢
  Services      $ XX,XXX   $XX,XXX   -$X,XXX   -X%    🔴
  Product       $ XX,XXX   $XX,XXX   +$X,XXX   +X%    🟢
  Ad arbitrage  $ XX,XXX   $XX,XXX   +$X,XXX   +X%    🟢

Cost            $ XX,XXX   $XX,XXX   +$X,XXX   +X%    🟡
  COGS          $ XX,XXX   $XX,XXX   +$X,XXX   +X%    🟡
  S&M           $ XX,XXX   $XX,XXX   +$X,XXX   +X%    🟡
  R&D           $ XX,XXX   $XX,XXX   -$X,XXX   -X%    🟢
  G&A           $ XX,XXX   $XX,XXX   +$X,XXX   +X%    🟢

Operating inc   $  X,XXX   $X,XXX    -$XXX    -X%    🟡
```

Flags:
- 🟢 within ±5% of plan
- 🟡 ±5% to ±10%
- 🔴 >±10%

## Variance drivers — by line

### Services revenue variance: **−$5k (−12%)** 🔴
- **Driver:** Voodoo paused billing 3/15 (2 weeks lost)
- **Owner:** [sales lead]
- **One-time / recurring?** Recurring risk until new client signed
- **Action:** Pipeline review scheduled 4/3; escalate to CEO if not resolved by 4/10

### Cost variance: **+$3k (+6%)** 🟡
- **Driver:** One-time relocation stipend for new hire ($2k); overtime on 2 consultants ($1k)
- **Owner:** [ops lead]
- **One-time / recurring?** One-time
- **Action:** None; normalizes next month

### [... one section per >5% variance line]

---

## Utilization & productivity

| Team | Avg utilization | Target | Flag |
|---|---|---|---|
| Playable Labs (13 pax) | 72% | 70% | 🟢 |
| Orion (6 pax) | 65% | 70% | 🟡 |
| Game Studio (N pax) | — | — | |

Commentary on any team below target.

---

## Headcount

```
                  Start  Joins  Leaves  End   Open   Plan Δ
Engineering         X      X       X     X     X     +X
Design              X      X       X     X     X     +X
Sales/GTM           X      X       X     X     X     +X
G&A                 X      X       X     X     X     +X

Total headcount     X      X       X     X     X
```

Flag: any role open >60 days without a clear hiring path.

---

## Cash position

```
                           [Month-end]   [Month-end prior]   Δ
Cash on hand             $   XXX,XXX    $   XXX,XXX          $-XX
  Current AP (≤30d)      $    XX,XXX    $    XX,XXX          $-XX
  Accrued payroll        $    XX,XXX    $    XX,XXX          $-XX
Net cash                 $   XXX,XXX    $   XXX,XXX          $-XX

Trailing 3-mo net burn   $    XX,XXX
Runway (net)             XX months
```

DSO / DPO trend:
- DSO: XX days ([up/down] vs prior, target ≤XX)
- DPO: XX days ([up/down] vs prior, target ≤XX)

If DSO >target, add action item for collections.

---

## Client concentration (services businesses)

```
Top-1 client:           XX%   ([client name])
Top-3 clients:          XX%
Top-5 clients:          XX%
HHI:                  0.XXX   ([interpretation])
Active clients:          XX
```

Trend: compare to prior quarter. Flag if concentration increasing.

---

## Action items

From this review:

| # | Action | Owner | Due | Status |
|---|---|---|---|---|
| 1 | Call Mike @ Voodoo, understand pause + re-engagement timing | CEO | 2026-04-10 | 🟡 |
| 2 | Hire Orion dev to fill 2 open roles | CTO | 2026-04-30 | 🔴 |
| 3 | Implement automated DSO report | Ops | 2026-04-15 | 🟢 |

Plus any carried over from prior review.

---

## Discussion prompts for the meeting

- Is the Voodoo concentration a structural risk or an opportunity (expansion) — strategic decision?
- Should we pause hiring in engineering to preserve runway given variance trend?
- What's blocking Orion utilization from hitting 70% target?

---

## Meta — how we'll improve this process

- [What we learned from this review's prep]
- [What's broken in our data flow]
- [Tooling / automation fix]

---

## Source note

*Financial metrics source: [accounting system] ([accrual/cash] basis) as of [date]. FX: 26,200 ₫/USD (fixed 2026). Headcount per HRIS as of [date]. Pipeline figures from CRM as of [date].*
