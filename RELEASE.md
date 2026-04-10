# Release Guide

This document is the practical release procedure for developers and testers preparing a Windows build of `equity-fair-value-terminal`.

Use it together with:
- [docs/13-release-readiness-checklist.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/docs/13-release-readiness-checklist.md)
- [CHANGELOG.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/CHANGELOG.md)

## Audience

- Developers preparing a release build
- Testers validating a packaged installer
- Maintainers tracking what is still manual in the current distribution flow

## Current release target

- Platform: Windows desktop
- Bundle format: NSIS installer
- Product name: `Equity Fair Value Terminal`
- Identifier: `com.openai.equityfairvalueterminal`
- Version source of truth:
  - [package.json](C:/Users/hartm/Desktop/equity-fair-value-terminal/package.json)
  - [src-tauri/tauri.conf.json](C:/Users/hartm/Desktop/equity-fair-value-terminal/src-tauri/tauri.conf.json)
  - [src-tauri/Cargo.toml](C:/Users/hartm/Desktop/equity-fair-value-terminal/src-tauri/Cargo.toml)

## Before starting a release

1. Confirm the target version is aligned across `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`.
2. Add or update the release note entry in [CHANGELOG.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/CHANGELOG.md).
3. Review the current blocking items in [docs/13-release-readiness-checklist.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/docs/13-release-readiness-checklist.md).

## Release prerequisites

Run these steps from `C:\Users\hartm\Desktop\equity-fair-value-terminal`.

1. Install JavaScript dependencies.
```powershell
cmd.exe /c npm.cmd install --cache .npm-cache
```

2. Prepare the sidecar Python environment.
```powershell
$env:UV_CACHE_DIR = (Join-Path (Get-Location) '.uv-cache')
$env:UV_PYTHON_INSTALL_DIR = (Join-Path (Get-Location) '.uv-python')
uv.exe python install 3.12
$python = Get-ChildItem .\.uv-python -Recurse -Filter python.exe | Select-Object -First 1 -ExpandProperty FullName
uv.exe sync --project python-sidecar --python $python
```

3. Install sidecar packaging dependencies.
```powershell
$env:UV_CACHE_DIR = (Join-Path (Get-Location) '.uv-cache')
uv.exe pip install --python python-sidecar\.venv\Scripts\python.exe -r python-sidecar\requirements.txt
```

4. Confirm the release machine allows normal Rust compilation.
   Windows application control or endpoint security must not block Cargo build scripts or procedural macro DLL loading.

## Release build commands

### Option A: full Windows release flow

```powershell
cmd.exe /c npm.cmd run build
```

This runs:
1. static frontend export
2. sidecar packaging with PyInstaller
3. copy to `src-tauri/sidecars/eqfv-python-sidecar.exe`
4. `tauri build`

### Option B: step-by-step build

1. Build the static frontend.
```powershell
cmd.exe /c npm.cmd run build --workspace frontend
```

2. Build and prepare the packaged sidecar.
```powershell
cmd.exe /c npm.cmd run sidecar:build
```

3. Build the Windows installer.
```powershell
cmd.exe /c npm.cmd run tauri:build
```

## Expected artifacts

- Prepared sidecar resource:
  - `src-tauri/sidecars/eqfv-python-sidecar.exe`
- Static frontend export:
  - `frontend/out/`
- NSIS installer output:
  - `src-tauri/target/release/bundle/nsis/`

## What is still manual

- installer smoke testing on a packaged build
- install and uninstall verification on a clean Windows machine
- checking that the bundled sidecar exists on disk after installation
- code signing and publisher-specific Windows metadata, if required
- final archive and distribution of the installer artifact

## Tester handoff

At minimum, testers should verify:
- app launch from installed build
- English and Japanese UI sanity
- `AAPL`, `7203`, and `6758`
- invalid ticker such as `ZZZZZZZZ`
- candlestick chart plus timeframe switching
- valuation cards, including at least one `unavailable` example such as `BRK-B`
- dark mode and light mode

Use the detailed gate in [docs/13-release-readiness-checklist.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/docs/13-release-readiness-checklist.md).

## Known release-time limitations

- The app depends on live `yfinance` requests and therefore needs network access at runtime.
- Japanese company-name autocomplete is provider-limited and should be treated as best-effort.
- Some valuation cards are expected to return `unavailable` for certain symbols because data quality differs by company and market.
- This repository is ready for `tauri build`, but a locked-down Windows policy can still block compilation outside the codebase itself.

## After the build

1. Record the released version and notes in [CHANGELOG.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/CHANGELOG.md).
2. Check off the items in [docs/13-release-readiness-checklist.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/docs/13-release-readiness-checklist.md).
3. Preserve the generated installer path and build environment notes for future releases.
