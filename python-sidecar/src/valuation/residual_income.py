from __future__ import annotations

import math

from valuation.common import (
    ValuationContext,
    ValuationMethodResult,
    build_ok_result,
    build_unavailable_result,
)
from valuation.constants import (
    FORECAST_YEARS,
    MAX_REASONABLE_ROE,
    MIN_REASONABLE_ROE,
)


METHOD_ID = "residual_income"
METHOD_NAME = "Residual Income"


def _resolve_roe(context: ValuationContext) -> float | None:
    if context.roe is not None:
        return context.roe

    if (
        context.net_income is not None
        and context.book_value_equity is not None
        and context.book_value_equity > 0
    ):
        return context.net_income / context.book_value_equity

    return None


def calculate(context: ValuationContext) -> ValuationMethodResult:
    inputs = {
        "book_value_equity": context.book_value_equity,
        "shares_outstanding": context.shares_outstanding,
        "net_income": context.net_income,
        "reported_roe": context.roe,
    }

    if context.book_value_equity is None or context.book_value_equity <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_FINANCIAL_DATA",
            "Book value equity is missing for the residual income valuation.",
            inputs=inputs,
        )

    if context.shares_outstanding is None or context.shares_outstanding <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "MISSING_FINANCIAL_DATA",
            "Shares outstanding is missing for the residual income valuation.",
            inputs=inputs,
        )

    stable_roe = _resolve_roe(context)
    if stable_roe is None:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "RESIDUAL_INCOME_INPUT_INSUFFICIENT",
            "ROE could not be determined for the residual income valuation.",
            inputs=inputs,
        )

    if stable_roe < MIN_REASONABLE_ROE or stable_roe > MAX_REASONABLE_ROE:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "RESIDUAL_INCOME_INPUT_INSUFFICIENT",
            "ROE is too distorted for a stable residual income valuation.",
            inputs=inputs,
        )

    cost_of_equity = context.market_assumptions.cost_of_equity
    terminal_growth = context.market_assumptions.terminal_growth
    if cost_of_equity <= terminal_growth:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "RESIDUAL_INCOME_INPUT_INSUFFICIENT",
            "Residual income assumptions are not internally consistent.",
            inputs=inputs,
        )

    annual_net_income = context.book_value_equity * stable_roe
    annual_residual_income = annual_net_income - (cost_of_equity * context.book_value_equity)
    present_value_of_residual_income = sum(
        annual_residual_income / ((1 + cost_of_equity) ** year)
        for year in range(1, FORECAST_YEARS + 1)
    )
    terminal_residual_income = annual_residual_income * (1 + terminal_growth)
    terminal_value = terminal_residual_income / (cost_of_equity - terminal_growth)
    present_value_of_terminal = terminal_value / ((1 + cost_of_equity) ** FORECAST_YEARS)
    equity_value = (
        context.book_value_equity
        + present_value_of_residual_income
        + present_value_of_terminal
    )
    fair_value = equity_value / context.shares_outstanding

    if not math.isfinite(fair_value) or fair_value <= 0:
        return build_unavailable_result(
            METHOD_ID,
            METHOD_NAME,
            context,
            "RESIDUAL_INCOME_INPUT_INSUFFICIENT",
            "Residual income inputs did not produce a usable fair value.",
            inputs=inputs,
        )

    return build_ok_result(
        METHOD_ID,
        METHOD_NAME,
        fair_value,
        context,
        inputs={
            **inputs,
            "stable_roe": stable_roe,
        },
        assumptions={
            "cost_of_equity": cost_of_equity,
            "terminal_growth": terminal_growth,
            "forecast_years": FORECAST_YEARS,
            "annual_residual_income": annual_residual_income,
        },
    )
