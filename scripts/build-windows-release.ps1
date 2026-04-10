Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$sidecarBuildScript = Join-Path $PSScriptRoot "build-sidecar.ps1"
$tauriCargoTargetDir = $env:CARGO_TARGET_DIR

Push-Location $workspaceRoot
try {
    if (Test-Path Env:CARGO_TARGET_DIR) {
        Remove-Item Env:CARGO_TARGET_DIR
    }

    & cmd.exe /c npm.cmd run build --workspace frontend

    if ($LASTEXITCODE -ne 0) {
        throw "Frontend static build failed with exit code $LASTEXITCODE."
    }

    & powershell -ExecutionPolicy Bypass -File $sidecarBuildScript

    if ($LASTEXITCODE -ne 0) {
        throw "Python sidecar packaging failed with exit code $LASTEXITCODE."
    }

    if ($tauriCargoTargetDir) {
        $env:CARGO_TARGET_DIR = $tauriCargoTargetDir
    }

    & cmd.exe /c npm.cmd run tauri:build

    if ($LASTEXITCODE -ne 0) {
        throw "Tauri build failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}
