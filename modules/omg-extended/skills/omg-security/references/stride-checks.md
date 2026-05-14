---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# STRIDE Detailed Checks

## S — Spoofing
- JWT signature verification present and enforced
- Session tokens are cryptographically random (not sequential/predictable)
- Password reset tokens expire and are single-use
- OAuth state parameter validated to prevent CSRF on auth flow
- Multi-factor authentication available for sensitive operations
- Account enumeration prevented (consistent error messages for unknown user vs wrong password)

## T — Tampering
- All user input validated server-side (not client-side only)
- Parameterized queries / ORM used (no string concatenation in SQL)
- Output encoding applied before rendering in HTML context (XSS)
- CSRF tokens on all state-changing forms/endpoints
- File uploads: MIME type verified, not just extension; stored outside web root
- Deserialization of untrusted data avoided or type-constrained

## R — Repudiation
- All authentication events logged (login, logout, failed attempts)
- Sensitive operations logged with: actor, timestamp, resource, action
- Logs are append-only (cannot be modified by application)
- Log entries include request ID for trace correlation
- Admin actions attributed to specific admin accounts (no shared admin)

## I — Information Disclosure
- Error responses do not expose stack traces, DB queries, or internal paths
- Debug endpoints (`/debug`, `/metrics`, `/_health`) require auth or are restricted
- Sensitive data fields (passwords, tokens, SSNs) excluded from logs
- API responses don't include fields the caller isn't authorized to see
- HTTP response headers don't expose server version (`Server:`, `X-Powered-By:`)
- `robots.txt` doesn't reveal sensitive paths

## D — Denial of Service
- Rate limiting applied to auth endpoints (login, password reset, registration)
- Request body size limits enforced
- Pagination enforced on list endpoints (no unbounded queries)
- Regular expressions checked for catastrophic backtracking (ReDoS)
- Resource-intensive operations (file processing, report generation) have timeouts
- Database queries have row limits / query timeouts

## E — Elevation of Privilege
- Authorization checks server-side for every request (not just UI-hidden)
- RBAC roles are least-privilege by default
- Mass assignment prevented (explicit allow-lists for model fields, not deny-lists)
- Horizontal privilege escalation checked (user A accessing user B's resources)
- Admin functionality not accessible to regular users even with direct URL
- Default credentials changed; no hardcoded credentials in source

## OWASP Top 10 Mapping

| OWASP | Category | STRIDE |
|-------|----------|--------|
| A01 Broken Access Control | Unauthorized access | E (Elevation), S (Spoofing) |
| A02 Cryptographic Failures | Weak/missing crypto | I (Info Disclosure) |
| A03 Injection | SQL/code/command injection | T (Tampering) |
| A04 Insecure Design | Missing security controls | All |
| A05 Security Misconfiguration | Unsafe defaults | E (Elevation), I (Info Disclosure) |
| A06 Vulnerable Components | Outdated dependencies | All |
| A07 Auth Failures | Auth/session issues | S (Spoofing) |
| A08 Software Integrity Failures | Unsigned updates, CI/CD | T (Tampering) |
| A09 Logging Failures | Missing audit trail | R (Repudiation), I (Info Disclosure) |
| A10 SSRF | Server-side request forgery | S (Spoofing), I (Info Disclosure) |

## Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| **Critical** | Direct exploit path, no auth required | Fix before any deployment |
| **High** | Exploitable with low effort or common technique | Fix before next release |
| **Medium** | Requires specific conditions to exploit | Fix in next sprint |
| **Low** | Defense-in-depth improvement | Fix when convenient |
| **Info** | Observation, no direct risk | Consider for future hardening |

## Output Format Template

```markdown
## Security Audit Report — {date}
Scope: {path or "full project"}

### STRIDE: Spoofing

#### [HIGH] JWT not validated on protected routes
- **File**: src/api/middleware/auth.ts:45
- **Issue**: `verifyToken()` called but return value not checked — invalid tokens pass through
- **OWASP**: A07 Identification and Authentication Failures
- **Fix**: `if (!verifyToken(token)) return res.status(401).json({error: 'Unauthorized'})`

---

## Summary
| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 2 |
| Medium | 3 |
| Low | 5 |
| Info | 2 |

**Result: 2 HIGH findings require immediate attention.**
```
