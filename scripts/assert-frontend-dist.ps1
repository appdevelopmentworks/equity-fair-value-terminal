Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$frontendDistDir = Join-Path $workspaceRoot "frontend\out"
$frontendIndexPath = Join-Path $frontendDistDir "index.html"

if (-not (Test-Path -LiteralPath $frontendIndexPath)) {
    throw "Frontend static export was not found at '$frontendIndexPath'. Run `cmd.exe /c npm.cmd run build --workspace frontend` or `cmd.exe /c npm.cmd run build` first."
}

Write-Host "Verified frontend static export at $frontendDistDir"
