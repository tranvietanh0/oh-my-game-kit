---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: testing
protected: false
---
# Test Assembly Configuration

## Correct .asmdef Pattern (Editor Platform Only)

```json
{
    "name": "YourPackage.Tests",
    "rootNamespace": "YourNamespace.Tests",
    "references": [
        "YourMainAssembly",
        "UnityEngine.TestRunner",
        "UnityEditor.TestRunner"
    ],
    "includePlatforms": ["Editor"],
    "excludePlatforms": [],
    "allowUnsafeCode": false,
    "overrideReferences": true,
    "precompiledReferences": [
        "nunit.framework.dll"
    ],
    "autoReferenced": true,
    "defineConstraints": [
        "UNITY_INCLUDE_TESTS"
    ],
    "versionDefines": [],
    "noEngineReferences": false
}
```

## Key Configuration Fields

| Field | Value | Why |
|-------|-------|-----|
| `includePlatforms` | `["Editor"]` | Tests discovered by Test Runner only in Editor |
| `references` | `UnityEngine.TestRunner`, `UnityEditor.TestRunner` | Required for test framework |
| `overrideReferences` | `true` | Required to use nunit.framework.dll |
| `precompiledReferences` | `["nunit.framework.dll"]` | Enables [Test], [TestFixture], [SetUp], [TearDown] |
| `defineConstraints` | `["UNITY_INCLUDE_TESTS"]` | Strips test code from non-test builds |
| `autoReferenced` | `true` | Test Runner discovers this assembly |

## Recommended Folder Structure

```
YourPackage/
├── Runtime/
│   └── YourPackage.asmdef
├── Editor/
│   └── YourPackage.Editor.asmdef
└── Tests/
    ├── Runtime/
    │   ├── YourPackage.Tests.asmdef
    │   └── YourTests.cs
    └── Editor/
        └── YourPackage.Editor.Tests.asmdef
```

## Meta Files

Every test file needs a `.meta` file:
```
Tests/
├── YourPackage.Tests.asmdef
├── YourPackage.Tests.asmdef.meta
├── YourTests.cs
└── YourTests.cs.meta
```

To generate missing `.meta` files: right-click test file in Unity Project window → **Reimport**.

## Common Test Patterns

### Basic Structure

```csharp
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

namespace YourNamespace.Tests
{
    [TestFixture]
    public class YourTests
    {
        private YourService service;

        [SetUp]
        public void Setup() { service = new YourService(); }

        [TearDown]
        public void TearDown() { service?.Dispose(); }

        [Test]
        public void TestMethodName()
        {
            var result = service.Process(5);
            Assert.AreEqual(10, result);
        }

        [Test]
        [TestCase(1, 2)]
        [TestCase(3, 6)]
        public void TestWithParameters(int input, int expected)
        {
            Assert.AreEqual(expected, service.Process(input));
        }
    }
}
```

### Async / UnityTest

```csharp
[UnityTest]
public IEnumerator TestAsync()
{
    service.StartOperation();
    yield return new WaitUntil(() => service.IsComplete);
    Assert.IsTrue(service.Result);
}
```

### Testing With GameObjects

```csharp
[UnityTest]
public IEnumerator TestWithGameObject()
{
    var go = new GameObject("Test");
    var component = go.AddComponent<YourComponent>();
    yield return null;  // Wait one frame
    Assert.IsNotNull(component);
    Object.DestroyImmediate(go);
}
```
