param(
  [string]$Target = "global",
  [string]$Preset = "unity-minimal",
  [switch]$Fresh,
  [switch]$Force
)

$ArgsList = @("src/cli.js", "install", "--target", $Target, "--preset", $Preset)
if ($Fresh) { $ArgsList += "--fresh" }
if ($Force) { $ArgsList += "--force" }

node @ArgsList
