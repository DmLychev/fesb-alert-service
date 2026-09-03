import datetime
from typing import Optional

import strawberry
import strawberry_django
from strawberry import auto

from typing_extensions import Self

from django.db.models import Q
from django.db import transaction
from django.core.exceptions import ValidationError

from graphql import GraphQLError

from ..models import Issue
from .issue_types import IssueTypeType, IssueTypeFilter, IssueTypeOrder
from ..permissions import IsAuthenticated
from .common import Page

from redis_listener.live_updates import publish_live_update_on_commit


@strawberry_django.type(Issue)
class IssueType:
    id: strawberry.ID
    text: Optional[str]
    route_id: Optional[str]
    domain_name: Optional[str]
    is_notified: Optional[bool]
    is_solved: bool
    created_at: datetime.datetime
    updated_at: datetime.datetime

    type: IssueTypeType


@strawberry_django.filter_type(Issue, lookups=True)
class IssueFilter:
    text: auto
    route_id: auto
    domain_name: auto
    is_notified: auto
    is_solved: auto
    created_at: auto
    updated_at: auto

    type: Optional[IssueTypeFilter]

    AND: Optional[list[Self]] = strawberry.UNSET
    OR: Optional[list[Self]] = strawberry.UNSET
    NOT: Optional[list[Self]] = strawberry.UNSET


@strawberry_django.order_type(Issue)
class IssueOrder:
    text: auto
    route_id: auto
    domain_name: auto
    is_notified: auto
    is_solved: auto
    created_at: auto
    updated_at: auto

    type: Optional[IssueTypeOrder]


@strawberry.input
class UpdateIssueInput:
    id: strawberry.ID
    is_notified: strawberry.Maybe[Optional[bool]]
    is_solved: strawberry.Maybe[bool]


@strawberry.type
class DeleteIssuesPayload:
    deleted_count: int
    deleted_ids: list[strawberry.ID]


@strawberry.type
class IssueQuery:
    @strawberry.field(permission_classes=[IsAuthenticated])
    def issues_page(
            self,
            filters: Optional[IssueFilter] = None,
            search: Optional[str] = None,
            order: Optional[IssueOrder] = None,
            page: int = 1,
            size: int = 10,
    ) -> Page[IssueType]:

        queryset = Issue.objects.all().select_related('type')

        if filters:
            queryset = strawberry_django.filters.apply(filters, queryset)

        if search and search.strip():
            search_query = search.strip()
            queryset = queryset.filter(
                Q(text__icontains=search_query) |
                Q(route_id__icontains=search_query) |
                Q(domain_name__icontains=search_query)
            )

        if order:
            queryset = strawberry_django.ordering.apply(order, queryset)

        total_count = queryset.count()

        start = (page - 1) * size
        end = start + size
        paginated_queryset = queryset[start:end]

        return Page(
            count=total_count,
            results=list(paginated_queryset),
        )


@strawberry.type
class IssueMutation:
    @strawberry.mutation(permission_classes=[IsAuthenticated, ])
    @transaction.atomic
    def delete_issues(self, ids: list[strawberry.ID]) -> DeleteIssuesPayload:
        numeric_ids = [int(_id) for _id in ids]

        queryset = Issue.objects.filter(pk__in=numeric_ids, )

        existing_ids = list(queryset.values_list('id', flat=True))

        queryset.delete()

        return DeleteIssuesPayload(
            deleted_count=len(existing_ids),
            deleted_ids=[strawberry.ID(str(_id)) for _id in existing_ids],
        )

    @strawberry.mutation(permission_classes=[IsAuthenticated])
    @transaction.atomic
    def update_issue(self, data: UpdateIssueInput) -> IssueType:
        try:
            issue = Issue.objects.select_related('type').get(pk=data.id)
            was_solved = issue.is_solved
        except Issue.DoesNotExist as error:
            raise GraphQLError("Issue not found") from error

        changed_fields: list[str] = []
        
        if data.is_solved is not None:
            issue.is_solved = data.is_solved.value
            changed_fields.append("is_solved")
            
        if data.is_notified is not None:
            issue.is_notified = data.is_notified.value
            changed_fields.append("is_notified")

        if not changed_fields:
            return issue

        try:
            issue.full_clean()
        except ValidationError as error:
            raise GraphQLError("; ".join(error.messages)) from error

        issue.save(update_fields=[*changed_fields, "updated_at", ])

        active_delta = (
                int(was_solved)
                - int(issue.is_solved)
        )

        publish_live_update_on_commit(
            "issues_updated",
            ids=[issue.pk],
            active_delta=active_delta,
        )

        return issue
