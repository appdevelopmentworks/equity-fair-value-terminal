from __future__ import annotations

from models.request_models import QuoteRequest
from models.response_models import SidecarSuccessResponse
from services.yfinance_client import fetch_quote


def handle_quote(raw_ticker: str) -> dict[str, object]:
    request = QuoteRequest.from_input(raw_ticker)
    quote = fetch_quote(request.ticker)

    return SidecarSuccessResponse(
        ticker=quote.ticker,
        company_name=quote.company_name,
        current_price=quote.current_price,
        previous_close=quote.previous_close,
        change=quote.change,
        change_percent=quote.change_percent,
        currency=quote.currency,
        exchange=quote.exchange,
        as_of=quote.as_of,
    ).to_dict()
