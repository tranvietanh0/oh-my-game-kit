---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-finance
protected: true
---
# omg-finance Charter

> What this skill IS and, just as important, what it IS NOT. Clarifies scope so design decisions stay consistent.

## Product thesis

**Make every ops-heavy founder think like a CFO, without hiring one.**

Most startup founders, creative-studio operators, and service-firm leaders have good instinct but shallow financial literacy. The existing tools are either too heavy (QuickBooks, NetSuite, full fractional CFOs) or too narrow (SaaS metrics only, or bookkeeping only). This skill fills the gap: **CFO-level reasoning templates, methodology, and audience-aware reporting, delivered via conversation.**

## IS

- A **framework generator**: audience-aware templates, decision checklists, KPI definitions.
- A **methodology teacher**: HHI, cohort retention, unit economics, FX handling, variance analysis.
- A **reporting assistant**: turns raw monthly data into investor emails, board decks, ops reviews.
- A **gotcha guard**: 10 common finance-report anti-patterns with explicit defenses.
- A **data-model consultant**: how to structure finance YAML/JSON for multi-year, multi-unit, multi-currency reporting.
- **Reusable across industries**: SaaS, services, creative studios, ad arbitrage, hybrid models.

## IS NOT

- **Not an accountant replacement.** Does not produce tax filings, audit reports, GAAP sign-off, or regulatory compliance certifications.
- **Not a bookkeeping system.** Does not post ledger entries, reconcile banks, or manage AR/AP.
- **Not a forecasting engine.** Can help structure a forecast, but does not compute stochastic models, Monte Carlo simulations, or produce a committed P&L forecast.
- **Not a legal/tax-advice source.** For jurisdiction-specific rules (corporate tax, transfer pricing, labor law) — defer to licensed professionals.
- **Not a spreadsheet.** Produces markdown/YAML/chart specs. Rendering happens in the dashboard/downstream tool.
- **Not industry-specific.** Avoids hardcoded healthcare/fintech/etc. examples — teaches the mental model, not a template for one vertical.
- **Not real-time.** Assumes static monthly inputs provided by the user. No live API pulls.

## Design principles

1. **Methodology-first, templates-second.** Load `first-principles.md` before any specific template. Consistent reasoning beats inconsistent outputs.
2. **Audience framing drives everything.** Same data, re-projected: investor narrative ≠ ops variance ≠ board risk.
3. **One SSOT, many views.** Monthly actuals are the single source of truth. Quarterly, YTD, TTM are always computed, never hand-entered.
4. **Human approves material decisions.** Automate the numbers; humans own the story.
5. **Error over silence.** If data is ambiguous or a field is missing, say so loudly. Never fabricate.
6. **Conservative by default.** Runway uses `floor`, not `round`. Burn excludes optimistic assumptions. One-time items are separated from recurring.

## Out-of-scope escalation

| User asks for… | Redirect to… |
|---|---|
| Tax filing, T1/T2/K-1 forms | Licensed accountant / tax software (QuickBooks, Xero, TurboTax) |
| Audit opinion, GAAP attestation | Licensed CPA firm |
| Legal advice (contracts, IP, HR) | Legal counsel |
| Real-time bank sync, AR/AP posting | Accounting system (QuickBooks, Xero, Beancount + cfo-stack skill) |
| Industry-specific compliance (SOC2, HIPAA) | Domain-specific skill or consultant |

## Versioning policy

- Bump `version:` in SKILL.md frontmatter when any reference file changes materially.
- Add changelog entry inline in the changed reference file ("Updated 2026-04-23: HHI thresholds updated per latest a16z benchmark").
- Breaking changes (renaming a reference, changing the routing table) → major version bump.

## Attribution

This skill was seeded by studying four public Codex / AgentSkill repos (cfo-stack, AnythingButLaw, ai-ceo-framework, cloud-finops-skills) plus industry CFO playbooks (Sequoia, YC, a16z, Brex, ProfitWell). None of those sources' content is copied; patterns and structure are original adaptations.
