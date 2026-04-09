from __future__ import annotations

from models.request_models import ValuationRequest
from models.response_models import (
    SidecarValuationIssueResponse,
    SidecarValuationMethodResponse,
    SidecarValuationsSuccessResponse,
)
from services.yfinance_client import (
    fetch_ev_ebitda_peer_selection,
    fetch_peer_selection,
    fetch_valuation_context,
)
from valuation import ddm, ev_ebitda_relative, pbr, per, relative_valuation, residual_income, simplified_dcf
from valuation.common import ValuationContext, ValuationMethodResult, build_error_result


def _run_method(
    context: ValuationContext,
    method_id: str,
    method_name: str,
    calculator,
) -> ValuationMethodResult:
    try:
        return calculator()
    except Exception:
        return build_error_result(
            method_id,
            method_name,
            context,
            "VALUATION_CALCULATION_FAILED",
            "This valuation method could not be calculated right now.",
        )


def handle_valuations_only(raw_ticker: str) -> dict[str, object]:
    request = ValuationRequest.from_input(raw_ticker)
    context = fetch_valuation_context(request.ticker)
    peer_selection = fetch_peer_selection(context)
    ev_ebitda_peer_selection = fetch_ev_ebitda_peer_selection(peer_selection)

    method_results = [
        _run_method(context, per.METHOD_ID, per.METHOD_NAME, lambda: per.calculate(context, peer_selection)),
        _run_method(context, pbr.METHOD_ID, pbr.METHOD_NAME, lambda: pbr.calculate(context, peer_selection)),
        _run_method(context, residual_income.METHOD_ID, residual_income.METHOD_NAME, lambda: residual_income.calculate(context)),
        _run_method(context, simplified_dcf.METHOD_ID, simplified_dcf.METHOD_NAME, lambda: simplified_dcf.calculate(context)),
        _run_method(
            context,
            relative_valuation.METHOD_ID,
            relative_valuation.METHOD_NAME,
            lambda: relative_valuation.calculate(context, peer_selection),
        ),
        _run_method(context, ddm.METHOD_ID, ddm.METHOD_NAME, lambda: ddm.calculate(context)),
        _run_method(
            context,
            ev_ebitda_relative.METHOD_ID,
            ev_ebitda_relative.METHOD_NAME,
            lambda: ev_ebitda_relative.calculate(context, ev_ebitda_peer_selection),
        ),
    ]

    issues = [issue for result in method_results if (issue := result.to_issue()) is not None]

    return SidecarValuationsSuccessResponse(
        symbol=context.ticker,
        currency=context.currency,
        valuations=[
            SidecarValuationMethodResponse(
                method_id=result.method_id,
                method_name=result.method_name,
                status=result.status,
                fair_value=result.fair_value,
                current_price=result.current_price,
                price_gap=result.price_gap,
                upside_downside_pct=result.upside_downside_pct,
                judgment=result.judgment,
                currency=result.currency,
                assumptions=result.assumptions,
                inputs=result.inputs,
                reason_if_unavailable=result.reason_if_unavailable,
            )
            for result in method_results
        ],
        errors=[
            SidecarValuationIssueResponse(
                scope=issue.scope,
                error_code=issue.error_code,
                message=issue.message,
            )
            for issue in issues
        ],
    ).to_dict()
