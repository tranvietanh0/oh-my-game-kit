---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# Finance Data Modeling

How to structure finance data in YAML/JSON for a dashboard or report generator. Opinionated — based on real multi-year, multi-unit, multi-currency reporting.

## Core principle: SSOT at month grain

**Month is the single source of truth.** Quarterly, YTD, TTM, YoY are all derived — never hand-entered.

Why: hand-maintaining aggregates guarantees eventual drift. Monthly data is the fundamental unit.

## Directory layout — `data/` root

```
data/
  config.yaml                         # company + currency + rules
  2024/                               # year-scoped data
    company-pnl.yaml
    departments.yaml
    mkt.yaml
    capital.yaml
    one-time-items.yaml
    narrative.md
  2025/                               # same shape
    company-pnl.yaml
    ...
  2026/                               # same shape
    company-pnl.yaml
    ...
  playable/                           # business-unit scoped (multi-year)
    history.yaml                      # cross-year monthly actuals
  forecast/                           # forward-looking
    plan-2026.yaml
    forecast-2026.yaml
```

**Rule of thumb:** if a dataset is year-bounded, scope by year. If it spans years (history, forecast), scope by entity.

## Example: monthly P&L YAML

```yaml
year: 2026
currency: USD
fx_rate_vnd_per_usd: 26200            # fixed policy for this year

months:
  - label: "Jan 2026"
    month: 2026-01                    # ISO date, first of month
    revenue_usd: 29063
    cost_usd: 30045
    net_usd: -982
    note: "Voodoo contract ramping"

  - label: "Feb 2026"
    month: 2026-02
    revenue_usd: 30608
    cost_usd: 29984
    net_usd: 624

  - label: "Mar 2026"
    month: 2026-03
    revenue_usd: 37391
    cost_usd: 35797
    net_usd: 1594

q1_totals:                             # derived, but cached for convenience
  revenue_usd: 97062
  cost_usd: 95826
  net_usd: 1236
```

**Note:** `q1_totals` is derived from `months`. Include for performance / readability, but validate at build time that it matches the sum.

## Example: department breakdown

```yaml
year: 2026
currency: USD

playable_labs:
  description: "Outsource playable-ad production for publisher clients"
  headcount: 13
  monthly_cost_vnd: 249744560
  monthly_cost_usd: 9532.24
  team:
    - { name: "Phạm Hoàng Nam", salary_vnd: 15817935 }
    # …
  revenue:
    jan: { clients: [...], total_usd: 10605 }
    feb: { clients: [...], total_usd: 13214 }
    mar: { clients: [...], total_usd: 12309 }
  q1_totals: { revenue_usd: 36128, cost_usd: 28597, profit_usd: 7531 }

orion_team:
  description: "..."
  # …
```

## Handling inter-segment transfers

```yaml
transfers:
  - from: mkt
    to: game_studio
    amount_usd: 15000
    month: 2026-02
    reason: "50% profit split per MKT policy"
    in_consolidated_pl: false          # flag: do NOT double-count

consolidated:
  # computed: sum of segment revenue − sum of internal transfers
  revenue_usd: 97062
  cost_usd: 95826
```

**Enforce:** consolidation script verifies `consolidated.revenue = Σ(segment.revenue) − Σ(internal transfers)`. Fail loudly on drift.

## Multi-currency preservation

```yaml
transaction:
  id: tx_001
  date: 2026-03-10
  currency_native: VND
  amount_native: 15000000
  fx_rate_applied: 26200
  amount_reporting_usd: 572.52          # derived, but cached
  fx_policy: fixed_annual_2026
```

Store native, FX used, and reporting. All three. Never lose native.

## One-time items

```yaml
year: 2026
currency: USD

items:
  - id: bonus_publisher_2026q1
    label: "Voodoo publisher acquisition bonus"
    category: revenue_one_time
    month: 2026-03
    amount_usd: 50000
    included_in_monthly_cost: false
    notes: "Not recurring; part of new 2-year deal signing."

  - id: legal_setup_2026
    label: "Legal setup for Singapore subsidiary"
    category: expense_one_time
    month: 2026-02
    amount_usd: 12000
    included_in_monthly_cost: false     # if false, it's above-the-line only via this schedule
    notes: "Singapore subsidiary establishment; annual legal renewal ~$2k."
```

Dashboard shows both (total revenue including one-time) and (recurring revenue excluding) when one-time >5%.

## Capital / cash position

```yaml
year: 2026
currency: USD
as_of: 2026-03-31

founder_capital:
  classification: interest_free_loan
  contributions:
    - { founder: Tú,    amount_vnd: 500000000, amount_usd: 19084 }
    - { founder: Thảo,  amount_vnd: 300000000, amount_usd: 11450 }
    - { founder: Luke,  amount_vnd: 200000000, amount_usd:  7634 }
  totals:
    total_vnd: 1000000000
    total_usd: 38168
  external_debt: 0

cash_position:
  on_hand_usd: 185000
  current_liabilities_due_30d_usd: 15000
  net_cash_usd: 170000
  transfer_cost_buffer_usd: 1000         # 0.5% of $200k potential conversion

net_worth:
  cash_on_hand_est: 170000
  capital_owed_to_founders: 38168
  net: 131832
  interpretation: "Positive net worth; founders paid first in an orderly wind-down scenario."
```

## Forward-looking (plan / forecast) data

```yaml
scenarios:
  plan:
    source: 2026 annual budget
    confidence: committed
    monthly:
      jan_2026: { revenue_usd: 28000, cost_usd: 30000 }
      # ...
  forecast:
    source: updated 2026-03-15
    confidence: high
    monthly:
      apr_2026: { revenue_usd: 40000, cost_usd: 36000 }
      # ...
  bull:
    source: best case
    confidence: low
    # …
  bear:
    source: worst case
    confidence: low
    # …
```

**Golden rule:** never mix scenarios in actuals. Keep separate files or scenarios keys.

## Schema validation

For any of these files in production, validate with a schema (zod, JSON schema, pydantic):
- Currency field present
- Numbers are numbers, not strings
- Months are ISO dates
- Required fields all present
- Enum values match expected set

Fail loudly at load time. Silent partial loads produce wrong reports.

## Normalization rules (client names, etc.)

Human-entered data has inconsistencies. Normalize at load:

```python
CLIENT_NAME_MAP = {
    "Voodoo": "voodoo",
    "voodoo ": "voodoo",
    "VOODOO": "voodoo",
    "MochiLabs": "mochilabs",
    "Mochii Update": "mochilabs",       # canonicalize variants
    "Outsource": "outsource",
    "outsource": "outsource",
}

def normalize_client(name):
    return CLIENT_NAME_MAP.get(name.strip(), name.strip().lower().replace(" ", "_"))
```

Store normalized form in the data; keep a "display_name" if you want to preserve the original presentation.

## Derived vs stored

**Never store derived values.**

| Value | Store? | Derive? |
|---|---|---|
| Monthly revenue | ✅ Store | |
| Monthly cost | ✅ Store | |
| Monthly net | | ✅ Derive (revenue − cost) |
| Gross margin % | | ✅ Derive |
| Q1 total | 🤔 Cache OK if validated | ✅ Derive at render |
| YoY % | | ✅ Derive |
| Runway months | | ✅ Derive (cash / burn) |
| HHI | | ✅ Derive from per-client shares |

Derived = storage waste + drift risk. Cache only with a validation gate at build time.

## Version the schema

```yaml
_schema_version: 1.2.0                  # in every data file
```

When the schema changes:
- Bump major for breaking (renames, removals).
- Bump minor for additive (new optional fields).
- Bump patch for clarifications.
- Consumers check compat at load time.

## Gotchas specific to finance data

1. **Date strings vs Date objects** — js-yaml parses `2026-01-31` as a Date; other parsers don't. Normalize early.
2. **Floating-point cents** — store money as integer cents or integer micro-units. Never float. Or use a decimal type.
3. **Null vs zero** — "no data" is not the same as "zero revenue". Use null (or omit key) for unknown, 0 for truly zero.
4. **Negative revenue** — refunds, chargebacks exist. Allow negative; don't clamp to zero.
5. **Large lists in YAML** — 50+ transactions inline becomes unreadable. Split by month, or switch to JSON Lines for transaction streams.
