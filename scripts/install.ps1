param(
  [string]$Repo = $env:OMG_REPO,
  [string]$Ref = $env:OMG_REF,
  [string]$Target = "global",
  [string]$Preset = $env:OMG_PRESET,
  [string]$Engine = $env:OMG_ENGINE,
  [switch]$Fresh,
  [switch]$Force,
  [switch]$NoAgents,
  [switch]$DualRoots
)

$ErrorActionPreference = "Stop"

if (-not $Repo) { $Repo = "tranvietanh0/oh-my-game-kit" }
if (-not $Ref) { $Ref = "release" }

function Resolve-EnginePreset {
  param([string]$SelectedEngine)
  switch ($SelectedEngine.ToLowerInvariant()) {
    "unity" { return "unity-production" }
    "cocos" { return "cocos-playable" }
    "all" { return "full" }
    default { throw "Unknown OMG_ENGINE '$SelectedEngine'. Use unity, cocos, or all." }
  }
}

if (-not $Preset) {
  if (-not $Engine) {
    if (-not [Environment]::UserInteractive) {
      throw "Set OMG_ENGINE=unity, OMG_ENGINE=cocos, or OMG_ENGINE=all for non-interactive installs."
    }
    Write-Host "Choose Oh My Game Kit engine:"
    Write-Host "  1) Unity"
    Write-Host "  2) Cocos"
    Write-Host "  3) Both"
    $Choice = Read-Host "Engine [1-3]"
    switch ($Choice) {
      "1" { $Engine = "unity" }
      "2" { $Engine = "cocos" }
      "3" { $Engine = "all" }
      default { throw "Invalid engine choice '$Choice'. Use 1, 2, or 3." }
    }
  }
  $Preset = Resolve-EnginePreset $Engine
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  throw "Node.js 20+ is required. Install Node.js, then run this installer again."
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
  throw "npm is required. Install Node.js with npm, then run this installer again."
}

$NodeVersion = (& node -p "process.versions.node").Trim()
$NodeMajor = [int]($NodeVersion.Split(".")[0])
if ($NodeMajor -lt 20) {
  throw "Node.js 20+ is required. Current version: $NodeVersion"
}

$PackageSpec = "github:$Repo#$Ref"
$ArgsList = @("--yes", $PackageSpec, "install", "--target", $Target, "--preset", $Preset)
if ($Fresh -or $env:OMG_FRESH -ne "0") { $ArgsList += "--fresh" }
if ($Force -or $env:OMG_FORCE -eq "1") { $ArgsList += "--force" }
if ($NoAgents -or $env:OMG_NO_AGENTS -eq "1") { $ArgsList += "--no-agents" }
if ($DualRoots -or $env:OMG_DUAL_ROOTS -eq "1") { $ArgsList += "--dual-roots" }

Write-Host "Installing oh-my-game-kit from $PackageSpec"
npx @ArgsList
