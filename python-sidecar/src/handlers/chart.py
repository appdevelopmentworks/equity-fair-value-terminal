from __future__ import annotations

from models.request_models import ChartRequest
from models.response_models import (
    SidecarCandleResponse,
    SidecarChartSuccessResponse,
    SidecarMovingAveragePointResponse,
    SidecarMovingAveragesResponse,
)
from services.yfinance_client import fetch_chart


def handle_chart(raw_ticker: str, raw_range: str) -> dict[str, object]:
    request = ChartRequest.from_input(raw_ticker, raw_range)
    chart = fetch_chart(request.ticker, request.chart_range)

    return SidecarChartSuccessResponse(
        ticker=chart.ticker,
        chart_range=chart.chart_range,
        candles=[
            SidecarCandleResponse(
                date=candle.date,
                open=candle.open,
                high=candle.high,
                low=candle.low,
                close=candle.close,
                volume=candle.volume,
            )
            for candle in chart.candles
        ],
        moving_averages=SidecarMovingAveragesResponse(
            ma25=[
                SidecarMovingAveragePointResponse(date=point.date, value=point.value)
                for point in chart.moving_averages.ma25
            ],
            ma75=[
                SidecarMovingAveragePointResponse(date=point.date, value=point.value)
                for point in chart.moving_averages.ma75
            ],
            ma200=[
                SidecarMovingAveragePointResponse(date=point.date, value=point.value)
                for point in chart.moving_averages.ma200
            ],
        ),
    ).to_dict()
