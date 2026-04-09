from __future__ import annotations

from models.request_models import SearchRequest
from models.response_models import SidecarSearchCandidateResponse, SidecarSearchSuccessResponse
from services.yfinance_client import fetch_search


def handle_search(raw_query: str) -> dict[str, object]:
    request = SearchRequest.from_input(raw_query)
    search = fetch_search(request.query)

    return SidecarSearchSuccessResponse(
        query=search.query,
        results=[
            SidecarSearchCandidateResponse(
                symbol=result.symbol,
                short_name=result.short_name,
                long_name=result.long_name,
                exchange=result.exchange,
                quote_type=result.quote_type,
                currency=result.currency,
            )
            for result in search.results
        ],
    ).to_dict()
