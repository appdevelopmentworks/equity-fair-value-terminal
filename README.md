# equity-fair-value-terminal

Japanese README: [README.ja.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/README.ja.md)

Desktop stock valuation application for Windows built with Tauri 2, Next.js 16, TypeScript, Tailwind CSS, and a Python sidecar.

## Overview

`equity-fair-value-terminal` is a desktop-first fair value application for Japanese and US equities. It combines a Tauri desktop shell, a static Next.js frontend, Rust-side process control, and a Python sidecar that fetches live market data and calculates valuation methods from `yfinance`.

Current MVP capabilities:
- ticker-first search with company-name autocomplete
- English and Japanese UI support
- live quote lookup for Japanese and US equities supported by `yfinance`
- Tokyo Stock Exchange 4-digit code input such as `7203` or `6758`, normalized to `.T`
- candlestick chart with `1M / 3M / 6M / 1Y / 5Y / MAX`
- volume plus `MA25 / MA75 / MA200`
- valuation cards for `PER`, `PBR`, `Residual Income`, `Simplified DCF`, `Relative Valuation`, `DDM`, and `EV/EBITDA Relative`
- per-section and per-method `ok / unavailable / error` handling
- dark mode and desktop-first layout

## Stack

- Desktop shell: Tauri 2
- Frontend: Next.js 16, React 19, TypeScript
- Styling: Tailwind CSS 4
- Desktop bridge: Rust
- Market data and valuation engine: Python 3.12 sidecar
- Market data source: `yfinance`

## Repository layout

```text
frontend/         Next.js app and desktop UI
python-sidecar/   yfinance integration and valuation logic
src-tauri/        Tauri app, Rust bridge, Windows bundle config
scripts/          Build helper scripts for release packaging
docs/             Product, implementation, and release specifications
```

## Documentation map

- Product and implementation specs: [docs](C:/Users/hartm/Desktop/equity-fair-value-terminal/docs)
- Windows release procedure: [RELEASE.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/RELEASE.md)
- Release verification checklist: [docs/13-release-readiness-checklist.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/docs/13-release-readiness-checklist.md)
- Release notes: [CHANGELOG.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/CHANGELOG.md)

## Local development setup

Run the following in PowerShell from `C:\Users\hartm\Desktop\equity-fair-value-terminal`.

1. Install JavaScript dependencies.
```powershell
cmd.exe /c npm.cmd install --cache .npm-cache
```

2. Prepare a repo-local Python toolchain with `uv`.
```powershell
$env:UV_CACHE_DIR = (Join-Path (Get-Location) '.uv-cache')
$env:UV_PYTHON_INSTALL_DIR = (Join-Path (Get-Location) '.uv-python')
uv.exe python install 3.12
$python = Get-ChildItem .\.uv-python -Recurse -Filter python.exe | Select-Object -First 1 -ExpandProperty FullName
uv.exe sync --project python-sidecar --python $python
```

3. Install Python packaging dependencies used by the Windows sidecar build.
```powershell
$env:UV_CACHE_DIR = (Join-Path (Get-Location) '.uv-cache')
uv.exe pip install --python python-sidecar\.venv\Scripts\python.exe -r python-sidecar\requirements.txt
```

4. Optional sidecar smoke tests.
```powershell
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py AAPL
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 7203
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py chart 7203 1Y
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py valuations-only BRK-B
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py search apple
```

## Run the frontend only

Use this when you want the Next.js app without the Tauri shell.

```powershell
cmd.exe /c npm.cmd run dev --workspace frontend
```

The standalone frontend expects the Tauri bridge only when running inside the desktop app, so desktop-specific commands should still be exercised through `tauri:dev`.

## Run the Tauri desktop app

This is the normal local development path. Tauri starts the frontend dev server automatically through `beforeDevCommand`.

```powershell
cmd.exe /c npm.cmd run tauri:dev
```

If Windows application control blocks `target\debug\equity-fair-value-terminal.exe`, retry with a temp Cargo target directory:

```powershell
$target = 'C:\Users\hartm\AppData\Local\Temp\eqfv-cargo-target'
[void](New-Item -ItemType Directory -Force $target)
$env:CARGO_TARGET_DIR = $target
cmd.exe /c npm.cmd run tauri:dev
```

The Tauri dev config now clears `CARGO_TARGET_DIR` before starting the frontend dev server. In this managed Windows environment, `next dev` can still fail earlier with `spawn EPERM`, so a less restricted machine may still be required for desktop development.

## Python sidecar runtime assumptions

- Development mode expects `python-sidecar/.venv/Scripts/python.exe` and `python-sidecar/src/main.py` to exist.
- Release mode expects a bundled sidecar executable at `src-tauri/sidecars/eqfv-python-sidecar.exe` before `tauri build`.
- The packaged app does not require end users to install Python separately.
- Quote, chart, search, and valuation requests require internet access because data is fetched from `yfinance`.

## Search behavior notes

- ticker entry remains the primary flow
- company-name suggestions appear when `yfinance` can resolve them
- English company-name matching is currently more reliable than Japanese company-name matching
- choosing a suggestion opens the same quote, chart, and valuation flow as direct ticker entry
- pressing `Enter` while typing a ticker keeps the direct ticker flow
- 4-digit TSE codes such as `7203` and `6758` are accepted and normalized to `7203.T` and `6758.T`

## Frontend production build

```powershell
cmd.exe /c npm.cmd run build --workspace frontend
```

This produces the static export consumed by Tauri at `frontend/out`.

## Windows release build

The packaged Windows build expects a bundled sidecar executable at `src-tauri/sidecars/eqfv-python-sidecar.exe`.

`npm run build` performs the release flow in this order:
1. frontend static build
2. packaged Python sidecar build
3. copy into `src-tauri/sidecars`
4. `tauri build`

Run it with:

```powershell
cmd.exe /c npm.cmd run build
```

Expected NSIS installer output:

```text
src-tauri/target/release/bundle/nsis/
```

If the sidecar file is missing during release compilation, [build.rs](C:/Users/hartm/Desktop/equity-fair-value-terminal/src-tauri/build.rs) fails early with a clear error.

## Known limitations

- The packaged app depends on live `yfinance` data and requires internet access.
- Japanese company-name autocomplete is best-effort and currently less reliable than English company-name matching.
- Some valuation methods can legitimately return `unavailable` when required financial fields are missing or unsuitable.
- Provider-level field availability can differ between US and Japanese equities.
- `cmd.exe /c npm.cmd run dev --workspace frontend` and `cmd.exe /c npm.cmd run tauri:dev` can fail with `spawn EPERM` in managed Windows environments where Node child-process creation is restricted.
- Some managed Windows environments block Cargo build scripts or procedural macro DLL loading during Rust compilation. In that case, run the release build on a Windows machine that allows normal Rust and Tauri compilation.
- Code signing and publisher-specific installer metadata remain manual release decisions.

## Release verification in this environment

The following were already verified in this workspace:
- `cmd.exe /c .\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit`
- `cmd.exe /c npm.cmd run build --workspace frontend`
- `cmd.exe /c npm.cmd run sidecar:build`
- `cmd.exe /c npm.cmd run build` reaches the Rust compilation stage after frontend export and sidecar packaging
- `python-sidecar\.venv\Scripts\python.exe -m compileall python-sidecar\src`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py AAPL`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 7203`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 6758`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py chart 7203 1Y`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py valuations-only BRK-B`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py search apple`

The following still fail in this managed Windows environment because application control blocks Cargo build scripts or procedural macro DLL loading:
- `cargo check`
- the final Rust compilation step of `npm run build`

The following also fail in this managed Windows environment because `next dev` cannot spawn its worker process:
- `cmd.exe /c npm.cmd run dev --workspace frontend`
- `cmd.exe /c npm.cmd run tauri:dev`

## Before shipping

- follow [RELEASE.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/RELEASE.md)
- complete [docs/13-release-readiness-checklist.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/docs/13-release-readiness-checklist.md)
- confirm the packaged sidecar is present in the installed app
- smoke test both English and Japanese modes in the packaged build
- verify offline and temporary-provider-failure behavior for search, chart, and valuation sections
