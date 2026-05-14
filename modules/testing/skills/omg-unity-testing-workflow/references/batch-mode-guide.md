---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: testing
protected: false
---
# Batch Mode & CI Testing Guide

## Command Line Execution

```bash
unity-editor \
    -runTests \
    -batchmode \
    -projectPath /path/to/project \
    -testResults /path/to/results.xml \
    -testPlatform EditMode \
    -logFile /path/to/test.log
```

### Platform Options

| `-testPlatform` | When |
|----------------|------|
| `EditMode` | Pure C# tests, no runtime needed (fastest) |
| `PlayMode` | Tests requiring Unity runtime, MonoBehaviour lifecycle |

## Finding Test Results

```bash
# Default Unity location
~/.config/unity3d/[CompanyName]/[ProductName]/TestResults.xml

# Or the path specified via -testResults flag
/path/to/results.xml
```

## Analyzing Results with grep

```bash
# Find all failed tests
grep -B 5 'result="Failed"' TestResults.xml

# Extract failure messages
grep 'Expected:' TestResults.xml

# Count pass/fail
grep -c 'result="Passed"' TestResults.xml
grep -c 'result="Failed"' TestResults.xml

# Show test names with failures
grep -B 2 'result="Failed"' TestResults.xml | grep 'test-case name'
```

## XML Format Reference

### Passing test
```xml
<test-case name="YourTest"
           executed="True"
           result="Passed"
           success="True"
           time="0.123" />
```

### Failing test
```xml
<test-case name="YourTest"
           executed="True"
           result="Failed"
           success="False"
           time="0.456">
    <failure>
        <message>Expected: 5 But was: 3</message>
        <stack-trace>
            at YourTest.TestMethod() in /path/to/Test.cs:line 42
        </stack-trace>
    </failure>
</test-case>
```

## CI Integration Notes

- Always exit non-zero on test failure: Unity `-runTests` returns exit code 2 on failures
- Pass `-logFile -` to stream logs to stdout in CI
- `-batchmode -nographics` — no GPU required (Linux CI safe)
- Batch mode **cannot** generate code coverage reports — use Unity Editor GUI for coverage (see Unity Package Coverage Limitation docs)

## Coverage Limitation

**CRITICAL**: Unity's batch mode does NOT support code coverage generation correctly. Coverage reports require running tests in the Unity Editor GUI via **Window → General → Test Runner**. Do not attempt coverage in CI batch mode — it silently fails or produces empty reports.
