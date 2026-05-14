param(
  [string]$Repo = $env:OMG_REPO,
  [string]$Ref = $env:OMG_REF,
  [string]$Target = "global",
  [string]$Preset = $env:OMG_PRESET,
  [switch]$Fresh,
  [switch]$Force,
  [switch]$NoAgents
)

$ErrorActionPreference = "Stop"

if (-not $Repo) { $Repo = "tranvietanh0/oh-my-game-kit" }
if (-not $Ref) { $Ref = "main" }
if (-not $Preset) { $Preset = "full" }

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

Write-Host "Installing oh-my-game-kit from $PackageSpec"
npx @ArgsList
