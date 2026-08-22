import enum
from datetime import datetime, timedelta, timezone as datetime_timezone

import strawberry
from django.db.models import (
    Count,
    DateTimeField,
    DurationField,
    F,
    Func,
    Q,
    Value,
)
from django.utils import timezone
from graphql import GraphQLError

from ..models import FesbRequest, Issue, Message, Route
from ..permissions import IsAuthenticated


BUCKET_ORIGIN = datetime(
    1970,
    1,
    1,
    tzinfo=datetime_timezone.utc,
)


@strawberry.enum
class DashboardBucket(enum.Enum):
    ONE_MINUTE = "ONE_MINUTE"
    FIVE_MINUTES = "FIVE_MINUTES"
    FIFTEEN_MINUTES = "FIFTEEN_MINUTES"
    ONE_HOUR = "ONE_HOUR"
    SIX_HOURS = "SIX_HOURS"


BUCKET_DURATIONS = {
    DashboardBucket.ONE_MINUTE: timedelta(minutes=1),
    DashboardBucket.FIVE_MINUTES: timedelta(minutes=5),
    DashboardBucket.FIFTEEN_MINUTES: timedelta(minutes=15),
    DashboardBucket.ONE_HOUR: timedelta(hours=1),
    DashboardBucket.SIX_HOURS: timedelta(hours=6),
}


class DateBin(Func):
    function = "date_bin"
    output_field = DateTimeField()


@strawberry.type
class DashboardMessageBucket:
    start: datetime
    total: int
    successful: int
    failed: int


@strawberry.type
class DashboardIssueBucket:
    start: datetime
    total: int


@strawberry.type
class DashboardFesbRequestBucket:
    start: datetime
    successful: int
    failed: int


@strawberry.type
class DashboardIssueTypeStat:
    code: int
    description: str
    count: int


@strawberry.type
class DashboardRouteStat:
    route_id: str
    route_name: str
    count: int


@strawberry.type
class DashboardSnapshot:
    generated_at: datetime
    active_issues: int
    message_traffic: list[DashboardMessageBucket]
    issues_timeline: list[DashboardIssueBucket]
    issue_types: list[DashboardIssueTypeStat]
    problematic_routes: list[DashboardRouteStat]
    fesb_api_health: list[DashboardFesbRequestBucket]


def _normalize_datetime(value: datetime) -> datetime:
    if timezone.is_naive(value):
        value = timezone.make_aware(
            value,
            timezone.get_current_timezone(),
        )

    return value.astimezone(datetime_timezone.utc)


def _bucket_expression(
    field_name: str,
    duration: timedelta,
) -> DateBin:
    return DateBin(
        Value(duration, output_field=DurationField()),
        F(field_name),
        Value(BUCKET_ORIGIN, output_field=DateTimeField()),
    )


def _floor_to_bucket(
    value: datetime,
    duration: timedelta,
) -> datetime:
    value = value.astimezone(datetime_timezone.utc)

    bucket_seconds = int(duration.total_seconds())
    elapsed_seconds = int(
        (value - BUCKET_ORIGIN).total_seconds()
    )

    bucket_number = elapsed_seconds // bucket_seconds

    return BUCKET_ORIGIN + timedelta(
        seconds=bucket_number * bucket_seconds
    )


def _message_buckets(
    from_time: datetime,
    to_time: datetime,
    duration: timedelta,
) -> list[DashboardMessageBucket]:
    rows = list(
        Message.objects
        .filter(
            start_date__gte=from_time,
            start_date__lt=to_time,
        )
        .annotate(
            bucket=_bucket_expression(
                "start_date",
                duration,
            )
        )
        .values("bucket")
        .annotate(
            total=Count("id"),
            successful=Count(
                "id",
                filter=Q(status="SUCCESS"),
            ),
            failed=Count(
                "id",
                filter=Q(status="ERROR"),
            ),
        )
        .order_by("bucket")
    )

    rows_by_bucket = {
        row["bucket"]: row
        for row in rows
    }

    result: list[DashboardMessageBucket] = []

    current = _floor_to_bucket(
        from_time,
        duration,
    )

    while current < to_time:
        row = rows_by_bucket.get(current)

        result.append(
            DashboardMessageBucket(
                start=current,
                total=row["total"] if row else 0,
                successful=row["successful"] if row else 0,
                failed=row["failed"] if row else 0,
            )
        )

        current += duration

    return result


def _issue_buckets(
    from_time: datetime,
    to_time: datetime,
    duration: timedelta,
) -> list[DashboardIssueBucket]:
    rows = list(
        Issue.objects
        .filter(
            created_at__gte=from_time,
            created_at__lt=to_time,
        )
        .annotate(
            bucket=_bucket_expression(
                "created_at",
                duration,
            )
        )
        .values("bucket")
        .annotate(
            total=Count("id"),
        )
        .order_by("bucket")
    )

    rows_by_bucket = {
        row["bucket"]: row
        for row in rows
    }

    result: list[DashboardIssueBucket] = []

    current = _floor_to_bucket(
        from_time,
        duration,
    )

    while current < to_time:
        row = rows_by_bucket.get(current)

        result.append(
            DashboardIssueBucket(
                start=current,
                total=row["total"] if row else 0,
            )
        )

        current += duration

    return result


def _fesb_request_buckets(
    from_time: datetime,
    to_time: datetime,
    duration: timedelta,
) -> list[DashboardFesbRequestBucket]:
    rows = list(
        FesbRequest.objects
        .filter(
            created_at__gte=from_time,
            created_at__lt=to_time,
        )
        .annotate(
            bucket=_bucket_expression(
                "created_at",
                duration,
            )
        )
        .values("bucket")
        .annotate(
            successful=Count(
                "id",
                filter=Q(is_successful=True),
            ),
            failed=Count(
                "id",
                filter=Q(is_successful=False),
            ),
        )
        .order_by("bucket")
    )

    rows_by_bucket = {
        row["bucket"]: row
        for row in rows
    }

    result: list[DashboardFesbRequestBucket] = []

    current = _floor_to_bucket(
        from_time,
        duration,
    )

    while current < to_time:
        row = rows_by_bucket.get(current)

        result.append(
            DashboardFesbRequestBucket(
                start=current,
                successful=row["successful"] if row else 0,
                failed=row["failed"] if row else 0,
            )
        )

        current += duration

    return result


def _issue_type_stats(
    from_time: datetime,
    to_time: datetime,
) -> list[DashboardIssueTypeStat]:
    rows = (
        Issue.objects
        .filter(
            created_at__gte=from_time,
            created_at__lt=to_time,
        )
        .values(
            "type_id",
            "type__description",
        )
        .annotate(
            count=Count("id"),
        )
        .order_by("-count", "type_id")
    )

    return [
        DashboardIssueTypeStat(
            code=row["type_id"],
            description=row["type__description"],
            count=row["count"],
        )
        for row in rows
    ]


def _route_stats(
    from_time: datetime,
    to_time: datetime,
) -> list[DashboardRouteStat]:
    rows = list(
        Issue.objects
        .filter(
            created_at__gte=from_time,
            created_at__lt=to_time,
        )
        .exclude(route_id__isnull=True)
        .exclude(route_id="")
        .values("route_id")
        .annotate(
            count=Count("id"),
        )
        .order_by("-count", "route_id")
    )

    route_ids = [
        row["route_id"]
        for row in rows
    ]

    route_names = dict(
        Route.objects
        .filter(id__in=route_ids)
        .values_list("id", "name")
    )

    return [
        DashboardRouteStat(
            route_id=row["route_id"],
            route_name=route_names.get(
                row["route_id"],
                row["route_id"],
            ),
            count=row["count"],
        )
        for row in rows
    ]


@strawberry.type
class DashboardQuery:
    @strawberry.field(
        permission_classes=[IsAuthenticated]
    )
    def dashboard(
        self,
        from_time: datetime,
        to_time: datetime,
        bucket: DashboardBucket,
    ) -> DashboardSnapshot:
        from_time = _normalize_datetime(from_time)
        to_time = _normalize_datetime(to_time)

        if from_time >= to_time:
            raise GraphQLError(
                "fromTime must be earlier than toTime"
            )

        if to_time - from_time > timedelta(days=31):
            raise GraphQLError(
                "Dashboard range cannot exceed 31 days"
            )

        duration = BUCKET_DURATIONS[bucket]

        return DashboardSnapshot(
            generated_at=timezone.now(),
            active_issues=Issue.objects.filter(
                is_solved=False
            ).count(),
            message_traffic=_message_buckets(
                from_time,
                to_time,
                duration,
            ),
            issues_timeline=_issue_buckets(
                from_time,
                to_time,
                duration,
            ),
            issue_types=_issue_type_stats(
                from_time,
                to_time,
            ),
            problematic_routes=_route_stats(
                from_time,
                to_time,
            ),
            fesb_api_health=_fesb_request_buckets(
                from_time,
                to_time,
                duration,
            ),
        )