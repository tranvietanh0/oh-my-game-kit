---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# ZString IL2CPP Managed Stripping Guide

**TL;DR**: On IL2CPP with "High" managed stripping, ZString may throw `MissingMethodException: ReflectionTypeLoadException`. Fix: lower stripping to "Medium" or add `Assets/link.xml`.

## The Problem

IL2CPP strips unused managed types at build time. ZString's internal use of `System.Reflection` can be removed, causing runtime failures on device (not in Editor — Editor uses Mono).

**Error signature:**
```
MissingMethodException: Could not load type 'System.Reflection.ReflectionTypeLoadException'
    at Cysharp.Text.ZString.Format(...)
```

**When it occurs**: iOS, Android, WebGL builds with Managed Stripping Level = "High".

---

## Solution 1: Lower Stripping Level (Simplest)

1. Editor → Build Settings → Player Settings → Optimization
2. Set **Managed Stripping Level** to `Medium`
3. Rebuild

| Level | APK Size | ZString Risk |
|-------|----------|--------------|
| High | Smallest | Fails without Link.xml |
| Medium | -2-5% | Safe (recommended) |
| Low | ~0% | Always safe |

---

## Solution 2: Add Link.xml (High Stripping + Safe)

Create `Assets/link.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<linker>
  <!-- ZString requires System.Reflection types -->
  <assembly fullname="netstandard">
    <namespace fullname="System.Reflection" preserve="all"/>
  </assembly>
</linker>
```

Commit this file to version control. IL2CPP linker reads it before stripping.

**Granular variant** (smaller binary):
```xml
<linker>
  <assembly fullname="netstandard">
    <type fullname="System.Reflection.PropertyInfo" preserve="all"/>
    <type fullname="System.Reflection.FieldInfo" preserve="all"/>
    <type fullname="System.Reflection.MethodInfo" preserve="all"/>
    <type fullname="System.Type" preserve="all"/>
  </assembly>
</linker>
```

---

## Decision Tree

```
Deploying to IL2CPP (iOS/Android)?
├─ NO  → No action needed (Mono is fine)
└─ YES → Using ZString?
          ├─ APK size critical → Keep "High" + add Link.xml
          └─ Otherwise        → Set stripping to "Medium" (simplest)
```

---

## Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Same error despite Link.xml | File not in `Assets/` root or XML syntax error | Verify path + do a clean build |
| Works in Editor, fails on device | Mono vs IL2CPP difference | Add Link.xml or lower stripping |

---

## Best Practices

1. Dev: Stripping = "Low" (fastest iteration)
2. Staging: Stripping = "Medium", test ZString on device
3. Production: "High" + Link.xml (best size) or "Medium" (simplest)
4. Always commit `Assets/link.xml` — it is part of the build config
