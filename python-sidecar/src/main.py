from __future__ import annotations

import argparse
import json
import sys

from handlers.chart import handle_chart
from handlers.quote import handle_quote
from handlers.search import handle_search
from handlers.valuation import handle_valuations_only
from models.response_models import SidecarError, SidecarErrorResponse
from utils.logging import configure_logger


LOGGER = configure_logger()


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="eqfv-python-sidecar")
    subparsers = parser.add_subparsers(dest="command")

    quote_parser = subparsers.add_parser("quote")
    quote_parser.add_argument("ticker")

    chart_parser = subparsers.add_parser("chart")
    chart_parser.add_argument("ticker")
    chart_parser.add_argument("chart_range")

    search_parser = subparsers.add_parser("search")
    search_parser.add_argument("query")

    valuations_parser = subparsers.add_parser("valuations-only")
    valuations_parser.add_argument("ticker")

    return parser


def emit(payload: dict[str, object]) -> int:
    print(json.dumps(payload, ensure_ascii=False))
    return 0


def main(argv: list[str] | None = None) -> int:
    args_list = argv if argv is not None else sys.argv[1:]

    try:
        if len(args_list) == 1 and not args_list[0].startswith("-"):
            return emit(handle_quote(args_list[0]))

        parser = build_parser()
        args = parser.parse_args(args_list)

        if args.command == "quote":
            return emit(handle_quote(args.ticker))
        if args.command == "chart":
            return emit(handle_chart(args.ticker, args.chart_range))
        if args.command == "search":
            return emit(handle_search(args.query))
        if args.command == "valuations-only":
            return emit(handle_valuations_only(args.ticker))

        return emit(
            SidecarErrorResponse(
                error_code="INVALID_SYMBOL_FORMAT",
                message="Ticker or command is missing.",
                retryable=False,
            ).to_dict()
        )
    except SidecarError as sidecar_error:
        LOGGER.warning("%s: %s", sidecar_error.error_code, sidecar_error.message)
        return emit(sidecar_error.to_response().to_dict())
    except Exception:
        LOGGER.exception("unexpected sidecar failure")
        return emit(
            SidecarErrorResponse(
                error_code="INTERNAL_ERROR",
                message="Internal sidecar error.",
                retryable=True,
            ).to_dict()
        )


if __name__ == "__main__":
    raise SystemExit(main())
