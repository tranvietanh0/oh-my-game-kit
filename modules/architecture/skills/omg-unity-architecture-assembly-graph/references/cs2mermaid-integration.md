---

origin: oh-my-game-kit-unity
repository: The1Studio/oh-my-game-kit-unity
module: unity-architecture
protected: false
---
# Cs2Mermaid Integration

## Overview

`unity-assembly-graph` wraps the [Cs2Mermaid](https://github.com/itn3000/Cs2Mermaid) CLI tool
to generate class diagrams from C# source files. Each `.asmdef` is processed independently
to avoid the 10K-class explosion problem (200 asmdefs x 50 classes each = manageable per-file diagrams).

## Installation

```bash
# Requires .NET 8 SDK: https://dotnet.microsoft.com/download/dotnet/8.0
dotnet tool install -g Cs2Mermaid --version 0.6.0
```

Verify: `cs2mmd --version`

## CLI Invocation

```bash
cs2mmd -i <input-dir> -o <output-file.mmd>
```

The `lib/cs2mermaid-wrapper.cjs` wrapper:
1. Collects `.cs` files under each asmdef's directory
2. Copies them to `os.tmpdir()omg-cs2mmd-{name}-{ts}/`
3. Invokes `cs2mmd -i <tmpDir> -o <tmpDir>/out.mmd`
4. Reads the output, strips Markdown fences if present
5. Passes output to `unity-stereotype-postprocessor.cjs`
6. Cleans up temp directory

## Parallelism

Uses a bounded worker pool: `Math.min(8, os.cpus().length)` concurrent processes.
Each asmdef has a 60-second timeout. On timeout, a warning notice is written for that
asmdef but other asmdefs continue.

## Performance Budget

| Project Size | Asmdefs | Estimated Time |
|---|---|---|
| Small | 1-5 | 5-30s |
| Medium | 5-20 | 30s-2m |
| Large | 20-100 | 2-5m (target soft budget) |
| Extra-large | 100+ | up to 8m (hard ceiling; warning emitted) |

## Security Review — v0.6.0

**Status:** Pinned at v0.6.0 per BLOCKER 4 mitigation (supply-chain risk).

Pre-adoption review checklist:
- [ ] Review GitHub source tree: https://github.com/itn3000/Cs2Mermaid
- [ ] Check open/closed issues for maintainer responsiveness
- [ ] Verify CI/tests are present in repo
- [ ] No published CVEs against package on NuGet.org

**Version bump policy:** Bumping `version` in `install.json` requires a Unity-kit PR
reviewed by the Unity kit maintainer. No auto-merge.

## Fallback to PlantUmlClassDiagramGenerator

If Cs2Mermaid becomes unavailable, the fallback is `PlantUmlClassDiagramGenerator`:

**Trigger conditions (any one):**
- Published CVE against Cs2Mermaid
- Repository archived or last commit > 12 months
- Package pulled from NuGet.org
- Maintainer declares abandonment

**Switching cost (bounded to two files):**

1. `install.json` — change `installSteps[0].package` from `"Cs2Mermaid"` to `"PlantUmlClassDiagramGenerator"`
   and `"verify"` from `"cs2mmd --version"` to `"puml-gen --version"`

2. `lib/cs2mermaid-wrapper.cjs` — change command from `cs2mmd -i <dir> -o <out.mmd>`
   to `puml-gen <dir> <outDir>` and update output file glob.

The stereotype post-processor (`lib/unity-stereotype-postprocessor.cjs`) is unchanged —
it scans `.cs` source files, not Mermaid output.

**Note:** PlantUML output requires GitHub Actions post-processing to render (PlantUML is not
natively rendered by GitHub). This is a known degradation — users lose instant GitHub rendering.
The fallback should be announced in a kit release note.

## Known Limitations

- **Syntactic analysis only** — no cross-file type resolution (~70% accuracy for method signatures)
- **No semantic accuracy** — generic type parameters, nullable types may be incomplete
- **Per-file scope** — the tool processes one directory at a time; inter-asmdef relationships
  are represented by the `modules` capability (assembly graph), not `classes`
