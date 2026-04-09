from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
import math
from pathlib import Path
from typing import Any

from models.response_models import SidecarError
from services.market_data_normalizer import (
    calculate_change,
    calculate_change_percent,
    coerce_price,
    coerce_volume,
    normalize_company_name,
    normalize_currency,
    normalize_exchange,
    normalize_iso_date,
)
from utils.dates import utc_now_iso
from valuation.common import PeerSelectionResult, PeerSet, PeerSnapshot, ValuationContext, median_or_none
from valuation.constants import (
    DDM_HISTORY_LOOKBACK_DAYS,
    DDM_HISTORY_WINDOW_DAYS,
    MARKET_ASSUMPTIONS,
    MAX_REASONABLE_EV_TO_EBITDA,
    MAX_REASONABLE_PBR,
    MAX_REASONABLE_PER,
    PEER_MINIMUM_COUNT,
    PEER_REQUEST_SIZE,
    PEER_TARGET_COUNT,
)

try:
    import yfinance as yf
except Exception:  # pragma: no cover - import failure handled at runtime
    yf = None

try:
    import yfinance.cache as yf_cache
except Exception:  # pragma: no cover - import failure handled at runtime
    yf_cache = None


if yf is not None:
    cache_dir = Path(__file__).resolve().parents[2] / ".cache" / "yfinance"
    cache_dir.mkdir(parents=True, exist_ok=True)
    if yf_cache is not None and hasattr(yf_cache, "set_cache_location"):
        yf_cache.set_cache_location(str(cache_dir))
    yf.set_tz_cache_location(str(cache_dir))


@dataclass(slots=True)
class QuoteData:
    ticker: str
    company_name: str
    current_price: float
    previous_close: float
    change: float
    change_percent: float
    currency: str
    exchange: str
    as_of: str


@dataclass(slots=True)
class SearchResultData:
    symbol: str
    short_name: str | None
    long_name: str | None
    exchange: str
    quote_type: str
    currency: str


@dataclass(slots=True)
class SearchData:
    query: str
    results: list[SearchResultData]


@dataclass(slots=True)
class CandleData:
    date: str
    open: float
    high: float
    low: float
    close: float
    volume: int


@dataclass(slots=True)
class MovingAveragePoint:
    date: str
    value: float


@dataclass(slots=True)
class MovingAverageSeries:
    ma25: list[MovingAveragePoint]
    ma75: list[MovingAveragePoint]
    ma200: list[MovingAveragePoint]


@dataclass(slots=True)
class ChartData:
    ticker: str
    chart_range: str
    candles: list[CandleData]
    moving_averages: MovingAverageSeries


CHART_RANGE_PERIODS = {
    "1M": "1mo",
    "3M": "3mo",
    "6M": "6mo",
    "1Y": "1y",
    "5Y": "5y",
    "MAX": "max",
}

CHART_RANGE_INTERVALS = {
    "1M": "1d",
    "3M": "1d",
    "6M": "1d",
    "1Y": "1d",
    "5Y": "1d",
    "MAX": "1d",
}

MOVING_AVERAGE_WINDOWS = {
    "ma25": 25,
    "ma75": 75,
    "ma200": 200,
}

NET_INCOME_ROWS = (
    "Net Income Common Stockholders",
    "Net Income Including Noncontrolling Interests",
    "Net Income",
)
BOOK_VALUE_ROWS = (
    "Common Stock Equity",
    "Stockholders Equity",
    "Total Equity Gross Minority Interest",
)
FREE_CASH_FLOW_ROWS = ("Free Cash Flow",)
OPERATING_CASH_FLOW_ROWS = (
    "Operating Cash Flow",
    "Cash Flow From Continuing Operating Activities",
)
CAPITAL_EXPENDITURE_ROWS = ("Capital Expenditure",)
TOTAL_CASH_ROWS = (
    "Cash And Cash Equivalents",
    "Cash Cash Equivalents And Short Term Investments",
    "Cash And Short Term Investments",
)
TOTAL_DEBT_ROWS = (
    "Total Debt",
    "Current Debt And Capital Lease Obligation",
    "Long Term Debt And Capital Lease Obligation",
)
US_EXCHANGES = {"NMS", "NAS", "NCM", "NGM", "NYQ", "ASE", "BTS", "IEX", "OEM", "PNK", "OQB"}
JP_EXCHANGES = {"JPX", "TSE", "TYO", "OSA"}


def _mapping_get(source: object, key: str) -> object | None:
    if source is None:
        return None

    getter = getattr(source, "get", None)
    if callable(getter):
        try:
            return getter(key)
        except Exception:
            pass

    try:
        return source[key]  # type: ignore[index]
    except Exception:
        return None


def _coerce_number(value: object) -> float | None:
    if value is None:
        return None

    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return None

    if not math.isfinite(numeric):
        return None

    return numeric


def _normalize_ev_to_ebitda(value: object) -> float | None:
    numeric = _coerce_number(value)
    if numeric is None or numeric <= 0 or numeric > MAX_REASONABLE_EV_TO_EBITDA:
        return None

    return numeric


def _extract_statement_value(statement, row_candidates: tuple[str, ...]) -> float | None:
    if statement is None:
        return None

    index = getattr(statement, "index", None)
    if index is None:
        return None

    for row_name in row_candidates:
        if row_name not in index:
            continue

        try:
            series = statement.loc[row_name].dropna()
        except Exception:
            continue

        if getattr(series, "empty", True):
            continue

        value = _coerce_number(series.iloc[0])
        if value is not None:
            return value

    return None


def _extract_current_price(fast_info: object, info: dict[str, Any], history) -> float | None:
    for key in ("lastPrice", "last_price", "regularMarketPrice", "currentPrice"):
        price = coerce_price(_mapping_get(fast_info, key))
        if price is not None and price > 0:
            return price

    for key in ("regularMarketPrice", "currentPrice"):
        price = coerce_price(info.get(key))
        if price is not None and price > 0:
            return price

    if history is not None and not history.empty and "Close" in history:
        try:
            return coerce_price(history["Close"].dropna().iloc[-1])
        except Exception:
            return None

    return None


def _extract_previous_close(fast_info: object, info: dict[str, Any], history) -> float | None:
    for key in ("regularMarketPreviousClose", "previousClose"):
        price = coerce_price(_mapping_get(fast_info, key))
        if price is not None and price > 0:
            return price

    for key in ("regularMarketPreviousClose", "previousClose"):
        price = coerce_price(info.get(key))
        if price is not None and price > 0:
            return price

    if history is not None and not history.empty and "Close" in history:
        try:
            closes = history["Close"].dropna()
            if len(closes) >= 2:
                return coerce_price(closes.iloc[-2])
        except Exception:
            return None

    return None


def _extract_exchange(fast_info: object, info: dict[str, Any]) -> str | None:
    for key in ("exchange", "exchangeName"):
        exchange = normalize_exchange(info.get(key))
        if exchange:
            return exchange

    for key in ("exchange", "exchangeName"):
        exchange = normalize_exchange(_mapping_get(fast_info, key))
        if exchange:
            return exchange

    return None


def _is_symbol_not_found(
    current_price: float | None,
    previous_close: float | None,
    exchange: str | None,
    history,
) -> bool:
    history_is_empty = history is None or history.empty
    return current_price is None and previous_close is None and exchange is None and history_is_empty


def _safe_get_ticker_info(ticker_client) -> tuple[dict[str, Any], bool]:
    try:
        info = ticker_client.get_info() or {}
        return info, False
    except Exception:
        return {}, True


def _safe_get_statement(ticker_client, attribute: str):
    try:
        return getattr(ticker_client, attribute), False
    except Exception:
        return None, True


def _safe_get_dividends(ticker_client):
    try:
        return ticker_client.dividends, False
    except Exception:
        return None, True


def _extract_dividend_history_metrics(dividends) -> tuple[float | None, float | None, int]:
    if dividends is None or getattr(dividends, "empty", True):
        return None, None, 0

    try:
        non_zero_dividends = dividends.dropna()
        non_zero_dividends = non_zero_dividends[non_zero_dividends > 0]
    except Exception:
        return None, None, 0

    if getattr(non_zero_dividends, "empty", True):
        return None, None, 0

    latest_payment_at = non_zero_dividends.index.max()
    trailing_start = latest_payment_at - timedelta(days=DDM_HISTORY_WINDOW_DAYS)
    lookback_start = latest_payment_at - timedelta(days=DDM_HISTORY_LOOKBACK_DAYS)

    trailing_window = non_zero_dividends[non_zero_dividends.index > trailing_start]
    previous_window = non_zero_dividends[
        (non_zero_dividends.index > lookback_start)
        & (non_zero_dividends.index <= trailing_start)
    ]
    lookback_window = non_zero_dividends[non_zero_dividends.index > lookback_start]

    trailing_twelve_month_dividend = _coerce_number(trailing_window.sum())
    previous_twelve_month_dividend = _coerce_number(previous_window.sum())
    event_count_24m = int(getattr(lookback_window, "size", 0))

    return trailing_twelve_month_dividend, previous_twelve_month_dividend, event_count_24m


def _resolve_annual_dividend(
    info: dict[str, Any],
    trailing_twelve_month_dividend: float | None,
) -> tuple[float | None, str | None]:
    for key, source_name in (
        ("dividendRate", "reported_dividend_rate"),
        ("trailingAnnualDividendRate", "trailing_annual_dividend_rate"),
    ):
        value = _coerce_number(info.get(key))
        if value is not None and value > 0:
            return value, source_name

    if trailing_twelve_month_dividend is not None and trailing_twelve_month_dividend > 0:
        return trailing_twelve_month_dividend, "trailing_twelve_month_sum"

    return None, None


def _extract_market_code(symbol: str, exchange: str, info: dict[str, Any]) -> tuple[str, str]:
    market_hint = str(info.get("market") or "").lower()
    country_hint = str(info.get("country") or "").lower()

    if (
        symbol.endswith(".T")
        or exchange in JP_EXCHANGES
        or "japan" in country_hint
        or market_hint.startswith("jp")
    ):
        return "JP", "jp"

    if exchange:
        return "US", "us"

    raise SidecarError(
        error_code="UNSUPPORTED_MARKET",
        message="This market is not supported in the MVP.",
        retryable=False,
    )


def _normalize_search_name(value: object) -> str | None:
    if not isinstance(value, str):
        return None

    normalized = value.strip()
    return normalized or None


def _is_supported_search_candidate(symbol: str, exchange: str, quote_type: str) -> bool:
    if quote_type.upper() != "EQUITY":
        return False

    normalized_exchange = exchange.upper()
    if symbol.endswith(".T") or normalized_exchange in JP_EXCHANGES:
        return True

    return normalized_exchange in US_EXCHANGES


def _default_currency_for_exchange(exchange: str) -> str:
    normalized_exchange = exchange.upper()
    if normalized_exchange in JP_EXCHANGES:
        return "JPY"
    return "USD"


def fetch_search(query: str) -> SearchData:
    if yf is None or not hasattr(yf, "Search"):
        raise SidecarError(
            error_code="SEARCH_PROVIDER_FAILED",
            message="Company-name search is not available right now.",
            retryable=True,
        )

    normalized_query = query.strip()

    try:
        search = yf.Search(
            query=normalized_query,
            max_results=8,
            news_count=0,
            lists_count=0,
            recommended=0,
            include_cb=False,
            enable_fuzzy_query=True,
            raise_errors=False,
        )
        quote_items = getattr(search, "quotes", []) or []
    except Exception as error:
        raise SidecarError(
            error_code="SEARCH_PROVIDER_FAILED",
            message="Company-name search is temporarily unavailable.",
            retryable=True,
        ) from error

    deduped_results: dict[str, SearchResultData] = {}
    for item in quote_items:
        if not isinstance(item, dict):
            continue

        symbol = str(item.get("symbol") or "").strip().upper()
        exchange = normalize_exchange(item.get("exchange"))
        quote_type = str(item.get("quoteType") or item.get("typeDisp") or "").strip().upper()
        if not symbol or exchange is None or not quote_type:
            continue

        if not _is_supported_search_candidate(symbol, exchange, quote_type):
            continue

        result = SearchResultData(
            symbol=symbol,
            short_name=_normalize_search_name(item.get("shortname")),
            long_name=_normalize_search_name(item.get("longname")),
            exchange=exchange,
            quote_type=quote_type,
            currency=normalize_currency(item.get("currency") or _default_currency_for_exchange(exchange)),
        )
        deduped_results[symbol] = result

    return SearchData(
        query=normalized_query,
        results=list(deduped_results.values()),
    )


def fetch_quote(ticker: str) -> QuoteData:
    if yf is None:
        raise SidecarError(
            error_code="MARKET_DATA_FETCH_FAILED",
            message="Market data dependency is not installed.",
            retryable=False,
        )

    symbol = ticker.strip().upper()

    try:
        ticker_client = yf.Ticker(symbol)
        try:
            fast_info = ticker_client.fast_info
        except Exception:
            fast_info = None

        try:
            history = ticker_client.history(period="5d", interval="1d", auto_adjust=False, actions=False)
        except Exception:
            history = None

        info, _ = _safe_get_ticker_info(ticker_client)
    except Exception as error:
        raise SidecarError(
            error_code="MARKET_DATA_FETCH_FAILED",
            message="Failed to fetch market data.",
            retryable=True,
        ) from error

    current_price = _extract_current_price(fast_info, info, history)
    previous_close = _extract_previous_close(fast_info, info, history)
    exchange = _extract_exchange(fast_info, info)

    if _is_symbol_not_found(current_price, previous_close, exchange, history):
        raise SidecarError(
            error_code="SEARCH_NO_RESULT",
            message="Ticker not found.",
            retryable=False,
        )

    company_name = normalize_company_name(info.get("shortName"), info.get("longName"), symbol)
    currency = normalize_currency(info.get("currency") or _mapping_get(fast_info, "currency"))
    if current_price is None or current_price <= 0:
        raise SidecarError(
            error_code="MARKET_DATA_FETCH_FAILED",
            message="Current price data could not be loaded.",
            retryable=True,
        )

    if previous_close is None or previous_close <= 0:
        raise SidecarError(
            error_code="MARKET_DATA_FETCH_FAILED",
            message="Previous close data could not be loaded.",
            retryable=True,
        )

    if exchange is None:
        raise SidecarError(
            error_code="MARKET_DATA_FETCH_FAILED",
            message="Exchange data could not be loaded.",
            retryable=True,
        )

    change = calculate_change(current_price, previous_close)
    change_percent = calculate_change_percent(change, previous_close)

    return QuoteData(
        ticker=symbol,
        company_name=company_name,
        current_price=current_price,
        previous_close=previous_close,
        change=change,
        change_percent=change_percent,
        currency=currency,
        exchange=exchange,
        as_of=utc_now_iso(),
    )


def fetch_chart(ticker: str, chart_range: str) -> ChartData:
    if yf is None:
        raise SidecarError(
            error_code="HISTORICAL_DATA_FETCH_FAILED",
            message="Market data dependency is not installed.",
            retryable=False,
        )

    symbol = ticker.strip().upper()
    period = CHART_RANGE_PERIODS.get(chart_range)
    interval = CHART_RANGE_INTERVALS.get(chart_range)

    if period is None or interval is None:
        raise SidecarError(
            error_code="HISTORICAL_DATA_FETCH_FAILED",
            message="Chart range is not supported.",
            retryable=False,
        )

    try:
        ticker_client = yf.Ticker(symbol)
        history = ticker_client.history(period=period, interval=interval, auto_adjust=False, actions=False)
    except Exception as error:
        raise SidecarError(
            error_code="HISTORICAL_DATA_FETCH_FAILED",
            message="Chart data could not be loaded.",
            retryable=True,
        ) from error

    if history is None or history.empty:
        try:
            fetch_quote(symbol)
        except SidecarError as error:
            if error.error_code in {"INVALID_SYMBOL_FORMAT", "SEARCH_NO_RESULT"}:
                raise error

        raise SidecarError(
            error_code="HISTORICAL_DATA_FETCH_FAILED",
            message="Chart data could not be loaded.",
            retryable=True,
        )

    required_columns = ("Open", "High", "Low", "Close", "Volume")
    if any(column not in history.columns for column in required_columns):
        raise SidecarError(
            error_code="HISTORICAL_DATA_FETCH_FAILED",
            message="Chart data could not be loaded.",
            retryable=True,
        )

    normalized_history = history.loc[:, list(required_columns)].copy()
    normalized_history = normalized_history.dropna(subset=["Open", "High", "Low", "Close"])
    normalized_history["Volume"] = normalized_history["Volume"].fillna(0)

    if normalized_history.empty:
        raise SidecarError(
            error_code="HISTORICAL_DATA_FETCH_FAILED",
            message="Chart data could not be loaded.",
            retryable=True,
        )

    for moving_average_name, window in MOVING_AVERAGE_WINDOWS.items():
        normalized_history[moving_average_name] = normalized_history["Close"].rolling(window=window).mean()

    candles: list[CandleData] = []
    moving_averages = {
        "ma25": [],
        "ma75": [],
        "ma200": [],
    }

    for timestamp, row in normalized_history.iterrows():
        candle_date = normalize_iso_date(timestamp)
        open_price = coerce_price(row["Open"])
        high_price = coerce_price(row["High"])
        low_price = coerce_price(row["Low"])
        close_price = coerce_price(row["Close"])
        volume = coerce_volume(row["Volume"])

        if (
            candle_date is None
            or open_price is None
            or high_price is None
            or low_price is None
            or close_price is None
            or volume is None
        ):
            continue

        candles.append(
            CandleData(
                date=candle_date,
                open=open_price,
                high=high_price,
                low=low_price,
                close=close_price,
                volume=volume,
            )
        )

        for moving_average_name in MOVING_AVERAGE_WINDOWS:
            value = coerce_price(row[moving_average_name])
            if value is None:
                continue

            moving_averages[moving_average_name].append(
                MovingAveragePoint(
                    date=candle_date,
                    value=value,
                )
            )

    if not candles:
        raise SidecarError(
            error_code="HISTORICAL_DATA_FETCH_FAILED",
            message="Chart data could not be loaded.",
            retryable=True,
        )

    return ChartData(
        ticker=symbol,
        chart_range=chart_range,
        candles=candles,
        moving_averages=MovingAverageSeries(
            ma25=moving_averages["ma25"],
            ma75=moving_averages["ma75"],
            ma200=moving_averages["ma200"],
        ),
    )


def fetch_valuation_context(ticker: str) -> ValuationContext:
    if yf is None:
        raise SidecarError(
            error_code="FINANCIAL_DATA_FETCH_FAILED",
            message="Market data dependency is not installed.",
            retryable=False,
        )

    quote = fetch_quote(ticker)

    try:
        ticker_client = yf.Ticker(quote.ticker)
    except Exception as error:
        raise SidecarError(
            error_code="FINANCIAL_DATA_FETCH_FAILED",
            message="Financial data could not be loaded.",
            retryable=True,
        ) from error

    info, info_failed = _safe_get_ticker_info(ticker_client)
    income_stmt, income_failed = _safe_get_statement(ticker_client, "income_stmt")
    balance_sheet, balance_failed = _safe_get_statement(ticker_client, "balance_sheet")
    cash_flow, cash_flow_failed = _safe_get_statement(ticker_client, "cash_flow")
    dividends, dividends_failed = _safe_get_dividends(ticker_client)

    if info_failed and income_failed and balance_failed and cash_flow_failed and dividends_failed:
        raise SidecarError(
            error_code="FINANCIAL_DATA_FETCH_FAILED",
            message="Financial data could not be loaded.",
            retryable=True,
        )

    market_code, region = _extract_market_code(quote.ticker, quote.exchange, info)
    market_assumptions = MARKET_ASSUMPTIONS[market_code]

    shares_outstanding = _coerce_number(info.get("sharesOutstanding"))
    enterprise_value = _coerce_number(info.get("enterpriseValue"))
    ebitda = _coerce_number(info.get("ebitda"))
    book_value_equity = (
        _extract_statement_value(balance_sheet, BOOK_VALUE_ROWS)
        or _coerce_number(info.get("totalStockholderEquity"))
    )
    net_income = (
        _coerce_number(info.get("netIncomeToCommon"))
        or _extract_statement_value(income_stmt, NET_INCOME_ROWS)
    )
    eps_ttm = _coerce_number(info.get("trailingEps"))
    bps = _coerce_number(info.get("bookValue"))
    if bps is None and book_value_equity is not None and shares_outstanding and shares_outstanding > 0:
        bps = book_value_equity / shares_outstanding

    free_cash_flow = (
        _coerce_number(info.get("freeCashflow"))
        or _extract_statement_value(cash_flow, FREE_CASH_FLOW_ROWS)
    )
    operating_cash_flow = (
        _coerce_number(info.get("operatingCashflow"))
        or _extract_statement_value(cash_flow, OPERATING_CASH_FLOW_ROWS)
    )
    capital_expenditure = _extract_statement_value(cash_flow, CAPITAL_EXPENDITURE_ROWS)
    total_cash = (
        _coerce_number(info.get("totalCash"))
        or _extract_statement_value(balance_sheet, TOTAL_CASH_ROWS)
    )
    total_debt = (
        _coerce_number(info.get("totalDebt"))
        or _extract_statement_value(balance_sheet, TOTAL_DEBT_ROWS)
    )
    trailing_twelve_month_dividend, previous_twelve_month_dividend, dividend_event_count_24m = (
        _extract_dividend_history_metrics(dividends)
    )
    annual_dividend, annual_dividend_source = _resolve_annual_dividend(
        info,
        trailing_twelve_month_dividend,
    )

    return ValuationContext(
        ticker=quote.ticker,
        company_name=normalize_company_name(info.get("shortName"), info.get("longName"), quote.company_name),
        current_price=quote.current_price,
        currency=quote.currency,
        exchange=quote.exchange,
        market_code=market_code,
        region=region,
        sector=info.get("sector") if isinstance(info.get("sector"), str) else None,
        industry=info.get("industry") if isinstance(info.get("industry"), str) else None,
        eps_ttm=eps_ttm,
        bps=bps,
        enterprise_value=enterprise_value,
        ebitda=ebitda,
        book_value_equity=book_value_equity,
        shares_outstanding=shares_outstanding,
        net_income=net_income,
        roe=_coerce_number(info.get("returnOnEquity")),
        annual_dividend=annual_dividend,
        annual_dividend_source=annual_dividend_source,
        trailing_twelve_month_dividend=trailing_twelve_month_dividend,
        previous_twelve_month_dividend=previous_twelve_month_dividend,
        dividend_event_count_24m=dividend_event_count_24m,
        free_cash_flow=free_cash_flow,
        operating_cash_flow=operating_cash_flow,
        capital_expenditure=capital_expenditure,
        total_cash=total_cash,
        total_debt=total_debt,
        market_assumptions=market_assumptions,
    )


def _normalize_peer_multiple(value: object, upper_bound: float) -> float | None:
    numeric = _coerce_number(value)
    if numeric is None or numeric <= 0 or numeric > upper_bound:
        return None
    return numeric


def _build_peer_set(peers: list[PeerSnapshot], selection_basis: str) -> PeerSet:
    per_values = [
        peer.trailing_pe
        for peer in peers
        if peer.trailing_pe is not None
    ]
    pbr_values = [
        peer.price_to_book
        for peer in peers
        if peer.price_to_book is not None
    ]
    ev_to_ebitda_values = [
        peer.ev_to_ebitda
        for peer in peers
        if peer.ev_to_ebitda is not None
    ]

    return PeerSet(
        peers=peers,
        selection_basis=selection_basis,
        median_per=median_or_none(per_values),
        median_pbr=median_or_none(pbr_values),
        median_ev_to_ebitda=median_or_none(ev_to_ebitda_values),
        median_per_count=len(per_values),
        median_pbr_count=len(pbr_values),
        median_ev_to_ebitda_count=len(ev_to_ebitda_values),
    )


def _screen_peers(
    field: str,
    value: str,
    region: str,
    current_symbol: str,
) -> list[PeerSnapshot]:
    if yf is None or not hasattr(yf, "screen") or not hasattr(yf, "EquityQuery"):
        raise SidecarError(
            error_code="PEER_DATA_FETCH_FAILED",
            message="Peer comparison data provider is not available.",
            retryable=True,
        )

    query = yf.EquityQuery(
        "AND",
        [
            yf.EquityQuery("EQ", [field, value]),
            yf.EquityQuery("EQ", ["region", region]),
        ],
    )
    result = yf.screen(
        query,
        size=PEER_REQUEST_SIZE,
        sortField="intradaymarketcap",
        sortAsc=False,
    )

    quote_items = result.get("quotes") if isinstance(result, dict) else None
    if not isinstance(quote_items, list):
        return []

    deduped: dict[str, PeerSnapshot] = {}
    for item in quote_items:
        if not isinstance(item, dict):
            continue

        symbol = str(item.get("symbol") or "").strip().upper()
        if not symbol or symbol == current_symbol:
            continue

        peer = PeerSnapshot(
            symbol=symbol,
            company_name=normalize_company_name(item.get("shortName"), item.get("longName"), symbol),
            exchange=normalize_exchange(item.get("exchange")),
            currency=normalize_currency(item.get("currency")),
            market_cap=_coerce_number(item.get("marketCap")),
            trailing_pe=_normalize_peer_multiple(item.get("trailingPE"), MAX_REASONABLE_PER),
            price_to_book=_normalize_peer_multiple(item.get("priceToBook"), MAX_REASONABLE_PBR),
            enterprise_value=None,
            ebitda=None,
            ev_to_ebitda=None,
        )
        deduped[symbol] = peer

    ordered_peers = sorted(
        deduped.values(),
        key=lambda peer: peer.market_cap or 0,
        reverse=True,
    )
    return ordered_peers[:PEER_TARGET_COUNT]


def fetch_peer_selection(context: ValuationContext) -> PeerSelectionResult:
    selection_attempts: list[tuple[str, str, str]] = []
    if context.industry:
        selection_attempts.append(("industry", context.industry, f"industry:{context.industry}"))
    if context.sector:
        selection_attempts.append(("sector", context.sector, f"sector:{context.sector}"))

    if not selection_attempts:
        return PeerSelectionResult(peer_set=None)

    best_peer_set: PeerSet | None = None
    saw_fetch_error = False

    for field, value, label in selection_attempts:
        try:
            peers = _screen_peers(field, value, context.region, context.ticker)
        except SidecarError:
            saw_fetch_error = True
            continue
        except Exception:
            saw_fetch_error = True
            continue

        peer_set = _build_peer_set(peers, label)
        if best_peer_set is None or len(peer_set.peers) > len(best_peer_set.peers):
            best_peer_set = peer_set

        if len(peer_set.peers) >= PEER_MINIMUM_COUNT:
            return PeerSelectionResult(peer_set=peer_set)

    if best_peer_set is not None:
        return PeerSelectionResult(peer_set=best_peer_set)

    if saw_fetch_error:
        return PeerSelectionResult(
            peer_set=None,
            error_code="PEER_DATA_FETCH_FAILED",
            message="Peer comparison data could not be loaded.",
        )

    return PeerSelectionResult(peer_set=None)


def _enrich_peer_with_ev_ebitda(peer: PeerSnapshot) -> tuple[PeerSnapshot, bool]:
    if yf is None:
        return peer, True

    try:
        ticker_client = yf.Ticker(peer.symbol)
    except Exception:
        return peer, True

    info, info_failed = _safe_get_ticker_info(ticker_client)
    enterprise_value = _coerce_number(info.get("enterpriseValue"))
    ebitda = _coerce_number(info.get("ebitda"))
    ev_to_ebitda = _normalize_ev_to_ebitda(info.get("enterpriseToEbitda"))
    if ev_to_ebitda is None and enterprise_value is not None and ebitda is not None and ebitda > 0:
        ev_to_ebitda = _normalize_ev_to_ebitda(enterprise_value / ebitda)

    return (
        PeerSnapshot(
            symbol=peer.symbol,
            company_name=peer.company_name,
            exchange=peer.exchange,
            currency=peer.currency,
            market_cap=peer.market_cap,
            trailing_pe=peer.trailing_pe,
            price_to_book=peer.price_to_book,
            enterprise_value=enterprise_value,
            ebitda=ebitda,
            ev_to_ebitda=ev_to_ebitda,
        ),
        info_failed,
    )


def fetch_ev_ebitda_peer_selection(peer_selection: PeerSelectionResult) -> PeerSelectionResult:
    if peer_selection.error_code is not None or peer_selection.peer_set is None:
        return peer_selection

    enriched_peers: list[PeerSnapshot] = []
    saw_fetch_error = False

    for peer in peer_selection.peer_set.peers:
        enriched_peer, info_failed = _enrich_peer_with_ev_ebitda(peer)
        if info_failed:
            saw_fetch_error = True
        enriched_peers.append(enriched_peer)

    enriched_peer_set = _build_peer_set(enriched_peers, peer_selection.peer_set.selection_basis)
    if enriched_peer_set.median_ev_to_ebitda_count == 0 and saw_fetch_error:
        return PeerSelectionResult(
            peer_set=None,
            error_code="PEER_DATA_FETCH_FAILED",
            message="Peer EV/EBITDA data could not be loaded.",
        )

    return PeerSelectionResult(peer_set=enriched_peer_set)
