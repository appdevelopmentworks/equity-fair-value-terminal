# equity-fair-value-terminal

Japanese README: [README.ja.md](C:/Users/hartm/Desktop/equity-fair-value-terminal/README.ja.md)

Desktop stock valuation application for Windows built with Tauri 2, Next.js 16, TypeScript, Tailwind CSS, and a Python sidecar.

## Current RC MVP
- ticker-first search with company-name autocomplete
- English and Japanese UI support
- live quote lookup for Japanese and US equities supported by `yfinance`
- Tokyo Stock Exchange 4-digit code input such as `7203` or `6758`, normalized to `.T`
- candlestick chart with `1M / 3M / 6M / 1Y / 5Y / MAX`
- volume plus `MA25 / MA75 / MA200`
- valuation cards for `PER`, `PBR`, `Residual Income`, `Simplified DCF`, `Relative Valuation`, `DDM`, and `EV/EBITDA Relative`
- per-section and per-method `ok / unavailable / error` handling
- dark mode and desktop-first layout

## Local setup
PowerShell commands from `C:\Users\hartm\Desktop\equity-fair-value-terminal`:

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

3. Optional sidecar smoke tests.
```powershell
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py AAPL
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 7203
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 6758
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py chart 7203 1Y
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py valuations-only 7203
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py search apple
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py search toyota
python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py search トヨタ
```

## Run in development
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

## Search notes
- ticker entry remains the primary flow
- company-name suggestions appear when `yfinance` can resolve them
- English company-name matching is currently more reliable than Japanese company-name matching
- choosing a suggestion opens the same quote / chart / valuation flow as direct ticker entry
- pressing `Enter` while typing a ticker keeps the direct ticker flow
- 4-digit TSE codes such as `7203` and `6758` are accepted and normalized to `7203.T` / `6758.T`

## Frontend production build
```powershell
cmd.exe /c npm.cmd run build --workspace frontend
```

## Verification completed in this environment
- `cmd.exe /c .\node_modules\.bin\tsc.cmd -p frontend\tsconfig.json --noEmit`
- `cmd.exe /c npm.cmd run build --workspace frontend`
- `python-sidecar\.venv\Scripts\python.exe -m compileall python-sidecar\src`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py AAPL`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 7203`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py 6758`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py chart 7203 1Y`
- `python-sidecar\.venv\Scripts\python.exe python-sidecar\src\main.py valuations-only 7203`
- `cargo check`

## Recommended final checks before shipping
- verify the packaged sidecar bundle and Windows installer path
- smoke test both English and Japanese modes in the packaged build
- confirm dark mode and light mode at common desktop window sizes
- do one final offline / temporary-provider-failure pass for search, chart, and valuation sections
