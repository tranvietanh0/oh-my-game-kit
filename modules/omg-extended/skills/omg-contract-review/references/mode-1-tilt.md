---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Mode 1 — `tilt` (one-sided review)

Read the contract **from one side only**. Your job is to surface every clause that disadvantages that side, regardless of how "standard" or "fair-sounding" it is. Severity buckets:

| Severity | Definition | Example |
|---|---|---|
| **Deal-killer** | Clause makes the deal economically irrational or operationally impossible for your side. | Voluntary exit forfeits vested equity; non-compete with no genre scope; unilateral termination with <30-day notice and no acceleration; clawback window with no fair-cause exceptions. |
| **Structural** | Clause is materially tilted; you'd sign it reluctantly, but a counter will improve your position substantially. | Non-compete >18mo in OECD jurisdictions; clawback >12mo with no sustained-revenue lock-in; retainer vs pure-equity imbalance; cap-table anti-dilution silent on grant-vs-vest mechanics. |
| **Polish** | Clause is fine structurally but language is vague, asymmetric, or missing a minor protection you'd benefit from. | Cure window undefined; dispute mediation not specified; cross-refs stale after renumbering; "reasonable efforts" vs "best efforts" asymmetry. |

## Output format for `tilt`

```markdown
# Tilt Review — {contract-name} (for: {your-side})

## Summary
- {N} deal-killer issues
- {N} structural issues
- {N} polish issues

## Deal-killer issues

### §X.Y — {clause title}
**Issue:** {what's wrong for your side}
**Current language:** "{quote from doc}"
**Why it's a killer:** {consequence}
**Suggested fix:** {specific redline or replacement language}

...
```

## Tilt checklist — 12 recurring clauses

Always scan these even if they're not flagged by reading top-to-bottom:

1. **Vesting mechanics** — reverse vs forward; cliff length; voluntary-exit treatment; accelerated vesting on without-cause termination.
2. **Clawback** — trigger list, exception list, stickiness window, mediation mechanism.
3. **Non-compete** — duration, geographic scope, genre scope (Schedule A), enforceability jurisdiction, breach remedy.
4. **Non-circumvention** — duration, "introduced by or through" scope, affiliates captured.
5. **Key Person clause** — named individuals, replacement window, company approval standard, vesting-during-replacement rule.
6. **Termination for cause** — cure window, material breach definition, burden of proof.
7. **Termination without cause** — notice period, acceleration formula, Pool B treatment post-term.
8. **IP assignment** — work product scope, pre-existing IP carve-outs, licensing-back terms.
9. **Anti-dilution / cap table** — grant-vs-vest conversion mechanics, ongoing-dilution protection, share class treatment.
10. **Attribution rules** (if revenue-based vesting) — source-of-record mechanics, deal-registration rule, quarterly sign-off, silence = locked.
11. **Governing law & disputes** — jurisdiction bias, arbitration seat & rules, costs allocation, language.
12. **Assignment & successor** — change-of-control handling, Key Person survival.