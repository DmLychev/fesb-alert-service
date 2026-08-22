import strawberry
import strawberry_django
from strawberry import auto

from typing_extensions import Self

from typing import Optional

from ..models import IssueType as IssueTypeModel


@strawberry_django.type(IssueTypeModel)
class IssueTypeType:
    id: strawberry.ID
    code: int
    description: str
    scope: str


@strawberry_django.filter_type(IssueTypeModel, lookups=True)
class IssueTypeFilter:
    code: auto
    description: auto

    AND: Optional[list[Self]] = strawberry.UNSET
    OR: Optional[list[Self]] = strawberry.UNSET
    NOT: Optional[list[Self]] = strawberry.UNSET


@strawberry_django.order_type(IssueTypeModel)
class IssueTypeOrder:
    code: auto
    description: auto
