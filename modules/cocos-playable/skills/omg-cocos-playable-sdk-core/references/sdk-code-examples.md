---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# SDK Code Examples

## BaseSdkAdapter Pattern

```typescript
// File: assets/PlayableParamterTool/sdk/core/BaseSdkAdapter.ts
export abstract class BaseSdkAdapter {
    protected abstract getWindowPlayableName(): string;
    protected abstract getWindowSdkName(): string;

    private parameterUpdateListeners: Set<ParameterUpdatedCallback> = new Set();
    private isReady: boolean = false;

    public get sdk(): PlayableMainSdk {
        return (window as any)[this.getWindowSdkName()] || this.getDefaultSdk();
    }

    public get playable(): Playable {
        return (window as any)[this.getWindowPlayableName()] || this.getDefaultPlayable();
    }

    public subscribeToParameterUpdates(callback): () => void {
        this.parameterUpdateListeners.add(callback);
        return () => this.unsubscribeFromParameterUpdates(callback);
    }

    public initializeParameterHooks(): void {
        const checkInterval = setInterval(() => {
            if (!this.isPlayableInitialized()) return;
            this.setupParameterUpdateHook();
            this.setupAudioUpdateHook();
            this.isReady = true;
            clearInterval(checkInterval);
        }, 100);
    }

    public WaitForPlayableReady(): Promise<void> {
        return new Promise((resolve) => {
            if (this.isReady) { resolve(); return; }
            const checkInterval = setInterval(() => {
                if (this.isReady) { clearInterval(checkInterval); resolve(); }
            }, 50);
        });
    }
}
```

## Creating a New SDK Adapter

```typescript
// File: assets/PlayableParamterTool/sdk/mynewsdk/index.ts
import { BaseSdkAdapter } from "../core/BaseSdkAdapter";

export class MyNewSdk extends BaseSdkAdapter {
    private static _instance: MyNewSdk = null;

    public static getInstance(): MyNewSdk {
        if (!this._instance) this._instance = new MyNewSdk();
        return this._instance;
    }

    protected getWindowPlayableName(): string { return "mainMyNewPlayable"; }
    protected getWindowSdkName(): string { return "mainMyNewSdk"; }
}
```

## SdkFactory Registration

```typescript
// File: assets/PlayableParamterTool/sdk/SdkFactory.ts
export class SdkFactory {
    public static createSdk(sdkType: SdkType): BaseSdkAdapter {
        const sdkAdapter = this.getSdkInstance(sdkType);
        switch (sdkType) {
            case SdkType.VOODOO:
                (window as any).mainPlayable = sdkAdapter.playable;
                (window as any).mainVsdk = sdkAdapter.sdk;
                break;
            case SdkType.THE_ONE:
                (window as any).mainTheOnePlayable = sdkAdapter.playable;
                (window as any).mainTheOneSdk = sdkAdapter.sdk;
                break;
        }
        return sdkAdapter;
    }

    private static getSdkInstance(sdkType: SdkType): BaseSdkAdapter {
        switch (sdkType) {
            case SdkType.VOODOO: return Vsdk.getInstance();
            case SdkType.THE_ONE: return TheOneSdk.getInstance();
        }
    }
}
```

## CTAService Routing

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
| `assets/PlayableParamterTool/GameConfig.ts` | SdkType enum |
| `assets/PlayableParamterTool/sdk/core/BaseSdkAdapter.ts` | Abstract base |
| `assets/PlayableParamterTool/sdk/core/Playable.d.ts` | Playable interface |
| `assets/PlayableParamterTool/sdk/core/PlayableMainSdk.d.ts` | SDK API interface |
| `assets/PlayableParamterTool/sdk/SdkFactory.ts` | Factory |
| `assets/PlayableParamterTool/sdk/theone/index.ts` | TheOne adapter |
| `assets/PlayableParamterTool/sdk/voodoo/index.ts` | Voodoo adapter |
| `assets/PlayableParamterTool/PlayableParameterUpdates.ts` | Param sync + signals |
| `assets/scripts/services/cta/CTAService.ts` | CTA routing |
| `assets/scripts/parameter/ParameterManager.ts` | DI for SDK + store links |
