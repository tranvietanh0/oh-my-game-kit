---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Cash & Runway

P&L tells you if you're profitable. Cash tells you if you survive. Investors care about both; at pre-profit stages, they care about cash more.

## Core definitions

| Term | Formula | What it tells you |
|---|---|---|
| **Cash on hand** | Bank + money market + term deposits ≤30d | Gas in the tank |
| **Net cash** | Cash on hand − current liabilities due ≤30d | Actual gas (after parked bills) |
| **Gross burn** | Total monthly cash out | How fast the engine consumes fuel |
| **Net burn** | Gross burn − cash revenue received | Real monthly drain |
| **Runway (months)** | `floor(Net cash / Net burn)` | Months until out of cash at current rate |
| **Burn multiple** | Net burn / New ARR (or new MRR × 12) | How much capital per $1 of new recurring revenue |

## Runway — the right way

**Wrong:** `Runway = Cash / Gross burn`  
**Right:** `Runway = Net cash / Net burn`

Why: Cash ignores $500k payables due next week. Gross burn ignores that customers pay you. Using the wrong formula overstates runway and destroys credibility when the error surfaces.

**Conservative default:**
```
Net cash = Cash − AP due ≤30 days − accrued payroll − accrued tax
Net burn = Trailing 3-month average of (Cash out − Cash in)
Runway  = floor(Net cash / Net burn)
```

Use trailing 3-month average to smooth a single anomalous month (big payout, big collection).

## The three states of runway

| State | Meaning | Framing |
|---|---|---|
| **Infinite** | Net burn ≤ 0 (breakeven or better) | "Default alive" — show as `∞` |
| **Finite** | Net burn > 0, cash > 0 | `N months` — conservative floor |
| **Out of cash** | Net cash ≤ 0 | `0` — escalate immediately |

A tri-state runway indicator communicates clearly. See `templates/investor-monthly.md` for the display pattern.

## Default-alive vs default-dead (Paul Graham)

A company is **default alive** if, assuming:
- No new fundraising
- Current growth rate continues
- Current cost growth continues

…the company reaches breakeven *before* cash runs out.

If not → **default dead**.

**How to test:**
1. Project revenue forward using current MoM growth %.
2. Project costs forward using current cost growth %.
3. Find the month revenue = cost (breakeven).
4. Compare: breakeven month < month cash hits zero?

If yes → default alive. If no → you need to change cost/revenue/fundraising.

This is a **founders and board** check. Not usually in an investor update, but answer it for yourself monthly.

## Cash flow statement — the simple version

```
                                    Jan        Feb        Mar
Starting cash                   $1,000,000 $950,000   $920,000

Operating
  Cash from customers              $45,000   $55,000    $60,000
  Cash to vendors/payroll         -$95,000  -$85,000   -$90,000
  Net operating cash              -$50,000  -$30,000   -$30,000

Investing
  CapEx / asset purchases           $0         $0        -$5,000
  Net investing cash                $0         $0        -$5,000

Financing
  Founder loan / equity raise       $0         $0         $0
  Net financing cash                $0         $0         $0

Net cash change                  -$50,000  -$30,000   -$35,000
Ending cash                     $950,000  $920,000   $885,000
```

**Key patterns:**
- **Operating cash < operating income:** you're collecting slower than you're earning (DSO problem, prepaid-to-customer scenarios).
- **Operating cash > operating income:** you're collecting faster than earning (customer deposits, deferred revenue).
- **Investing outflows:** CapEx ramps — flag for the board.
- **Financing:** every raise, every founder loan, every dividend.

## DSO / DPO — where cash hides

| Metric | Formula | Good | Bad |
|---|---|---|---|
| **DSO** (Days sales outstanding) | (AR / Revenue) × 30 | <30 days | >60 days (collection problem) |
| **DPO** (Days payable outstanding) | (AP / COGS) × 30 | 30–45 | <15 (paying too fast) or >90 (vendor strain) |
| **Cash conversion cycle** | DSO − DPO (+ DIO for goods) | <30 | >60 |

For services firms especially, DSO blowout is the silent killer. Every finance review should flag it.

## Burn multiple (Founderpath / David Sacks)

**Formula:** `Net burn / New ARR`

Example: company burns $100k/month and adds $80k of new ARR/month → burn multiple = $100k / $80k = 1.25x.

| Burn multiple | Grade |
|---|---|
| < 1.0 | Excellent — each $1 of burn buys >$1 of ARR |
| 1.0 – 1.5 | Great |
| 1.5 – 2.0 | OK |
| 2.0 – 3.0 | Suspect — justify |
| > 3.0 | Bad — restructure |

Supplanted Rule of 40 in many venture circles because it's more directly cash-tied.

## Scenario-based runway (for the board)

```
Assumption                           Base      Bull      Bear
Monthly revenue growth               +5%       +12%      0%
Monthly cost growth                  +3%        +3%      +3%
Cash on hand, start               $1,000k   $1,000k   $1,000k
Months to breakeven (planning)       14         8       never
Months runway at current burn        18        18        12
Default alive?                     borderline   yes       no
```

Shows the board: "Here's how sensitive runway is to growth. If we miss plan, here's when we're default-dead."

## Runway extension playbook (when tight)

In order of cost:
1. **Cut discretionary spend** — travel, tooling, ads. Usually 5–15% of burn.
2. **Pause hiring** — defers fixed-cost ramp.
3. **Renegotiate vendor terms** — DPO +30 days buys real time.
4. **Convert founder comp to equity** — legal cost + tax implications.
5. **Reduce force** — layoffs. Political + severance cost; only when survival requires.
6. **Bridge round from existing investors** — fastest capital, usually at a discount.
7. **Sell a non-core asset** — IP, customer list, physical equipment.

Pair every report that shows <9 months runway with an explicit plan from this list.

## Common mistakes

1. **Gross cash reported as "runway cash"** — ignores payables.
2. **Gross burn reported as "burn"** — ignores customer cash in.
3. **Reporting runway off a single anomalous month** — use trailing 3-month average.
4. **Not separating capex from opex** in burn — distorts recurring burn view.
5. **Confusing cash flow with P&L** — profitable companies can run out of cash. The bank balance is truth.
6. **Fundraise assumed in runway calc** — runway is *default*, not hopeful. Exclude uncommitted capital.
