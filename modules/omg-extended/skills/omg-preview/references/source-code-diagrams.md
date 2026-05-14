---
origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---
# Source Code Diagram Generation

Per-language workflows for generating diagrams from source code without an engine adapter.
For engine-specific workflows (Unity, Cocos, RN, Web), see the relevant adapter.
To pipe pre-generated output directly, see §"Using `--from-file`" at the bottom.

---

## TypeScript / JavaScript

### dependency-cruiser — module dependency graph (recommended)

Install: `npm install --save-dev dependency-cruiser`

```bash
# Mermaid output (GitHub-native)
npx depcruise src --include-only "^src" --output-type mermaid --output-to graph.mmd
# DOT → SVG
npx depcruise src --output-type dot | dot -T svg > graph.svg
# Detect circular dependencies
npx depcruise src --output-type err-long
```

Output: Mermaid flowchart or Graphviz DOT.
Limitations: module-level only — no class introspection. Monorepo cross-package edges need workspace config.

### ts-morph — class diagrams (recommended for class-level analysis)

Install: `npm install --save-dev ts-morph`
No built-in renderer — outputs feed to Mermaid/DOT via a short glue script (~50 lines).

```js
import { Project } from 'ts-morph';
const project = new Project({ tsConfigFilePath: 'tsconfig.json' });
const lines = ['classDiagram'];
project.getSourceFiles().flatMap(f => f.getClasses()).forEach(cls => {
  const name = cls.getName();
  const parent = cls.getExtends()?.getText();
  if (parent) lines.push(`  ${name} --|> ${parent}`);
});
console.log(lines.join('\n'));
```

Limitations: slower on large codebases in full type-check mode; generic parameters may show as `T`.

### TsUML2 — ready-made class diagram

Install: `npm install --save-dev tsuml2`

```bash
npx tsuml2 src --output mermaid > class-diagram.mmd
npx tsuml2 src --output svg > class-diagram.svg
```

Limitations: less customizable than ts-morph; decorator introspection is partial.

---

## Python

### pyreverse (bundled with pylint)

```bash
pip install pylint
pyreverse -o dot -p MyProject src/
dot -T svg classes_MyProject.dot > classes.svg
```

Limitations: requires importable Python env; dynamic classes and metaclasses are invisible.

### pydeps — module-level graph

```bash
pip install pydeps
pydeps mypackage --noshow --max-bacon 2 -o deps.svg
```

Use `--max-bacon 2-3` for large projects to limit depth.

---

## Go

### go mod graph (built-in)

```bash
# No install needed
go mod graph

# Render via modgraphviz
go install golang.org/x/exp/cmd/modgraphviz@latest
go mod graph | modgraphviz | dot -T svg > deps.svg
```

Limitation: module-level only (not package-level within modules).

### godepgraph — package-level graph

```bash
go install github.com/kisielk/godepgraph@latest
godepgraph -nostdlib ./... | dot -T svg > pkgdeps.svg
```

---

## Rust

### cargo-modules

```bash
cargo install cargo-modules
cargo modules structure               # text tree
cargo modules dependencies | dot -T svg > deps.svg
```

---

## Java

### jdeps (JDK built-in — requires compiled classes)

```bash
javac -d target/classes src/**/*.java
jdeps -dotoutput ./dot-output target/classes/
for f in dot-output/*.dot; do dot -T svg "$f" > "${f%.dot}.svg"; done
```

Limitation: requires compiled bytecode; suppress warnings with `--ignore-missing-deps`.

---

## C# (non-Unity)

### Cs2Mermaid

```bash
dotnet tool install -g Cs2Mermaid
cs2mmd -i ./src -o class-diagram.mmd
```

Output: Mermaid `classDiagram`. For Unity-specific setup with `asmdef` scoping, see the Unity adapter.
Limitation: syntactic analysis only — no cross-file type resolution.

---

## Using `--from-file` to pipe pre-generated output

```bash
omg-preview --from-file ./graph.mmd          # Mermaid
omg-preview --from-file ./dep-graph.dot      # DOT (auto-detected)
omg-preview --from-file ./classes.puml       # PlantUML
```

Auto-detection by extension: `.mmd` → Mermaid | `.puml`/`.plantuml`/`.pu` → PlantUML | `.dot`/`.gv` → DOT | `.d2` → D2.
Override with `--syntax <name>` if auto-detection is wrong.
