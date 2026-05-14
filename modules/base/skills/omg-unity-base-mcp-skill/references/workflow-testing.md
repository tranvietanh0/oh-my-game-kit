---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-base
protected: false
---
# Workflow: Testing

Run Unity tests, poll async jobs, and implement TDD patterns via MCP.

> **Template warning:** Examples are skill templates. Validate against your project setup.

## Run Specific Tests

```python
# 1. List available tests
# Read mcpforunity://tests/EditMode

# 2. Run specific tests
result = run_tests(
    mode="EditMode",
    test_names=["MyTests.TestPlayerMovement", "MyTests.TestEnemySpawn"],
    include_failed_tests=True
)
job_id = result["job_id"]

# 3. Wait for results
final_result = get_test_job(
    job_id=job_id,
    wait_timeout=60,
    include_failed_tests=True
)

# 4. Check results
if final_result["status"] == "complete":
    for test in final_result.get("failed_tests", []):
        print(f"FAILED: {test['name']}: {test['message']}")
```

---

## Run Tests by Category

```python
result = run_tests(
    mode="EditMode",
    category_names=["Unit"],
    include_failed_tests=True
)

# Poll until complete
while True:
    status = get_test_job(job_id=result["job_id"], wait_timeout=30)
    if status["status"] in ["complete", "failed"]:
        break
```

---

## Test-Driven Development Pattern

```python
# 1. Write test first
create_script(
    path="Assets/Tests/Editor/PlayerTests.cs",
    contents='''using NUnit.Framework;
using UnityEngine;

public class PlayerTests
{
    [Test]
    public void TestPlayerStartsAtOrigin()
    {
        var player = new GameObject("TestPlayer");
        Assert.AreEqual(Vector3.zero, player.transform.position);
        Object.DestroyImmediate(player);
    }
}'''
)

# 2. Refresh
refresh_unity(mode="force", scope="scripts", compile="request", wait_for_ready=True)

# 3. Run test
result = run_tests(mode="EditMode",
    test_names=["PlayerTests.TestPlayerStartsAtOrigin"])
get_test_job(job_id=result["job_id"], wait_timeout=30)
```

---

## Diagnose Compilation Errors

```python
# 1. Check console
errors = read_console(
    types=["error"], count=20,
    include_stacktrace=True, format="detailed"
)

# 2. For each error, find file and line
for error in errors["messages"]:
    # Parse error message for file:line info
    # Use find_in_file to locate problematic code
    pass

# 3. After fixing, refresh and check again
refresh_unity(mode="force", scope="scripts", compile="request", wait_for_ready=True)
read_console(types=["error"], count=10)
```

---

## Domain Reload Recovery

```python
import time
max_retries = 5
for attempt in range(max_retries):
    try:
        editor_state = read_resource("mcpforunity://editor/state")
        if editor_state["ready_for_tools"]:
            break
    except:
        time.sleep(2 ** attempt)  # Exponential backoff
```

---

## Compilation Block Recovery

```python
# 1. Check console for errors
errors = read_console(types=["error"], count=20)

# 2. Fix script errors (edit scripts)

# 3. Force refresh
refresh_unity(mode="force", scope="scripts", compile="request", wait_for_ready=True)

# 4. Verify clean console
errors = read_console(types=["error"], count=5)
if not errors["messages"]:
    pass  # Safe to proceed
```
