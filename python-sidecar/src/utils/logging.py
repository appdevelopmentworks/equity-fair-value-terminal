from __future__ import annotations

import logging


def configure_logger() -> logging.Logger:
    logger = logging.getLogger("eqfv-sidecar")

    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)

    logger.setLevel(logging.INFO)
    return logger

