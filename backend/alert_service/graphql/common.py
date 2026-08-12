from typing import Generic, TypeVar

import strawberry

T = TypeVar("T")

@strawberry.type
class Page(Generic[T]):
    count: int
    results: list[T]