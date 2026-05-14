---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Dimension Details

Full scenario lists for all 12 risk dimensions.

## 1. Auth / Permissions
- No credentials provided
- Expired / revoked credentials
- Wrong role or scope
- Privilege escalation attempts
- Cross-tenant data access (multi-tenancy)
- API key rotation mid-request

## 2. Concurrency / Race Conditions
- Two users modifying the same resource simultaneously
- Read-modify-write without atomic operations
- Double-submit (same request twice, fast)
- Cache invalidation race (read stale, write new)
- Background job vs user request conflict
- Distributed lock expiry during operation

## 3. Network Failure / Timeout
- Downstream service returns 503
- Request times out after N seconds
- Partial response received (connection dropped mid-stream)
- Retry with same idempotency key
- DNS resolution failure
- TLS handshake failure

## 4. Invalid Input / Boundary Values
- `null` where object expected
- Empty string where non-empty required
- Integer overflow (MAX_INT + 1)
- Negative values for positive-only fields
- String 10x longer than max length
- Malformed JSON / XML / binary
- SQL injection attempt
- Path traversal (`../../etc/passwd`)

## 5. i18n / l10n
- Multi-byte Unicode characters (emoji, CJK)
- Right-to-left text (Arabic, Hebrew)
- Locale-specific number format (`1.000,00` vs `1,000.00`)
- Locale-specific date format
- Timezone edge cases (DST transition, UTC offset)
- String collation / sorting differences

## 6. Scale / Volume
- 0 items in a list (empty result set)
- 1 item (boundary)
- 10,000 items (pagination stress)
- Single record with very large field (1MB blob)
- High-frequency requests (N req/s sustained)
- Memory growth over long-running operation

## 7. State Transitions
- Action on already-deleted resource
- Transition to current state (idempotent?)
- Skip intermediate state (go from PENDING directly to COMPLETE)
- Concurrent transitions by two actors
- Rollback of partial multi-step transition
- State after crash mid-transition

## 8. Backward Compatibility
- Old client sends deprecated field (should be ignored gracefully)
- New field added — old client doesn't send it (should use default)
- Enum value added — old client receives unknown value
- Response field removed — old client still expects it
- API version negotiation failure

## 9. Error Cascades
- Upstream fails → does downstream clean up?
- Partial batch failure — some items succeed, some fail
- Circuit breaker opens → behavior during open state
- Error in error handler (meta-failure)
- Unhandled exception type reaches user

## 10. Config / Env Variation
- Required env var missing → should fail fast with clear error
- Wrong type for env var (e.g., string where number expected)
- Feature flag enabled vs disabled
- Dev vs staging vs production config differences
- Config hot-reload while request in flight

## 11. Data Integrity
- Write interrupted mid-transaction
- Foreign key constraint violation
- Duplicate key on insert
- Schema migration mid-traffic (old + new schema simultaneously)
- Soft-delete record accessed as if live
- Circular reference in relational data

## 12. Observability / Logging
- Sensitive data (PII, tokens) appearing in logs
- Request ID not propagated through all services
- Log line truncated mid-JSON
- Metric not emitted on error path
- Trace span not closed on early return
- Alert not firing for known error condition

## Output Format Examples

### Default Checklist Format
```markdown
## Dimension 1: Auth / Permissions

- [ ] **Unauthenticated access**: Call endpoint without token → expect 401
  - Expected: HTTP 401 with `{"error": "Unauthorized"}`
  - Test approach: Unit test with no auth header

- [ ] **Expired token**: Token expired 1 second ago → expect 401 or 403
  - Expected: HTTP 401 with token-expired error code
  - Test approach: Mock clock, set token expiry to past
```

### --for-tests Format
```markdown
## Test Plan: {topic}
Generated: {date}
Dimensions covered: {list}

### Test Suite: Auth / Permissions
| Test ID | Scenario | Input | Expected | Type |
|---------|----------|-------|----------|------|
| AUTH-01 | No token | GET /api/resource (no Authorization header) | 401 Unauthorized | Unit |
| AUTH-02 | Expired token | GET /api/resource (expired JWT) | 401 with code TOKEN_EXPIRED | Unit |
```
