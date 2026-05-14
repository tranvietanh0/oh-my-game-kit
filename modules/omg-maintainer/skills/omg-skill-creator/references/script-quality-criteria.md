---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-maintainer
protected: true
---
# Script Quality Criteria

Scripts provide deterministic reliability and token efficiency.

## When to Include Scripts

- Same code rewritten repeatedly
- Deterministic operations needed
- Complex transformations
- External tool integrations

## Cross-Platform Requirements

**Prefer:** Node.js or Python
**Avoid:** Bash scripts (not well-supported on Windows)

If bash required, provide Node.js/Python alternative.

## Testing Requirements

**Mandatory:** All scripts must have tests

```bash
# Run tests before packaging
python -m pytest scripts/tests/
# or
npm test
```

Tests must pass. No skipping failed tests.

## Environment Variables

Respect hierarchy (first found wins):

1. `process.env` (runtime)
2. `$HOME/.agents/skills/<skill-name>/.env` (skill-specific)
3. `$HOME/.agents/skills/.env` (shared skills)
4. `$HOME/.agents/.env` (global)
5. `$HOME/.agents/skills/${SKILL}/.env` (cwd)
6. `$HOME/.agents/skills/.env` (cwd)
7. `$HOME/.agents/.env` (cwd)

**Implementation pattern (Python):**

```python
from dotenv import load_dotenv
import os

# Load in reverse order (last loaded wins if not set)
load_dotenv('$HOME/.agents/.env')
load_dotenv('$HOME/.agents/skills/.env')
load_dotenv('$HOME/.agents/skills/my-skill/.env')
load_dotenv('$HOME/.agents/skills/my-skill/.env')
load_dotenv('$HOME/.agents/skills/.env')
load_dotenv('$HOME/.agents/.env')
# process.env already takes precedence
```

## Documentation Requirements

### .env.example
Show required variables without values:

```
API_KEY=
DATABASE_URL=
DEBUG=false
```

### requirements.txt (Python)
Pin major versions:

```
requests>=2.28.0
python-dotenv>=1.0.0
```

### package.json (Node.js)
Include scripts:

```json
{
  "scripts": {
    "test": "jest"
  }
}
```

## Manual Testing

Before packaging, test with real use cases:

```bash
# Example: PDF rotation script
python scripts/rotate_pdf.py input.pdf 90 output.pdf
```

Verify output matches expectations.

## Error Handling

- Clear error messages
- Graceful failures
- No silent errors
- Exit codes: 0 success, non-zero failure

## Gotchas

### Never write `*/X` inside a JSDoc block comment

JavaScript's tokenizer treats the first `*/` it finds as end-of-block-comment, so any character that looks like a glob path inside a `/** ... */` block will silently close the comment and turn everything after into code — producing a `SyntaxError` when `node` tries to load the file.

**Wrong** (comment closes at line 2, rest becomes code):
```js
/**
 * Scans `.agents/modules/*/module.json` and reports ...
 */
```

**Right** — use a placeholder with no `*/` sequence:
```js
/**
 * Scans `.agents/modules/<name>/module.json` and reports ...
 */
```

CI defence: `validate-post-inject-syntax.cjs` runs `node --check` on every `.cjs`/`.js`/`.mjs` under `.agents/hooks/` and `.agents/skills/` — it will fail PRs that reintroduce this pattern. Local check before commit:

```bash
node -c path/to/your-script.cjs
```

**Bug trail:** first shipped to `main` in `check-module-detect-coverage.cjs` (2026-04-18), fixed in oh-my-game-kit-core#31. CI gate extended in oh-my-game-kit-release-action#6.

