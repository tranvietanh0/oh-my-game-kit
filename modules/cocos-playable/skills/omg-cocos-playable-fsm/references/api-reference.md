---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# StateManager — API Reference

## Architecture

```
StateManager (singleton)
├── states: Map<StateConstructor, IState>
├── statesByName: Map<string, IState>
├── currentState: IState | null
└── previousState: IState | null

IState interface:
  onEnter(): void | Promise<void>   ← required
  onUpdate?(deltaTime: number): void ← optional
  onExit(): void | Promise<void>    ← required

BaseState: abstract class implementing IState with empty async stubs
```

Transition sequence: `currentState.onExit()` → set new current → `newState.onEnter()`

## Key APIs

```typescript
const sm = StateManager.getInstance();

// Register manually (only needed without @State decorator)
sm.registerState(LoadingState);
sm.registerState(GameplayState, existingInstance);

// Transition (async — awaits onExit + onEnter)
await sm.changeState(GameplayState);

// Query
sm.getCurrentStateName();     // "GameplayState" | null
sm.getPreviousStateName();    // "LoadingState" | null
sm.hasState(GameplayState);   // boolean
sm.getState(GameplayState);   // GameplayState instance | undefined
sm.getRegisteredStates();     // string[]

// Drive onUpdate (call from a ITickable or Component.update())
sm.update(deltaTime);

// Legacy string API (avoid — use class constructors)
await sm.changeStateByName("GameplayState");

// Reset without transition (scene reload safety)
sm.reset();
```

## Decorator Registration

`@State` instantiates the class and calls `registerState()` immediately when the module is imported. Import all state files before the first `changeState()` call.

```typescript
import { State } from "db://assets/PLAGameFoundation/StateMachine/StateDecorator";
import { BaseState } from "db://assets/PLAGameFoundation/StateMachine/IState";

@State
export class LoadingState extends BaseState {
    async onEnter(): Promise<void> {
        // load assets, show loading screen
    }
    async onExit(): Promise<void> {
        // hide loading screen
    }
}
```
