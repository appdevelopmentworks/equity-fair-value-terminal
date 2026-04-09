from __future__ import annotations

from valuation.common import MarketAssumptions


FORECAST_YEARS = 5
PEER_MINIMUM_COUNT = 5
PEER_TARGET_COUNT = 12
PEER_REQUEST_SIZE = 18
MAX_REASONABLE_PER = 80.0
MAX_REASONABLE_PBR = 50.0
# Keep EV/EBITDA in a conservative range so extreme distressed or hyper-growth
# outliers do not dominate the peer median.
MAX_REASONABLE_EV_TO_EBITDA = 60.0
DDM_HISTORY_WINDOW_DAYS = 365
DDM_HISTORY_LOOKBACK_DAYS = 730
MIN_DDM_HISTORY_EVENTS = 2

# Residual income becomes misleading when equity is unusually thin, so keep ROE within a
# conservative sanity band and mark the method unavailable outside it.
MIN_REASONABLE_ROE = -0.50
MAX_REASONABLE_ROE = 0.60

MARKET_ASSUMPTIONS = {
    "US": MarketAssumptions(
        market_code="US",
        cost_of_equity=0.10,
        discount_rate=0.10,
        growth_rate=0.06,
        terminal_growth=0.02,
    ),
    "JP": MarketAssumptions(
        market_code="JP",
        cost_of_equity=0.08,
        discount_rate=0.08,
        growth_rate=0.04,
        terminal_growth=0.01,
    ),
}
