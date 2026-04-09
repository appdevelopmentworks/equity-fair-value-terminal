from __future__ import annotations

from dataclasses import dataclass

from models.response_models import SidecarError


VALID_TICKER_CHARACTERS = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.-^=")
VALID_CHART_RANGES = {"1M", "3M", "6M", "1Y", "5Y", "MAX"}
MAX_SEARCH_QUERY_LENGTH = 80


def normalize_tse_short_code(ticker: str) -> str:
    if len(ticker) == 4 and ticker.isdigit():
        return f"{ticker}.T"

    return ticker


def normalize_ticker(raw_ticker: str) -> str:
    normalized = raw_ticker.strip().upper()

    if not normalized or any(character not in VALID_TICKER_CHARACTERS for character in normalized):
        raise SidecarError(
            error_code="INVALID_SYMBOL_FORMAT",
            message="Ticker not found.",
            retryable=False,
        )

    return normalize_tse_short_code(normalized)


def normalize_search_query(raw_query: str) -> str:
    normalized = raw_query.strip()

    if not normalized or len(normalized) > MAX_SEARCH_QUERY_LENGTH:
        raise SidecarError(
            error_code="INVALID_SYMBOL_FORMAT",
            message="Search query is not valid.",
            retryable=False,
        )

    return normalized


@dataclass(slots=True)
class QuoteRequest:
    ticker: str

    @classmethod
    def from_input(cls, raw_ticker: str) -> "QuoteRequest":
        return cls(ticker=normalize_ticker(raw_ticker))


@dataclass(slots=True)
class ChartRequest:
    ticker: str
    chart_range: str

    @classmethod
    def from_input(cls, raw_ticker: str, raw_range: str) -> "ChartRequest":
        ticker = normalize_ticker(raw_ticker)
        normalized_range = raw_range.strip().upper()

        if normalized_range not in VALID_CHART_RANGES:
            raise SidecarError(
                error_code="HISTORICAL_DATA_FETCH_FAILED",
                message="Chart range is not supported.",
                retryable=False,
            )

        return cls(ticker=ticker, chart_range=normalized_range)


@dataclass(slots=True)
class ValuationRequest:
    ticker: str

    @classmethod
    def from_input(cls, raw_ticker: str) -> "ValuationRequest":
        return cls(ticker=normalize_ticker(raw_ticker))


@dataclass(slots=True)
class SearchRequest:
    query: str

    @classmethod
    def from_input(cls, raw_query: str) -> "SearchRequest":
        return cls(query=normalize_search_query(raw_query))
