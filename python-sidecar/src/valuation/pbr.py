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


METHOD_ID = "pbr"
METHOD_NAME = "PBR Valuation"


def calculate(
    context: ValuationContext,
    peer_selection: PeerSelectionResult,
) -> ValuationMethodResult:
    inputs = {
        "bps": context.bps,
    }

    if context.bps is None:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_FINANCIAL_DATA",
            "BPS data is missing for the PBR valuation.",
            inputs=inputs,
        )

    if context.bps <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "NEGATIVE_BPS",
            "BPS is not positive, so the PBR valuation cannot be calculated.",
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
        or peer_set.median_pbr is None
        or peer_set.median_pbr_count < PEER_MINIMUM_COUNT
    ):
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "INVALID_PEER_SET",
            "A usable peer median PBR could not be determined.",
            inputs=inputs,
        )

    return build_ok_result(
        METHOD_ID,
        METHOD_NAME,
        context.bps * peer_set.median_pbr,
        context,
        inputs=inputs,
        assumptions={
            "reference_pbr": peer_set.median_pbr,
            "peer_count": len(peer_set.peers),
            "peer_selection_basis": peer_set.selection_basis,
            "median_pbr_peer_count": peer_set.median_pbr_count,
        },
    )
