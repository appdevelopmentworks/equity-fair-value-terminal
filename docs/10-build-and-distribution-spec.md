# Build and Distribution Specification

## 1. Purpose
This document defines the current Windows build and distribution model for `equity-fair-value-terminal`.

It should describe the repository as it currently works, including release assumptions and any remaining verification gaps.

## 2. Supported Distribution Target
- Primary packaged target: Windows desktop
- Secondary future target: macOS
- Linux is outside the current scope

## 3. Distribution Components
- `frontend/`
  - Next.js 16 static frontend
- `src-tauri/`
  - Tauri 2 desktop shell
  - Rust bridge for Python sidecar process control
- `python-sidecar/`
  - Python market-data and valuation worker
- `docs/`
  - specifications, implementation notes, and release checklist

## 4. Current Build Model

### 4.1 Frontend
- The frontend is built as static output.
- Tauri uses:
  - `beforeBuildCommand`
  - `frontendDist`
- The current configured output path is `frontend/out`.

### 4.2 Python sidecar
- Development runtime uses:
  - `python-sidecar/.venv/Scripts/python.exe`
  - `python-sidecar/src/main.py`
- Packaged runtime uses a bundled executable sidecar.
- The packaged sidecar filename is:
  - `eqfv-python-sidecar.exe`
- The packaged sidecar bundle path is:
  - `src-tauri/sidecars/eqfv-python-sidecar.exe`
- The Rust packaged runtime lookup path is:
  - `sidecars/eqfv-python-sidecar.exe`
- The current release preparation script is:
  - `scripts/build-sidecar.ps1`

### 4.3 Tauri / Rust
- Tauri builds the Windows desktop executable and NSIS installer.
- Rust is responsible for:
  - sidecar launch
  - timeout handling
  - JSON parsing
  - response validation
  - error normalization
  - packaged sidecar lookup

## 5. Current Release Artifact Metadata
The repository already includes the main metadata required for Windows packaging:
- product name
- app identifier
- version
- icon set
- NSIS bundle target

These are currently defined in:
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`
- `package.json`

## 6. Current Release Readiness Status

### 6.1 Already configured
- Static frontend export is wired into Tauri build
- App icon assets exist
- Product name and identifier are set
- Version metadata exists
- NSIS is the configured bundle target
- Rust packaged runtime path for a bundled sidecar is defined
- Root release build runs sidecar preparation before `tauri build`
- Release compilation fails early if the bundled sidecar is missing

### 6.2 Not yet completed
- Verified packaged installer smoke test
- Clean-machine installation verification
- Final release-signing / publisher-specific metadata decisions if needed

## 7. Root Release Commands

### 7.1 Sidecar preparation
```powershell
cmd.exe /c npm.cmd run sidecar:build
```

This command:
1. runs PyInstaller against `python-sidecar/pyinstaller.spec`
2. locates the built `eqfv-python-sidecar.exe`
3. copies it into `src-tauri/sidecars/eqfv-python-sidecar.exe`

### 7.2 Windows packaged build
```powershell
cmd.exe /c npm.cmd run build
```

This command:
1. builds the static frontend export
2. prepares the packaged Python sidecar
3. runs `tauri build`

## 8. Expected Release Build Sequence
The intended Windows release sequence is:
1. Install frontend dependencies
2. Prepare the Python sidecar environment
3. Install Python packaging dependencies
4. Build the packaged Python sidecar executable
5. Copy the sidecar into Tauri bundle resources
6. Run `tauri build`
7. Verify the generated NSIS installer
8. Install and smoke test on Windows

## 9. Release Verification Scope
At minimum, release verification should include:
- app launch from installed build
- English UI sanity
- Japanese UI sanity
- US stock lookup
- Japanese stock lookup
- chart rendering
- timeframe switching
- valuation cards
- unavailable valuation states
- error handling states
- dark mode
- installer install and uninstall

## 10. Clean-Machine Assumptions
The packaged Windows app should not require the end user to install:
- Node.js
- Rust
- a separate Python runtime

The packaged app still requires:
- internet access for live yfinance-based requests

## 11. Packaging Assumptions
- PyInstaller is installed into the sidecar virtual environment before release builds.
- The packaged sidecar remains a separate bundled resource, not a Rust-embedded binary.
- The frontend remains a static export consumed by Tauri from `frontend/out`.
- Release lookup must never depend on development-only Python paths.
- The Windows release machine must allow Cargo build scripts and procedural macro DLL loading during Rust compilation.

## 12. Checklist Reference
Use the operational release checklist in:
- `docs/13-release-readiness-checklist.md`

That checklist is the release gate for deciding whether a Windows installer is ready to distribute.

## 13. Non-goals for this phase
This phase does not require:
- new product features
- new valuation methods
- architecture rewrites
- platform expansion beyond Windows packaging readiness
