---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Multi-Currency & FX

Most ops-heavy startups spend in one currency and earn in another. Mishandling FX is the single highest-frequency finance-report bug. The rules are small; violating them makes you look unserious.

## The three inviolate rules

### 1. Freeze FX rate at transaction date

When a $1,000 invoice is received on 2026-03-10 and the rate was 26,150 VND/USD:
- **Record:** revenue_usd=1000, revenue_vnd=26150000, fx_applied=26150, fx_date=2026-03-10
- **Never** retroactively change this when the rate moves.

If the rate is now 26,400, reissuing the P&L at 26,400 makes historical comparisons meaningless.

### 2. Declare currency on every number

```yaml
# WRONG
salary: 15000000
revenue: 1000

# RIGHT
salary_vnd: 15000000
revenue_usd: 1000
```

**No mixing USD and VND cells in a single column.** Readers make assumptions; your job is to remove ambiguity.

### 3. Pick ONE reporting currency per statement

The P&L either reports in USD or in VND. Not both.

If your primary currency is USD but cost is mostly VND, state the FX rate used for the report:

> *"All figures in USD. VND amounts converted at the weighted-average monthly rate shown in the FX memo. Prior periods not restated."*

---

## Weighted-average monthly rate

When a month has many VND transactions, a **weighted-average** (transaction-weighted) rate is more accurate than a spot rate:

```
FX_weighted = Σ (transaction VND × transaction FX rate) / Σ (transaction VND)
```

…or simpler, period-average from a public source (State Bank of Vietnam monthly average, for example).

Fixed rate per month is the typical compromise: pick the rate on day 1 of the month, apply to all transactions that month, document the policy.

## Fixed rate policy

For companies that don't have sophisticated FX systems:

- **Choose a fixed rate** (e.g., 26,200 VND/USD for all of 2026).
- **Apply uniformly** across all reports for that period.
- **Disclose** in the footer of every report: "FX rate: 26,200 ₫/USD (fixed for 2026)".
- **Reset** yearly, with an explicit policy change announcement.
- **Footnote** when actual realized FX diverges >3% from fixed, as an informational note.

Simpler than floating; sacrifices precision for consistency. Most investor updates prefer this.

## Variance decomposition

When VND payroll goes from $7,600 to $7,800 MoM, two causes:
- **Wage inflation:** VND amount went up.
- **FX depreciation:** same VND amount converts to more USD.

**Decompose:**
```
Change in USD cost = ΔVND × FX_old + VND_old × ΔFX + ΔVND × ΔFX
                      ──────────      ──────────────     ─────────
                     "wage" effect   "FX" effect         cross-term
```

Or simpler (good enough for monthly reports):
- **At old FX:** report the VND-driven portion.
- **At new FX:** report the total; difference is FX-driven.

Why this matters: if FX is the entire increase, you don't need to cut payroll. You need to hedge or accept the FX risk.

## Balance sheet remeasurement (accounting)

**US GAAP ASC 830** (foreign currency matters) and **IFRS IAS 21**:
- **Monetary items** (cash, AR, AP denominated in foreign currency): remeasure to reporting currency at balance sheet date.
- **Non-monetary items** (fixed assets, prepaid, inventory): carry at historical FX.
- **Revenue/expense** (P&L): recognize at transaction date FX.
- **FX gain/loss** flows to the P&L ("foreign currency translation gain/(loss)") below operating income.

Startups often skip this. Fine for internal reports; mandatory for audited statements.

## Cash in transit — the hidden cost

International wire + FX spread costs 0.5–2% per transfer.

- **Book:** amount received in USD account, not amount sent in VND.
- **Track:** "transfer cost" as a line item (explicit cost of banking, not of operations).
- **Budget:** assume 0.5–1% friction on every USD↔VND conversion.

## Hedging (when it matters)

For companies with:
- Large FX exposure (>20% of cost or revenue in foreign currency)
- Multi-quarter horizon
- Rate volatility

Common tools:
- **Forward contracts:** lock in a rate 1–12 months out.
- **Options:** pay premium, keep upside if rate moves favorably.
- **Natural hedge:** match revenue currency to cost currency (charge clients in VND if you pay staff in VND).

For a typical $10–100M ARR ops shop: hedging is usually overkill. Fixed-rate policy + quarterly review is enough.

## YAML data model pattern

```yaml
config:
  reporting_currency: USD
  fx_policy: fixed_annual
  fx_rate_vnd_per_usd_2026: 26200
  fx_rate_vnd_per_usd_2025: 24800     # historical, frozen

transaction:
  id: tx_001
  date: 2026-03-10
  currency_native: VND
  amount_native: 15000000
  fx_rate_applied: 26200               # at transaction time
  amount_reporting_usd: 572.52         # derived, but stored for audit
  fx_policy_used: fixed_annual
```

Preserve:
- **Native amount** (authoritative)
- **FX rate applied** (what you actually used)
- **Reporting amount** (derived — cache for performance, re-derivable)
- **FX policy** (so the provenance is auditable)

Never lose native amount. You can always re-derive reporting at a different rate; you can't recover native from reporting if precision was lost.

## Reporting footer template

Every P&L, cash flow, or investor update should include:

> *FX disclosure: All USD figures for [period] use the fixed rate of [26,200 ₫/USD] for the year. Native VND figures are preserved in the source data; the fixed rate is applied at render time. Prior periods use their own fixed rates and are not restated. Cash transfers across USD/VND assume 0.5% conversion friction.*

This two-sentence footer answers the FX question before the reader asks.

## Common mistakes

1. **Retroactive revaluation** — changing historical reporting when rate moves. Destroys trend.
2. **Unlabeled currency** — a single "15000" in a table. Does it mean VND, USD, or … both?
3. **Mixed columns** — payroll in VND stacked with revenue in USD in the same "cost" column.
4. **Averaging rates across a volatile period** — hides genuine FX impact.
5. **Forgetting transfer friction** — "we have $100k USD" but 0.5% was eaten on the wire.
6. **Hedge accounting errors** — trying to do sophisticated hedging without a tax/accounting review.
