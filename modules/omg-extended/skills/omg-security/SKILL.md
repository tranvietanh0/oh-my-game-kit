---
name: omg-security
description: "Security audit using STRIDE threat model and OWASP Top 10 checklist. Use for 'security audit', 'security review', 'threat model', 'find vulnerabilities', 'OWASP check'."
---

# Codex Port Notice

This skill was ported from upstream reference material. Interpret command names, paths, and agent-routing guidance as Codex/Oh My Game Kit equivalents. Prefer active Codex tools and local project instructions over Codex-specific mechanics when they conflict.

# Oh My Game Kit Security — STRIDE + OWASP Audit

Security audit combining STRIDE threat modeling with OWASP Top 10 checks. Produces actionable findings with severity levels and suggested fixes.

## Usage

```
omg-security                          # Audit entire project
omg-security src/auth/                # Audit specific directory
omg-security --scope auth             # Focus on auth subsystem
omg-security --auto-fix               # Audit + offer to apply fixes
omg-security --report                 # Save findings to plans/reports/
```

## STRIDE Categories

| Category | Threat | Key Checks |
|----------|--------|------------|
| **S**poofing | Identity forgery | Auth bypass, session hijacking, token forgery |
| **T**ampering | Data modification | Input validation, SQL injection, XSS, CSRF |
| **R**epudiation | Denying actions | Audit logging gaps, missing attribution |
| **I**nformation Disclosure | Data leakage | Error messages, debug endpoints, PII in logs |
| **D**enial of Service | Availability attack | Rate limiting, ReDoS, large payload |
| **E**levation of Privilege | Access escalation | RBAC bypass, mass assignment, insecure defaults |

Full per-category checks and OWASP Top 10 mapping: `references/stride-checks.md`

## Audit Process

1. Determine scope (full project or `--scope` flag)
2. For each STRIDE category: run checks from `references/stride-checks.md`
3. Assign severity (Critical/High/Medium/Low/Info)
4. Group findings by category
5. Output report in standard format (see `references/stride-checks.md`)

## Flags

- `--auto-fix`: After reporting, list High+Critical with code changes. Confirm per-fix before applying — never bulk-apply.
- `--report`: Save findings to `plans/reports/security-audit-{date}.md`
- `--scope auth|api|data`: Limit audit to subsystem

## Gotchas

- **False positives on crypto**: Library wrappers may look like raw crypto — check the wrapper implementation before flagging
- **Config-based auth**: Some frameworks apply auth globally via middleware config — check config files, not just route handlers
- **SSRF via URL params**: Any endpoint accepting a URL parameter is an SSRF candidate — always flag for review
- **Logging PII**: Check both explicit log statements AND error serialization (stack traces may include request bodies)
- **ReDoS detection**: Look for regex patterns with nested quantifiers: `(a+)+`, `(a|a)*`, `([a-z]+)*` — dangerous
