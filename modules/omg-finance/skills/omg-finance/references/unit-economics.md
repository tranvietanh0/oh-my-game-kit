---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Unit Economics

The question every investor asks: **does a single unit (customer, install, game, project) make money, eventually?** Scale without positive unit economics is a bonfire.

Three models covered here: **SaaS / product**, **services firms**, **ad arbitrage / UA**. Most startups are a hybrid — read the one that fits your dominant stream, then adjust.

---

## SaaS / product model

### Core metrics

| Metric | Formula | Benchmark |
|---|---|---|
| **ARPU** (Average Revenue Per User) | MRR / Active customers | Business model dependent |
| **CAC** (Customer Acquisition Cost) | Sales & marketing spend / New customers acquired (same period) | Model dependent |
| **Gross margin %** | (Revenue − COGS) / Revenue | SaaS: 70–85%. Lower = revisit model. |
| **Churn** (logo / revenue) | Customers lost / Start-of-month customers | <2% monthly for SMB, <1% for enterprise |
| **LTV** (Lifetime Value) | ARPU × Gross margin % / Churn % | — |
| **LTV / CAC** | LTV / CAC | >3 good, <1 break the model |
| **CAC Payback** (months) | CAC / (ARPU × Gross margin %) | <12 mo great, <18 OK, >24 stressed |
| **MRR** / **ARR** | Sum of monthly / annual recurring subscriptions | Grow 10%+ MoM = rocketship |
| **Net Revenue Retention (NRR)** | (Starting MRR + Expansion − Churn − Contraction) / Starting MRR | >110% exceptional, >100% healthy |

### Formulas (careful)

**LTV — the right form:**
```
LTV = ARPU × Gross margin % / (Monthly churn %)
```
Gross-margin weighted. Using raw ARPU overstates. Using net-profit-margin makes LTV conservative (defensible).

**CAC — what to include:**
- Sales team fully-loaded cost
- Marketing team fully-loaded cost
- All ad spend
- Tools (CRM, marketing automation)
- Commissions on new closes

**Don't include:** renewal / expansion sales effort (that's a cost against existing ARR, not new-acquisition CAC).

### Rule of 40

```
Rule of 40 score = Revenue growth rate % + EBITDA margin %
```
Target ≥40%. A 30% growth / 15% margin company scores 45 (healthy). 10% growth / 5% margin scores 15 (stressed).

Debated in 2026 venture — burn multiple has overtaken it — but still widely used.

---

## Services firm model

Services don't have MRR or churn in the classic sense. Use utilization + margin + client concentration.

### Core metrics

| Metric | Formula | Benchmark |
|---|---|---|
| **Utilization %** | Billable hours / Available hours | 65–75% healthy; >80% burnout; <60% bench problem |
| **Blended billable rate** | Services revenue / Billable hours | Validate against market ($50–$200/hr typical) |
| **Revenue per head (loaded)** | Revenue / FTE count | Varies; track trend |
| **Gross margin per service line** | (Revenue − direct labor − delivery cost) / Revenue | 50–65% typical; 70%+ means you're underpricing labor or overbilling clients |
| **Top-3 client concentration %** | Top-3 client revenue / Total revenue | <50% healthy; >70% risky (see `client-concentration.md`) |
| **Revenue durability %** | Recurring retainer revenue / Total revenue | >40% = material recurring base |
| **DSO** (days sales outstanding) | AR / Revenue × 30 | <45 days; >60 = collection problem |

### Revenue per head — what to do with it

- Trend it. If flat while headcount grows → you're adding weight without leverage.
- Benchmark: creative / playable services shops typically $80k–$150k per head per year blended. SaaS-for-enterprise can exceed $300k.
- Always use **loaded** headcount cost (salary + taxes + benefits + overhead). Half of services firms publish vanity "revenue per head" on base salary only, inflating by 25–40%.

### Project vs retainer vs time-and-materials

| Model | Revenue predictability | Margin dynamics | When to use |
|---|---|---|---|
| **Fixed-fee project** | Known upfront | High variance — risk on scope | Well-scoped deliverables |
| **Retainer** | Monthly recurring | Stable | Long-term embedded work |
| **T&M (hourly)** | Floating with hours | Low variance, low upside | Exploratory / discovery |

Know the mix; it determines revenue durability and cash flow predictability.

---

## Ad arbitrage / UA model

For businesses that spend on user acquisition (Mintegral, Google Ads, Facebook, etc.) and monetize via ads or IAP (in-app purchase).

### Core metrics

| Metric | Formula | Benchmark |
|---|---|---|
| **CPI** (Cost per install) | UA spend / Installs | Channel + geo dependent; track trend |
| **ARPDAU** | Ad revenue / DAU | Genre dependent |
| **D1 / D7 / D30 retention** | Active users on day N / Installs | D1 >40%, D7 >25%, D30 >15% for casual mobile |
| **Gross ROAS** | Ad revenue / UA spend | Gross >100% needed before breakeven; 200%+ great |
| **Net ROAS** (after ops cost) | (Ad revenue − ops) / UA spend | >120% to grow sustainably |
| **Cohort ROAS (Day N)** | Revenue from cohort through day N / Cost to acquire cohort | D30 >100% breakeven; D60–D90 typical target |
| **Payback period** | CPI / Daily ARPU (loaded) | <30 days ideal, <60 OK |
| **DAU / MAU** | Daily active / Monthly active | 20–40% = sticky |
| **LTV / CPI** | LTV / CPI | >3 target |

### Channel economics

- **Different channels have different cohorts.** Facebook installs ≠ TikTok installs in ARPU, retention, or fraud rate. Track and report per channel.
- **Blended CPI hides mix shift.** If Mintegral ramps while Google Ads collapses, blended can look flat while economics degrade.
- **Fraud:** ~10–25% of paid installs are fraud at scale. Subtract estimated fraud before reporting net CAC.

### When to kill a channel

Heuristic for a campaign:
- Day 30 ROAS < 50% AND no clear optimization path → pause.
- CPI rising 2x over a 30-day window without ARPU improvement → pause.
- Install volume below minimum statistical power (<500/day) → can't optimize, move spend.

---

## Cross-model (hybrid businesses)

Many ops-heavy startups have multiple streams. Example: a studio with services (Playable Labs), product (Game Studio), and UA arbitrage (MKT Inhouse). Report unit economics **per stream**, not blended.

### Common mistake: blending

Blending distorts. If services gross margin is 70% and UA gross margin is 5%, the blended margin depends on revenue mix — and the reader can't tell what's real.

**Fix:** report per-stream, and show a consolidated memo.

### Stream contribution format

```
                      Services    Product    UA arb.    Consolidated
Revenue                  $100       $50       $300         $450
Gross margin %            70%       80%        5%          — (mix)
Gross margin $             $70      $40       $15          $125
Unit economic health      ✅         ✅        ⚠️          Watch UA
```

One of these is likely a bonfire (UA at 5% GM) subsidized by the others. Investors want to see you know which is which.

---

## The three questions to always answer

Before declaring unit economics "healthy":

1. **How long does it take to get paid back?** (CAC payback months or DN ROAS breakeven).
2. **How much does a single unit produce over its life?** (LTV or cohort revenue at day 90/180/360).
3. **What's the ratio?** (LTV/CAC, or Gross ROAS through payback window).

Report all three, every month, per stream. Missing any one makes the analysis indefensible.
