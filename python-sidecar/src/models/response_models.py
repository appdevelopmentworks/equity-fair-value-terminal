from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class SidecarSuccessResponse:
    ticker: str
    company_name: str
    current_price: float
    previous_close: float
    change: float
    change_percent: float
    currency: str
    exchange: str
    as_of: str
    ok: bool = True
    status: str = "ok"

    def to_dict(self) -> dict[str, object]:
        return {
            "ok": self.ok,
            "status": self.status,
            "ticker": self.ticker,
            "companyName": self.company_name,
            "currentPrice": self.current_price,
            "previousClose": self.previous_close,
            "change": self.change,
            "changePercent": self.change_percent,
            "currency": self.currency,
            "exchange": self.exchange,
            "asOf": self.as_of,
        }


@dataclass(slots=True)
class SidecarCandleResponse:
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int

    def to_dict(self) -> dict[str, object]:
        return {
            "date": self.date,
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
        }


@dataclass(slots=True)
class SidecarMovingAveragePointResponse:
    date: str
    value: float

    def to_dict(self) -> dict[str, object]:
        return {
            "date": self.date,
            "value": self.value,
        }


@dataclass(slots=True)
class SidecarMovingAveragesResponse:
    ma25: list[SidecarMovingAveragePointResponse]
    ma75: list[SidecarMovingAveragePointResponse]
    ma200: list[SidecarMovingAveragePointResponse]

    def to_dict(self) -> dict[str, object]:
        return {
            "ma25": [point.to_dict() for point in self.ma25],
            "ma75": [point.to_dict() for point in self.ma75],
            "ma200": [point.to_dict() for point in self.ma200],
        }


@dataclass(slots=True)
class SidecarChartSuccessResponse:
    ticker: str
    chart_range: str
    candles: list[SidecarCandleResponse]
    moving_averages: SidecarMovingAveragesResponse
    ok: bool = True
    status: str = "ok"

    def to_dict(self) -> dict[str, object]:
        return {
            "ok": self.ok,
            "status": self.status,
            "ticker": self.ticker,
            "range": self.chart_range,
            "candles": [candle.to_dict() for candle in self.candles],
            "movingAverages": self.moving_averages.to_dict(),
        }


@dataclass(slots=True)
class SidecarSearchCandidateResponse:
    symbol: str
    short_name: str | None
    long_name: str | None
    exchange: str
    quote_type: str
    currency: str

    def to_dict(self) -> dict[str, object]:
        return {
            "symbol": self.symbol,
            "shortName": self.short_name,
            "longName": self.long_name,
            "exchange": self.exchange,
            "quoteType": self.quote_type,
            "currency": self.currency,
        }


@dataclass(slots=True)
class SidecarSearchSuccessResponse:
    query: str
    results: list[SidecarSearchCandidateResponse]
    ok: bool = True
    status: str = "ok"

    def to_dict(self) -> dict[str, object]:
        return {
            "ok": self.ok,
            "status": self.status,
            "query": self.query,
            "results": [result.to_dict() for result in self.results],
        }


@dataclass(slots=True)
class SidecarValuationMethodResponse:
    method_id: str
    method_name: str
    status: str
    fair_value: float | None
    current_price: float | None
    price_gap: float | None
    upside_downside_pct: float | None
    judgment: str | None
    currency: str | None
    assumptions: dict[str, object]
    inputs: dict[str, object]
    reason_if_unavailable: str | None

    def to_dict(self) -> dict[str, object]:
        return {
            "method_id": self.method_id,
            "method_name": self.method_name,
            "status": self.status,
            "fair_value": self.fair_value,
            "current_price": self.current_price,
            "price_gap": self.price_gap,
            "upside_downside_pct": self.upside_downside_pct,
            "judgment": self.judgment,
            "currency": self.currency,
            "assumptions": self.assumptions,
            "inputs": self.inputs,
            "reason_if_unavailable": self.reason_if_unavailable,
        }


@dataclass(slots=True)
class SidecarValuationIssueResponse:
    scope: str
    error_code: str
    message: str

    def to_dict(self) -> dict[str, object]:
        return {
            "scope": self.scope,
            "error_code": self.error_code,
            "message": self.message,
        }


@dataclass(slots=True)
class SidecarValuationsSuccessResponse:
    symbol: str
    currency: str
    valuations: list[SidecarValuationMethodResponse]
    errors: list[SidecarValuationIssueResponse]
    ok: bool = True
    status: str = "ok"

    def to_dict(self) -> dict[str, object]:
        return {
            "ok": self.ok,
            "status": self.status,
            "symbol": self.symbol,
            "currency": self.currency,
            "valuations": [valuation.to_dict() for valuation in self.valuations],
            "errors": [error.to_dict() for error in self.errors],
        }


@dataclass(slots=True)
class SidecarErrorResponse:
    error_code: str
    message: str
    retryable: bool
    ok: bool = False

    def to_dict(self) -> dict[str, object]:
        return {
            "ok": self.ok,
            "errorCode": self.error_code,
            "message": self.message,
            "retryable": self.retryable,
        }


class SidecarError(Exception):
    def __init__(self, error_code: str, message: str, retryable: bool) -> None:
        super().__init__(message)
        self.error_code = error_code
        self.message = message
        self.retryable = retryable

    def to_response(self) -> SidecarErrorResponse:
        return SidecarErrorResponse(
            error_code=self.error_code,
            message=self.message,
            retryable=self.retryable,
        )
