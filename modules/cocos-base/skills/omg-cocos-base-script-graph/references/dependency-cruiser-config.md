---
origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: base
protected: false
---

# Dependency-Cruiser Config for Cocos Projects

**Status:** spec for v1.1.0 (not implemented in v1.0.0 MVP — capability stub emits `capabilities_skipped: ["modules"]`).

## Invocation

The adapter uses a local-only invocation — the user installs `dependency-cruiser` per project:

```
npm i --save-dev dependency-cruiser
npx --no-install depcruise --output-type mermaid assets/scripts > modules.md
```

## Recommended `.dependency-cruiser.cjs`

```js
module.exports = {
  options: {
    doNotFollow: { path: 'node_modules' },
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    }
  },
  forbidden: [
    {
      name: 'no-circular',
      severity: 'warn',
      comment: 'Circular dependencies complicate Cocos Creator hot reload',
      from: {},
      to: { circular: true }
    }
  ]
};
```

## Notes

- Cocos Creator projects typically keep TypeScript source under `assets/scripts/` — adjust the source root as needed.
- Generated Cocos runtime stubs (under `library/` or `temp/`) are skipped by `detect.cjs` SKIP_DIRS.
- The adapter reads the user's config if present; otherwise falls back to the in-memory defaults above.
