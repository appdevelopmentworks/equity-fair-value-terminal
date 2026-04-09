from __future__ import annotations

from datetime import date, datetime
import math

def coerce_price(value: object) -> float | None:
    if value is None:
        return None

    try:
        price = float(value)
    except (TypeError, ValueError):
        return None

    if not math.isfinite(price):
        return None

    return round(price, 2)


def coerce_volume(value: object) -> int | None:
    if value is None:
        return None

    try:
        volume = int(float(value))
    except (TypeError, ValueError):
        return None

    if not math.isfinite(volume):
        return None

    return max(volume, 0)


def normalize_exchange(exchange: object) -> str | None:
    if isinstance(exchange, str) and exchange.strip():
        return exchange.strip().upper()
    return None


def normalize_iso_date(value: object) -> str | None:
    if hasattr(value, "to_pydatetime"):
        try:
            value = value.to_pydatetime()  # type: ignore[assignment]
        except Exception:
            pass

    if isinstance(value, datetime):
        return value.date().isoformat()

    if isinstance(value, date):
        return value.isoformat()

    return None


def calculate_change(current_price: float, previous_close: float) -> float:
    return round(current_price - previous_close, 2)


def calculate_change_percent(change: float, previous_close: float) -> float:
    if previous_close == 0:
        raise ValueError("previous_close must not be zero")
    return round((change / previous_close) * 100, 2)


def normalize_company_name(short_name: object, long_name: object, ticker: str) -> str:
    for candidate in (long_name, short_name):
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    return ticker


def normalize_currency(currency: object) -> str:
    if isinstance(currency, str) and currency.strip():
        return currency.strip().upper()
    return "USD"
