from __future__ import annotations

from dataclasses import dataclass
from statistics import median
from typing import Mapping

from utils.numbers import safe_round


JUDGMENT_UNDERVALUED_MULTIPLE = 1.15
JUDGMENT_OVERVALUED_MULTIPLE = 0.85


@dataclass(slots=True, frozen=True)
class MarketAssumptions:
    market_code: str
    cost_of_equity: float
    discount_rate: float
    growth_rate: float
    terminal_growth: float


@dataclass(slots=True, frozen=True)
class ValuationContext:
    ticker: str
    company_name: str
    current_price: float
    currency: str
    exchange: str
    market_code: str
    region: str
    sector: str | None
    industry: str | None
    eps_ttm: float | None
    bps: float | None
    enterprise_value: float | None
    ebitda: float | None
    book_value_equity: float | None
    shares_outstanding: float | None
    net_income: float | None
    roe: float | None
    annual_dividend: float | None
    annual_dividend_source: str | None
    trailing_twelve_month_dividend: float | None
    previous_twelve_month_dividend: float | None
    dividend_event_count_24m: int
    free_cash_flow: float | None
    operating_cash_flow: float | None
    capital_expenditure: float | None
    total_cash: float | None
    total_debt: float | None
    market_assumptions: MarketAssumptions


@dataclass(slots=True, frozen=True)
class PeerSnapshot:
    symbol: str
    company_name: str
    exchange: str | None
    currency: str | None
    market_cap: float | None
    trailing_pe: float | None
    price_to_book: float | None
    enterprise_value: float | None
    ebitda: float | None
    ev_to_ebitda: float | None


@dataclass(slots=True, frozen=True)
class PeerSet:
    peers: list[PeerSnapshot]
    selection_basis: str
    median_per: float | None
    median_pbr: float | None
    median_ev_to_ebitda: float | None
    median_per_count: int
    median_pbr_count: int
    median_ev_to_ebitda_count: int


@dataclass(slots=True, frozen=True)
class PeerSelectionResult:
    peer_set: PeerSet | None
    error_code: str | None = None
    message: str | None = None


@dataclass(slots=True, frozen=True)
class ValuationIssue:
    scope: str
    error_code: str
    message: str


@dataclass(slots=True, frozen=True)
class ValuationMethodResult:
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
    error_code: str | None = None

    @property
    def scope(self) -> str:
        return f"valuation:{self.method_id}"

    def to_issue(self) -> ValuationIssue | None:
        if self.status == "ok" or self.error_code is None:
            return None

        return ValuationIssue(
            scope=self.scope,
            error_code=self.error_code,
            message=self.reason_if_unavailable or "This valuation method is unavailable.",
        )


def sanitize_payload(value: object) -> object:
    if isinstance(value, dict):
        return {
            str(key): sanitize_payload(item)
            for key, item in value.items()
            if item is not None
        }

    if isinstance(value, list):
        return [sanitize_payload(item) for item in value]

    if isinstance(value, tuple):
        return [sanitize_payload(item) for item in value]

    if isinstance(value, float):
        digits = 4 if abs(value) < 1 else 2
        return safe_round(value, digits)

    return value


def median_or_none(values: list[float]) -> float | None:
    if not values:
        return None
    return float(median(values))


def determine_judgment(fair_value: float, current_price: float) -> str:
    if fair_value >= current_price * JUDGMENT_UNDERVALUED_MULTIPLE:
        return "undervalued"
    if fair_value <= current_price * JUDGMENT_OVERVALUED_MULTIPLE:
        return "overvalued"
    return "fair"


def build_ok_result(
    method_id: str,
    method_name: str,
    fair_value: float,
    context: ValuationContext,
    inputs: Mapping[str, object],
    assumptions: Mapping[str, object],
) -> ValuationMethodResult:
    rounded_fair_value = safe_round(fair_value, 2)
    rounded_current_price = safe_round(context.current_price, 2)
    price_gap = safe_round(rounded_fair_value - rounded_current_price, 2)
    upside_downside_pct = safe_round((price_gap / rounded_current_price) * 100, 2)

    return ValuationMethodResult(
        method_id=method_id,
        method_name=method_name,
        status="ok",
        fair_value=rounded_fair_value,
        current_price=rounded_current_price,
        price_gap=price_gap,
        upside_downside_pct=upside_downside_pct,
        judgment=determine_judgment(rounded_fair_value, rounded_current_price),
        currency=context.currency,
        assumptions=sanitize_payload(dict(assumptions)),
        inputs=sanitize_payload(dict(inputs)),
        reason_if_unavailable=None,
    )


def build_unavailable_result(
    method_id: str,
    method_name: str,
    context: ValuationContext,
    error_code: str,
    message: str,
    inputs: Mapping[str, object] | None = None,
    assumptions: Mapping[str, object] | None = None,
) -> ValuationMethodResult:
    return ValuationMethodResult(
        method_id=method_id,
        method_name=method_name,
        status="unavailable",
        fair_value=None,
        current_price=safe_round(context.current_price, 2),
        price_gap=None,
        upside_downside_pct=None,
        judgment=None,
        currency=context.currency,
        assumptions=sanitize_payload(dict(assumptions or {})),
        inputs=sanitize_payload(dict(inputs or {})),
        reason_if_unavailable=message,
        error_code=error_code,
    )


def build_error_result(
    method_id: str,
    method_name: str,
    context: ValuationContext,
    error_code: str,
    message: str,
) -> ValuationMethodResult:
    return ValuationMethodResult(
        method_id=method_id,
        method_name=method_name,
        status="error",
        fair_value=None,
        current_price=safe_round(context.current_price, 2),
        price_gap=None,
        upside_downside_pct=None,
        judgment=None,
        currency=context.currency,
        assumptions={},
        inputs={},
        reason_if_unavailable=message,
        error_code=error_code,
    )
