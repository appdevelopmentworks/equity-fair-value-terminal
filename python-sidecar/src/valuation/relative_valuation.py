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


METHOD_ID = "relative_valuation"
METHOD_NAME = "Relative Valuation"


def calculate(
    context: ValuationContext,
    peer_selection: PeerSelectionResult,
) -> ValuationMethodResult:
    inputs = {
        "eps_ttm": context.eps_ttm,
        "bps": context.bps,
    }

    if peer_selection.error_code is not None:
        return build_error_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            peer_selection.error_code,
            peer_selection.message or "Peer comparison data could not be loaded.",
        )

    peer_set = peer_selection.peer_set
    if peer_set is None or len(peer_set.peers) < PEER_MINIMUM_COUNT:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "INVALID_PEER_SET",
            "A usable peer set could not be selected for relative valuation.",
            inputs=inputs,
        )

    component_values: list[float] = []
    assumptions: dict[str, object] = {
        "peer_count": len(peer_set.peers),
        "peer_selection_basis": peer_set.selection_basis,
    }

    if (
        context.eps_ttm is not None
        and context.eps_ttm > 0
        and peer_set.median_per is not None
        and peer_set.median_per_count >= PEER_MINIMUM_COUNT
    ):
        per_component = context.eps_ttm * peer_set.median_per
        component_values.append(per_component)
        assumptions["median_per"] = peer_set.median_per
        assumptions["median_per_peer_count"] = peer_set.median_per_count
        assumptions["per_component_fair_value"] = per_component

    if (
        context.bps is not None
        and context.bps > 0
        and peer_set.median_pbr is not None
        and peer_set.median_pbr_count >= PEER_MINIMUM_COUNT
    ):
        pbr_component = context.bps * peer_set.median_pbr
        component_values.append(pbr_component)
        assumptions["median_pbr"] = peer_set.median_pbr
        assumptions["median_pbr_peer_count"] = peer_set.median_pbr_count
        assumptions["pbr_component_fair_value"] = pbr_component

    if not component_values:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "INVALID_PEER_SET",
            "Usable peer PER or PBR inputs were not available for relative valuation.",
            inputs=inputs,
        )

    return build_ok_result(
        METHOD_ID,
        METHOD_NAME,
        sum(component_values) / len(component_values),
        context,
        inputs=inputs,
        assumptions={
            **assumptions,
            "blend_mode": "average",
            "component_count": len(component_values),
        },
    )
