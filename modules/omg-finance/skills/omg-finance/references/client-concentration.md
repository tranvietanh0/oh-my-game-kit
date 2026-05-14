---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Client / Revenue Concentration

"Concentration risk" is the finance-literate way of saying: **if your biggest customer left tomorrow, how badly would you hurt?** The more concentrated revenue is in a few hands, the higher the risk. Investors always ask; services firms especially need a defensible answer.

## The three measures, one methodology

1. **Top-N concentration %** — simple, communicable
2. **Herfindahl–Hirschman Index (HHI)** — statistically rigorous
3. **Cohort retention matrix** — forward-looking, predicts durability

Use **all three**. They answer different questions.

---

## Top-N concentration

### Formula

```
Top-N % = Σ(top N client revenue) / Σ(all client revenue)
```

Report **Top-1, Top-3, Top-5** for any services/hybrid business.

### Thresholds (industry rule-of-thumb for services firms)

| Measure | Healthy | Watch | Red flag |
|---|---|---|---|
| **Top-1 client** | <20% | 20–35% | >40% |
| **Top-3 clients** | <50% | 50–65% | >70% |
| **Top-5 clients** | <70% | 70–85% | >85% |

Context matters — an agency with 5 Fortune-500 clients at 20% each is different from a 2-person consultancy with one giant.

### Investor impact

A 2020 SaaS Capital study found **customer concentration >25% on a single client correlates with 15–25% valuation discount** at acquisition. Concentration is the single most frequent due-diligence killer for services-style revenue.

---

## Herfindahl–Hirschman Index (HHI)

### Formula

```
HHI = Σ (client revenue share)²           (share expressed as decimal 0–1)
```

or equivalently (percent form):

```
HHI = Σ (client share %)²                 (share expressed 0–100)
```

The percent form produces 0–10,000; the decimal form 0–1. Stay consistent.

### Example (decimal form)

```
Client A: 40% revenue → 0.40² = 0.1600
Client B: 20%         → 0.20² = 0.0400
Client C: 15%         → 0.15² = 0.0225
Client D: 10%         → 0.10² = 0.0100
Client E:  8%         → 0.08² = 0.0064
Client F:  7%         → 0.07² = 0.0049

HHI = 0.1600 + 0.0400 + 0.0225 + 0.0100 + 0.0064 + 0.0049 = 0.2438
```

### Thresholds (adapted from DOJ antitrust)

| Range (decimal) | Range (percent form) | Interpretation |
|---|---|---|
| < 0.15 | < 1,500 | Diversified. Low concentration risk. |
| 0.15 – 0.25 | 1,500 – 2,500 | Moderately concentrated. Watch. |
| ≥ 0.25 | ≥ 2,500 | Highly concentrated. Material risk flag for investors. |

### Why HHI and not just top-1?

HHI captures **distribution shape**, not just the peak. Two scenarios:
- 5 clients at 20% each → HHI = 0.20 (flag: high)
- 1 client at 25%, 75 clients at 1% → HHI = 0.0700 (low)

Top-1 looks similar (25% vs 20%); HHI tells the real story: the first is actually more concentrated despite a lower peak.

### How to report

```
Revenue concentration (Q1 2026)
  Top-1 client:           36%   (Voodoo)
  Top-3 clients:          68%   (Voodoo, Lihuhu, Moonee)
  Top-5 clients:          83%
  HHI:                   0.192   ⚠️  Moderately concentrated
  Number of clients:        7
```

Include the interpretation inline. Raw HHI alone doesn't communicate to a non-financial reader.

---

## Cohort retention matrix

Forward-looking: **of the clients you acquired in month N, how many are still active M months later?**

### Standard format

```
Cohort         M0     M1     M2     M3     M6     M12
Jan 2025      100%    —      —      —      —      —
Feb 2025      100%    —      —      —      —      —
Mar 2025      100%   80%    70%    65%    50%    35%
Apr 2025      100%   75%    68%    58%    40%    30%
```

**Rows:** clients acquired in that month (cohort).  
**Columns:** months since acquisition (M0 = acquisition month = 100%).  
**Values:** % of cohort still billable in that month.

### Defining "active"

Choose one rule and apply consistently:
- **Invoice-based:** had at least one billed engagement in the month.
- **Contract-based:** under an active retainer, regardless of invoice.
- **Hybrid:** either of above.

Services firms with gap-prone project work should use **contract-based or hybrid** to avoid marking every between-project pause as churn.

### Visualization

**Heatmap:** rows = cohorts, columns = months, cell color = retention %. Green = high retention, red = low. Immediate visual of health.

### Churn vs pause (the services-specific nuance)

SaaS churn is binary: customer cancels. Services billing has gaps:

| Scenario | Classification | How to treat |
|---|---|---|
| Client inactive 1 month, signed retainer | **Pause** | Keep in cohort; mark "paused" state |
| Client inactive 2 months, pipeline deal expected | **Pause** | Keep in cohort |
| Client inactive ≥3 months, no pipeline | **Churn** | Drop from cohort starting month of last invoice |
| Client returns after ≥12 months churn | **Return** | Count as new cohort; separate metric |

Apply definitions consistently. Investors forgive any rule that's consistent; they hate inconsistency.

---

## New vs existing client revenue split

### Definitions

- **New client revenue:** first-ever invoice — month of acquisition.
- **Existing client revenue:** any client who had an engagement in prior 12 months.
- **Expansion revenue:** existing client billing >10% more than prior quarter.
- **Contraction revenue:** existing client billing <90% of prior quarter.
- **Return client:** churned >12 months ago, re-engaged. Separate metric.

### Why separate

Shows growth composition:
- **Healthy:** most revenue growth from expansion, steady new.
- **Treadmill:** high churn masked by aggressive new-client acquisition. Net growth weak.
- **Declining:** negative expansion + flat new = shrinking.

### Report format

```
                 Jan     Feb     Mar     Q1
New client         $5k    $3k    $2k    $10k    ( 6% of Q1 revenue)
Existing client   $45k   $52k   $60k   $157k    (94%)
  Expansion       $10k   $12k   $15k    $37k    (24%)
  Baseline        $35k   $40k   $45k   $120k    (72%)
  Contraction     -$2k   -$1k   -$3k    -$6k    (-4%)
Churn (lost revenue vs start)   -$0   -$4k    -$2k    -$6k
Net revenue growth               +$3k  +$3k    +$5k
```

The bottom two lines: **is the business growing or just running to stand still?**

---

## Revenue durability / "MRR-equivalent" for services

If clients are on retainer: that's your MRR-equivalent.  
If clients are project-based: revenue is lumpier and less defensible.

```
Revenue durability % = Contracted / retainer revenue / Total revenue
```

**Benchmarks:**
- **>40%:** material recurring base. Investors value this.
- **20–40%:** moderate — show pipeline coverage of remaining %.
- **<20%:** lumpy, project-based. Investors discount valuation.

Ways to improve durability:
- Convert fixed-fee projects to monthly retainers.
- Negotiate annual commits with monthly billing.
- Bundle services into subscription packages.

---

## Reporting checklist

Any comprehensive concentration report should include:

- [ ] Top-1, Top-3, Top-5 concentration % for the period
- [ ] HHI + interpretation
- [ ] Number of active clients
- [ ] Cohort retention matrix (12 months back if data exists)
- [ ] Churn vs pause definitions stated (footnote)
- [ ] New vs existing revenue split
- [ ] Revenue durability % (or equivalent for your model)
- [ ] Trend: are any of these improving or deteriorating vs prior quarter?

Missing any of these leaves a gap an investor will poke.

## Common mistakes

1. **Reporting only top-1** — hides distribution shape.
2. **Including one-time bonuses in concentration math** — a $50k signing bonus from a new client makes them "top-1" for the month falsely.
3. **Not normalizing for FX** — VND vs USD mixed = inflated concentration on US clients.
4. **Every pause counted as churn** — makes services retention look far worse than reality.
5. **Counting "gross" revenue including revshare-out** — if you pay 50% to a partner, your concentration on a reseller is overstated.
6. **Ignoring internal transfers** — if MKT Inhouse pays Game Studio internally, that's not "client" revenue.
