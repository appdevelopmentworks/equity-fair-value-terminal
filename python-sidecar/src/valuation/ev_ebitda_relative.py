from __future__ import annotations

import math

from valuation.common import (
    PeerSelectionResult,
    ValuationContext,
    ValuationMethodResult,
    build_error_result,
    build_ok_result,
    build_unavailable_result,
)
from valuation.constants import PEER_MINIMUM_COUNT


METHOD_ID = "ev_ebitda_relative"
METHOD_NAME = "EV/EBITDA Relative"


def calculate(
    context: ValuationContext,
    peer_selection: PeerSelectionResult,
) -> ValuationMethodResult:
    inputs = {
        "enterprise_value": context.enterprise_value,
        "ebitda": context.ebitda,
        "shares_outstanding": context.shares_outstanding,
        "total_debt": context.total_debt,
        "total_cash": context.total_cash,
    }

    if context.enterprise_value is None or context.enterprise_value <= 0 or context.ebitda is None or context.ebitda <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_EV_EBITDA_DATA",
            "Enterprise value or EBITDA data is missing for EV/EBITDA relative valuation.",
            inputs=inputs,
        )

    if context.shares_outstanding is None or context.shares_outstanding <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_FINANCIAL_DATA",
            "Shares outstanding is missing for EV/EBITDA relative valuation.",
            inputs=inputs,
        )

    if context.total_debt is None or context.total_cash is None:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_EV_EBITDA_DATA",
            "Debt and cash data are required for EV/EBITDA relative valuation.",
            inputs=inputs,
        )

    if peer_selection.error_code is not None:
        return build_error_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            peer_selection.error_code,
            peer_selection.message or "Peer EV/EBITDA data could not be loaded.",
        )

    peer_set = peer_selection.peer_set
    if (
        peer_set is None
        or len(peer_set.peers) < PEER_MINIMUM_COUNT
        or peer_set.median_ev_to_ebitda is None
        or peer_set.median_ev_to_ebitda_count < PEER_MINIMUM_COUNT
    ):
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "INVALID_PEER_SET",
            "A usable peer EV/EBITDA median could not be determined.",
            inputs=inputs,
        )

    net_debt = context.total_debt - context.total_cash
    fair_enterprise_value = context.ebitda * peer_set.median_ev_to_ebitda
    fair_equity_value = fair_enterprise_value - net_debt
    fair_value = fair_equity_value / context.shares_outstanding

    if not math.isfinite(fair_value) or fair_value <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_EV_EBITDA_DATA",
            "EV/EBITDA inputs did not produce a usable fair value.",
            inputs=inputs,
        )

    return build_ok_result(
        METHOD_ID,
        METHOD_NAME,
        fair_value,
        context,
        inputs=inputs,
        assumptions={
            "reference_ev_to_ebitda": peer_set.median_ev_to_ebitda,
            "peer_count": len(peer_set.peers),
            "peer_selection_basis": peer_set.selection_basis,
            "median_ev_to_ebitda_peer_count": peer_set.median_ev_to_ebitda_count,
            "net_debt": net_debt,
            "fair_enterprise_value": fair_enterprise_value,
        },
    )
