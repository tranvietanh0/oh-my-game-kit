---
name: omg-finance
description: "CFO-grade finance skill for investor updates, board decks, P&L, runway/burn, unit economics (LTV/CAC/ROAS), client concentration (HHI), cohort retention, FX, and finance modeling."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Finance — CFO-Grade Reporting

A knowledge-base skill for generating **finance reports tailored to audience** (investor / internal ops / board / founders) from raw monthly P&L + client + headcount data. Covers services firms, SaaS/product businesses, and ad-arbitrage (UA) in one unified framework — most real studios and ops-heavy startups are hybrids.

## Skill Scope

**IS:** Framework, methodology, KPI definitions, chart patterns, data-model patterns, worked examples, audience-aware templates. A CFO-grade reasoning toolkit.

**IS NOT:** A replacement for a licensed accountant/auditor. Does not generate tax filings, audit opinions, or compliance sign-off. All output is **review input, not final authority**. See `charter.md` for full boundaries.

## When to activate

| User asks about… | Primary reference(s) |
|---|---|
| "investor update", "investor email", "monthly investor report" | `references/audiences.md` → `templates/investor-monthly.md` |
| "board deck", "quarterly board report", "board metrics" | `references/audiences.md` → `templates/board-quarterly.md` |
| "monthly ops", "variance to plan", "internal finance review" | `references/audiences.md` → `templates/ops-monthly-variance.md` |
| "runway", "burn", "cash position", "default-alive test" | `references/cash-runway.md` |
| "unit economics", "LTV", "CAC", "payback", "Rule of 40", "burn multiple" | `references/unit-economics.md` |
| "client concentration", "HHI", "revenue concentration", "top client risk" | `references/client-concentration.md` |
| "client retention", "cohort", "churn vs pause", "new vs existing client" | `references/client-concentration.md` |
| "ROAS", "CPI", "cohort ROAS", "UA payback", "ad arbitrage" | `references/unit-economics.md` → UA section |
| "P&L", "income statement", "gross margin", "OpEx", "COGS" | `references/p-and-l.md` |
| "multi-currency", "FX rate", "USD/VND", "currency conversion" | `references/multi-currency-fx.md` |
| "how to structure finance YAML", "data model", "period rollup" | `references/data-modeling.md` |
| "waterfall chart", "stacked bar", "cohort heatmap", "accessibility" | `references/visualization.md` |
| "vanity metric", "non-GAAP reconciliation", "finance report mistake" | `references/gotchas.md` |
| "services KPI", "utilization", "revenue per head", "billable rate" | `references/unit-economics.md` → Services section |

## Process (always)

1. **Identify audience.** If not stated, ask via `AskUserQuestion`: investor / internal / board / founders.
2. **Load `references/first-principles.md`** — anchor every analysis in accrual vs cash, matching, conservatism, entity.
3. **Load `references/audiences.md`** — get the audience-specific section checklist + top KPIs + commentary style + cadence.
4. **Route to domain references** per the table above.
5. **Check `references/gotchas.md`** for the 10 anti-patterns BEFORE drafting output. Currency mix-ups and double-counting are the most common.
6. **Draft the report/analysis**, then self-review against gotchas + data-validation checklist.
7. **Flag uncertainty explicitly** — if data has gaps or assumptions, say so in the output.

## Core methodology (one-paragraph summary)

Every finance output starts with one question: **"Who is reading this, and what decision must they make?"** Investors decide funding/valuation → narrative + trajectory + unit economics. Internal ops decide resource allocation → variance + utilization + margin. Board decides strategy + risk → concentration + runway + scenario. Founders decide priorities → simple dashboards + red flags. The data is the same; the framing differs. Use one monthly SSOT table and re-project per audience.

## Activation fragments

This skill registers `omg-finance` in the oh-my-game-kit-core activation fragment. Keywords (see YAML frontmatter above) auto-activate this skill whenever finance/investor/board/CFO language appears in the user prompt.

## Security & output discipline

- **Never** expose raw payroll data by individual without the user explicitly requesting it (privacy).
- **Always** label currency per number. Mixing USD and VND without unit labels is the #1 gotcha.
- **Always** separate one-time items from recurring base revenue. Show both.
- **Never** retroactively revalue historical transactions with today's FX rate. Use frozen FX at transaction date.
- **Never** claim compliance/audit authority — output is decision-support, not sign-off.
