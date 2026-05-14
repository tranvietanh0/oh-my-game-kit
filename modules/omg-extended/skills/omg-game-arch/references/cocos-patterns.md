---

origin: oh-my-game-kit-core
repository: The1Studio/oh-my-game-kit-core
module: omg-extended
protected: true
---

# Cocos Patterns — Manual Composition Root + signalBus + Vitest + ESLint

This file **specializes** the universal principles for Cocos Creator (TS).
It does NOT introduce new universal principles — those live in
`principles.md`.

> Versions pinned at authoring time (2026-05-03):
> - Cocos Creator 3.8+
> - TypeScript 5.3+
> - Vitest 1.4+ (`vitest`, `@vitest/ui`)
> - eslint-plugin-import 2.29+

---

## Manual composition root (no decorator magic)

Cocos has no Unity-style asmdef. Composition is **manual** — one
`bootstrap.ts` (project root) or one `index.ts` per feature module wires
ports to adapters.

### Why manual instead of a DI library

- Cocos community uses plain TS — adding `inversify` / `tsyringe` brings
  decorator metadata + reflect-metadata polyfill cost.
- Manual root is ~30 lines per feature; explicit, debuggable, no magic.
- New devs read the file and understand the wiring in 30 seconds.

### Sample composition root

```ts
// assets/scripts/Game/modules/combat/index.ts
import { SignalBus } from 'Game/shared-kernel/signal-bus';
import { AttackUseCase } from './application/attack-use-case';
import type { IAnimationPlayer } from './application/ports/i-animation-player';
import type { IAudioCue } from './application/ports/i-audio-cue';
import type { ICombatHud } from './application/ports/i-combat-hud';
import { CcAnimationAdapter } from './infrastructure/cc-animation-adapter';
import { CcAudioAdapter } from './infrastructure/cc-audio-adapter';
import { CcCombatHud } from './infrastructure/cc-combat-hud';

export interface CombatModule {
    attackUseCase: AttackUseCase;
}

export function buildCombatModule(
    bus: SignalBus,
    deps: {
        equippedItemQuery: IEquippedItemQuery;  // from Inventory module
    },
): CombatModule {
    const animation: IAnimationPlayer = new CcAnimationAdapter();
    const audio:     IAudioCue        = new CcAudioAdapter();
    const hud:       ICombatHud       = new CcCombatHud();

    const useCase = new AttackUseCase(animation, audio, hud, deps.equippedItemQuery, bus);
    return { attackUseCase: useCase };
}
```

```ts
// assets/scripts/bootstrap.ts (app entry)
import { SignalBus } from './Game/shared-kernel/signal-bus';
import { buildInventoryModule } from './Game/modules/inventory';
import { buildCombatModule }    from './Game/modules/combat';

const bus = new SignalBus();

const inventory = buildInventoryModule(bus);
const combat    = buildCombatModule(bus, {
    equippedItemQuery: inventory.equippedItemQuery,
});

// expose to cc.Components via a singleton service-locator (read-only)
ServiceLocator.register('combat', combat);
```

`ServiceLocator` is a thin, read-only registry. `cc.Component` subclasses
read services on `start()`; they never construct concretes themselves.

---

## signalBus — the event bus

A minimal event bus, ESM-native, no library required:

```ts
// assets/scripts/Game/shared-kernel/signal-bus.ts
type Handler<T> = (payload: T) => void;

export class SignalBus {
    private handlers = new Map<string, Set<Handler<unknown>>>();

    on<T>(event: string, handler: Handler<T>): () => void {
        if (!this.handlers.has(event)) this.handlers.set(event, new Set());
        const set = this.handlers.get(event)!;
        set.add(handler as Handler<unknown>);
        return () => set.delete(handler as Handler<unknown>);  // unsubscribe
    }

    emit<T>(event: string, payload: T): void {
        const set = this.handlers.get(event);
        if (!set) return;
        for (const h of set) (h as Handler<T>)(payload);
    }
}
```

Application use cases emit; subscribers (Application listeners or
Presentation `cc.Component`s) register handlers.

```ts
// Combat application
this.bus.emit('DamageDealt', { targetId, amount });

// Quest application
const off = bus.on<DamageDealt>('DamageDealt', (e) => questTracker.recordDamage(e));
// off() to unsubscribe (call in onDestroy of cc.Component if subscribing there)
```

---

## eslint-plugin-import `no-restricted-paths` — enforce dependency rule

Cocos has no asmdef equivalent. Dependency rule is enforced at lint time.
Sample `eslint.config.js` block (paste-runnable, ESLint 9 flat config):

```js
// eslint.config.js
import importPlugin from 'eslint-plugin-import';

export default [
    {
        files: ['assets/scripts/**/*.ts'],
        plugins: { import: importPlugin },
        rules: {
            'import/no-restricted-paths': ['error', {
                zones: [
                    // Domain MUST NOT import cc.* or any other module
                    {
                        target: './assets/scripts/Game/modules/*/domain/**',
                        from:   './assets/scripts',
                        except: ['./Game/shared-kernel/**'],
                        message: 'Domain layer is engine-free. Use a port or a shared-kernel value type.',
                    },
                    // Application MUST NOT import cc.* OR another module's internals
                    {
                        target: './assets/scripts/Game/modules/*/application/**',
                        from:   './assets/scripts',
                        except: [
                            './Game/shared-kernel/**',
                            // ports declared by other modules are allowed (interfaces only)
                            './Game/modules/*/application/ports/**',
                            // own module
                            './Game/modules/*/domain/**',
                            './Game/modules/*/application/**',
                        ],
                        message: 'Application may import its own Domain + ports + shared-kernel only.',
                    },
                    // Cross-module direct concrete imports are forbidden
                    {
                        target: './assets/scripts/Game/modules/*/!(application/ports)/**',
                        from:   './assets/scripts/Game/modules',
                        except: ['./*/application/ports/**'],
                        message: 'Cross-module imports must go through application/ports/ (interfaces). See module-contract.md.',
                    },
                ],
            }],
        },
    },
];
```

Run via `eslint assets/scripts/`. CI step blocks merges that violate.

**Test the config:** create a deliberate violation in a feature branch and
confirm `eslint` exits with a non-zero status. Without verification, the
config is aspirational.

---

## Vitest setup

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
    test: {
        environment: 'node',                     // pure Domain/Application; no DOM
        include: ['assets/scripts/**/*.test.ts'],
        globals: false,
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: [
                'assets/scripts/Game/modules/**/domain/**',
                'assets/scripts/Game/modules/**/application/**',
            ],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 85,
                statements: 90,
            },
        },
    },
    resolve: {
        alias: {
            // Mirror tsconfig "paths"; no cc.* alias here — Domain shouldn't see it
            'Game': path.resolve(__dirname, 'assets/scripts/Game'),
        },
    },
});
```

Run via `vitest` (watch) or `vitest run` (single pass).

### Sample Domain test

```ts
// assets/scripts/Game/modules/combat/domain/damage-calculator.test.ts
import { describe, it, expect } from 'vitest';
import { DamageCalculator, CombatRules } from './damage-calculator';

describe('DamageCalculator', () => {
    it('should_returnZero_when_targetIsImmune', () => {
        const calc = new DamageCalculator(new CombatRules());
        const r = calc.compute({ attackerLevel: 10, target: { immune: true }, kind: 'slash' });
        expect(r.ok).toBe(true);
        if (r.ok) expect(r.value.actualDamage).toBe(0);
    });
});
```

### Sample Application test (mocked port)

```ts
// attack-use-case.test.ts
import { describe, it, expect, vi } from 'vitest';
import { AttackUseCase } from './attack-use-case';
import { SignalBus } from 'Game/shared-kernel/signal-bus';

describe('AttackUseCase', () => {
    it('should_emitDamageDealt_when_attackSucceeds', () => {
        const bus = new SignalBus();
        const emit = vi.spyOn(bus, 'emit');

        const uc = new AttackUseCase(
            { play: vi.fn(), stop: vi.fn() },                 // IAnimationPlayer mock
            { play: vi.fn() },                                // IAudioCue mock
            { showFloatingText: vi.fn(), shake: vi.fn() },    // ICombatHud mock
            { isEquipped: () => true, getEquippedDamage: () => 5 },  // IEquippedItemQuery fake
            bus,
        );

        const r = uc.execute({ attackerId: 'p1', targetId: 'e1', attackKind: 'slash' });

        expect(r.ok).toBe(true);
        expect(emit).toHaveBeenCalledWith('DamageDealt', expect.objectContaining({ targetId: 'e1' }));
    });
});
```

---

## Common Cocos gotchas

| Gotcha | Fix |
|---|---|
| `cc.Component` constructs concrete `CcAudioAdapter` directly | Read from `ServiceLocator` in `start()`; never `new` an adapter inside `cc.Component` |
| Domain `.ts` accidentally imports `cc` | `eslint-plugin-import` `no-restricted-paths` catches; if missing, add it now |
| `signalBus.on()` leaks subscriptions on scene change | Always store the unsubscribe fn returned by `on()`; call it in `onDestroy()` |
| Vitest `environment: 'jsdom'` pulls in DOM | Use `environment: 'node'` for Domain/Application; no DOM APIs in pure logic |
| Bootstrap creates the world but Cocos `cc.director` runs scene before bootstrap | Call `bootstrap()` in the first scene's `onLoad` (root `cc.Component`) before any other `start()` |

---

## Universal principles this file specializes

- `principles.md` § "The 4 layers" → Cocos directory shape + ESLint enforcement
- `principles.md` § "Dependency injection" → manual composition root in `index.ts`
- `inter-module-communication.md` § "Event" → `SignalBus`
- `inter-module-communication.md` § "Forbidden" → `eslint-plugin-import` `no-restricted-paths`
- `testing-strategy.md` § "Domain 100%" → Vitest in `node` environment
- `testing-strategy.md` § "Mock vs fake" → `vi.fn()` for mocks, in-memory class for fakes

---

## Related

- `unity-patterns.md` — parallel for Unity (asmdef + VContainer + NUnit)
- `module-templates.md` — ready-to-paste Cocos scaffold including bootstrap stub
- `refactor-playbook.md` — Combat-feature Cocos diff for each of the 7 stages
