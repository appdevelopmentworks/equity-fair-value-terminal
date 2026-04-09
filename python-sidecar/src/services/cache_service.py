from __future__ import annotations

from dataclasses import dataclass, field
from time import time


@dataclass(slots=True)
class CacheEntry:
    value: object
    expires_at: float


@dataclass(slots=True)
class CacheService:
    store: dict[str, CacheEntry] = field(default_factory=dict)

    def get(self, key: str) -> object | None:
        entry = self.store.get(key)
        if not entry or entry.expires_at < time():
            self.store.pop(key, None)
            return None
        return entry.value

    def set(self, key: str, value: object, ttl_seconds: int) -> None:
        self.store[key] = CacheEntry(value=value, expires_at=time() + ttl_seconds)

