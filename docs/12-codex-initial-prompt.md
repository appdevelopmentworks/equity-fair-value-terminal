# Codex Initial Prompt

```md
You are working on an already-implemented desktop stock valuation application.

Read the documents under `/docs` first and treat them as the source of truth.

Project name:
equity-fair-value-terminal

Current implementation status:
- Phase 5 is complete
- The current MVP already supports:
  - ticker search
  - company-name autocomplete search
  - live quote display
  - candlestick chart with 1M / 3M / 6M / 1Y / 5Y / MAX
  - volume
  - MA25 / MA75 / MA200
  - valuation cards for PER, PBR, Residual Income, Simplified DCF, Relative Valuation
  - graceful per-section and per-method error handling
  - dark mode

Read these files in order:
1. `/docs/00-project-overview.md`
2. `/docs/01-requirements.md`
3. `/docs/05-screen-spec.md`
4. `/docs/06-valuation-method-spec.md`
5. `/docs/08-python-sidecar-spec.md`
6. `/docs/09-error-handling-spec.md`
7. `/docs/10-build-and-distribution-spec.md`
8. `/docs/11-mvp-scope.md`

Implementation policy:
1. Preserve stable working behavior.
2. Prefer targeted incremental work over broad refactors.
3. Keep valuation logic in the Python sidecar.
4. Keep Rust focused on bridging and process control.
5. Do not invent requirements that conflict with `/docs`.
6. Treat `unavailable` and `error` as different states.
7. Keep sidecar contracts locale-neutral.

Current scope guidance:
- Current MVP is complete.
- Do not rewrite the stable search / quote / chart / valuation architecture unless required.
- Bilingual UI support belongs to the next scoped phase.
- Additional valuation cards such as DDM and EV/EBITDA require a yfinance feasibility review first.

When implementing bilingual UI support:
1. Localize fixed frontend labels.
2. Localize error messages from stable `errorCode` values.
3. Localize valuation judgment labels.
4. Localize date / number / currency formatting in the frontend only.
5. Do not localize the underlying sidecar enum values or response schema.

When implementing additional valuation cards:
1. Review yfinance field availability first.
2. Add one method at a time.
3. Return `unavailable` instead of forcing estimates when inputs are missing.
4. Preserve the existing valuation card contract where possible.

Output expectations:
- Update files directly
- Keep code readable and production-oriented
- Separate concerns cleanly across frontend, Rust, and Python
- Explain only the highest-signal architectural decisions
```
