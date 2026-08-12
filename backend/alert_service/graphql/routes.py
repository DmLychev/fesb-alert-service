import datetime

import strawberry
import strawberry_django
from strawberry import auto

from typing_extensions import Self
from typing import Optional

from ..models import Route


@strawberry_django.type(Route)
class RouteType:
    id: strawberry.ID
    name: str
    description: str
    domain_name: str
    is_active: bool
    is_tracked: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime


@strawberry_django.filter_type(Route, lookups=True)
class RouteFilter:
    name: auto
    description: auto
    domain_name: auto
    is_active: auto
    is_tracked: auto

    AND: Optional[list[Self]] = strawberry.UNSET
    OR: Optional[list[Self]] = strawberry.UNSET
    NOT: Optional[list[Self]] = strawberry.UNSET


@strawberry_django.order_type(Route)
class RouteOrder:
    name: auto
    description: auto
    domain_name: auto
    is_active: auto
    is_tracked: auto

