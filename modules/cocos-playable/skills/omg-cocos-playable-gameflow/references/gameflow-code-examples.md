---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Game Flow Code Examples

## GameView (Singleton State Machine)

```typescript
// File: assets/scripts/UI/GameView.ts
@ccclass('GameView')
export class GameView extends Component {
    private static _instance: GameView = null;
    @property(Node) loadingView: Node = null;
    @property(Node) winView: Node = null;
    @property(Node) loseView: Node = null;
    @property(Node) ctaButton: Node = null;
    private currentState: GameState = GameState.GAMEPLAY;

    public static get instance(): GameView { return this._instance; }

    onLoad() {
        GameView._instance = this;
        this.hideAllViews();
        this.initializeCTA();
        this.startGameFlow();
    }

    private async startGameFlow(): Promise<void> {
        if (this.isLoading) await this.startLoading();
        this.startGameplay();
    }

    private async startLoading(): Promise<void> {
        return new Promise((resolve) => {
            this.currentState = GameState.LOADING;
            this.loadingView.active = true;
            const loadingComponent = this.loadingView.getComponent(LoadingView);
            loadingComponent?.startLoading(() => resolve());
        });
    }

    public onWin(): void {
        this.currentState = GameState.WIN;
        if (this.winView) this.winView.active = true;
    }

    public onLose(): void {
        this.currentState = GameState.LOSE;
        if (this.loseView) this.loseView.active = true;
    }
}
```

## EndCardView Pattern

```typescript
// File: assets/scripts/UI/EndCardView.ts
export abstract class EndCardView extends Component {
    @property(Node) actionButton: Node = null;

    protected onEnable(): void {
        AudioService.instance.playSFX(this.getAudioName());
        this.actionButton?.on(Node.EventType.TOUCH_END, this.onCTAClicked, this);
    }

    protected onDisable(): void {
        this.actionButton?.off(Node.EventType.TOUCH_END, this.onCTAClicked, this);
    }

    private onCTAClicked(): void {
        CTAService.instance?.handleCTAClick();
    }

    protected abstract getAudioName(): string;
}

// WinView
export class WinView extends EndCardView {
    protected getAudioName(): string { return Constant.AUDIO_NAME.WIN; }
}

// LoseView
export class LoseView extends EndCardView {
    protected getAudioName(): string { return Constant.AUDIO_NAME.LOSE; }
}
```

## CTA Integration

```typescript
// File: assets/scripts/services/cta/CTAService.ts
export class CTAService {
    private static _instance: CTAService = null;
    public static get instance(): CTAService {
        if (!this._instance) this._instance = new CTAService();
        return this._instance;
    }

    public handleCTAClick(): void {
        switch (CURRENT_SDK as SdkType) {
            case SdkType.THE_ONE:
                gameEndHandler.StoreGameChangingNoCondition();
                break;
            case SdkType.VOODOO:
                ParameterManager.redirect();
                break;
        }
    }
}
```

## Key Files

| File | Purpose |
|------|---------|
| `assets/scripts/UI/GameView.ts` | Game state machine (singleton) |
| `assets/scripts/UI/LoadingView.ts` | Loading screen + async wait |
| `assets/scripts/UI/EndCardView.ts` | Abstract end card base |
| `assets/scripts/UI/WinView.ts` | Win end card |
| `assets/scripts/UI/LoseView.ts` | Lose end card |
| `assets/scripts/UI/HighlightOverlay.ts` | UI highlighting |
| `assets/scripts/PlayableHelper.ts` | First touch + redirect-after-N |
| `assets/scripts/services/cta/CTAService.ts` | CTA routing |
| `assets/scripts/constant/constant.ts` | Audio names, store links |
| `assets/PLAGameFoundation/inputService/InputService.ts` | Input signals |
| `assets/PLAGameFoundation/gameControl/utilities/AudioSystem/AudioService.ts` | Audio singleton |
