---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# StateManager — Workflow Examples

## Typical Playable Ad Flow

```
Entry → Loading → FTUE → Gameplay → Win/Lose → CTA
```

| State | Responsibility |
|---|---|
| `EntryState` | Basic init, fire first signal |
| `LoadingState` | Wait for `AllAsyncParametersReadySignal`, show progress bar |
| `FTUEState` | Show tutorial overlay, wait for first tap |
| `GameplayState` | Main loop, subscribe input signals |
| `WinState` / `LoseState` | End card, play audio, show CTA |

## Define and register a state

```typescript
@State
export class GameplayState extends BaseState {
    private _unsub: (() => void)[] = [];

    async onEnter(): Promise<void> {
        this._unsub.push(
            SignalBus.instance.subscribe(TapSignal, this.onTap.bind(this))
        );
    }

    onUpdate(deltaTime: number): void {
        // runs via sm.update(deltaTime) each frame
    }

    async onExit(): Promise<void> {
        this._unsub.forEach(fn => fn());
        this._unsub = [];
    }

    private onTap(s: TapSignal): void {
        StateManager.getInstance().changeState(WinState);
    }
}
```

## Trigger transition from any class

```typescript
import { StateManager } from "db://assets/PLAGameFoundation/StateMachine/StateManager";
import { WinState } from "./states/WinState";

await StateManager.getInstance().changeState(WinState);
```

## Drive update from GameView (ITickable)

```typescript
// In GameView registered with @RegisterLifecycle:
onUpdate(deltaTime: number): void {
    StateManager.getInstance().update(deltaTime);
}
```
