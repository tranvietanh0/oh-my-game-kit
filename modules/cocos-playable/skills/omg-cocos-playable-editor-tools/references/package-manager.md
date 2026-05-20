---

origin: oh-my-game-kit-cocos
repository: The1Studio/oh-my-game-kit-cocos
module: playable
protected: false
---
# Package Manager Extension — Reference

Location: `extensions/package-manager/`
Registry: `https://cpm.playablelabs.studio` (CPM — Cocos Package Manager by PlayableLabs)
Panel: opened via `Editor.Panel.open('package-manager')`

## Architecture

```
main.ts (extension entry)
├── CpmApiService  — fetches package list from CPM registry REST API
├── NpmService     — spawns npm CLI as child_process (install/uninstall/login/whoami)
└── SyncService    — copies node_modules/{pkg} → assets/packages/{pkg}
                     tracks synced packages in package.json["playableSync"]
```

## NpmService Key Operations

```typescript
// All run npm in CWD = Editor.Project.path
npmService.install(packageName)       // npm install {name} --no-save
npmService.uninstall(packageName)     // npm uninstall {name} --no-save
npmService.getInstalledPackages()     // npm list --json --depth=0
npmService.checkAuthStatus()          // npm whoami --registry {CPM_REGISTRY}
npmService.login()                    // opens terminal for interactive npm login
npmService.logout()                   // npm logout --scope=@playablelabs
```

## SyncService — node_modules → assets/packages

```typescript
// Copies package into assets so Cocos db:// can reference it
syncService.syncPackage('@playablelabs/my-pkg')
// → copies node_modules/@playablelabs/my-pkg → assets/packages/@playablelabs/my-pkg
// → adds to package.json["playableSync"] array
// → sends Editor.Message 'asset-db' 'refresh-asset'

syncService.removePackage(name)       // removes from assets/packages + playableSync
syncService.syncAll()                 // re-syncs all entries in playableSync
syncService.getSyncedPackages()       // reads package.json["playableSync"]
```

## Auth Token Location

Token stored in `~/.npmrc` under key:
```
//cpm.playablelabs.studio/:_authToken={token}
```
`getAuthToken()` in main.ts reads this file directly.
