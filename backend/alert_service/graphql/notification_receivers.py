import strawberry
import strawberry_django
from strawberry import auto

from typing_extensions import Self

from django.db.models import Q
from django.db import transaction
from django.core.exceptions import ValidationError

from graphql import GraphQLError

from typing import Optional
import datetime

from .issue_types import IssueTypeFilter, IssueTypeOrder
from ..models import NotificationReceiver, IssueType
from ..permissions import IsAuthenticated, CanDeleteMessages
from .routes import RouteFilter, RouteOrder, RouteType
from .common import Page

from redis_listener.live_updates import publish_live_update_on_commit


@strawberry_django.type(NotificationReceiver)
class NotificationReceiverType:
    id: strawberry.ID
    domain_name: Optional[str]
    email: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    route: Optional[RouteType]
    issue_type: Optional[IssueType]


@strawberry_django.filter_type(NotificationReceiver, lookups=True)
class NotificationReceiverFilter:
    domain_name: auto
    email: auto
    created_at: auto
    updated_at: auto

    route: Optional[RouteFilter]
    issue_type: Optional[IssueTypeFilter]

    AND: Optional[list[Self]] = strawberry.UNSET
    OR: Optional[list[Self]] = strawberry.UNSET
    NOT: Optional[list[Self]] = strawberry.UNSET



@strawberry_django.order_type(IssueType)
class IssueTypeOrder:
    domain_name: auto
    email: auto
    created_at: auto
    updated_at: auto

    route: Optional[RouteOrder]
    issue_type: Optional[IssueTypeOrder]


@strawberry.input
class IssueTypeInput:
    id: strawberry.ID
    domain_name: strawberry.Maybe[str | None]
    email: str
    route: Optional[RouteType | None]
    issue_type: Optional[IssueType | None]


@strawberry.type
class NotificationReceiverQuery:
    @strawberry.field(permission_classes=[IsAuthenticated])
    def notification_receivers_page(
            self,
            filters: Optional[IssueTypeFilter] = None,
            search: Optional[str] = None,
            order: Optional[IssueTypeOrder] = None,
            page: int = 1,
            size: int = 10,
    ) -> Page[NotificationReceiver]:

        queryset = NotificationReceiver.objects.all().select_related(["route", "type"])

        if filters:
            queryset = strawberry_django.filters.apply(filters, queryset)

        if search and search.strip():
            search_query = search.strip()
            queryset = queryset.filter(
                Q(domain_name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(route__name__icontains=search_query) |
                Q(issue_type__code__icontains=search_query)
            )

        if order:
            queryset = strawberry_django.ordering.apply(order, queryset)

        total_count = queryset.count()

        start = (page - 1) * size
        end = start + size
        paginated_queryset = queryset[start:end]

        return Page(
            count=total_count,
            results=list(paginated_queryset)
        )

