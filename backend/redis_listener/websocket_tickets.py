import json
import re
import secrets
from typing import TypedDict

import redis
import redis.asyncio as redis_async
from django.conf import settings


class WebSocketTicketPayload(TypedDict):
    user_id: int
    path: str


TICKET_KEY_PREFIX = 'websocket-ticket:'
TICKET_PATTERN = re.compile(r"^[A-Za-z0-9_-]{20,128}$")

sync_redis = redis.Redis.from_url(
    settings.WEBSOCKET_TICKET_REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)

async_redis = redis_async.Redis.from_url(
    settings.WEBSOCKET_TICKET_REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=2,
    socket_timeout=2,
)


def get_ticket_key(ticket: str) -> str:
    return f"{TICKET_KEY_PREFIX}{ticket}"


def issue_websocket_ticket(*, user_id: int, path: str) -> str:
    payload: WebSocketTicketPayload = {
        "user_id": user_id,
        "path": path,
    }

    serialized_payload = json.dumps(payload)

    for _ in range(3):
        ticket = secrets.token_urlsafe(32)

        was_created = sync_redis.set(
            get_ticket_key(ticket),
            serialized_payload,
            ex=settings.WEBSOCKET_TICKET_TTL_SECONDS,
            nx=True,
        )

        if was_created:
            return ticket

    raise RuntimeError(
        "Could not generate a unique WebSocket ticket. "
    )


async def consume_websocket_ticket(ticket: str) -> WebSocketTicketPayload | None:
    if not TICKET_PATTERN.fullmatch(ticket):
        return None

    raw_payload = await async_redis.get(get_ticket_key(ticket))

    if raw_payload is None:
        return None

    try:
        payload = json.loads(raw_payload)
    except (TypeError, json.JSONDecodeError):
        return None

    user_id = payload.get("user_id")
    path = payload.get("path")

    if not isinstance(user_id, int):
        return None

    if not isinstance(path, str):
        return None

    return {'user_id': user_id, 'path': path}
