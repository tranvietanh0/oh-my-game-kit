---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Finance First Principles

Anchor concepts every finance output should rest on. Load this before any specific template.

## The five pillars

### 1. Accrual vs cash
- **Accrual:** recognize revenue when *earned* (invoice sent, service delivered), expense when *incurred* (obligation created).
- **Cash:** recognize only when money moves.

Investors expect accrual-basis P&L for trajectory; founders often run cash-basis internally for runway. **State which basis you use.** If reporting accrual P&L but cash runway, say so explicitly — the numbers won't reconcile otherwise.

### 2. Matching
- Pair each expense with the revenue it generated in the **same period**.
- Paying Jan payroll in Feb? Expense sits in Jan (when labor was consumed), not Feb (when cash left).
- Prepaid annual insurance? Amortize monthly, don't expense in month-of-payment.

Matching is what makes margin meaningful. Cost and revenue in the same window = real margin. Mismatched = accounting fiction.

### 3. Conservatism
- When estimating, err on the **pessimistic** side.
- Recognize losses promptly; defer gains until realized.
- Runway: use `Math.floor(cash / burn)`, not `round`. Better to over-deliver than miss a board promise by one month.

### 4. Entity concept
- The business is a **separate entity** from its founders.
- Founder capital contributions are **liabilities owed to founders**, not revenue.
- Founder loans to the company create a repayable balance, not equity, unless explicitly converted.
- Personal expenses on the company card should be reclassified to a founder draw.

### 5. Consistency
- Once you choose a method (revenue recognition, depreciation, inventory valuation), **stick with it** across periods.
- Methodology changes must be disclosed and, ideally, restated for prior periods so trends are comparable.

## The four financial statements (and which one matters when)

| Statement | What it answers | Cadence | Who cares |
|---|---|---|---|
| **P&L (Income Statement)** | Did we earn more than we spent this month? | Monthly | Everyone |
| **Cash Flow** | Did cash go up or down? Where did it go? | Monthly | Founders, board, investors |
| **Balance Sheet** | What do we own, what do we owe, what's equity worth? | Quarterly | Board, investors, auditors |
| **Statement of Changes in Equity** | How did founder/investor ownership change? | On event (raise, dividend) | Investors, cap table |

**Common mistake:** conflating P&L net income with cash flow. A profitable company can still run out of cash (receivables too slow, inventory tied up). A cash-rich company can be unprofitable (customer deposits, deferred revenue). Report both, separately.

## Signed conventions (tripping hazard)

- **Revenue:** positive.
- **Cost/Expense:** stored as positive, **subtracted** to get profit. Or stored as negative and added. Pick one convention; document it; enforce in schema.
- **Inflows to cash:** positive. **Outflows:** negative.
- **P&L:** `net = revenue - cost` (preferred). Never `revenue + cost` with costs-as-negatives *and* also subtracted; double-negative bugs are common.

## Currency and units

- **Declare currency on every number.** Unlabeled numbers are landmines.
- **One reporting currency per statement.** Footnote minor conversions. Never mix USD and VND cells in one column.
- **Freeze FX rate at transaction date.** Never retro-revalue. See `multi-currency-fx.md`.

## Definitions that trip people up

- **Gross margin:** revenue − direct costs (COGS / cost-of-revenue). Excludes OpEx, marketing, rent.
- **Contribution margin:** gross margin − variable selling costs. Tells you what's left *per unit* after direct + variable costs.
- **Operating margin / EBIT:** revenue − COGS − OpEx. Excludes interest, tax, one-time items.
- **EBITDA:** operating income + depreciation + amortization. Proxy for cash profitability; **not GAAP**. Always reconcile.
- **Net income:** bottom line after everything — tax, interest, one-time, everything.

Mixing these up is the single most common finance-literacy failure. If in doubt, state the formula inline.

## Rule of thumb for every number you publish

**If a stranger read this cold, could they reproduce it from the source?**

- Source data location: footnoted.
- Formula: either inline or in a methods appendix.
- FX rate (if converted): stated.
- Period basis (calendar/fiscal/TTM): stated.
- Accrual vs cash: stated.

If any of those are missing, it's a vanity metric, not a finance metric.

## Forward-looking vs backward-looking

| Type | What it is | Grain | Confidence |
|---|---|---|---|
| **Actual** | Closed-book historical | Month (or day) | High (subject to true-up for late invoices) |
| **Forecast** | Projection you will defend | Month / quarter | Medium — disclose assumptions |
| **Plan / budget** | Committed target | Year | Low — aspirational; for variance framing |
| **Scenario** | What-if (base, bull, bear) | Year | Varies — always show range |

Don't mix without labels. A chart that overlays "actual" with "plan" without labeling which is which destroys investor trust the first time someone spots the ambiguity.
