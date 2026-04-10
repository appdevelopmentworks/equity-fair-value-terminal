Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$sidecarProjectDir = Join-Path $workspaceRoot "python-sidecar"
$pythonExecutable = Join-Path $sidecarProjectDir ".venv\Scripts\python.exe"
$bundleSidecarDir = Join-Path $workspaceRoot "src-tauri\sidecars"
$bundleSidecarPath = Join-Path $bundleSidecarDir "eqfv-python-sidecar.exe"

if (-not (Test-Path -LiteralPath $pythonExecutable)) {
    throw "Python sidecar virtual environment was not found at '$pythonExecutable'. Run the README setup steps first."
}

try {
    & $pythonExecutable -c "import PyInstaller" | Out-Null
} catch {
    throw "PyInstaller is not installed in the sidecar virtual environment. Run `$env:UV_CACHE_DIR = (Join-Path (Get-Location) '.uv-cache'); uv.exe pip install --python python-sidecar\.venv\Scripts\python.exe -r python-sidecar\requirements.txt` and try again."
}

Push-Location $sidecarProjectDir
try {
    & $pythonExecutable -m PyInstaller --noconfirm --clean pyinstaller.spec

    if ($LASTEXITCODE -ne 0) {
        throw "PyInstaller failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}

$candidatePaths = @(
    (Join-Path $sidecarProjectDir "dist\eqfv-python-sidecar.exe"),
    (Join-Path $sidecarProjectDir "dist\eqfv-python-sidecar\eqfv-python-sidecar.exe")
)

$builtSidecarPath = $candidatePaths | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not $builtSidecarPath) {
    throw "PyInstaller completed but the sidecar executable could not be found in the expected dist output."
}

New-Item -ItemType Directory -Force -Path $bundleSidecarDir | Out-Null
Copy-Item -LiteralPath $builtSidecarPath -Destination $bundleSidecarPath -Force

Write-Host "Prepared packaged sidecar at $bundleSidecarPath"
