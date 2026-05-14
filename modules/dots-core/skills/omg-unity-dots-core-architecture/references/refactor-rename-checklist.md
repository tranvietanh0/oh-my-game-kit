---
origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: dots-core
protected: false
---
# Refactor / Rename a Library Symbol — Pre-Delete Checklist

Apply this checklist before deleting, renaming, moving, or changing visibility of ANY public type, method, namespace, asmdef, or directory in a consumed DOTS library package (commonly vendored as a git submodule, e.g. `Packages/unity-dots-library/`).

The cost of skipping any step is hours of follow-up rework — usually weeks later when a different demo trips on the missing symbol and the original author has lost the context.

---

## Why this exists

Two real incident classes motivate this checklist:

1. **Library audit + consumer-update in one commit, submodule never pulled.** A library audit commit adds new utility helpers (e.g., `SceneSetupUtility` partials, `PuzzleInputUtility` extensions, `SubsceneBypassBootstrap<T>`) AND updates downstream demos to use them — all in one commit. If the consumer project's submodule pointer is stale, ~30 console errors look like API drift; root cause is unfetched commits. See `dots-rpg` skill → "Submodule Sync".
2. **Runtime → Tests asmdef relocation.** A runtime helper (e.g., a PlayMode test runner extended by a demo bootstrap) is moved from `Runtime/Testing/` to `Tests/PlayMode/` (with `UNITY_INCLUDE_TESTS` define constraint). The demo's MonoBehaviour subclass was Runtime — move breaks Runtime visibility; demo's scene component becomes unresolvable.

Both classes would have been caught by step 2 below.

---

## The checklist

### 1. Grep both halves of the workspace

```bash
grep -rn "SymbolName" Packages/ Assets/ --include="*.cs"
```

If ANY hit appears in `Assets/**` or in another consumer package, you are about to break a consumer. Do NOT proceed without addressing it.

### 2. Understand the asmdef visibility of the source AND destination

| Source asmdef | Destination asmdef | Risk |
|---|---|---|
| Runtime → Runtime | low — same visibility |
| Runtime → Tests/PlayMode (with `UNITY_INCLUDE_TESTS`) | **HIGH** — Runtime consumers break at Player runtime, NOT at editor compile time |
| Runtime → Editor | breaks Runtime usage entirely |
| Editor → Runtime | usually safe, but verify the editor-only API is actually safe to call at runtime |
| Package A → Package B | every consumer asmdef must add the new package reference |

Always verify the destination asmdef can be referenced by every existing consumer.

### 3. Migrate every caller in the SAME commit as the rename

Never do "rename now, migrate later." Same-commit migration is the ONLY way the build stays green continuously, and the ONLY way `git revert` can undo the rename cleanly.

If the migration is too large for one commit, split the rename itself across multiple stages: first add the new symbol AS AN ADDITION (old + new coexist), migrate consumers, then delete the old symbol. Three commits, build green at every step.

### 4. Check namespace continuity

If only the file moves but the namespace stays, callers' `using X;` statements still work. If BOTH file AND namespace change, every caller's `using` is now broken — verify the consumer migration covers them.

### 5. Run Unity MCP `read_console` BEFORE pushing the rename commit

```
refresh_unity(mode="force", scope="all", compile="request", wait_for_ready=true)
read_console(types=["error"])
```

Zero new errors required. Pre-existing errors documented separately.

### 6. Submodule pointer drift downstream

If the rename lands in a library that consumer projects vendor as `git submodule add`, every consumer must `git pull` the submodule to receive the change. Document it in the commit message:

```
BREAKING: SymbolFoo moved to Bar.Baz.Foo. Consumers must:
  cd Packages/unity-dots-library && git pull origin main
```

A pre-push hook can prevent pushing the parent repo while the submodule is dirty/unpushed — but that protects the OUTBOUND direction only, not the inbound (consumer pulling). The commit message is the inbound signal.

### 7. Special cases

- **Partial classes** — `[BurstCompile]` and similar `AllowMultiple = false` attributes can only be declared on ONE partial declaration of the class. If you split a class across N partials, put the attribute on exactly one (preferably the canonical original), not all N. Multiple partials with the same attribute → `CS0579: Duplicate 'BurstCompile' attribute`.
- **Generic systems** — Renaming a generic ISystem can produce Burst entry-point warnings if the new generic isn't instantiated with concrete types anywhere. Verify with `read_console` after rename.
- **Authoring + Baker pairs** — If you rename one, rename the matching one. Baker scripts compile under the same asmdef as their authoring; missing one breaks bake.

---

## Self-test

Before declaring a rename done, answer YES to all:

- [ ] `grep -rn "OldName" Packages/ Assets/` returns zero matches (or only matches in your migration commit)
- [ ] Unity MCP `read_console` returns zero new errors
- [ ] If the rename crossed asmdef boundaries, every consumer asmdef has been updated
- [ ] If the rename moved code from Runtime to Tests/PlayMode, no Runtime caller exists
- [ ] Commit message documents the breaking change for downstream consumers

If any answer is "no", do not push.

---

## Related

- `dots-rpg` skill → "Submodule Sync" — first hypothesis when console reports missing library symbols
- `~/.agents/rules/development-principles.md` → "Pre-Delete Reference Check" — the global rule this checklist operationalizes
- A CI gate that scans `Assets/**` (consumer code) for orphan references to library symbols can automate step 1
