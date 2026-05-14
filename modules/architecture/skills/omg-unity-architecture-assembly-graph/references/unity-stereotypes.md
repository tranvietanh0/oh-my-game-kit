---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-architecture
protected: false
---
# Unity Stereotypes Reference

Canonical detection rules for the Unity stereotype post-processor.
SSOT: these rules define what the post-processor scans for in .cs source files.

## Detection Rules

| Stereotype / Annotation | Detection (C# source) | Mermaid Output |
|---|---|---|
| `<<MonoBehaviour>>` | `class X : MonoBehaviour` (direct) or chain within asmdef | `class X { <<MonoBehaviour>> }` |
| `<<ScriptableObject>>` | `class X : ScriptableObject` | `class X { <<ScriptableObject>> }` |
| `{serialized}` | Field line with `[SerializeField]` attribute | field label appended `{serialized}` |
| `..> Y : requires` | `[RequireComponent(typeof(Y))]` on class X | `X ..> Y : requires` |
| `<<IComponentData>>` | `struct/class X : IComponentData` | `class X { <<IComponentData>> }` |
| `<<IBufferElementData>>` | `struct/class X : IBufferElementData` | `class X { <<IBufferElementData>> }` |
| `<<ISystem>>` | `struct/class X : ISystem` or `: ISystemStartStop` | `class X { <<ISystem>> }` |
| `<<IAspect>>` | `struct/class X : IAspect` | `class X { <<IAspect>> }` |
| `{asset}` note | `[CreateAssetMenu]` attribute on class X | note appended in class block |
| `executes in edit mode` note | `[ExecuteAlways]` or `[ExecuteInEditMode]` | note appended in class block |

## Regex Patterns

All regexes are defined in `lib/unity-stereotype-postprocessor.cjs`.

### MonoBehaviour
```
/\bclass\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bMonoBehaviour\b/g
```

### ScriptableObject
```
/\bclass\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bScriptableObject\b/g
```

### IComponentData
```
/\b(?:class|struct)\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bIComponentData\b/g
```

### ISystem / ISystemStartStop
```
/\b(?:class|struct)\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bISystem(?:StartStop)?\b/g
```

### IAspect
```
/\b(?:class|struct)\s+(\w+)\s*(?:<[^>]*>)?\s*:[^{]*\bIAspect\b/g
```

### [SerializeField]
```
/\[SerializeField[^\]]*\]\s*(?:\/\/[^\n]*)?\n?\s*(?:private|protected|internal|public)?\s+\w+(?:<[^>]*>)?\s+(\w+)/g
```

### [RequireComponent(typeof(X))]
```
/\[RequireComponent\s*\(\s*typeof\s*\(\s*(\w+)\s*\)\s*\)\s*\]\s*(?:\/\/[^\n]*)?\n?\s*(?:public\s+)?class\s+(\w+)/g
```

### [CreateAssetMenu]
```
/\[CreateAssetMenu[^\]]*\]\s*(?:\/\/[^\n]*)?\n\s*(?:public\s+)?class\s+(\w+)/g
```

## Known Limitations

1. **No cross-file inheritance chain** — `class X : BaseMonoBehaviour` where `BaseMonoBehaviour : MonoBehaviour`
   is in another file will NOT be detected. Only direct single-level inheritance is matched.
   Workaround: Scan for `class X :` and check if parent is in the stereotype list. Not implemented in v1.

2. **Regex false positives** — `class XNotReallyMonoBehaviour` will NOT match due to word-boundary `\b`.
   `class X : SomeNamespace.MonoBehaviour` WILL match (`.MonoBehaviour` also matched by `\bMonoBehaviour\b`).

3. **Conditional compilation** — `#if UNITY_EDITOR class X : MonoBehaviour` will match, even if
   the conditional is inactive. Documented limitation — does not affect runtime correctness.

4. **Association scope** — `[SerializeField]` detection associates fields with the first class in the file
   (heuristic). Multi-class files may see fields on the wrong class. Rare in well-organized Unity projects.

## Fallback to PlantUmlClassDiagramGenerator

If Cs2Mermaid becomes unavailable (CVE, archive, NuGet takedown, maintainer abandonment):

**Trigger conditions:**
- A published CVE against Cs2Mermaid
- Repository archived or last commit > 12 months old
- Package pulled from NuGet.org
- Maintainer responds "abandoned" to a filed issue

**Switching cost:** Update `install.json` (change package from `Cs2Mermaid` to `PlantUmlClassDiagramGenerator`)
and update `lib/cs2mermaid-wrapper.cjs` invocation (command: `puml-gen -i . -o .`).
The post-processor regex patterns remain the same — they scan .cs source, not Mermaid output.
