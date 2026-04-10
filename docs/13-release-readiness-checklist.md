# Release Readiness Checklist

## Purpose
This checklist is the release-preparation source of truth for Windows distribution of `equity-fair-value-terminal`.

Use it before shipping any installer or executable to another machine.

Practical build flow:
- [RELEASE.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/RELEASE.md)

## Current Status Snapshot
- `frontend/out` static export is configured through Tauri `beforeBuildCommand` and `frontendDist`.
- App metadata already exists for Windows packaging:
  - product name
  - identifier
  - version
  - icon set
  - NSIS bundle target
- The runtime bridge supports packaged mode and expects a bundled sidecar binary at `sidecars/eqfv-python-sidecar.exe`.
- Sidecar build and bundle preparation are wired into the release flow through:
  - `scripts/build-sidecar.ps1`
  - `npm run sidecar:build`
  - `npm run build`
- The main remaining release gaps are packaged installer verification and clean-machine validation.

## Current Config References
- Tauri app metadata and NSIS target:
  - `src-tauri/tauri.conf.json`
- Rust packaged sidecar lookup:
  - `src-tauri/src/bridge.rs`
- Release sidecar guard:
  - `src-tauri/build.rs`
- Python sidecar executable build spec:
  - `python-sidecar/pyinstaller.spec`
- Root build scripts:
  - `package.json`

## Release Blocking Gaps
- [ ] Verified installer output from `tauri build`
- [ ] Clean-machine install and first-run smoke test

## Release Checklist

### 1. Version and metadata
- [ ] Confirm `productName` is correct in `src-tauri/tauri.conf.json`
- [ ] Confirm `identifier` is correct in `src-tauri/tauri.conf.json`
- [ ] Confirm `version` matches the intended release version in:
  - `package.json`
  - `src-tauri/tauri.conf.json`
  - `src-tauri/Cargo.toml`
- [ ] Confirm the icon files exist and render correctly:
  - `src-tauri/icons/icon.ico`
  - `src-tauri/icons/icon.png`
  - `src-tauri/icons/32x32.png`
  - `src-tauri/icons/128x128.png`
  - `src-tauri/icons/128x128@2x.png`

### 2. Build prerequisites on the release machine
- [ ] Node.js is installed
- [ ] Rust toolchain is installed
- [ ] Python 3.12 is available for sidecar packaging
- [ ] `uv` is available
- [ ] PyInstaller is installed in `python-sidecar/.venv`
- [ ] Tauri CLI is available through project dependencies
- [ ] Windows application control or endpoint security does not block Cargo build scripts or procedural macro DLL loading

### 3. Frontend static output inclusion
- [ ] Run `cmd.exe /c npm.cmd install --cache .npm-cache`
- [ ] Run `cmd.exe /c npm.cmd run build --workspace frontend`
- [ ] Confirm `frontend/out` exists after the build
- [ ] Confirm `src-tauri/tauri.conf.json` still points `frontendDist` to `../frontend/out`

### 4. Python sidecar inclusion
- [ ] Run `cmd.exe /c npm.cmd run sidecar:build`
- [ ] Confirm the PyInstaller output is named `eqfv-python-sidecar.exe`
- [ ] Confirm the prepared bundle path exists:
  - `src-tauri/sidecars/eqfv-python-sidecar.exe`
- [ ] Confirm the packaged runtime path expected by Rust is still:
  - `sidecars/eqfv-python-sidecar.exe`
- [ ] Confirm release compilation fails clearly if the sidecar is missing
- [ ] Confirm the installer includes the sidecar binary on disk after installation

### 5. Windows desktop app launch
- [ ] Run a packaged build, not only `tauri:dev`
- [ ] Install the generated NSIS installer on Windows
- [ ] Launch the installed app successfully
- [ ] Confirm there is no missing-sidecar startup failure
- [ ] Confirm the window title is `Equity Fair Value Terminal`
- [ ] Confirm the app icon is shown in the installed app and taskbar

### 6. English and Japanese UI sanity
- [ ] Launch in English mode and verify core fixed labels
- [ ] Switch to Japanese mode and verify core fixed labels
- [ ] Confirm search, chart, valuation, loading, unavailable, and error copy are localized
- [ ] Confirm long English and Japanese labels do not break the layout

### 7. Japanese stock and US stock sanity
- [ ] Verify a US stock such as `AAPL`
- [ ] Verify a Japanese stock such as `7203` or `7203.T`
- [ ] Confirm 4-digit TSE code normalization still works in the packaged app
- [ ] Confirm quote price, currency, exchange, and change values appear correctly

### 8. Chart rendering check
- [ ] Confirm the candlestick chart renders for a valid ticker
- [ ] Confirm volume bars render
- [ ] Confirm `MA25`, `MA75`, and `MA200` render
- [ ] Confirm timeframe switching works for:
  - `1M`
  - `3M`
  - `6M`
  - `1Y`
  - `5Y`
  - `MAX`
- [ ] Confirm the chart empty/error state remains readable if data fails

### 9. Valuation cards check
- [ ] Confirm the existing cards still render:
  - `PER`
  - `PBR`
  - `Residual Income`
  - `Simplified DCF`
  - `Relative Valuation`
- [ ] Confirm the extended cards render when data is available:
  - `DDM`
  - `EV/EBITDA Relative`
- [ ] Confirm details toggles still open and close cleanly
- [ ] Confirm valuation card layout remains readable in both English and Japanese

### 10. Unavailable and error state check
- [ ] Confirm invalid ticker handling stays user-friendly
- [ ] Confirm provider failure does not leak raw internal errors
- [ ] Confirm chart failure does not wipe the last successful chart unnecessarily
- [ ] Confirm valuation panel failure does not wipe the last successful valuation set unnecessarily
- [ ] Confirm at least one valuation-unavailable example behaves correctly
  - recommended smoke test: `BRK-B` for a likely DDM unavailable path

### 11. Dark mode check
- [ ] Confirm dark mode still works in the packaged app
- [ ] Confirm quote, chart, valuation, dropdown, and error surfaces remain readable
- [ ] Confirm contrast remains acceptable in both locales

### 12. Installer build verification
- [ ] Run `cmd.exe /c npm.cmd run build`
- [ ] Confirm NSIS output exists under:
  - `src-tauri/target/release/bundle/nsis/`
- [ ] Confirm the installer completes successfully
- [ ] Confirm uninstall also completes successfully

### 13. Clean-machine test assumptions
- [ ] Confirm the packaged app does not require Node.js on the end-user machine
- [ ] Confirm the packaged app does not require Rust on the end-user machine
- [ ] Confirm the packaged app does not require a separately installed Python runtime
- [ ] Confirm network-dependent features fail gracefully when offline or temporarily blocked
- [ ] Confirm yfinance-dependent requests still require internet access and are documented as such

## Recommended Release Smoke Test Set
- `AAPL`
- `7203`
- `6758`
- `BRK-B`
- invalid ticker such as `ZZZZZZZZ`

## Exit Criteria
Do not distribute a Windows installer until the packaged installer has passed the checklist above on at least one clean Windows machine.
