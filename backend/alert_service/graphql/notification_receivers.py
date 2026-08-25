import strawberry
import strawberry_django
from strawberry import auto

from typing_extensions import Self

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.db.models import Q

from typing import Optional
import datetime
from enum import Enum

from graphql import GraphQLError

from .issue_types import IssueTypeFilter, IssueTypeOrder, IssueTypeType
from ..models import NotificationReceiver, IssueType, Route, IssueScope
from ..permissions import IsAuthenticated, CanDeleteMessages
from .routes import RouteFilter, RouteOrder, RouteType
from .common import Page


@strawberry_django.type(NotificationReceiver)
class NotificationReceiverType:
    id: strawberry.ID
    domain_name: Optional[str]
    email: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    route: Optional[RouteType]
    issue_type: Optional[IssueTypeType]


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


@strawberry_django.order_type(NotificationReceiver)
class NotificationReceiverOrder:
    domain_name: auto
    email: auto
    created_at: auto
    updated_at: auto

    route: Optional[RouteOrder]
    issue_type: Optional[IssueTypeOrder]


@strawberry.type
class NotificationSubscriptionOptions:
    issue_types: list[IssueTypeType]
    domains: list[str]
    routes: list[RouteType]


@strawberry.enum
class NotificationScope(Enum):
    GLOBAL = "GLOBAL"
    DOMAIN = "DOMAIN"
    ROUTE = "ROUTE"


@strawberry.input
class CreateNotificationSubscriptionInput:
    email: str
    scope: NotificationScope
    issue_type_codes: list[int] = strawberry.field(default_factory=list)
    domain_names: list[str] = strawberry.field(default_factory=list)
    route_ids: list[str] = strawberry.field(default_factory=list)
    all_issue_types: bool = False


@strawberry.type
class CreateNotificationSubscriptionPayload:
    created_count: int
    skipped_duplicates: int


def validate_subscription_input(data: CreateNotificationSubscriptionInput) -> str:
    email = data.email.strip().lower()
    try:
        validate_email(email)
    except ValidationError:
        raise GraphQLError("Invalid email address.")

    if data.scope == NotificationScope.GLOBAL:
        if data.domain_names:
            raise GraphQLError("Domains cannot be specified for a global subscription.")

        if data.route_ids:
            raise GraphQLError("Routes cannot be specified for a global subscription.")

    elif data.scope == NotificationScope.DOMAIN:
        if not data.domain_names:
            raise GraphQLError("Select at least one domain.")

        if data.route_ids:
            raise GraphQLError("Routes cannot be specified for a domain subscription.")

    elif data.scope == NotificationScope.ROUTE:
        if not data.route_ids:
            raise GraphQLError("Select at least one route.")

        if data.domain_names:
            raise GraphQLError("Domains cannot be specified for a route subscription.")

    if data.all_issue_types and data.issue_type_codes:
        raise GraphQLError("Issue types cannot be specified when all issue types are selected.")

    if not data.all_issue_types and not data.issue_type_codes:
        raise GraphQLError("Select at least one issue type.")

    return email


def validate_issue_types_for_scope(issue_types: list[IssueType], scope: NotificationScope) -> None:
    allowed_scopes = {
        NotificationScope.GLOBAL: {
            IssueScope.GLOBAL,
            IssueScope.DOMAIN,
            IssueScope.ROUTE
        },
        NotificationScope.DOMAIN: {
            IssueScope.DOMAIN,
            IssueScope.ROUTE
        },
        NotificationScope.ROUTE: {
            IssueScope.ROUTE
        }
    }

    invalid_issue_types = [issue_type.code for issue_type in issue_types if
                           issue_type.scope not in allowed_scopes[scope]]

    if invalid_issue_types:
        codes = ", ".join(map(str, invalid_issue_types))

        raise GraphQLError(f"Issue types {codes} cannot be used with {scope.value.lower()} subscriptions.")


@strawberry.type
class NotificationReceiverQuery:
    @strawberry.field(permission_classes=[IsAuthenticated])
    def notification_receivers_page(
            self,
            filters: Optional[NotificationReceiverFilter] = None,
            search: Optional[str] = None,
            order: Optional[NotificationReceiverOrder] = None,
            page: int = 1,
            size: int = 10,
    ) -> Page[NotificationReceiverType]:

        queryset = NotificationReceiver.objects.all().select_related("route", "issue_type")

        if filters:
            queryset = strawberry_django.filters.apply(filters, queryset)

        if search and search.strip():
            search_query = search.strip()
            queryset = queryset.filter(
                Q(domain_name__icontains=search_query) |
                Q(email__icontains=search_query) |
                Q(route__name__icontains=search_query)
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

    @strawberry.field(permission_classes=[IsAuthenticated])
    def notification_subscription_options(self) -> NotificationSubscriptionOptions:
        issue_types= list(IssueType.objects.all().order_by("code"))
        routes = list(Route.objects.filter(is_active=True, is_tracked=True).order_by("domain_name", "name"))
        domains = list(
            Route.objects
            .filter(is_active=True, is_tracked=True)
            .exclude(domain_name__isnull=True)
            .values_list("domain_name", flat=True)
            .distinct()
            .order_by("domain_name"))

        return NotificationSubscriptionOptions(issue_types=issue_types, domains=domains, routes=routes)


@strawberry.type
class NotificationReceiverMutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated])
    @transaction.atomic
    def create_notification_subscription(self,
                                         data: CreateNotificationSubscriptionInput
                                         ) -> CreateNotificationSubscriptionPayload:
        email = validate_subscription_input(data)
        issue_types: list[IssueType] = []

        if not data.all_issue_types:
            issue_types = list(IssueType.objects.filter(code__in=data.issue_type_codes))

            if len(issue_types) != len(set(data.issue_type_codes)):
                existing_codes = {issue_type.code for issue_type in issue_types}
                missing_codes = set(data.issue_type_codes) - existing_codes

                raise GraphQLError("Unknown issue types: " + ", ".join(map(str, sorted(missing_codes))))

            validate_issue_types_for_scope(issue_types, data.scope)

        domains: list[str] = []
        routes: list[Route] = []

        if data.scope == NotificationScope.DOMAIN:
            domains = list(Route.objects
                           .filter(domain_name__in=data.domain_names, is_active=True, is_tracked=True)
                           .values_list("domain_name", flat=True)
                           .distinct())
            missing_domains = set(data.domain_names) - set(domains)

            if missing_domains:
                raise GraphQLError("Unknown or untracked domains: " + ", ".join(sorted(missing_domains)))

        elif data.scope == NotificationScope.ROUTE:
            routes = list(Route.objects.filter(id__in=data.route_ids, is_active=True, is_tracked=True))
            existing_route_ids = {route.id for route in routes}
            missing_route_ids = set(data.route_ids) - existing_route_ids

            if missing_route_ids:
                raise GraphQLError("Unknown or untracked routes: " + ", ".join(sorted(missing_route_ids)))

        created_count = 0
        skipped_duplicates = 0

        def create_rule(*, issue_type: IssueType | None = None, domain_name: str | None = None,
                        route: Route | None = None) -> None:
            nonlocal created_count
            nonlocal skipped_duplicates

            _, created = NotificationReceiver.objects.get_or_create(
                email=email, issue_type=issue_type, domain_name=domain_name, route=route
            )

            if created:
                created_count += 1
            else:
                skipped_duplicates += 1

        selected_issue_types: list[IssueType | None]

        if data.all_issue_types:
            selected_issue_types = [None]
        else:
            selected_issue_types = issue_types

        if data.scope == NotificationScope.GLOBAL:
            for issue_type in selected_issue_types:
                create_rule(issue_type=issue_type)

        elif data.scope == NotificationScope.DOMAIN:
            for domain_name in domains:
                for issue_type in selected_issue_types:
                    create_rule(issue_type=issue_type, domain_name=domain_name)

        elif data.scope == NotificationScope.ROUTE:
            for route in routes:
                for issue_type in selected_issue_types:
                    create_rule(issue_type=issue_type, route=route)

        return CreateNotificationSubscriptionPayload(created_count=created_count, skipped_duplicates=skipped_duplicates)
