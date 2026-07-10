import strawberry
import strawberry_django
from strawberry import auto

from typing_extensions import Self

from django.db.models import Q

from typing import List, Optional
import datetime

from .models import Message, Route


@strawberry_django.type(Route)
class RouteType:
    name: str
    description: str
    domain_name: str
    is_active: bool
    is_tracked: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime


@strawberry_django.type(Message)
class MessageType:
    id: strawberry.ID
    exchange_id: str
    request_id: Optional[str]
    error_message: Optional[str]
    update_status_attempts: int
    status: Optional[str]
    start_date: datetime.datetime
    end_date: Optional[datetime.datetime]
    warning_level: Optional[int]
    created_at: datetime.datetime
    updated_at: datetime.datetime

    route: RouteType


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


@strawberry_django.filter_type(Message, lookups=True)
class MessageFilter:
    exchange_id: auto
    request_id: auto
    error_message: auto
    update_status_attempts: auto
    status: auto
    start_date: auto
    warning_level: auto

    route: Optional[RouteFilter]

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


@strawberry_django.order_type(Message)
class MessageOrder:
    exchange_id: auto
    request_id: auto
    error_message: auto
    update_status_attempts: auto
    status: auto
    start_date: auto
    end_date: auto
    warning_level: auto
    created_at: auto
    updated_at: auto

    route: Optional[RouteOrder]


@strawberry.type
class MessagePaginationResult:
    count: int
    results: List[MessageType]


@strawberry.type
class Query:
    @strawberry.field()
    def messages_page(
            self,
            filters: Optional[MessageFilter] = None,
            search: Optional[str] = None,
            order: Optional[MessageOrder] = None,
            page: int = 1,
            size: int = 10,
    ) -> MessagePaginationResult:

        queryset = Message.objects.all().select_related('route')

        if filters:
            queryset = strawberry_django.filters.apply(filters, queryset)

        if search and search.strip():
            search_query = search.strip()
            queryset = queryset.filter(
                Q(exchange_id__icontains=search_query) |
                Q(request_id__icontains=search_query) |
                Q(error_message__icontains=search_query) |
                Q(route__name__icontains=search_query) |
                Q(route__domain_name__icontains=search_query)
            )

        if order:
            queryset = strawberry_django.ordering.apply(order, queryset)

        total_count = queryset.count()

        start = (page - 1) * size
        end = start + size
        paginated_queryset = queryset[start:end]

        return MessagePaginationResult(
            count=total_count,
            results=list(paginated_queryset)
        )


# Instantiate the execution instance for urls.py
schema = strawberry.Schema(query=Query)
