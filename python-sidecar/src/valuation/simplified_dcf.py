from __future__ import annotations

import math

from valuation.common import (
    ValuationContext,
    ValuationMethodResult,
    build_ok_result,
    build_unavailable_result,
)
from valuation.constants import FORECAST_YEARS


METHOD_ID = "simplified_dcf"
METHOD_NAME = "Simplified DCF"


def _resolve_base_free_cash_flow(context: ValuationContext) -> tuple[float | None, str | None]:
    if context.free_cash_flow is not None and context.free_cash_flow > 0:
        return context.free_cash_flow, "reported_free_cash_flow"

    if (
        context.operating_cash_flow is not None
        and context.capital_expenditure is not None
    ):
        derived_free_cash_flow = context.operating_cash_flow + context.capital_expenditure
        if derived_free_cash_flow > 0:
            return derived_free_cash_flow, "operating_cash_flow_plus_capex"

    return None, None


def calculate(context: ValuationContext) -> ValuationMethodResult:
    base_free_cash_flow, cash_flow_source = _resolve_base_free_cash_flow(context)
    inputs = {
        "free_cash_flow": context.free_cash_flow,
        "operating_cash_flow": context.operating_cash_flow,
        "capital_expenditure": context.capital_expenditure,
        "shares_outstanding": context.shares_outstanding,
        "total_debt": context.total_debt,
        "total_cash": context.total_cash,
    }

    if base_free_cash_flow is None or cash_flow_source is None:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "DCF_INPUT_INSUFFICIENT",
            "Insufficient cash flow data for the simplified DCF calculation.",
            inputs=inputs,
        )

    if context.shares_outstanding is None or context.shares_outstanding <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_FINANCIAL_DATA",
            "Shares outstanding is missing for the simplified DCF calculation.",
            inputs=inputs,
        )

    if context.total_debt is None or context.total_cash is None:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "DCF_INPUT_INSUFFICIENT",
            "Debt and cash data are required for the simplified DCF calculation.",
            inputs=inputs,
        )

    discount_rate = context.market_assumptions.discount_rate
    growth_rate = context.market_assumptions.growth_rate
    terminal_growth = context.market_assumptions.terminal_growth
    if discount_rate <= terminal_growth:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "DCF_INPUT_INSUFFICIENT",
            "DCF assumptions are not internally consistent.",
            inputs=inputs,
        )

    projected_cash_flows: list[float] = []
    running_cash_flow = base_free_cash_flow
    present_value_of_cash_flows = 0.0

    for year in range(1, FORECAST_YEARS + 1):
        running_cash_flow *= 1 + growth_rate
        projected_cash_flows.append(running_cash_flow)
        present_value_of_cash_flows += running_cash_flow / ((1 + discount_rate) ** year)

    terminal_cash_flow = projected_cash_flows[-1] * (1 + terminal_growth)
    terminal_value = terminal_cash_flow / (discount_rate - terminal_growth)
    present_value_of_terminal = terminal_value / ((1 + discount_rate) ** FORECAST_YEARS)
    enterprise_value = present_value_of_cash_flows + present_value_of_terminal
    net_debt = context.total_debt - context.total_cash
    equity_value = enterprise_value - net_debt
    fair_value = equity_value / context.shares_outstanding

    if not math.isfinite(fair_value) or fair_value <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "DCF_INPUT_INSUFFICIENT",
            "The simplified DCF inputs did not produce a usable fair value.",
            inputs=inputs,
        )

    return build_ok_result(
        METHOD_ID,
        METHOD_NAME,
        fair_value,
        context,
        inputs={
            **inputs,
            "base_free_cash_flow": base_free_cash_flow,
        },
        assumptions={
            "discount_rate": discount_rate,
            "growth_rate": growth_rate,
            "terminal_growth": terminal_growth,
            "forecast_years": FORECAST_YEARS,
            "fcf_source": cash_flow_source,
            "net_debt": net_debt,
        },
    )
