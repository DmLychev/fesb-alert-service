import json
import logging
import os

import redis.asyncio as redis
from redis.exceptions import RedisError

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL")

if REDIS_URL is None:
    raise ValueError(
        "REDIS_URL environment variable not set"
    )

redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True,
)


async def publish_event(
        channel: str,
        payload: dict,
) -> None:
    try:
        await redis_client.publish(
            channel,
            json.dumps(payload),
        )

        logger.debug(
            'В канале "%s" опубликовано сообщение: %s',
            channel,
            payload,
        )

    except RedisError:
        logger.exception(
            "Не удалось опубликовать Redis event: %s",
            payload,
        )


async def publish_new_messages(
        count: int,
        buckets: list[dict],
) -> None:
    await publish_event(
        channel="messages",
        payload={
            "type": "messages_created",
            "count": count,
            "buckets": buckets,
        },
    )


async def publish_updated_messages(
        ids: list[int],
        status_buckets: list[dict] | None = None,
) -> None:
    if not ids:
        return

    payload = {
        "type": "messages_updated",
        "ids": ids,
    }

    if status_buckets:
        payload["status_buckets"] = status_buckets

    await publish_event(
        channel="messages",
        payload=payload,
    )


async def publish_issue_created(
        *,
        issue_id: int,
        type_code: int,
        route_id: str | None,
        domain_name: str | None,
        created_at: str,
) -> None:
    await publish_event(
        channel="issues",
        payload={
            "type": "issues_created",
            "id": issue_id,
            "type_code": type_code,
            "route_id": route_id,
            "domain_name": domain_name,
            "created_at": created_at,
        },
    )


async def publish_updated_issues(
        ids: list[int],
        *,
        active_delta: int | None = None,
) -> None:
    if not ids:
        return

    payload = {
        "type": "issues_updated",
        "ids": ids,
    }

    if active_delta is not None:
        payload["active_delta"] = active_delta

    await publish_event(
        channel="issues",
        payload=payload,
    )


async def publish_request_created(
        *,
        request_id: int,
        request_type: int,
        is_successful: bool,
        created_at: str,
) -> None:
    await publish_event(
        channel="requests",
        payload={
            "type": "requests_created",
            "id": request_id,
            "request_type": request_type,
            "is_successful": is_successful,
            "created_at": created_at,
        },
    )


async def publish_updated_requests(request_ids: list[int]) -> None:
    if not request_ids:
        return

    await publish_event(channel="requests", payload={"type": "requests_updated", "ids": request_ids})
