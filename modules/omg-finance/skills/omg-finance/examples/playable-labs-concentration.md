---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Worked Example — Playable Labs client concentration

Live worked example using real TheOneStudio Playable Labs data. Shows how the methodology maps to a specific case.

---

## Context

Playable Labs is an outsource playable-ad production business inside TheOneStudio. 13 full-time staff producing ads for mobile game publishers. Jan 2025 → Mar 2026 = 15 months of monthly data.

Q1 2026 revenue ramped to ~$13.5k/month (vs <$5k/month through most of 2025). Q1 2026 cumulative profit: ~+319M VND after ~−148M VND losses Jun–Dec 2025 (scaling ahead of revenue).

## Step 1 — Pull client-level revenue

From 15 months of billing data:

| Client | Aggregate 15mo revenue (USD) | First invoice | Months active |
|---|---|---|---|
| voodoo | ~36,160 | Feb 2025 | 14/15 |
| lihuhu | ~15,035 | Nov 2025 | 5/5 |
| outsource | ~16,500 | Jul 2025 | 9/9 |
| apero | ~9,000 | Feb 2025 | 9/15 |
| moonee | ~9,309 | Jan 2026 | 3/3 |
| athena | ~3,700 | Oct 2025 | 4/7 |
| mochilabs | ~2,350 | Dec 2025 | 2/4 |
| funtap | ~3,000 | May 2025 | 3/11 |
| wolffun | ~2,673 | Mar 2025 | 4/13 |
| skylink | ~1,500 | Jan 2026 | 2/3 |
| bagelcode | ~1,500 | Aug 2025 | 1/8 |
| others (dmobin, ondi, braly, ...) | ~3,000 | various | various |

*(Figures approximate; see `data/playable/history.yaml` for exact monthly breakdown.)*

## Step 2 — Compute Top-N concentration (Q1 2026)

Q1 2026 revenue (3 months: Jan, Feb, Mar 2026): ~$40,349 total.

Per-client Q1 totals (sorted):

| Rank | Client | Q1 2026 USD | Share | Cumulative |
|---|---|---|---|---|
| 1 | lihuhu | 9,662 | 24% | 24% |
| 2 | voodoo | 10,840 | 27% | 51% |
| 3 | moonee | 5,459 | 14% | 65% |
| 4 | outsource | 4,500 | 11% | 76% |
| 5 | apero | 2,000 | 5% | 81% |
| 6 | athena | 2,200 | 5% | 86% |
| 7 | funtap | 1,000 | 2% | 88% |
| 8 | skylink | 1,500 | 4% | 92% |
| 9 | mochilabs | 350 | 1% | 93% |
| 10 | dmobin | 500 | 1% | 94% |
| 11 | moment | 2,000 | 5% | 99% |
| 12 | dktech | 682 | 2% | 101% (rounding) |

**Top-1: 27%  |  Top-3: 65%  |  Top-5: 81%**

## Step 3 — Interpret against thresholds

| Measure | Value | Threshold |
|---|---|---|
| Top-1 | 27% | 🟡 Watch (20–35% band) |
| Top-3 | 65% | 🟡 Watch (50–65% edge) |
| Top-5 | 81% | 🟢 Healthy (<85%) |

Playable Labs is **moderately concentrated** — not alarming, but watchful. The risk profile is better than a typical boutique services firm (which often has Top-1 >40%) but worse than mature firms (Top-3 <50%).

## Step 4 — Compute HHI

Using Q1 2026 shares (decimal):

```
(0.269)² + (0.240)² + (0.135)² + (0.112)² + (0.050)² +
(0.055)² + (0.025)² + (0.037)² + (0.009)² + (0.012)² +
(0.050)² + (0.017)²

= 0.0724 + 0.0576 + 0.0182 + 0.0125 + 0.0025 +
  0.0030 + 0.0006 + 0.0014 + 0.0001 + 0.0001 +
  0.0025 + 0.0003

≈ 0.171
```

**HHI ≈ 0.17 → Moderately concentrated (0.15 – 0.25 band).**

Consistent with the top-N signal. Quantified: a single client loss of the top-2 (Voodoo at 27% or Lihuhu at 24%) would be material.

## Step 5 — Build the retention matrix

Cohort = first month of billing. "Active" = at least $500 billed in the month.

```
Cohort           M0    M1    M2    M3    M6    M9    M12   M15
Feb 2025        100%  100%   0%*   0%*  100%    0%*   0%*  100%   ← voodoo, apero, braly
                                                              voodoo, apero kept active; braly churned
Jun 2025        100%     0%    0%     0%*   0%*    0%*   —    —
                                                              inwave (one-off)
Jul 2025        100%  100%   0%*    0%*  100%  100%    —    —
                                                              outsource, supergame (outsource kept; supergame churned)
...
Jan 2026        100%  100%  100%   —    —    —    —    —
                                                              athena, moonee, dmobin, skylink (all kept active)
```

*Asterisks mark pauses vs true churn — many month-gaps for Playable look like churn but are "project pauses" per the methodology.

**Takeaway:** clients who pause for 1–2 months typically return. Classic services-firm pattern. Reporting should explicitly separate pause from churn.

## Step 6 — New vs existing revenue (Q1 2026)

Define new = first invoice in Q1 2026; existing = prior invoice before Q1.

- **New clients in Q1 2026:** moonee (Jan), dmobin (Jan), skylink (Jan), dktech (Feb), moment (Mar)
- **New client revenue Q1:** $5,459 + $500 + $1,500 + $682 + $2,000 ≈ $10,141 (~25% of Q1)
- **Existing client revenue Q1:** ~$30,208 (~75%)

Compare to Q1 2025 (Feb–Mar 2025 baseline): ~$6,000 total, nearly 100% "new" (the business was scaling from scratch).

**Narrative:** 75% of Q1 2026 revenue is from returning clients. Playable has reached a state where existing relationships drive the bulk of revenue — a much healthier posture than early 2025 when every dollar was a new-client dollar.

## Step 7 — Output for investor update

```
Client concentration (Q1 2026)
  Top-1 client:           27%   (Voodoo)
  Top-3 clients:          65%   (Voodoo, Lihuhu, Moonee)
  Top-5 clients:          81%
  HHI:                   0.17    Moderately concentrated 🟡
  Active clients Q1:       ~12
  Revenue durability:     ~75%   (existing-client share — healthy)

Retention signal: clients who paused in 2025 mostly returned in Q1 2026,
supporting the "project pause" framing over "true churn." Continue
diversifying: 5 new clients added in Q1 is on pace for our Top-3
concentration target of <50% by year-end.
```

## What this example illustrates

- **Top-N, HHI, and retention matrix together** tell a richer story than any single metric.
- **Services ≠ SaaS churn rules.** Naive churn counting would grade Playable as disastrous (many monthly gaps). Properly framed with pause vs churn, the reality is healthier.
- **New vs existing split** is the strongest forward signal — it tells you if the business is a treadmill (high new, high churn) or flywheel (high existing, growing base).
- **Real data beats textbook.** The xlsx has spelling inconsistencies (Voodoo/voodoo, MochiLabs/Mochii Update, Outsource/outsource). Normalize before aggregating. See `data-modeling.md` → Normalization rules.

## How this example connects to the skill

Consumers of the `omg-finance` skill facing a services-firm concentration analysis should:

1. Load `client-concentration.md` → methodology
2. Load this example → see it applied
3. Open `templates/board-quarterly.md` or `investor-monthly.md` → choose the output template
4. Run the numbers → fill the template

The skill teaches the framework; this example is the worked reference for services businesses.
