import datetime
from typing import Optional

import strawberry
import strawberry_django
from strawberry import auto
from typing_extensions import Self

from django.db.models import Q

from ..models import (
    FesbRequest as FesbRequestModel,
    FesbRequestType as FesbRequestTypeModel,
)
from ..permissions import IsAuthenticated
from .common import Page


@strawberry_django.type(FesbRequestTypeModel)
class FesbRequestTypeType:
    id: strawberry.ID
    title: str


@strawberry_django.filter_type(
    FesbRequestTypeModel,
    lookups=True,
)
class FesbRequestTypeFilter:
    title: auto

    AND: Optional[list[Self]] = strawberry.UNSET
    OR: Optional[list[Self]] = strawberry.UNSET
    NOT: Optional[list[Self]] = strawberry.UNSET


@strawberry_django.order_type(
    FesbRequestTypeModel,
)
class FesbRequestTypeOrder:
    title: auto


@strawberry_django.type(FesbRequestModel)
class FesbRequestType:
    id: strawberry.ID

    is_successful: bool
    details: Optional[str]
    warning_level: Optional[int]

    created_at: datetime.datetime
    updated_at: datetime.datetime

    type: FesbRequestTypeType


@strawberry_django.filter_type(
    FesbRequestModel,
    lookups=True,
)
class FesbRequestFilter:
    is_successful: auto
    details: auto
    warning_level: auto
    created_at: auto
    updated_at: auto

    type: Optional[FesbRequestTypeFilter]

    AND: Optional[list[Self]] = strawberry.UNSET
    OR: Optional[list[Self]] = strawberry.UNSET
    NOT: Optional[list[Self]] = strawberry.UNSET


@strawberry_django.order_type(
    FesbRequestModel,
)
class FesbRequestOrder:
    is_successful: auto
    details: auto
    warning_level: auto
    created_at: auto
    updated_at: auto

    type: Optional[FesbRequestTypeOrder]


@strawberry.type
class FesbRequestQuery:

    @strawberry.field(
        permission_classes=[IsAuthenticated]
    )
    def fesb_requests_page(
        self,
        filters: Optional[FesbRequestFilter] = None,
        search: Optional[str] = None,
        order: Optional[FesbRequestOrder] = None,
        page: int = 1,
        size: int = 10,
    ) -> Page[FesbRequestType]:

        queryset = (
            FesbRequestModel.objects
            .all()
            .select_related("type")
        )

        if filters:
            queryset = strawberry_django.filters.apply(
                filters,
                queryset,
            )

        if search and search.strip():
            search_query = search.strip()

            search_filter = (
                Q(
                    type__title__icontains=
                    search_query
                )
                |
                Q(
                    details__icontains=
                    search_query
                )
            )

            if search_query.lstrip("-").isdigit():
                search_filter |= Q(
                    warning_level=int(search_query)
                )

            queryset = queryset.filter(
                search_filter
            )

        if order:
            queryset = strawberry_django.ordering.apply(
                order,
                queryset,
            )

        total_count = queryset.count()

        start = (page - 1) * size
        end = start + size

        return Page(
            count=total_count,
            results=list(
                queryset[start:end]
            ),
        )
