---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Function Contracts — Pre/Post/Errors

Every Domain and Application function declares its contract:

1. **Preconditions** — guard clauses at the top.
2. **Postconditions** — invariants asserted on return.
3. **Side effects** — events emitted or state mutated, declared explicitly.
4. **Errors** — returned via `Result<T, Error>`, never thrown from Domain.

This file is universal. Engine syntax (NUnit attributes, Vitest matchers)
lives in `unity-patterns.md` and `cocos-patterns.md`.

---

## Preconditions — guard clauses, not assertions

A function fails fast on invalid input by returning an `Err`. It does NOT
throw — throws are an Application/Infrastructure concern.

```csharp
// C# — Domain
public Result<DamageResult, AttackError> Attack(Health target, int amount)
{
    if (target == null)        return Err(AttackError.TargetMissing);
    if (amount < 0)            return Err(AttackError.NegativeDamage);
    if (target.IsDead)         return Err(AttackError.AlreadyDead);

    // ... main logic
}
```

```ts
// TS — Domain
export function attack(target: Health, amount: number): Result<DamageResult, AttackError> {
    if (!target)            return err({ kind: 'TargetMissing' });
    if (amount < 0)         return err({ kind: 'NegativeDamage' });
    if (target.isDead)      return err({ kind: 'AlreadyDead' });

    // ... main logic
}
```

**Rule:** every public Domain/Application function with > 1 input has at
least one guard clause OR a comment stating why no guards are needed.

---

## Postconditions — invariants on return

State the invariant the return value guarantees. If the invariant is
non-obvious, assert it.

```csharp
// C#
public Result<DamageResult, AttackError> Attack(Health target, int amount)
{
    // ... logic
    var result = new DamageResult(actualDamage, target.IsDead);

    // Postcondition: actualDamage >= 0 always
    Debug.Assert(result.ActualDamage >= 0);
    return Ok(result);
}
```

```ts
// TS
export function attack(target: Health, amount: number): Result<DamageResult, AttackError> {
    // ... logic
    const result: DamageResult = { actualDamage, isDead: target.isDead };

    // Postcondition: actualDamage >= 0
    if (result.actualDamage < 0) throw new Error('invariant: actualDamage >= 0');
    return ok(result);
}
```

In production builds, postcondition asserts strip out (`Debug.Assert` in
Unity, `process.env.NODE_ENV` guard in Cocos). They are dev-time
documentation that doubles as a runtime trip-wire.

---

## Side effects — explicit, never hidden

If a function emits an event, mutates external state, or writes to disk,
**declare it in the function name or signature**. No silent side effects.

```csharp
// GOOD — name says it
public Result<Unit, AttackError> ApplyDamageAndEmitDamageDealt(...) { ... }

// BETTER — decompose
public Result<DamageResult, AttackError> CalculateDamage(...)  { ... }  // pure
public void EmitDamageDealt(DamageResult r)                    { ... }  // side effect
```

The Application layer composes the pure result and the side effect. Domain
stays side-effect-free.

```ts
// Application use case
export class AttackUseCase {
    constructor(private bus: SignalBus) {}

    execute(target: Health, amount: number): Result<DamageResult, AttackError> {
        const r = attack(target, amount);                 // pure Domain
        if (r.ok) this.bus.emit('DamageDealt', r.value);  // side effect explicit
        return r;
    }
}
```

---

## Errors via `Result<T, Error>` — no throws in Domain

```csharp
// C# — minimal Result type (ship in shared kernel or use OneOf / ErrorOr)
public readonly struct Result<T, E>
{
    public readonly T Value;
    public readonly E Error;
    public readonly bool IsOk;
    private Result(T v, E e, bool ok) { Value = v; Error = e; IsOk = ok; }
    public static Result<T, E> Ok(T v)  => new Result<T, E>(v, default, true);
    public static Result<T, E> Err(E e) => new Result<T, E>(default, e, false);
}
```

```ts
// TS — discriminated union
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
export const ok  = <T>(v: T): Result<T, never>  => ({ ok: true, value: v });
export const err = <E>(e: E): Result<never, E> => ({ ok: false, error: e });
```

**Why no throws in Domain:**

- Throws are control flow disguised as errors — break the type signature
  promise.
- Domain runs in unit tests without engine runtime; throws across engine
  boundaries are unpredictable.
- `Result<T, Error>` makes every error path visible in the call site —
  callers can't forget to handle.

**Where throws ARE OK:** Infrastructure adapters can throw on engine-level
failures (file I/O, network). Application catches and converts to
`Result<T, Error>` at the boundary.

---

## Errors over silent fallbacks

This rule is universal in Oh My Game Kit (`rules/development-principles.md`):

- Never silently substitute a default when input is invalid — return `Err`.
- The only acceptable fallback: explicitly documented, logged, and user
  informed (e.g., asset missing → fall back to placeholder, log warning).
- Silent fallbacks hide bugs and double the maintenance cost on every
  update.

---

## When NOT to apply

- **Trivial getters** (`Health.Current`) — no contract needed.
- **Pure data containers** (value objects with no behavior) — no contract
  needed.
- **One-liner helpers** (`Math.Clamp`-style) — no contract needed.

If a function is one expression and the input domain is the full type, the
type system IS the contract. Don't over-document.

---

## Related

- `principles.md` — the dependency rule (Domain stays pure)
- `inter-module-communication.md` — events emitted as side effects
- `module-contracts.md` — module-level contract pattern (function contracts
  scale up to module contracts)
- `testing-strategy.md` — preconditions are the unit-test boundary
