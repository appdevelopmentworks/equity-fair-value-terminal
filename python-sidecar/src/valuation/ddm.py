from __future__ import annotations

import math

from valuation.common import (
    ValuationContext,
    ValuationMethodResult,
    build_ok_result,
    build_unavailable_result,
)
from valuation.constants import MIN_DDM_HISTORY_EVENTS


METHOD_ID = "ddm"
METHOD_NAME = "Dividend Discount Model"


def calculate(context: ValuationContext) -> ValuationMethodResult:
    inputs = {
        "annual_dividend": context.annual_dividend,
        "trailing_twelve_month_dividend": context.trailing_twelve_month_dividend,
        "previous_twelve_month_dividend": context.previous_twelve_month_dividend,
        "dividend_event_count_24m": context.dividend_event_count_24m,
    }

    if context.annual_dividend is None or context.annual_dividend <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_DIVIDEND_DATA",
            "Dividend data is missing for the dividend discount model.",
            inputs=inputs,
        )

    if (
        context.dividend_event_count_24m < MIN_DDM_HISTORY_EVENTS
        or context.trailing_twelve_month_dividend is None
        or context.trailing_twelve_month_dividend <= 0
        or context.previous_twelve_month_dividend is None
        or context.previous_twelve_month_dividend <= 0
    ):
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "DDM_UNSUITABLE_DIVIDEND_HISTORY",
            "Dividend history is not stable enough for the dividend discount model.",
            inputs=inputs,
        )

    cost_of_equity = context.market_assumptions.cost_of_equity
    terminal_growth = context.market_assumptions.terminal_growth
    if cost_of_equity <= terminal_growth:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "DDM_UNSUITABLE_DIVIDEND_HISTORY",
            "DDM assumptions are not internally consistent.",
            inputs=inputs,
        )

    next_dividend = context.annual_dividend * (1 + terminal_growth)
    fair_value = next_dividend / (cost_of_equity - terminal_growth)
    if not math.isfinite(fair_value) or fair_value <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "DDM_UNSUITABLE_DIVIDEND_HISTORY",
            "Dividend inputs did not produce a usable DDM fair value.",
            inputs=inputs,
        )

    return build_ok_result(
        METHOD_ID,
        METHOD_NAME,
        fair_value,
        context,
        inputs=inputs,
        assumptions={
            "cost_of_equity": cost_of_equity,
            "terminal_growth": terminal_growth,
            "dividend_source": context.annual_dividend_source,
            "next_dividend": next_dividend,
        },
    )
