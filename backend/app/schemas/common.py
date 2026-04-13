from typing import Any, Generic, TypeVar

from pydantic import BaseModel
from pydantic.generics import GenericModel

T = TypeVar("T")


class ApiResponse(GenericModel, Generic[T]):
    success: bool
    data: T | None = None
    error: str | None = None


class Pagination(BaseModel):
    items: list[Any]
    total: int
    page: int
    limit: int
