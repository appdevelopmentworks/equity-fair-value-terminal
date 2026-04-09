from __future__ import annotations

from valuation.common import (
    PeerSelectionResult,
    ValuationContext,
    ValuationMethodResult,
    build_error_result,
    build_ok_result,
    build_unavailable_result,
)
from valuation.constants import PEER_MINIMUM_COUNT


METHOD_ID = "per"
METHOD_NAME = "PER Valuation"


def calculate(
    context: ValuationContext,
    peer_selection: PeerSelectionResult,
) -> ValuationMethodResult:
    inputs = {
        "eps_ttm": context.eps_ttm,
    }

    if context.eps_ttm is None:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_FINANCIAL_DATA",
            "EPS data is missing for the PER valuation.",
            inputs=inputs,
        )

    if context.eps_ttm <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "NEGATIVE_EPS",
            "EPS is not positive, so the PER valuation cannot be calculated.",
            inputs=inputs,
        )

    if peer_selection.error_code is not None:
        return build_error_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            peer_selection.error_code,
            peer_selection.message or "Peer comparison data could not be loaded.",
        )

    peer_set = peer_selection.peer_set
    if (
        peer_set is None
        or len(peer_set.peers) < PEER_MINIMUM_COUNT
        or peer_set.median_per is None
        or peer_set.median_per_count < PEER_MINIMUM_COUNT
    ):
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "INVALID_PEER_SET",
            "A usable peer median PER could not be determined.",
            inputs=inputs,
        )

    return build_ok_result(
        METHOD_ID,
        METHOD_NAME,
        context.eps_ttm * peer_set.median_per,
        context,
        inputs=inputs,
        assumptions={
            "reference_per": peer_set.median_per,
            "peer_count": len(peer_set.peers),
            "peer_selection_basis": peer_set.selection_basis,
            "median_per_peer_count": peer_set.median_per_count,
        },
    )
