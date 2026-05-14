---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# P&L Structure

The income statement, done right. Most founders stop at "revenue − cost = profit". A usable P&L has structure.

## Standard structure

```
Revenue                                                  100
  − Cost of Revenue (COGS / direct cost)                  40
= Gross Profit                                            60
  Gross Margin %                                         60.0%

  − Operating Expenses
       Sales & Marketing                                  20
       Research & Development                             15
       General & Administrative                           10
= Operating Income (EBIT)                                 15
  Operating Margin %                                     15.0%

  + Other income / − Interest / − Tax                      -3
= Net Income                                              12
  Net Margin %                                           12.0%

Memo:
  + D&A                                                    4
= EBITDA                                                  19
  EBITDA Margin %                                        19.0%
```

Every finance report should follow this spine. Non-standard layouts confuse readers and invite suspicion.

## What goes where

### Revenue
- Recognize per accounting policy (accrual or cash — state which).
- **Separate one-time from recurring.** Show both lines: "Total revenue" and "Recurring revenue".
- **Separate by business unit** if you have >1 revenue stream. Otherwise investors demand the breakdown later.
- **Net of refunds / chargebacks / revshare-out.** If you pay out 30% to a publisher, show: `Gross revenue 100, Publisher share −30, Net revenue 70`.

### Cost of Revenue (COGS)
- Directly attributable to delivering the revenue: payment processing, hosting compute proportional to usage, direct labor for services, raw materials.
- **Include:** fully loaded cost of people whose time directly produced the revenue.
- **Exclude:** sales commissions (S&M), engineering salaries (R&D), CEO (G&A).

### Operating expenses (OpEx)
Three buckets, investor-expected:
- **Sales & Marketing:** ad spend, sales team loaded cost, marketing tooling. For UA businesses, this is huge.
- **Research & Development:** engineering, product, design loaded cost. New builds go here.
- **General & Administrative:** exec team, HR, finance, legal, office, software.

If you don't have these three buckets, make up your own but label and keep consistent across periods.

### Below-the-line
- **Interest** (income or expense): parked cash earns, debt costs.
- **Tax:** corporate income tax, on net income.
- **Other** (one-time): equity investment write-downs, gains on asset sale, etc. — always footnote.

## Gross margin vs contribution margin vs operating margin

| Metric | Formula | Tells you |
|---|---|---|
| **Gross margin %** | (Revenue − COGS) / Revenue | How scalable the business is. Hardware ~30%, SaaS ~80%, marketplaces ~15%. |
| **Contribution margin** | Gross margin − variable S&M | What's left per customer after *all variable* costs. Used for unit economics. |
| **Operating margin %** | EBIT / Revenue | How efficient the whole operation is at scale. |
| **EBITDA margin %** | EBITDA / Revenue | Proxy for cash profitability (non-GAAP). |

**Common mistake:** reporting "margin" without saying which. In a meeting, default to gross margin unless stated.

## Multi-business-unit P&L

When you have 2+ revenue streams (e.g., Services + Product + Ad arbitrage), show:

```
                    Services     Product    Ad arb.    Consolidated
Revenue                 100          50         30          180
  COGS                   40          10         20           70
Gross profit             60          40         10          110
  Direct OpEx            15           5          4           24
Segment contribution     45          35          6           86
  Shared OpEx (G&A, exec allocations)                        40
Operating income                                              46
```

**Watch-outs:**
- Shared OpEx (CEO, rent, HR) is NOT allocated to segments unless your team is ready to own it. Otherwise tack it as "Corporate / unallocated".
- **Inter-segment transfers** (e.g., Marketing bills Game Studio for user acquisition) must be **eliminated** from consolidated. Show them as memo, not line.
- **Consolidation check:** Sum of segment revenue − internal transfers = Consolidated revenue. If it doesn't match, you're double-counting.

## One-time items treatment

Three options, pick one:
1. **Above the line, flagged separately** — preferred for investor P&L. "Other revenue (one-time): $50k — publisher acquisition bonus".
2. **Below operating income** — US GAAP style. "Other income / (expense): $50k".
3. **In a separate schedule** — most rigorous. Main P&L is recurring-only; one-time items roll up in an appendix.

**Never bury one-time items in regular revenue.** When it disappears next month, your reader thinks you churned.

## P&L trend table — the investor-friendly format

```
                     Jan      Feb      Mar      Q1     MoM%    YoY%
Revenue           $50,000  $55,000  $62,000  $167k    +13%     n/a
  COGS            $20,000  $21,000  $23,000   $64k
Gross profit      $30,000  $34,000  $39,000  $103k    +15%     n/a
  Gross margin %    60.0%    61.8%    62.9%   61.7%
  OpEx            $25,000  $26,000  $28,000   $79k
Operating income   $5,000   $8,000  $11,000   $24k    +38%     n/a
  Runway, mo.         14       16       19
```

Key things to include:
- Columns: monthly + period total.
- Rows: standard P&L spine.
- **Percentages:** gross margin % (always), MoM %, YoY % if available.
- **Memo line:** runway, headcount, or key KPI relevant to your model.

## Red flags a reader will catch

1. **Gross margin changing >5pp MoM** without explanation — investor will ask why.
2. **COGS growing faster than revenue** — scalability problem.
3. **S&M growing faster than revenue** for 3+ months — efficiency problem.
4. **G&A >15% of revenue** at scale (>$5M ARR) — bloat.
5. **Operating income flipping sign MoM** — investor asks for quarterly smoothing.
6. **Revenue revision** (prior month restated) — trust damage unless you explain AND fix the process.

## Non-GAAP metrics — when to use, how to disclose

**Use when:** GAAP doesn't reflect economic reality (heavy SBC distorts EBIT, D&A on cap-ex-heavy business distorts cash margin).

**Always include reconciliation:**
```
GAAP Operating Income                    $5,000
  + Stock-based compensation              $2,000
  + Restructuring (one-time)                $500
= Adjusted Operating Income (non-GAAP)   $7,500
```

**SEC rule (Reg G):** never give non-GAAP more prominence than GAAP in a formal filing. For private company investor updates, it's OK to lead with adjusted, but include the reconciliation row.

**Vanity metrics to avoid:** "Community revenue run-rate", "annualized booked revenue", "contracted pipeline" — unless defined and reconciled. Investors see these as puffery.
