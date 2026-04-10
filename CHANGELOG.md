# Changelog

All notable changes to `equity-fair-value-terminal` should be documented in this file.

## [0.1.0] - 2026-04-10

Initial MVP release candidate for the Windows desktop app.

### Added

- Tauri 2 desktop shell with Next.js 16 static frontend packaging
- Python sidecar integration for live quotes, chart data, symbol search, and valuation methods
- bilingual English and Japanese UI support for fixed labels, errors, valuation judgments, and formatting
- ticker-first search with company-name autocomplete and Tokyo Stock Exchange 4-digit code normalization
- quote card, candlestick chart, volume, `MA25`, `MA75`, `MA200`, and timeframe switching
- valuation cards for `PER`, `PBR`, `Residual Income`, `Simplified DCF`, `Relative Valuation`, `DDM`, and `EV/EBITDA Relative`
- per-section and per-method `ok`, `unavailable`, and `error` handling
- Windows packaging scripts for sidecar preparation and Tauri release builds

### Notes

- Market data and many financial inputs come from `yfinance`, so runtime behavior depends on provider availability and internet access.
- Japanese company-name autocomplete is best-effort and currently less reliable than English company-name matching.
- Some valuation methods are expected to return `unavailable` when the required financial fields are missing or unsuitable.
- Final installer verification on a clean Windows machine remains a release gate even after the build completes.
