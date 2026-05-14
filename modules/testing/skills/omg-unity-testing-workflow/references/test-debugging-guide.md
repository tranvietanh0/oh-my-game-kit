---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: testing
protected: false
---
# Test Debugging Guide

## Tests Don't Appear — Discovery Checklist

Verify in order:

1. [ ] `"references"` includes `UnityEngine.TestRunner`
2. [ ] `"references"` includes `UnityEditor.TestRunner`
3. [ ] `"includePlatforms": ["Editor"]`
4. [ ] `"overrideReferences": true`
5. [ ] `"precompiledReferences": ["nunit.framework.dll"]`
6. [ ] `"defineConstraints": ["UNITY_INCLUDE_TESTS"]`
7. [ ] Test class is `public` with `[TestFixture]`
8. [ ] Test methods are `public` with `[Test]`
9. [ ] `.meta` files exist for all test files
10. [ ] Unity cache cleared (Assets → Reimport All)

## Cache Clearing

**Quick clear:**
```bash
rm -rf Library/ScriptAssemblies/
rm -rf Library/StateCache/
rm -rf Temp/
```
Or in Unity: **Assets → Reimport All**

**Nuclear clear** (when quick clear doesn't work):
```bash
# Close Unity completely first
rm -rf Library/
rm -rf Temp/
rm -rf obj/
rm -rf Logs/
# Reopen Unity — full reimport will run
```

## Force Recompilation

1. Open test file in IDE
2. Make trivial change (add/remove whitespace)
3. Save → Unity recompiles
4. Check Test Runner

Or: right-click `.asmdef` → **Reimport**

## Compilation Errors

### CS0246: Type/namespace not found
```
error CS0246: The type or namespace name 'X' could not be found
```
→ Add missing assembly to `references` in `.asmdef`

### NUnit not found
```
error CS0246: The type or namespace name 'NUnit' could not be found
```
→ Ensure: `"overrideReferences": true` + `"precompiledReferences": ["nunit.framework.dll"]`

### Platform mismatch
```
Assembly 'X' will not be loaded due to errors: Unable to resolve reference 'Y'
```
→ Verify `"includePlatforms": ["Editor"]`

## Runtime / Assertion Errors

### Assertion failure
```xml
<failure><message>Expected: 5 But was: 3</message></failure>
```
Debug steps:
1. Add `Debug.Log` before assertion
2. Verify actual values
3. Check `[SetUp]` initialization
4. Verify dependencies are injected

### NullReferenceException
Common cause: missing initialization.
```csharp
[SetUp]
public void Setup()
{
    service = new YourService();
    dataController = new MockDataController();
}
```

### Timeout/hang
```csharp
[Test, Timeout(5000)]  // 5-second timeout
public void TestMethod() { ... }
```

## Systematic Debugging Approach

**Phase 1 — Identify failure type:**
- Compilation error → check Console, verify assembly references
- Runtime error → check TestResults.xml stack trace, add Debug.Log, verify `[SetUp]`
- Assertion failure → check expected vs actual, verify test logic

**Phase 2 — Isolate:**
1. Run single failing test
2. Add `Debug.Log` before failure point
3. Check logs in Console or `test.log`
4. Verify dependencies initialized

**Phase 3 — Fix and verify:**
1. Make fix → run test again
2. If still failing → return to Phase 1
3. If 3+ attempts failed → question test architecture

## Red Flags

- Missing `includePlatforms: ["Editor"]`
- Missing `UnityEngine.TestRunner` or `UnityEditor.TestRunner` reference
- Forgetting `overrideReferences: true` for NUnit
- Test class or method not `public`
- Missing `[Test]` or `[TestFixture]` attributes
- `.meta` files missing
- Not clearing cache after config changes
